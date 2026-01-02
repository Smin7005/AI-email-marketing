import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Check collections table schema
    const { data: collectionsSchema, error: collectionsError } = await supabase
      .rpc('get_table_schema', { table_name: 'collections' });

    // Check collection_items table schema
    const { data: itemsSchema, error: itemsError } = await supabase
      .rpc('get_table_schema', { table_name: 'collection_items' });

    return NextResponse.json({
      collections: collectionsSchema,
      items: itemsSchema,
      errors: {
        collections: collectionsError,
        items: itemsError
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
