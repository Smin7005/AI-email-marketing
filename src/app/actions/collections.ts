'use server';

import { getCompanyDbClient } from '@/lib/db/company-client';
import { auth } from '@clerk/nextjs/server';

export async function removeCompanyFromCollection(collectionItemId: string, collectionId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const supabase = getCompanyDbClient();

  // Verify the collection belongs to the user
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, user_id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) {
    throw new Error('Collection not found or access denied');
  }

  // Delete the collection item
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', collectionItemId)
    .eq('collection_id', collectionId);

  if (error) {
    console.error('Error removing company from collection:', error);
    throw new Error('Failed to remove company from collection');
  }

  return { success: true };
}
