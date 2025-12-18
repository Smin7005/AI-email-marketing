import { inngest } from '../client';
import { db } from '../../db';
import { campaigns, campaignItems, businesses } from '../../db/schema';
import { and, eq, sql, count } from 'drizzle-orm';
import { withOrganization } from '../../db/tenant';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create email generation prompt
 */
function createEmailPrompt({
  businessName,
  businessDescription,
  businessIndustry,
  serviceDescription,
  senderName,
  tone = 'professional',
}: {
  businessName: string;
  businessDescription?: string;
  businessIndustry: string;
  serviceDescription: string;
  senderName: string;
  tone?: string;
}) {
  const toneInstructions = {
    professional: 'Write in a professional, business-like tone.',
    friendly: 'Write in a friendly, conversational tone.',
    casual: 'Write in a casual, relaxed tone.',
  };

  return `You are a marketing expert writing a cold email to promote services to Australian businesses.

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Industry: ${businessIndustry}
- Description: ${businessDescription || 'Local service provider'}

YOUR SERVICE:
- Description: ${serviceDescription}
- Sender Name: ${senderName}

TONE: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}

TASK: Write a personalized cold email that:
1. Opens with a compelling subject line
2. Shows you understand their business and industry
3. Clearly explains how your service can help them
4. Includes a soft call-to-action
5. Keeps it concise (under 200 words)
6. Avoids spam trigger words

FORMAT YOUR RESPONSE AS:
Subject: [Your compelling subject line]

[Email body paragraph 1 - Personalization and hook]

[Email body paragraph 2 - Value proposition]

[Email body paragraph 3 - Soft CTA and close]`;
}

/**
 * Batch generate personalized emails for campaign
 */
export const batchGenerateEmails = inngest.createFunction(
  {
    id: 'batch-generate-emails',
    name: 'Batch Generate Campaign Emails',
    retries: 3,
    concurrency: 5, // Limit concurrent executions
  },
  { event: 'campaign/generate-emails' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;

    // Update campaign status to generating
    await step.run('update-campaign-status', async () => {
      await db
        .update(campaigns)
        .set({ status: 'generating' })
        .where(
          and(
            eq(campaigns.id, campaignId),
            withOrganization(organizationId)
          )
        );
    });

    // Fetch campaign and items in batches of 20
    const items = await step.run('fetch-campaign-items', async () => {
      return db
        .select({
          itemId: campaignItems.id,
          businessName: businesses.name,
          businessDescription: businesses.description,
          businessIndustry: businesses.industry,
          businessEmail: businesses.email,
          campaignName: campaigns.name,
          campaignSubject: campaigns.subject,
          campaignServiceDescription: campaigns.serviceDescription,
          campaignSenderName: campaigns.senderName,
          campaignTone: campaigns.tone,
        })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .innerJoin(businesses, eq(businesses.id, campaignItems.businessId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'pending'),
            withOrganization(organizationId)
          )
        )
        .limit(20);
    });

    if (items.length === 0) {
      // No more items to process
      await step.run('mark-campaign-ready', async () => {
        await db
          .update(campaigns)
          .set({ status: 'ready' })
          .where(
            and(
              eq(campaigns.id, campaignId),
              withOrganization(organizationId)
            )
          );
      });

      return { generated: 0, complete: true };
    }

    // Generate emails in parallel (max 10 concurrent)
    const generated = await step.run('generate-emails', async () => {
      const promises = items.map(async (item) => {
        try {
          const prompt = createEmailPrompt({
            businessName: item.businessName,
            businessDescription: item.businessDescription || undefined,
            businessIndustry: item.businessIndustry,
            serviceDescription: item.campaignServiceDescription,
            senderName: item.campaignSenderName,
            tone: item.campaignTone,
          });

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error('No content generated');
          }

          // Parse subject and body from response
          const lines = content.split('\n');
          let subject = '';
          let bodyStart = 0;

          // Find subject line
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('Subject:')) {
              subject = lines[i].replace(/^Subject:\s*/i, '').trim();
              bodyStart = i + 1;
              break;
            }
          }

          // If no subject found, use first line
          if (!subject && lines.length > 0) {
            subject = lines[0].trim();
            bodyStart = 1;
          }

          const body = lines.slice(bodyStart).join('\n').trim();

          if (!subject || !body) {
            throw new Error('Failed to parse generated email');
          }

          return {
            itemId: item.itemId,
            subject,
            content: body,
            success: true,
          };
        } catch (error) {
          console.error(`Failed to generate email for ${item.businessName}:`, error);
          return {
            itemId: item.itemId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.allSettled(promises);

      // Update database with generated content
      const updates = results.map((result, index) => {
        const item = items[index];
        if (result.status === 'fulfilled' && result.value.success) {
          return db
            .update(campaignItems)
            .set({
              emailSubject: result.value.subject,
              emailContent: result.value.content,
              status: 'generated',
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, result.value.itemId));
        } else {
          const errorMsg = result.status === 'fulfilled'
            ? (result.value.error || 'Generation failed')
            : (result.reason?.error || 'Generation failed');
          return db
            .update(campaignItems)
            .set({
              status: 'failed',
              errorMessage: errorMsg,
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.itemId));
        }
      });

      await Promise.all(updates);

      return results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    });

    // Check if more items to process
    const remaining = await step.run('check-remaining', async () => {
      const result = await db
        .select({ count: count() })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'pending'),
            withOrganization(organizationId)
          )
        );
      return result[0].count;
    });

    // Schedule next batch if needed
    if (remaining > 0) {
      await step.sendEvent('schedule-next-batch', {
        name: 'campaign/generate-emails',
        data: { campaignId, organizationId },
      });
    } else {
      // All items generated - mark campaign as ready
      await step.run('mark-campaign-ready', async () => {
        await db
          .update(campaigns)
          .set({
            status: 'ready',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(campaigns.id, campaignId),
              withOrganization(organizationId)
            )
          );
      });
    }

    return {
      generated,
      remaining,
      complete: remaining === 0,
    };
  }
);