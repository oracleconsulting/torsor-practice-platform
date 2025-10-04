import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Save, 
  Loader2,
  Users,
  Building2,
  Mail,
  TrendingUp
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from '@/components/ui/use-toast';

interface SearchFilters {
  query: string;
  status: string[];
  industry: string[];
  scoreRange: { min: number; max: number };
  dateRange: { start: string; end: string };
  hasResearch: boolean | null;
  peContext: boolean | null;
  entityType: ('prospect' | 'contact' | 'campaign' | 'pe_acquisition')[];
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

const AdvancedSearch: React.FC = () => {
  const { practice } = useAccountancyContext();
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    industry: [],
    scoreRange: { min: 0, max: 100 },
    dateRange: { start: '', end: '' },
    hasResearch: null,
    peContext: null,
    entityType: ['prospect']
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (practice?.id) {
      loadSavedSearches();
    }
  }, [practice?.id]);

  const loadSavedSearches = async () => {
    try {
      // This would load saved searches from the backend
      const saved = localStorage.getItem(`saved_searches_${practice?.id}`);
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleSearch = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);
      
      const searchOptions = {
        query: filters.query,
        filters: {
          type: filters.entityType,
          status: filters.status,
          industry: filters.industry,
          score: filters.scoreRange,
          dateRange: filters.dateRange.start && filters.dateRange.end ? filters.dateRange : undefined,
          hasResearch: filters.hasResearch,
          peContext: filters.peContext
        },
        limit: 50,
        offset: 0
      };

      const searchResults = await outreachService.searchAll(practice.id, searchOptions);
      setResults(searchResults.results || []);
      
      toast({
        title: 'Search Complete',
        description: `Found ${searchResults.results?.length || 0} results`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (!searchName) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
      created_at: new Date().toISOString()
    };

    const updatedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(updatedSearches);
    
    // Save to localStorage
    localStorage.setItem(`saved_searches_${practice?.id}`, JSON.stringify(updatedSearches));
    
    toast({
      title: 'Search Saved',
      description: `Search "${searchName}" has been saved.`,
    });
  };

  const loadSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    toast({
      title: 'Search Loaded',
      description: `Loaded search "${savedSearch.name}"`,
    });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      status: [],
      industry: [],
      scoreRange: { min: 0, max: 100 },
      dateRange: { start: '', end: '' },
      hasResearch: null,
      peContext: null,
      entityType: ['prospect']
    });
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'prospect': return <Users className="w-4 h-4" />;
      case 'contact': return <Users className="w-4 h-4" />;
      case 'campaign': return <Mail className="w-4 h-4" />;
      case 'pe_acquisition': return <TrendingUp className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'contact': return 'bg-green-100 text-green-800';
      case 'campaign': return 'bg-purple-100 text-purple-800';
      case 'pe_acquisition': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600 mt-1">
            Search across all outreach data with advanced filters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSearchMode(searchMode === 'simple' ? 'advanced' : 'simple')}
          >
            {searchMode === 'simple' ? 'Advanced Mode' : 'Simple Mode'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search prospects, contacts, campaigns..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Entity Type */}
              <div>
                <Label>Entity Type</Label>
                <Select
                  value={filters.entityType[0]}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    entityType: [value as any] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospects</SelectItem>
                    <SelectItem value="contact">Contacts</SelectItem>
                    <SelectItem value="campaign">Campaigns</SelectItem>
                    <SelectItem value="pe_acquisition">PE Acquisitions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status[0] || ''}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    status: value ? [value] : [] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="researched">Researched</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div>
                <Label>Industry</Label>
                <Select
                  value={filters.industry[0] || ''}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    industry: value ? [value] : [] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Score Range */}
              <div>
                <Label>Score Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.scoreRange.min}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, min: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.scoreRange.max}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, max: parseInt(e.target.value) || 100 }
                    })}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value }
                    })}
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Research Status */}
              <div>
                <Label>Research Status</Label>
                <Select
                  value={filters.hasResearch === null ? '' : filters.hasResearch.toString()}
                  onValueChange={(value) => setFilters({
                    ...filters,
                    hasResearch: value === '' ? null : value === 'true'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Has Research</SelectItem>
                    <SelectItem value="false">No Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button onClick={saveSearch} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search) => (
                <Badge
                  key={search.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => loadSearch(search)}
                >
                  {search.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getEntityColor(result.type)}`}>
                        {getEntityIcon(result.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {result.name || result.company_name || result.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {result.company || result.email || result.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{result.type}</Badge>
                          {result.status && (
                            <Badge variant="outline">{result.status}</Badge>
                          )}
                          {result.score && (
                            <Badge variant="outline">{result.score}% Match</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {results.length === 0 && !loading && filters.query && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch; 