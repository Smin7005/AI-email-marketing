import { inngest } from '../client';
import { getCompanyDbClient } from '../../db/supabase';
import { emailService } from '../../services/email';
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
 * Check quota using Supabase client
 */
async function checkQuota(supabase: any, organizationId: string, requestedCount: number) {
  const DEFAULT_MONTHLY_QUOTA = 1000;

  // Get or create quota record
  let { data: quota, error } = await supabase
    .from('organization_quotas')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error || !quota) {
    // Create default quota
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const { data: newQuota, error: createError } = await supabase
      .from('organization_quotas')
      .insert({
        organization_id: organizationId,
        monthly_quota: DEFAULT_MONTHLY_QUOTA,
        monthly_used: 0,
        monthly_reset: nextMonth.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create quota record:', createError);
      return { allowed: true, canSend: requestedCount }; // Allow if we can't check
    }
    quota = newQuota;
  }

  // Check if we need to reset
  const resetDate = new Date(quota.monthly_reset);
  if (new Date() >= resetDate) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    await supabase
      .from('organization_quotas')
      .update({
        monthly_used: 0,
        monthly_reset: nextMonth.toISOString(),
      })
      .eq('id', quota.id);

    quota.monthly_used = 0;
  }

  const remaining = quota.monthly_quota - quota.monthly_used;
  const canSend = Math.min(requestedCount, remaining);

  return {
    allowed: remaining > 0,
    canSend,
    reason: remaining <= 0 ? 'Monthly quota exceeded' : undefined,
  };
}

/**
 * Get suppressed emails using Supabase client
 */
async function getSuppressedEmails(supabase: any, organizationId: string, emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const { data, error } = await supabase
    .from('suppression_list')
    .select('email')
    .eq('organization_id', organizationId)
    .in('email', emails.map(e => e.toLowerCase()));

  if (error) {
    console.error('Failed to check suppression list:', error);
    return new Set();
  }

  return new Set((data || []).map((r: { email: string }) => r.email.toLowerCase()));
}

/**
 * Increment quota usage using Supabase client
 */
