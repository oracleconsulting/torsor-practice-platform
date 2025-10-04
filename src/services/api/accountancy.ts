import type { Practice, HealthScore, Rescue, HandoverComplaint, TeamMember } from '../../types/accountancy';

// MOCK DATA
const mockPractice: Practice = {
  id: '1',
  name: 'IVC ACCOUNTING',
  email: 'info@ivcaccounting.co.uk',
  contactName: 'James Howard',
  teamSize: 8,
  subscription: 'professional',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-06-01')
};
const mockHealthScore: HealthScore = {
  overall: 78,
  compliance: 95,
  team: 78,
  advisory: 65,
  financial: 82,
  technology: 80,
  lastAssessed: new Date().toISOString()
};
const mockRescues: Rescue[] = [
  { id: 'r1', clientName: 'Acme Ltd', issueType: 'VAT', severity: 'high', status: 'in_progress', progress: 60, assignedTo: 'Jane Doe', dueDate: '2024-07-01', actionPlan: [], notes: [], createdAt: '2024-06-01', updatedAt: '2024-06-10' }
];
const mockComplaints: HandoverComplaint[] = [
  { id: 'c1', clientName: 'Beta Corp', previousAccountant: 'Old Firm', regulatoryBody: 'ICAEW', severity: 'medium', status: 'submitted', issues: [], evidence: [], timeline: [], createdAt: '2024-06-01', updatedAt: '2024-06-10' }
];
const mockTeam: TeamMember[] = [
  { id: 't1', name: 'John Smith', role: 'Manager', requiredHours: 40, completedHours: 38, deadline: '2024-06-30', status: 'active' }
];

export const getPractice = async (): Promise<Practice> => mockPractice;
export const getHealthScore = async (): Promise<HealthScore> => mockHealthScore;
export const getRescues = async (): Promise<Rescue[]> => mockRescues;
export const getComplaints = async (): Promise<HandoverComplaint[]> => mockComplaints;
export const getTeam = async (): Promise<TeamMember[]> => mockTeam;

// POST/PUT stubs
export const postAssessment = async (data: any) => ({ success: true });
export const postComplaint = async (data: any) => ({ success: true });
export const postRescue = async (data: any) => ({ success: true });
export const putRescue = async (id: string, data: any) => ({ success: true });
export const postCoachMessage = async (message: string) => ({ reply: 'Mock AI response.' }); 