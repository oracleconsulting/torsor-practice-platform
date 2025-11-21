import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  Heart, 
  Users, 
  BarChart2, 
  ClipboardList, 
  LifeBuoy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Calendar,
  Smile,
  Frown,
  Meh,
  ArrowRight,
  Plus,
  Eye,
  MessageSquare,
  Shield,
  BookOpen,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import type { 
  TeamWellnessData, 
  StaffWellbeing, 
  PulseResponse, 
  WellbeingAlert,
  Intervention 
} from '../../types/wellness';

// Comprehensive mock data
const mockStaff: StaffWellbeing[] = [
  {
    id: 'staff-1',
    staffId: 'sarah-jones',
    name: 'Sarah Jones',
    role: 'Senior Accountant',
    department: 'Audit',
    status: {
      current: 'green',
      previousStatus: 'green',
      lastChanged: new Date('2024-01-15'),
      trend: 'stable'
    },
    workload: {
      contractedHours: 37.5,
      actualHours: 42,
      billableHours: 38,
      workloadIndex: 1.12,
      overtimeHours: 4.5,
      patterns: {
        averageStartTime: '08:30',
        averageEndTime: '17:45',
        lateNights: 2,
        weekendWork: 6,
        consecutiveDays: 5,
        lastDayOff: new Date('2024-01-20')
      }
    },
    wellness: {
      energyLevel: 8,
      stressLevel: 3,
      focusLevel: 7,
      history: {
        energy: [
          { date: new Date('2024-01-01'), value: 7 },
          { date: new Date('2024-01-08'), value: 8 },
          { date: new Date('2024-01-15'), value: 8 }
        ],
        stress: [
          { date: new Date('2024-01-01'), value: 4 },
          { date: new Date('2024-01-08'), value: 3 },
          { date: new Date('2024-01-15'), value: 3 }
        ],
        workload: [
          { date: new Date('2024-01-01'), value: 110 },
          { date: new Date('2024-01-08'), value: 115 },
          { date: new Date('2024-01-15'), value: 112 }
        ]
      }
    },
    timeOff: {
      holidaysTaken: 15,
      holidaysRemaining: 20,
      sickDays: 2,
      lastHoliday: new Date('2023-12-20'),
      nextPlannedLeave: new Date('2024-02-15')
    },
    burnoutPrediction: {
      riskScore: 25,
      riskLevel: 'low',
      timeToRed: 45,
      contributingFactors: ['Good work-life balance', 'Regular breaks'],
      recommendations: ['Continue current patterns', 'Plan next holiday']
    },
    support: {
      activeInterventions: [],
      completedInterventions: [],
      managerNotified: false,
      eapReferral: false,
      lastCheckIn: new Date('2024-01-10')
    }
  },
  {
    id: 'staff-2',
    staffId: 'mike-chen',
    name: 'Mike Chen',
    role: 'Tax Manager',
    department: 'Tax',
    status: {
      current: 'amber',
      previousStatus: 'green',
      lastChanged: new Date('2024-01-18'),
      trend: 'declining'
    },
    workload: {
      contractedHours: 37.5,
      actualHours: 48,
      billableHours: 42,
      workloadIndex: 1.28,
      overtimeHours: 10.5,
      patterns: {
        averageStartTime: '08:00',
        averageEndTime: '18:30',
        lateNights: 5,
        weekendWork: 12,
        consecutiveDays: 8,
        lastDayOff: new Date('2024-01-12')
      }
    },
    wellness: {
      energyLevel: 5,
      stressLevel: 7,
      focusLevel: 6,
      history: {
        energy: [
          { date: new Date('2024-01-01'), value: 7 },
          { date: new Date('2024-01-08'), value: 6 },
          { date: new Date('2024-01-15'), value: 5 }
        ],
        stress: [
          { date: new Date('2024-01-01'), value: 5 },
          { date: new Date('2024-01-08'), value: 6 },
          { date: new Date('2024-01-15'), value: 7 }
        ],
        workload: [
          { date: new Date('2024-01-01'), value: 120 },
          { date: new Date('2024-01-08'), value: 125 },
          { date: new Date('2024-01-15'), value: 128 }
        ]
      }
    },
    timeOff: {
      holidaysTaken: 8,
      holidaysRemaining: 27,
      sickDays: 1,
      lastHoliday: new Date('2023-11-15'),
      nextPlannedLeave: undefined
    },
    burnoutPrediction: {
      riskScore: 65,
      riskLevel: 'medium',
      timeToRed: 12,
      contributingFactors: ['High workload', 'Limited breaks', 'Overtime'],
      recommendations: ['Reduce workload', 'Schedule time off', 'Delegate tasks']
    },
    support: {
      activeInterventions: [],
      completedInterventions: [],
      managerNotified: true,
      eapReferral: false,
      lastCheckIn: new Date('2024-01-16')
    }
  },
  {
    id: 'staff-3',
    staffId: 'emma-wilson',
    name: 'Emma Wilson',
    role: 'Junior Accountant',
    department: 'Audit',
    status: {
      current: 'red',
      previousStatus: 'amber',
      lastChanged: new Date('2024-01-20'),
      trend: 'declining'
    },
    workload: {
      contractedHours: 37.5,
      actualHours: 52,
      billableHours: 45,
      workloadIndex: 1.39,
      overtimeHours: 14.5,
      patterns: {
        averageStartTime: '07:30',
        averageEndTime: '19:00',
        lateNights: 8,
        weekendWork: 18,
        consecutiveDays: 12,
        lastDayOff: new Date('2024-01-08')
      }
    },
    wellness: {
      energyLevel: 3,
      stressLevel: 9,
      focusLevel: 4,
      history: {
        energy: [
          { date: new Date('2024-01-01'), value: 6 },
          { date: new Date('2024-01-08'), value: 4 },
          { date: new Date('2024-01-15'), value: 3 }
        ],
        stress: [
          { date: new Date('2024-01-01'), value: 6 },
          { date: new Date('2024-01-08'), value: 8 },
          { date: new Date('2024-01-15'), value: 9 }
        ],
        workload: [
          { date: new Date('2024-01-01'), value: 130 },
          { date: new Date('2024-01-08'), value: 135 },
          { date: new Date('2024-01-15'), value: 139 }
        ]
      }
    },
    timeOff: {
      holidaysTaken: 5,
      holidaysRemaining: 30,
      sickDays: 0,
      lastHoliday: new Date('2023-10-20'),
      nextPlannedLeave: undefined
    },
    burnoutPrediction: {
      riskScore: 85,
      riskLevel: 'high',
      timeToRed: 5,
      contributingFactors: ['Excessive workload', 'No breaks', 'High stress'],
      recommendations: ['Immediate workload reduction', 'Mandatory time off', 'EAP referral']
    },
    support: {
      activeInterventions: [
        {
          id: 'int-1',
          type: 'workload_reduction',
          status: 'active',
          startDate: new Date('2024-01-21'),
          details: {
            description: 'Reduce workload by 30%',
            measurableGoal: 'Workload index below 1.2',
            assignedBy: 'Manager',
            notes: ['Started on 21st Jan', 'Monitoring progress']
          }
        }
      ],
      completedInterventions: [],
      managerNotified: true,
      eapReferral: true,
      lastCheckIn: new Date('2024-01-21')
    }
  }
];

