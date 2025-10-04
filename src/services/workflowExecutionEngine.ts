/**
 * Workflow Execution Engine
 * Executes workflows step by step with support for branching, conditions, and LLM steps
 */

import { supabase } from '../lib/supabase/client';
import { executeLLMStep } from './openRouterService';
import type { Database } from '../lib/supabase/types';

type Workflow = Database['public']['Tables']['workflows']['Row'];
type WorkflowStep = Database['public']['Tables']['workflow_steps']['Row'];
type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Insert'];
type StepExecution = Database['public']['Tables']['step_executions']['Insert'];

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  practiceId: string;
  clientId?: string;
  clientName?: string;
  inputData: Record<string, any>;
  stepOutputs: Record<string, any>; // stepId -> output
  variables: Record<string, any>; // Global variables available to all steps
}

interface StepExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  tokens?: number;
  cost?: number;
  model?: string;
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  console.log(`[Workflow] Executing step: ${step.name} (${step.step_type})`);

  try {
    switch (step.step_type) {
      case 'llm':
        return await executeLLMStepType(step, context);

      case 'conditional':
        return await executeConditionalStep(step, context);

      case 'transform':
        return await executeTransformStep(step, context);

      case 'user_input':
        return await executeUserInputStep(step, context);

      case 'api_call':
        return await executeAPICallStep(step, context);

      default:
        return {
          success: false,
          output: null,
          error: `Unknown step type: ${step.step_type}`
        };
    }
  } catch (error: any) {
    console.error(`[Workflow] Error in step ${step.name}:`, error);
    return {
      success: false,
      output: null,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Execute LLM step type
 */
async function executeLLMStepType(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  const config = step.config as any;

  if (!config.model || !config.prompt) {
    return {
      success: false,
      output: null,
      error: 'LLM step missing model or prompt configuration'
    };
  }

  // Build variables for prompt interpolation
  const variables = {
    ...context.variables,
    ...context.inputData,
    client_name: context.clientName || 'Unknown Client',
    ...context.stepOutputs // Previous step outputs
  };

  // Add specific input variables if configured
  if (config.input_variables && Array.isArray(config.input_variables)) {
    config.input_variables.forEach((varName: string) => {
      if (!(varName in variables)) {
        console.warn(`[Workflow] Input variable '${varName}' not found in context`);
      }
    });
  }

  const result = await executeLLMStep({
    model: config.model,
    prompt: config.prompt,
    variables,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.max_tokens ?? 2000,
    systemPrompt: config.system_prompt
  });

  if (!result.success) {
    return {
      success: false,
      output: null,
      error: result.error
    };
  }

  return {
    success: true,
    output: result.output,
    tokens: result.tokens_used,
    cost: result.cost_usd,
    model: result.model
  };
}

/**
 * Execute conditional step (if/then branching)
 */
async function executeConditionalStep(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  const config = step.config as any;

  if (!config.condition) {
    return {
      success: false,
      output: null,
      error: 'Conditional step missing condition'
    };
  }

  try {
    // Build evaluation context
    const evalContext = {
      ...context.variables,
      ...context.inputData,
      ...context.stepOutputs
    };

    // Evaluate condition (simple JavaScript evaluation)
    // In production, you'd want to use a safe sandboxed evaluator
    const conditionResult = evaluateCondition(config.condition, evalContext);

    return {
      success: true,
      output: {
        conditionMet: conditionResult,
        nextStepId: conditionResult ? config.true_branch : config.false_branch
      }
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Condition evaluation failed: ${error.message}`
    };
  }
}

/**
 * Safely evaluate a condition expression
 */
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple evaluation - in production, use a proper expression evaluator
    // This is a basic implementation - you'd want to use something like json-logic-js
    const func = new Function(...Object.keys(context), `return ${condition}`);
    return Boolean(func(...Object.values(context)));
  } catch (error) {
    console.error('[Workflow] Condition evaluation error:', error);
    return false;
  }
}

/**
 * Execute data transformation step
 */
async function executeTransformStep(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  const config = step.config as any;

  if (!config.code && !config.transform_type) {
    return {
      success: false,
      output: null,
      error: 'Transform step missing code or transform_type'
    };
  }

  try {
    const input = {
      ...context.variables,
      ...context.inputData,
      previousOutputs: context.stepOutputs
    };

    let output: any;

    if (config.code) {
      // Execute custom transformation code
      // In production, use a safe sandbox
      const func = new Function('input', config.code);
      output = func(input);
    } else {
      // Execute built-in transformation
      switch (config.transform_type) {
        case 'extract':
          output = extractFields(input, config.fields || []);
          break;
        case 'format':
          output = formatData(input, config.format || {});
          break;
        case 'aggregate':
          output = aggregateData(input, config.aggregation || {});
          break;
        default:
          throw new Error(`Unknown transform type: ${config.transform_type}`);
      }
    }

    return {
      success: true,
      output
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Transformation failed: ${error.message}`
    };
  }
}

/**
 * Helper: Extract specific fields from data
 */
function extractFields(data: any, fields: string[]): any {
  const result: any = {};
  fields.forEach(field => {
    if (field in data) {
      result[field] = data[field];
    }
  });
  return result;
}

/**
 * Helper: Format data according to template
 */
function formatData(data: any, format: any): any {
  // Simple formatting - expand as needed
  return { ...data, ...format };
}

/**
 * Helper: Aggregate data
 */
function aggregateData(data: any, aggregation: any): any {
  // Simple aggregation - expand as needed
  return data;
}

/**
 * Execute user input step (returns what was provided in input)
 */
async function executeUserInputStep(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  const config = step.config as any;
  const fields = config.fields || [];

  // Extract required fields from input data
  const output: any = {};
  const missing: string[] = [];

  fields.forEach((field: any) => {
    const fieldName = typeof field === 'string' ? field : field.name;
    if (fieldName in context.inputData) {
      output[fieldName] = context.inputData[fieldName];
    } else {
      missing.push(fieldName);
    }
  });

  if (missing.length > 0) {
    return {
      success: false,
      output: null,
      error: `Missing required input fields: ${missing.join(', ')}`
    };
  }

  return {
    success: true,
    output
  };
}

/**
 * Execute API call step
 */
async function executeAPICallStep(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<StepExecutionResult> {
  const config = step.config as any;

  if (!config.url) {
    return {
      success: false,
      output: null,
      error: 'API call step missing URL'
    };
  }

  try {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body ? JSON.stringify(config.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      output: data
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `API call failed: ${error.message}`
    };
  }
}

/**
 * Execute an entire workflow
 */
export async function executeWorkflow(config: {
  workflowId: string;
  practiceId: string;
  clientId?: string;
  clientName?: string;
  inputData?: Record<string, any>;
  executedBy?: string;
}): Promise<{ success: boolean; executionId?: string; error?: string }> {
  console.log('[Workflow] Starting workflow execution:', config.workflowId);

  try {
    // 1. Load workflow and steps
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', config.workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    const { data: steps, error: stepsError } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', config.workflowId)
      .eq('is_active', true)
      .order('step_order', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      throw new Error('No active steps found for workflow');
    }

    // 2. Create workflow execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: config.workflowId,
        practice_id: config.practiceId,
        client_id: config.clientId,
        client_name: config.clientName,
        status: 'running',
        input_data: config.inputData || {},
        started_at: new Date().toISOString(),
        executed_by: config.executedBy,
        progress_percentage: 0
      })
      .select()
      .single();

    if (executionError || !execution) {
      throw new Error('Failed to create execution record');
    }

    console.log('[Workflow] Created execution:', execution.id);

    // 3. Execute steps
    const context: ExecutionContext = {
      workflowId: config.workflowId,
      executionId: execution.id,
      practiceId: config.practiceId,
      clientId: config.clientId,
      clientName: config.clientName,
      inputData: config.inputData || {},
      stepOutputs: {},
      variables: {}
    };

    const startTime = Date.now();
    let currentStepIndex = 0;

    for (const step of steps) {
      currentStepIndex++;
      const stepStartTime = Date.now();

      // Update execution progress
      const progress = Math.floor((currentStepIndex / steps.length) * 100);
      await supabase
        .from('workflow_executions')
        .update({
          progress_percentage: progress,
          current_step_id: step.id
        })
        .eq('id', execution.id);

      // Execute step
      const result = await executeStep(step, context);

      const stepEndTime = Date.now();
      const stepDuration = stepEndTime - stepStartTime;

      // Record step execution
      await supabase.from('step_executions').insert({
        workflow_execution_id: execution.id,
        step_id: step.id,
        status: result.success ? 'completed' : 'failed',
        input_data: context.inputData,
        output_data: result.output,
        error_message: result.error,
        llm_provider: result.model ? 'openrouter' : null,
        llm_model: result.model,
        tokens_used: result.tokens,
        cost_usd: result.cost,
        started_at: new Date(stepStartTime).toISOString(),
        completed_at: new Date(stepEndTime).toISOString(),
        execution_time_ms: stepDuration
      });

      if (!result.success) {
        // Step failed - mark execution as failed
        await supabase
          .from('workflow_executions')
          .update({
            status: 'failed',
            error_message: result.error,
            completed_at: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', execution.id);

        return {
          success: false,
          executionId: execution.id,
          error: result.error
        };
      }

      // Store step output for next steps
      context.stepOutputs[step.id] = result.output;
      context.variables[`step_${currentStepIndex}_output`] = result.output;
    }

    // 4. Mark execution as completed
    const totalDuration = Date.now() - startTime;
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        progress_percentage: 100,
        output_data: context.stepOutputs,
        completed_at: new Date().toISOString(),
        execution_time_ms: totalDuration
      })
      .eq('id', execution.id);

    console.log('[Workflow] Execution completed:', execution.id);

    return {
      success: true,
      executionId: execution.id
    };

  } catch (error: any) {
    console.error('[Workflow] Execution failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Cancel a running workflow execution
 */
export async function cancelWorkflowExecution(executionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workflow_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .eq('status', 'running');

    return !error;
  } catch (error) {
    console.error('[Workflow] Cancel failed:', error);
    return false;
  }
}

/**
 * Get workflow execution status
 */
export async function getWorkflowExecutionStatus(executionId: string) {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*, step_executions(*)')
    .eq('id', executionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

