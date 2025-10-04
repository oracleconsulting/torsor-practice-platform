// src/services/api/mockData.ts

import type { 
  Practice, 
  HealthScore, 
  Rescue, 
  TeamMember, 
  HandoverComplaint,
  AdvisoryProgress 
} from '../../types/accountancy';

export const mockPractice: Practice = {
  id: '1',
  practiceName: 'IVC ACCOUNTING',
  practiceSize: 'small',
  annualRevenue: 500000,
  advisoryPercentage: 30,
  teamSize: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date()
};

export const mockHealthScore: HealthScore = {
  overall: 75,
  dimensions: {
    technical: 80,
    commercial: 70,
    operational: 75,
    strategic: 65,
    people: 85,
    digital: 70
  },
  lastAssessmentDate: new Date('2024-03-01'),
  recommendations: [
    'Increase advisory service offerings',
    'Implement digital workflow automation',
    'Develop team advisory skills'
  ]
};

export const mockRescues: Rescue[] = [
  {
    id: '1',
    clientName: 'ABC Ltd',
    rescueType: 'VAT',
    severity: 'high',
    status: 'active',
    progress: 65,
    dueDate: new Date('2024-04-15'),
    tasks: [
      { id: '1', title: 'Review VAT returns', completed: true },
      { id: '2', title: 'Submit corrections', completed: true },
      { id: '3', title: 'HMRC correspondence', completed: false }
    ],
    createdAt: new Date('2024-03-01')
  },
  {
    id: '2',
    clientName: 'XYZ Corp',
    rescueType: 'Payroll',
    severity: 'critical',
    status: 'active',
    progress: 30,
    dueDate: new Date('2024-04-10'),
    tasks: [
      { id: '1', title: 'Reconcile payroll records', completed: true },
      { id: '2', title: 'Submit RTI corrections', completed: false },
      { id: '3', title: 'Employee communications', completed: false }
    ],
    createdAt: new Date('2024-03-15')
  }
];

export const mockTeam: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Partner',
    email: 'john@smithassociates.co.uk',
    cpdHours: 35,
    cpdTarget: 40,
    specializations: ['Tax Planning', 'Business Advisory']
  },
  {
    id: '2',
    name: 'Sarah Jones',
    role: 'Senior Accountant',
    email: 'sarah@smithassociates.co.uk',
    cpdHours: 28,
    cpdTarget: 40,
    specializations: ['Management Accounts', 'Payroll']
  }
];

export const mockComplaints: HandoverComplaint[] = [
  {
    id: '1',
    clientName: 'Tech Startup Ltd',
    previousAccountant: 'Old & Slow Accountants',
    regulatoryBody: 'ICAEW',
    severity: 'high',
    status: 'investigating',
    issues: [
      {
        id: '1',
        category: 'documentation',
        description: 'Missing 3 years of VAT working papers',
        impact: 'Unable to verify VAT submissions, potential HMRC investigation',
        status: 'open',
        priority: 'high'
      }
    ],
    evidence: [
      {
        id: '1',
        type: 'email',
        title: 'Handover request emails',
        description: 'Multiple unanswered requests for client records',
        fileUrl: '/evidence/emails.pdf',
        uploadedAt: new Date('2024-03-01'),
        uploadedBy: 'John Smith',
        tags: ['communication', 'non-response'],
        relatedIssues: ['1']
      }
    ],
    timeline: [
      {
        id: '1',
        timestamp: new Date('2024-03-01'),
        type: 'created',
        description: 'Complaint filed',
        actor: 'John Smith'
      }
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-15')
  }
];

export const mockAdvisoryProgress: AdvisoryProgress = {
  currentWeek: 6,
  totalWeeks: 12,
  completedMilestones: 5,
  totalMilestones: 12,
  nextMilestone: 'Launch first advisory service package',
  percentComplete: 45
};

// Mock API client for development
export const mockApiClient = {
  get: async (endpoint: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (endpoint) {
      case '/api/accountancy/practice':
        return mockPractice;
      case '/api/accountancy/health-score':
        return mockHealthScore;
      case '/api/accountancy/rescues':
        return mockRescues;
      case '/api/accountancy/team':
        return mockTeam;
      case '/api/accountancy/complaints':
        return mockComplaints;
      case '/api/accountancy/advisory-progress':
        return mockAdvisoryProgress;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  },
  
  post: async (endpoint: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock POST:', endpoint, data);
    return { success: true, id: Date.now().toString() };
  },
  
  put: async (endpoint: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock PUT:', endpoint, data);
    return { success: true };
  },
  
  delete: async (endpoint: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock DELETE:', endpoint);
    return { success: true };
  }
};