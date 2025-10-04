import React, { useState } from 'react';
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { supabase } from '../../lib/supabase/client';
import type { Database } from '../../lib/supabase/types';

type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Row'];
type Workflow = Database['public']['Tables']['workflows']['Row'];
type StepExecution = Database['public']['Tables']['step_executions']['Row'];

interface WorkflowExecutionListProps {
  executions: WorkflowExecution[];
  workflows: Workflow[];
  onRefresh: () => void;
}

export const WorkflowExecutionList: React.FC<WorkflowExecutionListProps> = ({
  executions,
  workflows,
  onRefresh
}) => {
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [stepExecutions, setStepExecutions] = useState<StepExecution[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewDetails = async (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setIsDetailOpen(true);
    setLoadingDetails(true);

    try {
      const { data, error } = await supabase
        .from('step_executions')
        .select('*')
        .eq('workflow_execution_id', execution.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStepExecutions(data || []);
    } catch (error) {
      console.error('Error loading step executions:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'running':
        return <PlayIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <PauseIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
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

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(4)}`;
  };

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Unknown Workflow';
  };

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No executions yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Workflow executions will appear here once you run a workflow.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {executions.map((execution) => (
          <Card key={execution.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(execution.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {getWorkflowName(execution.workflow_id)}
                      </h3>
                      {getStatusBadge(execution.status)}
                    </div>

                    {execution.client_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        Client: <strong>{execution.client_name}</strong>
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <p className="font-medium">
                          {execution.started_at
                            ? new Date(execution.started_at).toLocaleString()
                            : 'Not started'}
                        </p>
                      </div>

                      {execution.completed_at && (
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <p className="font-medium">
                            {new Date(execution.completed_at).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">
                          {formatDuration(execution.execution_time_ms)}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <p className="font-medium">{execution.progress_percentage}%</p>
                      </div>
                    </div>

                    {execution.status === 'running' && (
                      <div className="mt-3">
                        <Progress value={execution.progress_percentage} className="h-2" />
                      </div>
                    )}

                    {execution.error_message && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {execution.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleViewDetails(execution)}
                  variant="outline"
                  size="sm"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Details Dialog */}
      {selectedExecution && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Execution Details</DialogTitle>
              <DialogDescription>
                {getWorkflowName(selectedExecution.workflow_id)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="steps">Step Details ({stepExecutions.length})</TabsTrigger>
                <TabsTrigger value="input">Input Data</TabsTrigger>
                <TabsTrigger value="output">Output Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Execution Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Progress</p>
                          <p className="font-medium">{selectedExecution.progress_percentage}%</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">
                            {formatDuration(selectedExecution.execution_time_ms)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Total Cost</p>
                          <p className="font-medium">
                            {formatCost(
                              stepExecutions.reduce((sum, step) => sum + (step.cost_usd || 0), 0)
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedExecution.error_message && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Error:</strong> {selectedExecution.error_message}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                {loadingDetails ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading step details...</p>
                  </div>
                ) : stepExecutions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No step executions found
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {stepExecutions.map((stepExec, index) => (
                      <Card key={stepExec.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                              {index + 1}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">Step {index + 1}</h4>
                                {getStatusBadge(stepExec.status)}
                              </div>

                              {stepExec.llm_model && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Model: <strong>{stepExec.llm_model}</strong>
                                </p>
                              )}

                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <p className="font-medium">
                                    {formatDuration(stepExec.execution_time_ms)}
                                  </p>
                                </div>

                                {stepExec.tokens_used && (
                                  <div>
                                    <span className="text-gray-500">Tokens:</span>
                                    <p className="font-medium">{stepExec.tokens_used}</p>
                                  </div>
                                )}

                                {stepExec.cost_usd && (
                                  <div>
                                    <span className="text-gray-500">Cost:</span>
                                    <p className="font-medium">{formatCost(stepExec.cost_usd)}</p>
                                  </div>
                                )}
                              </div>

                              {stepExec.error_message && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                  {stepExec.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="input" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(selectedExecution.input_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="output" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(selectedExecution.output_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

