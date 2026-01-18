import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignService } from '@/lib/services/campaign-supabase';
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
    console.log('[CAMPAIGN START] Effective org ID:', effectiveOrgId);
    console.log('[CAMPAIGN START] User ID:', session.userId);
    console.log('[CAMPAIGN START] Session org ID:', session.orgId);

    const campaignId = parseInt(params.id, 10);
    console.log('[CAMPAIGN START] Campaign ID:', campaignId);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Safely parse request body (handle empty bodies)
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Body is optional/empty, ignore JSON parse errors
      console.log('[CAMPAIGN START] No JSON body provided, using defaults');
    }

    // Set default action if body is empty
    if (Object.keys(body).length === 0) {
      body = { action: 'generate' };
      console.log('[CAMPAIGN START] Empty body, defaulting to action: generate');
    }

    console.log('[CAMPAIGN START] Validating body:', body);

    // Parse and validate request body
    const validation = startCampaignSchema.safeParse(body);

    if (!validation.success) {
      console.log('[CAMPAIGN START] Validation failed:', validation.error.format());
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;

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
        effectiveOrgId,
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
        organizationId: effectiveOrgId,
      },
    });

    // Update campaign status
    const newStatus = action === 'generate' ? 'generating' : 'sending';
    await campaignService.updateCampaignStatus(
      effectiveOrgId,
      campaignId,
      newStatus
    );

    return NextResponse.json({
      message: `Campaign ${action} started successfully`,
      status: newStatus,
      campaignId,
    });
  } catch (error) {
    console.error('START API ERROR:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    console.error('Request params:', params);

    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

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
    console.log('[CAMPAIGN START GET] Effective org ID:', effectiveOrgId);

    const campaignId = parseInt(params.id);
    console.log('[CAMPAIGN START GET] Campaign ID:', campaignId);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Get campaign with details
    const campaign = await campaignService.getCampaignWithDetails(
      effectiveOrgId,
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