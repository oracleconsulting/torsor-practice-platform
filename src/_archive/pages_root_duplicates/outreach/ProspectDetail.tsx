import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { Prospect } from '@/types/outreach';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import ProspectForm from '@/components/accountancy/outreach/prospects/ProspectForm';
import { ArrowLeft, Mail, Building2, Users, TrendingUp, Calendar } from 'lucide-react';

const ProspectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadProspect();
  }, [id, practice?.id]);

  const loadProspect = async () => {
    if (!id || !practice?.id) return;

    try {
      const prospects = await outreachService.getProspects(practice.id);
      const found = prospects.find((p: Prospect) => p.id === id);
      if (found) {
        setProspect(found);
      } else {
        toast({
          title: 'Error',
          description: 'Prospect not found',
          variant: 'destructive',
        });
        navigate('/accountancy/outreach/prospects');
      }
    } catch (error) {
      console.error('Error loading prospect:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prospect details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!id) return;

    try {
      const content = await outreachService.generateProspectOutreach(id);
      toast({
        title: 'Success',
        description: 'Outreach content generated successfully',
      });
      // TODO: Handle the generated content (e.g., open in campaign editor)
    } catch (error) {
      console.error('Error generating outreach:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate outreach content',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading prospect details...</div>;
  }

  if (!prospect) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/accountancy/outreach/prospects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Prospects
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{prospect.name}</h1>
            <p className="text-gray-500">{prospect.position} at {prospect.company}</p>
          </div>
        </div>
        <Button
          onClick={handleGenerateOutreach}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Mail className="h-4 w-4 mr-2" />
          Generate Outreach
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Industry</span>
              </div>
              <span className="text-sm">{prospect.industry || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <span className="text-sm capitalize">{prospect.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Match Score</span>
              </div>
              <span className="text-sm">{prospect.score || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium">Added</span>
              </div>
              <span className="text-sm">
                {new Date(prospect.created_at).toLocaleDateString()}
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
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {prospect.personalization_data?.opening_hook && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Opening Hook</h3>
                  <p className="text-gray-600">{prospect.personalization_data.opening_hook}</p>
                </div>
              )}

              {prospect.personalization_data?.pe_context && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">PE Context</h3>
                  <p className="text-gray-600">{prospect.personalization_data.pe_context}</p>
                </div>
              )}

              {prospect.personalization_data?.research_insights && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Research Insights</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {prospect.personalization_data.research_insights.map((insight, index) => (
                      <li key={index} className="text-gray-600">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <ProspectForm
            prospect={prospect}
            onSuccess={loadProspect}
          />
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>Research Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Research tools and insights will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Activity history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProspectDetail; 