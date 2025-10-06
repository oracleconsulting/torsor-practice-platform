import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Globe,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  History
} from 'lucide-react';
import { savedProspectsService } from '../../../services/accountancy/savedProspectsService';
import { toast } from 'sonner';

interface ProspectDetailsModalProps {
  prospectId: string | null;
  companyData?: any;
  onClose: () => void;
  onResearchComplete?: (results: any) => void;
}

export const ProspectDetailsModal: React.FC<ProspectDetailsModalProps> = ({
  prospectId,
  companyData,
  onClose,
  onResearchComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [prospect, setProspect] = useState<any>(companyData || null);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [officeHistory, setOfficeHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (prospectId && !companyData) {
      // Load prospect from backend
      loadProspect();
    }
  }, [prospectId]);

  const loadProspect = async () => {
    if (!prospectId) return;
    
    try {
      setLoading(true);
      // TODO: Implement get prospect by ID
      // const data = await savedProspectsService.getProspect(prospectId);
      // setProspect(data);
    } catch (error) {
      console.error('Failed to load prospect:', error);
      toast.error('Failed to load prospect details');
    } finally {
      setLoading(false);
    }
  };

  const handleConductResearch = async () => {
    if (!prospectId && !prospect?.company_number) {
      toast.error('Cannot conduct research without prospect data');
      return;
    }

    try {
      setResearching(true);
      toast.info('Conducting AI-powered research... This may take 30-60 seconds.');

      const results = await savedProspectsService.conductAIResearch(
        prospectId || prospect.id
      );

      setResearchResults(results.research_results);
      setProspect({ ...prospect, research_completed: true, research_data: results.research_results });
      
      toast.success('Research completed!');
      
      if (onResearchComplete) {
        onResearchComplete(results);
      }
    } catch (error: any) {
      console.error('Research failed:', error);
      toast.error(error.message || 'Failed to conduct research');
    } finally {
      setResearching(false);
    }
  };

  const handleLoadOfficeHistory = async () => {
    if (!prospectId && !prospect?.id) {
      toast.error('Cannot load office history without prospect ID');
      return;
    }

    try {
      setLoading(true);
      const history = await savedProspectsService.getRegisteredOfficeHistory(
        prospectId || prospect.id
      );
      setOfficeHistory(history);
      toast.success(`Found ${history.length} office address changes`);
    } catch (error: any) {
      console.error('Failed to load office history:', error);
      toast.error('Failed to load office history');
    } finally {
      setLoading(false);
    }
  };

  if (!prospect && !loading) {
    return null;
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Dialog open={!!prospect} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            {prospect?.company_name || 'Loading...'}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{prospect?.company_number}</Badge>
            <Badge className={
              prospect?.company_status === 'active' ? 'bg-green-100 text-green-800' :
              prospect?.company_status === 'dormant' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }>
              {prospect?.company_status || 'Unknown'}
            </Badge>
            {prospect?.research_completed && (
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Researched
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading prospect details...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="research">AI Research</TabsTrigger>
              <TabsTrigger value="history">Office History</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company Type</label>
                      <p className="text-sm">{prospect?.company_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Incorporated</label>
                      <p className="text-sm">
                        {prospect?.date_of_creation ? new Date(prospect.date_of_creation).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
                      <p className="text-sm">{prospect?.jurisdiction || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-sm capitalize">{prospect?.company_status || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Registered Office Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatAddress(prospect?.registered_office_address)}</p>
                  {prospect?.registered_office_is_in_dispute && (
                    <div className="mt-2 flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Address is in dispute</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {prospect?.sic_codes && prospect.sic_codes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      SIC Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {prospect.sic_codes.map((code: string) => (
                        <Badge key={code} variant="secondary">{code}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                {prospect?.has_charges && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm font-medium">Has Charges</p>
                    </CardContent>
                  </Card>
                )}
                {prospect?.has_insolvency_history && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                      <p className="text-sm font-medium">Insolvency History</p>
                    </CardContent>
                  </Card>
                )}
                {prospect?.has_been_liquidated && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                      <p className="text-sm font-medium">Liquidated</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* AI Research Tab */}
            <TabsContent value="research" className="space-y-4">
              {!prospect?.research_completed ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-semibold mb-2">AI-Powered Research</h3>
                    <p className="text-gray-600 mb-6">
                      Conduct deep research on this company using Perplexity AI to verify trading addresses,
                      analyze their website, find key personnel, and track news.
                    </p>
                    <Button
                      onClick={handleConductResearch}
                      disabled={researching}
                      size="lg"
                    >
                      {researching ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Conduct Research
                        </>
                      )}
                    </Button>
                    {researching && (
                      <p className="text-sm text-gray-500 mt-4">
                        This may take 30-60 seconds. Please wait...
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Trading Address Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Verified Address</label>
                          <p className="text-sm">
                            {researchResults?.trading_address_confirmation?.trading_address || 
                             prospect?.research_data?.trading_address_confirmation?.trading_address ||
                             'Not verified'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Confidence</label>
                          <Badge>
                            {researchResults?.trading_address_confirmation?.confidence || 
                             prospect?.research_data?.trading_address_confirmation?.confidence || 0}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {(researchResults?.company_history || prospect?.research_data?.company_history) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="w-5 h-5" />
                          Company History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {researchResults?.company_history || prospect?.research_data?.company_history}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {(researchResults?.website_analysis || prospect?.research_data?.website_analysis) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Website Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {researchResults?.website_analysis || prospect?.research_data?.website_analysis}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {(researchResults?.key_personnel || prospect?.research_data?.key_personnel) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Key Personnel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {researchResults?.key_personnel || prospect?.research_data?.key_personnel}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {(researchResults?.latest_news || prospect?.research_data?.latest_news) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Latest News
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {researchResults?.latest_news || prospect?.research_data?.latest_news}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleConductResearch}
                    variant="outline"
                    size="sm"
                    disabled={researching}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Re-run Research
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Office History Tab */}
            <TabsContent value="history" className="space-y-4">
              {officeHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-semibold mb-2">Registered Office History</h3>
                    <p className="text-gray-600 mb-6">
                      Track changes in registered office address over time to identify potential accountant switches.
                    </p>
                    <Button onClick={handleLoadOfficeHistory} disabled={loading}>
                      {loading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <History className="w-4 h-4 mr-2" />
                          Load Office History
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {officeHistory.length} Address Change{officeHistory.length !== 1 ? 's' : ''}
                    </h3>
                    <Button onClick={handleLoadOfficeHistory} variant="outline" size="sm" disabled={loading}>
                      <History className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {officeHistory.map((change: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-24">
                              <Badge variant="outline">
                                {new Date(change.date).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">{change.description}</p>
                              <p className="text-sm text-gray-600">{formatAddress(change.address)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Intelligence Tab */}
            <TabsContent value="intelligence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Coming soon: Automated business intelligence gathering, growth indicators,
                    pain points identification, and personalization hooks for targeted outreach.
                  </p>
                  <Badge variant="outline">Feature In Development</Badge>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => window.open(
              `https://find-and-update.company-information.service.gov.uk/company/${prospect?.company_number}`,
              '_blank'
            )}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Companies House
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

