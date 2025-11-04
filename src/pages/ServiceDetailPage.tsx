import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Target } from 'lucide-react';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { supabase } from '../lib/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { WorkflowBuilder } from '../components/workflows/WorkflowBuilder';
import { WorkflowExecutionList } from '../components/workflows/WorkflowExecutionList';
import { WorkflowExecutor } from '../components/workflows/WorkflowExecutor';
import { getTemplateByServiceType } from '../data/workflowTemplates';
import { advisoryServicesMap, type ServiceLine, type SeniorityLevel } from '../lib/advisory-services-skills-mapping';
import {
  getServiceSkillAssignments,
  assignSkillToService,
  removeSkillFromService,
  type ServiceSkillAssignment
} from '../lib/api/service-skills';
import {
  getServiceDeliveryRoles,
  getDeliveryRoleSkills,
  upsertDeliveryRole,
  deleteDeliveryRole,
  bulkAssignSkillsToRole,
  syncRoleSkillsToService,
  getAggregatedSkillsFromRoles,
  type ServiceDeliveryRole,
  type DeliveryRoleSkill
} from '../lib/api/delivery-roles';
import {
  getWorkflowInstances,
  getWorkflowInstance,
  createWorkflowInstance,
  assignTeamMember,
  updateAssignment,
  removeAssignment,
  type WorkflowInstance,
  type WorkflowInstanceAssignment
} from '../lib/api/workflow-instances';
import type { Database } from '../lib/supabase/types';

type Workflow = Database['public']['Tables']['workflows']['Row'];
type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Row'];

