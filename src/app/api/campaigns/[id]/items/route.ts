import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignService } from '@/lib/services/campaign';
import { db } from '@/lib/db';
import { campaignItems, businesses, campaigns } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { withOrganization } from '@/lib/db/tenant';

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
    console.log('[CAMPAIGN ITEMS] Effective org ID:', effectiveOrgId);
    console.log('[CAMPAIGN ITEMS] User ID:', session.userId);
    console.log('[CAMPAIGN ITEMS] Session org ID:', session.orgId);

    const campaignId = parseInt(params.id, 10);
    console.log('[CAMPAIGN ITEMS] Campaign ID:', campaignId);

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
      .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
      .where(
        and(
          eq(campaignItems.campaignId, campaignId),
          eq(campaigns.organizationId, effectiveOrgId)
        )
      )
      .orderBy(businesses.name);

    console.log('[CAMPAIGN ITEMS] Raw items from DB:', items);

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

    console.log('[CAMPAIGN ITEMS] Transformed items:', transformedItems);

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('ITEMS API ERROR:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    console.error('Request params:', params);

    // Log session info if available
    try {
      console.error('Session info in error handler');
    } catch (e) {
      console.error('Failed to log session info');
    }

    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