const mockPulseResponses: PulseResponse[] = [
  {
    id: 'pulse-1',
    staffId: 'sarah-jones',
    date: new Date('2024-01-22'),
    anonymous: false,
    responses: {
      energy: { score: 8, trend: 'up' },
      workload: { perception: 'just_right', manageability: 8 },
      focus: { score: 7, distractions: ['Email notifications'] }
    },
    followUpRequested: false,
    sentimentScore: 0.8
  },
  {
    id: 'pulse-2',
    staffId: 'mike-chen',
    date: new Date('2024-01-22'),
    anonymous: true,
    responses: {
      energy: { score: 5, trend: 'down' },
      workload: { perception: 'heavy', manageability: 4 },
      focus: { score: 6, distractions: ['Meetings', 'Phone calls'] }
    },
    freeText: 'Feeling overwhelmed with tax season workload',
    followUpRequested: true,
    sentimentScore: 0.3
  }
];

const mockAlerts: WellbeingAlert[] = [
  {
    id: 'alert-1',
    type: 'critical',
    message: 'Emma Wilson showing signs of burnout',
    suggestedAction: 'Immediate intervention required',
    timestamp: new Date('2024-01-20'),
    staffId: 'staff-3',
    acknowledged: false
  },
  {
    id: 'alert-2',
    type: 'warning',
    message: 'Mike Chen workload exceeds 120%',
    suggestedAction: 'Consider redistributing tasks',
    timestamp: new Date('2024-01-18'),
    staffId: 'staff-2',
    acknowledged: true
  }
];

