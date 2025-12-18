'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Business } from '@/hooks/useBusinesses';

interface BusinessListProps {
  businesses: Business[];
  loading: boolean;
  error: Error | null;
  selectedBusinesses: Set<number>;
  onToggleBusiness: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BusinessList({
  businesses,
  loading,
  error,
  selectedBusinesses,
  onToggleBusiness,
  onSelectAll,
  onDeselectAll,
  currentPage,
  totalPages,
  onPageChange,
}: BusinessListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-red-600">
            <p className="font-medium">Error loading businesses</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No businesses found matching your criteria.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters.</p>
        </CardContent>
      </Card>
    );
  }

  const allSelected = businesses.length > 0 && businesses.every(b => selectedBusinesses.has(b.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={allSelected ? onDeselectAll : onSelectAll}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">
            {allSelected ? 'Deselect all' : 'Select all'} ({businesses.length} businesses)
          </span>
        </div>
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="space-y-4">
        {businesses.map((business) => (
          <Card key={business.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBusinesses.has(business.id)}
                    onChange={() => onToggleBusiness(business.id)}
                    className="rounded border-gray-300 mt-1"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription>
                      {business.industry} • {business.city}, {business.state}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{business.industry}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {business.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{business.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {business.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${business.email}`} className="hover:underline">
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Visit website
                    </a>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{business.phone}</span>
                  </div>
                )}

                {business.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  onClick={() => onPageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default BusinessList;