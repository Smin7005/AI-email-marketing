import { NextRequest, NextResponse } from 'next/server';
import { getCompanyDbClient } from '@/lib/db/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const supabase = getCompanyDbClient();

    // Fetch all email events for this campaign
    const { data: events, error } = await supabase
      .from('email_events')
      .select('id, event_type, event_data, occurred_at, campaign_item_id')
      .eq('campaign_id', parseInt(campaignId))
      .order('occurred_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching campaign events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaign events' },
        { status: 500 }
      );
    }

    // Format events for display
    const formattedEvents = (events || []).map((event) => {
      const eventData = event.event_data as any;
      let description = '';

      switch (event.event_type) {
        case 'delivered':
          description = `Email delivered to ${eventData?.recipient || 'recipient'}`;
          break;
        case 'opened':
          description = `Email opened by ${eventData?.recipient || 'recipient'}`;
          break;
        case 'clicked':
          description = `Link clicked in email by ${eventData?.recipient || 'recipient'}`;
          break;
        case 'bounced':
          description = `Email bounced - ${eventData?.bounceType || 'bounce'}`;
          break;
        case 'complained':
          description = `Spam complaint from ${eventData?.recipient || 'recipient'}`;
          break;
        default:
          description = `Email ${event.event_type}`;
      }

      return {
        id: event.id,
        type: event.event_type,
        description,
        occurredAt: event.occurred_at,
        campaignItemId: event.campaign_item_id,
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching campaign events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign events' },
      { status: 500 }
    );
  }
}
