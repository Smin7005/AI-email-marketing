import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

interface ChartDataPoint {
  label: string;
  totalCampaigns: number;
  totalEmails: number;
  sentEmails: number;
  openRate: number;
}

function formatDateLabel(date: Date, period: string): string {
  if (period === '1d') {
    return date.getHours().toString().padStart(2, '0') + ':00';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

function getBucketKey(date: Date, period: string): string {
  if (period === '1d') {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  }
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    const now = new Date();
    const startDate = new Date(now);
    let bucketCount: number;

    if (period === '1d') {
      startDate.setDate(startDate.getDate() - 1);
      bucketCount = 24;
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      bucketCount = 30;
    } else {
      // default 7d
      startDate.setDate(startDate.getDate() - 7);
      bucketCount = 7;
    }

    const supabase = getCompanyDbClient();

    // Fetch all org campaigns (for email_events lookup)
    const { data: allOrgCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('organization_id', effectiveOrgId);

    const allCampaignIds = (allOrgCampaigns || []).map((c: { id: number }) => c.id);

    // Fetch campaigns created in period
    const { data: campaignsInPeriod } = await supabase
      .from('campaigns')
      .select('id, created_at, total_recipients')
      .eq('organization_id', effectiveOrgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    // Fetch email events in period
    const { data: eventsInPeriod } = allCampaignIds.length > 0
      ? await supabase
          .from('email_events')
          .select('event_type, occurred_at')
          .in('campaign_id', allCampaignIds)
          .gte('occurred_at', startDate.toISOString())
          .lte('occurred_at', now.toISOString())
          .in('event_type', ['sent', 'opened'])
      : { data: [] };

    // Build bucket map
    const bucketMap = new Map<string, ChartDataPoint>();

    // Generate all slots in range
    if (period === '1d') {
      for (let i = 0; i < 24; i++) {
        const slotDate = new Date(startDate);
        slotDate.setHours(startDate.getHours() + i);
        const key = getBucketKey(slotDate, period);
        bucketMap.set(key, {
          label: formatDateLabel(slotDate, period),
          totalCampaigns: 0,
          totalEmails: 0,
          sentEmails: 0,
          openRate: 0,
        });
      }
    } else {
      for (let i = 0; i < bucketCount; i++) {
        const slotDate = new Date(startDate);
        slotDate.setDate(startDate.getDate() + i);
        const key = getBucketKey(slotDate, period);
        bucketMap.set(key, {
          label: formatDateLabel(slotDate, period),
          totalCampaigns: 0,
          totalEmails: 0,
          sentEmails: 0,
          openRate: 0,
        });
      }
    }

    // Aggregate campaigns into buckets
    for (const campaign of campaignsInPeriod || []) {
      const d = new Date(campaign.created_at);
      const key = getBucketKey(d, period);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.totalCampaigns += 1;
        bucket.totalEmails += campaign.total_recipients || 0;
      }
    }

    // Aggregate events into buckets (track sent/opened separately for open rate)
    const sentPerBucket = new Map<string, number>();
    const openedPerBucket = new Map<string, number>();

    for (const event of eventsInPeriod || []) {
      const d = new Date(event.occurred_at);
      const key = getBucketKey(d, period);
      if (!bucketMap.has(key)) continue;

      if (event.event_type === 'sent') {
        sentPerBucket.set(key, (sentPerBucket.get(key) || 0) + 1);
      } else if (event.event_type === 'opened') {
        openedPerBucket.set(key, (openedPerBucket.get(key) || 0) + 1);
      }
    }

    // Write sentEmails and openRate into buckets
    for (const [key, bucket] of bucketMap.entries()) {
      const sent = sentPerBucket.get(key) || 0;
      const opened = openedPerBucket.get(key) || 0;
      bucket.sentEmails = sent;
      bucket.openRate = sent > 0 ? parseFloat(((opened / sent) * 100).toFixed(1)) : 0;
    }

    const data = Array.from(bucketMap.values());

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
