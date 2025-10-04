export interface HandoverComplaint {
  id: string;
  clientName: string;
  previousAccountant: string;
  regulatoryBody: 'ICAEW' | 'ACCA' | 'AAT';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'submitted' | 'investigating' | 'resolved' | 'escalated';
  issues: HandoverIssue[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  regulatoryTemplate?: RegulatoryTemplate;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface HandoverIssue {
  id: string;
  category: 'documentation' | 'communication' | 'compliance' | 'technical' | 'ethical';
  description: string;
  impact: string;
  regulatoryBreaches?: string[];
  status: 'open' | 'investigating' | 'resolved';
  assignedTo?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface Evidence {
  id: string;
  type: 'document' | 'email' | 'screenshot' | 'recording' | 'other';
  title: string;
  description: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  relatedIssues: string[]; // HandoverIssue IDs
}

export interface TimelineEvent {
  id: string;
  type: 'issue_created' | 'evidence_added' | 'status_changed' | 'note_added' | 'escalated';
  description: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RegulatoryTemplate {
  id: string;
  body: 'ICAEW' | 'ACCA' | 'AAT';
  version: string;
  sections: RegulatorySection[];
  lastUpdated: string;
}

export interface RegulatorySection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  fields: FormField[];
  guidance?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    customMessage?: string;
  };
  value?: string | string[];
}

// Learning Progress Types
export interface LearningProgress {
  userId: string;
  modules: LearningModule[];
  totalPoints: number;
  rank: string;
  lastActivity: string;
}

export interface LearningModule {
  id: string;
  title: string;
  category: 'advisory' | 'compliance' | 'technology' | 'soft_skills';
  progress: number;
  completed: boolean;
  dueDate?: string;
  activities: LearningActivity[];
}

export interface LearningActivity {
  id: string;
  type: 'video' | 'quiz' | 'exercise' | 'reading';
  title: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  lastAccessed?: string;
}

// Overhead Management Types
export interface OverheadSubscription {
  id: string;
  category: 'software' | 'services' | 'facilities' | 'staff';
  name: string;
  provider: string;
  cost: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  nextBilling: string;
  users: number;
  costPerUser: number;
  alternatives?: Alternative[];
  savings?: SavingsOpportunity[];
}

export interface Alternative {
  id: string;
  name: string;
  provider: string;
  cost: number;
  features: string[];
  pros: string[];
  cons: string[];
  migrationComplexity: 'low' | 'medium' | 'high';
  potentialSavings: number;
}

export interface SavingsOpportunity {
  id: string;
  type: 'consolidation' | 'negotiation' | 'optimization' | 'elimination';
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  risks: string[];
  nextSteps: string[];
}

// AI Coach Types
export interface CoachConversation {
  id: string;
  userId: string;
  messages: CoachMessage[];
  context: {
    topic: string;
    practiceSize: string;
    experience: string;
    goals: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  attachments?: {
    type: string;
    url: string;
  }[];
  metadata?: {
    sentiment?: string;
    topics?: string[];
    actionItems?: string[];
  };
}

export type BadgeStatus = 'active' | 'inactive' | 'pending' | 'danger' | 'warning' | 'good';

export interface Practice {
  id: string;
  name: string;
  email: string;
  contactName: string;
  teamSize: number;
  subscription: 'free' | 'professional' | 'excellence' | 'enterprise';
  subscription_tier?: 'free' | 'professional' | 'excellence' | 'enterprise';
  subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeMember {
  id: string;
  practice_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthScore {
  overall: number;
  compliance: number;
  team: number;
  advisory: number;
  financial: number;
  technology: number;
  lastAssessed: string;
}

export interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Rescue {
  id: string;
  clientName: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  assignedTo: string;
  dueDate: string;
  actionPlan: ActionItem[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  requiredHours: number;
  completedHours: number;
  deadline: string;
  status: BadgeStatus;
}

export interface RevenueMix {
  compliance: number;
  advisory: number;
}

export interface MonthlyTrend {
  month: string;
  compliance: number;
  advisory: number;
  revenue: number;
}

export interface AdvisoryProgress {
  currentMix: RevenueMix;
  targetMix: RevenueMix;
  monthlyTrend: MonthlyTrend[];
}

// Alternate Auditor Types
export interface AlternateAuditor {
  id: string;
  practiceId: string;
  alternateName: string;
  alternateFirm: string;
  alternateEmail: string;
  alternatePhone: string;
  rpbNumber: string;
  rpbType: 'ICAEW' | 'ICAS' | 'CAI' | 'ACCA';
  engagementLetter: {
    url: string;
    uploadedAt: string;
    fileName: string;
    fileSize: number;
    verified: boolean;
  };
  piCertificate: {
    url: string;
    uploadedAt: string;
    expiryDate: string;
    fileName: string;
    fileSize: number;
    verified: boolean;
  };
  complianceDeadline: string; // December 1, 2025
  lastVerified: string;
  status: 'compliant' | 'action_required' | 'urgent' | 'not_configured';
  specializations: string[];
  reciprocalArrangement: boolean;
  annualFee?: number;
  auditTrail: AuditLogEntry[];
  notifications: AlternateAuditorNotification[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'created' | 'updated' | 'document_uploaded' | 'document_deleted' | 'status_changed' | 'verified';
  description: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  name: string;
  type: 'engagement_letter' | 'pi_certificate' | 'rpb_registration' | 'other';
  url: string;
  uploadedAt: string;
  fileSize: number;
  verified: boolean;
}

export interface AlternateAuditorNotification {
  id: string;
  type: 'reminder' | 'warning' | 'escalation' | 'compliance' | 'pi_expiry' | 'deadline';
  message: string;
  dueDate: string;
  sent: boolean;
  sentAt?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channel: 'in_app' | 'email' | 'sms';
}

export interface ComplianceTimeline {
  deadline: string;
  daysRemaining: number;
  status: 'compliant' | 'action_required' | 'urgent' | 'not_configured';
  nextAction: string;
  lastAction: string;
  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  critical: boolean;
}

// ESG Lite Widget Types
export interface ESGScope {
  clientId: string;
  companySize: {
    employees: number;
    turnover: number;
  };
  mandatory: boolean;
  voluntaryBenefits: string[];
  materialTopics: string[];
  reportingFramework: 'UK_SDS' | 'ISSB' | 'SIMPLIFIED';
  estimatedCost: number;
  recommendedActions: string[];
}

export interface ESGData {
  // Environmental
  emissions: {
    scope1: {
      naturalGas: number; // kWh
      companyVehicles: number; // miles
      refrigerants: number; // kg
    };
    scope2: {
      electricity: number; // kWh
      source: 'grid' | 'renewable' | 'mixed';
    };
    scope3: {
      businessTravel: number; // miles
      commuting: number; // estimated
      waste: number; // tonnes
      water: number; // m³
    };
  };
  
  // Social
  social: {
    totalEmployees: number;
    femaleEmployees: number;
    femaleManagers: number;
    genderPayGap: number; // percentage
    trainingHours: number;
    turnoverRate: number;
    accidents: number;
  };
  
  // Governance
  governance: {
    boardMembers: number;
    independentDirectors: number;
    sustainabilityPolicy: boolean;
    codeOfConduct: boolean;
    whistleblowingPolicy: boolean;
    dataBreaches: number;
  };
}

export interface ESGReport {
  id: string;
  clientName: string;
  period: string;
  status: 'draft' | 'final' | 'verified';
  scores: {
    environmental: number; // 0-100
    social: number; // 0-100
    governance: number; // 0-100
    overall: number; // weighted average
  };
  carbonFootprint: {
    total: number; // tCO2e
    intensity: number; // per employee
    change: number; // YoY %
  };
  narrative: {
    executiveSummary: string;
    materialityAssessment: string;
    performanceAnalysis: string;
    targetsAndActions: string;
  };
}

export interface CarbonResults {
  scope1: number;
  scope2: number;
  total: number;
  intensity: number;
}

export interface Benchmark {
  industry: string;
  companySize: string;
  averages: {
    carbonIntensity: number;
    genderPayGap: number;
    boardDiversity: number;
  };
}

export interface ESGClient {
  id: string;
  name: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  scope: ESGScope;
  data: ESGData;
  report: ESGReport | null;
  status: 'not_started' | 'scoping' | 'data_collection' | 'reporting' | 'completed';
  deadline: string;
  revenue: number;
}

export interface ESGSummary {
  inScopeClients: number;
  activeReports: number;
  revenueOpportunity: number;
  upcomingDeadlines: Array<{
    clientName: string;
    daysRemaining: number;
  }>;
  averageScore: number;
  carbonReduction: number;
}

// Continuity Scorecard Types
export interface PracticeValuation {
  id: string;
  practiceId: string;
  valuationDate: Date;
  methodology: 'GRF' | 'EBITDA' | 'HYBRID';
  
  // Gross Recurring Fees method
  grf: {
    annualRecurringRevenue: number;
    multiple: number; // typically 0.8-1.5x
    adjustments: {
      clientConcentration: number; // -ve if too concentrated
      growthRate: number; // +ve if growing
      profitability: number; // +ve if above average
    };
  };
  
  // EBITDA method
  ebitda: {
    earnings: number;
    multiple: number; // typically 3-6x
    addBacks: {
      ownerCompensation: number;
      personalExpenses: number;
      oneOffCosts: number;
    };
  };
  
  // Per client method
  perClient: {
    clientCount: number;
    avgValuePerClient: number; // typically £800-2000
    qualityAdjustment: number; // based on client types
  };
  
  calculatedValue: number;
  previousValue: number;
  growthRate: number;
}

export interface Executor {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  accessDelay: number; // hours before access
}

export interface Credential {
  id: string;
  service: string;
  username: string;
  encryptedPassword: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  lastUpdated: Date;
  notes?: string;
}

export interface CriticalContact {
  role: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
}

export interface ContinuityDocument {
  type: string;
  name: string;
  url: string;
  uploadedDate: Date;
  expiryDate?: Date;
}

export interface ExecutorPack {
  id: string;
  practiceId: string;
  
  executors: {
    primary: Executor;
    secondary?: Executor;
  };
  
  credentials: Credential[];
  criticalContacts: CriticalContact[];
  documents: ContinuityDocument[];
}

export interface ReadinessCategory {
  score: number;
  gaps: string[];
  items: Record<string, boolean | number>;
}

export interface ReadinessAssessment {
  score: number; // 0-100
  lastAssessed: Date;
  
  categories: {
    documentation: ReadinessCategory & {
      items: {
        operationsManual: boolean;
        clientProcedures: boolean;
        successionAgreement: boolean;
        shareholderAgreement: boolean;
      };
    };
    financial: ReadinessCategory & {
      items: {
        cleanAccounts: boolean;
        recurringRevenue: number; // percentage
        profitability: boolean;
        debtorsControl: boolean;
      };
    };
    operational: ReadinessCategory & {
      items: {
        keyPersonDependency: boolean;
        systemsDocumented: boolean;
        clientRelationships: boolean;
        staffRetention: boolean;
      };
    };
    legal: ReadinessCategory & {
      items: {
        clientContracts: boolean;
        employmentContracts: boolean;
        intellectualProperty: boolean;
        regulatoryCompliance: boolean;
      };
    };
  };
}

export interface ContinuityGap {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  item: string;
  impact: string;
  solution: string;
}

export interface ValueProjection {
  year: number;
  value: number;
  assumptions: string;
}

export interface ContinuitySummary {
  currentValue: number;
  growthRate: number;
  readinessScore: number;
  criticalGaps: string[];
  lastUpdated: Date;
  nextAssessment: Date;
  executorCount: number;
  credentialCount: number;
}

// Cyber Shield Security Types
export interface CyberSecurityData {
  id: string;
  practiceId: string;
  lastAssessed: Date;
  
  // Security scoring
  securityScore: {
    overall: number; // 0-100
    lastUpdated: Date;
    trend: 'improving' | 'stable' | 'declining';
    
    categories: {
      technical: {
        score: number;
        factors: {
          patchingStatus: number;
          endpointProtection: number;
          firewallConfig: number;
          emailSecurity: number;
          backupIntegrity: number;
          encryptionStatus: number;
        };
      };
      
      human: {
        score: number;
        factors: {
          mfaAdoption: number; // percentage
          trainingCompletion: number;
          phishingTestResults: number;
          passwordStrength: number;
          securityAwareness: number;
        };
      };
      
      process: {
        score: number;
        factors: {
          incidentResponsePlan: boolean;
          dataClassification: boolean;
          accessControls: number;
          auditFrequency: number;
          vendorManagement: number;
        };
      };
      
      physical: {
        score: number;
        factors: {
          deviceSecurity: number;
          officeAccess: boolean;
          cleanDeskPolicy: boolean;
          visitorManagement: boolean;
        };
      };
    };
  };
  
  // System health
  systemHealth: {
    // Microsoft 365 / Google Workspace
    cloudSecurity: {
      provider: 'microsoft' | 'google' | 'both';
      securityScore: number;
      complianceScore: number;
      alerts: Alert[];
    };
    
    // Endpoint protection
    endpoints: {
      totalDevices: number;
      protectedDevices: number;
      lastScanDate: Date;
      threatsFound: number;
      quarantinedItems: number;
    };
    
    // Patching status
    patching: {
      devicesUpToDate: number;
      devicesPending: number;
      criticalPatches: number;
      lastPatchDate: Date;
      nextPatchWindow: Date;
    };
    
    // Backups
    backups: {
      lastSuccessful: Date;
      nextScheduled: Date;
      verificationStatus: 'verified' | 'pending' | 'failed';
      retentionDays: number;
      offsiteBackup: boolean;
      encryptionEnabled: boolean;
    };
  };
  
  // Vulnerabilities
  vulnerabilities: {
    critical: Vulnerability[];
    high: Vulnerability[];
    medium: Vulnerability[];
    low: Vulnerability[];
    
    lastScanDate: Date;
    nextScanDate: Date;
    autoRemediationEnabled: boolean;
  };
  
  // Incidents
  incidents: {
    active: SecurityIncident[];
    resolved: SecurityIncident[];
    mttr: number; // mean time to resolve in hours
    
    statistics: {
      last30Days: number;
      last90Days: number;
      yearToDate: number;
      trendsAnalysis: TrendData[];
    };
  };
  
  // Insurance
  insurance: {
    provider: string;
    policyNumber: string;
    coverageLimit: number;
    excessAmount: number;
    premium: number;
    renewalDate: Date;
    
    coverage: {
      dataBreachResponse: boolean;
      businessInterruption: boolean;
      cyberExtortion: boolean;
      networkSecurity: boolean;
      privacyLiability: boolean;
    };
    
    requirements: {
      mfaRequired: boolean;
      backupRequired: boolean;
      trainingRequired: boolean;
      met: boolean;
    };
  };
  
  // Partner integration
  partner: {
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    slaResponse: number; // minutes
    
    services: {
      monitoring: boolean;
      patching: boolean;
      backups: boolean;
      incidentResponse: boolean;
      securityTraining: boolean;
    };
    
    performance: {
      ticketsOpen: number;
      avgResponseTime: number;
      slaCompliance: number; // percentage
      satisfaction: number; // 1-5
    };
  };
}

export interface SecurityIncident {
  id: string;
  type: 'ransomware' | 'phishing' | 'data_breach' | 'malware' | 'unauthorized_access' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'detected' | 'investigating' | 'containing' | 'eradicating' | 'recovering' | 'resolved';
  
  timeline: {
    detected: Date;
    acknowledged?: Date;
    contained?: Date;
    eradicated?: Date;
    recovered?: Date;
    resolved?: Date;
  };
  
  impact: {
    affectedSystems: string[];
    affectedData: string[];
    affectedUsers: number;
    businessImpact: 'none' | 'minimal' | 'moderate' | 'severe' | 'critical';
    dataExfiltrated: boolean;
    downtime: number; // minutes
  };
  
  response: {
    assignedTo: string;
    escalated: boolean;
    externalSupport: boolean;
    actionsToken: Action[];
    lessonsLearned?: string;
  };
}

export interface IncidentPlaybook {
  id: string;
  type: string;
  version: string;
  lastUpdated: Date;
  approvedBy: string;
  
  steps: {
    order: number;
    phase: 'detect' | 'contain' | 'eradicate' | 'recover' | 'lessons';
    action: string;
    responsible: 'internal' | 'partner' | 'both';
    timeframe: string; // e.g., "immediate", "within 1 hour"
    criticalContacts: Contact[];
    tools: string[];
    notes?: string;
  }[];
  
  templates: {
    clientNotification: string;
    staffNotification: string;
    icoNotification: string;
    insuranceClaim: string;
    incidentReport: string;
  };
}

export interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  affectedSystems: string[];
  discovered: Date;
  status: 'open' | 'in_progress' | 'patched' | 'accepted';
  remediation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface Alert {
  id: string;
  type: 'security' | 'compliance' | 'system' | 'backup';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface Action {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  available: boolean;
}

export interface TrendData {
  date: Date;
  value: number;
  label: string;
}

// Legacy types for backward compatibility
export interface SecurityScore {
  overall: number; // 0-100
  lastUpdated: Date;
  
  categories: {
    technical: {
      score: number;
      factors: {
        patchingStatus: number;
        endpointProtection: number;
        firewallConfig: number;
        emailSecurity: number;
      };
    };
    human: {
      score: number;
      factors: {
        mfaAdoption: number;
        trainingCompletion: number;
        phishingResistance: number;
        passwordStrength: number;
      };
    };
    process: {
      score: number;
      factors: {
        backupVerification: number;
        incidentResponse: number;
        accessControl: number;
        dataClassification: number;
      };
    };
  };
  
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface SecurityAlerts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface IncidentResponse {
  id: string;
  type: 'ransomware' | 'data_breach' | 'phishing' | 'system_compromise';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'detected' | 'contained' | 'investigating' | 'resolved';
  
  timeline: {
    detected: Date;
    acknowledged?: Date;
    contained?: Date;
    resolved?: Date;
  };
  
  affectedSystems: string[];
  affectedData: string[];
  
  response: {
    currentStep: number;
    totalSteps: number;
    actions: {
      step: number;
      action: string;
      status: 'pending' | 'in_progress' | 'completed';
      assignee: string;
      deadline: Date;
    }[];
  };
}

export interface PartnerIntegration {
  partnerId: string;
  partnerName: string;
  
  services: {
    monitoring: boolean;
    backups: boolean;
    patching: boolean;
    support: boolean;
  };
  
  status: {
    connection: 'active' | 'error' | 'disconnected';
    lastSync: Date;
    nextSync: Date;
  };
  
  metrics: {
    ticketCount: number;
    avgResponseTime: number; // minutes
    slaCompliance: number; // percentage
    systemUptime: number; // percentage
  };
}

export interface SecurityData {
  riskScore: number;
  lastUpdated: Date;
  partnerStatus: 'active' | 'error' | 'disconnected';
  partnerName: string;
  mfaAdoption: number;
  lastBackup: Date;
  patchStatus: 'good' | 'warning' | 'error' | 'unknown';
  firewallStatus: 'good' | 'warning' | 'error' | 'unknown';
  antivirusStatus: 'good' | 'warning' | 'error' | 'unknown';
  alerts: SecurityAlerts;
}

export interface PlaybookStep {
  step: number;
  title: string;
  description: string;
  actions: string[];
  contacts: string[];
  estimatedTime: number; // minutes
  critical: boolean;
}

export interface SecurityPlaybook {
  id: string;
  name: string;
  type: 'ransomware' | 'data_breach' | 'phishing' | 'system_compromise';
  steps: PlaybookStep[];
  totalSteps: number;
  estimatedDuration: number; // minutes
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  available: boolean;
  priority: 'primary' | 'secondary' | 'tertiary';
}

export interface SecuritySummary {
  riskScore: number;
  alertCount: number;
  criticalAlerts: number;
  partnerStatus: string;
  lastIncident?: Date;
  nextBackup: Date;
  mfaCoverage: number;
  patchStatus: string;
}

// MTD Capacity Types
export interface CapacityData {
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

export interface ClientReadiness {
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
  status: 'ready' | 'in_progress' | 'needs_attention' | 'not_started';
}

export interface FeeCalculation {
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
  implementationCost: number;
  roi: number;
}

export interface MTDCockpitData {
  totalClients: number;
  readyPercentage: number;
  revenueOpportunity: number;
  weeklyCapacity: CapacityData[];
  clientReadiness: ClientReadiness[];
  feeCalculations: FeeCalculation[];
  alerts: string[];
  implementationTimeline: {
    phase: string;
    startDate: Date;
    endDate: Date;
    status: 'completed' | 'in_progress' | 'pending';
    clients: string[];
  }[];
  staffCapacity: {
    staffId: string;
    staffName: string;
    role: string;
    currentUtilization: number;
    mtdTraining: boolean;
    availableHours: number;
  }[];
}

export interface EncryptedCredential {
  id: string;
  service: string;
  username: string;
  encryptedPassword: string; // AES-256 encrypted
  category: 'critical' | 'important' | 'standard';
  lastRotated: Date;
  expiryDate?: Date;
  notes?: string;
  twoFactorEnabled: boolean;
  recoveryInfo?: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  type: 'contract' | 'insurance' | 'legal' | 'financial' | 'operational';
  url: string;
  uploadedAt: Date;
  expiryDate?: Date;
  version: number;
  tags: string[];
}

export interface ContinuityPlan {
  id: string;
  practiceId: string;
  lastUpdated: Date;
  valuation: {
    currentValue: number;
    previousValue: number;
    valuationDate: Date;
    methodology: 'GRF' | 'EBITDA' | 'PERCLIENT' | 'HYBRID';
    grf: {
      annualRecurringRevenue: number;
      oneTimeRevenue: number;
      recurringPercentage: number;
      multiple: number;
      adjustments: {
        clientConcentration: number;
        growthRate: number;
        profitMargin: number;
        clientRetention: number;
      };
    };
    ebitda: {
      earnings: number;
      adjustedEarnings: number;
      multiple: number;
      addBacks: {
        ownerCompensation: number;
        personalExpenses: number;
        oneOffCosts: number;
        depreciation: number;
        amortization: number;
      };
    };
    perClient: {
      totalClients: number;
      clientCategories: {
        category: string;
        count: number;
        avgValue: number;
      }[];
      qualityScore: number;
      avgValuePerClient: number;
    };
    growth: {
      revenueGrowth: number;
      clientGrowth: number;
      profitGrowth: number;
      projectedValue1Year: number;
      projectedValue3Year: number;
      projectedValue5Year: number;
    };
  };
  executorVault: {
    primaryExecutor: {
      name: string;
      email: string;
      phone: string;
      relationship: string;
      accessDelay: number;
      lastNotified: Date;
    };
    secondaryExecutor?: {
      name: string;
      email: string;
      phone: string;
      relationship: string;
      accessDelay: number;
      lastNotified: Date;
    };
    credentials: EncryptedCredential[];
    documents: VaultDocument[];
    criticalContacts: {
      name: string;
      email: string;
      phone: string;
      role: string;
    }[];
    bankAccounts: {
      bank: string;
      accountNumber: string;
      sortCode: string;
      accountType: string;
    }[];
    softwareLicenses: {
      name: string;
      licenseKey: string;
      expiryDate?: Date;
    }[];
    lastVerified: Date;
    nextReviewDate: Date;
  };
  readiness: {
    overallScore: number;
    lastAssessed: Date;
    categories: {
      documentation: {
        score: number;
        items: {
          operationsManual: boolean;
          clientProcedures: boolean;
          successionAgreement: boolean;
          buyoutAgreement: boolean;
          keyPersonInsurance: boolean;
        };
        gaps: string[];
      };
      financial: {
        score: number;
        items: {
          cleanAccounts: boolean;
          recurringRevenue: number;
          profitability: boolean;
          debtPosition: boolean;
          cashReserves: boolean;
        };
        gaps: string[];
      };
      operational: {
        score: number;
        items: {
          keyPersonDependency: boolean;
          documentedProcesses: boolean;
          clientContracts: boolean;
          staffContracts: boolean;
          systemsDocumented: boolean;
        };
        gaps: string[];
      };
      relationships: {
        score: number;
        items: {
          clientIntroductions: boolean;
          supplierContracts: boolean;
          professionalNetwork: boolean;
          staffRetention: boolean;
        };
        gaps: string[];
      };
    };
    criticalGaps: {
      category: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      item: string;
      impact: string;
      effort: string;
      timeToFix: string;
      solution: string;
    }[];
    recommendations: string[];
  };
}

// Client Management Types for Accounting Firms
export interface AccountingClient {
  id: string;
  practiceId: string;
  name: string;
  email: string;
  contactName: string;
  phone: string;
  companyNumber?: string;
  vatNumber?: string;
  industry: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  status: 'active' | 'inactive' | 'prospect' | 'former';
  services: ClientService[];
  portalAccess: ClientPortalAccess;
  documents: ClientDocument[];
  activities: ClientActivity[];
  financials: ClientFinancials;
  compliance: ClientCompliance;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface ClientService {
  id: string;
  name: string;
  type: 'compliance' | 'advisory' | 'tax' | 'audit' | 'bookkeeping' | 'payroll' | 'other';
  status: 'active' | 'inactive' | 'pending';
  startDate: string;
  endDate?: string;
  fee: number;
  billingCycle: 'monthly' | 'quarterly' | 'annually' | 'one_off';
  description?: string;
}

export interface ClientPortalAccess {
  enabled: boolean;
  clientId: string;
  email: string;
  lastLogin?: string;
  loginCount: number;
  permissions: ClientPermission[];
  twoFactorEnabled: boolean;
  status: 'active' | 'suspended' | 'pending_activation';
  documentsCount: number;
  lastDocumentUpload?: string;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
}

export interface ClientPermission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  grantedAt?: string;
  grantedBy?: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'financial' | 'tax' | 'compliance' | 'contract' | 'other';
  category: string;
  uploadedBy: 'client' | 'accountant';
  uploadedAt: string;
  fileSize: number;
  version: number;
  status: 'active' | 'archived' | 'pending_review';
  tags: string[];
  sharedWithClient: boolean;
  clientPortalUrl?: string;
}

export interface ClientActivity {
  id: string;
  type: 'document_upload' | 'document_download' | 'login' | 'message' | 'meeting' | 'payment' | 'compliance_update';
  description: string;
  timestamp: string;
  user: string;
  metadata?: Record<string, any>;
}

export interface ClientFinancials {
  annualTurnover: number;
  annualProfit: number;
  employeeCount: number;
  vatRegistered: boolean;
  corporationTax: {
    yearEnd: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  };
  vat: {
    period: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  };
  payroll: {
    employees: number;
    monthlyCost: number;
    lastSubmission: string;
  };
}

export interface ClientCompliance {
  mtdStatus: 'ready' | 'in_progress' | 'not_started' | 'exempt';
  esgStatus: 'in_scope' | 'out_of_scope' | 'voluntary' | 'not_assessed';
  cyberSecurityStatus: 'assessed' | 'not_assessed' | 'in_progress';
  lastComplianceReview: string;
  nextReviewDate: string;
  outstandingActions: ComplianceAction[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceAction {
  id: string;
  category: 'mtd' | 'esg' | 'cyber' | 'tax' | 'general';
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
}

export interface ClientManagementSummary {
  totalClients: number;
  activeClients: number;
  clientsWithPortals: number;
  portalAdoptionRate: number;
  recentActivity: ClientActivity[];
  upcomingDeadlines: ComplianceAction[];
  revenueByClient: Array<{
    clientId: string;
    clientName: string;
    annualRevenue: number;
  }>;
  complianceAlerts: number;
  storageUsage: {
    totalUsed: number;
    totalLimit: number;
    averagePerClient: number;
  };
}

export interface ClientPortalStats {
  clientId: string;
  clientName: string;
  portalEnabled: boolean;
  lastLogin?: string;
  loginCount: number;
  documentsCount: number;
  storageUsed: number;
  storageLimit: number;
  recentActivity: ClientActivity[];
  complianceStatus: ClientCompliance;
}

// Subscription Management Types
export interface SubscriptionTier {
  id: string;
  name: 'free' | 'professional' | 'enterprise';
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  limitations?: string[];
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tierId: string;
  tier?: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

// Partner Integration Types
export interface Partner {
  id: string;
  companyName: string;
  partnerType: 'cyber_security' | 'marketing' | 'wellness' | 'other';
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    poweredByText?: string;
  };
  isActive: boolean;
}

export interface PartnerService {
  id: string;
  partnerId: string;
  serviceName: string;
  serviceType: string;
  price: number;
  commissionRate: number;
  isActive: boolean;
}

export interface UserPartnerSubscription {
  id: string;
  userId: string;
  partnerId: string;
  serviceId: string;
  status: 'active' | 'cancelled' | 'pending';
  startedAt: Date;
  cancelledAt?: Date;
  metadata?: Record<string, any>;
}

// Assessment Types
export interface CyberAssessment {
  id: string;
  userId: string;
  partnerId: string;
  questions: AssessmentQuestion[];
  answers?: Record<string, AssessmentAnswer>;
  score?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: Recommendation[];
  consultationBooked: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  category: 'technical' | 'human' | 'process';
  weight: number;
  options: {
    value: string;
    score: number;
    description: string;
  }[];
}

export interface AssessmentAnswer {
  questionId: string;
  selectedOption: string;
  score: number;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
}

// KPI Management Types
export interface KPIDefinition {
  id: string;
  category: 'financial' | 'operational' | 'client' | 'team' | 'compliance' | 'technology' | 'strategic';
  name: string;
  formula?: string;
  dataSources?: Record<string, any>;
  tierRequired: 'free' | 'professional' | 'enterprise';
  isActive: boolean;
}

export interface KPIValue {
  id: string;
  userId: string;
  kpiId: string;
  value: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export interface KPIData {
  definition: KPIDefinition;
  currentValue?: KPIValue;
  trend: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
}

export interface KPIBenchmark {
  average: number;
  median: number;
  percentile25: number;
  percentile75: number;
}

// Feature Usage Tracking
export interface FeatureUsage {
  id: string;
  userId: string;
  featureName: string;
  usageCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

// Revenue Sharing
export interface RevenueSharing {
  id: string;
  partnerId: string;
  userId: string;
  amount: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'failed';
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  stripeTransferId?: string;
  createdAt: Date;
} 