import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { supabase } from '../../lib/supabase/client';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  TrophyIcon, 
  LockClosedIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../../contexts/AccountancyContext';

// Types for 365 Alignment Programme
interface FiveYearVision {
  id: string;
  title: string;
  description: string;
  targetRevenue: number;
  targetTeamSize: number;
  strategicPillars: string[];
  createdAt: string;
  status: 'draft' | 'active' | 'completed';
}

interface SixMonthShift {
  id: string;
  visionId: string;
  shiftNumber: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  keyObjectives: string[];
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
}

interface ThreeMonthSprint {
  id: string;
  shiftId: string;
  sprintNumber: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goals: SprintGoal[];
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
}

interface SprintGoal {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'strategic' | 'people';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  assignedTo?: string;
  dueDate: string;
}

interface Assessment {
  id: string;
  type: 'baseline' | 'quarterly' | 'annual';
  date: string;
  score: number;
  areas: AssessmentArea[];
}

interface AssessmentArea {
  name: string;
  score: number;
  recommendations: string[];
}

interface ClientPortalData {
  clientId: string;
  clientName: string;
  fiveYearVision: FiveYearVision | null;
  shifts: SixMonthShift[];
  sprints: ThreeMonthSprint[];
  assessments: Assessment[];
  currentPhase: {
    type: 'vision' | 'shift' | 'sprint';
    id: string;
    name: string;
  };
}

