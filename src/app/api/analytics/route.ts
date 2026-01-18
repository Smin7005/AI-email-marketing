import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth context
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = getCompanyDbClient();

    // Build query for campaigns
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, name, status, created_at, total_recipients')
      .eq('organization_id', effectiveOrgId)
      .order('created_at', { ascending: false });

    if (startDate) {
      campaignQuery = campaignQuery.gte('created_at', startDate);
    }
    if (endDate) {
      campaignQuery = campaignQuery.lte('created_at', endDate);
    }

    const { data: orgCampaigns, error: campaignsError } = await campaignQuery;

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    if (!orgCampaigns || orgCampaigns.length === 0) {
      // Return empty analytics if no campaigns
      return NextResponse.json({
        summary: {
          totalCampaigns: 0,
          totalEmails: 0,
          sentEmails: 0,
          openedEmails: 0,
          clickedEmails: 0,
          openRate: 0,
          clickRate: 0,
          bounceCount: 0,
          complaintCount: 0,
        },
        campaigns: [],
        recentActivity: [],
      });
    }

    // Get campaign IDs
    const campaignIds = orgCampaigns.map(c => c.id);

    // Get all campaign items for these campaigns
    const { data: allItems, error: itemsError } = await supabase
      .from('campaign_items')
      .select('campaign_id, status')
      .in('campaign_id', campaignIds);

    if (itemsError) {
      console.error('Error fetching campaign items:', itemsError);
    }

    const items = allItems || [];

    // Get all email events for these campaigns
    const { data: allEvents, error: eventsError } = await supabase
      .from('email_events')
      .select('campaign_id, event_type')
      .in('campaign_id', campaignIds);

    if (eventsError) {
      console.error('Error fetching email events:', eventsError);
    }

    const events = allEvents || [];

    // Calculate aggregate stats
    const totalEmails = items.length;
    const sentEmails = items.filter(item =>
      ['sent', 'opened', 'clicked'].includes(item.status)
    ).length;
    const openedEmails = items.filter(item =>
      ['opened', 'clicked'].includes(item.status)
    ).length;
    const clickedEmails = items.filter(item =>
      item.status === 'clicked'
    ).length;

    // Calculate rates
    const openRate = sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0;
    const clickRate = sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0;

    // Count events by type
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent activity (last 20 events)
    const { data: recentActivity, error: activityError } = await supabase
      .from('email_events')
      .select('id, campaign_id, event_type, event_data, occurred_at')
      .in('campaign_id', campaignIds)
      .order('occurred_at', { ascending: false })
      .limit(20);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    // Format recent activity
    const formattedActivity = (recentActivity || []).map((activity) => {
      let description = '';

      switch (activity.event_type) {
        case 'delivered':
          description = 'Email delivered';
          break;
        case 'opened':
          description = 'Email opened';
          break;
        case 'clicked':
          description = 'Link clicked';
          break;
        case 'bounced':
          description = 'Email bounced';
          break;
        case 'complained':
          description = 'Spam complaint';
          break;
        default:
          description = `Email ${activity.event_type}`;
      }

      // Find campaign name
      const campaign = orgCampaigns.find(c => c.id === activity.campaign_id);

      return {
        id: activity.id,
        type: activity.event_type,
        description,
        campaignName: campaign?.name || 'Unknown Campaign',
        occurredAt: activity.occurred_at,
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
        const campaignItems = items.filter(item => item.campaign_id === campaign.id);

        const sent = campaignItems.filter(item =>
          ['sent', 'opened', 'clicked'].includes(item.status)
        ).length;
        const opened = campaignItems.filter(item =>
          ['opened', 'clicked'].includes(item.status)
        ).length;
        const clicked = campaignItems.filter(item =>
          item.status === 'clicked'
        ).length;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.created_at,
          totalEmails: campaignItems.length,
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
