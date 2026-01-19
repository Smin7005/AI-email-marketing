import { NextRequest, NextResponse } from 'next/server';
import { getCompanyDbClient } from '@/lib/db/supabase';

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

    const supabase = getCompanyDbClient();

    switch (type) {
      case 'email.delivered':
        await processDeliveredEvent(supabase, data);
        break;
      case 'email.opened':
        await processOpenedEvent(supabase, data);
        break;
      case 'email.clicked':
        await processClickedEvent(supabase, data);
        break;
      case 'email.bounced':
        await processBouncedEvent(supabase, data);
        break;
      case 'email.complained':
        await processComplainedEvent(supabase, data);
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
 * Find campaign item by message ID
 */
async function findCampaignItemByMessageId(supabase: any, messageId: string) {
  const { data: item, error } = await supabase
    .from('campaign_items')
    .select(`
      id,
      campaign_id,
      business_id,
      metadata,
      campaigns!inner (
        organization_id
      )
    `)
    .eq('message_id', messageId)
    .single();

  if (error || !item) {
    console.log(`No campaign item found for message ${messageId}`);
    return null;
  }

  // Get business email if available
  let businessEmail = null;
  if (item.business_id) {
    const { data: business } = await supabase
      .from('rawdata_yellowpage_new')
      .select('email')
      .eq('listing_id', item.business_id)
      .single();
    businessEmail = business?.email;
  } else if (item.metadata?.email) {
    businessEmail = item.metadata.email;
  }

  return {
    id: item.id,
    organizationId: item.campaigns.organization_id,
    campaignId: item.campaign_id,
    businessEmail,
  };
}

/**
 * Process delivered event
 */
async function processDeliveredEvent(supabase: any, data: any) {
  const { id: messageId, to, from, subject, created_at } = data;

  const campaignItem = await findCampaignItemByMessageId(supabase, messageId);

  if (campaignItem) {
    const { error } = await supabase.from('email_events').insert({
      organization_id: campaignItem.organizationId,
      campaign_id: campaignItem.campaignId,
      campaign_item_id: campaignItem.id,
      event_type: 'delivered',
      event_data: {
        messageId,
        to,
        from,
        subject,
        timestamp: created_at,
      },
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to insert delivered event:', error);
    } else {
      console.log(`Recorded delivered event for message ${messageId}`);
    }
  }
}

/**
 * Process opened event
 */
async function processOpenedEvent(supabase: any, data: any) {
  const { id: messageId, created_at, user_agent, ip } = data;

  const campaignItem = await findCampaignItemByMessageId(supabase, messageId);

  if (campaignItem) {
    const { error } = await supabase.from('email_events').insert({
      organization_id: campaignItem.organizationId,
      campaign_id: campaignItem.campaignId,
      campaign_item_id: campaignItem.id,
      event_type: 'opened',
      event_data: {
        messageId,
        userAgent: user_agent,
        ip,
        timestamp: created_at,
      },
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to insert opened event:', error);
    } else {
      console.log(`Recorded opened event for message ${messageId}`);
    }
  }
}

/**
 * Process clicked event
 */
async function processClickedEvent(supabase: any, data: any) {
  const { id: messageId, created_at, url, user_agent, ip } = data;

  const campaignItem = await findCampaignItemByMessageId(supabase, messageId);

  if (campaignItem) {
    const { error } = await supabase.from('email_events').insert({
      organization_id: campaignItem.organizationId,
      campaign_id: campaignItem.campaignId,
      campaign_item_id: campaignItem.id,
      event_type: 'clicked',
      event_data: {
        messageId,
        url,
        userAgent: user_agent,
        ip,
        timestamp: created_at,
      },
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to insert clicked event:', error);
    } else {
      console.log(`Recorded clicked event for message ${messageId} on URL ${url}`);
    }
  }
}

/**
 * Process bounced event
 */
async function processBouncedEvent(supabase: any, data: any) {
  const { id: messageId, created_at, bounce_type, reason } = data;

  const campaignItem = await findCampaignItemByMessageId(supabase, messageId);

  if (campaignItem) {
    const { error } = await supabase.from('email_events').insert({
      organization_id: campaignItem.organizationId,
      campaign_id: campaignItem.campaignId,
      campaign_item_id: campaignItem.id,
      event_type: 'bounced',
      event_data: {
        messageId,
        bounceType: bounce_type,
        reason,
        timestamp: created_at,
      },
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to insert bounced event:', error);
    } else {
      console.log(`Recorded bounced event for message ${messageId}`);
    }

    // Add to suppression list for hard bounces
    if (bounce_type === 'hard' && campaignItem.businessEmail) {
      await supabase.from('suppression_list').insert({
        organization_id: campaignItem.organizationId,
        email: campaignItem.businessEmail.toLowerCase(),
        type: 'bounced',
        reason: 'Hard bounce',
        campaign_id: campaignItem.campaignId,
      });
    }
  }
}

/**
 * Process complained event (spam complaint)
 */
async function processComplainedEvent(supabase: any, data: any) {
  const { id: messageId, created_at, feedback_type } = data;

  const campaignItem = await findCampaignItemByMessageId(supabase, messageId);

  if (campaignItem) {
    const { error } = await supabase.from('email_events').insert({
      organization_id: campaignItem.organizationId,
      campaign_id: campaignItem.campaignId,
      campaign_item_id: campaignItem.id,
      event_type: 'complained',
      event_data: {
        messageId,
        feedbackType: feedback_type,
        timestamp: created_at,
      },
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to insert complained event:', error);
    } else {
      console.log(`Recorded complained event for message ${messageId}`);
    }

    // Add to suppression list
    if (campaignItem.businessEmail) {
      await supabase.from('suppression_list').insert({
        organization_id: campaignItem.organizationId,
        email: campaignItem.businessEmail.toLowerCase(),
        type: 'complained',
        reason: feedback_type || 'Spam complaint',
        campaign_id: campaignItem.campaignId,
      });
    }
  }
}

/**
 * Handle GET requests (for webhook verification)
 */
export async function GET() {
  // Return challenge for webhook verification
  return NextResponse.json({ challenge: 'webhook-verified' });
}
