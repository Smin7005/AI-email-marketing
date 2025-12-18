'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface BusinessSearchInputProps {
  onSearch: (params: {
    search?: string;
    cities?: string[];
    industries?: string[];
  }) => void;
  availableCities: string[];
  availableIndustries: string[];
}

export function BusinessSearchInput({ onSearch, availableCities, availableIndustries }: BusinessSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCities, selectedIndustries]);

  const handleSearch = () => {
    onSearch({
      search: searchTerm || undefined,
      cities: selectedCities.length > 0 ? selectedCities : undefined,
      industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
    });
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedIndustries([]);
    setSearchTerm('');
  };

  const hasActiveFilters = selectedCities.length > 0 || selectedIndustries.length > 0 || searchTerm;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search businesses by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {selectedCities.length + selectedIndustries.length + (searchTerm ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Cities</h3>
                {selectedCities.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCities([])}
                    className="h-auto p-1 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCities.map((city) => (
                  <Badge
                    key={city}
                    variant={selectedCities.includes(city) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Industries</h3>
                {selectedIndustries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIndustries([])}
                    className="h-auto p-1 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableIndustries.map((industry) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}