import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailEvents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Fetch all email events for this campaign
    const events = await db
      .select({
        id: emailEvents.id,
        eventType: emailEvents.eventType,
        eventData: emailEvents.eventData,
        occurredAt: emailEvents.occurredAt,
        campaignItemId: emailEvents.campaignItemId,
      })
      .from(emailEvents)
      .where(eq(emailEvents.campaignId, parseInt(campaignId)))
      .orderBy(desc(emailEvents.occurredAt))
      .limit(100); // Limit to 100 most recent events

    // Format events for display
    const formattedEvents = events.map((event) => {
      const eventData = event.eventData as any;
      let description = '';

      switch (event.eventType) {
        case 'delivered':
          description = `Email delivered to ${eventData.recipient || 'recipient'}`;
          break;
        case 'opened':
          description = `Email opened by ${eventData.recipient || 'recipient'}`;
          break;
        case 'clicked':
          description = `Link clicked in email by ${eventData.recipient || 'recipient'}`;
          break;
        case 'bounced':
          description = `Email bounced - ${eventData.bounceType || 'bounce'}`;
          break;
        case 'complained':
          description = `Spam complaint from ${eventData.recipient || 'recipient'}`;
          break;
        default:
          description = `Email ${event.eventType}`;
      }

      return {
        id: event.id,
        type: event.eventType,
        description,
        occurredAt: event.occurredAt,
        campaignItemId: event.campaignItemId,
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