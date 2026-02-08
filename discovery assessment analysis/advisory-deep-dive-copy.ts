/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model for analysis work
const MODEL = 'anthropic/claude-sonnet-4-20250514';

// ============================================================================
// TYPES
// ============================================================================

interface PreparedData {
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
    practiceId: string;
  };
  discovery: {
    id: string;
    responses: Record<string, any>;
    extractedAnchors: any;
    recommendedServices: any;
    destinationClarityScore?: number;
    gapScore?: number;
  };
  documents: Array<{
    fileName: string;
    dataSourceType: string;
    content: string;
    source: string;
  }>;
  documentInsights?: {
    hasProjections: boolean;
    financialProjections?: {
      projectedRevenue?: Array<{ year: number; amount: number; note?: string }>;
      projectedEBITDA?: Array<{ year: number; amount: number; marginPercent?: number }>;
      projectedGrossMargin?: Array<{ year: number; percent: number }>;
      projectedTeamSize?: Array<{ year: number; count: number }>;
      projectedCustomers?: Array<{ year: number; count: number }>;
    };
    businessContext?: {
      businessModel?: string;
      industry?: string;
      revenueModel?: string;
      keyMetrics?: string[];
      growthStrategy?: string;
    };
    extractedFacts?: string[];
    warnings?: string[];
  };
  financialContext: {
    periodType: string;
    periodEnd: string;
    revenue: number;
    grossProfit: number;
    grossMarginPct: number;
    netProfit: number;
    netMarginPct: number;
    staffCount: number;
    revenuePerHead: number;
    revenueGrowthPct: number;
  } | null;
  operationalContext: {
    businessType: string;
    industry: string;
    yearsTrading: number;
    observedStrengths: string[];
    observedChallenges: string[];
  } | null;
  patternAnalysis: {
    capitalRaisingSignals?: { detected: boolean };
    lifestyleTransformation?: { detected: boolean };
    emotionalState?: { stressLevel: string; burnoutRisk: string };
    destinationClarity?: { score: number };
  } | null;
  advisorContextNotes: Array<{
    type: string;
    title: string;
    content: string;
    eventDate: string;
    isFutureEvent: boolean;
    importance: string;
  }>;
}

interface ServiceLineMetadata {
  id: string;
  code: string;
  name: string;
  core_function: string;
  problems_addressed: string[];
  pricing: Array<{ tier: string; amount: number; frequency: string }>;
  status: string;
}

interface ServiceAdvisoryTrigger {
  id: string;
  service_code: string;
  trigger_type: 'assessment_response' | 'metric_threshold' | 'pattern_detected' | 'context_flag' | 'combination';
  trigger_spec: any;
  relevance: 'critical' | 'high' | 'medium' | 'low';
  timing: 'now' | 'within_3_months' | 'post_raise' | 'at_scale';
  rationale: string;
  client_value_template: string;
  priority: number;
  is_active: boolean;
}

interface ServiceContraindication {
  id: string;
  service_code: string;
  contraindication_type: string;
  condition_spec: any;
  severity: 'hard_block' | 'soft_warning' | 'mention_only';
  explanation: string;
  alternative_suggestion: string | null;
  is_active: boolean;
}

interface OversellingRule {
  id: string;
  rule_name: string;
  applies_when: any;
  max_phase1_services: number;
  max_total_services: number | null;
  max_phase1_investment: number | null;
  priority_services: string[];
  excluded_services: string[];
  explanation: string;
  is_active: boolean;
}

interface ValueCalculation {
  id: string;
  service_code: string;
  calculation_name: string;
  required_metrics: string[];
  formula: string;
  output_template: string;
  fallback_output: string | null;
  use_when: any;
  priority: number;
  is_active: boolean;
}

interface NarrativeTemplate {
  id: string;
  service_code: string;
  template_name: string;
  use_when: any;
  hook: string;
  executive_summary_variant: string | null;
  transformation_journey_variant: string | null;
  closing_message_variant: string | null;
  priority: number;
  is_active: boolean;
}

type BusinessStage = 'pre_revenue' | 'early_revenue' | 'growth' | 'established' | 'scaling';

interface AffordabilityProfile {
  estimatedMonthlyCapacity: 'under_1k' | '1k_5k' | '5k_15k' | '15k_plus';
  cashConstrained: boolean;
  activelyRaising: boolean;
}

interface ExtractedMetrics {
  financial: {
    currentRevenue?: number;
    projectedRevenue?: Array<{ year: number; amount: number }>;
    growthMultiple?: number;
    grossMargin?: number;
    ebitdaMargin?: { year1?: number; year5?: number };
  };
  operational: {
    teamSize: { current: number; projected?: number };
    teamGrowthMultiple?: number;
    manualWorkPercentage?: number;
    founderDependencyLevel?: string;
  };
  customer?: {
    currentCustomers?: number;
    projectedCustomers?: number;
    customerGrowthMultiple?: number;
  };
  context: {
    businessStage: BusinessStage;
    capitalRaising: boolean;
    exitTimeline?: string;
    burnoutRisk: boolean;
    lifestyleTransformation: boolean;
  };
}

interface DetectedPatterns {
  capitalRaising: boolean;
  lifestyleTransformation: boolean;
  burnoutRisk: boolean;
  founderDependency: boolean;
  highGrowth: boolean;
}

interface TriggerEvaluation {
  serviceCode: string;
  triggered: boolean;
  relevance: 'critical' | 'high' | 'medium' | 'low';
  timing: 'now' | 'within_3_months' | 'post_raise' | 'at_scale';
  rationale: string;
  clientValueStatement: string;
}

