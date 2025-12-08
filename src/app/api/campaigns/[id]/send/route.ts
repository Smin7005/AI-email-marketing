import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { campaignService } from '@/lib/services/campaign';
import { quotaService } from '@/lib/services/quota';
import { inngest } from '@/lib/inngest/client';

export async function POST(
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

    // Get campaign
    const campaign = await campaignService.getCampaign(
      auth.organizationId,
      campaignId
    );

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status !== 'ready') {
      return NextResponse.json(
        { error: 'Campaign must be in ready status to send' },
        { status: 400 }
      );
    }

    // Check quota for sending
    const quotaCheck = await quotaService.checkQuota(
      auth.organizationId,
      campaign.totalRecipients
    );

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          details: quotaCheck.reason,
          quotaInfo: quotaCheck.quotaInfo,
        },
        { status: 403 }
      );
    }

    // Trigger Inngest workflow for sending
    await inngest.send({
      name: 'campaign/send-batch',
      data: {
        campaignId,
        organizationId: auth.organizationId,
      },
    });

    // Update campaign status to 'sending'
    await campaignService.updateCampaignStatus(
      auth.organizationId,
      campaignId,
      'sending'
    );

    return NextResponse.json({
      message: 'Campaign sending started successfully',
      status: 'sending',
      campaignId,
    });
  } catch (error) {
    console.error('Error sending campaign:', error);

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
