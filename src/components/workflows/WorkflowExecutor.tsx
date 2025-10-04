import React, { useState } from 'react';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { executeWorkflow } from '../../services/workflowExecutionEngine';
import type { Database } from '../../lib/supabase/types';

type Workflow = Database['public']['Tables']['workflows']['Row'];

interface WorkflowExecutorProps {
  workflow: Workflow;
  practiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onExecutionComplete?: (executionId: string) => void;
}

interface InputField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'json';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
}

export const WorkflowExecutor: React.FC<WorkflowExecutorProps> = ({
  workflow,
  practiceId,
  isOpen,
  onClose,
  onExecutionComplete
}) => {
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Input fields
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [additionalData, setAdditionalData] = useState('{}');

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Parse additional data if provided
      let inputData: any = {};
      if (additionalData.trim()) {
        try {
          inputData = JSON.parse(additionalData);
        } catch (e) {
          throw new Error('Invalid JSON in additional data');
        }
      }

      // Add client name to input data
      if (clientName) {
        inputData.client_name = clientName;
      }

      // Execute workflow
      const result = await executeWorkflow({
        workflowId: workflow.id,
        practiceId,
        clientId: clientId || undefined,
        clientName: clientName || undefined,
        inputData,
        executedBy: undefined // Will be set by auth context in the service
      });

      if (!result.success) {
        throw new Error(result.error || 'Execution failed');
      }

      setSuccess(true);
      setProgress(100);

      // Call completion callback
      if (onExecutionComplete && result.executionId) {
        onExecutionComplete(result.executionId);
      }

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('[WorkflowExecutor] Error:', err);
      setError(err.message || 'Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    if (!executing) {
      setClientName('');
      setClientId('');
      setAdditionalData('{}');
      setError(null);
      setSuccess(false);
      setProgress(0);
      onClose();
    }
  };

  const isFormValid = clientName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayIcon className="w-5 h-5" />
            Execute Workflow: {workflow.name}
          </DialogTitle>
          <DialogDescription>
            {workflow.description || 'Configure and run this workflow for a client'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  disabled={executing}
                />
              </div>

              <div>
                <Label htmlFor="client-id">Client ID (Optional)</Label>
                <Input
                  id="client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter client ID if available"
                  disabled={executing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Input Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Input Data (JSON)</CardTitle>
              <CardDescription>
                Provide any additional data the workflow might need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
                placeholder='{"revenue": 500000, "employees": 25, "industry": "Professional Services"}'
                rows={6}
                disabled={executing}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: {`{"revenue": 500000, "employees": 25}`}
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          {executing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Executing workflow...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    This may take a few moments depending on the workflow complexity
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {success && (
            <Alert>
              <AlertDescription className="text-green-800">
                ✅ Workflow executed successfully! Check the execution history for results.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={executing}
          >
            {success ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!isFormValid || executing}
          >
            {executing ? (
              <>
                <StopIcon className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-2" />
                Execute Workflow
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

