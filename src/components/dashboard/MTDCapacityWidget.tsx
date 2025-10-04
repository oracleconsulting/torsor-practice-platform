import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WidgetContainer } from '../../shared/WidgetContainer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Users,
  Settings,
  FileText,
  ArrowRight,
  Play,
  BarChart3,
  Target,
  Mail,
  Calendar,
  DollarSign,
  Zap,
  Eye,
  Maximize2
} from 'lucide-react';

// Enhanced interfaces based on the specification
interface CapacityData {
  week: number;
  date: Date;
  totalCapacity: number;
  allocatedHours: number;
  utilizationRate: number;
  staffAllocations: {
    staffId: string;
    staffName: string;
    hours: number;
    clients: string[];
  }[];
}

interface ClientReadiness {
  clientId: string;
  clientName: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  factors: {
    bookkeepingQuality: number;
    digitalRecords: boolean;
    softwareConnected: boolean;
    clientEngagement: number;
    dataCompleteness: number;
  };
  lastAssessed: Date;
  improvementActions: string[];
}

interface FeeCalculation {
  clientId: string;
  currentFees: {
    annual: number;
    breakdown: Record<string, number>;
  };
  mtdFees: {
    setup: number;
    quarterly: number;
    annual: number;
    total: number;
  };
  revenueIncrease: number;
  percentageIncrease: number;
}

interface MTDCockpitData {
  totalClients: number;
  readyPercentage: number;
  revenueOpportunity: number;
  weeklyCapacity: CapacityData[];
  clientReadiness: ClientReadiness[];
  feeCalculations: FeeCalculation[];
  alerts: string[];
}

