import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { campaignService } from '@/lib/services/campaign';
import { db } from '@/lib/db';
import { campaignItems, businesses } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { withOrganization } from '@/lib/db/tenant';

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

    // Get campaign items with business details
    const items = await db
      .select({
        id: campaignItems.id,
        status: campaignItems.status,
        emailSubject: campaignItems.emailSubject,
        emailContent: campaignItems.emailContent,
        errorMessage: campaignItems.errorMessage,
        businessId: businesses.id,
        businessName: businesses.name,
        businessEmail: businesses.email,
      })
      .from(campaignItems)
      .innerJoin(businesses, eq(businesses.id, campaignItems.businessId))
      .where(
        and(
          eq(campaignItems.campaignId, campaignId),
          withOrganization(auth.organizationId)
        )
      )
      .orderBy(businesses.name);

    // Transform the data to match the expected format
    const transformedItems = items.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      businessName: item.businessName,
      businessEmail: item.businessEmail,
      status: item.status,
      subject: item.emailSubject || undefined,
      emailContent: item.emailContent || undefined,
      errorMessage: item.errorMessage || undefined,
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching campaign items:', error);

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
