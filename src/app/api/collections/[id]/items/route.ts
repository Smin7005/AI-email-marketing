import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/company-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse params
    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    // Get Production Database client
    const supabase = getCompanyDbClient();

    // Verify collection belongs to user
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found or access denied', details: collectionError?.message },
        { status: 404 }
      );
    }

    // Query with JOIN: collection_items joined with rawdata_yellowpage_new
    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select(`
        id,
        collection_id,
        listing_id,
        added_at,
        rawdata_yellowpage_new (
          listing_id,
          company_name,
          category_name,
          email,
          phone_number,
          address_suburb,
          address_state,
          address_postcode
        )
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching collection items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch collection items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Extract IDs and names
    const ids = items?.map(item => item.listing_id?.toString()) || [];
    const names = items?.map(item => item.rawdata_yellowpage_new?.company_name || 'Unknown Business') || [];

    return NextResponse.json({ ids, names });

  } catch (error) {
    console.error('Error in collection items GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', details: String(error) },
      { status: 500 }
    );
  }
}
