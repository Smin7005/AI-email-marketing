import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { campaignService } from '@/lib/services/campaign';
import { inngest } from '@/lib/inngest/client';
import { z } from 'zod';

// Campaign creation schema
const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  senderName: z.string().min(1).max(255),
  senderEmail: z.string().email().max(255),
  serviceDescription: z.string().min(10).max(2000),
  tone: z.enum(['professional', 'friendly', 'casual']).optional(),
  businessIds: z.array(z.number().positive()).min(1).max(1000),
});

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get campaigns for organization
    const results = await campaignService.getCampaigns(
      auth.organizationId,
      page,
      limit
    );

    return NextResponse.json({
      campaigns: results.campaigns,
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);

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

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create campaign
    const campaign = await campaignService.createCampaign(
      auth.organizationId,
      data
    );

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);

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
      if (error.message === 'Some business IDs are invalid') {
        return NextResponse.json(
          { error: 'Invalid business IDs provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}