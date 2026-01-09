'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';

export default function LeadsFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(searchParams?.get('query') || '');
  const [cityValue, setCityValue] = useState(searchParams?.get('city') || '');
  const [industryValue, setIndustryValue] = useState(searchParams?.get('industry') || '');

  // Track previous values to detect actual filter changes
  const prevSearchValue = useRef(searchValue);
  const prevCityValue = useRef(cityValue);
  const prevIndustryValue = useRef(industryValue);

  // Update state when searchParams change (from external navigation)
  useEffect(() => {
    setSearchValue(searchParams?.get('query') || '');
  }, [searchParams]);

  useEffect(() => {
    setCityValue(searchParams?.get('city') || '');
  }, [searchParams]);

  useEffect(() => {
    setIndustryValue(searchParams?.get('industry') || '');
  }, [searchParams]);

  // Only update URL when filter values actually change (not on external navigation)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if any filter value actually changed
      const searchChanged = searchValue !== prevSearchValue.current;
      const cityChanged = cityValue !== prevCityValue.current;
      const industryChanged = industryValue !== prevIndustryValue.current;

      // If no filter changed, don't update URL (prevents page reset on pagination)
      if (!searchChanged && !cityChanged && !industryChanged) {
        return;
      }

      const params = new URLSearchParams(window.location.search);

      // Reset page to 1 only when filters actually change
      if (searchChanged || cityChanged || industryChanged) {
        params.delete('page');
      }

      // Update query parameter
      if (searchValue) {
        params.set('query', searchValue);
      } else {
        params.delete('query');
      }

      // Update city parameter
      if (cityValue) {
        params.set('city', cityValue);
      } else {
        params.delete('city');
      }

      // Update industry parameter
      if (industryValue && industryValue !== 'all') {
        params.set('industry', industryValue);
      } else {
        params.delete('industry');
      }

      router.push(`${pathname}?${params.toString()}`);

      // Update previous values
      prevSearchValue.current = searchValue;
      prevCityValue.current = cityValue;
      prevIndustryValue.current = industryValue;
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, cityValue, industryValue, pathname, router]);

  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'Accountants & Auditors', label: 'Accountants & Auditors' },
    { value: 'Lawyers & Solicitors', label: 'Lawyers & Solicitors' },
    { value: 'Butchers Shop', label: 'Butchers Shop' },
    { value: 'Supermarkets & Grocery Stores', label: 'Supermarkets & Grocery Stores' },
    { value: 'Builders & Building Contractors', label: 'Builders & Building Contractors' },
    { value: 'Air Conditioning Installation & Service', label: 'Air Conditioning Installation & Service' },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search company name..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* City Input */}
      <div className="relative w-full sm:max-w-xs">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="City (e.g., Adelaide)"
          value={cityValue}
          onChange={(e) => setCityValue(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Industry Dropdown */}
      <div className="relative w-full sm:max-w-xs">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <select
          value={industryValue || 'all'}
          onChange={(e) => setIndustryValue(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
        >
          {industries.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