interface ServiceDetailPageProps {}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const practiceId = practice?.id;

  console.log('[ServiceDetailPage] Mounted with serviceId:', serviceId, 'practiceId:', practiceId);

  // State
  const [service, setService] = useState<ServiceLine | null>(null);
  const [customSkillAssignments, setCustomSkillAssignments] = useState<ServiceSkillAssignment[]>([]);
  const [deliveryRoles, setDeliveryRoles] = useState<ServiceDeliveryRole[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skillsCapability, setSkillsCapability] = useState<any>({});
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isExecutorOpen, setIsExecutorOpen] = useState(false);
  const [isEditSkillsOpen, setIsEditSkillsOpen] = useState(false);
  const [isEditRoleSkillsOpen, setIsEditRoleSkillsOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isCreateInstanceOpen, setIsCreateInstanceOpen] = useState(false);
  const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ServiceDeliveryRole | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  useEffect(() => {
    if (serviceId && practiceId) {
      loadServiceAndWorkflows();
    }
  }, [serviceId, practiceId]);

  const loadServiceAndWorkflows = async () => {
    try {
      setLoading(true);

      // Load service from advisory services map
      const foundService = advisoryServicesMap.find(s => s.id === serviceId);
      
      if (!foundService) {
        console.error('[ServiceDetailPage] Service not found:', serviceId, 'Available services:', advisoryServicesMap.map(s => s.id));
        setLoading(false);
        return;
      }
      
      setService(foundService);
      console.log('[ServiceDetailPage] Service loaded:', foundService.name);

      // Load all skills from database
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (skillsError) {
        console.error('Error loading skills:', skillsError);
      } else {
        setAllSkills(skillsData || []);
      }

      // Load custom skill assignments for this service
      try {
        const customAssignments = await getServiceSkillAssignments(practiceId!, serviceId!);
        setCustomSkillAssignments(customAssignments);
        console.log('[ServiceDetailPage] Loaded', customAssignments.length, 'custom skill assignments');
      } catch (error) {
        console.error('Error loading custom skill assignments:', error);
      }

      // Load delivery roles for this service
      try {
        const roles = await getServiceDeliveryRoles(practiceId!, serviceId!);
        setDeliveryRoles(roles);
        console.log('[ServiceDetailPage] Loaded', roles.length, 'delivery roles');
      } catch (error) {
        console.error('Error loading delivery roles:', error);
      }

      // Load workflow instances (active client engagements)
      try {
        const instances = await getWorkflowInstances(practiceId!, serviceId!);
        setWorkflowInstances(instances);
        console.log('[ServiceDetailPage] Loaded', instances.length, 'workflow instances');
      } catch (error) {
        console.error('Error loading workflow instances:', error);
      }

      // Load team members and their skills
      const { data: membersData, error: membersError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', practiceId!);

      if (membersError) {
        console.error('Error loading team members:', membersError);
      } else {
        // Load skill assessments for each member
        const membersWithSkills = await Promise.all((membersData || []).map(async (member) => {
          const { data: skillsData } = await supabase
            .from('skill_assessments')
            .select(`
              skill_id,
              current_level,
              interest_level,
              skills (
                name,
                category
              )
            `)
            .eq('team_member_id', member.id);

          return {
            ...member,
            skills: skillsData || []
          };
        }));

        setTeamMembers(membersWithSkills);

        // Calculate capability for each required skill
        const capability: any = {};
        foundService.requiredSkills.forEach(req => {
          const membersWithSkill = membersWithSkills.filter(m => 
            m.skills.some((s: any) => s.skills?.name === req.skillName && s.current_level >= req.minimumLevel)
          );
          
          capability[req.skillName] = {
            required: req,
            available: membersWithSkill.length,
            members: membersWithSkill.map(m => ({
              name: m.full_name,
              role: m.role,
              level: m.skills.find((s: any) => s.skills?.name === req.skillName)?.current_level || 0
            }))
          };
        });
        
        setSkillsCapability(capability);
      }

      // Load workflows from Supabase
      const { data: workflowsData, error: workflowsError } = await supabase
        .from('workflows')
        .select('*')
        .eq('practice_id', practiceId!)
        .eq('service_id', serviceId!)
        .order('created_at', { ascending: false });

      if (workflowsError) {
        console.error('Error loading workflows:', workflowsError);
      } else {
        setWorkflows(workflowsData || []);
      }

      // Load recent executions
      if (workflowsData && workflowsData.length > 0) {
        const workflowIds = workflowsData.map(w => w.id);
        const { data: executionsData, error: executionsError } = await supabase
          .from('workflow_executions')
          .select('*')
          .in('workflow_id', workflowIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (executionsError) {
          console.error('Error loading executions:', executionsError);
        } else {
          setExecutions(executionsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get effective skills (custom or default)
  const getEffectiveSkills = () => {
    if (!service) return [];

    // If we have custom assignments, use those
    if (customSkillAssignments.length > 0) {
      return customSkillAssignments.map(assignment => ({
        skillName: assignment.skill?.name || '',
        minimumLevel: assignment.minimum_level,
        idealLevel: assignment.ideal_level,
        criticalToDelivery: assignment.is_critical,
        recommendedSeniority: assignment.required_seniority as SeniorityLevel[]
      }));
    }

    // Otherwise, use default from the service mapping
    return service.requiredSkills;
  };

  // Helper to get readiness status for a skill
  const getSkillStatus = (skillName: string) => {
    const cap = skillsCapability[skillName];
    if (!cap) return { status: 'unknown', color: 'gray' };
    
    if (cap.available === 0) return { status: 'Not Available', color: 'red' };
    if (cap.available >= 2) return { status: 'Ready', color: 'green' };
    return { status: 'Limited', color: 'amber' };
  };

  // Handler to sync role skills to service skills
  const handleSyncRoleSkills = async () => {
    if (!practiceId || !serviceId) return;

    try {
      setSyncing(true);
      await syncRoleSkillsToService(practiceId, serviceId);
      // Reload service data to show updated skills
      await loadServiceAndWorkflows();
      alert('Successfully synced role skills to service!');
    } catch (error) {
      console.error('Error syncing skills:', error);
      alert('Failed to sync skills. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Handler to open role skills editor
  const handleEditRoleSkills = (role: ServiceDeliveryRole) => {
    setSelectedRole(role);
    setIsEditRoleSkillsOpen(true);
  };

  // Get effective delivery team (merge custom with defaults)
  const getEffectiveDeliveryTeam = () => {
    if (!service) return [];

    // Start with default roles from service mapping
    const defaultTeam = service.deliveryTeam.map(team => ({
      seniority: team.seniority,
      responsibilities: team.responsibilities,
      hoursEstimate: team.hoursEstimate,
      roleId: null
    }));

    // If we have no custom roles, return defaults
    if (deliveryRoles.length === 0) {
      return defaultTeam;
    }

    // Merge: Use custom role if exists, otherwise use default
    return defaultTeam.map(defaultRole => {
      const customRole = deliveryRoles.find(r => r.seniority === defaultRole.seniority);
      
      if (customRole) {
        return {
          seniority: customRole.seniority,
          responsibilities: customRole.responsibilities,
          hoursEstimate: customRole.estimated_hours ? `${customRole.estimated_hours}h` : 'TBD',
          roleId: customRole.id
        };
      }
      
      return defaultRole;
    });
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim() || !practiceId) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          practice_id: practiceId,
          service_id: serviceId!,
          name: newWorkflowName,
          description: newWorkflowDescription,
          is_active: true,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows([data, ...workflows]);
      setIsCreateWorkflowOpen(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');

      // Open builder for new workflow
      setSelectedWorkflow(data);
      setIsBuilderOpen(true);
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const handleLoadTemplate = async () => {
    if (!practiceId || !serviceId) return;

    try {
      const template = getTemplateByServiceType(serviceId);
      
      if (!template) {
        alert('No template available for this service type. You can create a custom workflow from scratch.');
        return;
      }

      // Create workflow from template
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          practice_id: practiceId,
          service_id: serviceId,
          name: template.name,
          description: template.description,
          is_active: true,
          metadata: { template_id: template.id }
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Create workflow steps from template
      for (const stepTemplate of template.steps) {
        const { error: stepError } = await supabase
          .from('workflow_steps')
          .insert({
            workflow_id: workflow.id,
            step_order: stepTemplate.step_order,
            step_type: stepTemplate.step_type,
            name: stepTemplate.name,
            description: stepTemplate.description,
            config: stepTemplate.config,
            input_mapping: stepTemplate.input_mapping || {},
            output_schema: stepTemplate.output_schema || {}
          });

        if (stepError) throw stepError;
      }

      await loadServiceAndWorkflows();
      alert(`Template "${template.name}" loaded successfully! You can now customize it.`);

    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsBuilderOpen(true);
  };

  const handleRunWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsExecutorOpen(true);
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          practice_id: workflow.practice_id,
          service_id: workflow.service_id,
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          is_active: true,
          metadata: workflow.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Also duplicate workflow steps
      const { data: stepsData } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflow.id);

      if (stepsData) {
        for (const step of stepsData) {
          await supabase.from('workflow_steps').insert({
            workflow_id: data.id,
            step_order: step.step_order,
            step_type: step.step_type,
            name: step.name,
            description: step.description,
            config: step.config,
            input_mapping: step.input_mapping,
            output_schema: step.output_schema
          });
        }
      }

      setWorkflows([data, ...workflows]);
      alert('Workflow duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      alert('Failed to duplicate workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(workflows.filter(w => w.id !== workflowId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: 'default', label: 'Completed' },
      running: { variant: 'secondary', label: 'Running' },
      failed: { variant: 'destructive', label: 'Failed' },
      pending: { variant: 'outline', label: 'Pending' },
      cancelled: { variant: 'outline', label: 'Cancelled' }
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => navigate('/advisory-services')} variant="outline">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Services
        </Button>
        <p className="mt-4 text-gray-600">Service not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button onClick={() => navigate('/advisory-services')} variant="outline" className="mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              {service.comingSoon && (
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              )}
            </div>
            <p className="mt-2 text-gray-600">{service.description}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-gray-500">Price: <strong className="text-gray-900">{service.priceRange}</strong></span>
              <span className="text-gray-500">Delivery: <strong className="text-gray-900">{service.deliveryTime}</strong></span>
              <span className="text-gray-500">Required Skills: <strong className="text-gray-900">{getEffectiveSkills().length}</strong></span>
              {customSkillAssignments.length > 0 && (
                <Badge variant="outline" className="text-xs">Customized</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditSkillsOpen(true)} variant="outline">
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              Edit Skills
            </Button>
            <Button onClick={() => handleLoadTemplate()} variant="outline">
              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
              Load Template
            </Button>
            <Button onClick={() => setIsCreateWorkflowOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Custom
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList>
          <TabsTrigger value="skills">Skills & Capability</TabsTrigger>
          <TabsTrigger value="delivery-team">Delivery Team Structure</TabsTrigger>
          <TabsTrigger value="engagements">Active Engagements ({workflowInstances.length})</TabsTrigger>
          <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions ({executions.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Skills & Capability Tab */}
        <TabsContent value="skills" className="mt-6 space-y-6">
          {/* Overall Readiness Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Service Readiness Overview</CardTitle>
                <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
                  Team capability to deliver this service based on skills assessment
                </CardDescription>
              </div>
              <Button 
                onClick={() => navigate('/team/advisory-capability')}
                variant="outline"
                size="sm"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Full Matrix
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="text-3xl font-bold text-green-700">
                    {Object.values(skillsCapability).filter((c: any) => c.available >= 2).length}
                  </div>
                  <div className="text-sm text-green-700 font-semibold mt-1">Ready Skills</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                  <div className="text-3xl font-bold text-amber-700">
                    {Object.values(skillsCapability).filter((c: any) => c.available === 1).length}
                  </div>
                  <div className="text-sm text-amber-700 font-semibold mt-1">Limited Skills</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-300">
                  <div className="text-3xl font-bold text-red-700">
                    {Object.values(skillsCapability).filter((c: any) => c.available === 0).length}
                  </div>
                  <div className="text-sm text-red-700 font-semibold mt-1">Missing Skills</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Skills Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Required Skills Breakdown</CardTitle>
              <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
                {getEffectiveSkills().length} skills required to deliver this service
                {customSkillAssignments.length > 0 && " (customized)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getEffectiveSkills().map((skill, idx) => {
                  const status = getSkillStatus(skill.skillName);
                  const cap = skillsCapability[skill.skillName];
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                            {skill.criticalToDelivery && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Min Level: {skill.minimumLevel}/5 • Ideal Level: {skill.idealLevel}/5
                          </div>
                        </div>
                        <Badge 
                          variant={status.color === 'green' ? 'default' : status.color === 'red' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {status.status}
                        </Badge>
                      </div>
                      
                      {cap && cap.members.length > 0 ? (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-700 mb-2">
                            Team Members ({cap.members.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cap.members.map((member: any, mIdx: number) => (
                              <div 
                                key={mIdx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs"
                              >
                                <span className="font-medium text-blue-900">{member.name}</span>
                                <span className="text-blue-600">({member.role})</span>
                                <span className="font-bold text-blue-700">L{member.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-red-600 font-semibold">
                            ⚠️ No team members currently have this skill at the required level
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Team Structure Tab */}
        <TabsContent value="delivery-team" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Delivery Team Structure</CardTitle>
                <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
                  Roles and responsibilities for delivering {service.name}
                  {deliveryRoles.length > 0 && " (customized)"}
                </CardDescription>
              </div>
              {deliveryRoles.length > 0 && (
                <Button 
                  onClick={handleSyncRoleSkills}
                  disabled={syncing}
                  variant="default"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Sync to Service Skills
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getEffectiveDeliveryTeam().map((team, idx) => {
                  const matchingRole = deliveryRoles.find(r => r.id === team.roleId);
                  return (
                  <div key={idx} className="border rounded-lg p-5 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{team.seniority}</h3>
                        <p className="text-sm text-gray-600 mt-1">Est. Hours: {team.hoursEstimate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {teamMembers.filter(m => m.role === team.seniority).length} Available
                        </Badge>
                        {matchingRole && (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedRole(matchingRole);
                                setIsEditRoleOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Cog6ToothIcon className="w-4 h-4 mr-1" />
                              Edit Role
                            </Button>
                            <Button
                              onClick={() => handleEditRoleSkills(matchingRole)}
                              variant="outline"
                              size="sm"
                            >
                              <Target className="w-4 h-4 mr-1" />
                              Edit Skills
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Responsibilities:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {team.responsibilities.map((resp, rIdx) => (
                          <li key={rIdx} className="text-sm text-gray-900">{resp}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Initialize Role Button (if not customized yet) */}
                    {!matchingRole && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          onClick={async () => {
                            try {
                              const newRole = await upsertDeliveryRole(
                                practiceId!,
                                service.id,
                                team.seniority,
                                team.responsibilities,
                                undefined,
                                idx
                              );
                              await loadServiceAndWorkflows();
                              handleEditRoleSkills(newRole);
                            } catch (error) {
                              console.error('Error creating role:', error);
                              alert('Failed to initialize role. Please try again.');
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Initialize & Assign Skills
                        </Button>
                      </div>
                    )}

                    {teamMembers.filter(m => m.role === team.seniority).length > 0 ? (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Available Team Members:</div>
                        <div className="flex flex-wrap gap-2">
                          {teamMembers
                            .filter(m => m.role === team.seniority)
                            .map((member, mIdx) => (
                              <div 
                                key={mIdx}
                                className="px-3 py-1 bg-white border-2 border-blue-300 rounded-lg text-sm font-medium text-blue-900"
                              >
                                {member.full_name}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-red-600 font-semibold">
                          ⚠️ No {team.seniority} level team members available
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Engagements Tab */}
        <TabsContent value="engagements" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle style={{ color: '#000000', fontWeight: '700' }}>Active Client Engagements</CardTitle>
                <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
                  Track real client work and team assignments
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateInstanceOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                New Engagement
              </Button>
            </CardHeader>
            <CardContent>
              {workflowInstances.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No client engagements yet</p>
                  <Button onClick={() => setIsCreateInstanceOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create First Engagement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowInstances.map((instance) => (
                    <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{instance.client_name}</h3>
                          <p className="text-sm text-gray-600">{service?.name}</p>
                        </div>
                        <Badge 
                          variant={
                            instance.status === 'completed' ? 'default' :
                            instance.status === 'in_progress' ? 'secondary' :
                            instance.status === 'on_hold' ? 'destructive' :
                            'outline'
                          }
                        >
                          {instance.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        {instance.start_date && (
                          <div>
                            <span className="text-gray-500">Start:</span>
                            <span className="ml-2 font-medium">{new Date(instance.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {instance.target_completion_date && (
                          <div>
                            <span className="text-gray-500">Target:</span>
                            <span className="ml-2 font-medium">{new Date(instance.target_completion_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Hours:</span>
                          <span className="ml-2 font-medium">
                            {instance.total_actual_hours || 0} / {instance.total_estimated_hours || 0}
                          </span>
                        </div>
                      </div>

                      {instance.notes && (
                        <p className="text-sm text-gray-600 mb-3">{instance.notes}</p>
                      )}

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          onClick={() => {
                            setSelectedInstance(instance);
                            setIsAssignTeamOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Assign Team
                        </Button>
                        <Button
                          onClick={() => navigate(`/advisory-services/${service?.id}/instance/${instance.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="mt-6">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No workflows yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a workflow for this service.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateWorkflowOpen(true)}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Workflow
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        {workflow.description && (
                          <CardDescription className="mt-1">{workflow.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Version:</span>
                        <span className="font-medium">{workflow.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium">
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="pt-3 border-t flex flex-col gap-2">
                        <Button 
                          onClick={() => handleRunWorkflow(workflow)} 
                          size="sm"
                          className="w-full"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Run Workflow
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditWorkflow(workflow)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <Cog6ToothIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDuplicateWorkflow(workflow)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            onClick={() => handleDeleteWorkflow(workflow.id)} 
                            variant="destructive" 
                            size="sm"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="mt-6">
          <WorkflowExecutionList 
            executions={executions} 
            workflows={workflows}
            onRefresh={loadServiceAndWorkflows}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p>Analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Create a new workflow for {service.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="workflow-name">Workflow Name *</Label>
              <Input
                id="workflow-name"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., Standard Forecasting Process"
              />
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateWorkflowOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={!newWorkflowName.trim()}>
              Create & Build
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Builder Dialog */}
      {isBuilderOpen && selectedWorkflow && (
        <WorkflowBuilder
          workflow={selectedWorkflow}
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setSelectedWorkflow(null);
            loadServiceAndWorkflows();
          }}
        />
      )}

      {/* Workflow Executor Dialog */}
      {isExecutorOpen && selectedWorkflow && practiceId && (
        <WorkflowExecutor
          workflow={selectedWorkflow}
          practiceId={practiceId}
          isOpen={isExecutorOpen}
          onClose={() => {
            setIsExecutorOpen(false);
            setSelectedWorkflow(null);
          }}
          onExecutionComplete={(executionId) => {
            console.log('Workflow execution completed:', executionId);
            loadServiceAndWorkflows(); // Refresh to show new execution
          }}
        />
      )}

      {/* Create Engagement Dialog */}
      <CreateEngagementDialog
        isOpen={isCreateInstanceOpen}
        onClose={() => setIsCreateInstanceOpen(false)}
        serviceId={serviceId!}
        serviceName={service?.name || ''}
        practiceId={practiceId!}
        onSuccess={async () => {
          await loadServiceAndWorkflows();
          setIsCreateInstanceOpen(false);
        }}
      />

      {/* Assign Team Dialog */}
      {selectedInstance && (
        <AssignTeamDialog
          isOpen={isAssignTeamOpen}
          onClose={() => {
            setIsAssignTeamOpen(false);
            setSelectedInstance(null);
          }}
          instance={selectedInstance}
          teamMembers={teamMembers}
          deliveryRoles={deliveryRoles}
          onSuccess={async () => {
            await loadServiceAndWorkflows();
            setIsAssignTeamOpen(false);
            setSelectedInstance(null);
          }}
        />
      )}

      {/* Edit Role Dialog */}
      {selectedRole && (
        <EditRoleDialog
          isOpen={isEditRoleOpen}
          onClose={() => {
            setIsEditRoleOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          serviceId={serviceId!}
          practiceId={practiceId!}
          onSuccess={async () => {
            await loadServiceAndWorkflows();
            setIsEditRoleOpen(false);
            setSelectedRole(null);
          }}
        />
      )}

      {/* Edit Role Skills Dialog */}
      {selectedRole && (
        <EditRoleSkillsDialog
          isOpen={isEditRoleSkillsOpen}
          onClose={() => {
            setIsEditRoleSkillsOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          allSkills={allSkills}
          onSave={async (assignments) => {
            try {
              await bulkAssignSkillsToRole(selectedRole.id, assignments);
              // Reload data to show updated role skills
              await loadServiceAndWorkflows();
              setIsEditRoleSkillsOpen(false);
              setSelectedRole(null);
            } catch (error) {
              console.error('Error saving role skills:', error);
              alert('Failed to save role skills. Please try again.');
            }
          }}
        />
      )}

      {/* Edit Skills Dialog */}
      {service && (
        <EditSkillsDialog
          isOpen={isEditSkillsOpen}
          onClose={() => setIsEditSkillsOpen(false)}
          service={service}
          practiceId={practiceId!}
          allSkills={allSkills}
          currentAssignments={customSkillAssignments}
          onSave={async (assignments) => {
            // Save all assignments
            try {
              for (const assignment of assignments) {
                await assignSkillToService(
                  practiceId!,
                  service.id,
                  assignment.skillId,
                  assignment.minimumLevel,
                  assignment.idealLevel,
                  assignment.isCritical,
                  assignment.requiredSeniority
                );
              }

              // Remove unselected skills
              const assignedSkillIds = assignments.map(a => a.skillId);
              const toRemove = customSkillAssignments.filter(
                ca => !assignedSkillIds.includes(ca.skill_id)
              );
              
              for (const ca of toRemove) {
                await removeSkillFromService(practiceId!, service.id, ca.skill_id);
              }

              // Reload data
              await loadServiceAndWorkflows();
              setIsEditSkillsOpen(false);
            } catch (error) {
              console.error('Error saving skill assignments:', error);
              alert('Failed to save skill assignments. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

// Edit Skills Dialog Component
interface EditSkillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceLine;
  practiceId: string;
  allSkills: any[];
  currentAssignments: ServiceSkillAssignment[];
  onSave: (assignments: Array<{
    skillId: string;
    minimumLevel: number;
    idealLevel: number;
    isCritical: boolean;
    requiredSeniority: string[];
  }>) => Promise<void>;
}

const EditSkillsDialog: React.FC<EditSkillsDialogProps> = ({
  isOpen,
  onClose,
  service,
  practiceId,
  allSkills,
  currentAssignments,
  onSave
}) => {
  const [selectedSkills, setSelectedSkills] = useState<Map<string, any>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  // Initialize selected skills from current assignments or defaults
  useEffect(() => {
    if (!isOpen) return;

    const initialSkills = new Map();
    
    // If we have custom assignments, use those
    if (currentAssignments.length > 0) {
      currentAssignments.forEach(assignment => {
        initialSkills.set(assignment.skill_id, {
          skillId: assignment.skill_id,
          skillName: assignment.skill?.name || '',
          minimumLevel: assignment.minimum_level,
          idealLevel: assignment.ideal_level,
          isCritical: assignment.is_critical,
          requiredSeniority: assignment.required_seniority || []
        });
      });
    } else {
      // Otherwise, use defaults from service mapping
      service.requiredSkills.forEach(skill => {
        const dbSkill = allSkills.find(s => s.name === skill.skillName);
        if (dbSkill) {
          initialSkills.set(dbSkill.id, {
            skillId: dbSkill.id,
            skillName: skill.skillName,
            minimumLevel: skill.minimumLevel,
            idealLevel: skill.idealLevel,
            isCritical: skill.criticalToDelivery,
            requiredSeniority: skill.recommendedSeniority || []
          });
        }
      });
    }

    setSelectedSkills(initialSkills);
  }, [isOpen, currentAssignments, service, allSkills]);

  const categories = ['all', ...Array.from(new Set(allSkills.map(s => s.category)))];

  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSkill = (skill: any) => {
    const newSelected = new Map(selectedSkills);
    if (newSelected.has(skill.id)) {
      newSelected.delete(skill.id);
    } else {
      newSelected.set(skill.id, {
        skillId: skill.id,
        skillName: skill.name,
        minimumLevel: 3,
        idealLevel: 4,
        isCritical: false,
        requiredSeniority: []
      });
    }
    setSelectedSkills(newSelected);
  };

  const updateSkillConfig = (skillId: string, updates: Partial<any>) => {
    const newSelected = new Map(selectedSkills);
    const existing = newSelected.get(skillId);
    if (existing) {
      newSelected.set(skillId, { ...existing, ...updates });
      setSelectedSkills(newSelected);
    }
  };

  const toggleSeniority = (skillId: string, seniority: string) => {
    const existing = selectedSkills.get(skillId);
    if (existing) {
      const currentSeniorities = existing.requiredSeniority || [];
      const newSeniorities = currentSeniorities.includes(seniority)
        ? currentSeniorities.filter((s: string) => s !== seniority)
        : [...currentSeniorities, seniority];
      updateSkillConfig(skillId, { requiredSeniority: newSeniorities });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const assignments = Array.from(selectedSkills.values());
    await onSave(assignments);
    setSaving(false);
  };

  const seniorityLevels: SeniorityLevel[] = ['Partner', 'Director', 'Associate Director', 'Manager', 'Assistant Manager', 'Senior', 'Junior', 'Admin'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Skills for {service.name}</DialogTitle>
          <DialogDescription>
            Select which skills are required for this service and configure their requirements
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 sticky top-0 bg-white z-10 pb-4">
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              {selectedSkills.size} selected
            </div>
          </div>

          {/* Skills List */}
          <div className="space-y-2">
            {filteredSkills.map(skill => {
              const isSelected = selectedSkills.has(skill.id);
              const config = selectedSkills.get(skill.id);

              return (
                <div key={skill.id} className="border rounded-lg p-4">
                  {/* Skill Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSkill(skill)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                        <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                      </div>
                      {skill.description && (
                        <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                      )}

                      {/* Configuration (only show if selected) */}
                      {isSelected && config && (
                        <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <Label className="text-xs">Minimum Level</Label>
                            <Select
                              value={String(config.minimumLevel)}
                              onValueChange={(v) => updateSkillConfig(skill.id, { minimumLevel: Number(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5].map(l => (
                                  <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Ideal Level</Label>
                            <Select
                              value={String(config.idealLevel)}
                              onValueChange={(v) => updateSkillConfig(skill.id, { idealLevel: Number(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5].map(l => (
                                  <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={config.isCritical}
                                onChange={(e) => updateSkillConfig(skill.id, { isCritical: e.target.checked })}
                              />
                              <Label className="text-xs font-semibold text-red-600">Critical Skill (must-have)</Label>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs mb-2 block">Required Seniority Levels</Label>
                            <div className="flex flex-wrap gap-2">
                              {seniorityLevels.map(level => (
                                <label key={level} className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(config.requiredSeniority || []).includes(level)}
                                    onChange={() => toggleSeniority(skill.id, level)}
                                  />
                                  {level}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : `Save ${selectedSkills.size} Skills`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Role Skills Dialog Component
interface EditRoleSkillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: ServiceDeliveryRole;
  allSkills: any[];
  onSave: (assignments: Array<{
    skill_id: string;
    minimum_level: number;
    ideal_level: number;
    is_critical: boolean;
  }>) => Promise<void>;
}

const EditRoleSkillsDialog: React.FC<EditRoleSkillsDialogProps> = ({
  isOpen,
  onClose,
  role,
  allSkills,
  onSave
}) => {
  const [selectedSkills, setSelectedSkills] = useState<Map<string, any>>(new Map());
  const [roleSkills, setRoleSkills] = useState<DeliveryRoleSkill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load current role skills when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const loadRoleSkills = async () => {
      try {
        setLoading(true);
        const skills = await getDeliveryRoleSkills(role.id);
        setRoleSkills(skills);

        const initialSkills = new Map();
        skills.forEach(skill => {
          initialSkills.set(skill.skill_id, {
            skillId: skill.skill_id,
            skillName: skill.skill?.name || '',
            minimumLevel: skill.minimum_level,
            idealLevel: skill.ideal_level,
            isCritical: skill.is_critical,
          });
        });
        setSelectedSkills(initialSkills);
      } catch (error) {
        console.error('Error loading role skills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoleSkills();
  }, [isOpen, role.id]);

  const categories = ['all', ...Array.from(new Set(allSkills.map(s => s.category)))];

  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSkill = (skill: any) => {
    const newSelected = new Map(selectedSkills);
    if (newSelected.has(skill.id)) {
      newSelected.delete(skill.id);
    } else {
      newSelected.set(skill.id, {
        skillId: skill.id,
        skillName: skill.name,
        minimumLevel: 3,
        idealLevel: 4,
        isCritical: false,
      });
    }
    setSelectedSkills(newSelected);
  };

  const updateSkillConfig = (skillId: string, updates: Partial<any>) => {
    const newSelected = new Map(selectedSkills);
    const existing = newSelected.get(skillId);
    if (existing) {
      newSelected.set(skillId, { ...existing, ...updates });
      setSelectedSkills(newSelected);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const assignments = Array.from(selectedSkills.values()).map(s => ({
      skill_id: s.skillId,
      minimum_level: s.minimumLevel,
      ideal_level: s.idealLevel,
      is_critical: s.isCritical,
    }));
    await onSave(assignments);
    setSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Skills for {role.seniority} Role</DialogTitle>
          <DialogDescription>
            Assign skills that {role.seniority} level team members need for this service
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading role skills...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4 sticky top-0 bg-white z-10 pb-4">
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600 flex items-center">
                {selectedSkills.size} selected
              </div>
            </div>

            {/* Skills List */}
            <div className="space-y-2">
              {filteredSkills.map(skill => {
                const isSelected = selectedSkills.has(skill.id);
                const config = selectedSkills.get(skill.id);

                return (
                  <div key={skill.id} className="border rounded-lg p-3">
                    {/* Skill Checkbox */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSkill(skill)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
                        )}

                        {/* Configuration (only show if selected) */}
                        {isSelected && config && (
                          <div className="mt-2 grid grid-cols-3 gap-3 pt-2 border-t">
                            <div>
                              <Label className="text-xs">Minimum Level</Label>
                              <Select
                                value={String(config.minimumLevel)}
                                onValueChange={(v) => updateSkillConfig(skill.id, { minimumLevel: Number(v) })}
                              >
                                <SelectTrigger className="mt-1 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5].map(l => (
                                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Ideal Level</Label>
                              <Select
                                value={String(config.idealLevel)}
                                onValueChange={(v) => updateSkillConfig(skill.id, { idealLevel: Number(v) })}
                              >
                                <SelectTrigger className="mt-1 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5].map(l => (
                                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={config.isCritical}
                                  onChange={(e) => updateSkillConfig(skill.id, { isCritical: e.target.checked })}
                                />
                                <span className="font-semibold text-red-600">Critical</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : `Save ${selectedSkills.size} Skills`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Create Engagement Dialog Component
interface CreateEngagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  practiceId: string;
  onSuccess: () => Promise<void>;
}

const CreateEngagementDialog: React.FC<CreateEngagementDialogProps> = ({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  practiceId,
  onSuccess
}) => {
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientName.trim()) {
      alert('Please enter a client name');
      return;
    }

    try {
      setSaving(true);
      await createWorkflowInstance(
        practiceId,
        serviceId,
        clientName,
        startDate || undefined,
        targetDate || undefined,
        notes || undefined
      );
      await onSuccess();
      // Reset form
      setClientName('');
      setStartDate('');
      setTargetDate('');
      setNotes('');
    } catch (error) {
      console.error('Error creating engagement:', error);
      alert('Failed to create engagement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">New Client Engagement</DialogTitle>
          <DialogDescription>
            Create a new engagement for {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="client-name">Client Name *</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="target-date">Target Completion</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Project scope, special requirements, etc."
              rows={4}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Engagement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Assign Team Dialog Component
interface AssignTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  instance: WorkflowInstance;
  teamMembers: any[];
  deliveryRoles: ServiceDeliveryRole[];
  onSuccess: () => Promise<void>;
}

const AssignTeamDialog: React.FC<AssignTeamDialogProps> = ({
  isOpen,
  onClose,
  instance,
  teamMembers,
  deliveryRoles,
  onSuccess
}) => {
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map()); // role -> memberId
  const [hours, setHours] = useState<Map<string, number>>(new Map()); // role -> hours
  const [saving, setSaving] = useState(false);

  // Load existing assignments when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const loadAssignments = async () => {
      try {
        const { assignments: existingAssignments } = await getWorkflowInstance(instance.id);
        const assignmentMap = new Map();
        const hoursMap = new Map();
        
        existingAssignments.forEach(a => {
          assignmentMap.set(a.role_seniority, a.practice_member_id);
          if (a.estimated_hours) {
            hoursMap.set(a.role_seniority, a.estimated_hours);
          }
        });
        
        setAssignments(assignmentMap);
        setHours(hoursMap);
      } catch (error) {
        console.error('Error loading assignments:', error);
      }
    };

    loadAssignments();
  }, [isOpen, instance.id]);

  const handleAssign = (role: string, memberId: string) => {
    const newAssignments = new Map(assignments);
    if (memberId) {
      newAssignments.set(role, memberId);
    } else {
      newAssignments.delete(role);
    }
    setAssignments(newAssignments);
  };

  const handleHours = (role: string, hrs: number) => {
    const newHours = new Map(hours);
    newHours.set(role, hrs);
    setHours(newHours);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Assign each team member
      for (const [role, memberId] of assignments.entries()) {
        await assignTeamMember(
          instance.id,
          memberId,
          role,
          hours.get(role) || undefined
        );
      }
      
      await onSuccess();
    } catch (error) {
      console.error('Error assigning team:', error);
      alert('Failed to assign team. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Assign Team to {instance.client_name}</DialogTitle>
          <DialogDescription>
            Select team members for each role in this engagement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {deliveryRoles.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No delivery roles defined. Please set up delivery team structure first.
            </p>
          ) : (
            deliveryRoles.map((role) => {
              const eligibleMembers = teamMembers.filter(m => m.role === role.seniority);
              const assignedMemberId = assignments.get(role.seniority);
              
              return (
                <div key={role.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">{role.seniority}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Assign Team Member</Label>
                      <Select
                        value={assignedMemberId || 'none'}
                        onValueChange={(value) => handleAssign(role.seniority, value === 'none' ? '' : value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select member..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {eligibleMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {eligibleMembers.length === 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          No {role.seniority} level members available
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs">Estimated Hours</Label>
                      <Input
                        type="number"
                        value={hours.get(role.seniority) || role.estimated_hours || ''}
                        onChange={(e) => handleHours(role.seniority, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || deliveryRoles.length === 0}>
            {saving ? 'Assigning...' : `Assign ${assignments.size} Team Members`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Role Dialog Component
interface EditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: ServiceDeliveryRole;
  serviceId: string;
  practiceId: string;
  onSuccess: () => Promise<void>;
}

const EditRoleDialog: React.FC<EditRoleDialogProps> = ({
  isOpen,
  onClose,
  role,
  serviceId,
  practiceId,
  onSuccess
}) => {
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [hours, setHours] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResponsibilities(role.responsibilities || []);
      setHours(role.estimated_hours || 0);
      setNotes(role.notes || '');
    }
  }, [isOpen, role]);

  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, '']);
  };

  const handleUpdateResponsibility = (index: number, value: string) => {
    const newResp = [...responsibilities];
    newResp[index] = value;
    setResponsibilities(newResp);
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await upsertDeliveryRole(
        practiceId,
        serviceId,
        role.seniority,
        responsibilities.filter(r => r.trim()),
        hours || undefined,
        role.display_order
      );
      await onSuccess();
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Failed to save role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${role.seniority} role? This will remove all skill assignments for this role.`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDeliveryRole(role.id);
      await onSuccess();
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit {role.seniority} Role</DialogTitle>
          <DialogDescription>
            Modify responsibilities and estimated hours for this delivery role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Estimated Hours</Label>
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
              min="0"
              step="0.5"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Responsibilities</Label>
              <Button
                onClick={handleAddResponsibility}
                variant="outline"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => handleUpdateResponsibility(index, e.target.value)}
                    placeholder="Enter responsibility..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleRemoveResponsibility(index)}
                    variant="outline"
                    size="sm"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this role..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={saving || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Role'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailPage;

