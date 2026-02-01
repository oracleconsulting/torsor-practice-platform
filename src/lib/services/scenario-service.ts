/**
 * Scenario Service - Save and load client scenarios
 */

import { supabase } from '../supabase';
import type { ScenarioResult, ScenarioType } from '../scenario-calculator';

export interface SavedScenario {
  id: string;
  engagementId: string;
  scenarioType: ScenarioType;
  scenarioName: string | null;
  inputs: Record<string, any>;
  outputs: {
    primaryImpact: number;
    businessValueImpact: number;
    summary: string;
  };
  isDefault: boolean;
  isStarred: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenarioInput {
  engagementId: string;
  clientId?: string;
  practiceId?: string;
  scenarioType: ScenarioType;
  scenarioName?: string;
  inputs: Record<string, any>;
  result: ScenarioResult;
  notes?: string;
}

/**
 * Save a scenario to the database
 */
export async function saveScenario(input: CreateScenarioInput): Promise<SavedScenario | null> {
  try {
    const { data, error } = await supabase
      .from('bm_client_scenarios')
      .insert({
        engagement_id: input.engagementId,
        client_id: input.clientId,
        practice_id: input.practiceId,
        scenario_type: input.scenarioType,
        scenario_name: input.scenarioName || generateScenarioName(input.scenarioType, input.inputs),
        inputs: input.inputs,
        outputs: {
          primaryImpact: input.result.primaryMetric.delta,
          businessValueImpact: input.result.businessValueImpact,
          summary: input.result.summary,
          secondaryMetrics: input.result.secondaryMetrics,
          howToAchieve: input.result.howToAchieve,
        },
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[ScenarioService] Error saving scenario:', error);
      return null;
    }

    return transformDbScenario(data);
  } catch (err) {
    console.error('[ScenarioService] Error:', err);
    return null;
  }
}

/**
 * Get all scenarios for an engagement
 */
export async function getEngagementScenarios(engagementId: string): Promise<SavedScenario[]> {
  try {
    const { data, error } = await supabase
      .from('bm_client_scenarios')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ScenarioService] Error fetching scenarios:', error);
      return [];
    }

    return (data || []).map(transformDbScenario);
  } catch (err) {
    console.error('[ScenarioService] Error:', err);
    return [];
  }
}

/**
 * Get scenarios by type for an engagement
 */
export async function getScenariosByType(
  engagementId: string, 
  scenarioType: ScenarioType
): Promise<SavedScenario[]> {
  try {
    const { data, error } = await supabase
      .from('bm_client_scenarios')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('scenario_type', scenarioType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ScenarioService] Error fetching scenarios:', error);
      return [];
    }

    return (data || []).map(transformDbScenario);
  } catch (err) {
    console.error('[ScenarioService] Error:', err);
    return [];
  }
}

/**
 * Get starred scenarios for an engagement
 */
export async function getStarredScenarios(engagementId: string): Promise<SavedScenario[]> {
  try {
    const { data, error } = await supabase
      .from('bm_client_scenarios')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_starred', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[ScenarioService] Error fetching starred scenarios:', error);
      return [];
    }

    return (data || []).map(transformDbScenario);
  } catch (err) {
    console.error('[ScenarioService] Error:', err);
    return [];
  }
}

/**
 * Toggle starred status of a scenario
 */
export async function toggleScenarioStar(scenarioId: string): Promise<boolean> {
  try {
    // Get current status
    const { data: current } = await supabase
      .from('bm_client_scenarios')
      .select('is_starred')
      .eq('id', scenarioId)
      .single();

    if (!current) return false;

    // Toggle it
    const { error } = await supabase
      .from('bm_client_scenarios')
      .update({ is_starred: !current.is_starred })
      .eq('id', scenarioId);

    return !error;
  } catch (err) {
    console.error('[ScenarioService] Error toggling star:', err);
    return false;
  }
}

/**
 * Update scenario notes
 */
export async function updateScenarioNotes(scenarioId: string, notes: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bm_client_scenarios')
      .update({ notes })
      .eq('id', scenarioId);

    return !error;
  } catch (err) {
    console.error('[ScenarioService] Error updating notes:', err);
    return false;
  }
}

