import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/accountancy/outreach/search/SearchBar';
import { SearchResults } from '@/components/accountancy/outreach/search/SearchResults';
import { SearchFilters, SearchFilters as SearchFiltersType } from '@/components/accountancy/outreach/search/SearchFilters';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useToast } from '@/hooks/useToast';

interface SearchResult {
  id: string;
  type: 'prospect' | 'company' | 'pe_acquisition';
  name: string;
  description?: string;
  score?: number;
  location?: string;
  industry?: string;
  company_number?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export default function Search() {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/accountancy/outreach/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          filters,
          practice_id: practice?.id
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, practice?.id, toast]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({});
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  // Handle importing a company as a prospect
  const handleImport = useCallback(async (result: SearchResult) => {
    try {
      const response = await fetch('/api/accountancy/outreach/prospects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_number: result.company_number,
          practice_id: practice?.id
        })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      toast({
        title: 'Company Imported',
        description: 'The company has been imported as a prospect.',
        variant: 'default'
      });

      // Navigate to the new prospect
      navigate(`/accountancy/outreach/prospects/${data.id}`);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing the company. Please try again.',
        variant: 'destructive'
      });
    }
  }, [practice?.id, navigate, toast]);

  // Handle viewing a result
  const handleView = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'prospect':
        navigate(`/accountancy/outreach/prospects/${result.id}`);
        break;
      case 'company':
        window.open(`https://find-and-update.company-information.service.gov.uk/company/${result.company_number}`, '_blank');
        break;
      case 'pe_acquisition':
        navigate(`/accountancy/outreach/pe-monitor/${result.id}`);
        break;
    }
  }, [navigate]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-500">
            Search across prospects, companies, and PE acquisitions
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={(query) => {
            setSearchTerm(query);
            handleSearch(query);
          }}
          className="max-w-3xl"
        />

        <div className="flex gap-6">
          {/* Filters */}
          <div className="w-64">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            <SearchResults
              results={results}
              loading={loading}
              onImport={handleImport}
              onView={handleView}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 