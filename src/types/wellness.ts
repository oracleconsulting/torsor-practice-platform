// Team Wellness Monitor Types

export interface TimeSeriesData {
  date: Date;
  value: number;
  label?: string;
}

export interface WellbeingAlert {
  id: string;
  type: 'critical' | 'warning' | 'positive';
  message: string;
  suggestedAction: string;
  timestamp: Date;
  staffId?: string;
  acknowledged: boolean;
}

export interface PulseResponse {
  id: string;
  staffId: string;
  date: Date;
  anonymous: boolean;
  
  responses: {
    energy: {
      score: number; // 1-10
      trend: 'up' | 'down' | 'stable';
    };
    workload: {
      perception: 'too_light' | 'just_right' | 'heavy' | 'overwhelming';
      manageability: number; // 1-10
    };
    focus: {
      score: number; // 1-10
      distractions: string[];
    };
  };
  
  freeText?: string;
  followUpRequested: boolean;
  sentimentScore?: number; // AI analyzed
}

export interface Intervention {
  id: string;
  type: 'workload_reduction' | 'time_off' | 'support_session' | 'training' | 'flexible_hours';
  status: 'planned' | 'active' | 'completed';
  startDate: Date;
  endDate?: Date;
  
  details: {
    description: string;
    measurableGoal: string;
    assignedBy: string;
    notes: string[];
  };
  
  effectiveness?: {
    preScore: number;
    postScore: number;
    feedback: string;
  };
}

export interface StaffWellbeing {
  id: string;
  staffId: string;
  name: string;
  role: string;
  department: string;
  
  // Current status
  status: {
    current: 'green' | 'amber' | 'red';
    previousStatus: 'green' | 'amber' | 'red';
    lastChanged: Date;
    trend: 'improving' | 'stable' | 'declining';
  };
  
  // Workload metrics
  workload: {
    contractedHours: number;
    actualHours: number;
    billableHours: number;
    workloadIndex: number; // actual/contracted
    overtimeHours: number;
    
    patterns: {
      averageStartTime: string;
      averageEndTime: string;
      lateNights: number; // past month
      weekendWork: number; // hours past month
      consecutiveDays: number;
      lastDayOff: Date;
    };
  };
  
  // Wellness metrics
  wellness: {
    energyLevel: number; // 1-10
    stressLevel: number; // 1-10
    focusLevel: number; // 1-10
    
    history: {
      energy: TimeSeriesData[];
      stress: TimeSeriesData[];
      workload: TimeSeriesData[];
    };
  };
  
  // Time off and recovery
  timeOff: {
    holidaysTaken: number;
    holidaysRemaining: number;
    sickDays: number;
    lastHoliday: Date;
    nextPlannedLeave?: Date;
  };
  
  // Burnout prediction
  burnoutPrediction: {
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timeToRed: number; // days
    contributingFactors: string[];
    recommendations: string[];
  };
  
  // Support and interventions
  support: {
    activeInterventions: Intervention[];
    completedInterventions: Intervention[];
    managerNotified: boolean;
    eapReferral: boolean;
    lastCheckIn: Date;
  };
}

export interface TeamWellnessData {
  id: string;
  practiceId: string;
  lastUpdated: Date;
  
  // Team overview
  teamMetrics: {
    overallHealth: number; // 0-100
    averageWorkload: number; // percentage
    averageEnergy: number; // 1-10
    burnoutRisk: 'low' | 'medium' | 'high';
    trending: 'improving' | 'stable' | 'declining';
    
    breakdown: {
      healthy: number; // count
      monitoring: number; // count
      atRisk: number; // count
      critical: number; // count
    };
  };
  
  // Individual staff data
  staff: StaffWellbeing[];
  
  // Pulse survey data
  pulseData: {
    lastCompleted: Date;
    nextDue: Date;
    participationRate: number;
    frequency: 'weekly' | 'fortnightly' | 'monthly';
    recentResponses: PulseResponse[];
  };
  
