import { getCompanyDbClient } from '@/lib/db/company-client';
import LeadsFilters from '@/components/leads/LeadsFilters';
import LeadsTable from '@/components/leads/LeadsTable';
import PaginationControls from '@/components/leads/PaginationControls';

interface Company {
  listing_id: string;
  company_name: string;
  category_name: string | null;
  email: string | null;
  phone_number: string | null;
  address_suburb: string | null;
  address_state: string | null;
  address_postcode: string | null;
}

async function getLeads(
  searchQuery?: string,
  cityQuery?: string,
  industryQuery?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ companies: Company[]; totalCount: number }> {
  const supabase = getCompanyDbClient();

  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Force no cache on the query
  let query = supabase
    .from('rawdata_yellowpage_new')
    .select('listing_id, company_name, category_name, email, phone_number, address_suburb, address_state, address_postcode', { count: 'exact' });

  // Apply search query filter (company_name)
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    query = query.ilike('company_name', searchTerm);
  }

  // Apply city filter (search in address_suburb)
  if (cityQuery && cityQuery.trim()) {
    const cityTerm = `%${cityQuery.trim()}%`;
    query = query.ilike('address_suburb', cityTerm);
  }

  // Apply industry filter (exact match on category_name)
  if (industryQuery && industryQuery.trim() && industryQuery !== 'all') {
    query = query.eq('category_name', industryQuery.trim());
  }

  // Apply pagination
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching leads:', error);
    return { companies: [], totalCount: 0 };
  }

  return { companies: data || [], totalCount: count || 0 };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { query?: string; city?: string; industry?: string; page?: string };
}) {
  const searchQuery = searchParams?.query;
  const cityQuery = searchParams?.city;
  const industryQuery = searchParams?.industry;

  // Parse page from URL params (default to 1)
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const pageSize = 50; // Fixed page size

  const { companies, totalCount } = await getLeads(searchQuery, cityQuery, industryQuery, currentPage, pageSize);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

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

      {/* Results Summary with Pagination Info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalCount > 0 ? (
            <>
              Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalCount.toLocaleString()} results
              {totalPages > 1 && (
                <span className="ml-2 text-gray-500">(Page {currentPage} of {totalPages})</span>
              )}
            </>
          ) : (
            'No results found'
          )}
        </div>
      </div>

      {/* Table */}
      <LeadsTable leads={companies} activeFilters={activeFilters} />

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}
