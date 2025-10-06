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
  prospectId: initialProspectId,
  companyData,
  onClose,
  onResearchComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [prospect, setProspect] = useState<any>(companyData || null); // Start with companyData immediately
  const [researchResults, setResearchResults] = useState<any>(null);
  const [officeHistory, setOfficeHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCompaniesHousePreview, setShowCompaniesHousePreview] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [prospectId, setProspectId] = useState(initialProspectId);

  // Auto-save prospect if opened from search results (no prospectId yet)
  useEffect(() => {
    if (!prospectId && companyData) {
      autoSaveProspect();
    } else if (prospectId && !companyData) {
      fetchProspectDetails();
    }
  }, [prospectId, companyData]);

  const autoSaveProspect = async () => {
    try {
      console.log('Auto-saving prospect for research/history access...');
      const result = await savedProspectsService.saveCompany(companyData);
      if (result.prospect_id) {
        setProspectId(result.prospect_id);
        toast.success('✅ Company saved - research features enabled');
      }
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('Company already saved');
        // Could fetch the existing prospect ID here
      } else {
        console.error('Auto-save failed:', error);
        // Don't show error toast - user didn't explicitly try to save
      }
    }
  };

  const fetchProspectDetails = async () => {
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
    if (!prospectId) {
      toast.error('Saving company first...');
      await autoSaveProspect();
      if (!prospectId) {
        toast.error('Failed to save company. Please try the Save button manually.');
        return;
      }
    }

    try {
      setResearching(true);
      toast.info('🔍 Conducting AI-powered research with Perplexity... This may take 30-60 seconds.');

      // REAL API CALL to backend with Perplexity integration
      const results = await savedProspectsService.conductResearch(prospectId);

      setResearchResults(results.research);
      setProspect({ ...prospect, research_completed: true, research_data: results.research });
      
      toast.success('✅ Research completed! Trading address verified, company intel gathered.');
      
      if (onResearchComplete) {
        onResearchComplete(results);
      }
    } catch (error: any) {
      console.error('Research failed:', error);
      toast.error(error.message || 'AI research failed. This feature requires valid API keys.');
    } finally {
      setResearching(false);
    }
  };

  const handleLoadOfficeHistory = async () => {
    if (!prospectId) {
      toast.error('Saving company first...');
      await autoSaveProspect();
      if (!prospectId) {
        toast.error('Failed to save company. Please try the Save button manually.');
        return;
      }
    }

    try {
      setLoading(true);
      toast.info('📋 Loading registered office history from Companies House...');
      
      // REAL API CALL to backend - fetches filing history (AD01 forms)
      const historyData = await savedProspectsService.getOfficeHistory(prospectId);
      
      setOfficeHistory(historyData.address_history || []);
      
      const changeCount = historyData.total_changes || 0;
      if (changeCount === 0) {
        toast.info('✅ No address changes found - company has been at same registered office');
      } else {
        toast.success(`✅ Found ${changeCount} registered office change${changeCount > 1 ? 's' : ''} - potential accountant switches!`);
      }
    } catch (error: any) {
      console.error('Failed to load office history:', error);
      toast.error(error.message || 'Failed to load office history from Companies House API.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dynamic intelligence
  const getTimingRecommendation = (prospect: any, companyData: any) => {
    const companyAge = (prospect?.date_of_creation || companyData?.date_of_creation)
      ? Math.floor((new Date().getTime() - new Date(prospect?.date_of_creation || companyData?.date_of_creation).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 0;
    
    if (companyAge < 2) {
      return 'Recently formed - ideal for setting up advisory relationships from the start';
    } else if (companyAge < 5) {
      return 'Growth phase company - best approached during Q4 for year-end planning';
    } else {
      return 'Established company - reach out during Q4 for tax planning or after filing deadlines';
    }
  };

  const getPainPoints = (prospect: any, companyData: any) => {
    const companyType = (prospect?.company_type || companyData?.company_type || '').toLowerCase();
    const status = (prospect?.company_status || companyData?.company_status || '').toLowerCase();
    
    if (companyType.includes('ltd')) {
      return 'Limited companies need efficient compliance + growth advisory services';
    } else if (companyType.includes('plc')) {
      return 'PLCs require comprehensive corporate governance and reporting advisory';
    } else if (status === 'active') {
      return 'Active companies need proactive tax planning and business advisory';
    }
    return 'Likely needs advisory services for growth strategy and compliance optimization';
  };

  const getApproach = (prospect: any, companyData: any) => {
    const sicCodes = prospect?.sic_codes || companyData?.sic_codes || [];
    const companyType = (prospect?.company_type || companyData?.company_type || '').toLowerCase();
    
    if (sicCodes.some((sic: string) => sic.startsWith('62') || sic.startsWith('63'))) {
      return 'Tech/IT company - lead with R&D tax credits and innovation advisory';
    } else if (sicCodes.some((sic: string) => sic.startsWith('41') || sic.startsWith('42') || sic.startsWith('43'))) {
      return 'Construction - lead with CIS compliance and subcontractor management';
    } else if (companyType.includes('ltd')) {
      return 'Lead with compliance efficiency, transition to strategic advisory';
    }
    return 'Lead with compliance, transition to advisory and growth services';
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
    <Dialog open={!!prospect || !!companyData} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            {prospect?.company_name || companyData?.company_name || 'Loading...'}
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
                  {prospect?.registered_office_address ? (
                    <>
                      <p className="text-sm">{formatAddress(prospect.registered_office_address)}</p>
                      {prospect?.registered_office_is_in_dispute && (
                        <div className="mt-2 flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Address is in dispute</span>
                        </div>
                      )}
                    </>
                  ) : prospect?.address ? (
                    <p className="text-sm">{formatAddress(prospect.address)}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Address not available</p>
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
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Business Intelligence & Outreach Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Company Profile</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Company Age:</span>
                        <p className="font-medium">
                          {(prospect?.date_of_creation || companyData?.date_of_creation)
                            ? `${Math.floor((new Date().getTime() - new Date(prospect?.date_of_creation || companyData?.date_of_creation).getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                            : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{prospect?.company_status || companyData?.company_status || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium">{prospect?.company_type || companyData?.company_type || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Jurisdiction:</span>
                        <p className="font-medium">{prospect?.jurisdiction || companyData?.jurisdiction || 'England & Wales'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Outreach Recommendations</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span><strong>Timing:</strong> {getTimingRecommendation(prospect, companyData)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span><strong>Pain Points:</strong> {getPainPoints(prospect, companyData)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span><strong>Approach:</strong> {getApproach(prospect, companyData)}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Risk Indicators</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(prospect?.has_charges || companyData?.has_charges) && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          ⚠️ Has Charges
                        </Badge>
                      )}
                      {(prospect?.has_insolvency_history || companyData?.has_insolvency_history) && (
                        <Badge variant="outline" className="border-red-500 text-red-700">
                          🚨 Insolvency History
                        </Badge>
                      )}
                      {(prospect?.has_been_liquidated || companyData?.has_been_liquidated) && (
                        <Badge variant="outline" className="border-red-600 text-red-800">
                          ⛔ Liquidation History
                        </Badge>
                      )}
                      {!(prospect?.has_charges || companyData?.has_charges) && 
                       !(prospect?.has_insolvency_history || companyData?.has_insolvency_history) &&
                       !(prospect?.has_been_liquidated || companyData?.has_been_liquidated) && (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          ✓ No Red Flags
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">SIC Codes & Industry</h4>
                    <div className="flex flex-wrap gap-2">
                      {((prospect?.sic_codes || companyData?.sic_codes) || []).map((sic: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {sic}
                        </Badge>
                      ))}
                      {!(prospect?.sic_codes || companyData?.sic_codes || []).length && (
                        <span className="text-sm text-gray-500">No SIC codes listed</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Next Steps</h4>
                    <ol className="space-y-2 text-sm list-decimal list-inside">
                      <li>Verify trading address via AI research (use AI Research tab)</li>
                      <li>Check registered office history for accountant changes (use Office History tab)</li>
                      <li>Research company website and online presence</li>
                      <li>Prepare personalized outreach based on {(prospect?.company_type || companyData?.company_type) || 'company type'}</li>
                      <li>Add to targeted campaign</li>
                    </ol>
                  </div>
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
            onClick={() => setShowCompaniesHousePreview(true)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Companies House
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Companies House Preview Modal */}
      {showCompaniesHousePreview && (
        <Dialog open={showCompaniesHousePreview} onOpenChange={setShowCompaniesHousePreview}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Companies House - {prospect?.company_name || companyData?.company_name}</DialogTitle>
            </DialogHeader>
            {!iframeError ? (
              <div className="w-full h-[70vh] relative">
                <iframe
                  src={`https://find-and-update.company-information.service.gov.uk/company/${prospect?.company_number || companyData?.company_number}`}
                  className="w-full h-full border-0"
                  title="Companies House Preview"
                  onError={() => setIframeError(true)}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            ) : (
              <div className="w-full h-[70vh] flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Preview Blocked</h3>
                  <p className="text-gray-600 mb-4">
                    Companies House blocks embedded previews for security.
                  </p>
                  <Button
                    onClick={() => window.open(
                      `https://find-and-update.company-information.service.gov.uk/company/${prospect?.company_number || companyData?.company_number}`,
                      '_blank'
                    )}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab Instead
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCompaniesHousePreview(false);
                setIframeError(false);
              }}>
                Close Preview
              </Button>
              <Button
                onClick={() => window.open(
                  `https://find-and-update.company-information.service.gov.uk/company/${prospect?.company_number || companyData?.company_number}`,
                  '_blank'
                )}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