/**
 * Update scenario name
 */
export async function updateScenarioName(scenarioId: string, name: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bm_client_scenarios')
      .update({ scenario_name: name })
      .eq('id', scenarioId);

    return !error;
  } catch (err) {
    console.error('[ScenarioService] Error updating name:', err);
    return false;
  }
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bm_client_scenarios')
      .delete()
      .eq('id', scenarioId);

    return !error;
  } catch (err) {
    console.error('[ScenarioService] Error deleting scenario:', err);
    return false;
  }
}

/**
 * Get scenario summary for an engagement
 */
export async function getScenariosSummary(engagementId: string): Promise<{
  totalScenarios: number;
  byType: Record<ScenarioType, number>;
  totalPotentialImpact: number;
  starredCount: number;
}> {
  try {
    const scenarios = await getEngagementScenarios(engagementId);
    
    const byType: Record<string, number> = {};
    let totalImpact = 0;
    let starredCount = 0;

    for (const scenario of scenarios) {
      byType[scenario.scenarioType] = (byType[scenario.scenarioType] || 0) + 1;
      totalImpact = Math.max(totalImpact, scenario.outputs.businessValueImpact || 0);
      if (scenario.isStarred) starredCount++;
    }

    return {
      totalScenarios: scenarios.length,
      byType: byType as Record<ScenarioType, number>,
      totalPotentialImpact: totalImpact,
      starredCount,
    };
  } catch (err) {
    console.error('[ScenarioService] Error getting summary:', err);
    return {
      totalScenarios: 0,
      byType: {} as Record<ScenarioType, number>,
      totalPotentialImpact: 0,
      starredCount: 0,
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function transformDbScenario(db: any): SavedScenario {
  return {
    id: db.id,
    engagementId: db.engagement_id,
    scenarioType: db.scenario_type as ScenarioType,
    scenarioName: db.scenario_name,
    inputs: db.inputs || {},
    outputs: db.outputs || { primaryImpact: 0, businessValueImpact: 0, summary: '' },
    isDefault: db.is_default || false,
    isStarred: db.is_starred || false,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function generateScenarioName(type: ScenarioType, inputs: Record<string, any>): string {
  const timestamp = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short' 
  });
  
  switch (type) {
    case 'margin':
      return `Margin to ${inputs.targetGrossMargin?.toFixed(1) || '?'}% (${timestamp})`;
    case 'pricing':
      return `+${inputs.rateIncrease || '?'}% Rate Increase (${timestamp})`;
    case 'cash':
      return `Debtor Days to ${inputs.targetDebtorDays || '?'} (${timestamp})`;
    case 'efficiency':
      return `RPE to £${Math.round((inputs.targetRevenuePerEmployee || 0) / 1000)}k (${timestamp})`;
    case 'diversification':
      return `Concentration to ${inputs.targetConcentration || '?'}% (${timestamp})`;
    case 'exit':
      return `Exit at ${inputs.targetMultiple || '5'}x Multiple (${timestamp})`;
    default:
      return `Scenario (${timestamp})`;
  }
}

/**
 * Format scenario for comparison display
 */
export function formatScenarioComparison(scenarios: SavedScenario[]): {
  headers: string[];
  rows: Array<{
    metric: string;
    values: Array<{ value: string; isHighlight: boolean }>;
  }>;
} {
  if (scenarios.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = scenarios.map(s => s.scenarioName || s.scenarioType);
  
  const rows = [
    {
      metric: 'Primary Impact',
      values: scenarios.map(s => ({
        value: formatCurrency(s.outputs.primaryImpact),
        isHighlight: s.outputs.primaryImpact === Math.max(...scenarios.map(x => x.outputs.primaryImpact)),
      })),
    },
    {
      metric: 'Business Value Impact',
      values: scenarios.map(s => ({
        value: formatCurrency(s.outputs.businessValueImpact),
        isHighlight: s.outputs.businessValueImpact === Math.max(...scenarios.map(x => x.outputs.businessValueImpact)),
      })),
    },
  ];

  return { headers, rows };
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `£${Math.round(value / 1000)}k`;
  return `£${value.toFixed(0)}`;
}

