// src/components/accountancy/outreach/research/EnhancedResearch.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Building, 
  Users, 
  FileText, 
  TrendingUp, 
  Globe,
  Newspaper,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  Brain,
  Target
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from 'sonner';

interface ResearchRequest {
  depth: 'basic' | 'standard' | 'deep' | 'full';
  include_web_intelligence: boolean;
  include_news_analysis: boolean;
  include_pe_connections: boolean;
  include_financial_analysis: boolean;
}

interface ResearchStatus {
  status: 'not_started' | 'recent' | 'stale' | 'outdated';
  message: string;
  last_updated?: string;
  research_types?: string[];
}

interface ComprehensiveResearch {
  prospect: Record<string, any>;
  research: {
    company_data: Record<string, any>;
    web_presence: Record<string, any>;
    news_mentions: Record<string, any>[];
    key_personnel: Record<string, any>[];
    financial_indicators: Record<string, any>;
    pe_connections: Record<string, any>;
    last_updated?: string;
  };
  personalization: {
    opening_hooks: string[];
    pe_context?: string;
    research_insights: string[];
  };
}

interface CompanyProfile {
  company_number: string;
  company_name: string;
  status: string;
  type: string;
  incorporated_on?: string;
  registered_office?: Record<string, any>;
  sic_codes: string[];
  officers: Record<string, any>[];
  filing_history: Record<string, any>[];
  charges: Record<string, any>[];
  accounts?: Record<string, any>;
}