interface EvaluatedService {
  serviceCode: string;
  serviceName: string;
  triggered: boolean;
  relevance: 'critical' | 'high' | 'medium' | 'low';
  timing: 'now' | 'within_3_months' | 'post_raise' | 'at_scale';
  rationale: string;
  clientValueStatement: string;
  blocked: boolean;
  warnings: string[];
  alternatives: string[];
}

interface PhasedRecommendations {
  phase1Services: EvaluatedService[];
  phase2Services: EvaluatedService[];
  phase3Services: EvaluatedService[];
  oversellingCheck: {
    rulesApplied: string[];
    servicesExcluded: string[];
    phase1Capped: boolean;
    explanation?: string;
  };
}

interface AdvisoryDeepDiveOutput {
  clientId: string;
  clientName: string;
  analysisTimestamp: string;
  modelUsed: string;
  extractedMetrics: ExtractedMetrics;
  advisoryInsights: any[];
  serviceRecommendations: {
    phase1: {
      services: string[];
      totalInvestment: number;
      timing: 'now';
      rationale: string;
    };
    phase2?: {
      services: string[];
      totalInvestment: number;
      timing: 'post_raise' | 'month_3_6';
      rationale: string;
      trigger: string;
    };
    phase3?: {
      services: string[];
      totalInvestment: number;
      timing: 'at_scale' | 'month_6_12';
      rationale: string;
      trigger: string;
    };
  };
  keyFigures: Record<string, string>;
  topNarrativeHooks: string[];
  oversellingCheck: {
    rulesApplied: string[];
    servicesExcluded: string[];
    phase1Capped: boolean;
    explanation?: string;
  };
}

// ============================================================================
// DATABASE LOADERS
// ============================================================================

async function loadServiceMetadata(supabase: any): Promise<ServiceLineMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('service_line_metadata')
      .select('*')
      .eq('status', 'ready');
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load service metadata:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading metadata:', e);
    return [];
  }
}

async function loadAdvisoryTriggers(supabase: any): Promise<ServiceAdvisoryTrigger[]> {
  try {
    const { data, error } = await supabase
      .from('service_advisory_triggers')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load triggers:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading triggers:', e);
    return [];
  }
}

async function loadContraindications(supabase: any): Promise<ServiceContraindication[]> {
  try {
    const { data, error } = await supabase
      .from('service_contraindications')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load contraindications:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading contraindications:', e);
    return [];
  }
}

async function loadOversellingRules(supabase: any): Promise<OversellingRule[]> {
  try {
    const { data, error } = await supabase
      .from('advisory_overselling_rules')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load overselling rules:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading overselling rules:', e);
    return [];
  }
}

async function loadValueCalculations(supabase: any): Promise<ValueCalculation[]> {
  try {
    const { data, error } = await supabase
      .from('service_value_calculations')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load value calculations:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading value calculations:', e);
    return [];
  }
}

async function loadNarrativeTemplates(supabase: any): Promise<NarrativeTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('service_narrative_templates')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('[AdvisoryDeepDive] Failed to load narrative templates:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('[AdvisoryDeepDive] Exception loading narrative templates:', e);
    return [];
  }
}

// ============================================================================
// CORE LOGIC FUNCTIONS
// ============================================================================

function determineBusinessStageFromData(
  revenue: number | undefined,
  responses: Record<string, any>,
  docInsights: any
): BusinessStage {
  // If we have projected Year 1 revenue from documents, use that
  if (docInsights?.hasProjections) {
    const year1Rev = docInsights.financialProjections?.projectedRevenue?.find((r: any) => r.year === 1);
    if (year1Rev) {
      revenue = year1Rev.amount;
    }
  }

  // Check for capital raising signals (changes stage interpretation)
  const isRaising = detectCapitalRaising(responses);
  
  // Revenue-based staging
  if (revenue) {
    if (revenue >= 10000000) return 'scaling';
    if (revenue >= 2000000) return 'established';
    if (revenue >= 500000) return 'growth';
    if (revenue >= 100000) return 'early_revenue';
    if (revenue > 0) return 'early_revenue'; // Any revenue = early_revenue
  }

  // If raising capital with projections, they're at least early_revenue stage
  if (isRaising && docInsights?.hasProjections) {
    return 'early_revenue';
  }

  // Check for extractedFacts that might indicate stage
  const facts = docInsights?.extractedFacts || [];
  if (facts.some((f: string) => f.toLowerCase().includes('raised') || f.toLowerCase().includes('funding'))) {
    return 'early_revenue'; // Has raised = at least early revenue
  }

  // Fall back to response signals
  const frustration = String(responses.sd_operational_frustration || '').toLowerCase();
  if (frustration.includes('mvp') || frustration.includes('launch')) {
    return 'pre_revenue';
  }

  // Default to growth if unclear but has data
  if (docInsights?.hasProjections) {
    return 'growth';
  }

  return 'pre_revenue';
}

function determineBusinessStage(preparedData: PreparedData): BusinessStage {
  const responses = preparedData.discovery.responses;
  const financial = preparedData.financialContext;
  const docInsights = preparedData.documentInsights;
  
  let revenue = financial?.revenue;
  
  return determineBusinessStageFromData(revenue, responses, docInsights);
}

