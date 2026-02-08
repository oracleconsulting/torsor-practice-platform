/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
// ============================================================================
// LLM COST TRACKER
// ============================================================================
// Utility for tracking LLM usage and costs across all Edge Functions
// ============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * LLM usage data for a single API call
 */
export interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  executionTimeMs: number;
}

/**
 * Model pricing configuration (USD per 1M tokens)
 */
interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

/**
 * Pricing table for all models
 * Updated: December 2025
 */
const PRICING: Record<string, ModelPricing> = {
  // Premium tier
  'anthropic/claude-opus-4': { inputPer1M: 15.00, outputPer1M: 75.00 },
  
  // Standard tier
  'anthropic/claude-sonnet-4-20250514': { inputPer1M: 3.00, outputPer1M: 15.00 },
  'anthropic/claude-3.5-sonnet': { inputPer1M: 3.00, outputPer1M: 15.00 },
  
  // Fast tier
  'anthropic/claude-3.5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4.00 },
  'anthropic/claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25 },
  
  // Research tier
  'perplexity/sonar-pro': { inputPer1M: 3.00, outputPer1M: 15.00 },
  
  // Embeddings
  'openai/text-embedding-3-small': { inputPer1M: 0.02, outputPer1M: 0 }
};

/**
 * Calculate the cost of an LLM API call in USD
 */
export function calculateCost(usage: LLMUsage): number {
  const pricing = PRICING[usage.model];
  if (!pricing) {
    console.warn(`Unknown model pricing: ${usage.model}`);
    return 0;
  }
  
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;
  
  return inputCost + outputCost;
}

/**
 * Full execution tracking data
 */
export interface LLMExecutionRecord extends LLMUsage {
  functionName: string;
  entityType: string;
  entityId: string;
  success: boolean;
  error?: string;
}

/**
 * Track an LLM execution in the database
 * Creates a record in llm_execution_history for cost monitoring and debugging
 */
export async function trackLLMExecution(
  supabase: SupabaseClient,
  record: LLMExecutionRecord
): Promise<void> {
  const cost = calculateCost(record);
  
  try {
    const { error } = await supabase.from('llm_execution_history').insert({
      function_name: record.functionName,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      cost_usd: cost,
      execution_time_ms: record.executionTimeMs,
      entity_type: record.entityType,
      entity_id: record.entityId,
      success: record.success,
      error_message: record.error,
      created_at: new Date().toISOString()
    });
    
    if (error) {
      // Log but don't throw - tracking should not break the main flow
      console.warn('Failed to track LLM execution:', error);
    }
  } catch (e) {
    console.warn('Error tracking LLM execution:', e);
  }
}

/**
 * Helper to time an async operation and track it
 */
export async function withTracking<T>(
  supabase: SupabaseClient,
  functionName: string,
  entityType: string,
  entityId: string,
  model: string,
  operation: () => Promise<{ result: T; inputTokens: number; outputTokens: number }>
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;
  let result: T;
  
  try {
    const response = await operation();
    result = response.result;
    inputTokens = response.inputTokens;
    outputTokens = response.outputTokens;
  } catch (e) {
    success = false;
    errorMessage = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    const executionTimeMs = Date.now() - startTime;
    
    await trackLLMExecution(supabase, {
      functionName,
      model,
      inputTokens,
      outputTokens,
      executionTimeMs,
      entityType,
      entityId,
      success,
      error: errorMessage
    });
  }
  
  return result!;
}

/**
 * Extract token usage from OpenRouter response
 */
export function extractUsageFromResponse(response: any): { inputTokens: number; outputTokens: number } {
  const usage = response?.usage || {};
  return {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0
  };
}

/**
 * Format cost for display (USD)
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${(costUsd * 100).toFixed(3)}¢`;
  }
  return `$${costUsd.toFixed(4)}`;
}

/**
 * Estimate cost before making a call (for budgeting/rate limiting)
 */
export function estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
  const pricing = PRICING[model];
  if (!pricing) {
    return 0;
  }
  
  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.outputPer1M;
  
  return inputCost + outputCost;
}
