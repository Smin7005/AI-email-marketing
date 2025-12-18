import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignService } from '@/lib/services/campaign';

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

    // Get campaign
    const campaign = await campaignService.getCampaign(
      effectiveOrgId,
      campaignId
    );

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get metrics
    const metrics = await campaignService.getCampaignMetrics(
      effectiveOrgId,
      campaignId
    );

    // Return campaign with metrics
    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      serviceDescription: campaign.serviceDescription,
      emailTone: campaign.tone,
      status: campaign.status,
      businessCount: campaign.totalRecipients,
      generatedCount: metrics.generated,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);

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
