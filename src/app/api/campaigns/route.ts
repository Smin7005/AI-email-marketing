import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignService } from '@/lib/services/campaign';
import { inngest } from '@/lib/inngest/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Campaign creation schema
const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  serviceDescription: z.string().min(10).max(2000),
  emailTone: z.enum(['professional', 'friendly', 'casual', 'formal', 'enthusiastic']),
  businessIds: z.array(z.number().positive()).min(1).max(1000),
});

export async function GET(request: NextRequest) {
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
      effectiveOrgId,
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    console.log('Using effective org ID:', effectiveOrgId);

    // Parse and validate request body
    const body = await request.json();
    console.log('Campaign creation request body:', JSON.stringify(body, null, 2));

    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      console.error('Campaign validation failed:', validation.error.format());
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    console.log('Validated campaign data:', JSON.stringify(data, null, 2));

    // Create campaign
    const campaign = await campaignService.createCampaign(
      effectiveOrgId,
      data
    );

    console.log('Campaign created successfully:', JSON.stringify(campaign, null, 2));
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Campaign Create Error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);

    if (error instanceof Error) {
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