import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Briefcase, TrendingUp, TrendingDown, Shield, Edit, Copy, FileText, Users, BookOpen, Lock, Download } from 'lucide-react';
import { ContinuityPlan, EncryptedCredential, VaultDocument } from '../types/accountancy';

const mockPlan: ContinuityPlan = {
  id: 'plan1',
  practiceId: '1',
  lastUpdated: new Date(),
  valuation: {
    currentValue: 1250000,
    previousValue: 1150000,
    valuationDate: new Date(),
    methodology: 'GRF',
    grf: {
      annualRecurringRevenue: 400000,
      oneTimeRevenue: 50000,
      recurringPercentage: 0.85,
      multiple: 1.1,
      adjustments: {
        clientConcentration: -0.05,
        growthRate: 0.08,
        profitMargin: 0.22,
        clientRetention: 0.95
      }
    },
    ebitda: {
      earnings: 180000,
      adjustedEarnings: 200000,
      multiple: 4.2,
      addBacks: {
        ownerCompensation: 30000,
        personalExpenses: 5000,
        oneOffCosts: 2000,
        depreciation: 4000,
        amortization: 3000
      }
    },
    perClient: {
      totalClients: 120,
      clientCategories: [
        { category: 'A', count: 20, avgValue: 2000 },
        { category: 'B', count: 50, avgValue: 1200 },
        { category: 'C', count: 50, avgValue: 800 }
      ],
      qualityScore: 82,
      avgValuePerClient: 1300
    },
    growth: {
      revenueGrowth: 0.07,
      clientGrowth: 0.05,
      profitGrowth: 0.09,
      projectedValue1Year: 1320000,
      projectedValue3Year: 1450000,
      projectedValue5Year: 1600000
    }
  },
  executorVault: {
    primaryExecutor: {
      name: 'Jane Smith',
      email: 'jane@smithassociates.com',
      phone: '+44 1234 567890',
      relationship: 'Partner',
      accessDelay: 24,
      lastNotified: new Date()
    },
    secondaryExecutor: {
      name: 'John Doe',
      email: 'john@doe.com',
      phone: '+44 9876 543210',
      relationship: 'Solicitor',
      accessDelay: 48,
      lastNotified: new Date()
    },
    credentials: [
      {
        id: 'cred1',
        service: 'Xero',
        username: 'admin@smithassociates.com',
        encryptedPassword: '***',
        category: 'critical',
        lastRotated: new Date('2024-01-01'),
        twoFactorEnabled: true
      },
      {
        id: 'cred2',
        service: 'Companies House',
        username: 'jane@smithassociates.com',
        encryptedPassword: '***',
        category: 'important',
        lastRotated: new Date('2023-12-01'),
        twoFactorEnabled: false
      }
    ],
    documents: [
      {
        id: 'doc1',
        name: 'Succession Agreement',
        type: 'legal',
        url: '#',
        uploadedAt: new Date('2024-03-01'),
        version: 2,
        tags: ['succession', 'legal']
      },
      {
        id: 'doc2',
        name: 'Key Person Insurance',
        type: 'insurance',
        url: '#',
        uploadedAt: new Date('2024-02-15'),
        version: 1,
        tags: ['insurance']
      }
    ],
    criticalContacts: [
      { name: 'Jane Smith', email: 'jane@smithassociates.com', phone: '+44 1234 567890', role: 'Partner' },
      { name: 'John Doe', email: 'john@doe.com', phone: '+44 9876 543210', role: 'Solicitor' }
    ],
    bankAccounts: [
      { bank: 'Barclays', accountNumber: '12345678', sortCode: '12-34-56', accountType: 'Business' }
    ],
    softwareLicenses: [
      { name: 'Xero', licenseKey: 'XERO-1234-5678', expiryDate: new Date('2025-01-01') }
    ],
    lastVerified: new Date('2024-05-01'),
    nextReviewDate: new Date('2024-12-01')
  },
  readiness: {
    overallScore: 74,
    lastAssessed: new Date('2024-06-01'),
    categories: {
      documentation: {
        score: 70,
        items: {
          operationsManual: false,
          clientProcedures: true,
          successionAgreement: true,
          buyoutAgreement: false,
          keyPersonInsurance: true
        },
        gaps: ['No operations manual', 'No buyout agreement']
      },
      financial: {
        score: 80,
        items: {
          cleanAccounts: true,
          recurringRevenue: 0.85,
          profitability: true,
          debtPosition: true,
          cashReserves: false
        },
        gaps: ['Insufficient cash reserves']
      },
      operational: {
        score: 68,
        items: {
          keyPersonDependency: true,
          documentedProcesses: false,
          clientContracts: true,
          staffContracts: true,
          systemsDocumented: false
        },
        gaps: ['Processes not documented', 'Systems not documented']
      },
      relationships: {
        score: 78,
        items: {
          clientIntroductions: true,
          supplierContracts: true,
          professionalNetwork: false,
          staffRetention: true
        },
        gaps: ['No professional network']
      }
    },
    criticalGaps: [
      {
        category: 'documentation',
        severity: 'critical',
        item: 'Operations Manual',
        impact: 'Reduces value by 10-15%',
        effort: 'medium',
        timeToFix: '2-4 weeks',
        solution: 'Use our template library'
      },
      {
        category: 'operational',
        severity: 'critical',
        item: 'Owner Dependency',
        impact: 'Major succession barrier',
        effort: 'high',
        timeToFix: '12-18 months',
        solution: 'Delegate and document key tasks'
      }
    ],
    recommendations: [
      'Document an operations manual',
      'Increase cash reserves',
      'Build professional network',
      'Document key processes and systems'
    ]
  }
};