export default function AlignmentProgrammePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { practice, subscriptionTier } = useAccountancyContext();
  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'vision' | 'shifts' | 'sprints' | 'assessments'>('overview');

  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState(clientId || '');

  useEffect(() => {
    console.log('AlignmentProgrammePage mounted', { clientId, subscriptionTier, practiceId: practice?.id });
    if (practice?.id) {
      fetchClients();
    }
  }, [practice?.id]);

  useEffect(() => {
    if (selectedClient) {
      loadPortalData();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session - showing empty client list');
        setAvailableClients([]);
        return;
      }

      // Fetch clients from oracle_client_mapping
      const { data: clientMappings, error } = await supabase
        .from('oracle_client_mapping')
        .select(`
          id,
          oracle_client_id,
          practice_id,
          client_config (
            client_name,
            contact_email
          )
        `)
        .eq('practice_id', practice?.id);

      if (error) {
        console.error('Error fetching clients:', error);
        setAvailableClients([]);
        return;
      }

      if (clientMappings && clientMappings.length > 0) {
        const clients = clientMappings.map((mapping: any) => ({
          id: mapping.oracle_client_id,
          name: mapping.client_config?.client_name || 'Unnamed Client',
          email: mapping.client_config?.contact_email || ''
        }));
        
        console.log('Loaded clients from Supabase:', clients);
        setAvailableClients(clients);
        
        // Set first client as default if no clientId provided
        if (!selectedClient && clients.length > 0) {
          setSelectedClient(clients[0].id);
        }
      } else {
        console.log('No clients found for practice');
        setAvailableClients([]);
      }
    } catch (error) {
      console.error('Error in fetchClients:', error);
      setAvailableClients([]);
    }
  };

  const loadPortalData = async () => {
    try {
      setLoading(true);
      
      // Get client name from selected client
      const client = availableClients.find(c => c.id === selectedClient);
      
      if (!client) {
        console.log('No client selected or found');
        setLoading(false);
        return;
      }
      
      // Mock data - replace with actual API call
      const mockData: ClientPortalData = {
        clientId: selectedClient,
        clientName: client.name,
        fiveYearVision: {
          id: 'vision-1',
          title: 'Transform IVC into Leading Advisory Practice',
          description: 'Build a £2M advisory-focused practice with 15 team members, known for exceptional client outcomes and innovative service delivery.',
          targetRevenue: 2000000,
          targetTeamSize: 15,
          strategicPillars: [
            'Advisory Excellence',
            'Technology Leadership',
            'Team Development',
            'Client Success'
          ],
          createdAt: '2025-10-04',
          status: 'active'
        },
        shifts: [
          {
            id: 'shift-1',
            visionId: 'vision-1',
            shiftNumber: 1,
            title: 'Q1: Foundation Building',
            description: 'Establish core systems, processes, and team capabilities',
            startDate: '2025-10-04',
            endDate: '2026-04-04',
            keyObjectives: [
              'Complete systems audit and optimization',
              'Build advisory service framework',
              'Hire 2 key team members',
              'Launch client portal'
            ],
            status: 'in-progress',
            progress: 35
          },
          {
            id: 'shift-2',
            visionId: 'vision-1',
            shiftNumber: 2,
            title: 'Q2: Growth Acceleration',
            description: 'Scale advisory services and client base',
            startDate: '2026-04-04',
            endDate: '2026-10-04',
            keyObjectives: [
              'Acquire 15 new advisory clients',
              'Launch 3 new service offerings',
              'Achieve 30% revenue growth',
              'Implement client success program'
            ],
            status: 'not-started',
            progress: 0
          }
        ],
        sprints: [
          {
            id: 'sprint-1',
            shiftId: 'shift-1',
            sprintNumber: 1,
            title: 'Sprint 1: Systems & Foundation',
            description: 'Oct 2025 - Dec 2025',
            startDate: '2025-10-04',
            endDate: '2026-01-04',
            status: 'in-progress',
            progress: 65,
            goals: [
              {
                id: 'goal-1',
                title: 'Complete Financial Systems Audit',
                description: 'Comprehensive review of all accounting and operational systems',
                category: 'operational',
                priority: 'high',
                status: 'in-progress',
                progress: 75,
                dueDate: '2025-11-15'
              },
              {
                id: 'goal-2',
                title: 'Design Advisory Service Packages',
                description: 'Create 3 core advisory service offerings with pricing',
                category: 'strategic',
                priority: 'high',
                status: 'in-progress',
                progress: 50,
                dueDate: '2025-12-01'
              },
              {
                id: 'goal-3',
                title: 'Recruit Senior Advisory Consultant',
                description: 'Hire experienced advisor to lead client engagements',
                category: 'people',
                priority: 'critical',
                status: 'not-started',
                progress: 0,
                dueDate: '2025-12-31'
              }
            ]
          },
          {
            id: 'sprint-2',
            shiftId: 'shift-1',
            sprintNumber: 2,
            title: 'Sprint 2: Service Launch',
            description: 'Jan 2026 - Mar 2026',
            startDate: '2026-01-04',
            endDate: '2026-04-04',
            status: 'not-started',
            progress: 0,
            goals: []
          }
        ],
        assessments: [
          {
            id: 'assessment-1',
            type: 'baseline',
            date: '2025-10-04',
            score: 68,
            areas: [
              {
                name: 'Financial Performance',
                score: 72,
                recommendations: [
                  'Improve cash flow forecasting',
                  'Diversify revenue streams'
                ]
              },
              {
                name: 'Operational Efficiency',
                score: 65,
                recommendations: [
                  'Automate client onboarding',
                  'Implement project management system'
                ]
              },
              {
                name: 'Advisory Capability',
                score: 58,
                recommendations: [
                  'Develop advisory framework',
                  'Train team on advisory skills'
                ]
              },
              {
                name: 'Client Experience',
                score: 75,
                recommendations: [
                  'Launch client portal',
                  'Implement feedback system'
                ]
              }
            ]
          }
        ],
        currentPhase: {
          type: 'sprint',
          id: 'sprint-1',
          name: 'Sprint 1: Systems & Foundation'
        }
      };

      setPortalData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading portal data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isProfessionalPlus = ['professional', 'excellence', 'enterprise'].includes(subscriptionTier);

  if (!isProfessionalPlus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockClosedIcon className="h-6 w-6 text-amber-500" />
              Professional Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              365 Alignment Programme is available on Professional tier and above.
            </p>
            <Button onClick={() => navigate('/accountancy/manage-subscription')}>
              Upgrade Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const currentSprint = portalData?.sprints.find(s => s.status === 'in-progress') || portalData?.sprints[0];
  const currentShift = portalData?.shifts.find(s => s.status === 'in-progress') || portalData?.shifts[0];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              365 Alignment Programme
            </h1>
            <p className="text-gray-600">
              Year-long strategic alignment for {portalData?.clientName}
            </p>
          </div>
          <Badge className="bg-blue-500 text-white">PRO</Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'vision', label: '5-Year Vision' },
            { key: 'shifts', label: '6-Month Shifts' },
            { key: 'sprints', label: '3-Month Sprints' },
            { key: 'assessments', label: 'Assessments & Roadmap' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Programme Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Start Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">End Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Current Phase</h3>
                  <p className="text-lg font-semibold text-gray-900">{portalData?.currentPhase.name}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {currentShift?.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${currentShift?.progress || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vision Status</p>
                    <p className="text-2xl font-bold text-gray-900">Active</p>
                  </div>
                  <RocketLaunchIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">6-Month Shifts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {portalData?.shifts.filter(s => s.status === 'completed').length} / {portalData?.shifts.length}
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Sprint</p>
                    <p className="text-2xl font-bold text-gray-900">Sprint {currentSprint?.sprintNumber}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sprint Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{currentSprint?.progress}%</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Sprint Goals */}
          {currentSprint && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Sprint: {currentSprint.title}</CardTitle>
                  <Button size="sm" onClick={() => setActiveView('sprints')}>
                    View All <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">{currentSprint.description}</p>
                <div className="space-y-4">
                  {currentSprint.goals.map((goal) => (
                    <div key={goal.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                            <Badge variant="outline">{goal.category}</Badge>
                            <Badge variant={goal.priority === 'critical' ? 'destructive' : 'secondary'}>
                              {goal.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                          <p className="text-xs text-gray-500">Due: {new Date(goal.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${getStatusColor(goal.status)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 5-Year Vision Tab */}
      {activeView === 'vision' && portalData?.fiveYearVision && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RocketLaunchIcon className="h-6 w-6 text-purple-500" />
                  5-Year Vision
                </CardTitle>
                <Badge className="bg-purple-500 text-white">
                  {portalData.fiveYearVision.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {portalData.fiveYearVision.title}
              </h2>
              <p className="text-gray-600 mb-6">
                {portalData.fiveYearVision.description}
              </p>

              {/* Vision Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Target Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    £{(portalData.fiveYearVision.targetRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Target Team Size</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {portalData.fiveYearVision.targetTeamSize} people
                  </p>
                </div>
              </div>

              {/* Strategic Pillars */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Pillars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portalData.fiveYearVision.strategicPillars.map((pillar, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    <span className="font-medium text-gray-900">{pillar}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6-Month Shifts Tab */}
      {activeView === 'shifts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">6-Month Shifts</h2>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New Shift
            </Button>
          </div>

          {portalData?.shifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{shift.title}</CardTitle>
                  <Badge className={getStatusColor(shift.status)}>
                    {shift.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{shift.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium text-gray-900">{new Date(shift.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium text-gray-900">{new Date(shift.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Key Objectives</h4>
                <ul className="space-y-2 mb-4">
                  {shift.keyObjectives.map((obj, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">{obj}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progress</span>
                  <span className="text-lg font-bold text-gray-900">{shift.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${shift.progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 3-Month Sprints Tab */}
      {activeView === 'sprints' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">3-Month Sprints</h2>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create New Sprint
            </Button>
          </div>

          {portalData?.sprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{sprint.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(sprint.status)}>
                      {sprint.status}
                    </Badge>
                    <span className="text-lg font-bold text-gray-900">{sprint.progress}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{sprint.description}</p>
                
                {sprint.goals.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Sprint Goals</h4>
                    {sprint.goals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{goal.title}</h5>
                          <Badge variant="outline">{goal.progress}%</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`${getStatusColor(goal.status)} h-1.5 rounded-full`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No goals defined for this sprint yet</p>
                    <Button className="mt-4" size="sm">Add Goals</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assessments & Roadmap Tab */}
      {activeView === 'assessments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History & Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              {portalData?.assessments.map((assessment) => (
                <div key={assessment.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {assessment.type} Assessment
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(assessment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{assessment.score}</p>
                      <p className="text-sm text-gray-600">Overall Score</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {assessment.areas.map((area, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{area.name}</h4>
                          <Badge variant={area.score >= 70 ? 'default' : 'secondary'}>
                            {area.score}/100
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full ${
                              area.score >= 70 ? 'bg-green-500' : 
                              area.score >= 50 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${area.score}%` }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {area.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button className="w-full mt-6">
                <PlusIcon className="w-4 h-4 mr-2" />
                Schedule Next Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
