// =============================================================================
// LLM COST LOGGER
// =============================================================================
// Single helper every paid-LLM edge function calls to record one usage row in
// client_llm_costs. Stays silent on failure (logged via console.warn) so a
// cost-write outage never breaks user-facing functionality.
//
// Pricing constants are the OpenRouter list prices for our default models. If
// a function uses a different model, pass the actual rates explicitly via
// `inputRatePerMillion` / `outputRatePerMillion`.
// =============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface LlmCostInput {
  supabase: SupabaseClient;
  practiceId: string | null | undefined;
  clientId?: string | null;
  operationType: string;     // 'advisory_chat' | 'sprint_plan_generation' | etc.
  sourceFunction: string;    // edge fn name
  model: string;             // 'anthropic/claude-sonnet-4.5' etc.
  inputTokens: number;
  outputTokens: number;
  serviceLineCode?: string | null;
  sourceMessageId?: string | null;
  metadata?: Record<string, unknown>;
  /** Override per-million rates for non-standard models. */
  inputRatePerMillion?: number;
  outputRatePerMillion?: number;
}

/** Per-million-token rates in USD for the models we use. Update when
 *  pricing changes. */
const PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-sonnet-4.5': { input: 3, output: 15 },
  'anthropic/claude-sonnet-4.6': { input: 3, output: 15 },
  'anthropic/claude-sonnet-latest': { input: 3, output: 15 },
  'anthropic/claude-opus-4.7':    { input: 5, output: 25 },
  'anthropic/claude-opus-4.6':    { input: 5, output: 25 },
  'anthropic/claude-opus-4.5':    { input: 5, output: 25 },
  'anthropic/claude-opus-latest': { input: 5, output: 25 },
  'anthropic/claude-haiku-4.5':   { input: 1, output: 5 },
  'anthropic/claude-haiku-latest':{ input: 1, output: 5 },
  'openai/text-embedding-3-small': { input: 0.02, output: 0 },
  'openai/text-embedding-3-large': { input: 0.13, output: 0 },
};

const FALLBACK_PRICING = { input: 5, output: 25 }; // pessimistic default

export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
  inputRate?: number,
  outputRate?: number,
): number {
  const known = PRICING[model] ?? FALLBACK_PRICING;
  const inputUsd = ((inputRate ?? known.input) / 1_000_000) * Math.max(0, inputTokens);
  const outputUsd = ((outputRate ?? known.output) / 1_000_000) * Math.max(0, outputTokens);
  const totalUsd = inputUsd + outputUsd;
  // 1 USD ~ 100 pence. Round up so we never under-record.
  return Math.max(0, Math.ceil(totalUsd * 100));
}

/** Convenience: like recordLlmCost but takes a clientId only and auto-resolves
 *  the practice_id via practice_members. Use from generation edge functions
 *  that only know about the client. Silent on failure. */
export async function recordLlmCostByClient(
  input: Omit<LlmCostInput, 'practiceId'> & { clientId: string },
): Promise<string | null> {
  try {
    const { data: pm } = await input.supabase
      .from('practice_members')
      .select('practice_id')
      .eq('id', input.clientId)
      .maybeSingle();
    const practiceId = (pm as { practice_id?: string } | null)?.practice_id ?? null;
    if (!practiceId) return null;
    return recordLlmCost({ ...input, practiceId });
  } catch (err) {
    console.warn(`[recordLlmCostByClient:${input.sourceFunction}] resolve error:`, err);
    return null;
  }
}

/** Records one cost row. Returns the inserted id, or null on failure. */
export async function recordLlmCost(input: LlmCostInput): Promise<string | null> {
  const {
    supabase,
    practiceId,
    clientId = null,
    operationType,
    sourceFunction,
    model,
    inputTokens,
    outputTokens,
    serviceLineCode = null,
    sourceMessageId = null,
    metadata = {},
    inputRatePerMillion,
    outputRatePerMillion,
  } = input;

  if (!practiceId) {
    // No practice id, nothing to attribute to. Silent skip.
    return null;
  }

  const costCents = estimateCostCents(
    model,
    inputTokens,
    outputTokens,
    inputRatePerMillion,
    outputRatePerMillion,
  );

  try {
    const { data, error } = await supabase.rpc('record_llm_cost', {
      p_practice_id: practiceId,
      p_operation_type: operationType,
      p_source_function: sourceFunction,
      p_model: model,
      p_input_tokens: Math.max(0, Math.round(inputTokens || 0)),
      p_output_tokens: Math.max(0, Math.round(outputTokens || 0)),
      p_cost_cents: costCents,
      p_client_id: clientId,
      p_service_line_code: serviceLineCode,
      p_source_message_id: sourceMessageId,
      p_metadata: metadata,
    });
    if (error) {
      console.warn(`[recordLlmCost:${sourceFunction}] insert error:`, error);
      return null;
    }
    return typeof data === 'string' ? data : null;
  } catch (err) {
    console.warn(`[recordLlmCost:${sourceFunction}] exception:`, err);
    return null;
  }
}
