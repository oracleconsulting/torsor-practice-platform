import React, { useState, useMemo } from 'react';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Leaf, 
  Users, 
  Calculator,
  Download,
  Upload,
  Filter,
  Plus,
  ArrowRight,
  Target,
  Building,
  Database,
  FileText,
  FileSpreadsheet,
  BarChart3,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { ESGClient, ESGData, ESGReport, ESGSummary, CarbonResults } from '../../types/accountancy';

export const ESGReportingPage: React.FC = () => {
  const { subscriptionTier } = useAccountancyContext();
  const [activeTab, setActiveTab] = useState('scoping');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Mock data based on the specification
  const esgData: ESGSummary = {
    inScopeClients: 24,
    activeReports: 8,
    revenueOpportunity: 72000,
    upcomingDeadlines: [
      { clientName: 'ABC Manufacturing', daysRemaining: 15 },
      { clientName: 'XYZ Retail', daysRemaining: 32 },
      { clientName: 'TechStart Ltd', daysRemaining: 45 }
    ],
    averageScore: 72,
    carbonReduction: 15.3
  };

  const esgClients: ESGClient[] = [
    {
      id: '1',
      name: 'ABC Manufacturing',
      industry: 'Manufacturing',
      size: 'medium',
      scope: {
        clientId: '1',
        companySize: {
          employees: 85,
          turnover: 8500000
        },
        mandatory: false,
        voluntaryBenefits: ['Investor appeal', 'Supply chain requirements', 'Brand reputation'],
        materialTopics: ['Carbon emissions', 'Energy efficiency', 'Waste management'],
        reportingFramework: 'ISSB',
        estimatedCost: 2500,
        recommendedActions: ['Conduct energy audit', 'Implement waste tracking', 'Develop sustainability policy']
      },
      data: {
        emissions: {
          scope1: {
            naturalGas: 45000,
            companyVehicles: 12500,
            refrigerants: 25
          },
          scope2: {
            electricity: 120000,
            source: 'mixed'
          },
          scope3: {
            businessTravel: 8500,
            commuting: 42000,
            waste: 12,
            water: 1800
          }
        },
        social: {
          totalEmployees: 85,
          femaleEmployees: 38,
          femaleManagers: 12,
          genderPayGap: 8.5,
          trainingHours: 24,
          turnoverRate: 12,
          accidents: 2
        },
        governance: {
          boardMembers: 6,
          independentDirectors: 3,
          sustainabilityPolicy: true,
          codeOfConduct: true,
          whistleblowing: true,
          dataBreaches: 0
        }
      },
      report: {
        id: '1',
        clientName: 'ABC Manufacturing',
        period: '2024',
        status: 'draft',
        scores: {
          environmental: 68,
          social: 75,
          governance: 82,
          overall: 75
        },
        carbonFootprint: {
          total: 45.2,
          intensity: 0.53,
          change: -12.5
        },
        narrative: {
          executiveSummary: 'ABC Manufacturing shows strong governance practices with opportunities for environmental improvement.',
          materialityAssessment: 'Energy efficiency and waste management identified as key material topics.',
          performanceAnalysis: '15% reduction in carbon emissions achieved through energy efficiency measures.',
          targetsAndActions: 'Targeting 25% emissions reduction by 2026 through renewable energy adoption.'
        }
      },
      status: 'data_collection',
      deadline: '2024-12-31',
      revenue: 2500
    },
    {
      id: '2',
      name: 'XYZ Retail',
      industry: 'Retail',
      size: 'large',
      scope: {
        clientId: '2',
        companySize: {
          employees: 250,
          turnover: 25000000
        },
        mandatory: true,
        voluntaryBenefits: ['Regulatory compliance', 'Investor requirements', 'Customer expectations'],
        materialTopics: ['Carbon emissions', 'Supply chain sustainability', 'Employee wellbeing'],
        reportingFramework: 'UK_SDS',
        estimatedCost: 3500,
        recommendedActions: ['Scope 3 emissions assessment', 'Supplier sustainability audit', 'Employee engagement survey']
      },
      data: {
        emissions: {
          scope1: {
            naturalGas: 25000,
            companyVehicles: 35000,
            refrigerants: 45
          },
          scope2: {
            electricity: 180000,
            source: 'grid'
          },
          scope3: {
            businessTravel: 15000,
            commuting: 75000,
            waste: 25,
            water: 3200
          }
        },
        social: {
          totalEmployees: 250,
          femaleEmployees: 145,
          femaleManagers: 35,
          genderPayGap: 6.2,
          trainingHours: 32,
          turnoverRate: 8,
          accidents: 1
        },
        governance: {
          boardMembers: 8,
          independentDirectors: 4,
          sustainabilityPolicy: true,
          codeOfConduct: true,
          whistleblowing: true,
          dataBreaches: 1
        }
      },
      report: {
        id: '2',
        clientName: 'XYZ Retail',
        period: '2024',
        status: 'review',
        scores: {
          environmental: 72,
          social: 81,
          governance: 78,
          overall: 77
        },
        carbonFootprint: {
          total: 78.5,
          intensity: 0.31,
          change: -8.7
        },
        narrative: {
          executiveSummary: 'XYZ Retail demonstrates strong social performance with good governance practices.',
          materialityAssessment: 'Supply chain sustainability and employee wellbeing are key focus areas.',
          performanceAnalysis: '8.7% reduction in carbon intensity achieved through store efficiency improvements.',
          targetsAndActions: 'Targeting 20% emissions reduction by 2026 through renewable energy and supply chain optimization.'
        }
      },
      status: 'reporting',
      deadline: '2024-12-31',
      revenue: 3500
    },
    {
      id: '3',
      name: 'TechStart Ltd',
      industry: 'Technology',
      size: 'small',
      scope: {
        clientId: '3',
        companySize: {
          employees: 35,
          turnover: 2800000
        },
        mandatory: false,
        voluntaryBenefits: ['Investor appeal', 'Talent attraction', 'Market differentiation'],
        materialTopics: ['Energy efficiency', 'Employee development', 'Data security'],
        reportingFramework: 'SIMPLIFIED',
        estimatedCost: 1500,
        recommendedActions: ['Implement energy monitoring', 'Develop training programs', 'Enhance data protection']
      },
      data: {
        emissions: {
          scope1: {
            naturalGas: 8000,
            companyVehicles: 5000,
            refrigerants: 8
          },
          scope2: {
            electricity: 45000,
            source: 'renewable'
          },
          scope3: {
            businessTravel: 3000,
            commuting: 15000,
            waste: 4,
            water: 600
          }
        },
        social: {
          totalEmployees: 35,
          femaleEmployees: 18,
          femaleManagers: 8,
          genderPayGap: 3.8,
          trainingHours: 40,
          turnoverRate: 5,
          accidents: 0
        },
        governance: {
          boardMembers: 4,
          independentDirectors: 2,
          sustainabilityPolicy: false,
          codeOfConduct: true,
          whistleblowing: false,
          dataBreaches: 0
        }
      },
      report: {
        id: '3',
        clientName: 'TechStart Ltd',
        period: '2024',
        status: 'draft',
        scores: {
          environmental: 85,
          social: 88,
          governance: 65,
          overall: 79
        },
        carbonFootprint: {
          total: 12.8,
          intensity: 0.37,
          change: -15.2
        },
        narrative: {
          executiveSummary: 'TechStart Ltd shows excellent environmental and social performance with governance improvement opportunities.',
          materialityAssessment: 'Energy efficiency and employee development are key strengths.',
          performanceAnalysis: '15.2% reduction in carbon emissions through renewable energy adoption.',
          targetsAndActions: 'Targeting governance improvements through policy development and board diversity.'
        }
      },
      status: 'scoping',
      deadline: '2024-12-31',
      revenue: 1500
    }
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'reporting': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'data_collection': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'scoping': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'not_started': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalRevenue = useMemo(() => {
    return esgClients.reduce((sum, client) => sum + client.revenue, 0);
  }, [esgClients]);

  const averageScore = useMemo(() => {
    const scores = esgClients.filter(c => c.report).map(c => c.report!.scores.overall);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }, [esgClients]);

  return (
    <div className="esg-reporting-container" style={{ overflowY: 'auto', height: '100vh' }}>
      <div className="min-h-screen overflow-auto bg-[#f5f1e8] relative">
        {/* Header */}
        <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
          <div className="relative z-10 container mx-auto px-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#ff6b35] rounded-xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black uppercase text-white mb-2">ESG LITE REPORTING</h1>
                <p className="text-xl text-white/80 font-bold uppercase">Sustainability reporting for SME clients</p>
              </div>
              <Badge variant="outline" className="ml-auto bg-[#ff6b35] text-white border-[#ff6b35] font-black uppercase">
                {subscriptionTier} Tier
              </Badge>
            </div>

            {/* Key Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{esgData.inScopeClients}</div>
                <div className="text-green-100 text-sm">Clients in Scope</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{esgData.activeReports}</div>
                <div className="text-green-100 text-sm">Active Reports</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">£{(esgData.revenueOpportunity / 1000).toFixed(0)}k</div>
                <div className="text-green-100 text-sm">Revenue Opportunity</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{esgData.averageScore}%</div>
                <div className="text-green-100 text-sm">Average ESG Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-8 min-h-screen overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="scoping" className="text-white data-[state=active]:bg-green-600">
                Client Scoping
              </TabsTrigger>
              <TabsTrigger value="collection" className="text-white data-[state=active]:bg-green-600">
                Data Collection
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-white data-[state=active]:bg-green-600">
                Report Builder
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-white data-[state=active]:bg-green-600">
                Insights
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-white data-[state=active]:bg-green-600">
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Client Scoping Tab */}
            <TabsContent value="scoping" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scoping Overview */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Scoping Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Mandatory Reports</span>
                        <Badge className="bg-red-500 text-white">
                          {esgClients.filter(c => c.scope.mandatory).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Voluntary Reports</span>
                        <Badge className="bg-blue-500 text-white">
                          {esgClients.filter(c => !c.scope.mandatory).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">UK SDS Framework</span>
                        <Badge className="bg-purple-500 text-white">
                          {esgClients.filter(c => c.scope.reportingFramework === 'UK_SDS').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">ISSB Framework</span>
                        <Badge className="bg-green-500 text-white">
                          {esgClients.filter(c => c.scope.reportingFramework === 'ISSB').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client List */}
                <Card className="lg:col-span-2 bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Client ESG Scoping
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Search clients..." 
                          className="w-48 bg-white/10 border-white/20 text-white"
                        />
                        <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {esgClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 bg-white/5 border-white/10"
                          onClick={() => setSelectedClient(client.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">{client.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${getStatusColor(client.status)}`}>
                                {client.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${client.scope.mandatory ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                                {client.scope.mandatory ? 'Mandatory' : 'Voluntary'}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Framework</span>
                                <span className="text-white">{client.scope.reportingFramework}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Employees</span>
                                <span className="text-white">{client.scope.companySize.employees}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Turnover</span>
                                <span className="text-white">£{(client.scope.companySize.turnover / 1000000).toFixed(1)}M</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Revenue</span>
                                <span className="text-white">£{client.revenue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Deadline</span>
                                <span className="text-white">{new Date(client.deadline).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300">Topics</span>
                                <span className="text-white">{client.scope.materialTopics.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Collection Tab */}
            <TabsContent value="collection" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Collection Portal */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Data Collection Portal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Environmental Data */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-400" />
                        Environmental Data
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white text-sm">Electricity (kWh)</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Gas (kWh)</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Business Travel (miles)</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Waste (tonnes)</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Data */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        Social Data
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white text-sm">Total Employees</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Female Employees</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Training Hours</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Turnover Rate (%)</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Save Data
                    </Button>
                  </CardContent>
                </Card>

                {/* Emissions Calculator */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Emissions Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <h5 className="text-white font-medium mb-2">Carbon Footprint Results</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Scope 1</span>
                            <span className="text-white">8.2 tCO2e</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Scope 2</span>
                            <span className="text-white">25.5 tCO2e</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Scope 3</span>
                            <span className="text-white">11.5 tCO2e</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-2">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-white font-semibold">45.2 tCO2e</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg">
                        <h5 className="text-white font-medium mb-2">Intensity Metrics</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Per Employee</span>
                            <span className="text-white">0.53 tCO2e</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Per £1M Revenue</span>
                            <span className="text-white">5.3 tCO2e</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Report Builder Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Report Overview */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Report Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Draft Reports</span>
                        <Badge className="bg-yellow-500 text-black">
                          {esgClients.filter(c => c.report?.status === 'draft').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">In Review</span>
                        <Badge className="bg-blue-500 text-white">
                          {esgClients.filter(c => c.report?.status === 'review').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Final Reports</span>
                        <Badge className="bg-green-500 text-white">
                          {esgClients.filter(c => c.report?.status === 'final').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Published</span>
                        <Badge className="bg-purple-500 text-white">
                          {esgClients.filter(c => c.report?.status === 'published').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Report List */}
                <Card className="lg:col-span-2 bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        ESG Reports
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                          <Plus className="w-4 h-4 mr-2" />
                          New Report
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {esgClients.filter(c => c.report).map((client) => (
                        <div
                          key={client.id}
                          className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 bg-white/5 border-white/10"
                          onClick={() => setSelectedReport(client.report!.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">{client.report!.clientName}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${getStatusColor(client.report!.status)}`}>
                                {client.report!.status}
                              </Badge>
                              <span className={`text-lg font-bold ${getScoreColor(client.report!.scores.overall)}`}>
                                {client.report!.scores.overall}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-green-400 font-medium">Environmental</div>
                              <div className="text-white">{client.report!.scores.environmental}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-400 font-medium">Social</div>
                              <div className="text-white">{client.report!.scores.social}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-400 font-medium">Governance</div>
                              <div className="text-white">{client.report!.scores.governance}%</div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">Carbon Footprint</span>
                              <span className="text-white">{client.report!.carbonFootprint.total} tCO2e</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">Last Updated</span>
                              <span className="text-white">{new Date(client.report!.period).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Benchmarking */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Industry Benchmarking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Carbon Intensity</span>
                          <span className="text-green-400">Better than 75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <div className="text-xs text-gray-300 mt-1">0.53 tCO2e/employee vs 0.71 industry avg</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Gender Pay Gap</span>
                          <span className="text-yellow-400">Average</span>
                        </div>
                        <Progress value={50} className="h-2" />
                        <div className="text-xs text-gray-300 mt-1">8.5% vs 8.2% industry avg</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Board Diversity</span>
                          <span className="text-green-400">Better than 85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                        <div className="text-xs text-gray-300 mt-1">50% female vs 32% industry avg</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Improvement Recommendations */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Improvement Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">Energy Efficiency Audit</span>
                          <Badge className="bg-green-500 text-white text-xs">High Impact</Badge>
                        </div>
                        <div className="text-sm text-gray-300">Potential 15% reduction in energy costs</div>
                        <div className="text-xs text-green-400 mt-1">Estimated saving: £12,000/year</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">Supplier Sustainability</span>
                          <Badge className="bg-blue-500 text-white text-xs">Medium Impact</Badge>
                        </div>
                        <div className="text-sm text-gray-300">Assess and improve supply chain sustainability</div>
                        <div className="text-xs text-blue-400 mt-1">Scope 3 reduction potential: 20%</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">Employee Training</span>
                          <Badge className="bg-purple-500 text-white text-xs">Low Impact</Badge>
                        </div>
                        <div className="text-sm text-gray-300">Implement sustainability awareness training</div>
                        <div className="text-xs text-purple-400 mt-1">Engagement improvement: 25%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Templates */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Report Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">UK SDS Template</div>
                            <div className="text-sm text-gray-300">Compliant with UK Sustainability Disclosure Standards</div>
                          </div>
                          <Download className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">ISSB Template</div>
                            <div className="text-sm text-gray-300">International Sustainability Standards Board format</div>
                          </div>
                          <Download className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">Simplified Template</div>
                            <div className="text-sm text-gray-300">Basic ESG reporting for SMEs</div>
                          </div>
                          <Download className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guidance */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Guidance & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">UK SDS Implementation Guide</div>
                            <div className="text-sm text-gray-300">Step-by-step guide for UK Sustainability Disclosure Standards</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">Emissions Calculation Guide</div>
                            <div className="text-sm text-gray-300">How to calculate and report carbon emissions</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">Materiality Assessment</div>
                            <div className="text-sm text-gray-300">Identifying and prioritizing material ESG topics</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">Stakeholder Engagement</div>
                            <div className="text-sm text-gray-300">Best practices for stakeholder consultation</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