function assessAffordability(
  revenue: number | undefined,
  responses: Record<string, any>,
  docInsights: any
): AffordabilityProfile {
  const isRaising = detectCapitalRaising(responses);
  const hasProjections = docInsights?.hasProjections;
  
  // Check extractedFacts for funding info
  const facts = docInsights?.extractedFacts || [];
  const hasRaisedFunding = facts.some((f: string) => 
    f.toLowerCase().includes('raised') || 
    (f.toLowerCase().includes('£') && f.toLowerCase().includes('funding'))
  );
  
  // Estimate monthly capacity
  let estimatedMonthlyCapacity: 'under_1k' | '1k_5k' | '5k_15k' | '15k_plus' = 'under_1k';
  
  if (revenue) {
    const monthlyRevenue = revenue / 12;
    // Can typically afford 5-10% of revenue on advisory
    if (monthlyRevenue > 150000) {
      estimatedMonthlyCapacity = '15k_plus';
    } else if (monthlyRevenue > 50000) {
      estimatedMonthlyCapacity = '5k_15k';
    } else if (monthlyRevenue > 8000) {
      estimatedMonthlyCapacity = '1k_5k';
    }
  } else if (isRaising || hasRaisedFunding) {
    // Raising or has raised = can afford advisory
    estimatedMonthlyCapacity = '1k_5k';
  } else if (hasProjections) {
    // Has projections = some level of sophistication
    estimatedMonthlyCapacity = '1k_5k';
  }

  console.log('[AdvisoryDeepDive] Affordability:', {
    revenue,
    activelyRaising: isRaising,
    hasRaisedFunding,
    hasProjections,
    estimatedMonthlyCapacity
  });

  return {
    estimatedMonthlyCapacity,
    cashConstrained: estimatedMonthlyCapacity === 'under_1k' && !isRaising,
    activelyRaising: isRaising
  };
}

function extractMetricsFromPreparedData(preparedData: PreparedData): ExtractedMetrics {
  const responses = preparedData.discovery?.responses || {};
  const docInsights = preparedData.documentInsights || { hasProjections: false };
  const financialContext = preparedData.financialContext;
  
  // Calculate key metrics from document insights
  let currentRevenue: number | undefined;
  let projectedRevenue: Array<{ year: number; amount: number }> | undefined;
  let growthMultiple: number | undefined;
  let teamCurrent: number | undefined;
  let teamProjected: number | undefined;
  let teamGrowthMultiple: number | undefined;
  let grossMargin: number | undefined;

  // Extract from document projections
  if (docInsights.hasProjections && docInsights.financialProjections) {
    const fp = docInsights.financialProjections;
    
    // Revenue
    if (fp.projectedRevenue?.length) {
      projectedRevenue = fp.projectedRevenue;
      const year1 = fp.projectedRevenue.find((r: any) => r.year === 1);
      const year5 = fp.projectedRevenue.find((r: any) => r.year === 5);
      
      if (year1) currentRevenue = year1.amount;
      
      if (year1 && year5 && year1.amount > 0) {
        growthMultiple = Math.round(year5.amount / year1.amount);
      }
    }
    
    // Team size
    if (fp.projectedTeamSize?.length) {
      const team1 = fp.projectedTeamSize.find((t: any) => t.year === 1);
      const team5 = fp.projectedTeamSize.find((t: any) => t.year === 5);
      
      if (team1) teamCurrent = team1.count;
      if (team5) teamProjected = team5.count;
      
      if (team1 && team5 && team1.count > 0) {
        teamGrowthMultiple = Math.round(team5.count / team1.count);
      }
    }
    
    // Gross margin
    if (fp.projectedGrossMargin?.length) {
      const gm = fp.projectedGrossMargin[0];
      if (gm) grossMargin = gm.percent / 100; // Convert to decimal
    }
  }

  // Fall back to financialContext if no document projections
  if (!currentRevenue && financialContext?.revenue) {
    currentRevenue = financialContext.revenue;
  }
  if (!grossMargin && financialContext?.grossMarginPct) {
    grossMargin = financialContext.grossMarginPct / 100;
  }
  if (!teamCurrent && financialContext?.staffCount) {
    teamCurrent = financialContext.staffCount;
  }

  console.log('[AdvisoryDeepDive] Extracted metrics:', {
    hasProjections: docInsights.hasProjections,
    currentRevenue,
    growthMultiple,
    teamCurrent,
    teamProjected,
    teamGrowthMultiple,
    grossMargin
  });

  return {
    financial: {
      currentRevenue,
      projectedRevenue,
      growthMultiple,
      grossMargin
    },
    operational: {
      teamSize: { current: teamCurrent || 1, projected: teamProjected },
      teamGrowthMultiple,
      manualWorkPercentage: extractManualWorkPercentage(responses),
      founderDependencyLevel: extractFounderDependency(responses)
    },
    customer: {
      // Extract from documents if available
    },
    context: {
      businessStage: determineBusinessStageFromData(currentRevenue, responses, docInsights),
      capitalRaising: detectCapitalRaising(responses),
      exitTimeline: extractExitTimeline(responses),
      burnoutRisk: detectBurnoutRisk(responses),
      lifestyleTransformation: detectLifestyleTransformation(responses, preparedData.discovery?.extractedAnchors)
    }
  };
}

function extractManualWorkPercentage(responses: Record<string, any>): number | undefined {
  const manual = String(responses.sd_manual_work || '').toLowerCase();
  
  if (manual.includes('over half') || manual.includes('50%') || manual.includes('more than 50')) {
    return 55;
  }
  if (manual.includes('31-50') || manual.includes('about half')) {
    return 40;
  }
  if (manual.includes('11-30')) {
    return 20;
  }
  if (manual.includes('under 10') || manual.includes('less than 10')) {
    return 5;
  }
  
  return undefined;
}

