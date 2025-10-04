import { Practice, HealthScore, Rescue, TeamMember, AdvisoryProgress, HandoverComplaint } from '../../types/accountancy';
import { AccountancyStorage } from './storage';

export class MockAccountancyAPI {
  static async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async initializePractice(): Promise<Practice> {
    await this.delay();
    
    const mockPractice: Practice = {
      id: 'practice-' + Date.now(),
      name: 'IVC ACCOUNTING',
      email: 'info@ivcaccounting.co.uk',
      contactName: 'James Howard',
      teamSize: 8,
      subscription: 'professional',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    AccountancyStorage.savePractice(mockPractice);
    return mockPractice;
  }

  static async getHealthScore(): Promise<HealthScore> {
    await this.delay(500);
    
    const healthScore: HealthScore = {
      overall: 78,
      compliance: 95,
      team: 78,
      advisory: 65,
      financial: 82,
      technology: 72,
      lastAssessed: new Date().toISOString()
    };
    
    AccountancyStorage.saveHealthScore(healthScore);
    return healthScore;
  }

  static async getRescues(): Promise<Rescue[]> {
    await this.delay(400);
    
    const rescues: Rescue[] = [
      {
        id: 'rescue-1',
        clientName: 'ABC Manufacturing Ltd',
        issueType: 'VAT reconciliation',
        severity: 'medium',
        status: 'in_progress',
        progress: 75,
        assignedTo: 'Sarah Johnson',
        dueDate: '2025-01-15',
        actionPlan: [
          { id: '1', description: 'Review VAT returns Q3-Q4', completed: true },
          { id: '2', description: 'Reconcile purchase ledger', completed: true },
          { id: '3', description: 'Submit corrected VAT return', completed: false, dueDate: '2025-01-15' }
        ],
        notes: [
          { id: '1', content: 'Client provided missing invoices', author: 'Sarah Johnson', createdAt: '2025-01-08T10:30:00Z' }
        ],
        createdAt: '2025-01-05T09:00:00Z',
        updatedAt: '2025-01-08T14:20:00Z'
      },
      {
        id: 'rescue-2',
        clientName: 'Digital Solutions Co',
        issueType: 'Year-end accounts',
        severity: 'critical',
        status: 'in_progress',
        progress: 30,
        assignedTo: 'Mike Chen',
        dueDate: '2025-01-10',
        actionPlan: [
          { id: '1', description: 'Gather trial balance', completed: true },
          { id: '2', description: 'Review accruals and prepayments', completed: false },
          { id: '3', description: 'Prepare statutory accounts', completed: false }
        ],
        notes: [],
        createdAt: '2025-01-03T14:00:00Z',
        updatedAt: '2025-01-07T16:45:00Z'
      },
      {
        id: 'rescue-3',
        clientName: 'Green Energy Ltd',
        issueType: 'Payroll queries',
        severity: 'low',
        status: 'in_progress',
        progress: 90,
        assignedTo: 'Emma Wilson',
        dueDate: '2025-01-20',
        actionPlan: [
          { id: '1', description: 'Review PAYE calculations', completed: true },
          { id: '2', description: 'Update employee records', completed: true },
          { id: '3', description: 'Process payroll corrections', completed: false }
        ],
        notes: [],
        createdAt: '2025-01-01T11:00:00Z',
        updatedAt: '2025-01-08T09:15:00Z'
      }
    ];
    
    AccountancyStorage.saveRescues(rescues);
    return rescues;
  }

  static async getTeam(): Promise<TeamMember[]> {
    await this.delay(300);
    
    const team: TeamMember[] = [
      {
        id: 'member-1',
        name: 'Sarah Johnson',
        role: 'Senior Manager',
        requiredHours: 40,
        completedHours: 35,
        deadline: '2025-12-31',
        status: 'warning'
      },
      {
        id: 'member-2',
        name: 'Mike Chen',
        role: 'Manager',
        requiredHours: 40,
        completedHours: 40,
        deadline: '2025-12-31',
        status: 'good'
      },
      {
        id: 'member-3',
        name: 'Emma Wilson',
        role: 'Senior Associate',
        requiredHours: 40,
        completedHours: 15,
        deadline: '2025-12-31',
        status: 'danger'
      }
    ];
    
    AccountancyStorage.saveTeam(team);
    return team;
  }

  static async getAdvisoryProgress(): Promise<AdvisoryProgress> {
    await this.delay(200);
    
    return {
      currentMix: { compliance: 70, advisory: 30 },
      targetMix: { compliance: 50, advisory: 50 },
      monthlyTrend: [
        { month: 'Jul', compliance: 75, advisory: 25, revenue: 42000 },
        { month: 'Aug', compliance: 73, advisory: 27, revenue: 43500 },
        { month: 'Sep', compliance: 70, advisory: 30, revenue: 45000 },
        { month: 'Oct', compliance: 68, advisory: 32, revenue: 46500 },
        { month: 'Nov', compliance: 65, advisory: 35, revenue: 48000 },
        { month: 'Dec', compliance: 62, advisory: 38, revenue: 50000 }
      ]
    };
  }

  static async updateRescueProgress(rescueId: string, progress: number): Promise<void> {
    await this.delay(200);
    
    const rescues = AccountancyStorage.getRescues();
    const updatedRescues = rescues.map(rescue => 
      rescue.id === rescueId 
        ? { ...rescue, progress, updatedAt: new Date().toISOString() }
        : rescue
    );
    
    AccountancyStorage.saveRescues(updatedRescues);
  }

  static async getComplaints(): Promise<HandoverComplaint[]> {
    await this.delay(300);
    return [
      {
        id: 'complaint-1',
        clientName: 'Acme Corp',
        previousAccountant: 'Old Firm LLP',
        regulatoryBody: 'ICAEW',
        severity: 'high',
        status: 'investigating',
        issues: [
          {
            id: 'issue-1',
            category: 'compliance',
            description: 'Missing client due diligence documents',
            impact: 'Potential regulatory breach',
            status: 'open',
            priority: 'high',
          }
        ],
        evidence: [],
        timeline: [],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-05T12:00:00Z',
      },
      {
        id: 'complaint-2',
        clientName: 'Beta Ltd',
        previousAccountant: 'Smith & Co',
        regulatoryBody: 'ACCA',
        severity: 'medium',
        status: 'submitted',
        issues: [],
        evidence: [],
        timeline: [],
        createdAt: '2025-01-03T09:00:00Z',
        updatedAt: '2025-01-04T11:00:00Z',
      }
    ];
  }
}
