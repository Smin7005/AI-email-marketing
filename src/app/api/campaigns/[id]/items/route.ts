import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/supabase';

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
    const campaignId = parseInt(params.id, 10);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    const supabase = getCompanyDbClient();

    // First verify the campaign belongs to this organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', effectiveOrgId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get campaign items with business details
    const { data: items, error: itemsError } = await supabase
      .from('campaign_items')
      .select(`
        id,
        status,
        email_subject,
        email_content,
        error_message,
        metadata,
        business_id,
        rawdata_yellowpage_new (
          listing_id,
          company_name,
          email
        )
      `)
      .eq('campaign_id', campaignId);

    if (itemsError) {
      throw itemsError;
    }

    // Transform the data to match the expected format
    const transformedItems = (items || []).map((item: any) => ({
      id: item.id,
      businessId: item.business_id || item.rawdata_yellowpage_new?.listing_id,
      businessName: item.rawdata_yellowpage_new?.company_name || item.metadata?.name || 'Manual Entry',
      businessEmail: item.rawdata_yellowpage_new?.email || item.metadata?.email,
      status: item.status,
      subject: item.email_subject || undefined,
      emailContent: item.email_content || undefined,
      errorMessage: item.error_message || undefined,
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching campaign items:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