const mockTeamWellness: TeamWellnessData = {
  id: 'team-1',
  practiceId: 'practice-1',
  lastUpdated: new Date(),
  teamMetrics: {
    overallHealth: 82,
    averageWorkload: 74,
    averageEnergy: 7,
    burnoutRisk: 'medium',
    trending: 'stable',
    breakdown: {
      healthy: 7,
      monitoring: 2,
      atRisk: 1,
      critical: 0,
    },
  },
  staff: mockStaff,
  pulseData: {
    lastCompleted: new Date('2024-01-22'),
    nextDue: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    participationRate: 88,
    frequency: 'weekly',
    recentResponses: mockPulseResponses,
  },
  alerts: {
    critical: [mockAlerts[0]],
    warning: [mockAlerts[1]],
    positive: [],
  },
  settings: {
    busySeasonMode: false,
    anonymousSurveys: true,
    alertThresholds: {
      workloadWarning: 120,
      workloadCritical: 140,
      energyWarning: 4,
      consecutiveDaysWarning: 7,
    },
  },
};

const tabList = [
  { value: 'overview', label: 'Team Overview', icon: <Heart className="w-4 h-4 mr-2" /> },
  { value: 'individual', label: 'Individual Tracking', icon: <Users className="w-4 h-4 mr-2" /> },
  { value: 'pulse', label: 'Pulse Surveys', icon: <ClipboardList className="w-4 h-4 mr-2" /> },
  { value: 'insights', label: 'Insights & Trends', icon: <BarChart2 className="w-4 h-4 mr-2" /> },
  { value: 'resources', label: 'Support Resources', icon: <LifeBuoy className="w-4 h-4 mr-2" /> },
];