async function incrementQuotaUsage(supabase: any, organizationId: string, count: number) {
  const { data: quota } = await supabase
    .from('organization_quotas')
    .select('id, monthly_used')
    .eq('organization_id', organizationId)
    .single();

  if (quota) {
    await supabase
      .from('organization_quotas')
      .update({
        monthly_used: quota.monthly_used + count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quota.id);
  }
}

/**
 * Send campaign emails in batches with rate limiting
 * Uses Supabase client for database operations
 */
export const sendCampaignBatch = inngest.createFunction(
  {
    id: 'send-campaign-batch',
    name: 'Send Campaign Email Batch',
    retries: 3,
    concurrency: 2,
  },
  { event: 'campaign/send-batch' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;
    const supabase = getCompanyDbClient();

    // Fetch campaign details
    const campaign = await step.run('fetch-campaign', async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, subject, sender_name, sender_email, status, sent_count, total_recipients')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .in('status', ['ready', 'sending'])
        .single();

      if (error || !data) {
        throw new Error(`Campaign not found or not ready: ${error?.message || 'Unknown'}`);
      }

      return data;
    });

    // Check quota before sending
    const quotaCheck = await step.run('check-quota', async () => {
      return checkQuota(supabase, organizationId, 10);
    });

    if (!quotaCheck.allowed) {
      throw new Error(`Quota exceeded: ${quotaCheck.reason}`);
    }

    // Update campaign status to sending
    await step.run('update-campaign-status', async () => {
      await supabase
        .from('campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('organization_id', organizationId);
    });

    // Fetch next batch of emails to send (limit 10 for rate limiting)
    const emails = await step.run('fetch-emails-batch', async () => {
      // Get campaign items that are generated
      const { data: items, error: itemsError } = await supabase
        .from('campaign_items')
        .select('id, email_subject, email_content, business_id, metadata')
        .eq('campaign_id', campaignId)
        .eq('status', 'generated')
        .limit(10);

      if (itemsError) {
        throw new Error(`Failed to fetch campaign items: ${itemsError.message}`);
      }

      if (!items || items.length === 0) {
        return [];
      }

      // Get business details for items with business_id
      const businessIds = items.filter(i => i.business_id).map(i => i.business_id);
      let businessMap: Record<number, any> = {};

      if (businessIds.length > 0) {
        const { data: businesses } = await supabase
          .from('rawdata_yellowpage_new')
          .select('listing_id, company_name, email')
          .in('listing_id', businessIds);

        if (businesses) {
          businessMap = businesses.reduce((acc: Record<number, any>, b: any) => {
            acc[b.listing_id] = b;
            return acc;
          }, {});
        }
      }

      // Map items with business details
      return items.map(item => {
        const business = item.business_id ? businessMap[item.business_id] : null;
        const metadata = item.metadata as { name?: string; email?: string } | null;

        return {
          itemId: item.id,
          emailSubject: item.email_subject,
          emailContent: item.email_content,
          businessId: item.business_id,
          businessName: business?.company_name || metadata?.name || 'Valued Customer',
          businessEmail: business?.email || metadata?.email,
        };
      }).filter(item => item.businessEmail); // Only include items with email
    });

    if (emails.length === 0) {
      // Campaign complete
      await step.run('mark-campaign-sent', async () => {
        // Count how many were actually sent
        const { count: sentCount } = await supabase
          .from('campaign_items')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'sent');

        await supabase
          .from('campaigns')
          .update({
            status: 'sent',
            sent_count: sentCount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId)
          .eq('organization_id', organizationId);
      });

      return { sent: 0, complete: true };
    }

    // Check suppression list
    const emailAddresses = emails.map(e => e.businessEmail).filter(Boolean) as string[];
    const suppressed = await step.run('check-suppression', async () => {
      return getSuppressedEmails(supabase, organizationId, emailAddresses);
    });

    // Send emails with rate limiting
    const results = await step.run('send-emails', async () => {
      const sendResults = await Promise.allSettled(
        emails.map(async (email) => {
          // Check if suppressed
          if (email.businessEmail && suppressed.has(email.businessEmail.toLowerCase())) {
            return {
              itemId: email.itemId,
              status: 'suppressed' as const,
              messageId: null,
              error: null,
            };
          }

          try {
            // Generate unique unsubscribe link
            const unsubscribeToken = generateUnsubscribeToken(organizationId, email.itemId);
            const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/unsubscribe/${unsubscribeToken}`;

            // Add unsubscribe link to email
            const emailContent = emailService.addUnsubscribeToEmail(
              email.emailContent || '',
              unsubscribeUrl
            );

            // Send via Resend
            const result = await emailService.sendEmail({
              from: `${campaign.sender_name} <${campaign.sender_email}>`,
              to: email.businessEmail!,
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
              status: 'sent' as const,
              messageId: result.id,
              error: null,
            };
          } catch (error) {
            console.error(`Failed to send email to ${email.businessEmail}:`, error);
            return {
              itemId: email.itemId,
              status: 'failed' as const,
              messageId: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      return sendResults.map(r => r.status === 'fulfilled' ? r.value : {
        itemId: 0,
        status: 'failed' as const,
        messageId: null,
        error: 'Promise rejected',
      });
    });

    // Update database with send results
    await step.run('update-send-results', async () => {
      for (const result of results) {
        if (result.status === 'sent') {
          await supabase
            .from('campaign_items')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              message_id: result.messageId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', result.itemId);
        } else if (result.status === 'suppressed') {
          await supabase
            .from('campaign_items')
            .update({
              status: 'suppressed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', result.itemId);
        } else {
          await supabase
            .from('campaign_items')
            .update({
              status: 'failed',
              error_message: result.error,
              updated_at: new Date().toISOString(),
            })
            .eq('id', result.itemId);
        }
      }
    });

    // Update quota
    const sentCount = results.filter(r => r.status === 'sent').length;
    if (sentCount > 0) {
      await step.run('update-quota', async () => {
        await incrementQuotaUsage(supabase, organizationId, sentCount);
      });
    }

    // Wait 1 second before next batch (rate limiting)
    await step.sleep('rate-limit-wait', '1s');

    // Check if there are more emails to send
    const { count: remainingCount } = await supabase
      .from('campaign_items')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'generated');

    if (remainingCount && remainingCount > 0) {
      // Schedule next batch
      await step.sendEvent('schedule-next-batch', {
        name: 'campaign/send-batch',
        data: { campaignId, organizationId },
      });
    } else {
      // Mark campaign as complete
      await step.run('mark-campaign-complete', async () => {
        const { count: totalSent } = await supabase
          .from('campaign_items')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'sent');

        await supabase
          .from('campaigns')
          .update({
            status: 'sent',
            sent_count: totalSent || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId)
          .eq('organization_id', organizationId);
      });
    }

    return {
      sent: sentCount,
      suppressed: results.filter(r => r.status === 'suppressed').length,
      failed: results.filter(r => r.status === 'failed').length,
      complete: !remainingCount || remainingCount === 0,
    };
  }
);