function extractFounderDependency(responses: Record<string, any>): string {
  const dependency = String(responses.sd_founder_dependency || '').toLowerCase();
  const holiday = String(responses.dd_holiday_reality || '').toLowerCase();
  
  if (dependency.includes('chaos') || dependency.includes('essential to everything')) {
    return 'chaos';
  }
  if (holiday.includes('disaster') || holiday.includes('struggle')) {
    return 'chaos';
  }
  if (dependency.includes('struggle') || dependency.includes('difficult')) {
    return 'struggle';
  }
  if (dependency.includes('fine') || dependency.includes('cope')) {
    return 'manageable';
  }
  
  return 'unknown';
}

function extractExitTimeline(responses: Record<string, any>): string | undefined {
  return responses.sd_exit_timeline;
}

function detectCapitalRaising(responses: Record<string, any>): boolean {
  // Check multiple signals
  const frustration = String(responses.sd_operational_frustration || '').toLowerCase();
  const growthBlocker = String(responses.sd_growth_blocker || '').toLowerCase();
  const raising = String(responses.sd_raising_capital || '').toLowerCase();
  const ifIKnew = String(responses.dd_if_i_knew || '').toLowerCase();
  
  const signals = [
    frustration.includes('capital') || frustration.includes('funding'),
    frustration.includes('not going fast enough') && growthBlocker.includes('capital'),
    growthBlocker.includes("don't have the capital"),
    growthBlocker.includes('funding'),
    raising.includes('yes') || raising.includes('actively'),
    frustration.includes('raise') && frustration.includes('faster'),
    ifIKnew.includes('capital') || ifIKnew.includes('raise') || ifIKnew.includes('investors') || ifIKnew.includes('funding')
  ];
  
  const detected = signals.filter(Boolean).length >= 1;
  console.log('[AdvisoryDeepDive] Capital raising signals:', { signals, detected });
  return detected;
}

function detectLifestyleTransformation(responses: Record<string, any>, anchors: any): boolean {
  // Check vision for lifestyle indicators
  const visionText = String(responses.dd_five_year_picture || responses.dd_future_vision || '').toLowerCase();
  const successDef = String(responses.dd_success_definition || '').toLowerCase();
  const hours = String(responses.dd_owner_hours || '');
  
  const visionSignals = [
    visionText.includes('school'),
    visionText.includes('drop-off') || visionText.includes('drop off'),
    visionText.includes('investor'),
    visionText.includes('without me') || visionText.includes('without you'),
    visionText.includes('portfolio'),
    visionText.includes('chairman'),
    visionText.includes('step back'),
    visionText.includes('0500') || visionText.includes('5am'),
    visionText.includes('run') && visionText.includes('morning')
  ];
  
  const successSignals = [
    successDef.includes('without me'),
    successDef.includes('runs without'),
    successDef.includes('legacy'),
    successDef.includes('exit') || successDef.includes('sell')
  ];
  
  const hoursSignal = hours.includes('60') || hours.includes('70');
  
  const detected = (visionSignals.filter(Boolean).length >= 2) ||
                   (successSignals.filter(Boolean).length >= 1 && hoursSignal);
  
  console.log('[AdvisoryDeepDive] Lifestyle transformation signals:', { 
    visionSignals: visionSignals.filter(Boolean).length,
    successSignals: successSignals.filter(Boolean).length,
    hoursSignal,
    detected 
  });
  
  return detected;
}

function detectBurnoutRisk(responses: Record<string, any>): boolean {
  const hours = String(responses.dd_owner_hours || '');
  const external = String(responses.dd_external_view || '').toLowerCase();
  const holiday = String(responses.dd_holiday_reality || '').toLowerCase();
  
  const detected = (hours.includes('60') || hours.includes('70')) ||
                   external.includes('worried') ||
                   external.includes('tension') ||
                   external.includes('strain') ||
                   external.includes('married to my business') ||
                   holiday.includes('never') ||
                   holiday.includes("can't remember") ||
                   holiday.includes('more than 2 years');
  
  return detected;
}

function detectPatterns(
  responses: Record<string, any>,
  patternAnalysis: PreparedData['patternAnalysis']
): DetectedPatterns {
  return {
    capitalRaising: detectCapitalRaising(responses),
    lifestyleTransformation: detectLifestyleTransformation(responses, null),
    burnoutRisk: detectBurnoutRisk(responses),
    founderDependency: extractFounderDependency(responses) === 'chaos',
    highGrowth: false // Will be set based on metrics
  };
}

function getMetricValue(metrics: ExtractedMetrics, metricPath: string): any {
  const parts = metricPath.split('.');
  let value: any = metrics;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part as keyof typeof value];
    } else {
      return null;
    }
  }
  
  return value;
}

function compareValues(value: any, operator: string, threshold: any): boolean {
  if (value === null || value === undefined) return false;
  
  switch (operator) {
    case '>':
      return Number(value) > Number(threshold);
    case '>=':
      return Number(value) >= Number(threshold);
    case '<':
      return Number(value) < Number(threshold);
    case '<=':
      return Number(value) <= Number(threshold);
    case '===':
    case '=':
      return value === threshold;
    case '!==':
    case '!=':
      return value !== threshold;
    case 'includes':
      return String(value).toLowerCase().includes(String(threshold).toLowerCase());
    default:
      return false;
  }
}

