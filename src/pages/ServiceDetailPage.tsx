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
import { WorkflowBuilder } from '../components/workflows/WorkflowBuilder';
import { WorkflowExecutionList } from '../components/workflows/WorkflowExecutionList';
import { WorkflowExecutor } from '../components/workflows/WorkflowExecutor';
import { getTemplateByServiceType } from '../data/workflowTemplates';
import type { Database } from '../lib/supabase/types';

type Workflow = Database['public']['Tables']['workflows']['Row'];
type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Row'];

interface ServiceDetailPageProps {}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const practiceId = practice?.id;

  // State
  const [service, setService] = useState<any>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isExecutorOpen, setIsExecutorOpen] = useState(false);
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

      // Load service from localStorage (or could be from Supabase later)
      const allServices = loadAllServices();
      const foundService = allServices.find(s => s.id === serviceId);
      setService(foundService);

      if (!foundService) {
        console.error('Service not found');
        return;
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

  const loadAllServices = () => {
    // Load from localStorage (same logic as AdvisoryServices page)
    const customServices = localStorage.getItem(`custom-services-${practiceId}`);
    const defaultServices = getDefaultServices();
    
    if (customServices) {
      return [...defaultServices, ...JSON.parse(customServices)];
    }
    return defaultServices;
  };

  const getDefaultServices = () => {
    // Same default services as in AdvisoryServices.tsx
    return [
      {
        id: 'automation',
        name: 'Automation',
        description: 'Data capture, system integration, and finance automation',
        iconName: 'BriefcaseIcon',
        basePrice: '£115-£180/hour + setup',
        deliveryTime: 'Half-day to multi-day',
        deliveredBy: 'Technical team with system integration expertise',
        aims: 'Automate finance processes to save time, reduce errors, and improve efficiency',
        tier: 'all',
        features: [
          'Data capture: scan invoices & receipts to electronic format',
          'System integration: auto-upload to data entry software',
          'Bank feed setup and troubleshooting',
          'AI-driven categorisation rules',
          'Chart of accounts setup',
          'Link bookkeeping to analytics (Xero → Spotlight/Syft)',
          'Dashboard setup for monitoring',
          'Management accounts production',
          'Forecasting and cashflow facilitation'
        ]
      },
      {
        id: 'management-accounts',
        name: 'Management Accounts',
        description: 'Regular financial reporting with KPI analysis and insights',
        iconName: 'ChartBarIcon',
        basePrice: '£650/month or £1,750/quarter',
        deliveryTime: 'Monthly or quarterly',
        deliveredBy: 'Senior accountants with analytical expertise',
        aims: 'Provide reliable financial information throughout the year for better decision-making',
        tier: 'all',
        features: [
          'Completed on suitable software package',
          'Data check for year-end compatibility',
          'Monthly, quarterly, or adhoc frequency',
          'KPI commentary and key findings',
          'Cash flow waterfall analysis',
          'Spotlight-derived position and performance analysis'
        ]
      },
      {
        id: 'advisory-accelerator',
        name: 'Future Financial Information / Advisory Accelerator',
        description: 'Budgets, forecasts, valuations, and ongoing advisory support',
        iconName: 'ArrowTrendingUpIcon',
        basePrice: '£1,000-£9,000 depending on scope',
        deliveryTime: 'One-off or recurring',
        deliveredBy: 'Senior advisors and partners',
        aims: 'Strategic planning and future-focused financial insights',
        tier: 'all',
        features: [
          'Budgets and forecasts',
          'Business valuations',
          'Ongoing advisory support',
          'Strategic planning assistance'
        ]
      },
      {
        id: 'benchmarking',
        name: 'Benchmarking',
        description: 'Compare performance against industry peers',
        iconName: 'ChartBarIcon',
        basePrice: '£450-£1,500',
        deliveryTime: '2-3 days',
        deliveredBy: 'Analysts with industry expertise',
        aims: 'Understand competitive position and identify improvement opportunities',
        tier: 'all',
        features: [
          'Industry comparison analysis',
          'Performance metrics benchmarking',
          'Competitive positioning insights'
        ]
      },
      {
        id: 'restructuring',
        name: 'Restructuring & Turnaround',
        description: 'Financial recovery and business restructuring advisory',
        iconName: 'ScaleIcon',
        basePrice: '£2,000-£10,000+ depending on complexity',
        deliveryTime: 'Ongoing project-based',
        deliveredBy: 'Partners with restructuring expertise',
        aims: 'Navigate financial challenges and restore business health',
        tier: 'professional',
        features: [
          'Cash flow crisis management',
          'Debt restructuring negotiations',
          'Business turnaround planning'
        ]
      },
      {
        id: 'fractional-cfo',
        name: 'Fractional CFO',
        description: 'Part-time CFO services for strategic financial leadership',
        iconName: 'UserGroupIcon',
        basePrice: '£2,000-£5,000/month',
        deliveryTime: 'Ongoing retainer',
        deliveredBy: 'Experienced CFOs and senior partners',
        aims: 'Provide strategic financial leadership without full-time CFO cost',
        tier: 'professional',
        features: [
          'Strategic financial planning',
          'Board-level financial reporting',
          'Financial system optimization'
        ]
      },
      {
        id: 'systems-audit',
        name: 'Systems Audit',
        description: 'Comprehensive review of financial systems and processes',
        iconName: 'Cog6ToothIcon',
        basePrice: 'TBD',
        deliveryTime: 'Coming Soon',
        deliveredBy: 'Systems specialists',
        aims: 'Identify system inefficiencies and improvement opportunities',
        tier: 'enterprise',
        features: [
          'System architecture review',
          'Process efficiency analysis',
          'Integration assessment'
        ]
      }
    ];
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            <p className="mt-2 text-gray-600">{service.description}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-gray-500">Price: <strong className="text-gray-900">{service.basePrice}</strong></span>
              <span className="text-gray-500">Delivery: <strong className="text-gray-900">{service.deliveryTime}</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
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
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions ({executions.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

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
    </div>
  );
};

export default ServiceDetailPage;

