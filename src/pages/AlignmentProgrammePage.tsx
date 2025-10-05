import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  TrophyIcon, 
  LockClosedIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  PlusIcon,
  DocumentTextIcon,
  UsersIcon,
  SparklesIcon,
  FireIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { oracleMethodService, type ClientProgress } from '../services/oracleMethodIntegration';

// Import all alignment enhancement components
import { ClientMappingPanel } from '../components/alignment/ClientMappingPanel';
import { NotificationCenter } from '../components/alignment/NotificationCenter';
import { AnalyticsDashboard } from '../components/alignment/AnalyticsDashboard';
import { BulkActionsBar } from '../components/alignment/BulkActionsBar';
import { ExportMenu } from '../components/alignment/ExportMenu';
import { CallTranscriptPanel } from '../components/alignment/CallTranscriptPanel';
import { CalendlyConfigPanel } from '../components/alignment/CalendlyConfigPanel';
import { VisionWorkflowPanel } from '../components/alignment/VisionWorkflowPanel';

/**
 * 365 ALIGNMENT PROGRAMME - CLIENT ACCESS HUB
 * 
 * This page serves as the central hub for clients who have completed 
 * the Oracle Method assessment and are working through their tailored roadmap:
 * 
 * - 5-Year Vision: Their long-term strategic destination
 * - 6-Month Shifts: Two strategic shifts per year (key transformations)
 * - 3-Month Sprints: Two sprints per shift (tactical execution)
 * 
 * Clients access their live roadmap, track progress, and collaborate
 * with their accountant on achieving strategic goals.
 */

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
  type: 'oracle-method' | 'quarterly-review' | 'annual-review';
  completedDate: string;
  score: number;
  reportUrl?: string;
  areas: AssessmentArea[];
}

interface AssessmentArea {
  name: string;
  score: number;
  recommendations: string[];
}

interface ClientRoadmapData {
  clientId: string;
  clientName: string;
  hasOracleMethodAssessment: boolean;
  assessmentDate?: string;
  fiveYearVision: FiveYearVision | null;
  shifts: SixMonthShift[];
  sprints: ThreeMonthSprint[];
  assessments: Assessment[];
  currentPhase: {
    type: 'vision' | 'shift' | 'sprint';
    id: string;
    name: string;
  } | null;
}