export const MTDCapacityWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'capacity' | 'clients' | 'fees' | 'communications'>('overview');
  
  // Mock data based on the specification
  const mtdData: MTDCockpitData = {
    totalClients: 156,
    readyPercentage: 68,
    revenueOpportunity: 245,
    weeklyCapacity: Array.from({ length: 12 }, (_, i) => ({
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
        improvementActions: ['Ready for MTD']
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
        improvementActions: ['Connect accounting software', 'Improve data quality']
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
        improvementActions: ['Digital transformation required', 'Staff training needed']
      }
    ],
    feeCalculations: [
      {
        clientId: '1',
        currentFees: { annual: 5000, breakdown: { 'Annual Accounts': 3000, 'Tax Returns': 2000 } },
        mtdFees: { setup: 1500, quarterly: 800, annual: 3200, total: 4700 },
        revenueIncrease: -300,
        percentageIncrease: -6
      },
      {
        clientId: '2',
        currentFees: { annual: 3000, breakdown: { 'Annual Accounts': 2000, 'Tax Returns': 1000 } },
        mtdFees: { setup: 1200, quarterly: 600, annual: 2400, total: 3600 },
        revenueIncrease: 600,
        percentageIncrease: 20
      },
      {
        clientId: '3',
        currentFees: { annual: 2000, breakdown: { 'Annual Accounts': 1500, 'Tax Returns': 500 } },
        mtdFees: { setup: 2000, quarterly: 400, annual: 1600, total: 3600 },
        revenueIncrease: 1600,
        percentageIncrease: 80
      }
    ],
    alerts: [
      'Week 3 capacity at 95% - consider staff reallocation',
      '12 clients require immediate attention (Grade D/E)',
      'Revenue opportunity: £245k from MTD implementation'
    ]
  };

  const getCapacityColor = (utilization: number) => {
    if (utilization < 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (utilization < 90) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    if (utilization < 100) return 'bg-gradient-to-r from-red-500 to-red-600';
    return 'bg-gradient-to-r from-red-700 to-red-800';
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

  const totalRevenueIncrease = useMemo(() => {
    return mtdData.feeCalculations.reduce((sum, calc) => sum + calc.revenueIncrease, 0);
  }, [mtdData.feeCalculations]);

  // Collapsed view
  if (!expanded) {
    return (
      <WidgetContainer
        title="MTD ITSA Cockpit"
        icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        loading={false}
        error=""
        onRefresh={() => {}}
        isNew={true}
        className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
      >
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{mtdData.totalClients}</div>
              <div className="text-gray-400 text-xs">Total Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{mtdData.readyPercentage}%</div>
              <div className="text-gray-400 text-xs">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">£{mtdData.revenueOpportunity}k</div>
              <div className="text-gray-400 text-xs">Revenue Opp.</div>
            </div>
          </div>

          {/* Mini Heat Map Preview */}
          <div>
            <div className="flex gap-1 h-8 mb-2">
              {mtdData.weeklyCapacity.slice(0, 8).map((week) => (
                <div
                  key={week.week}
                  className={`flex-1 rounded ${getCapacityColor(week.utilizationRate)}`}
                  title={`Week ${week.week}: ${week.utilizationRate}% utilized`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400">Next 8 weeks capacity</div>
          </div>

          {/* Alerts */}
          {mtdData.alerts.length > 0 && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-400">
                ⚠️ {mtdData.alerts[0]}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="flex-1 text-white border-white/20 hover:bg-white/10"
            >
              View Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </WidgetContainer>
    );
  }

  // Expanded view
  return (
    <WidgetContainer
      title="MTD ITSA Capacity Cockpit"
      icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      loading={false}
      error=""
      onRefresh={() => {}}
      isNew={true}
      className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'capacity', label: 'Capacity', icon: <Users className="w-4 h-4" /> },
            { id: 'clients', label: 'Clients', icon: <Target className="w-4 h-4" /> },
            { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'communications', label: 'Communications', icon: <Mail className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{mtdData.totalClients}</div>
                <div className="text-gray-400 text-sm">Total Clients</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{mtdData.readyPercentage}%</div>
                <div className="text-gray-400 text-sm">Ready</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">£{mtdData.revenueOpportunity}k</div>
                <div className="text-gray-400 text-sm">Revenue Opp.</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{mtdData.weeklyCapacity.filter(w => w.utilizationRate > 90).length}</div>
                <div className="text-gray-400 text-sm">Bottlenecks</div>
              </div>
            </div>

            {/* Capacity Heat Map */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Capacity Heat Map (Next 12 Weeks)</h3>
              <div className="grid grid-cols-12 gap-1">
                {mtdData.weeklyCapacity.map((week) => (
                  <div
                    key={week.week}
                    className={`h-16 rounded cursor-pointer transition-all hover:scale-105 ${getCapacityColor(week.utilizationRate)}`}
                    onClick={() => setSelectedWeek(week.week)}
                    title={`Week ${week.week}: ${week.utilizationRate}% utilized`}
                  >
                    <div className="text-xs text-white p-1">
                      <div className="font-bold">{week.week}</div>
                      <div>{week.utilizationRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-2">
              {mtdData.alerts.map((alert, index) => (
                <div key={index} className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <div className="text-sm text-red-400">⚠️ {alert}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Staff Capacity Planning</h3>
              <div className="space-y-4">
                {mtdData.weeklyCapacity.slice(0, 4).map((week) => (
                  <div key={week.week} className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Week {week.week}</span>
                      <Badge variant="outline" className={getCapacityColor(week.utilizationRate).replace('bg-gradient-to-r ', 'bg-').replace(' to-', '-')}>
                        {week.utilizationRate}% utilized
                      </Badge>
                    </div>
                    <Progress value={week.utilizationRate} className="h-2 mb-2" />
                    <div className="text-sm text-gray-400">
                      {week.staffAllocations.length} staff allocated, {week.allocatedHours}/{week.totalCapacity} hours
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Client Readiness Assessment</h3>
              <div className="space-y-3">
                {mtdData.clientReadiness.map((client) => (
                  <div key={client.clientId} className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{client.clientName}</span>
                      <Badge className={getGradeColor(client.grade)}>
                        Grade {client.grade}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-2">
                      <div>Bookkeeping: {client.factors.bookkeepingQuality}%</div>
                      <div>Engagement: {client.factors.clientEngagement}%</div>
                      <div>Digital: {client.factors.digitalRecords ? 'Yes' : 'No'}</div>
                      <div>Connected: {client.factors.softwareConnected ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last assessed: {client.lastAssessed.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Fee Impact Analysis</h3>
              <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="text-green-400 font-medium">Total Revenue Opportunity</div>
                <div className="text-2xl font-bold text-green-400">£{totalRevenueIncrease.toLocaleString()}</div>
              </div>
              <div className="space-y-3">
                {mtdData.feeCalculations.map((calc) => (
                  <div key={calc.clientId} className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Client {calc.clientId}</span>
                      <Badge variant={calc.revenueIncrease > 0 ? "default" : "destructive"}>
                        {calc.revenueIncrease > 0 ? '+' : ''}£{calc.revenueIncrease}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                      <div>Current: £{calc.currentFees.annual}</div>
                      <div>MTD Total: £{calc.mtdFees.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Client Communications Hub</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Send MTD Update
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Bulk Assessment
                  </Button>
                </div>
                <div className="border border-white/10 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-2">Quick Actions</div>
                  <div className="space-y-2">
                    <button className="text-left text-sm text-blue-400 hover:text-blue-300 w-full">
                      • Send readiness assessment to Grade C clients
                    </button>
                    <button className="text-left text-sm text-blue-400 hover:text-blue-300 w-full">
                      • Schedule MTD training sessions
                    </button>
                    <button className="text-left text-sm text-blue-400 hover:text-blue-300 w-full">
                      • Send fee increase notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Plan Capacity
          </Button>
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
            <ArrowRight className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Regulatory Notice */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <div className="text-purple-300 text-sm font-medium">MTD ITSA Deadline</div>
              <div className="text-purple-200 text-xs">
                MTD for Income Tax Self Assessment becomes mandatory from April 2026. Start preparation now to ensure smooth transition.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}; 