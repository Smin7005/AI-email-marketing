import { getSupabaseClient } from '@/lib/db/supabase';
import LeadsFilters from '@/components/leads/LeadsFilters';
import LeadsTable from '@/components/leads/LeadsTable';

interface Company {
  id: string;
  name: string;
  categories: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

async function getLeads(searchQuery?: string, cityQuery?: string, industryQuery?: string): Promise<Company[]> {
  const supabase = getSupabaseClient();

  // Force no cache on the query
  let query = supabase
    .from('companyinfo')
    .select('id, name, categories, email, phone, address')
    .limit(50);

  // Apply search query filter (name)
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    query = query.ilike('name', searchTerm);
  }

  // Apply city filter (search in address)
  if (cityQuery && cityQuery.trim()) {
    const cityTerm = `%${cityQuery.trim()}%`;
    query = query.ilike('address', cityTerm);
  }

  // Apply industry filter (exact match on categories)
  if (industryQuery && industryQuery.trim() && industryQuery !== 'all') {
    query = query.eq('categories', industryQuery.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return data || [];
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { query?: string; city?: string; industry?: string };
}) {
  const searchQuery = searchParams?.query;
  const cityQuery = searchParams?.city;
  const industryQuery = searchParams?.industry;

  const leads = await getLeads(searchQuery, cityQuery, industryQuery);

  // Build active filters summary
  const activeFilters: string[] = [];
  if (searchQuery) activeFilters.push(`Name: "${searchQuery}"`);
  if (cityQuery) activeFilters.push(`City: "${cityQuery}"`);
  if (industryQuery && industryQuery !== 'all') activeFilters.push(`Industry: "${industryQuery}"`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Business Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search and browse Australian businesses
          </p>
        </div>
        <LeadsFilters />
      </div>

      {/* Active Filters Summary */}
      {activeFilters.length > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Active filters:</span>{' '}
          {activeFilters.join(' • ')}
        </div>
      )}

      {/* Results Summary */}
      {(searchQuery || cityQuery || (industryQuery && industryQuery !== 'all')) && (
        <div className="text-sm text-gray-600">
          {leads.length > 0
            ? `Found ${leads.length} result${leads.length === 1 ? '' : 's'}`
            : 'No results found'}
        </div>
      )}

      {/* Table */}
      <LeadsTable leads={leads} activeFilters={activeFilters} />
    </div>
  );
}