export default function AlignmentProgrammePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { subscriptionTier, practice } = useAccountancyContext();
  
  // Use clientId directly from URL params instead of storing in state
  const selectedClientId = clientId || '';
  
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState<ClientRoadmapData | null>(null);
  const [clientProgress, setClientProgress] = useState<ClientProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vision' | 'shifts' | 'sprints' | 'tasks' | 'assessments' | 'workflow' | 'analytics' | 'transcripts' | 'calendly' | 'mapping'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [availableClients, setAvailableClients] = useState<Array<{group_id: string, client_email: string, business_name: string}>>([]);
  const [showSetupMode, setShowSetupMode] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check subscription tier
  const isProfessionalPlus = subscriptionTier === 'professional' || subscriptionTier === 'enterprise';

  // Fetch available clients from oracle_client_mapping
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('[365 Alignment] Fetching clients from oracle_client_mapping...');
        const { supabase } = await import('../lib/supabase/client');
        const { data, error } = await supabase
          .from('oracle_client_mapping')
          .select('*')
          .eq('mapping_status', 'active');
        
        console.log('[365 Alignment] Query result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('[365 Alignment] Error fetching clients:', error);
        }
        
        if (!error && data && data.length > 0) {
          const clients = data.map((d: any) => ({
            group_id: d.oracle_group_id,
            client_email: d.client_email,
            business_name: d.business_name
          }));
          console.log('[365 Alignment] Mapped clients:', clients);
          setAvailableClients(clients);
        } else {
          console.log('[365 Alignment] No clients found or error occurred');
        }
      } catch (error) {
        console.error('[365 Alignment] Exception fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId && isProfessionalPlus) {
      loadClientRoadmap();
      
      // Subscribe to real-time updates
      unsubscribeRef.current = oracleMethodService.subscribeToClientProgress(
        selectedClientId,
        handleRealtimeUpdate
      );
    } else {
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [selectedClientId, isProfessionalPlus]);

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Real-time update received:', payload);
    // Reload data when changes occur
    loadClientRoadmap();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClientRoadmap();
    setRefreshing(false);
  };

  const loadClientRoadmap = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from Oracle Method Portal
      const progress = await oracleMethodService.getClientProgress(selectedClientId);
      
      if (!progress || !progress.roadmap) {
        setClientProgress(null);
        setRoadmapData(null);
        setLoading(false);
        return;
      }

      setClientProgress(progress);

      // Transform Oracle Method data to ClientRoadmapData format
      const transformedData: ClientRoadmapData = {
        clientId: selectedClientId,
        clientName: progress.business_name || progress.email,
        hasOracleMethodAssessment: progress.roadmap.roadmap_generated,
        assessmentDate: progress.roadmap.roadmap_generated_at || new Date().toISOString(),
        fiveYearVision: progress.roadmap.five_year_vision ? {
          id: selectedClientId,
          title: progress.roadmap.five_year_vision.title,
          description: progress.roadmap.five_year_vision.description,
          targetRevenue: progress.roadmap.five_year_vision.target_revenue || 0,
          targetTeamSize: progress.roadmap.five_year_vision.target_team_size || 0,
          strategicPillars: progress.roadmap.five_year_vision.strategic_pillars || [],
          createdAt: progress.roadmap.roadmap_generated_at || new Date().toISOString(),
          status: 'active'
        } : null,
        shifts: progress.roadmap.six_month_shift ? [
          {
            id: `${selectedClientId}-shift-1`,
            visionId: selectedClientId,
            shiftNumber: 1,
            title: 'Current 6-Month Shift',
            description: progress.roadmap.six_month_shift.vision_statement,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            keyObjectives: progress.roadmap.six_month_shift.major_milestones || [],
            status: 'in-progress',
            progress: progress.stats.completion_percentage
          }
        ] : [],
        sprints: progress.roadmap.three_month_sprint ? [{
          id: `${selectedClientId}-sprint-${progress.roadmap.sprint_iteration}`,
          shiftId: `${selectedClientId}-shift-1`,
          sprintNumber: progress.roadmap.sprint_iteration,
          title: progress.roadmap.three_month_sprint.sprint_theme || `Sprint ${progress.roadmap.sprint_iteration}`,
          description: progress.roadmap.three_month_sprint.sprint_goals?.join(', ') || '90-day transformation sprint',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: progress.stats.completion_percentage > 90 ? 'completed' : 
                  progress.stats.completion_percentage > 0 ? 'in-progress' : 'not-started',
          progress: progress.stats.completion_percentage,
          goals: progress.tasks.map(task => ({
            id: task.task_id,
            title: task.task_title,
            description: task.task_description || '',
            category: 'operational' as const,
            priority: 'medium' as const,
            status: task.completed ? 'completed' as const : 'in-progress' as const,
            progress: task.completed ? 100 : 0,
            assignedTo: 'Client',
            dueDate: new Date().toISOString()
          }))
        }] : [],
        assessments: [
          {
            id: selectedClientId,
            type: 'oracle-method' as const,
            completedDate: progress.roadmap.roadmap_generated_at || new Date().toISOString(),
            score: progress.stats.completion_percentage,
            areas: []
          }
        ],
        currentPhase: progress.roadmap.current_week > 0 ? {
          type: 'sprint' as const,
          id: `${selectedClientId}-sprint-${progress.roadmap.sprint_iteration}`,
          name: `Week ${progress.roadmap.current_week} of Sprint ${progress.roadmap.sprint_iteration}`
        } : null
      };

      setRoadmapData(transformedData);
    } catch (error) {
      console.error('Error loading client roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await oracleMethodService.updateTaskStatus(taskId, completed);
      await loadClientRoadmap(); // Reload to get updated data
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task status');
    }
  };

  const handleAddTaskNote = async (taskId: string, notes: string) => {
    try {
      await oracleMethodService.updateTaskStatus(taskId, true, notes);
      await loadClientRoadmap();
    } catch (error) {
      console.error('Error adding task note:', error);
      alert('Failed to add note');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await oracleMethodService.deleteTask(taskId);
      await loadClientRoadmap();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client roadmap...</p>
        </div>
      </div>
    );
  }

  if (!isProfessionalPlus) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              365 Alignment Programme
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              The 365 Alignment Programme is available on Professional and Enterprise plans.
              Help your clients achieve their strategic goals with structured roadmaps based
              on the Oracle Method assessment.
            </p>
            <Button onClick={() => navigate('/manage-subscription')}>
              Upgrade to Access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show setup mode if no clients and user wants to configure
  if (!selectedClientId && showSetupMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button onClick={() => setShowSetupMode(false)} variant="outline" size="sm">
            ← Back to Client Selection
          </Button>
        </div>
        <ClientMappingPanel practiceId={practice?.id || '00000000-0000-0000-0000-000000000000'} />
      </div>
    );
  }

  if (!selectedClientId || !roadmapData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Select a Client
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a client to view their Oracle Method roadmap and track their progress
              through their 5-year vision, 6-month shifts, and 3-month sprints.
            </p>
            {availableClients.length > 0 ? (
              <div className="max-w-md mx-auto space-y-3">
                {availableClients.map(client => (
                  <Button
                    key={client.group_id}
                    onClick={() => navigate(`/365-alignment/${client.group_id}`)}
                    variant="outline"
                    className="w-full justify-start text-left p-4 h-auto"
                  >
                    <div>
                      <div className="font-semibold">{client.business_name}</div>
                      <div className="text-sm text-gray-500">{client.client_email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">No clients found. Create client mappings first.</p>
                <Button onClick={() => setShowSetupMode(true)} variant="outline">
                  Configure Client Mapping
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">365 Alignment Programme</h1>
            <p className="mt-2 text-gray-600">
              Oracle Method Roadmap for <strong>{roadmapData.clientName}</strong>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Center - NEW */}
            <NotificationCenter 
              practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
              userId={selectedClientId}
            />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/client-management')}>
              Change Client
            </Button>
            {roadmapData.hasOracleMethodAssessment && (
              <Badge variant="default" className="bg-purple-600">
                <SparklesIcon className="w-4 h-4 mr-1" />
                Oracle Method Assessed
              </Badge>
            )}
            {clientProgress && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <FireIcon className="w-4 h-4 mr-1" />
                Week {clientProgress.roadmap.current_week}/{clientProgress.roadmap.three_month_sprint?.total_weeks || 12}
              </Badge>
            )}
          </div>
        </div>

        {/* Current Phase Banner */}
        {roadmapData.currentPhase && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">CURRENTLY IN</p>
                <h3 className="text-2xl font-bold mt-1">{roadmapData.currentPhase.name}</h3>
              </div>
              <FireIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'workflow', label: 'Vision Workflow', icon: SparklesIcon },
            { id: 'vision', label: '5-Year Vision', icon: TrophyIcon },
            { id: 'shifts', label: '6-Month Shifts', icon: RocketLaunchIcon },
            { id: 'sprints', label: '3-Month Sprints', icon: CalendarDaysIcon },
            { id: 'tasks', label: 'Task Management', icon: CheckCircleIcon },
            { id: 'assessments', label: 'Assessments', icon: DocumentTextIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
            { id: 'transcripts', label: 'Call Transcripts', icon: PhoneIcon },
            { id: 'calendly', label: 'Booking', icon: LinkIcon },
            { id: 'mapping', label: 'Client Mapping', icon: UsersIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5-Year Vision Summary */}
            {roadmapData.fiveYearVision && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrophyIcon className="w-6 h-6 mr-2 text-yellow-500" />
                    5-Year Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {roadmapData.fiveYearVision.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {roadmapData.fiveYearVision.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Target Revenue</p>
                      <p className="text-lg font-bold text-gray-900">
                        £{(roadmapData.fiveYearVision.targetRevenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Target Team Size</p>
                      <p className="text-lg font-bold text-gray-900">
                        {roadmapData.fiveYearVision.targetTeamSize} people
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Strategic Pillars:</p>
                    <div className="space-y-1">
                      {roadmapData.fiveYearVision.strategicPillars.map((pillar, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                          {pillar}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="w-6 h-6 mr-2 text-blue-500" />
                  Current Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roadmapData.shifts.map((shift) => (
                    <div key={shift.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {shift.title}
                        </span>
                        <Badge className={getStatusColor(shift.status)}>
                          {shift.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${shift.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {shift.progress}% complete
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest Assessment */}
            {roadmapData.assessments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DocumentTextIcon className="w-6 h-6 mr-2 text-purple-500" />
                    Latest Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const latest = roadmapData.assessments[0];
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {latest.type === 'oracle-method' ? 'Oracle Method Assessment' : latest.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(latest.completedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">{latest.score}</p>
                            <p className="text-xs text-gray-500">Overall Score</p>
                          </div>
                        </div>
                        {latest.reportUrl && (
                          <Button variant="outline" className="w-full" size="sm">
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            View Full Report
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Sprint Goal
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  Schedule Review Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Request Progress Update
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VISION WORKFLOW TAB */}
        {activeTab === 'workflow' && (
          <VisionWorkflowPanel
            practiceId={practice?.id || '00000000-0000-0000-0000-000000000000'}
            oracleGroupId={selectedClientId}
            onVisionUpdated={loadClientRoadmap}
          />
        )}

        {/* 5-YEAR VISION TAB */}
        {activeTab === 'vision' && roadmapData.fiveYearVision && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrophyIcon className="w-6 h-6 mr-2 text-yellow-500" />
                  5-Year Vision
                </div>
                <Badge className={getStatusColor(roadmapData.fiveYearVision.status)}>
                  {roadmapData.fiveYearVision.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {roadmapData.fiveYearVision.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {roadmapData.fiveYearVision.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      £{(roadmapData.fiveYearVision.targetRevenue / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Team Size</p>
                    <p className="text-2xl font-bold text-green-600">
                      {roadmapData.fiveYearVision.targetTeamSize} people
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Date(roadmapData.fiveYearVision.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Strategic Pillars</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roadmapData.fiveYearVision.strategicPillars.map((pillar, idx) => (
                      <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900">{pillar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6-MONTH SHIFTS TAB */}
        {activeTab === 'shifts' && (
          <div className="space-y-6">
            {roadmapData.shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RocketLaunchIcon className="w-6 h-6 mr-2 text-blue-500" />
                      Shift {shift.shiftNumber}: {shift.title}
                    </div>
                    <Badge className={getStatusColor(shift.status)}>
                      {shift.status.replace('-', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{shift.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Start Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(shift.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(shift.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-semibold text-gray-900">{shift.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${shift.progress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Objectives:</p>
                    <div className="space-y-2">
                      {shift.keyObjectives.map((objective, idx) => (
                        <div key={idx} className="flex items-start">
                          <ArrowRightIcon className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 3-MONTH SPRINTS TAB */}
        {activeTab === 'sprints' && (
          <div className="space-y-6">
            {roadmapData.sprints.map((sprint) => (
              <Card key={sprint.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-6 h-6 mr-2 text-green-500" />
                      {sprint.title}
                    </div>
                    <Badge className={getStatusColor(sprint.status)}>
                      {sprint.status.replace('-', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{sprint.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Start</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(sprint.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">End</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(sprint.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Progress</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {sprint.progress}%
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${sprint.progress}%` }}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Sprint Goals</h4>
                    <div className="space-y-3">
                      {sprint.goals.map((goal) => (
                        <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{goal.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge className={getPriorityColor(goal.priority)} variant="outline">
                                {goal.priority}
                              </Badge>
                              <Badge className={getStatusColor(goal.status)}>
                                {goal.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">Category</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">{goal.category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Assigned To</p>
                              <p className="text-sm font-medium text-gray-900">{goal.assignedTo || 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Due Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(goal.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Progress</span>
                              <span className="text-xs font-semibold text-gray-900">{goal.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  goal.status === 'completed' ? 'bg-green-600' :
                                  goal.status === 'in-progress' ? 'bg-blue-600' :
                                  goal.status === 'blocked' ? 'bg-red-600' : 'bg-gray-400'
                                }`}
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TASK MANAGEMENT TAB */}
        {activeTab === 'tasks' && clientProgress && (
          <div className="space-y-6">
            {/* Bulk Actions Bar - NEW */}
            <BulkActionsBar 
              practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
              oracleGroupId={selectedClientId}
              selectedTaskIds={[]}
              onClearSelection={() => {}}
              onActionComplete={handleRefresh}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 mr-2 text-blue-500" />
                    Live Task Tracking
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                      {clientProgress.stats.tasks_completed}/{clientProgress.stats.total_tasks} Completed
                    </Badge>
                    <Badge variant="outline" className="bg-green-50">
                      {clientProgress.stats.completion_percentage}% Progress
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Real-time sync:</strong> These tasks are synced live from the Oracle Method Portal. 
                    When the client updates their progress, you'll see it here instantly. You can also manage tasks on their behalf.
                  </p>
                </div>

                <div className="space-y-4">
                  {clientProgress.roadmap.three_month_sprint?.weeks && clientProgress.roadmap.three_month_sprint.weeks.length > 0 ? (
                    clientProgress.roadmap.three_month_sprint.weeks.map((week, weekIdx) => (
                    <Card key={weekIdx} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Week {week.week_number}: {week.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{week.focus}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {week.actions.map((action, actionIdx) => {
                            const taskKey = `${week.week_number}-${actionIdx}`;
                            const matchingTask = clientProgress.tasks.find(
                              t => t.task_title === action || t.week_number === week.week_number
                            );
                            const isCompleted = matchingTask?.completed || false;
                            const taskId = matchingTask?.task_id || taskKey;

                            return (
                              <div
                                key={actionIdx}
                                className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                                  isCompleted
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-start flex-1">
                                  <button
                                    onClick={() => handleToggleTask(taskId, !isCompleted)}
                                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                      isCompleted
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 hover:border-blue-500'
                                    }`}
                                  >
                                    {isCompleted && (
                                      <CheckCircleIcon className="w-4 h-4 text-white" />
                                    )}
                                  </button>
                                  <div className="ml-3 flex-1">
                                    <p className={`font-medium ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                                      {action}
                                    </p>
                                    {matchingTask?.notes && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        📝 {matchingTask.notes}
                                      </p>
                                    )}
                                    {matchingTask?.completed_date && (
                                      <p className="text-xs text-green-600 mt-1">
                                        ✓ Completed {new Date(matchingTask.completed_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {matchingTask && (
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => {
                                        const notes = prompt('Add a note for this task:', matchingTask.notes || '');
                                        if (notes !== null) handleAddTaskNote(taskId, notes);
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Add/Edit Note"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(taskId)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete Task"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  ) : (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-yellow-800">
                          No weekly tasks found in the roadmap. Tasks may need to be generated through the Vision Workflow.
                        </p>
                        {clientProgress.tasks && clientProgress.tasks.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-3">But we found {clientProgress.tasks.length} tasks in the database:</p>
                            <div className="space-y-2">
                              {clientProgress.tasks.map((task) => (
                                <div key={task.task_id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={task.completed}
                                      onChange={() => handleToggleTask(task.task_id, !task.completed)}
                                      className="w-4 h-4"
                                    />
                                    <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                                      {task.task_title}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">Week {task.week_number || '?'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {roadmapData.assessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-6 h-6 mr-2 text-purple-500" />
                      {assessment.type === 'oracle-method' ? 'Oracle Method Assessment' : 
                       assessment.type === 'quarterly-review' ? 'Quarterly Review' : 
                       'Annual Review'}
                    </div>
                    <Badge variant="outline">
                      {new Date(assessment.completedDate).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                      <p className="text-4xl font-bold text-blue-600">{assessment.score}</p>
                    </div>
                    {assessment.reportUrl && (
                      <Button variant="outline">
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        View Full Report
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Assessment Areas</h4>
                    {assessment.areas.map((area, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{area.name}</h5>
                          <span className="text-2xl font-bold text-blue-600">{area.score}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full ${
                              area.score >= 80 ? 'bg-green-600' :
                              area.score >= 60 ? 'bg-blue-600' :
                              area.score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${area.score}%` }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {area.recommendations.map((rec, recIdx) => (
                              <li key={recIdx} className="text-sm text-gray-600 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ANALYTICS TAB - NEW */}
        {activeTab === 'analytics' && clientProgress && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartBarIcon className="w-6 h-6 mr-2 text-blue-500" />
                    Client Progress Analytics
                  </div>
                  <ExportMenu 
                    practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479" 
                    oracleGroupId={selectedClientId}
                    userId={selectedClientId}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard 
                  practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
                  oracleGroupId={selectedClientId}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CALL TRANSCRIPTS TAB - NEW */}
        {activeTab === 'transcripts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PhoneIcon className="w-6 h-6 mr-2 text-purple-500" />
                  Call Transcripts & Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CallTranscriptPanel 
                  practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
                  oracleGroupId={selectedClientId}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CALENDLY BOOKING TAB - NEW */}
        {activeTab === 'calendly' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="w-6 h-6 mr-2 text-green-500" />
                  Meeting Scheduler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendlyConfigPanel 
                  practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
                  oracleGroupId={selectedClientId}
                  userId={selectedClientId}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CLIENT MAPPING TAB - NEW */}
        {activeTab === 'mapping' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="w-6 h-6 mr-2 text-orange-500" />
                  Client Mapping Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientMappingPanel practiceId="f47ac10b-58cc-4372-a567-0e02b2c3d479" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
