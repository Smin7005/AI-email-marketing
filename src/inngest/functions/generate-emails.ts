import { inngest } from '@/lib/inngest/client';
import { db } from '@/lib/db';
import { campaigns, campaignItems, businesses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

    console.log(`Starting email generation for campaign ${campaignId}`);

    // Step 1: Fetch campaign details
    const campaignData = await step.run('fetch-campaign', async () => {
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.organizationId, organizationId)
          )
        )
        .limit(1);

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      return campaign;
    });

    console.log(`Campaign data fetched:`, {
      id: campaignData.id,
      name: campaignData.name,
      tone: campaignData.tone,
    });

    // Step 2: Fetch campaign items with business details or manual metadata
    const itemsData = await step.run('fetch-items', async () => {
      const items = await db
        .select({
          id: campaignItems.id,
          businessId: campaignItems.businessId,
          businessName: businesses.name,
          businessEmail: businesses.email,
          businessCity: businesses.city,
          businessIndustry: businesses.industry,
          businessDescription: businesses.description,
          metadata: campaignItems.metadata,
        })
        .from(campaignItems)
        .leftJoin(businesses, eq(businesses.id, campaignItems.businessId))
        .where(eq(campaignItems.campaignId, campaignId));

      return items;
    });

    console.log(`Found ${itemsData.length} items to process`);

    // Step 3: Generate emails for each item
    const results = await step.run('generate-emails', async () => {
      const generatedEmails = [];

      for (const item of itemsData) {
        // Handle both business-based and manual entries
        const recipientName = item.businessName || item.metadata?.name || 'Valued Client';
        const recipientEmail = item.businessEmail || item.metadata?.email || '';
        const industry = item.businessIndustry || 'business services';
        const city = item.businessCity || 'Australia';
        const description = item.businessDescription || 'local business';

        console.log(`Generating email for ${recipientName} (${industry})`);

        const prompt = `Write a personalized cold email for a B2B outreach campaign.

Campaign Details:
- Service Description: ${campaignData.serviceDescription}
- Email Tone: ${campaignData.tone}

Target Business:
- Name: ${recipientName}
- Industry: ${industry}
- City: ${city}
- Description: ${description}

Instructions:
1. Write a concise, professional cold email (150-200 words)
2. Personalize it based on the business's industry and location
3. Keep the tone ${campaignData.tone}
4. Focus on the service: ${campaignData.serviceDescription}
5. Include a clear call-to-action
6. Do NOT use heavy formatting - plain text only

Email:`;

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

          // Step 4: Update database with generated email
          await db
            .update(campaignItems)
            .set({
              emailContent: generatedText,
              status: 'generated',
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.id));

          console.log(`✓ Generated email for ${recipientName} (${generatedText.length} chars)`);

          generatedEmails.push({
            itemId: item.id,
            businessName: recipientName,
            success: true,
          });
        } catch (error) {
          console.error(`✗ Failed to generate email for ${recipientName}:`, error);

          // Mark as failed
          await db
            .update(campaignItems)
            .set({
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Generation failed',
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.id));

          generatedEmails.push({
            itemId: item.id,
            businessName: recipientName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return generatedEmails;
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

    // TODO: Implement email sending logic
    // This is where you would:
    // 1. Fetch campaign items with generated content
    // 2. Send emails via email service provider
    // 3. Track sent status
    // 4. Update campaign status

    console.log(`Sending emails for campaign ${campaignId}`);

    return { success: true, campaignId };
  }
);
