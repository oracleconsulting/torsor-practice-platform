// src/components/accountancy/outreach/search/EnhancedSearch.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Download, 
  X, 
  ChevronDown, 
  ChevronUp,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from 'sonner';

interface SearchSuggestion {
  type: 'prospect' | 'company' | 'industry';
  text: string;
  secondary?: string;
  score?: number;
}

interface Prospect {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  prospect_score: number;
  status: string;
  research_completed: boolean;
  created_at: string;
  last_contacted_at?: string;
}

interface SearchFilters {
  status?: string;
  brand_target?: string;
  source?: string;
  research_completed?: boolean;
  min_score?: number;
  max_score?: number;
  industry?: string;
  location?: string;
  created_after?: string;
  created_before?: string;
  last_contacted_after?: string;
  last_contacted_before?: string;
  has_email?: boolean;
  has_phone?: boolean;
  has_linkedin?: boolean;
  employee_count_min?: number;
  employee_count_max?: number;
  turnover_range?: string[];
  tags?: string[];
  exclude_tags?: string[];
}

const EnhancedSearch: React.FC = () => {
  const { practice } = useAccountancyContext();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [searchStats, setSearchStats] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (practice?.id) {
      loadSearchFilters();
      loadSearchStats();
    }
  }, [practice?.id]);

  useEffect(() => {
    if (query.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        getSearchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const loadSearchFilters = async () => {
    try {
      const filters = await outreachService.getSearchFilters();
      setAvailableFilters(filters);
    } catch (error) {
      console.error('Failed to load search filters:', error);
    }
  };

  const loadSearchStats = async () => {
    try {
      const stats = await outreachService.getSearchStats();
      setSearchStats(stats);
    } catch (error) {
      console.error('Failed to load search stats:', error);
    }
  };

  const getSearchSuggestions = async () => {
    try {
      const suggestions = await outreachService.getSearchSuggestions(query);
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
    }
  };

  const performSearch = async (pageNum: number = 1) => {
    if (!practice?.id) return;

    setLoading(true);
    try {
      const searchRequest: SearchFilters = {
        query: query || undefined,
        ...filters
      };

      const response = await outreachService.advancedSearch(
        practice.id,
        searchRequest,
        pageNum,
        20,
        'created_at',
        'desc'
      );

      setResults(response.data);
      setTotalPages(response.total_pages);
      setTotalResults(response.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportResults = async (format: 'csv' | 'json' = 'csv') => {
    if (!practice?.id) return;

    try {
      const searchRequest: SearchFilters = {
        query: query || undefined,
        ...filters
      };

      await outreachService.exportSearchResults(
        practice.id,
        searchRequest,
        format
      );

      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Search</h2>
        {searchStats && (
          <div className="flex space-x-4 text-sm text-gray-600">
            <span>{searchStats.total_prospects} total prospects</span>
            <span>{searchStats.recent_activity.last_7_days} added this week</span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search prospects, companies, industries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button onClick={() => performSearch()}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
            <ScrollArea className="max-h-60">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-3">
                    {suggestion.type === 'prospect' && <User className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'company' && <Building className="w-4 h-4 text-green-500" />}
                    {suggestion.type === 'industry' && <Tag className="w-4 h-4 text-purple-500" />}
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.text}</div>
                      {suggestion.secondary && (
                        <div className="text-sm text-gray-500">{suggestion.secondary}</div>
                      )}
                    </div>
                    {suggestion.score && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.score}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Advanced Filters</span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">All Statuses</option>
                  {availableFilters?.statuses?.map((status: string) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Score Range */}
              <div>
                <label className="text-sm font-medium">Score Range</label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.min_score || ''}
                    onChange={(e) => handleFilterChange('min_score', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.max_score || ''}
                    onChange={(e) => handleFilterChange('max_score', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="text-sm font-medium">Industry</label>
                <select
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  value={filters.industry || ''}
                  onChange={(e) => handleFilterChange('industry', e.target.value || undefined)}
                >
                  <option value="">All Industries</option>
                  {availableFilters?.industries?.map((industry: string) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Research Completed */}
              <div>
                <label className="text-sm font-medium">Research Status</label>
                <select
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  value={filters.research_completed?.toString() || ''}
                  onChange={(e) => handleFilterChange('research_completed', e.target.value === 'true')}
                >
                  <option value="">All</option>
                  <option value="true">Research Completed</option>
                  <option value="false">Research Pending</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  type="text"
                  placeholder="City, Region, etc."
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                />
              </div>

              {/* Contact Info */}
              <div>
                <label className="text-sm font-medium">Contact Info</label>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.has_email || false}
                      onChange={(e) => handleFilterChange('has_email', e.target.checked)}
                    />
                    <span className="text-sm">Has Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.has_phone || false}
                      onChange={(e) => handleFilterChange('has_phone', e.target.checked)}
                    />
                    <span className="text-sm">Has Phone</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results ({totalResults} found)</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportResults('csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportResults('json')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((prospect) => (
                <div key={prospect.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{prospect.company_name}</h3>
                        <Badge className={getScoreColor(prospect.prospect_score)}>
                          Score: {prospect.prospect_score}
                        </Badge>
                        <Badge variant={prospect.research_completed ? 'default' : 'secondary'}>
                          {prospect.research_completed ? 'Researched' : 'Pending Research'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        {prospect.industry && (
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{prospect.industry}</span>
                          </div>
                        )}
                        {prospect.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{prospect.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Added {new Date(prospect.created_at).toLocaleDateString()}</span>
                        </div>
                        {prospect.last_contacted_at && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>Contacted {new Date(prospect.last_contacted_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Research
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => performSearch(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => performSearch(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Searching...</span>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch; 