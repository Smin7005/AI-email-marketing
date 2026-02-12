import { inngest } from '../client';
import { getCompanyDbClient } from '../../db/supabase';

// DMXAPI Configuration
const DMXAPI_URL = 'https://www.dmxapi.cn/v1/chat/completions';
const DMXAPI_MODEL = 'DeepSeek-V3.2';

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
  const toneInstructions: Record<string, string> = {
    professional: 'Write in a professional, business-like tone.',
    friendly: 'Write in a friendly, conversational tone.',
    casual: 'Write in a casual, relaxed tone.',
    formal: 'Write in a formal, respectful tone.',
    enthusiastic: 'Write in an enthusiastic, energetic tone.',
  };

  return `You are a marketing expert writing a cold email to promote services to Australian businesses.

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Industry: ${businessIndustry}
- Description: ${businessDescription || 'Local service provider'}

YOUR SERVICE:
- Description: ${serviceDescription}
- Sender Name: ${senderName}

TONE: ${toneInstructions[tone] || toneInstructions.professional}

TASK: Write a personalized cold email that:
1. Opens with a compelling subject line
2. Shows you understand their business and industry
3. Clearly explains how your service can help them
4. Includes a soft call-to-action
5. Keeps it concise (around 400 words)
6. Avoids spam trigger words

FORMAT YOUR RESPONSE AS:
Subject: [Your compelling subject line]

[Email body paragraph 1 - Personalization and hook]

[Email body paragraph 2 - Value proposition]

[Email body paragraph 3 - Soft CTA and close]`;
}

/**
 * Generate email with retry logic for DMXAPI (DeepSeek-V3.2)
 */
async function generateEmailWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<{ subject: string; content: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(DMXAPI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DMXAPI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DMXAPI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert B2B copywriter specializing in cold outreach emails.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DMXAPI request failed: ${response.status} - ${errorText}`);
      }

      const completion = await response.json();
      const content = completion.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content generated from DMXAPI');
      }

      // Parse subject and body from response
      const lines = content.split('\n');
      let subject = '';
      let bodyStart = 0;

      // Find subject line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().startsWith('subject:')) {
          subject = lines[i].replace(/^subject:\s*/i, '').trim();
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
        throw new Error('Failed to parse generated email - missing subject or body');
      }

      return { subject, content: body };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`DMXAPI attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // Don't retry on authentication/authorization errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to generate email after all retries');
}

/**
 * Batch generate personalized emails for campaign
 * Uses Supabase client for database operations
 */
export const batchGenerateEmails = inngest.createFunction(
  {
    id: 'batch-generate-emails',
    name: 'Batch Generate Campaign Emails',
    retries: 3,
    concurrency: 5,
  },
  { event: 'campaign/generate-emails' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;
    const supabase = getCompanyDbClient();

    // Update campaign status to generating
    await step.run('update-campaign-status', async () => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Failed to update campaign status:', error);
        throw new Error(`Failed to update campaign status: ${error.message}`);
      }
    });

    // Fetch campaign details first
    const campaign = await step.run('fetch-campaign', async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, subject, service_description, sender_name, tone')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        throw new Error(`Campaign not found: ${error?.message || 'Unknown error'}`);
      }

      return data;
    });

    // Fetch pending campaign items with business details (batch of 20)
    const items = await step.run('fetch-campaign-items', async () => {
      // First get pending campaign items
      const { data: campaignItems, error: itemsError } = await supabase
        .from('campaign_items')
        .select('id, business_id, metadata')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .limit(20);

      if (itemsError) {
        throw new Error(`Failed to fetch campaign items: ${itemsError.message}`);
      }

      if (!campaignItems || campaignItems.length === 0) {
        return [];
      }

      // Get business details for items with business_id
      const businessIds = campaignItems
        .filter(item => item.business_id)
        .map(item => item.business_id);

      let businessMap: Record<number, any> = {};

      if (businessIds.length > 0) {
        const { data: businesses, error: businessError } = await supabase
          .from('rawdata_yellowpage_new')
          .select('listing_id, company_name, email, category_name, description_short')
          .in('listing_id', businessIds);

        if (businessError) {
          console.error('Failed to fetch businesses:', businessError);
        } else if (businesses) {
          businessMap = businesses.reduce((acc, b) => {
            acc[b.listing_id] = b;
            return acc;
          }, {} as Record<number, any>);
        }
      }

      // Map items with business details
      return campaignItems.map(item => {
        const business = item.business_id ? businessMap[item.business_id] : null;
        const metadata = item.metadata as { name?: string; email?: string } | null;

        return {
          itemId: item.id,
          businessName: business?.company_name || metadata?.name || 'Valued Customer',
          businessDescription: business?.description_short || null,
          businessIndustry: business?.category_name || 'Business Services',
          businessEmail: business?.email || metadata?.email,
          campaignServiceDescription: campaign.service_description,
          campaignSenderName: campaign.name,
          campaignTone: campaign.tone,
        };
      });
    });

    if (items.length === 0) {
      // No more items to process - mark campaign as ready
      await step.run('mark-campaign-ready', async () => {
        const { error } = await supabase
          .from('campaigns')
          .update({ status: 'ready', updated_at: new Date().toISOString() })
          .eq('id', campaignId)
          .eq('organization_id', organizationId);

        if (error) {
          console.error('Failed to mark campaign ready:', error);
        }
      });

      return { generated: 0, complete: true };
    }

    // Generate emails with improved error handling
    const generated = await step.run('generate-emails', async () => {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          try {
            const prompt = createEmailPrompt({
              businessName: item.businessName,
              businessDescription: item.businessDescription || undefined,
              businessIndustry: item.businessIndustry,
              serviceDescription: item.campaignServiceDescription,
              senderName: item.campaignSenderName,
              tone: item.campaignTone,
            });

            const { subject, content } = await generateEmailWithRetry(prompt);

            // Update campaign item with generated content
            const { error } = await supabase
              .from('campaign_items')
              .update({
                email_subject: subject,
                email_content: content,
                status: 'generated',
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.itemId);

            if (error) {
              throw new Error(`Failed to update item: ${error.message}`);
            }

            return { itemId: item.itemId, success: true };
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to generate email for ${item.businessName}:`, errorMsg);

            // Mark item as failed
            await supabase
              .from('campaign_items')
              .update({
                status: 'failed',
                error_message: errorMsg,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.itemId);

            return { itemId: item.itemId, success: false, error: errorMsg };
          }
        })
      );

      return results.filter(
        r => r.status === 'fulfilled' && r.value.success
      ).length;
    });

    // Check if more items to process
    const remaining = await step.run('check-remaining', async () => {
      const { count, error } = await supabase
        .from('campaign_items')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      if (error) {
        console.error('Failed to check remaining items:', error);
        return 0;
      }

      return count || 0;
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
        // Update generated count
        const { count: generatedCount } = await supabase
          .from('campaign_items')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'generated');

        await supabase
          .from('campaigns')
          .update({
            status: 'ready',
            generated_count: generatedCount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId)
          .eq('organization_id', organizationId);
      });
    }

    return {
      generated,
      remaining,
      complete: remaining === 0,
    };
  }
);