// Component for Team Health Gauge
const TeamHealthGauge: React.FC<{ score: number; trend: string }> = ({ score, trend }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthEmoji = (score: number) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '😐';
    return '😔';
  };

  return (
    <div className="text-center">
      <div className="text-6xl mb-2">{getHealthEmoji(score)}</div>
      <div className={`text-4xl font-bold ${getHealthColor(score)} mb-2`}>
        {score}%
      </div>
      <div className="text-gray-600 mb-4">Team Health Score</div>
      <Progress value={score} className="h-3 mb-2" />
      <div className="flex items-center justify-center gap-2 text-sm">
        {trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
        {trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
        <span className="text-gray-600 capitalize">{trend}</span>
      </div>
    </div>
  );
};

// Component for Staff Wellness Card
const StaffWellnessCard: React.FC<{ staff: StaffWellbeing }> = ({ staff }) => {
  const statusColors = {
    green: 'border-green-500 bg-green-500/10',
    amber: 'border-yellow-500 bg-yellow-500/10',
    red: 'border-red-500 bg-red-500/10'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'amber': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'red': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card className={`${statusColors[staff.status.current]} transition-all hover:scale-105`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{staff.name}</CardTitle>
            <p className="text-sm text-gray-600">{staff.role}</p>
          </div>
          {getStatusIcon(staff.status.current)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Workload</span>
            <span className={`font-medium ${
              staff.workload.workloadIndex > 1.2 ? 'text-red-500' : 
              staff.workload.workloadIndex > 1.1 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {Math.round(staff.workload.workloadIndex * 100)}%
            </span>
          </div>
          <Progress 
            value={Math.min(staff.workload.workloadIndex * 100, 150)} 
            className="h-2" 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Energy</span>
            <span className="font-medium">{staff.wellness.energyLevel}/10</span>
          </div>
          <Progress value={staff.wellness.energyLevel * 10} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Burnout Risk</span>
            <span className={`font-medium ${
              staff.burnoutPrediction.riskScore > 70 ? 'text-red-500' : 
              staff.burnoutPrediction.riskScore > 50 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {staff.burnoutPrediction.riskScore}%
            </span>
          </div>
          <Progress value={staff.burnoutPrediction.riskScore} className="h-2" />
        </div>

        {staff.workload.patterns.consecutiveDays > 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <p className="text-xs text-yellow-800">
              ⚠️ {staff.workload.patterns.consecutiveDays} days without break
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            Details
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-1" />
            Check In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for Pulse Survey
const PulseSurveyComponent: React.FC = () => {
  const [responses, setResponses] = useState({
    energy: 5,
    workload: 'just_right' as const,
    focus: 5,
    anonymous: false,
    comments: ''
  });

  const energyEmojis = [
    { score: 1, emoji: '😔', label: 'Exhausted' },
    { score: 3, emoji: '😟', label: 'Tired' },
    { score: 5, emoji: '😐', label: 'Okay' },
    { score: 7, emoji: '🙂', label: 'Good' },
    { score: 9, emoji: '😊', label: 'Energized' }
  ];

  const submitPulse = () => {
    // Mock submission
    console.log('Pulse submitted:', responses);
    alert('Thanks for checking in! 💚 Your wellbeing matters to us.');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-xl">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Quick Wellness Check-In
      </h3>
      
      {/* Energy Level */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-3">
          How's your energy today?
        </label>
        <div className="flex justify-between">
          {energyEmojis.map(({ score, emoji, label }) => (
            <button
              key={score}
              onClick={() => setResponses(prev => ({ ...prev, energy: score }))}
              className={`
                p-3 rounded-lg transition-all
                ${responses.energy === score 
                  ? 'bg-green-500/20 scale-110' 
                  : 'hover:bg-gray-200'
                }
              `}
            >
              <div className="text-3xl">{emoji}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Workload */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-3">
          How would you describe your current workload?
        </label>
        <div className="space-y-2">
          {['too_light', 'just_right', 'heavy', 'overwhelming'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="workload"
                value={option}
                checked={responses.workload === option}
                onChange={(e) => setResponses(prev => ({ ...prev, workload: e.target.value as any }))}
                className="mr-2"
              />
              <span className="text-sm capitalize">
                {option.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Focus */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-3">
          How focused do you feel today? (1-10)
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={responses.focus}
          onChange={(e) => setResponses(prev => ({ ...prev, focus: parseInt(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 - Distracted</span>
          <span>{responses.focus}/10</span>
          <span>10 - Laser Focus</span>
        </div>
      </div>
      
      {/* Anonymous Option */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={responses.anonymous}
            onChange={(e) => setResponses(prev => ({ ...prev, anonymous: e.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Submit anonymously</span>
        </label>
      </div>
      
      <Button
        onClick={submitPulse}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        Submit Check-In
      </Button>
    </div>
  );
};

export const TeamWellnessPage: React.FC = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div className="team-wellness-container" style={{ overflowY: 'auto', height: '100vh' }}>
      <div className="min-h-screen overflow-auto bg-navy-900 relative">
        {/* Page Header */}
        <div className="relative bg-navy-900 py-16 overflow-hidden border-b-4 border-amber-500">
          <div className="relative z-10 container mx-auto px-6">
            <h1 className="text-5xl font-black uppercase text-white mb-2 flex items-center">
              <Heart className="w-7 h-7 mr-3 text-amber-500" />
              TEAM WELLNESS MONITOR
            </h1>
            <p className="text-xl text-white/80 font-bold uppercase">
              Monitor staff wellbeing, predict burnout risk, and provide early intervention for your team.
            </p>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          
          <Tabs.Root value={tab} onValueChange={setTab} className="mb-8">
            <Tabs.List className="flex gap-2 border-b border-green-200 mb-6 overflow-x-auto">
              {tabList.map(t => (
                <Tabs.Trigger
                  key={t.value}
                  value={t.value}
                  className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-1 transition-colors focus:outline-none whitespace-nowrap ${
                    tab === t.value ? 'bg-green-100 text-green-900' : 'text-green-700 hover:bg-green-50'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            
            <div className="bg-slate-800/90 rounded-xl shadow p-6 min-h-[600px]">
              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* Team Health Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6">
                      <TeamHealthGauge 
                        score={mockTeamWellness.teamMetrics.overallHealth}
                        trend={mockTeamWellness.teamMetrics.trending}
                      />
                    </div>
                    
                    <div className="bg-gray-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Team Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Healthy</span>
                          <span className="text-green-400 font-bold">{mockTeamWellness.teamMetrics.breakdown.healthy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Monitoring</span>
                          <span className="text-yellow-400 font-bold">{mockTeamWellness.teamMetrics.breakdown.monitoring}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">At Risk</span>
                          <span className="text-orange-400 font-bold">{mockTeamWellness.teamMetrics.breakdown.atRisk}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Critical</span>
                          <span className="text-red-400 font-bold">{mockTeamWellness.teamMetrics.breakdown.critical}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Engagement</h3>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {mockTeamWellness.pulseData.participationRate}%
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Pulse participation</p>
                        <Button variant="outline" size="sm" className="text-green-400 border-green-400 hover:bg-green-400/10">
                          Send reminder →
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Staff Grid */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Staff Wellness Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockStaff.map(staff => (
                        <StaffWellnessCard key={staff.id} staff={staff} />
                      ))}
                    </div>
                  </div>

                  {/* Alerts */}
                  {mockAlerts.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h3>
                      <div className="space-y-3">
                        {mockAlerts.map(alert => (
                          <div
                            key={alert.id}
                            className={`p-4 rounded-lg border ${
                              alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{alert.message}</p>
                                <p className="text-sm text-gray-600 mt-1">{alert.suggestedAction}</p>
                              </div>
                              <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                                {alert.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'individual' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Individual Staff Tracking</h3>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {mockStaff.map(staff => (
                      <StaffWellnessCard key={staff.id} staff={staff} />
                    ))}
                  </div>
                </div>
              )}

              {tab === 'pulse' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pulse Surveys</h3>
                    <p className="text-gray-600 mb-6">
                      Quick wellness check-ins to monitor team wellbeing
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PulseSurveyComponent />
                    
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Recent Responses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {mockPulseResponses.map(response => (
                              <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div>
                                  <p className="font-medium">
                                    {response.anonymous ? 'Anonymous' : 'Staff Member'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Energy: {response.responses.energy.score}/10
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    {response.date.toLocaleDateString()}
                                  </p>
                                  {response.followUpRequested && (
                                    <Badge variant="secondary" className="text-xs">Follow-up</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'insights' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Insights & Trends</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Wellness Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Team Health Score</span>
                            <span className="text-green-600 font-medium">+5% this month</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Average Energy</span>
                            <span className="text-yellow-600 font-medium">-1 point</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Burnout Risk</span>
                            <span className="text-red-600 font-medium">+12%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Department Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {['Audit', 'Tax', 'Advisory'].map((dept, index) => (
                            <div key={dept} className="relative">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">{dept}</span>
                                <span className="text-sm font-medium">{75 + index * 5}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${75 + index * 5}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">Reduce Mike Chen's workload</p>
                            <p className="text-sm text-yellow-700">Currently at 128% capacity</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <Target className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">Immediate intervention for Emma Wilson</p>
                            <p className="text-sm text-red-700">Burnout risk at 85%</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Target className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">Schedule team wellness workshop</p>
                            <p className="text-sm text-green-700">High participation in pulse surveys</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {tab === 'resources' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Support Resources</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          Employee Assistance Program (EAP)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">24/7 Helpline</p>
                            <p className="text-sm text-gray-600">0800 123 4567</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Online Portal</p>
                            <p className="text-sm text-gray-600">www.eap-support.co.uk</p>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Mail className="w-4 h-4 mr-2" />
                          Request EAP Referral
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-green-600" />
                          Wellness Resources
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <a href="#" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <span>📚</span>
                            <span className="text-sm">Managing Work-Life Balance Guide</span>
                          </a>
                          <a href="#" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <span>🧘</span>
                            <span className="text-sm">Stress Management Techniques</span>
                          </a>
                          <a href="#" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <span>💪</span>
                            <span className="text-sm">Building Resilience Workshop</span>
                          </a>
                          <a href="#" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <span>🌱</span>
                            <span className="text-sm">Mindfulness & Meditation</span>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Anonymous Feedback Portal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-amber-800 mb-2">
                          🔒 Your Privacy is Protected
                        </h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• No identifying information is stored</li>
                          <li>• Timestamps are randomized</li>
                          <li>• IP addresses are not logged</li>
                          <li>• Feedback is aggregated before review</li>
                        </ul>
                      </div>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Submit Anonymous Feedback
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
};

export default TeamWellnessPage; 