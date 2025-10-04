import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  Mail,
  MessageSquare,
  Calculator,
  DollarSign,
  Target,
  Zap,
  Eye,
  Settings,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  FileText,
  Shield,
  Building,
  Phone,
  Mail as MailIcon
} from 'lucide-react';
import { MTDCockpitData, ClientReadiness, FeeCalculation, CapacityData } from '../types/accountancy';

export const MTDCapacityPage: React.FC = () => {
  const { subscriptionTier } = useAccountancyContext();
  const [activeTab, setActiveTab] = useState('capacity');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'8weeks' | '12weeks' | '16weeks'>('12weeks');

  // Mock data based on the specification
  const mtdData: MTDCockpitData = {
    totalClients: 156,
    readyPercentage: 68,
    revenueOpportunity: 245000,
    weeklyCapacity: Array.from({ length: 16 }, (_, i) => ({
      week: i + 1,
      date: new Date(2026, 3, i * 7), // Starting April 2026
      totalCapacity: 160,
      allocatedHours: Math.floor(Math.random() * 120) + 40,
      utilizationRate: Math.floor(Math.random() * 40) + 60,
      staffAllocations: [
        { staffId: '1', staffName: 'Sarah Johnson', hours: 35, clients: ['Client A', 'Client B'] },
        { staffId: '2', staffName: 'Mike Chen', hours: 28, clients: ['Client C'] },
        { staffId: '3', staffName: 'Emma Davis', hours: 32, clients: ['Client D', 'Client E'] }
      ]
    })),
    clientReadiness: [
      {
        clientId: '1',
        clientName: 'ABC Ltd',
        grade: 'A',
        factors: {
          bookkeepingQuality: 95,
          digitalRecords: true,
          softwareConnected: true,
          clientEngagement: 90,
          dataCompleteness: 98
        },
        lastAssessed: new Date('2024-01-15'),
        improvementActions: ['Ready for MTD'],
        status: 'ready'
      },
      {
        clientId: '2',
        clientName: 'XYZ Corp',
        grade: 'C',
        factors: {
          bookkeepingQuality: 65,
          digitalRecords: true,
          softwareConnected: false,
          clientEngagement: 70,
          dataCompleteness: 60
        },
        lastAssessed: new Date('2024-01-10'),
        improvementActions: ['Connect accounting software', 'Improve data quality'],
        status: 'in_progress'
      },
      {
        clientId: '3',
        clientName: 'DEF Ltd',
        grade: 'E',
        factors: {
          bookkeepingQuality: 25,
          digitalRecords: false,
          softwareConnected: false,
          clientEngagement: 30,
          dataCompleteness: 20
        },
        lastAssessed: new Date('2024-01-05'),
        improvementActions: ['Digital transformation required', 'Staff training needed'],
        status: 'needs_attention'
      }
    ],
    feeCalculations: [
      {
        clientId: '1',
        currentFees: { annual: 5000, breakdown: { 'Annual Accounts': 3000, 'Tax Returns': 2000 } },
        mtdFees: { setup: 1500, quarterly: 800, annual: 3200, total: 4700 },
        revenueIncrease: -300,
        percentageIncrease: -6,
        implementationCost: 500,
        roi: -60
      },
      {
        clientId: '2',
        currentFees: { annual: 3000, breakdown: { 'Annual Accounts': 2000, 'Tax Returns': 1000 } },
        mtdFees: { setup: 1200, quarterly: 600, annual: 2400, total: 3600 },
        revenueIncrease: 600,
        percentageIncrease: 20,
        implementationCost: 800,
        roi: 75
      },
      {
        clientId: '3',
        currentFees: { annual: 2000, breakdown: { 'Annual Accounts': 1500, 'Tax Returns': 500 } },
        mtdFees: { setup: 2000, quarterly: 400, annual: 1600, total: 3600 },
        revenueIncrease: 1600,
        percentageIncrease: 80,
        implementationCost: 1500,
        roi: 107
      }
    ],
    alerts: [
      'Week 3 capacity at 95% - consider staff reallocation',
      '12 clients require immediate attention (Grade D/E)',
      'Revenue opportunity: £245k from MTD implementation'
    ],
    implementationTimeline: [
      {
        phase: 'Phase 1: Assessment',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        status: 'completed',
        clients: ['Client A', 'Client B', 'Client C']
      },
      {
        phase: 'Phase 2: Digital Setup',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        status: 'in_progress',
        clients: ['Client D', 'Client E', 'Client F']
      },
      {
        phase: 'Phase 3: Training',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
        status: 'pending',
        clients: ['Client G', 'Client H']
      }
    ],
    staffCapacity: [
      {
        staffId: '1',
        staffName: 'Sarah Johnson',
        role: 'Senior Accountant',
        currentUtilization: 85,
        mtdTraining: true,
        availableHours: 35
      },
      {
        staffId: '2',
        staffName: 'Mike Chen',
        role: 'Accountant',
        currentUtilization: 70,
        mtdTraining: false,
        availableHours: 40
      },
      {
        staffId: '3',
        staffName: 'Emma Davis',
        role: 'Junior Accountant',
        currentUtilization: 60,
        mtdTraining: false,
        availableHours: 40
      }
    ]
  };

  // Helper functions
  const getCapacityColor = (utilization: number) => {
    if (utilization < 70) return 'bg-green-500 hover:bg-green-600';
    if (utilization < 90) return 'bg-yellow-500 hover:bg-yellow-600';
    if (utilization < 100) return 'bg-red-500 hover:bg-red-600';
    return 'bg-red-700 hover:bg-red-800';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-black';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'needs_attention': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'not_started': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const totalRevenueIncrease = useMemo(() => {
    return mtdData.feeCalculations.reduce((sum, calc) => sum + calc.revenueIncrease, 0);
  }, [mtdData.feeCalculations]);

  const readinessBreakdown = useMemo(() => {
    const breakdown = { gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0 };
    mtdData.clientReadiness.forEach(client => {
      switch (client.grade) {
        case 'A': breakdown.gradeA++; break;
        case 'B': breakdown.gradeB++; break;
        case 'C': breakdown.gradeC++; break;
        case 'D': breakdown.gradeD++; break;
        case 'E': breakdown.gradeE++; break;
      }
    });
    return breakdown;
  }, [mtdData.clientReadiness]);

  return (
    <div className="min-h-screen bg-[#f5f1e8] relative">
      {/* Header */}
      <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#ff6b35] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black uppercase text-white mb-2">MTD ITSA CAPACITY COCKPIT</h1>
              <p className="text-xl text-white/80 font-bold uppercase">Making Tax Digital for Income Tax Self Assessment</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-[#ff6b35] text-white border-[#ff6b35] font-black uppercase">
              {subscriptionTier} Tier
            </Badge>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{mtdData.totalClients}</div>
              <div className="text-purple-100 text-sm">Total Clients</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{mtdData.readyPercentage}%</div>
              <div className="text-purple-100 text-sm">Ready for MTD</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">£{(mtdData.revenueOpportunity / 1000).toFixed(0)}k</div>
              <div className="text-purple-100 text-sm">Revenue Opportunity</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">Apr 2026</div>
              <div className="text-purple-100 text-sm">MTD Start Date</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="capacity" className="text-white data-[state=active]:bg-purple-600">
              Capacity Planner
            </TabsTrigger>
            <TabsTrigger value="readiness" className="text-white data-[state=active]:bg-purple-600">
              Client Readiness
            </TabsTrigger>
            <TabsTrigger value="communications" className="text-white data-[state=active]:bg-purple-600">
              Communications
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-white data-[state=active]:bg-purple-600">
              Revenue Calculator
            </TabsTrigger>
            <TabsTrigger value="hmrc" className="text-white data-[state=active]:bg-purple-600">
              HMRC Integration
            </TabsTrigger>
          </TabsList>

          {/* Capacity Planner Tab */}
          <TabsContent value="capacity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Capacity Heat Map */}
              <Card className="lg:col-span-2 bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Capacity Heat Map
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8weeks">8 Weeks</SelectItem>
                          <SelectItem value="12weeks">12 Weeks</SelectItem>
                          <SelectItem value="16weeks">16 Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {mtdData.weeklyCapacity.slice(0, timeRange === '8weeks' ? 8 : timeRange === '12weeks' ? 12 : 16).map((week) => (
                      <div
                        key={week.week}
                        className={`h-20 rounded cursor-pointer transition-all ${getCapacityColor(week.utilizationRate)}`}
                        onClick={() => setSelectedWeek(week.week)}
                      >
                        <div className="p-2 text-xs text-white">
                          <div className="font-semibold">W{week.week}</div>
                          <div>{week.utilizationRate}%</div>
                          <div className="text-xs opacity-75">{week.allocatedHours}h</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-white">Available (&lt;70%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-white">Busy (70-90%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-white">Critical (90-100%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-700 rounded"></div>
                      <span className="text-white">Overloaded (&gt;100%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Capacity */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Staff Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mtdData.staffCapacity.map((staff) => (
                    <div key={staff.staffId} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{staff.staffName}</span>
                        <Badge variant="outline" className={`text-xs ${staff.mtdTraining ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                          {staff.mtdTraining ? 'Trained' : 'Needs Training'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Utilization</span>
                          <span className="text-white">{staff.currentUtilization}%</span>
                        </div>
                        <Progress value={staff.currentUtilization} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Available</span>
                          <span className="text-white">{staff.availableHours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Capacity Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mtdData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-200">{alert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Readiness Tab */}
          <TabsContent value="readiness" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Readiness Overview */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Readiness Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Grade A (Ready)</span>
                      <Badge className="bg-green-500 text-white">{readinessBreakdown.gradeA}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Grade B (Nearly Ready)</span>
                      <Badge className="bg-blue-500 text-white">{readinessBreakdown.gradeB}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Grade C (Work Needed)</span>
                      <Badge className="bg-yellow-500 text-black">{readinessBreakdown.gradeC}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Grade D (Major Work)</span>
                      <Badge className="bg-orange-500 text-white">{readinessBreakdown.gradeD}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Grade E (Critical)</span>
                      <Badge className="bg-red-500 text-white">{readinessBreakdown.gradeE}</Badge>
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
                      Client Readiness Assessment
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
                    {mtdData.clientReadiness.map((client) => (
                      <div
                        key={client.clientId}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${getGradeColor(client.grade)}`}
                        onClick={() => setSelectedClient(client.clientId)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">{client.clientName}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${client.grade === 'C' ? 'text-black' : 'text-white'}`}>
                              {client.grade}
                            </span>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(client.status)}`}>
                              {client.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">Bookkeeping</span>
                              <span className="text-white">{client.factors.bookkeepingQuality}%</span>
                            </div>
                            <Progress value={client.factors.bookkeepingQuality} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-300">Engagement</span>
                              <span className="text-white">{client.factors.clientEngagement}%</span>
                            </div>
                            <Progress value={client.factors.clientEngagement} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className={`flex items-center gap-1 ${client.factors.digitalRecords ? 'text-green-300' : 'text-red-300'}`}>
                            {client.factors.digitalRecords ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            Digital Records
                          </span>
                          <span className={`flex items-center gap-1 ${client.factors.softwareConnected ? 'text-green-300' : 'text-red-300'}`}>
                            {client.factors.softwareConnected ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            Software Connected
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Builder */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Campaign Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Campaign Type</Label>
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grade-a">Grade A - Ready for MTD</SelectItem>
                        <SelectItem value="grade-b">Grade B - Nearly Ready</SelectItem>
                        <SelectItem value="grade-c">Grade C - Work Needed</SelectItem>
                        <SelectItem value="grade-d">Grade D - Major Work Required</SelectItem>
                        <SelectItem value="grade-e">Grade E - Critical Attention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Message Template</Label>
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtd-introduction">MTD Introduction</SelectItem>
                        <SelectItem value="readiness-assessment">Readiness Assessment</SelectItem>
                        <SelectItem value="action-required">Action Required</SelectItem>
                        <SelectItem value="deadline-reminder">Deadline Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Delivery Method</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="accent-purple-600" defaultChecked />
                        <span className="text-white">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="accent-purple-600" />
                        <span className="text-white">SMS</span>
                      </label>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Campaign
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign History */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Campaign History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Grade E - Critical Attention</span>
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                          Sent
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-300">Sent to 12 clients • 8 opened • 3 responded</div>
                      <div className="text-xs text-gray-400 mt-1">2 days ago</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">MTD Introduction</span>
                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Scheduled
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-300">Scheduled for 156 clients</div>
                      <div className="text-xs text-gray-400 mt-1">Tomorrow 9:00 AM</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Calculator Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Overview */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white">£{(mtdData.revenueOpportunity / 1000).toFixed(0)}k</div>
                      <div className="text-purple-200 text-sm">Total Opportunity</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white">£{(totalRevenueIncrease / 1000).toFixed(0)}k</div>
                      <div className="text-purple-200 text-sm">Revenue Increase</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Setup Fees</span>
                      <span className="text-white">£{(mtdData.feeCalculations.reduce((sum, calc) => sum + calc.mtdFees.setup, 0) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Annual Recurring</span>
                      <span className="text-white">£{(mtdData.feeCalculations.reduce((sum, calc) => sum + calc.mtdFees.annual, 0) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Implementation Cost</span>
                      <span className="text-white">£{(mtdData.feeCalculations.reduce((sum, calc) => sum + calc.implementationCost, 0) / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Calculator */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Fee Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Current Annual Fee</Label>
                    <Input 
                      type="number" 
                      placeholder="£0" 
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Client Grade</Label>
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Grade A - Ready</SelectItem>
                        <SelectItem value="B">Grade B - Nearly Ready</SelectItem>
                        <SelectItem value="C">Grade C - Work Needed</SelectItem>
                        <SelectItem value="D">Grade D - Major Work</SelectItem>
                        <SelectItem value="E">Grade E - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Recommended MTD Fees</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Setup Fee</span>
                        <span className="text-white">£1,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Quarterly Fee</span>
                        <span className="text-white">£800</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Annual Total</span>
                        <span className="text-white font-semibold">£4,700</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Comparison Table */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Fee Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white p-2">Client</th>
                        <th className="text-left text-white p-2">Current Fee</th>
                        <th className="text-left text-white p-2">MTD Fee</th>
                        <th className="text-left text-white p-2">Increase</th>
                        <th className="text-left text-white p-2">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mtdData.feeCalculations.map((calc) => (
                        <tr key={calc.clientId} className="border-b border-white/5">
                          <td className="text-white p-2">Client {calc.clientId}</td>
                          <td className="text-white p-2">£{calc.currentFees.annual.toLocaleString()}</td>
                          <td className="text-white p-2">£{calc.mtdFees.total.toLocaleString()}</td>
                          <td className={`p-2 ${calc.revenueIncrease >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {calc.revenueIncrease >= 0 ? '+' : ''}£{calc.revenueIncrease.toLocaleString()}
                          </td>
                          <td className={`p-2 ${calc.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {calc.roi >= 0 ? '+' : ''}{calc.roi}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HMRC Integration Tab */}
          <TabsContent value="hmrc" className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  HMRC Integration (Phase 2)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-4">HMRC Integration Coming Soon</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Direct integration with HMRC's MTD ITSA gateway for bulk enrollment checking, 
                    submission monitoring, and automated filing will be available in Phase 2.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white mb-2">✓</div>
                      <div className="text-purple-200 text-sm">Bulk Enrollment Checking</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white mb-2">✓</div>
                      <div className="text-purple-200 text-sm">Submission Monitoring</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white mb-2">✓</div>
                      <div className="text-purple-200 text-sm">Automated Filing</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 