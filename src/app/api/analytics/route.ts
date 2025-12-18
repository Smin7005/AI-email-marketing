import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignItems, emailEvents } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build date filter
    let dateFilter;
    if (startDate && endDate) {
      dateFilter = and(
        gte(campaigns.createdAt, new Date(startDate)),
        lte(campaigns.createdAt, new Date(endDate))
      );
    }

    // Get all campaigns for this organization
    const orgCampaigns = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
        totalRecipients: campaigns.totalRecipients,
      })
      .from(campaigns)
      .where(
        dateFilter
          ? and(eq(campaigns.organizationId, organizationId), dateFilter)
          : eq(campaigns.organizationId, organizationId)
      )
      .orderBy(desc(campaigns.createdAt));

    // Get campaign IDs
    const campaignIds = orgCampaigns.map(c => c.id);

    // Get all campaign items for these campaigns
    const allItems = campaignIds.length > 0 ? await db
      .select({
        campaignId: campaignItems.campaignId,
        status: campaignItems.status,
      })
      .from(campaignItems)
      .where(inArray(campaignItems.campaignId, campaignIds)) : [];

    // Get all email events for these campaigns
    const allEvents = campaignIds.length > 0 ? await db
      .select({
        campaignId: emailEvents.campaignId,
        eventType: emailEvents.eventType,
      })
      .from(emailEvents)
      .where(inArray(emailEvents.campaignId, campaignIds)) : [];

    // Calculate aggregate stats
    const totalEmails = allItems.length;
    const sentEmails = allItems.filter(item =>
      ['sent', 'opened', 'clicked'].includes(item.status)
    ).length;
    const openedEmails = allItems.filter(item =>
      ['opened', 'clicked'].includes(item.status)
    ).length;
    const clickedEmails = allItems.filter(item =>
      item.status === 'clicked'
    ).length;

    // Calculate rates
    const openRate = sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0;
    const clickRate = sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0;

    // Count events by type
    const eventCounts = allEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent activity (last 20 events)
    const recentActivity = campaignIds.length > 0 ? await db
      .select({
        id: emailEvents.id,
        campaignId: emailEvents.campaignId,
        eventType: emailEvents.eventType,
        eventData: emailEvents.eventData,
        occurredAt: emailEvents.occurredAt,
      })
      .from(emailEvents)
      .where(inArray(emailEvents.campaignId, campaignIds))
      .orderBy(desc(emailEvents.occurredAt))
      .limit(20) : [];

    // Format recent activity
    const formattedActivity = recentActivity.map((activity) => {
      const eventData = activity.eventData as any;
      let description = '';

      switch (activity.eventType) {
        case 'delivered':
          description = `Email delivered`;
          break;
        case 'opened':
          description = `Email opened`;
          break;
        case 'clicked':
          description = `Link clicked`;
          break;
        case 'bounced':
          description = `Email bounced`;
          break;
        case 'complained':
          description = `Spam complaint`;
          break;
        default:
          description = `Email ${activity.eventType}`;
      }

      // Find campaign name
      const campaign = orgCampaigns.find(c => c.id === activity.campaignId);

      return {
        id: activity.id,
        type: activity.eventType,
        description,
        campaignName: campaign?.name || 'Unknown Campaign',
        occurredAt: activity.occurredAt,
      };
    });

    return NextResponse.json({
      summary: {
        totalCampaigns: orgCampaigns.length,
        totalEmails,
        sentEmails,
        openedEmails,
        clickedEmails,
        openRate,
        clickRate,
        bounceCount: eventCounts.bounced || 0,
        complaintCount: eventCounts.complained || 0,
      },
      campaigns: orgCampaigns.map(campaign => {
        const items = allItems.filter(item => item.campaignId === campaign.id);
        const events = allEvents.filter(event => event.campaignId === campaign.id);

        const sent = items.filter(item =>
          ['sent', 'opened', 'clicked'].includes(item.status)
        ).length;
        const opened = items.filter(item =>
          ['opened', 'clicked'].includes(item.status)
        ).length;
        const clicked = items.filter(item =>
          item.status === 'clicked'
        ).length;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
          totalEmails: items.length,
          sentEmails: sent,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        };
      }),
      recentActivity: formattedActivity,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}