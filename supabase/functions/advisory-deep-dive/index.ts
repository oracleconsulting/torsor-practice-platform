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
  reasoning: string;
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

function determineBusinessStage(preparedData: PreparedData): BusinessStage {
  const responses = preparedData.discovery.responses;
  const financial = preparedData.financialContext;
  
  // Check financial context first (most reliable)
  if (financial?.revenue) {
    if (financial.revenue < 100000) return 'pre_revenue';
    if (financial.revenue < 500000) return 'early_revenue';
    if (financial.revenue < 2000000) return 'growth';
    if (financial.revenue < 10000000) return 'established';
    return 'scaling';
  }
  
  // Fall back to assessment signals
  const operationalFrustration = (responses.sd_operational_frustration || '').toLowerCase();
  if (operationalFrustration.includes('mvp') || 
      operationalFrustration.includes('pre-revenue') ||
      operationalFrustration.includes('launch')) {
    return 'pre_revenue';
  }
  
  if (responses.sd_growth_blocker === "Don't have the capital") {
    return 'early_revenue';
  }
  
  // Default to growth if unclear
  return 'growth';
}

function assessAffordability(preparedData: PreparedData): AffordabilityProfile {
  const financial = preparedData.financialContext;
  const stage = determineBusinessStage(preparedData);
  
  // Use revenue to estimate capacity
  if (financial?.revenue) {
    const monthlyRevenue = financial.revenue / 12;
    if (monthlyRevenue < 1000) {
      return { estimatedMonthlyCapacity: 'under_1k', reasoning: 'Very limited monthly revenue' };
    }
    if (monthlyRevenue < 5000) {
      return { estimatedMonthlyCapacity: '1k_5k', reasoning: 'Limited monthly capacity' };
    }
    if (monthlyRevenue < 15000) {
      return { estimatedMonthlyCapacity: '5k_15k', reasoning: 'Moderate monthly capacity' };
    }
    return { estimatedMonthlyCapacity: '15k_plus', reasoning: 'Strong monthly capacity' };
  }
  
  // Fall back to stage-based estimation
  if (stage === 'pre_revenue') {
    return { estimatedMonthlyCapacity: 'under_1k', reasoning: 'Pre-revenue stage' };
  }
  if (stage === 'early_revenue') {
    return { estimatedMonthlyCapacity: '1k_5k', reasoning: 'Early revenue stage' };
  }
  
  return { estimatedMonthlyCapacity: '5k_15k', reasoning: 'Growth or established stage' };
}

async function extractMetricsFromDocuments(
  documents: PreparedData['documents'],
  financialContext: PreparedData['financialContext'],
  responses: Record<string, any>,
  apiKey: string
): Promise<ExtractedMetrics> {
  const metrics: ExtractedMetrics = {
    financial: {},
    operational: {
      teamSize: { current: financialContext?.staffCount || 0 }
    },
    context: {
      businessStage: 'growth',
      capitalRaising: false,
      burnoutRisk: false,
      lifestyleTransformation: false
    }
  };
  
  // Extract from financial context
  if (financialContext) {
    metrics.financial.currentRevenue = financialContext.revenue;
    metrics.financial.grossMargin = financialContext.grossMarginPct;
    metrics.operational.teamSize.current = financialContext.staffCount;
  }
  
  // Extract from assessment responses
  if (responses.sd_manual_work) {
    const manualWorkMatch = responses.sd_manual_work.match(/(\d+)/);
    if (manualWorkMatch) {
      metrics.operational.manualWorkPercentage = parseInt(manualWorkMatch[1]);
    }
  }
  
  if (responses.sd_founder_dependency) {
    metrics.operational.founderDependencyLevel = responses.sd_founder_dependency;
  }
  
  // If documents exist, use LLM to extract projections
  if (documents && documents.length > 0) {
    try {
      const documentContent = documents.map(d => d.content).join('\n\n');
      
      const extractionPrompt = `Extract financial and operational metrics from the following client documents.

Documents:
${documentContent}

Extract and return JSON with this structure:
{
  "financial": {
    "projectedRevenue": [{"year": 1, "amount": 559000}, {"year": 5, "amount": 22700000}],
    "growthMultiple": 41,
    "grossMargin": 90,
    "ebitdaMargin": {"year1": 10, "year5": 25}
  },
  "operational": {
    "teamSize": {"current": 3, "projected": 51},
    "teamGrowthMultiple": 17
  }
}

Only include metrics that are explicitly stated in the documents. Return valid JSON only.`;

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
          messages: [{ role: 'user', content: extractionPrompt }],
          temperature: 0.1,
          max_tokens: 2000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          
          if (extracted.financial) {
            Object.assign(metrics.financial, extracted.financial);
          }
          if (extracted.operational) {
            Object.assign(metrics.operational, extracted.operational);
          }
        }
      }
    } catch (e) {
      console.warn('[AdvisoryDeepDive] Document extraction failed:', e);
    }
  }
  
  return metrics;
}

function detectPatterns(
  responses: Record<string, any>,
  patternAnalysis: PreparedData['patternAnalysis']
): DetectedPatterns {
  return {
    capitalRaising: patternAnalysis?.capitalRaisingSignals?.detected || false,
    lifestyleTransformation: patternAnalysis?.lifestyleTransformation?.detected || false,
    burnoutRisk: patternAnalysis?.emotionalState?.burnoutRisk === 'high' || 
                 responses.dd_owner_hours === '60-70 hours' ||
                 responses.dd_owner_hours === '70+ hours',
    founderDependency: responses.sd_founder_dependency === "Chaos - I'm essential to everything",
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
          // Simple formula evaluation (would need more robust parser in production)
          let result = calc.formula;
          
          // Replace metric references
          for (const metric of calc.required_metrics) {
            const value = getMetricValue(metrics, metric);
            result = result.replace(new RegExp(metric, 'g'), String(value));
          }
          
          // Evaluate (simplified - would use proper expression parser)
          const evaluated = eval(result); // In production, use a safe expression evaluator
          
          // Format output
          const output = calc.output_template.replace(/\{result\}/g, evaluated.toFixed(1));
          impacts[`${service.serviceCode}_${calc.calculation_name}`] = output;
        } catch (e) {
          console.warn(`[AdvisoryDeepDive] Calculation failed for ${calc.calculation_name}:`, e);
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

    // Determine stage and affordability
    const businessStage = determineBusinessStage(preparedData);
    const affordability = assessAffordability(preparedData);
    
    console.log(`[AdvisoryDeepDive] Stage: ${businessStage}, Affordability: ${affordability.estimatedMonthlyCapacity}`);

    // Extract metrics
    const extractedMetrics = await extractMetricsFromDocuments(
      preparedData.documents,
      preparedData.financialContext,
      preparedData.discovery.responses,
      openrouterKey
    );
    
    // Set business stage in metrics
    extractedMetrics.context.businessStage = businessStage;
    extractedMetrics.context.capitalRaising = preparedData.patternAnalysis?.capitalRaisingSignals?.detected || false;
    extractedMetrics.context.burnoutRisk = preparedData.patternAnalysis?.emotionalState?.burnoutRisk === 'high';
    extractedMetrics.context.lifestyleTransformation = preparedData.patternAnalysis?.lifestyleTransformation?.detected || false;
    
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

