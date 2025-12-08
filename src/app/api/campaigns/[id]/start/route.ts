import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { campaignService } from '@/lib/services/campaign';
import { quotaService } from '@/lib/services/quota';
import { inngest } from '@/lib/inngest/client';
import { z } from 'zod';

// Start campaign schema
const startCampaignSchema = z.object({
  action: z.enum(['generate', 'send']),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validation = startCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;

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
    if (action === 'generate' && campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Campaign must be in draft status to generate emails' },
        { status: 400 }
      );
    }

    if (action === 'send' && campaign.status !== 'ready') {
      return NextResponse.json(
        { error: 'Campaign must be in ready status to send' },
        { status: 400 }
      );
    }

    // Check quota for sending
    if (action === 'send') {
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
    }

    // Trigger Inngest workflow
    const eventName = action === 'generate'
      ? 'campaign/generate-emails'
      : 'campaign/send-batch';

    await inngest.send({
      name: eventName,
      data: {
        campaignId,
        organizationId: auth.organizationId,
      },
    });

    // Update campaign status
    const newStatus = action === 'generate' ? 'generating' : 'sending';
    await campaignService.updateCampaignStatus(
      auth.organizationId,
      campaignId,
      newStatus
    );

    return NextResponse.json({
      message: `Campaign ${action} started successfully`,
      status: newStatus,
      campaignId,
    });
  } catch (error) {
    console.error('Error starting campaign:', error);

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

    // Get campaign with details
    const campaign = await campaignService.getCampaignWithDetails(
      auth.organizationId,
      campaignId
    );

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
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