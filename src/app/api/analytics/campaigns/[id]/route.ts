import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { analyticsService } from '@/lib/services/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    const campaignId = parseInt(params.id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Get campaign metrics
    const metrics = await analyticsService.getCampaignMetrics(
      auth.organizationId,
      campaignId
    );

    // Get campaign analytics
    const analytics = await analyticsService.getCampaignAnalytics(
      auth.organizationId,
      campaignId
    );

    // Get engagement trends (last 30 days)
    const trends = await analyticsService.getEngagementTrends(
      auth.organizationId,
      30
    );

    return NextResponse.json({
      metrics,
      analytics,
      trends,
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'No organization selected') {
        return NextResponse.json(
          { error: 'Organization required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}