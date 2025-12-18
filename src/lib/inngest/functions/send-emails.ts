import { inngest } from '../client';
import { db } from '../../db';
import { campaigns, campaignItems, businesses, suppressionList } from '../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { withOrganization } from '../../db/tenant';
import { emailService } from '../../services/email';
import { quotaService } from '../../services/quota';
import { suppressionService } from '../../services/suppression';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY || 'fallback-secret';

/**
 * Generate unsubscribe token
 */
function generateUnsubscribeToken(organizationId: string, campaignItemId: number): string {
  return jwt.sign(
    {
      organizationId,
      campaignItemId,
      type: 'unsubscribe',
    },
    JWT_SECRET,
    { expiresIn: '1y' }
  );
}

/**
 * Send campaign emails in batches with rate limiting
 */
export const sendCampaignBatch = inngest.createFunction(
  {
    id: 'send-campaign-batch',
    name: 'Send Campaign Email Batch',
    retries: 3,
    concurrency: 2, // Limit concurrent sending
  },
  { event: 'campaign/send-batch' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;

    // Fetch campaign details
    const campaign = await step.run('fetch-campaign', async () => {
      const result = await db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          subject: campaigns.subject,
          senderName: campaigns.senderName,
          senderEmail: campaigns.senderEmail,
          status: campaigns.status,
          sentCount: campaigns.sentCount,
          totalRecipients: campaigns.totalRecipients,
        })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            withOrganization(organizationId),
            eq(campaigns.status, 'ready')
          )
        )
        .limit(1);

      return result[0];
    });

    if (!campaign) {
      throw new Error('Campaign not found or not ready');
    }

    // Check quota before sending
    const quotaCheck = await step.run('check-quota', async () => {
      return quotaService.checkQuota(organizationId, 14); // Max batch size
    });

    if (!quotaCheck.allowed) {
      throw new Error(`Quota exceeded: ${quotaCheck.reason}`);
    }

    // Update campaign status to sending
    await step.run('update-campaign-status', async () => {
      await db
        .update(campaigns)
        .set({ status: 'sending' })
        .where(
          and(
            eq(campaigns.id, campaignId),
            withOrganization(organizationId)
          )
        );
    });

    // Fetch next batch of emails to send (limit 10 for rate limiting)
    const emails = await step.run('fetch-emails-batch', async () => {
      return db
        .select({
          itemId: campaignItems.id,
          emailSubject: campaignItems.emailSubject,
          emailContent: campaignItems.emailContent,
          businessId: businesses.id,
          businessName: businesses.name,
          businessEmail: businesses.email,
        })
        .from(campaignItems)
        .innerJoin(businesses, eq(businesses.id, campaignItems.businessId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'generated')
          )
        )
        .limit(10);
    });

    if (emails.length === 0) {
      // Campaign complete
      await step.run('mark-campaign-sent', async () => {
        await db
          .update(campaigns)
          .set({
            status: 'sent',
            sentCount: campaign.sentCount + campaign.totalRecipients,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(campaigns.id, campaignId),
              withOrganization(organizationId)
            )
          );
      });

      return { sent: 0, complete: true };
    }

    // Check suppression list and prepare emails for sending
    const emailsToSend = await step.run('check-suppression-and-prepare', async () => {
      const emailAddresses = emails.map(e => e.businessEmail);
      const suppressed = await suppressionService.getSuppressedEmails(organizationId, emailAddresses);
      const suppressedSet = new Set(suppressed);

      return emails.map(email => ({
        ...email,
        isSuppressed: suppressedSet.has(email.businessEmail),
      }));
    });

    // Send emails with rate limiting
    const results = await step.run('send-emails', async () => {
      const promises = emailsToSend.map(async (email) => {
        if (email.isSuppressed) {
          return {
            itemId: email.itemId,
            status: 'suppressed',
            messageId: null,
            error: null,
          };
        }

        try {
          // Generate unique unsubscribe link
          const unsubscribeToken = generateUnsubscribeToken(
            organizationId,
            email.itemId
          );

          // Add unsubscribe link to email
          const unsubscribeUrl = `${process.env.APP_URL}/unsubscribe/${unsubscribeToken}`;
          const emailContent = emailService.addUnsubscribeToEmail(
            email.emailContent || '',
            unsubscribeUrl
          );

          // Send via Resend
          const result = await emailService.sendEmail({
            from: `${campaign.senderName} <${campaign.senderEmail}>`,
            to: email.businessEmail,
            subject: email.emailSubject || 'No Subject',
            html: emailContent,
            tags: [
              { name: 'campaign', value: campaign.id.toString() },
              { name: 'organization', value: organizationId },
            ],
          });

          if (result.error) {
            throw new Error(result.error);
          }

          return {
            itemId: email.itemId,
            status: 'sent',
            messageId: result.id,
            error: null,
          };
        } catch (error) {
          console.error(`Failed to send email to ${email.businessEmail}:`, error);
          return {
            itemId: email.itemId,
            status: 'failed',
            messageId: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      return await Promise.all(promises);
    });

    // Update database with send results
    await step.run('update-send-results', async () => {
      const updates = results.map(result => {
        if (result.status === 'sent') {
          return db
            .update(campaignItems)
            .set({
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, result.itemId));
        } else if (result.status === 'suppressed') {
          return db
            .update(campaignItems)
            .set({
              status: 'suppressed',
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, result.itemId));
        } else {
          return db
            .update(campaignItems)
            .set({
              status: 'failed',
              errorMessage: result.error,
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, result.itemId));
        }
      });

      await Promise.all(updates);
    });

    // Update campaign sent count and quota
    const sentCount = results.filter(r => r.status === 'sent').length;

    await step.run('update-sent-count', async () => {
      // Update campaign
      await db
        .update(campaigns)
        .set({
          sentCount: campaign.sentCount + sentCount,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(campaigns.id, campaignId),
            withOrganization(organizationId)
          )
        );

      // Update quota
      if (sentCount > 0) {
        await quotaService.incrementEmailCount(organizationId, sentCount);
      }
    });

    // Wait 1 second before next batch (rate limiting)
    await step.sleep('rate-limit-wait', '1s');

    // Schedule next batch
    await step.sendEvent('schedule-next-batch', {
      name: 'campaign/send-batch',
      data: { campaignId, organizationId },
    });

    return {
      sent: sentCount,
      suppressed: results.filter(r => r.status === 'suppressed').length,
      failed: results.filter(r => r.status === 'failed').length,
      complete: false
    };
  }
);