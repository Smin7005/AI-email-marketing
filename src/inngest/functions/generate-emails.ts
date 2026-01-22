import { inngest } from '@/lib/inngest/client';
import { getCompanyDbClient } from '@/lib/db/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmails = inngest.createFunction(
  {
    id: 'generate-emails',
    name: 'Generate Campaign Emails',
  },
  {
    event: 'campaign/generate-emails',
  },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;
    const supabase = getCompanyDbClient();

    console.log(`Starting email generation for campaign ${campaignId}`);

    // Step 1: Fetch campaign details using Supabase
    const campaignData = await step.run('fetch-campaign', async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, subject, service_description, sender_name, sender_email, tone')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        throw new Error(`Campaign ${campaignId} not found: ${error?.message || 'Unknown error'}`);
      }

      return data;
    });

    console.log(`Campaign data fetched:`, {
      id: campaignData.id,
      name: campaignData.name,
      tone: campaignData.tone,
    });

    // Step 2: Update campaign status to 'generating'
    await step.run('update-status-generating', async () => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Failed to update campaign status:', error);
      }
    });

    // Step 3: Fetch campaign items with business details
    const itemsData = await step.run('fetch-items', async () => {
      // First get pending campaign items
      const { data: campaignItems, error: itemsError } = await supabase
        .from('campaign_items')
        .select('id, business_id, metadata, status')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

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
          .select('listing_id, company_name, email, category_name, description_short, address_suburb')
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
          businessCity: business?.address_suburb || 'Australia',
          businessEmail: business?.email || metadata?.email,
        };
      });
    });

    console.log(`Found ${itemsData.length} items to process`);

    if (itemsData.length === 0) {
      // No items to process - mark campaign as ready
      await step.run('mark-campaign-ready-no-items', async () => {
        await supabase
          .from('campaigns')
          .update({ status: 'ready', updated_at: new Date().toISOString() })
          .eq('id', campaignId)
          .eq('organization_id', organizationId);
      });

      return {
        success: true,
        campaignId,
        totalItems: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    // Step 4: Generate emails for each item
    const results = await step.run('generate-emails', async () => {
      const generatedEmails = [];

      for (const item of itemsData) {
        const recipientName = item.businessName;
        const industry = item.businessIndustry;
        const city = item.businessCity;
        const description = item.businessDescription || 'local business';

        console.log(`Generating email for ${recipientName} (${industry})`);

        // Use campaign name as sender name for email signature
        const senderName = campaignData.name || campaignData.sender_name || 'Your Team';

        const prompt = `Write a personalized cold email for a B2B outreach campaign.

Campaign Details:
- Service Description: ${campaignData.service_description}
- Email Tone: ${campaignData.tone}
- Sender Name: ${senderName}

Target Business:
- Name: ${recipientName}
- Industry: ${industry}
- City: ${city}
- Description: ${description}

STRICT Instructions:
1. First line MUST be ONLY the subject (no "Subject:" prefix)
2. Second line MUST be empty
3. Write 2-3 SHORT paragraphs (each 2-3 sentences max)
4. Separate each paragraph with a blank line
5. Keep the tone ${campaignData.tone}
6. Include a clear call-to-action
7. End with blank line, then "Best regards," then sender name on new line
8. NEVER use placeholders like [Your Name], [Your Company], [Contact Info], [Recipient's Name]
9. Use the actual business name "${recipientName}" when addressing them
10. Total length: 100-150 words maximum

EXACT Output format (follow this exactly):
Compelling Subject Line Here

Dear ${recipientName} Team,

First paragraph with greeting and hook.

Second paragraph with value proposition.

Third paragraph with call-to-action.

Best regards,
${senderName}`;

        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
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
            max_tokens: 300,
          });

          const generatedText = completion.choices[0]?.message?.content?.trim();

          console.log(`[GENERATE EMAILS] Generated text for ${recipientName}:`, {
            length: generatedText?.length || 0,
            preview: generatedText?.substring(0, 100) || 'EMPTY',
          });

          if (!generatedText) {
            throw new Error('No content generated from OpenAI');
          }

          // Extract subject line (first line) and body (rest)
          const lines = generatedText.split('\n');
          let emailSubject = 'Your Business Opportunity';
          let emailBody = generatedText;

          // First line is the subject (may or may not have "Subject:" prefix)
          if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Remove "Subject:" prefix if present
            emailSubject = firstLine.replace(/^Subject:\s*/i, '').trim();
            // Body is everything after the first line (skip empty lines at start)
            emailBody = lines.slice(1).join('\n').trim();
          }

          // Remove any remaining placeholders
          emailBody = emailBody
            .replace(/\[Your Name\]/gi, senderName)
            .replace(/\[Your Company\]/gi, senderName)
            .replace(/\[Your Company Name\]/gi, senderName)
            .replace(/\[Your Phone Number\]/gi, '')
            .replace(/\[Your Email Address\]/gi, '')
            .replace(/\[Your Email\]/gi, '')
            .replace(/\[Your Contact Information\]/gi, '')
            .replace(/\[Contact Info\]/gi, '')
            .replace(/\[Your Position\]/gi, '')
            .replace(/\[Your Website\]/gi, '')
            .replace(/\[Recipient's Name\]/gi, recipientName)
            .trim();

          // Convert plain text to HTML with proper paragraph formatting
          const paragraphs = emailBody.split(/\n\s*\n/).filter(p => p.trim());
          const htmlBody = paragraphs
            .map(p => `<p style="margin-bottom: 16px;">${p.replace(/\n/g, '<br>')}</p>`)
            .join('\n');

          console.log(`[GENERATE EMAILS] Extracted subject: "${emailSubject}"`);

          // Update campaign item with generated content using Supabase
          const { error: updateError } = await supabase
            .from('campaign_items')
            .update({
              email_subject: emailSubject,
              email_content: htmlBody,
              status: 'generated',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.itemId);

          if (updateError) {
            throw new Error(`Failed to update item: ${updateError.message}`);
          }

          console.log(`✓ Generated email for ${recipientName} (${generatedText.length} chars)`);

          generatedEmails.push({
            itemId: item.itemId,
            businessName: recipientName,
            success: true,
          });
        } catch (error) {
          console.error(`✗ Failed to generate email for ${recipientName}:`, error);

          // Mark as failed using Supabase
          await supabase
            .from('campaign_items')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Generation failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.itemId);

          generatedEmails.push({
            itemId: item.itemId,
            businessName: recipientName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return generatedEmails;
    });

    // Step 5: Update campaign status and counts
    await step.run('update-campaign-final', async () => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      // Check if there are more pending items
      const { count: remainingCount } = await supabase
        .from('campaign_items')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      // Get total generated count
      const { count: generatedCount } = await supabase
        .from('campaign_items')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'generated');

      const newStatus = (remainingCount || 0) > 0 ? 'generating' : 'ready';

      await supabase
        .from('campaigns')
        .update({
          status: newStatus,
          generated_count: generatedCount || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .eq('organization_id', organizationId);

      // If there are more items, schedule another batch
      if ((remainingCount || 0) > 0) {
        console.log(`${remainingCount} items remaining, scheduling next batch...`);
      }
    });

    console.log(`Email generation complete! Results:`, results);

    return {
      success: true,
      campaignId,
      totalItems: itemsData.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
);

export const sendEmails = inngest.createFunction(
  {
    id: 'send-emails',
    name: 'Send Campaign Emails',
  },
  {
    event: 'campaign/send-emails',
  },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;
    const supabase = getCompanyDbClient();

    console.log(`Sending emails for campaign ${campaignId}`);

    // Fetch campaign items with generated content
    const items = await step.run('fetch-generated-items', async () => {
      const { data, error } = await supabase
        .from('campaign_items')
        .select('id, business_id, email_content, email_subject, metadata')
        .eq('campaign_id', campaignId)
        .eq('status', 'generated');

      if (error) {
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      return data || [];
    });

    console.log(`Found ${items.length} emails to send`);

    // TODO: Implement actual email sending logic via Resend/SES
    // For now, just mark as sent for testing

    return {
      success: true,
      campaignId,
      itemsToSend: items.length,
    };
  }
);
