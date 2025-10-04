import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  SparklesIcon,
  BoltIcon,
  CodeBracketIcon,
  UserIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { Database } from '../../lib/supabase/types';

type Workflow = Database['public']['Tables']['workflows']['Row'];
type WorkflowStep = Database['public']['Tables']['workflow_steps']['Row'];
type StepType = 'llm' | 'conditional' | 'transform' | 'user_input' | 'api_call';

interface WorkflowBuilderProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
}

interface StepFormData {
  name: string;
  description: string;
  step_type: StepType;
  config: any;
  input_mapping: any;
  output_schema: any;
}

const stepTypeIcons: Record<StepType, any> = {
  llm: SparklesIcon,
  conditional: BoltIcon,
  transform: CodeBracketIcon,
  user_input: UserIcon,
  api_call: CubeIcon
};

const stepTypeLabels: Record<StepType, string> = {
  llm: 'LLM Step',
  conditional: 'Conditional',
  transform: 'Transform',
  user_input: 'User Input',
  api_call: 'API Call'
};

const openRouterModels = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4', name: 'GPT-4' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' }
];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflow, isOpen, onClose }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'test'>('builder');

  const [formData, setFormData] = useState<StepFormData>({
    name: '',
    description: '',
    step_type: 'llm',
    config: {},
    input_mapping: {},
    output_schema: {}
  });

  useEffect(() => {
    if (isOpen) {
      loadSteps();
    }
  }, [isOpen, workflow.id]);

  const loadSteps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflow.id)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error) {
      console.error('Error loading steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setFormData({
      name: '',
      description: '',
      step_type: 'llm',
      config: {
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        prompt: '',
        temperature: 0.7,
        max_tokens: 2000
      },
      input_mapping: {},
      output_schema: {}
    });
    setIsAddStepOpen(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setFormData({
      name: step.name,
      description: step.description || '',
      step_type: step.step_type,
      config: step.config,
      input_mapping: step.input_mapping,
      output_schema: step.output_schema
    });
    setIsAddStepOpen(true);
  };

  const handleSaveStep = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a step name');
      return;
    }

    try {
      if (editingStep) {
        // Update existing step
        const { error } = await supabase
          .from('workflow_steps')
          .update({
            name: formData.name,
            description: formData.description,
            step_type: formData.step_type,
            config: formData.config,
            input_mapping: formData.input_mapping,
            output_schema: formData.output_schema
          })
          .eq('id', editingStep.id);

        if (error) throw error;
      } else {
        // Create new step
        const { error } = await supabase
          .from('workflow_steps')
          .insert({
            workflow_id: workflow.id,
            step_order: steps.length + 1,
            name: formData.name,
            description: formData.description,
            step_type: formData.step_type,
            config: formData.config,
            input_mapping: formData.input_mapping,
            output_schema: formData.output_schema
          });

        if (error) throw error;
      }

      await loadSteps();
      setIsAddStepOpen(false);
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Failed to save step');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      // Reorder remaining steps
      const updatedSteps = steps.filter(s => s.id !== stepId);
      for (let i = 0; i < updatedSteps.length; i++) {
        await supabase
          .from('workflow_steps')
          .update({ step_order: i + 1 })
          .eq('id', updatedSteps[i].id);
      }

      await loadSteps();
    } catch (error) {
      console.error('Error deleting step:', error);
      alert('Failed to delete step');
    }
  };

  const handleMoveStep = async (stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    try {
      for (let i = 0; i < newSteps.length; i++) {
        await supabase
          .from('workflow_steps')
          .update({ step_order: i + 1 })
          .eq('id', newSteps[i].id);
      }

      await loadSteps();
    } catch (error) {
      console.error('Error reordering steps:', error);
      alert('Failed to reorder steps');
    }
  };

  const renderStepConfigForm = () => {
    switch (formData.step_type) {
      case 'llm':
        return (
          <div className="space-y-4">
            <div>
              <Label>LLM Provider</Label>
              <Select
                value={(formData.config.provider as string) || 'openrouter'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, provider: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Model</Label>
              <Select
                value={(formData.config.model as string) || 'anthropic/claude-3.5-sonnet'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, model: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {openRouterModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prompt Template</Label>
              <Textarea
                value={(formData.config.prompt as string) || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, prompt: e.target.value }
                })}
                placeholder="Enter your prompt template. Use {{variable_name}} for dynamic values."
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{{client_name}}`}, {`{{previous_output}}`}, etc. for dynamic values
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Temperature</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={(formData.config.temperature as number) || 0.7}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, temperature: parseFloat(e.target.value) }
                  })}
                />
              </div>

              <div>
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={(formData.config.max_tokens as number) || 2000}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, max_tokens: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Input Variables (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.config.input_variables || [], null, 2)}
                onChange={(e) => {
                  try {
                    const vars = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      config: { ...formData.config, input_variables: vars }
                    });
                  } catch {}
                }}
                placeholder='["client_data", "previous_output"]'
                rows={3}
              />
            </div>
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition Expression</Label>
              <Input
                value={(formData.config.condition as string) || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, condition: e.target.value }
                })}
                placeholder="e.g., revenue > 100000"
              />
            </div>
            <p className="text-sm text-gray-600">
              Use JavaScript expressions. Available variables: input data, previous outputs
            </p>
          </div>
        );

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <Label>Transformation Type</Label>
              <Select
                value={(formData.config.transform_type as string) || 'extract'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, transform_type: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extract">Extract Fields</SelectItem>
                  <SelectItem value="format">Format Data</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
                  <SelectItem value="custom">Custom JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Transformation Code (JavaScript)</Label>
              <Textarea
                value={(formData.config.code as string) || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, code: e.target.value }
                })}
                placeholder="return { result: input.value * 2 };"
                rows={6}
              />
            </div>
          </div>
        );

      case 'user_input':
        return (
          <div className="space-y-4">
            <div>
              <Label>Required Fields (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.config.fields || [], null, 2)}
                onChange={(e) => {
                  try {
                    const fields = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      config: { ...formData.config, fields }
                    });
                  } catch {}
                }}
                placeholder='[{"name": "client_name", "type": "text", "label": "Client Name"}]'
                rows={6}
              />
            </div>
          </div>
        );

      case 'api_call':
        return (
          <div className="space-y-4">
            <div>
              <Label>API Endpoint</Label>
              <Input
                value={(formData.config.url as string) || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, url: e.target.value }
                })}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <Label>Method</Label>
              <Select
                value={(formData.config.method as string) || 'GET'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, method: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Headers (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      config: { ...formData.config, headers }
                    });
                  } catch {}
                }}
                placeholder='{"Authorization": "Bearer TOKEN"}'
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Workflow Builder: {workflow.name}</DialogTitle>
          <DialogDescription>
            Build and configure your workflow with LLM-powered steps
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="builder">Build Steps</TabsTrigger>
            <TabsTrigger value="test">Test Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Workflow Steps ({steps.length})</h3>
                <Button onClick={handleAddStep}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : steps.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No steps yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first workflow step.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const StepIcon = stepTypeIcons[step.step_type];
                    return (
                      <Card key={step.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleMoveStep(step.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                  <ArrowUpIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleMoveStep(step.id, 'down')}
                                  disabled={index === steps.length - 1}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                  <ArrowDownIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <StepIcon className="w-5 h-5 text-gray-600" />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{step.name}</h4>
                                    {step.description && (
                                      <p className="text-sm text-gray-600">{step.description}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge>{stepTypeLabels[step.step_type]}</Badge>
                              </div>

                              {step.step_type === 'llm' && (step.config as any).model && (
                                <div className="mt-2 text-sm text-gray-500">
                                  Model: {(step.config as any).model}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditStep(step)}
                                variant="outline"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteStep(step.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <p>Workflow testing coming soon...</p>
                  <p className="text-sm mt-2">You'll be able to test your workflow with sample data here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close Builder
          </Button>
        </DialogFooter>

        {/* Add/Edit Step Dialog */}
        <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStep ? 'Edit Step' : 'Add New Step'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Step Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Analyze Client Financials"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this step does..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Step Type *</Label>
                <Select
                  value={formData.step_type}
                  onValueChange={(value: StepType) => setFormData({ ...formData, step_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm">LLM Step (AI Processing)</SelectItem>
                    <SelectItem value="conditional">Conditional (If/Then)</SelectItem>
                    <SelectItem value="transform">Transform (Data Processing)</SelectItem>
                    <SelectItem value="user_input">User Input</SelectItem>
                    <SelectItem value="api_call">API Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderStepConfigForm()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStep} disabled={!formData.name.trim()}>
                {editingStep ? 'Update Step' : 'Add Step'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

