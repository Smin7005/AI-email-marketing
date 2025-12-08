import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handle email events from Resend
 * This endpoint receives webhooks when emails are delivered, opened, clicked, bounced, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (optional for now, but recommended in production)
    // const signature = request.headers.get('x-resend-signature');
    // if (!signature) {
    //   return NextResponse.json(
    //     { error: 'Missing signature' },
    //     { status: 401 }
    //   );
    // }

    // Parse webhook payload
    const payload = await request.json();
    console.log('Received email event webhook:', JSON.stringify(payload, null, 2));

    // Handle different event types from Resend
    const { type, data } = payload;

    switch (type) {
      case 'email.delivered':
        await processDeliveredEvent(data);
        break;
      case 'email.opened':
        await processOpenedEvent(data);
        break;
      case 'email.clicked':
        await processClickedEvent(data);
        break;
      case 'email.bounced':
        await processBouncedEvent(data);
        break;
      case 'email.complained':
        await processComplainedEvent(data);
        break;
      default:
        console.log(`Unknown event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Return 200 to prevent Resend from retrying immediately
    // In production, you might want to return 500 for certain errors
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 200 }
    );
  }
}

/**
 * Process delivered event
 */
async function processDeliveredEvent(data: any) {
  const { id: messageId, to, from, subject, created_at } = data;

  // Find campaign item by message ID
  const campaignItem = await findCampaignItemByMessageId(messageId);

  if (campaignItem) {
    // Record email event
    await db.insert(emailEvents).values({
      organizationId: campaignItem.organizationId,
      campaignId: campaignItem.campaignId,
      campaignItemId: campaignItem.id,
      eventType: 'delivered',
      eventData: {
        messageId,
        to,
        from,
        subject,
        timestamp: created_at,
      },
      occurredAt: new Date(),
    });

    console.log(`Recorded delivered event for message ${messageId}`);
  } else {
    console.log(`No campaign item found for message ${messageId}`);
  }
}

/**
 * Process opened event
 */
async function processOpenedEvent(data: any) {
  const { id: messageId, created_at, user_agent, ip } = data;

  const campaignItem = await findCampaignItemByMessageId(messageId);

  if (campaignItem) {
    await db.insert(emailEvents).values({
      organizationId: campaignItem.organizationId,
      campaignId: campaignItem.campaignId,
      campaignItemId: campaignItem.id,
      eventType: 'opened',
      eventData: {
        messageId,
        userAgent: user_agent,
        ip,
        timestamp: created_at,
      },
      occurredAt: new Date(),
    });

    console.log(`Recorded opened event for message ${messageId}`);
  }
}

/**
 * Process clicked event
 */
async function processClickedEvent(data: any) {
  const { id: messageId, created_at, url, user_agent, ip } = data;

  const campaignItem = await findCampaignItemByMessageId(messageId);

  if (campaignItem) {
    await db.insert(emailEvents).values({
      organizationId: campaignItem.organizationId,
      campaignId: campaignItem.campaignId,
      campaignItemId: campaignItem.id,
      eventType: 'clicked',
      eventData: {
        messageId,
        url,
        userAgent: user_agent,
        ip,
        timestamp: created_at,
      },
      occurredAt: new Date(),
    });

    console.log(`Recorded clicked event for message ${messageId} on URL ${url}`);
  }
}

/**
 * Process bounced event
 */
async function processBouncedEvent(data: any) {
  const { id: messageId, created_at, bounce_type, reason } = data;

  const campaignItem = await findCampaignItemByMessageId(messageId);

  if (campaignItem) {
    await db.insert(emailEvents).values({
      organizationId: campaignItem.organizationId,
      campaignId: campaignItem.campaignId,
      campaignItemId: campaignItem.id,
      eventType: 'bounced',
      eventData: {
        messageId,
        bounceType: bounce_type,
        reason,
        timestamp: created_at,
      },
      occurredAt: new Date(),
    });

    // Add to suppression list for hard bounces
    if (bounce_type === 'hard') {
      // This would call the suppression service
      console.log(`Adding ${campaignItem.businessEmail} to suppression list due to hard bounce`);
    }

    console.log(`Recorded bounced event for message ${messageId}`);
  }
}

/**
 * Process complained event (spam complaint)
 */
async function processComplainedEvent(data: any) {
  const { id: messageId, created_at, feedback_type } = data;

  const campaignItem = await findCampaignItemByMessageId(messageId);

  if (campaignItem) {
    await db.insert(emailEvents).values({
      organizationId: campaignItem.organizationId,
      campaignId: campaignItem.campaignId,
      campaignItemId: campaignItem.id,
      eventType: 'complained',
      eventData: {
        messageId,
        feedbackType: feedback_type,
        timestamp: created_at,
      },
      occurredAt: new Date(),
    });

    // Add to suppression list
    console.log(`Adding ${campaignItem.businessEmail} to suppression list due to spam complaint`);

    console.log(`Recorded complained event for message ${messageId}`);
  }
}

/**
 * Find campaign item by message ID
 * This is a helper function that would need to be implemented based on your data model
 */
async function findCampaignItemByMessageId(messageId: string) {
  // In a real implementation, you would store the message ID when sending emails
  // and use it to find the corresponding campaign item

  // For now, return a mock object
  // You should implement this based on how you store message IDs
  return {
    id: 1,
    organizationId: 'org_123',
    campaignId: 1,
    businessEmail: 'test@example.com',
  };
}

/**
 * Verify webhook signature (for production)
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // Implement webhook signature verification
  // This would use the webhook secret from Resend
  return true;
}

/**
 * Handle GET requests (for webhook verification)
 */
export async function GET() {
  // Return challenge for webhook verification
  return NextResponse.json({ challenge: 'webhook-verified' });
}