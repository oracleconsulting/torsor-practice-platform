import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, Users, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useAccountancyContext } from '../../contexts/AccountancyContext';

interface RescueCase {
  id: string;
  clientName: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedTo?: string;
  estimatedResolution?: string;
}

export default function ClientRescues() {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const [rescueCases, setRescueCases] = useState<RescueCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadRescueCases();
  }, [practice?.id]);

  const loadRescueCases = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockCases: RescueCase[] = [
        {
          id: '1',
          clientName: 'TechStart Ltd',
          issue: 'MTD compliance issues - software integration problems',
          priority: 'high',
          status: 'open',
          createdAt: '2024-01-15',
          assignedTo: 'James Howard',
          estimatedResolution: '2024-01-20'
        },
        {
          id: '2',
          clientName: 'Retail Solutions Ltd',
          issue: 'Cash flow crisis - need emergency funding advice',
          priority: 'high',
          status: 'in_progress',
          createdAt: '2024-01-14',
          assignedTo: 'Sarah Wilson',
          estimatedResolution: '2024-01-18'
        },
        {
          id: '3',
          clientName: 'Construction Co Ltd',
          issue: 'HMRC investigation - VAT compliance review',
          priority: 'medium',
          status: 'open',
          createdAt: '2024-01-13',
          assignedTo: 'Mike Johnson',
          estimatedResolution: '2024-01-25'
        }
      ];
      
      setRescueCases(mockCases);
    } catch (error) {
      console.error('Error loading rescue cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredCases = rescueCases.filter(case_ => 
    filter === 'all' || case_.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase text-[#1a2b4a] mb-2">CLIENT RESCUES</h1>
          <p className="text-[#1a2b4a]/60 font-bold uppercase">Emergency client support & crisis management</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/accountancy/complaints/new')}
            className="border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rescue Case
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-4 border-[#ff6b35] bg-[#1a2b4a] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{rescueCases.length}</div>
            <p className="text-xs text-white/80 mt-1">Active rescue operations</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-red-500 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {rescueCases.filter(c => c.priority === 'high').length}
            </div>
            <p className="text-xs text-red-600 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-orange-500 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {rescueCases.filter(c => c.status === 'in_progress').length}
            </div>
            <p className="text-xs text-orange-600 mt-1">Being actively resolved</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-green-500 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {rescueCases.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-green-600 mt-1">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Cases' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            onClick={() => setFilter(tab.key as any)}
            className={filter === tab.key ? 'bg-[#ff6b35] text-white' : 'border-[#ff6b35] text-[#ff6b35]'}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map(case_ => (
          <Card key={case_.id} className="border-2 border-[#1a2b4a]/20 hover:border-[#ff6b35] transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-[#1a2b4a]">{case_.clientName}</h3>
                    <Badge className={getPriorityColor(case_.priority)}>
                      {case_.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(case_.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(case_.status)}
                        <span>{case_.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{case_.issue}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Created: {new Date(case_.createdAt).toLocaleDateString()}</span>
                    {case_.assignedTo && <span>Assigned to: {case_.assignedTo}</span>}
                    {case_.estimatedResolution && (
                      <span>ETA: {new Date(case_.estimatedResolution).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/accountancy/complaints/${case_.id}`)}
                    className="border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/accountancy/complaints/${case_.id}/edit`)}
                    className="border-[#1a2b4a] text-[#1a2b4a] hover:bg-[#1a2b4a] hover:text-white"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <Card className="border-2 border-dashed border-[#1a2b4a]/30">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-[#1a2b4a]/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1a2b4a] mb-2">No rescue cases found</h3>
            <p className="text-[#1a2b4a]/60 mb-4">
              {filter === 'all' 
                ? 'No client rescue cases have been created yet.'
                : `No cases with status "${filter.replace('_', ' ')}" found.`
              }
            </p>
            <Button
              onClick={() => navigate('/accountancy/complaints/new')}
              className="bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Case
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 