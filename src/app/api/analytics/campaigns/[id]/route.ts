import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyticsService } from '@/lib/services/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth context directly
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle missing orgId - use userId as fallback
    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';

    const campaignId = parseInt(params.id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Get campaign metrics
    const metrics = await analyticsService.getCampaignMetrics(
      effectiveOrgId,
      campaignId
    );

    // Get campaign analytics
    const analytics = await analyticsService.getCampaignMetrics(
      effectiveOrgId,
      campaignId
    );

    return NextResponse.json({
      metrics,
      analytics
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