import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  AlertCircle,
  Users,
  ChevronDown
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import ProspectCard from './ProspectCard';
import { toast } from '@/components/ui/use-toast';

interface Prospect {
  id: string;
  practice_id: string;
  name: string;
  company: string;
  position?: string;
  industry?: string;
  score?: number;
  status: 'new' | 'researched' | 'contacted' | 'responded' | 'converted';
  personalization_data?: {
    opening_hook?: string;
    pe_context?: string;
    research_insights?: string[];
  };
  created_at: string;
  updated_at: string;
}

const ProspectList: React.FC = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (practice?.id) {
      loadProspects();
    }
  }, [practice?.id]);

  const loadProspects = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await outreachService.getProspects(practice.id);
      setProspects(data || []);
    } catch (err) {
      console.error('Error loading prospects:', err);
      setError('Failed to load prospects');
      toast({
        title: 'Error',
        description: 'Failed to load prospects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutreach = async (prospectId: string) => {
    try {
      setGeneratingIds(prev => new Set(prev).add(prospectId));
      
      const result = await outreachService.generateProspectOutreach(prospectId);
      
      toast({
        title: 'Outreach Generated',
        description: 'Personalized outreach content has been created.',
      });
      
      // Navigate to the outreach view or show in a modal
      navigate(`/accountancy/outreach/prospects/${prospectId}?tab=outreach`);
    } catch (err) {
      console.error('Error generating outreach:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate outreach content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(prospectId);
        return newSet;
      });
    }
  };

  const handleViewDetails = (prospectId: string) => {
    navigate(`/accountancy/outreach/prospects/${prospectId}`);
  };

  // Get unique industries from prospects
  const industries = useMemo(() => {
    const uniqueIndustries = new Set(prospects.map(p => p.industry).filter(Boolean));
    return Array.from(uniqueIndustries).sort();
  }, [prospects]);

  // Filter and sort prospects
  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.company.toLowerCase().includes(search) ||
        p.position?.toLowerCase().includes(search) ||
        p.industry?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(p => p.industry === industryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'score_desc':
          return (b.score || 0) - (a.score || 0);
        case 'score_asc':
          return (a.score || 0) - (b.score || 0);
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [prospects, searchTerm, statusFilter, industryFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: prospects.length,
      new: prospects.filter(p => p.status === 'new').length,
      researched: prospects.filter(p => p.status === 'researched').length,
      contacted: prospects.filter(p => p.status === 'contacted').length,
      responded: prospects.filter(p => p.status === 'responded').length,
      converted: prospects.filter(p => p.status === 'converted').length,
      averageScore: prospects.length > 0
        ? Math.round(prospects.reduce((sum, p) => sum + (p.score || 0), 0) / prospects.length)
        : 0
    };
  }, [prospects]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading prospects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Prospects</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadProspects} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-600 mt-1">
            Manage and engage with potential clients
          </p>
        </div>
        <Button onClick={() => navigate('/accountancy/outreach/prospects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Prospect
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            <p className="text-sm text-gray-600">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.researched}</p>
            <p className="text-sm text-gray-600">Researched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
            <p className="text-sm text-gray-600">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.responded}</p>
            <p className="text-sm text-gray-600">Responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
            <p className="text-sm text-gray-600">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.averageScore}%</p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="researched">Researched</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Industry</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_desc">Newest First</SelectItem>
                      <SelectItem value="created_asc">Oldest First</SelectItem>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="score_desc">Highest Score</SelectItem>
                      <SelectItem value="score_asc">Lowest Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prospects Grid */}
      {filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' || industryFilter !== 'all'
                  ? 'No prospects found'
                  : 'No prospects yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || industryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first prospect'}
              </p>
              {!searchTerm && statusFilter === 'all' && industryFilter === 'all' && (
                <Button onClick={() => navigate('/accountancy/outreach/prospects/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Prospect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProspects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onGenerateOutreach={(id) => {
                if (!generatingIds.has(id)) {
                  handleGenerateOutreach(id);
                }
              }}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProspectList;