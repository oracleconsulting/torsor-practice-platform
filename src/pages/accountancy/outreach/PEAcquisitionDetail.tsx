import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { PEAcquisition } from '@/types/outreach';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import PEAcquisitionForm from '@/components/accountancy/outreach/pe/PEAcquisitionForm';
import { ArrowLeft, Building2, Users, Calendar, PoundSterling, TrendingUp } from 'lucide-react';

const PEAcquisitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  const [acquisition, setAcquisition] = useState<PEAcquisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [extracting, setExtracting] = useState(false);
  const [researching, setResearching] = useState(false);

  useEffect(() => {
    loadAcquisition();
  }, [id, practice?.id]);

  const loadAcquisition = async () => {
    if (!id || !practice?.id) return;

    try {
      const acquisitions = await outreachService.getPEAcquisitions(practice.id);
      const found = acquisitions.find(a => a.id === id);
      if (found) {
        setAcquisition(found);
      } else {
        toast({
          title: 'Error',
          description: 'PE acquisition not found',
          variant: 'destructive',
        });
        navigate('/accountancy/outreach/pe');
      }
    } catch (error) {
      console.error('Error loading PE acquisition:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PE acquisition details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtractClients = async () => {
    if (!id) return;

    try {
      setExtracting(true);
      await outreachService.extractPEAcquisitionClients(id);
      toast({
        title: 'Success',
        description: 'Client extraction process started successfully',
      });
      loadAcquisition();
    } catch (error) {
      console.error('Error extracting clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to start client extraction process',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleResearch = async () => {
    if (!id) return;

    try {
      setResearching(true);
      await outreachService.researchPEAcquisition(id);
      toast({
        title: 'Success',
        description: 'Research process started successfully',
      });
      loadAcquisition();
    } catch (error) {
      console.error('Error starting research:', error);
      toast({
        title: 'Error',
        description: 'Failed to start research process',
        variant: 'destructive',
      });
    } finally {
      setResearching(false);
    }
  };

  if (loading) {
    return <div>Loading PE acquisition details...</div>;
  }

  if (!acquisition) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/accountancy/outreach/pe')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PE Monitor
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {acquisition.acquiring_firm}
            </h1>
            <p className="text-gray-500">
              Acquired {acquisition.target_firm}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleExtractClients}
            disabled={extracting || acquisition.status === 'completed'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Users className="h-4 w-4 mr-2" />
            {extracting ? 'Extracting...' : 'Extract Clients'}
          </Button>
          <Button
            onClick={handleResearch}
            disabled={researching || acquisition.status === 'completed'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {researching ? 'Researching...' : 'Research Prospects'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Sector</span>
              </div>
              <span className="text-sm">
                {acquisition.sector || 'Not specified'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Estimated Clients</span>
              </div>
              <span className="text-sm">{acquisition.estimated_clients}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PoundSterling className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Deal Value</span>
              </div>
              <span className="text-sm">
                {acquisition.deal_value || 'Not disclosed'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Acquisition Date</span>
              </div>
              <span className="text-sm">
                {new Date(acquisition.acquisition_date).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="clients">Extracted Clients</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Acquisition Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Status</h3>
                  <p className="text-gray-600 capitalize mt-1">
                    {acquisition.status}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Acquiring Firm
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {acquisition.acquiring_firm}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Target Firm
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {acquisition.target_firm}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Added
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {new Date(acquisition.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <PEAcquisitionForm
            acquisition={acquisition}
            onSuccess={loadAcquisition}
          />
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Extracted clients will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>Research Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Research insights will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PEAcquisitionDetail; 