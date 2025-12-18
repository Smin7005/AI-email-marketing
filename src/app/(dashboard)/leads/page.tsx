'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BusinessSearchInput } from '@/components/businesses/BusinessSearchInput';
import BusinessList from '@/components/businesses/BusinessList';
import { useBusinesses } from '@/hooks/useBusinesses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuotaDisplay } from '@/components/quota/QuotaDisplay';

// Mock data for available cities and industries
// In a real app, these would come from an API
const AVAILABLE_CITIES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
  'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Geelong'
];

const AVAILABLE_INDUSTRIES = [
  'IT Services', 'Cleaning Services', 'Digital Marketing', 'Accounting',
  'Legal Services', 'Consulting', 'Web Development', 'Graphic Design',
  'Photography', 'Event Planning', 'Real Estate', 'Insurance',
  'Recruitment', 'Training', 'Printing', 'Catering'
];

export default function BusinessesPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    search: '',
    cities: [] as string[],
    industries: [] as string[],
    page: 1,
    limit: 10,
  });
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useBusinesses(searchParams);

  const handleSearch = (params: {
    search?: string;
    cities?: string[];
    industries?: string[];
  }) => {
    setSearchParams(prev => ({
      ...prev,
      ...params,
      page: 1, // Reset to first page on new search
    }));
    setSelectedBusinesses(new Set()); // Clear selection on new search
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const toggleBusiness = (id: number) => {
    setSelectedBusinesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (data?.businesses) {
      setSelectedBusinesses(new Set(data.businesses.map(b => b.id)));
    }
  };

  const deselectAll = () => {
    setSelectedBusinesses(new Set());
  };

  const handleCreateCampaign = () => {
    if (selectedBusinesses.size === 0) {
      alert('Please select at least one business to create a campaign.');
      return;
    }

    // Store selected businesses in session storage or pass via URL
    const selectedIds = Array.from(selectedBusinesses);
    sessionStorage.setItem('selectedBusinesses', JSON.stringify(selectedIds));

    // Navigate to campaign creation page
    router.push('/campaigns/create');
  };

  const totalBusinesses = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Create safe local variables to prevent undefined access
  const safeCities = Array.isArray(searchParams?.cities) ? searchParams.cities : (searchParams?.cities ? [searchParams.cities] : []);
  const safeIndustries = Array.isArray(searchParams?.industries) ? searchParams.industries : (searchParams?.industries ? [searchParams.industries] : []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Find Business Leads</h1>
          {selectedBusinesses.size > 0 && (
            <Button onClick={handleCreateCampaign}>
              <Mail className="w-4 h-4 mr-2" />
              Create Campaign ({selectedBusinesses.size} selected)
            </Button>
          )}
        </div>
        <p className="text-gray-600">
          Search and filter Australian businesses to create targeted email campaigns
        </p>
      </div>

      {/* Quota Display Widget */}
      <div className="mb-6">
        <QuotaDisplay />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessSearchInput
            onSearch={handleSearch}
            availableCities={AVAILABLE_CITIES}
            availableIndustries={AVAILABLE_INDUSTRIES}
          />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {totalBusinesses > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Found {totalBusinesses.toLocaleString()} businesses
            {searchParams.search && ` matching "${searchParams.search}"`}
            {safeCities.length > 0 && ` in ${safeCities.join(', ')}`}
            {safeIndustries.length > 0 && ` in ${safeIndustries.join(', ')}`}
          </p>
        </div>
      )}

      <BusinessList
        businesses={data?.businesses || []}
        loading={isLoading}
        error={error}
        selectedBusinesses={selectedBusinesses}
        onToggleBusiness={toggleBusiness}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        currentPage={searchParams.page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}