export const ContinuityPlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('valuation');
  const { valuation, executorVault, readiness } = mockPlan;
  const trend = Math.round(((valuation.currentValue - valuation.previousValue) / valuation.previousValue) * 100);

  return (
    <div className="min-h-screen bg-[#f5f1e8] relative">
      <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#ff6b35] rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black uppercase text-[#f5f1e8] mb-2">CONTINUITY PLANNING & SUCCESSION</h1>
              <p className="text-xl text-[#f5f1e8]/80 font-bold uppercase">Succession planning and practice valuation</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-[#ff6b35] text-white border-[#ff6b35] font-black uppercase">
              NEW
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">£{valuation.currentValue.toLocaleString()}</div>
              <div className="text-pink-100 text-sm">Current Value</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{trend > 0 ? <TrendingUp /> : <TrendingDown />} {Math.abs(trend)}%</div>
              <div className="text-pink-100 text-sm">Value Trend</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{readiness.overallScore}%</div>
              <div className="text-pink-100 text-sm">Succession Readiness</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{readiness.criticalGaps.length}</div>
              <div className="text-pink-100 text-sm">Critical Gaps</div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="valuation" className="text-white data-[state=active]:bg-pink-700">Valuation</TabsTrigger>
            <TabsTrigger value="vault" className="text-white data-[state=active]:bg-pink-700">Executor Vault</TabsTrigger>
            <TabsTrigger value="readiness" className="text-white data-[state=active]:bg-pink-700">Readiness Assessment</TabsTrigger>
            <TabsTrigger value="growth" className="text-white data-[state=active]:bg-pink-700">Growth Tracking</TabsTrigger>
            <TabsTrigger value="exit" className="text-white data-[state=active]:bg-pink-700">Exit Planning</TabsTrigger>
          </TabsList>
          {/* Valuation Tab */}
          <TabsContent value="valuation" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Practice Valuation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="text-4xl font-bold text-white mb-2">£{valuation.currentValue.toLocaleString()}</div>
                    <div className={`flex items-center gap-2 text-lg ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>{trend > 0 ? <TrendingUp /> : <TrendingDown />} {Math.abs(trend)}% vs last year</div>
                    <div className="mt-4">
                      <Progress value={readiness.overallScore} className="h-3" />
                      <div className="text-white text-sm mt-1">Succession Readiness: {readiness.overallScore}%</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">Methodology: {valuation.methodology}</div>
                      <div className="text-white text-sm">Annual Recurring Revenue: £{valuation.grf.annualRecurringRevenue.toLocaleString()}</div>
                      <div className="text-white text-sm">One-Time Revenue: £{valuation.grf.oneTimeRevenue.toLocaleString()}</div>
                      <div className="text-white text-sm">Recurring %: {(valuation.grf.recurringPercentage * 100).toFixed(0)}%</div>
                      <div className="text-white text-sm">Multiple: {valuation.grf.multiple}x</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">Growth Metrics</div>
                      <div className="text-white text-sm">Revenue Growth: {(valuation.growth.revenueGrowth * 100).toFixed(1)}%</div>
                      <div className="text-white text-sm">Client Growth: {(valuation.growth.clientGrowth * 100).toFixed(1)}%</div>
                      <div className="text-white text-sm">Profit Growth: {(valuation.growth.profitGrowth * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Executor Vault Tab */}
          <TabsContent value="vault" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Executor Vault
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <div className="text-white font-semibold">Primary Executor</div>
                  <div className="text-white text-sm">{executorVault.primaryExecutor.name} ({executorVault.primaryExecutor.relationship})</div>
                  <div className="text-white text-sm">Email: {executorVault.primaryExecutor.email}</div>
                  <div className="text-white text-sm">Phone: {executorVault.primaryExecutor.phone}</div>
                  <div className="text-white text-sm">Access Delay: {executorVault.primaryExecutor.accessDelay} hours</div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold">Secondary Executor</div>
                  <div className="text-white text-sm">{executorVault.secondaryExecutor?.name} ({executorVault.secondaryExecutor?.relationship})</div>
                  <div className="text-white text-sm">Email: {executorVault.secondaryExecutor?.email}</div>
                  <div className="text-white text-sm">Phone: {executorVault.secondaryExecutor?.phone}</div>
                  <div className="text-white text-sm">Access Delay: {executorVault.secondaryExecutor?.accessDelay} hours</div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Credentials</div>
                  <div className="space-y-2">
                    {executorVault.credentials.map((cred) => (
                      <div key={cred.id} className={`bg-gray-900/50 rounded-lg p-4 border ${cred.category === 'critical' ? 'border-red-800' : 'border-gray-800'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${cred.category === 'critical' ? 'bg-red-500' : cred.category === 'important' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <div>
                              <h4 className="font-medium text-white">{cred.service}</h4>
                              <p className="text-sm text-gray-400">{cred.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cred.twoFactorEnabled && <Shield className="w-4 h-4 text-green-400" />}
                            <button className="p-2 hover:bg-gray-800 rounded"><Copy className="w-4 h-4 text-gray-400" /></button>
                            <button className="p-2 hover:bg-gray-800 rounded"><Edit className="w-4 h-4 text-gray-400" /></button>
                          </div>
                        </div>
                        {cred.expiryDate && <div className="mt-2 text-xs text-yellow-400">Expires: {cred.expiryDate.toLocaleString()}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Documents</div>
                  <div className="space-y-2">
                    {executorVault.documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{doc.name}</h4>
                          <p className="text-sm text-gray-400">{doc.type} | v{doc.version}</p>
                        </div>
                        <Button variant="ghost" size="icon"><Download className="w-4 h-4 text-pink-400" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Readiness Assessment Tab */}
          <TabsContent value="readiness" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Readiness Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Overall Score</div>
                  <Progress value={readiness.overallScore} className="h-3" />
                  <div className="text-white text-sm mt-1">{readiness.overallScore}%</div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Critical Gaps</div>
                  {readiness.criticalGaps.length === 0 ? (
                    <div className="text-green-400">No critical gaps!</div>
                  ) : (
                    <div className="space-y-2">
                      {readiness.criticalGaps.map((gap, idx) => (
                        <div key={idx} className="bg-red-900/40 border border-red-700 rounded-lg p-3">
                          <div className="text-white font-medium">{gap.item}</div>
                          <div className="text-xs text-red-300">{gap.impact}</div>
                          <div className="text-xs text-pink-200">{gap.solution}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Recommendations</div>
                  <ul className="list-disc pl-6 text-pink-100">
                    {readiness.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Growth Tracking Tab */}
          <TabsContent value="growth" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Growth Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Projected Value</div>
                  <div className="flex gap-8">
                    <div className="text-white text-sm">1 Year: £{valuation.growth.projectedValue1Year.toLocaleString()}</div>
                    <div className="text-white text-sm">3 Year: £{valuation.growth.projectedValue3Year.toLocaleString()}</div>
                    <div className="text-white text-sm">5 Year: £{valuation.growth.projectedValue5Year.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Growth Metrics</div>
                  <div className="flex gap-8">
                    <div className="text-white text-sm">Revenue Growth: {(valuation.growth.revenueGrowth * 100).toFixed(1)}%</div>
                    <div className="text-white text-sm">Client Growth: {(valuation.growth.clientGrowth * 100).toFixed(1)}%</div>
                    <div className="text-white text-sm">Profit Growth: {(valuation.growth.profitGrowth * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Exit Planning Tab */}
          <TabsContent value="exit" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Exit Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <div className="text-white font-semibold mb-2">Sale Preparation Tools</div>
                  <ul className="list-disc pl-6 text-pink-100">
                    <li>Valuation report export</li>
                    <li>Due diligence checklist</li>
                    <li>Buyer introduction templates</li>
                    <li>Professional network builder</li>
                  </ul>
                </div>
                <div className="mb-4">
                  <Button className="bg-pink-700 hover:bg-pink-800 text-white"><Download className="w-4 h-4 mr-2" />Export Valuation Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 