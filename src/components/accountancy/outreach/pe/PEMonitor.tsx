import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Building2, Users, Loader2, AlertCircle } from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from '@/components/ui/use-toast';

interface PEAcquisition {
  id: string;
  acquiring_firm: string;
  target_firm: string;
  acquisition_date: string;
  estimated_clients: number;
  status: 'new' | 'processing' | 'extracted' | 'completed';
  deal_value?: string;
  sector?: string;
}

const PEMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const [acquisitions, setAcquisitions] = useState<PEAcquisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (practice?.id) {
      loadAcquisitions();
    }
  }, [practice?.id]);

  const loadAcquisitions = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Call the real API endpoint
      const data = await outreachService.getPEAcquisitions(practice.id);
      setAcquisitions(data || []);
    } catch (err) {
      console.error('Error loading PE acquisitions:', err);
      setError('Failed to load PE acquisitions');
      toast({
        title: 'Error',
        description: 'Failed to load PE acquisitions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      extracted: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleExtractClients = async (acquisitionId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(acquisitionId));
      
      // Call the real API endpoint
      await outreachService.extractPEAcquisitionClients(acquisitionId);
      
      toast({
        title: 'Client Extraction Started',
        description: 'The client extraction process has been initiated.',
      });
      
      // Refresh the acquisitions list
      await loadAcquisitions();
      
      // Navigate to the extraction view
      navigate(`/accountancy/outreach/pe/${acquisitionId}/extract`);
    } catch (err) {
      console.error('Error extracting clients:', err);
      toast({
        title: 'Error',
        description: 'Failed to start client extraction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(acquisitionId);
        return newSet;
      });
    }
  };

  const handleResearchProspects = async (acquisitionId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(acquisitionId));
      
      // Call the real API endpoint
      await outreachService.researchPEAcquisition(acquisitionId);
      
      toast({
        title: 'Research Started',
        description: 'Prospect research has been initiated.',
      });
      
      // Refresh the acquisitions list
      await loadAcquisitions();
      
      // Navigate to the research view
      navigate(`/accountancy/outreach/pe/${acquisitionId}/research`);
    } catch (err) {
      console.error('Error researching prospects:', err);
      toast({
        title: 'Error',
        description: 'Failed to start prospect research. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(acquisitionId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PE Acquisition Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading acquisitions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PE Acquisition Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Acquisitions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAcquisitions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>PE Acquisition Monitor</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/accountancy/outreach/pe/analytics')}
          >
            View Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {acquisitions.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent acquisitions</h3>
              <p className="mt-1 text-sm text-gray-500">
                New PE acquisitions will appear here when detected
              </p>
            </div>
          ) : (
            acquisitions.map((acquisition) => (
              <div
                key={acquisition.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {acquisition.acquiring_firm}
                    </h3>
                    <p className="text-sm text-gray-600">
                      acquired {acquisition.target_firm}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(acquisition.status)}`}>
                    {acquisition.status.charAt(0).toUpperCase() + acquisition.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 my-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {acquisition.estimated_clients} potential clients
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Building2 className="h-4 w-4 mr-1" />
                    {acquisition.sector}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
                      onClick={() => handleExtractClients(acquisition.id)}
                      disabled={processingIds.has(acquisition.id)}
                    >
                      {processingIds.has(acquisition.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Extract Clients
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                      onClick={() => handleResearchProspects(acquisition.id)}
                      disabled={processingIds.has(acquisition.id)}
                    >
                      {processingIds.has(acquisition.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Research Prospects
                    </Button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(acquisition.acquisition_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}

          {acquisitions.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{acquisitions.length} acquisitions this month</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => navigate('/accountancy/outreach/pe/analytics')}
                >
                  View Analytics
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PEMonitor; 