  // Alerts and interventions
  alerts: {
    critical: WellbeingAlert[];
    warning: WellbeingAlert[];
    positive: WellbeingAlert[];
  };
  
  // Settings
  settings: {
    busySeasonMode: boolean;
    anonymousSurveys: boolean;
    alertThresholds: {
      workloadWarning: number;
      workloadCritical: number;
      energyWarning: number;
      consecutiveDaysWarning: number;
    };
  };
}

// Legacy types for backward compatibility
export interface TeamWellnessSummary {
  teamId: string;
  department: string;
  totalStaff: number;
  averageScores: {
    overall: number;
    energy: number;
    workload: number;
    engagement: number;
    resilience: number;
  };
  statusBreakdown: {
    green: number;
    amber: number;
    red: number;
  };
  criticalAlerts: number;
  recentPulseResponses: number;
  lastUpdated: Date;
}

export interface WorkloadMetrics {
  staffId: string;
  period: {
    start: Date;
    end: Date;
  };
  hours: {
    contracted: number;
    actual: number;
    billable: number;
    overtime: number;
  };
  workloadIndex: number;
  patterns: {
    averageStartTime: string;
    averageEndTime: string;
    lateNights: number;
    weekendWork: number;
    consecutiveDays: number;
  };
  capacity: {
    available: number;
    utilized: number;
    utilizationRate: number;
  };
}

export interface PulseSurvey {
  id: string;
  staffId: string;
  date: Date;
  anonymous: boolean;
  responses: {
    energy: number;
    workload: string;
    focus: number;
    comments?: string;
  };
  followUpRequested: boolean;
}

// API Response Types
export interface PulseSubmission {
  energy: number;
  workload: 'too_light' | 'just_right' | 'heavy' | 'overwhelming';
  focus: number;
  anonymous: boolean;
  comments?: string;
  timestamp: Date;
  deviceId?: string;
  sentiment?: number;
}

export interface BurnoutPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToRed: number;
  contributingFactors: string[];
  recommendations: string[];
  confidence: number;
}

export interface RiskFactors {
  workloadRisk: number;
  energyRisk: number;
  patternRisk: number;
  recoveryRisk: number;
  historicalRisk: number;
}

export interface WorkAssignment {
  workItem: {
    id: string;
    title: string;
    estimatedHours: number;
    currentAssignee: string;
  };
  fromStaff: string;
  toStaff: string;
  reason: string;
}

export interface OptimizationResult {
  redistribution: WorkAssignment[];
  impact: {
    workloadReduction: number;
    wellbeingImprovement: number;
    efficiencyGain: number;
  };
  warnings: string[];
}

export interface EffectivenessMetrics {
  preInterventionScore: number;
  preInterventionEnergy: number;
  preInterventionBurnout: number;
  staffFeedback: string;
}

export interface TrendAnalysis {
  patterns: {
    seasonal: any;
    weekly: any;
    monthly: any;
  };
  insights: {
    type: string;
    message: string;
    recommendation: string;
  }[];
  predictions: {
    nextBusySeason: any;
    atRiskStaff: string[];
    interventionSuccess: number;
  };
  benchmarks: {
    industry: any;
    internal: any;
  };
}

export interface BusySeasonSettings {
  workloadWarning?: number;
  workloadCritical?: number;
  consecutiveDays?: number;
  enhancedMonitoring?: boolean;
}

export interface AnonymousFeedback {
  energy: number;
  workload: string;
  focus: number;
  department: string;
  comments?: string;
  timestamp: Date;
}

export interface EAPReferral {
  id: string;
  employeeId: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  accessCode: string;
  hotlineNumber: string;
  bookingLink: string;
}

export interface EAPAnalytics {
  utilizationRate: number;
  commonIssues: any;
  satisfactionScore: number;
  outcomes: any;
  roi: number;
}

export interface ReferralReason {
  code: string;
  description: string;
} 