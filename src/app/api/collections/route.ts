import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/company-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const supabase = getCompanyDbClient();

    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        created_at,
        collection_items(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    // Transform the data to include the count as a number
    const transformedData = data?.map((collection) => ({
      id: collection.id,
      name: collection.name,
      created_at: collection.created_at,
      item_count: collection.collection_items?.[0]?.count || 0,
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in collections GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
