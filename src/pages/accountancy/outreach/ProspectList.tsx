import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/accountancy/outreach/search/SearchBar';
import { SearchFilters } from '@/components/accountancy/outreach/search/SearchFilters';
import { SearchResults } from '@/components/accountancy/outreach/search/SearchResults';

interface Prospect {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  prospect_score?: number;
  status?: string;
  research_completed?: boolean;
  created_at: string;
}

export default function ProspectList() {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadProspects();
  }, [practice?.id, filters]);

  const loadProspects = async () => {
    try {
      const response = await fetch(`/api/accountancy/outreach/prospects?practice_id=${practice?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        throw new Error('Failed to load prospects');
      }

      const data = await response.json();
      setProspects(data.prospects);
    } catch (error) {
      console.error('Error loading prospects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prospects. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/accountancy/outreach/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          filters: { ...filters, type: ['prospect'] },
          practice_id: practice?.id
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setProspects(data.results);
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
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleView = (prospect: any) => {
    navigate(`/accountancy/outreach/prospects/${prospect.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-500 mt-1">Manage and track your prospects</p>
        </div>
        <Button onClick={() => navigate('/accountancy/outreach/prospects/generate')}>
          Generate Prospects
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-6">
        <div className="w-64">
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={() => setFilters({})}
          />
        </div>

        <div className="flex-1 space-y-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search prospects..."
            className="max-w-3xl"
          />

          <SearchResults
            results={prospects.map(p => ({
              id: p.id,
              type: 'prospect',
              name: p.company_name,
              description: `${p.industry || ''} - ${p.location || ''}`,
              score: p.prospect_score,
              location: p.location,
              industry: p.industry,
              status: p.status
            }))}
            loading={loading}
            onView={handleView}
          />
        </div>
      </div>
    </div>
  );
} 