const EnhancedResearch: React.FC<{ prospectId?: string }> = ({ prospectId }) => {
  const { practice } = useAccountancyContext();
  const [researchData, setResearchData] = useState<ComprehensiveResearch | null>(null);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [researchRequest, setResearchRequest] = useState<ResearchRequest>({
    depth: 'standard',
    include_web_intelligence: true,
    include_news_analysis: true,
    include_pe_connections: true,
    include_financial_analysis: false
  });

  useEffect(() => {
    if (prospectId) {
      loadResearchStatus();
      loadResearchData();
    }
  }, [prospectId]);

  const loadResearchStatus = async () => {
    if (!prospectId) return;

    try {
      const status = await outreachService.getResearchStatus(prospectId);
      setResearchStatus(status);
    } catch (error) {
      console.error('Failed to load research status:', error);
    }
  };

  const loadResearchData = async () => {
    if (!prospectId) return;

    try {
      const data = await outreachService.getProspectResearch(prospectId);
      setResearchData(data);
    } catch (error) {
      console.error('Failed to load research data:', error);
    }
  };

  const triggerResearch = async () => {
    if (!prospectId) return;

    setLoading(true);
    try {
      const result = await outreachService.triggerProspectResearch(prospectId, researchRequest);
      
      if (result.status === 'processing') {
        toast.success(`Research started. ${result.message}`);
        // Poll for updates
        pollResearchStatus();
      } else {
        toast.success('Using cached research data');
        loadResearchData();
      }
    } catch (error) {
      console.error('Failed to trigger research:', error);
      toast.error('Failed to start research. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollResearchStatus = () => {
    const interval = setInterval(async () => {
      try {
        const status = await outreachService.getResearchStatus(prospectId!);
        setResearchStatus(status);
        
        if (status.status === 'recent') {
          clearInterval(interval);
          loadResearchData();
          toast.success('Research completed!');
        }
      } catch (error) {
        console.error('Failed to poll research status:', error);
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recent': return 'text-green-600 bg-green-100';
      case 'stale': return 'text-yellow-600 bg-yellow-100';
      case 'outdated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recent': return CheckCircle;
      case 'stale': return Clock;
      case 'outdated': return AlertCircle;
      default: return Eye;
    }
  };

  if (!prospectId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Prospect Selected</h3>
          <p className="text-gray-600">
            Please select a prospect to view research data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Research Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Research</h2>
        {researchStatus && (
          <div className="flex items-center space-x-2">
            {React.createElement(getStatusIcon(researchStatus.status), { className: "w-4 h-4" })}
            <Badge className={getStatusColor(researchStatus.status)}>
              {researchStatus.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {researchStatus.last_updated && (
              <span className="text-sm text-gray-600">
                Updated: {new Date(researchStatus.last_updated).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Research Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Research Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Research Depth */}
            <div>
              <label className="text-sm font-medium">Research Depth</label>
              <select
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                value={researchRequest.depth}
                onChange={(e) => setResearchRequest(prev => ({
                  ...prev,
                  depth: e.target.value as ResearchRequest['depth']
                }))}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="deep">Deep</option>
                <option value="full">Full</option>
              </select>
            </div>

            {/* Research Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Research Options</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={researchRequest.include_web_intelligence}
                    onChange={(e) => setResearchRequest(prev => ({
                      ...prev,
                      include_web_intelligence: e.target.checked
                    }))}
                  />
                  <span className="text-sm">Web Intelligence</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={researchRequest.include_news_analysis}
                    onChange={(e) => setResearchRequest(prev => ({
                      ...prev,
                      include_news_analysis: e.target.checked
                    }))}
                  />
                  <span className="text-sm">News Analysis</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={researchRequest.include_pe_connections}
                    onChange={(e) => setResearchRequest(prev => ({
                      ...prev,
                      include_pe_connections: e.target.checked
                    }))}
                  />
                  <span className="text-sm">PE Connections</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={researchRequest.include_financial_analysis}
                    onChange={(e) => setResearchRequest(prev => ({
                      ...prev,
                      include_financial_analysis: e.target.checked
                    }))}
                  />
                  <span className="text-sm">Financial Analysis</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={triggerResearch} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Start Research
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadResearchData}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Results */}
      {researchData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="company">Company Data</TabsTrigger>
            <TabsTrigger value="personnel">Key Personnel</TabsTrigger>
            <TabsTrigger value="news">News & Media</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="pe">PE Connections</TabsTrigger>
            <TabsTrigger value="personalization">Personalization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Research Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Company Profile</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {researchData.research.company_data?.description || 'No description available'}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Key Personnel</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {researchData.research.key_personnel?.length || 0} people identified
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Newspaper className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">News Mentions</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {researchData.research.news_mentions?.length || 0} recent mentions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {researchData.research.company_data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Basic Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Company Name:</span>
                            <span>{researchData.research.company_data.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Industry:</span>
                            <span>{researchData.research.company_data.industry}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Founded:</span>
                            <span>{researchData.research.company_data.founded}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Employees:</span>
                            <span>{researchData.research.company_data.employees}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{researchData.research.company_data.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span>{researchData.research.company_data.website}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{researchData.research.company_data.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personnel">
            <Card>
              <CardHeader>
                <CardTitle>Key Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {researchData.research.key_personnel?.map((person, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{person.name}</h4>
                          <p className="text-sm text-gray-600">{person.title}</p>
                          {person.linkedin && (
                            <a 
                              href={person.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              LinkedIn Profile
                            </a>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>Experience: {person.experience}</div>
                          <div>Education: {person.education}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
            <Card>
              <CardHeader>
                <CardTitle>News & Media Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {researchData.research.news_mentions?.map((news, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{news.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{news.summary}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{news.source}</span>
                            <span>{new Date(news.date).toLocaleDateString()}</span>
                            <Badge variant="secondary">{news.sentiment}</Badge>
                          </div>
                        </div>
                        {news.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                              Read
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {researchData.research.financial_indicators ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Financial Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue:</span>
                          <span>{researchData.research.financial_indicators.revenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Profit Margin:</span>
                          <span>{researchData.research.financial_indicators.profit_margin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Growth Rate:</span>
                          <span>{researchData.research.financial_indicators.growth_rate}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Market Position</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Market Cap:</span>
                          <span>{researchData.research.financial_indicators.market_cap}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valuation:</span>
                          <span>{researchData.research.financial_indicators.valuation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Financial analysis not available. Enable financial analysis in research options.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pe">
            <Card>
              <CardHeader>
                <CardTitle>PE Connections</CardTitle>
              </CardHeader>
              <CardContent>
                {researchData.research.pe_connections ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Investment History</h4>
                        <div className="space-y-2 text-sm">
                          {researchData.research.pe_connections.investments?.map((investment: any, index: number) => (
                            <div key={index} className="border rounded p-2">
                              <div className="font-medium">{investment.firm}</div>
                              <div className="text-gray-600">{investment.date}</div>
                              <div className="text-gray-600">{investment.amount}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Board Connections</h4>
                        <div className="space-y-2 text-sm">
                          {researchData.research.pe_connections.board_members?.map((member: any, index: number) => (
                            <div key={index} className="border rounded p-2">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-gray-600">{member.firm}</div>
                              <div className="text-gray-600">{member.role}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">PE connections not available. Enable PE connections in research options.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personalization">
            <Card>
              <CardHeader>
                <CardTitle>Personalization Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Opening Hooks */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Opening Hooks
                    </h4>
                    <div className="space-y-2">
                      {researchData.personalization.opening_hooks?.map((hook, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PE Context */}
                  {researchData.personalization.pe_context && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        PE Context
                      </h4>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{researchData.personalization.pe_context}</p>
                      </div>
                    </div>
                  )}

                  {/* Research Insights */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      Research Insights
                    </h4>
                    <div className="space-y-2">
                      {researchData.personalization.research_insights?.map((insight, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Research Data */}
      {!researchData && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Research Data</h3>
            <p className="text-gray-600 mb-4">
              Start research to gather comprehensive information about this prospect.
            </p>
            <Button onClick={triggerResearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Start Research
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedResearch; 