function evaluateTrigger(
  trigger: ServiceAdvisoryTrigger,
  metrics: ExtractedMetrics,
  patterns: DetectedPatterns,
  responses: Record<string, any>
): boolean {
  const spec = trigger.trigger_spec;
  
  switch (trigger.trigger_type) {
    case 'assessment_response':
      const answer = responses[spec.question];
      if (spec.values && Array.isArray(spec.values)) {
        return spec.values.includes(answer);
      }
      return answer === spec.value;
      
    case 'metric_threshold':
      const metricValue = getMetricValue(metrics, spec.metric);
      if (metricValue === null) return false;
      return compareValues(metricValue, spec.operator, spec.value);
      
    case 'pattern_detected':
      return patterns[spec.pattern as keyof DetectedPatterns] === spec.value;
      
    case 'combination':
      if (spec.operator === 'AND') {
        return spec.conditions.every((c: any) => 
          evaluateTrigger({ ...trigger, trigger_spec: c }, metrics, patterns, responses)
        );
      }
      return spec.conditions.some((c: any) => 
        evaluateTrigger({ ...trigger, trigger_spec: c }, metrics, patterns, responses)
      );
      
    default:
      return false;
  }
}

function interpolateTemplate(template: string, context: any): string {
  let result = template;
  
  // Replace {variable} with context values
  result = result.replace(/\{(\w+)\}/g, (match, key) => {
    const value = getNestedValue(context, key);
    return value !== null && value !== undefined ? String(value) : match;
  });
  
  return result;
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return null;
    }
  }
  
  return value;
}

function evaluateServiceTriggers(
  serviceCode: string,
  triggers: ServiceAdvisoryTrigger[],
  metrics: ExtractedMetrics,
  patterns: DetectedPatterns,
  responses: Record<string, any>
): TriggerEvaluation[] {
  const results: TriggerEvaluation[] = [];
  const serviceTriggers = triggers.filter(t => t.service_code === serviceCode);
  
  for (const trigger of serviceTriggers) {
    const fired = evaluateTrigger(trigger, metrics, patterns, responses);
    
    if (fired) {
      results.push({
        serviceCode,
        triggered: true,
        relevance: trigger.relevance,
        timing: trigger.timing,
        rationale: trigger.rationale,
        clientValueStatement: interpolateTemplate(
          trigger.client_value_template,
          { metrics, responses, patterns, response: responses[trigger.trigger_spec?.question] }
        )
      });
    }
  }
  
  return results;
}

function checkContraindications(
  serviceCode: string,
  contraindications: ServiceContraindication[],
  stage: BusinessStage,
  metrics: ExtractedMetrics,
  responses: Record<string, any>
): { blocked: boolean; warnings: string[]; alternatives: string[] } {
  const result = {
    blocked: false,
    warnings: [] as string[],
    alternatives: [] as string[]
  };
  
  const serviceContras = contraindications.filter(c => c.service_code === serviceCode);
  
  for (const contra of serviceContras) {
    const spec = contra.condition_spec;
    let applies = false;
    
    switch (contra.contraindication_type) {
      case 'stage_mismatch':
        applies = spec.stage === stage;
        break;
      case 'existing_capability':
        // Would need to check if client has this capability
        applies = false; // Placeholder
        break;
      case 'affordability':
        // Would need to check affordability
        applies = false; // Placeholder
        break;
      case 'timing_wrong':
        applies = false; // Placeholder
        break;
      default:
        applies = false;
    }
    
    if (applies) {
      if (contra.severity === 'hard_block') {
        result.blocked = true;
        result.warnings.push(contra.explanation);
        if (contra.alternative_suggestion) {
          result.alternatives.push(contra.alternative_suggestion);
        }
      } else if (contra.severity === 'soft_warning') {
        result.warnings.push(contra.explanation);
      }
    }
  }
  
  return result;
}

function evaluateAllServices(
  metadata: ServiceLineMetadata[],
  triggers: ServiceAdvisoryTrigger[],
  contraindications: ServiceContraindication[],
  metrics: ExtractedMetrics,
  patterns: DetectedPatterns,
  responses: Record<string, any>
): EvaluatedService[] {
  const stage = metrics.context.businessStage;
  const evaluations: EvaluatedService[] = [];
  
  for (const service of metadata) {
    // Evaluate triggers
    const triggerResults = evaluateServiceTriggers(
      service.code,
      triggers,
      metrics,
      patterns,
      responses
    );
    
    // Check contraindications
    const contraResult = checkContraindications(
      service.code,
      contraindications,
      stage,
      metrics,
      responses
    );
    
    if (triggerResults.length > 0 && !contraResult.blocked) {
      // Use highest relevance trigger
      const bestTrigger = triggerResults.sort((a, b) => {
        const relevanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
      })[0];
      
      evaluations.push({
        serviceCode: service.code,
        serviceName: service.name,
        triggered: true,
        relevance: bestTrigger.relevance,
        timing: bestTrigger.timing,
        rationale: bestTrigger.rationale,
        clientValueStatement: bestTrigger.clientValueStatement,
        blocked: contraResult.blocked,
        warnings: contraResult.warnings,
        alternatives: contraResult.alternatives
      });
    }
  }
  
  return evaluations;
}

function relevanceScore(relevance: string): number {
  const scores: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  return scores[relevance] || 0;
}

