import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { savedProspectsService, SavedProspect } from '../../../services/accountancy/savedProspectsService';
import { ProspectDetailsModal } from './ProspectDetailsModal';
import { toast } from 'sonner';

export default function SavedProspectsPage() {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<SavedProspect[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [selectedProspectForDetails, setSelectedProspectForDetails] = useState<SavedProspect | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyStatusFilter, setCompanyStatusFilter] = useState<string>('all');
  const [researchFilter, setResearchFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadProspects();
  }, [page, searchTerm, statusFilter, companyStatusFilter, researchFilter]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const filters = {
        search_term: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        company_status: companyStatusFilter !== 'all' ? companyStatusFilter : undefined,
        research_completed: researchFilter === 'completed' ? true : researchFilter === 'pending' ? false : undefined
      };
      
      const result = await savedProspectsService.getSavedProspects(
        'practice-123', // TODO: Get from context
        filters,
        page,
        pageSize
      );
      
      setProspects(result.items);
      setTotalPages(result.total_pages);
    } catch (error) {
      console.error('Error loading prospects:', error);
      toast.error('Failed to load saved prospects');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProspect = (prospectId: string) => {
    const newSelected = new Set(selectedProspects);
    if (newSelected.has(prospectId)) {
      newSelected.delete(prospectId);
    } else {
      newSelected.add(prospectId);
    }
    setSelectedProspects(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.map(p => p.id)));
    }
  };

  const handleBulkResearch = async () => {
    if (selectedProspects.size === 0) {
      toast.error('Please select prospects first');
      return;
    }

    try {
      setLoading(true);
      toast.info(`Researching ${selectedProspects.size} companies... This may take a few minutes.`);
      
      let completed = 0;
      for (const prospectId of Array.from(selectedProspects)) {
        await savedProspectsService.conductAIResearch(prospectId);
        completed++;
        toast.info(`Researched ${completed}/${selectedProspects.size} companies`);
      }
      
      toast.success(`Research completed for ${selectedProspects.size} companies!`);
      loadProspects();
      setSelectedProspects(new Set());
    } catch (error) {
      console.error('Error conducting bulk research:', error);
      toast.error('Failed to complete research');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCampaign = () => {
    if (selectedProspects.size === 0) {
      toast.error('Please select prospects first');
      return;
    }
    
    // Navigate to campaign creation with selected prospects
    navigate('/outreach/campaigns/new', { 
      state: { prospectIds: Array.from(selectedProspects) } 
    });
  };

  const handleViewDetails = async (prospect: SavedProspect) => {
    setSelectedProspectForDetails(prospect);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      researching: { color: 'bg-yellow-100 text-yellow-800', label: 'Researching' },
      qualified: { color: 'bg-green-100 text-green-800', label: 'Qualified' },
      contacted: { color: 'bg-purple-100 text-purple-800', label: 'Contacted' },
      unqualified: { color: 'bg-gray-100 text-gray-800', label: 'Unqualified' }
    };
    
    const config = statusMap[status] || statusMap.new;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              Saved Prospects
            </h1>
            <p className="text-gray-600 mt-1">
              {prospects.length} prospects • {selectedProspects.size} selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/outreach/research')}
              variant="outline"
            >
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Find More
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by company name, address, postcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prospect Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={companyStatusFilter} onValueChange={setCompanyStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Company Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="liquidation">In Liquidation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={researchFilter} onValueChange={setResearchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Research Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Research</SelectItem>
                  <SelectItem value="completed">Researched</SelectItem>
                  <SelectItem value="pending">Not Researched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedProspects.size > 0 && (
          <Card className="mt-4 border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {selectedProspects.size} prospect{selectedProspects.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkResearch}
                    size="sm"
                    disabled={loading}
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Research Selected
                  </Button>
                  <Button
                    onClick={handleSendToCampaign}
                    size="sm"
                    variant="outline"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Send to Campaign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prospects Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedProspects.size === prospects.length && prospects.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Research</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading prospects...
                    </td>
                  </tr>
                ) : prospects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No prospects saved yet. Start by <button onClick={() => navigate('/outreach/research')} className="text-blue-600 hover:underline">finding companies</button>.
                    </td>
                  </tr>
                ) : (
                  prospects.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedProspects.has(prospect.id)}
                          onCheckedChange={() => handleSelectProspect(prospect.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{prospect.company_name}</div>
                          <div className="text-sm text-gray-500">{prospect.company_number}</div>
                          {prospect.registered_office_address && (
                            <div className="text-xs text-gray-400 mt-1">
                              {prospect.registered_office_address.postal_code}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(prospect.status || 'new')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          prospect.company_status === 'active' ? 'border-green-500 text-green-700' :
                          prospect.company_status === 'dormant' ? 'border-gray-500 text-gray-700' :
                          'border-red-500 text-red-700'
                        }>
                          {prospect.company_status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {prospect.research_completed ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            <span className="text-sm">Complete</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(prospect.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(prospect)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prospect Details Modal */}
      {selectedProspectForDetails && (
        <ProspectDetailsModal
          prospectId={selectedProspectForDetails.id}
          companyData={selectedProspectForDetails}
          onClose={() => setSelectedProspectForDetails(null)}
          onResearchComplete={() => {
            loadProspects(); // Refresh list after research
          }}
        />
      )}
    </div>
  );
}

