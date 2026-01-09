import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getCompanyDbClient } from '@/lib/db/company-client';
import { auth } from '@clerk/nextjs/server';
import CollectionItemsTable from '@/components/collections/CollectionItemsTable';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

interface CollectionItem {
  id: string;
  collection_id: string;
  company_id: string;
  created_at: string;
  companyinfo: {
    listing_id: string;
    company_name: string;
    category_name: string | null;
    email: string | null;
    phone_number: string | null;
    address_suburb: string | null;
    address_state: string | null;
    address_postcode: string | null;
  };
}

async function getCollection(id: string, userId: string): Promise<Collection | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching collection:', error);
    return null;
  }

  return data;
}

async function getCollectionItems(id: string): Promise<CollectionItem[]> {
  // Step 1: Get collection items from DB1 (User DB) - only get company_ids
  const supabaseAdmin = getSupabaseAdmin();
  const { data: collectionItems, error } = await supabaseAdmin
    .from('collection_items')
    .select('id, collection_id, company_id, created_at')
    .eq('collection_id', id);

  if (error) {
    console.error('Error fetching collection items:', error);
    return [];
  }

  if (!collectionItems || collectionItems.length === 0) {
    return [];
  }

  // Step 2: Extract company IDs
  const companyIds = collectionItems.map(item => item.company_id);

  // Step 3: Fetch company details from DB2 (Company DB)
  const companyDb = getCompanyDbClient();
  const { data: companies, error: companiesError } = await companyDb
    .from('rawdata_yellowpage_new')
    .select('listing_id, company_name, category_name, email, phone_number, address_suburb, address_state, address_postcode')
    .in('listing_id', companyIds);

  if (companiesError) {
    console.error('Error fetching company details:', companiesError);
    return [];
  }

  // Step 4: Merge the data - application-level join
  const items = collectionItems.map(collectionItem => {
    const companyInfo = companies?.find(c => c.listing_id === collectionItem.company_id);
    return {
      ...collectionItem,
      companyinfo: companyInfo || {
        listing_id: collectionItem.company_id,
        company_name: 'Unknown',
        category_name: null,
        email: null,
        phone_number: null,
        address_suburb: null,
        address_state: null,
        address_postcode: null
      }
    };
  });

  return items;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please sign in to view collections.</p>
      </div>
    );
  }

  const collection = await getCollection(params.id, userId);

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Collection Not Found</h1>
        <p className="text-gray-500">This collection doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const items = await getCollectionItems(params.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
          {collection.description && (
            <p className="mt-1 text-sm text-gray-500">{collection.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            Created {new Date(collection.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Items Count */}
      <div className="text-sm text-gray-600">
        {items.length} company{items.length === 1 ? '' : 'ies'} in this collection
      </div>

      {/* Items Table */}
      <CollectionItemsTable items={items} collectionId={params.id} />
    </div>
  );
}