function applyOversellingRules(
  evaluatedServices: EvaluatedService[],
  rules: OversellingRule[],
  stage: BusinessStage,
  affordability: AffordabilityProfile
): PhasedRecommendations {
  // Find applicable rules
  const applicableRules = rules.filter(r => {
    const appliesWhen = r.applies_when;
    return appliesWhen?.stage === stage || 
           appliesWhen?.affordability === affordability.estimatedMonthlyCapacity;
  });
  
  // Sort by restrictiveness
  applicableRules.sort((a, b) => 
    (a.max_phase1_services || 999) - (b.max_phase1_services || 999)
  );
  
  const mostRestrictiveRule = applicableRules[0];
  
  // Separate services by timing
  const nowServices = evaluatedServices.filter(s => 
    s.timing === 'now' && !s.blocked
  );
  const laterServices = evaluatedServices.filter(s => 
    s.timing !== 'now' && !s.blocked
  );
  
  // Sort by relevance
  let phase1 = nowServices.sort((a, b) => 
    relevanceScore(b.relevance) - relevanceScore(a.relevance)
  );
  
  const excluded: string[] = [];
  
  // Remove excluded services
  if (mostRestrictiveRule?.excluded_services) {
    phase1 = phase1.filter(s => {
      if (mostRestrictiveRule.excluded_services.includes(s.serviceCode)) {
        excluded.push(s.serviceCode);
        return false;
      }
      return true;
    });
  }
  
  // Apply count cap
  const maxPhase1 = mostRestrictiveRule?.max_phase1_services || 5;
  const phase1Capped = phase1.length > maxPhase1;
  
  if (phase1Capped) {
    const excess = phase1.slice(maxPhase1);
    phase1 = phase1.slice(0, maxPhase1);
    laterServices.push(...excess.map(s => ({ ...s, timing: 'within_3_months' as const })));
  }
  
  // Ensure priority services are included
  if (mostRestrictiveRule?.priority_services) {
    for (const priorityCode of mostRestrictiveRule.priority_services) {
      if (!phase1.find(s => s.serviceCode === priorityCode)) {
        const priorityService = evaluatedServices.find(s => s.serviceCode === priorityCode);
        if (priorityService && !priorityService.blocked) {
          if (phase1.length >= maxPhase1) {
            const lowest = phase1[phase1.length - 1];
            laterServices.push({ ...lowest, timing: 'within_3_months' as const });
            phase1[phase1.length - 1] = priorityService;
          } else {
            phase1.push(priorityService);
          }
        }
      }
    }
  }
  
  // Split later services
  const phase2 = laterServices.filter(s => 
    s.timing === 'within_3_months' || s.timing === 'post_raise'
  );
  const phase3 = laterServices.filter(s => 
    s.timing === 'at_scale'
  );
  
  return {
    phase1Services: phase1,
    phase2Services: phase2,
    phase3Services: phase3,
    oversellingCheck: {
      rulesApplied: applicableRules.map(r => r.rule_name),
      servicesExcluded: excluded,
      phase1Capped,
      explanation: mostRestrictiveRule?.explanation
    }
  };
}

function calculateImpacts(
  services: EvaluatedService[],
  calculations: ValueCalculation[],
  metrics: ExtractedMetrics
): Record<string, string> {
  const impacts: Record<string, string> = {};
  
  for (const service of services) {
    const serviceCalcs = calculations.filter(c => c.service_code === service.serviceCode);
    
    for (const calc of serviceCalcs) {
      // Check if required metrics are available
      const hasMetrics = calc.required_metrics.every(metric => 
        getMetricValue(metrics, metric) !== null
      );
      
      if (hasMetrics) {
        try {
          // Build a safe evaluation context
          const context = {
            metrics,
            manualWorkPercentage: metrics.operational?.manualWorkPercentage || 0,
            teamSize: metrics.operational?.teamSize?.current || 1,
            currentRevenue: metrics.financial?.currentRevenue || 0,
            grossMargin: metrics.financial?.grossMargin || 0,
            growthMultiple: metrics.financial?.growthMultiple || 1
          };
          
          // Replace metric references with actual values
          let formula = calc.formula;
          
          // Replace common metric patterns with actual values
          formula = formula.replace(/metrics\.operational\.manualWorkPercentage/g, String(context.manualWorkPercentage));
          formula = formula.replace(/metrics\.operational\.teamSize\.current/g, String(context.teamSize));
          formula = formula.replace(/metrics\.financial\.currentRevenue/g, String(context.currentRevenue));
          formula = formula.replace(/metrics\.financial\.grossMargin/g, String(context.grossMargin));
          formula = formula.replace(/metrics\.financial\.growthMultiple/g, String(context.growthMultiple));
          
          // Replace any remaining metric references using getMetricValue
          for (const metric of calc.required_metrics) {
            const value = getMetricValue(metrics, metric);
            if (value !== null) {
              // Escape special regex characters in metric path
              const escapedMetric = metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              formula = formula.replace(new RegExp(escapedMetric, 'g'), String(value));
            }
          }
          
          // Validate formula only contains safe characters (numbers, operators, parentheses, dots, commas)
          if (!/^[\d\s\+\-\*\/\(\)\.\,]+$/.test(formula)) {
            console.warn(`[AdvisoryDeepDive] Unsafe formula for ${calc.calculation_name}: ${formula}`);
            if (calc.fallback_output) {
              impacts[`${service.serviceCode}_${calc.calculation_name}`] = calc.fallback_output;
            }
            continue;
          }
          
          // Evaluate
          const evaluated = eval(formula);
          
          // Format output
          const output = calc.output_template.replace(/\{result\}/g, 
            typeof evaluated === 'number' ? evaluated.toFixed(0) : String(evaluated)
          );
          impacts[`${service.serviceCode}_${calc.calculation_name}`] = output;
          
        } catch (e: any) {
          console.warn(`[AdvisoryDeepDive] Calculation failed for ${calc.calculation_name}:`, e.message);
          if (calc.fallback_output) {
            impacts[`${service.serviceCode}_${calc.calculation_name}`] = calc.fallback_output;
          }
        }
      } else if (calc.fallback_output) {
        impacts[`${service.serviceCode}_${calc.calculation_name}`] = calc.fallback_output;
      }
    }
  }
  
  return impacts;
}

