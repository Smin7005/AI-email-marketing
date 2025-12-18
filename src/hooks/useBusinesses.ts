import { useQuery } from '@tanstack/react-query';

export interface Business {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  state: string;
  postcode: string;
  industry: string;
  employeeCount: string | null;
  annualRevenue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSearchParams {
  city?: string[];
  industry?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface BusinessSearchResult {
  businesses: Business[];
  total: number;
  page: number;
  totalPages: number;
}

async function fetchBusinesses(params: BusinessSearchParams = {}): Promise<BusinessSearchResult> {
  const searchParams = new URLSearchParams();

  if (params.city?.length) {
    params.city.forEach(city => searchParams.append('city', city));
  }

  if (params.industry?.length) {
    params.industry.forEach(industry => searchParams.append('industry', industry));
  }

  if (params.search) {
    searchParams.append('search', params.search);
  }

  if (params.page) {
    searchParams.append('page', params.page.toString());
  }

  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const response = await fetch(`/api/businesses?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }

  return response.json();
}

export function useBusinesses(params: BusinessSearchParams = {}) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => fetchBusinesses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}