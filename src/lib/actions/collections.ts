'use server';

import { auth } from '@clerk/nextjs/server';
import { getCompanyDbClient } from '@/lib/db/company-client';

export async function getUserCollections() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
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
    throw new Error('Failed to fetch collections');
  }

  // Transform the data to include the count as a number
  const transformedData = data?.map((collection) => ({
    ...collection,
    item_count: collection.collection_items?.[0]?.count || 0,
  })) || [];

  return transformedData;
}

export async function createCollection(name: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!name || name.trim() === '') {
    throw new Error('Collection name is required');
  }

  const supabase = getCompanyDbClient();

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw new Error('Failed to create collection');
  }

  return data;
}

export async function addLeadsToCollection(collectionId: string, companyIds: string[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!collectionId) {
    throw new Error('Collection ID is required');
  }

  if (!companyIds || companyIds.length === 0) {
    throw new Error('At least one company must be selected');
  }

  const supabase = getCompanyDbClient();

  // Verify the collection belongs to the user
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) {
    throw new Error('Collection not found or access denied');
  }

  // Prepare the items to insert (companyIds are listing_ids - keep as BIGINT strings)
  const itemsToInsert = companyIds.map((companyId) => ({
    collection_id: parseInt(collectionId, 10),
    listing_id: parseInt(companyId, 10),
  }));

  // Insert the items (ignoring duplicates due to UNIQUE constraint)
  const { data, error } = await supabase
    .from('collection_items')
    .insert(itemsToInsert)
    .select();

  if (error) {
    // Ignore duplicate key errors (company already in collection)
    if (error.code === '23505') {
      console.log('Some companies were already in the collection');
      return { inserted: 0, duplicates: companyIds.length };
    }
    console.error('Error adding leads to collection:', error);
    throw new Error('Failed to add leads to collection');
  }

  return {
    inserted: data?.length || 0,
    duplicates: companyIds.length - (data?.length || 0),
  };
}

export async function deleteCollection(collectionId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!collectionId) {
    throw new Error('Collection ID is required');
  }

  const supabase = getCompanyDbClient();

  // Verify the collection belongs to the user
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, name')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) {
    throw new Error('Collection not found or access denied');
  }

  // Delete the collection (collection_items will be deleted via CASCADE)
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting collection:', error);
    throw new Error('Failed to delete collection');
  }

  return { success: true, collectionName: collection.name };
}