function selectNarrativeHooks(
  services: EvaluatedService[],
  templates: NarrativeTemplate[],
  patterns: DetectedPatterns,
  metrics: ExtractedMetrics
): string[] {
  const hooks: string[] = [];
  
  for (const service of services) {
    const serviceTemplates = templates.filter(t => t.service_code === service.serviceCode);
    
    for (const template of serviceTemplates) {
      const useWhen = template.use_when;
      let shouldUse = false;
      
      // Check if template conditions are met
      if (useWhen.pattern) {
        shouldUse = patterns[useWhen.pattern as keyof DetectedPatterns] === useWhen.value;
      } else if (useWhen.metric) {
        const metricValue = getMetricValue(metrics, useWhen.metric);
        shouldUse = compareValues(metricValue, useWhen.operator, useWhen.value);
      }
      
      if (shouldUse) {
        hooks.push(template.hook);
        break; // One hook per service
      }
    }
  }
  
  return hooks.slice(0, 3); // Top 3
}

async function refineWithLLM(
  evaluations: EvaluatedService[],
  metrics: ExtractedMetrics,
  preparedData: PreparedData,
  apiKey: string
): Promise<any> {
  try {
    const prompt = `You are a senior business advisor reviewing an automated service matching analysis.

## CONTEXT
Client: ${preparedData.client.name} (${preparedData.client.company})
Business Stage: ${metrics.context.businessStage}
Capital Raising: ${metrics.context.capitalRaising}
Key Patterns Detected: ${JSON.stringify(metrics.context)}

## EXTRACTED METRICS
${JSON.stringify(metrics, null, 2)}

## AUTOMATED SERVICE MATCHES
${JSON.stringify(evaluations.map(e => ({
  service: e.serviceCode,
  relevance: e.relevance,
  timing: e.timing,
  rationale: e.rationale
})), null, 2)}

## YOUR TASK

Review the automated matches and provide refined, context-aware insights. For each recommended service:

1. VALIDATE the match - is it genuinely appropriate for THIS client?
2. REFINE the client-specific value statement - use THEIR numbers
3. IDENTIFY any nuances the automation may have missed
4. CALCULATE specific £ impact where data permits
5. FLAG any services that should be deprioritised despite trigger matches

## CRITICAL TIMING LOGIC

Apply these nuanced timing rules:

**CFO BEFORE raising, not after:**
- If capital_raising = true, CFO timing = "now" not "post_raise"
- Investors need confidence in financial leadership BEFORE the meeting

**Systems Audit BEFORE scaling:**
- If team_growth_multiple > 5x, Systems Audit = "now"
- Document and fix processes before they break

**365 for transformation, not just planning:**
- If lifestyle_transformation = true, 365 is about IDENTITY not strategy
- "You have a business plan. What you don't have is a path to becoming the person you described."

## OUTPUT FORMAT

Return JSON:
{
  "refinedInsights": [
    {
      "serviceCode": "...",
      "validationNotes": "...",
      "refinedValueStatement": "...",
      "quantifiedImpact": "...",
      "priorityAdjustment": "maintain" | "increase" | "decrease" | "remove",
      "adjustmentReason": "..."
    }
  ],
  "additionalObservations": "...",
  "topNarrativeHook": "..."
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor-practice-platform.com',
        'X-Title': 'Torsor Practice Platform'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return { refinedInsights: [], additionalObservations: '', topNarrativeHook: '' };
  } catch (e) {
    console.warn('[AdvisoryDeepDive] LLM refinement failed:', e);
    return { refinedInsights: [], additionalObservations: '', topNarrativeHook: '' };
  }
}

function buildAdvisoryOutput(
  client: PreparedData['client'],
  metrics: ExtractedMetrics,
  refinedInsights: any,
  phased: PhasedRecommendations,
  impacts: Record<string, string>,
  hooks: string[]
): AdvisoryDeepDiveOutput {
  // Calculate total investments
  const getServicePrice = (serviceCode: string): number => {
    // Would load from metadata in production
    const prices: Record<string, number> = {
      'management_accounts': 650,
      'systems_audit': 4000,
      'fractional_cfo': 4000,
      '365_method': 4500,
      'fractional_coo': 3750,
      'business_advisory': 4000,
      'automation': 1500,
      'combined_advisory': 6000,
      'benchmarking': 3500
    };
    return prices[serviceCode] || 0;
  };
  
  const phase1Total = phased.phase1Services.reduce((sum, s) => sum + getServicePrice(s.serviceCode), 0);
  const phase2Total = phased.phase2Services.reduce((sum, s) => sum + getServicePrice(s.serviceCode), 0);
  const phase3Total = phased.phase3Services.reduce((sum, s) => sum + getServicePrice(s.serviceCode), 0);
  
  return {
    clientId: client.id,
    clientName: client.name,
    analysisTimestamp: new Date().toISOString(),
    modelUsed: MODEL,
    extractedMetrics: metrics,
    advisoryInsights: [],
    serviceRecommendations: {
      phase1: {
        services: phased.phase1Services.map(s => s.serviceCode),
        totalInvestment: phase1Total,
        timing: 'now',
        rationale: phased.phase1Services.map(s => s.rationale).join(' ')
      },
      ...(phased.phase2Services.length > 0 && {
        phase2: {
          services: phased.phase2Services.map(s => s.serviceCode),
          totalInvestment: phase2Total,
          timing: 'post_raise' as const,
          rationale: phased.phase2Services.map(s => s.rationale).join(' '),
          trigger: 'Post-raise or month 3-6'
        }
      }),
      ...(phased.phase3Services.length > 0 && {
        phase3: {
          services: phased.phase3Services.map(s => s.serviceCode),
          totalInvestment: phase3Total,
          timing: 'at_scale' as const,
          rationale: phased.phase3Services.map(s => s.rationale).join(' '),
          trigger: 'At scale or month 6-12'
        }
      })
    },
    keyFigures: impacts,
    topNarrativeHooks: hooks,
    oversellingCheck: phased.oversellingCheck
  };
}

async function saveToAudit(
  supabase: any,
  clientId: string,
  discoveryId: string,
  output: AdvisoryDeepDiveOutput,
  model: string,
  executionTime: number
): Promise<void> {
  try {
    await supabase.from('audit_advisory_insights').insert({
      client_id: clientId,
      discovery_id: discoveryId,
      advisory_output: output,
      extracted_metrics: output.extractedMetrics,
      phase1_services: output.serviceRecommendations.phase1.services,
      phase2_services: output.serviceRecommendations.phase2?.services || [],
      phase3_services: output.serviceRecommendations.phase3?.services || [],
      total_phase1_investment: output.serviceRecommendations.phase1.totalInvestment,
      overselling_rules_applied: output.oversellingCheck.rulesApplied,
      services_excluded: output.oversellingCheck.servicesExcluded,
      model_used: model,
      execution_time_ms: executionTime
    });
  } catch (e) {
    console.error('[AdvisoryDeepDive] Failed to save audit:', e);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  console.log('=== ADVISORY-DEEP-DIVE STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { preparedData } = await req.json();

    if (!preparedData) {
      throw new Error('preparedData is required');
    }

    console.log(`[AdvisoryDeepDive] Analysing: ${preparedData.client.name}`);

    // Load all metadata
    const [serviceMetadata, triggers, contraindications, oversellingRules, valueCalcs, narrativeTemplates] = 
      await Promise.all([
        loadServiceMetadata(supabase),
        loadAdvisoryTriggers(supabase),
        loadContraindications(supabase),
        loadOversellingRules(supabase),
        loadValueCalculations(supabase),
        loadNarrativeTemplates(supabase)
      ]);

    // Extract metrics from prepared data (uses documentInsights from Stage 1)
    const extractedMetrics = extractMetricsFromPreparedData(preparedData);
    
    // Determine stage and affordability (using extracted metrics)
    const businessStage = extractedMetrics.context.businessStage;
    const affordability = assessAffordability(
      extractedMetrics.financial.currentRevenue,
      preparedData.discovery.responses,
      preparedData.documentInsights
    );
    
    console.log(`[AdvisoryDeepDive] Stage: ${businessStage}, Affordability: ${affordability.estimatedMonthlyCapacity}`);
    
    console.log(`[AdvisoryDeepDive] Extracted metrics:`, {
      hasFinancialProjections: !!extractedMetrics.financial?.projectedRevenue?.length,
      teamGrowthMultiple: extractedMetrics.operational?.teamGrowthMultiple
    });

    // Detect patterns
    const patterns = detectPatterns(preparedData.discovery.responses, preparedData.patternAnalysis);
    
    console.log(`[AdvisoryDeepDive] Patterns:`, patterns);

    // Evaluate all services
    const serviceEvaluations = evaluateAllServices(
      serviceMetadata,
      triggers,
      contraindications,
      extractedMetrics,
      patterns,
      preparedData.discovery.responses
    );

    // Apply overselling rules
    const phasedRecommendations = applyOversellingRules(
      serviceEvaluations,
      oversellingRules,
      businessStage,
      affordability
    );
    
    console.log(`[AdvisoryDeepDive] Phased recommendations:`, {
      phase1: phasedRecommendations.phase1Services.map(s => s.serviceCode),
      phase2: phasedRecommendations.phase2Services.map(s => s.serviceCode),
      phase3: phasedRecommendations.phase3Services.map(s => s.serviceCode),
      overselling: phasedRecommendations.oversellingCheck
    });

    // Calculate impacts
    const quantifiedImpacts = calculateImpacts(
      [...phasedRecommendations.phase1Services, ...phasedRecommendations.phase2Services],
      valueCalcs,
      extractedMetrics
    );

    // Select narrative hooks
    const narrativeHooks = selectNarrativeHooks(
      phasedRecommendations.phase1Services,
      narrativeTemplates,
      patterns,
      extractedMetrics
    );

    // Refine with LLM
    const llmStartTime = Date.now();
    const refinedInsights = await refineWithLLM(
      serviceEvaluations,
      extractedMetrics,
      preparedData,
      openrouterKey
    );
    const llmTime = Date.now() - llmStartTime;
    
    console.log(`[AdvisoryDeepDive] LLM refinement complete in ${llmTime}ms`);

    // Build output
    const output = buildAdvisoryOutput(
      preparedData.client,
      extractedMetrics,
      refinedInsights,
      phasedRecommendations,
      quantifiedImpacts,
      narrativeHooks
    );

    // Save to audit
    await saveToAudit(
      supabase,
      preparedData.client.id,
      preparedData.discovery.id,
      output,
      MODEL,
      Date.now() - startTime
    );

    const totalTime = Date.now() - startTime;
    console.log(`[AdvisoryDeepDive] Complete in ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      advisoryInsights: output,
      metadata: {
        model: MODEL,
        executionTimeMs: totalTime,
        llmTimeMs: llmTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AdvisoryDeepDive] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

