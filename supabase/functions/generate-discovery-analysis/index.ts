// ============================================================================
// GENERATE DISCOVERY ANALYSIS - Part 2 of 2-stage report generation
// ============================================================================
// Takes prepared data and generates the full analysis using Claude Opus 4.5
// This is the heavy LLM call - should complete within 60s with prepared data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

// ============================================================================
// DIAGNOSTIC: FINANCIAL DATA TRACING SYSTEM
// Traces financial data through every stage of the pipeline to identify
// where wrong figures might be introduced
// ============================================================================

interface FinancialDataTrace {
  stage: string;
  timestamp: string;
  staffCosts: number | null;
  turnover: number | null;
  calculatedPct: number | null;
  storedPct: number | null;
  source: string;
  details?: Record<string, any>;
}

interface InvestmentTrace {
  stage: string;
  services: { name: string; code?: string; price: number }[];
  total: number;
}

const financialTraces: FinancialDataTrace[] = [];
const investmentTraces: InvestmentTrace[] = [];

function traceFinancialData(
  stage: string,
  data: {
    staffCosts?: number | null;
    turnover?: number | null;
    storedPct?: number | null;
    source?: string;
    details?: Record<string, any>;
  }
): void {
  const calculatedPct = (data.staffCosts && data.turnover && data.turnover > 0) 
    ? (data.staffCosts / data.turnover) * 100 
    : null;
  
  const trace: FinancialDataTrace = {
    stage,
    timestamp: new Date().toISOString(),
    staffCosts: data.staffCosts || null,
    turnover: data.turnover || null,
    calculatedPct,
    storedPct: data.storedPct || null,
    source: data.source || 'unknown',
    details: data.details
  };
  
  financialTraces.push(trace);
  
  // Log with emphasis on mismatches
  const mismatchWarning = trace.calculatedPct && trace.storedPct && 
    Math.abs(trace.calculatedPct - trace.storedPct) > 1 
    ? `⚠️ MISMATCH: calc=${trace.calculatedPct.toFixed(1)}% vs stored=${trace.storedPct.toFixed(1)}%` 
    : null;
  
  console.log(`[FINANCIAL TRACE - ${stage}]`, {
    staffCosts: trace.staffCosts ? `£${trace.staffCosts.toLocaleString()}` : null,
    turnover: trace.turnover ? `£${trace.turnover.toLocaleString()}` : null,
    calculatedPct: trace.calculatedPct ? `${trace.calculatedPct.toFixed(1)}%` : null,
    source: trace.source,
    ...(mismatchWarning ? { MISMATCH: mismatchWarning } : {})
  });
  
  // Flag suspicious values
  if (trace.calculatedPct && (trace.calculatedPct > 50 || trace.calculatedPct < 10)) {
    console.warn(`[FINANCIAL TRACE - ${stage}] ⚠️ Staff costs ${trace.calculatedPct.toFixed(1)}% outside normal range (10-50%)`);
  }
}

function traceInvestmentTotal(
  stage: string,
  services: { name: string; code?: string; price: number }[]
): void {
  const total = services.reduce((sum, s) => sum + s.price, 0);
  
  investmentTraces.push({ stage, services, total });
  
  console.log(`[INVESTMENT TRACE - ${stage}]`, {
    services: services.map(s => `${s.name || s.code}: £${s.price.toLocaleString()}`),
    total: `£${total.toLocaleString()}`
  });
}

function logFinancialTracesSummary(): void {
  console.log('\n========== FINANCIAL TRACE SUMMARY ==========');
  console.log('Total traces:', financialTraces.length);
  
  for (const trace of financialTraces) {
    console.log(`  [${trace.stage}] ${trace.calculatedPct?.toFixed(1) || '?'}% | Staff: £${trace.staffCosts?.toLocaleString() || '?'} | Turnover: £${trace.turnover?.toLocaleString() || '?'}`);
  }
  
  // Check for inconsistencies between stages
  const percentages = financialTraces
    .filter(t => t.calculatedPct !== null)
    .map(t => ({ stage: t.stage, pct: t.calculatedPct! }));
  
  if (percentages.length > 1) {
    const first = percentages[0].pct;
    const inconsistent = percentages.filter(p => Math.abs(p.pct - first) > 1);
    if (inconsistent.length > 0) {
      console.error('⚠️ INCONSISTENT PERCENTAGES DETECTED:');
      console.error('  First:', percentages[0].stage, `${first.toFixed(1)}%`);
      for (const p of inconsistent) {
        console.error('  Different:', p.stage, `${p.pct.toFixed(1)}%`);
      }
    }
  }
  console.log('==============================================\n');
}

function logInvestmentTracesSummary(): void {
  console.log('\n========== INVESTMENT TRACE SUMMARY ==========');
  console.log('Total traces:', investmentTraces.length);
  
  for (const trace of investmentTraces) {
    console.log(`  [${trace.stage}] Total: £${trace.total.toLocaleString()}`);
    for (const svc of trace.services) {
      console.log(`    - ${svc.name || svc.code}: £${svc.price.toLocaleString()}`);
    }
  }
  
  // Check for mismatches
  if (investmentTraces.length > 1) {
    const totals = investmentTraces.map(t => t.total);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    if (max - min > 500) {
      console.error(`⚠️ INVESTMENT TOTAL MISMATCH: Min £${min.toLocaleString()}, Max £${max.toLocaleString()}`);
    }
  }
  console.log('==============================================\n');
}

// ============================================================================
// ASSESSMENT SIGNAL EXTRACTION
// Captures BOTH strengths AND gaps from discovery responses
// This is critical for balanced, credible reporting
// ============================================================================

interface AssessmentSignals {
  // Strengths (positive signals to acknowledge)
  strengths: {
    financialConfidence: boolean;      // "Very confident" or "Fairly confident"
    lowFounderDependency: boolean;     // "Runs fine" or "Minor issues"
    healthyWorkload: boolean;          // <50 hours/week
    strategicTimeBalance: boolean;     // >50% strategic
    systemsWorking: boolean;           // "Highly automated" or "None of these" manual
    marketPosition: string;            // Direct quote
    documentationReady: boolean;       // "Yes" or "Probably"
    numbersActionFrequent: boolean;    // "Weekly" or "Daily"
  };
  
  // Gaps (areas to address)
  gaps: {
    avoidedConversation: string | null;  // Direct quote
    coreFrustration: string | null;      // Direct quote
    suspectedTruth: string | null;       // Direct quote
    operationalFrustration: string | null;
    growthBlocker: string | null;
    sleepThief: string | null;
  };
  
  // Context for framing
  context: {
    exitTimeline: string;
    successDefinition: string;
    fiveYearVision: string;
    weeklyHours: string;
    timeAllocation: string;
  };
  
  // Emotional anchors for narrative
  anchors: {
    magicFix: string;
    hardTruth: string;
    sacrifice: string;
    nonNegotiables: string[];
  };
  
  // Summary flags
  isExitFocused: boolean;
  isHighPerformer: boolean;  // Business is already doing well
  hasSpecificGaps: boolean;  // Has addressable issues
}

function extractAssessmentSignals(responses: Record<string, any>): AssessmentSignals {
  // Extract strengths
  const financialConfidence = ['very confident', 'fairly confident']
    .some(s => (responses.sd_financial_confidence || '').toLowerCase().includes(s));
  
  const lowFounderDependency = ['run fine', 'minor issues', 'optional']
    .some(s => (responses.sd_founder_dependency || '').toLowerCase().includes(s));
  
  const weeklyHours = responses.dd_weekly_hours || '';
  const healthyWorkload = !['50-60', '60-70', '70+']
    .some(s => weeklyHours.includes(s));
  
  const timeAllocation = responses.dd_time_allocation || '';
  const strategicTimeBalance = ['70% strategic', '90% strategic', '70%', '90%']
    .some(s => timeAllocation.includes(s));
  
  // sd_manual_tasks may be an array (multi-select) or string
  const manualTasksValue = Array.isArray(responses.sd_manual_tasks) 
    ? responses.sd_manual_tasks.join(' ').toLowerCase()
    : (responses.sd_manual_tasks || '').toString().toLowerCase();
  const systemsWorking = ['highly automated', 'none of these']
    .some(s => manualTasksValue.includes(s));
  
  const documentationReady = ['yes', 'probably']
    .some(s => (responses.sd_documentation_readiness || '').toLowerCase().includes(s));
  
  const numbersActionFrequent = ['weekly', 'daily']
    .some(s => (responses.sd_numbers_action_frequency || '').toLowerCase().includes(s));
  
  // Exit timeline detection
  const exitTimeline = responses.sd_exit_timeline || '';
  const isExitFocused = ['1-3 years', '3-5 years', 'already exploring', 'actively preparing']
    .some(s => exitTimeline.toLowerCase().includes(s.toLowerCase()));
  
  // Calculate summary flags
  const strengthCount = [
    financialConfidence, lowFounderDependency, healthyWorkload,
    strategicTimeBalance, systemsWorking, documentationReady, numbersActionFrequent
  ].filter(Boolean).length;
  
  const isHighPerformer = strengthCount >= 4;
  
  const gaps = {
    avoidedConversation: responses.dd_avoided_conversation || null,
    coreFrustration: responses.dd_core_frustration || null,
    suspectedTruth: responses.dd_suspected_truth || null,
    operationalFrustration: responses.sd_operational_frustration || null,
    growthBlocker: responses.sd_growth_blocker || null,
    sleepThief: responses.dd_sleep_thief || null,
  };
  
  const hasSpecificGaps = Object.values(gaps).some(g => g && g.trim().length > 0);
  
  const signals: AssessmentSignals = {
    strengths: {
      financialConfidence,
      lowFounderDependency,
      healthyWorkload,
      strategicTimeBalance,
      systemsWorking,
      marketPosition: responses.sd_competitive_position || '',
      documentationReady,
      numbersActionFrequent,
    },
    gaps,
    context: {
      exitTimeline,
      successDefinition: responses.dd_success_definition || '',
      fiveYearVision: responses.dd_five_year_vision || responses.dd_five_year_picture || '',
      weeklyHours,
      timeAllocation,
    },
    anchors: {
      magicFix: responses.dd_magic_fix || '',
      hardTruth: responses.dd_hard_truth || '',
      sacrifice: responses.dd_sacrifice_list || '',
      // dd_non_negotiables may be an array (multi-select) or comma-separated string
      nonNegotiables: Array.isArray(responses.dd_non_negotiables)
        ? responses.dd_non_negotiables.filter(Boolean)
        : (responses.dd_non_negotiables || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean),
    },
    isExitFocused,
    isHighPerformer,
    hasSpecificGaps,
  };
  
  console.log('[AssessmentSignals] Extracted:', {
    strengthCount,
    isHighPerformer,
    isExitFocused,
    hasSpecificGaps,
    gaps: Object.entries(gaps).filter(([_, v]) => v).map(([k]) => k)
  });
  
  return signals;
}

/**
 * Builds a balanced business health summary for the prompt
 * Includes BOTH strengths AND gaps
 */
function buildBalancedHealthSummary(signals: AssessmentSignals): string {
  const strengthLines: string[] = [];
  const gapLines: string[] = [];
  
  // Strengths
  if (signals.strengths.financialConfidence) {
    strengthLines.push('✅ Trusts their financial data completely');
  }
  if (signals.strengths.lowFounderDependency) {
    strengthLines.push('✅ Business runs without founder involvement');
  }
  if (signals.strengths.healthyWorkload) {
    strengthLines.push(`✅ Healthy workload (${signals.context.weeklyHours || '<50 hours'})`);
  }
  if (signals.strengths.strategicTimeBalance) {
    strengthLines.push(`✅ Good time balance (${signals.context.timeAllocation || 'strategic focus'})`);
  }
  if (signals.strengths.systemsWorking) {
    strengthLines.push('✅ Systems and automation working well');
  }
  if (signals.strengths.documentationReady) {
    strengthLines.push('✅ Documentation mostly in place');
  }
  if (signals.strengths.numbersActionFrequent) {
    strengthLines.push('✅ Data-driven owner (acts on numbers regularly)');
  }
  if (signals.strengths.marketPosition) {
    strengthLines.push(`✅ Market position: "${signals.strengths.marketPosition}"`);
  }
  
  // Gaps
  if (signals.gaps.avoidedConversation) {
    gapLines.push(`⚠️ Avoided conversation: "${signals.gaps.avoidedConversation}"`);
  }
  if (signals.gaps.coreFrustration) {
    gapLines.push(`⚠️ Core frustration: "${signals.gaps.coreFrustration}"`);
  }
  if (signals.gaps.suspectedTruth) {
    gapLines.push(`⚠️ Self-identified issue: "${signals.gaps.suspectedTruth}"`);
  }
  if (signals.gaps.growthBlocker) {
    gapLines.push(`⚠️ Growth blocker: "${signals.gaps.growthBlocker}"`);
  }
  if (signals.gaps.operationalFrustration) {
    gapLines.push(`⚠️ Operational frustration: "${signals.gaps.operationalFrustration}"`);
  }
  
  return `
## BUSINESS ASSESSMENT SIGNALS (Must include BOTH in narrative)

### STRENGTHS TO ACKNOWLEDGE:
${strengthLines.length > 0 ? strengthLines.join('\n') : 'No major strengths identified'}

### GAPS TO ADDRESS:
${gapLines.length > 0 ? gapLines.join('\n') : 'No major gaps identified'}

### CLIENT PROFILE:
- Exit Timeline: ${signals.context.exitTimeline || 'Not specified'}
- Success Definition: "${signals.context.successDefinition || 'Not specified'}"
- Five-Year Vision: "${signals.context.fiveYearVision || 'Not specified'}"
${signals.isHighPerformer ? '\n⚠️ THIS IS A HIGH-PERFORMING BUSINESS - Acknowledge what they\'ve built, don\'t lead with problems only.' : ''}
`;
}

// ============================================================================
// FORCE CORRECTION UTILITIES
// These functions detect and correct wrong figures in LLM output
// ============================================================================

function forceCorrectPayrollFigures(
  outputText: string,
  payrollAnalysis: PayrollAnalysis
): { correctedText: string; corrections: string[] } {
  const corrections: string[] = [];
  let correctedText = outputText;
  
  // Known wrong values that need correction
  const wrongPercentagePatterns = [
    /43\.?[0-9]?%/gi,  // 43%, 43.2%, etc.
    /44\.?[0-9]?%/gi,  // Close to 43%
  ];
  
  const wrongExcessPatterns = [
    /£414[,.]?\d{0,3}/gi,  // £414k, £414,348, etc.
    /£415[,.]?\d{0,3}/gi,  // Close to £414k
  ];
  
  // Correct percentage - only in payroll context
  for (const pattern of wrongPercentagePatterns) {
    if (pattern.test(correctedText)) {
      // Check if it's in payroll context
      const matches = correctedText.matchAll(new RegExp(`(.{0,50})(${pattern.source})(.{0,50})`, 'gi'));
      for (const match of matches) {
        const context = (match[1] + match[3]).toLowerCase();
        if (context.includes('payroll') || context.includes('staff') || context.includes('labour') || 
            context.includes('revenue') || context.includes('turnover') || context.includes('benchmark')) {
          corrections.push(`Corrected payroll % from ${match[2]} to ${payrollAnalysis.staffCostsPct.toFixed(1)}%`);
        }
      }
      correctedText = correctedText.replace(pattern, `${payrollAnalysis.staffCostsPct.toFixed(1)}%`);
    }
  }
  
  // Correct excess amount
  for (const pattern of wrongExcessPatterns) {
    if (pattern.test(correctedText)) {
      const correctExcess = `£${Math.round(payrollAnalysis.annualExcess / 1000)}k`;
      corrections.push(`Corrected excess amount to ${correctExcess}`);
      correctedText = correctedText.replace(pattern, correctExcess);
    }
  }
  
  return { correctedText, corrections };
}

function forceCorrectInvestmentTotal(
  analysis: any,
  correctServices: { name: string; code: string; price: number }[]
): { correctedAnalysis: any; corrections: string[] } {
  const corrections: string[] = [];
  const correctedAnalysis = JSON.parse(JSON.stringify(analysis));
  
  // Calculate correct total from authoritative service list
  const correctTotal = correctServices.reduce((sum, s) => sum + s.price, 0);
  
  // Check and correct recommendedInvestments / recommendedServices
  const serviceArrays = [
    correctedAnalysis.recommendedInvestments,
    correctedAnalysis.recommendedServices,
    correctedAnalysis.journey?.recommendedServices,
    correctedAnalysis.transformationJourney?.recommendedServices
  ].filter(Boolean);
  
  for (const arr of serviceArrays) {
    if (Array.isArray(arr)) {
      // Remove services that shouldn't be there
      const filteredArr = arr.filter((svc: any) => {
        const name = (svc.service || svc.name || '').toLowerCase();
        const code = (svc.code || '').toLowerCase();
        
        // Check if this service is in our correct list
        const isValid = correctServices.some(cs => 
          cs.code.toLowerCase() === code ||
          cs.name.toLowerCase().includes(name.split(' ')[0]) ||
          name.includes(cs.name.toLowerCase().split(' ')[0])
        );
        
        if (!isValid) {
          corrections.push(`Removed invalid service: ${svc.service || svc.name}`);
        }
        return isValid;
      });
      
      // Update the array in place
      arr.length = 0;
      arr.push(...filteredArr);
    }
  }
  
  // Correct investment summary totals
  if (correctedAnalysis.investmentSummary) {
    const currentTotal = correctedAnalysis.investmentSummary.totalFirstYear || 
                        correctedAnalysis.investmentSummary.total || 
                        correctedAnalysis.investmentSummary.yearOneTotal;
    
    if (currentTotal && typeof currentTotal === 'number' && currentTotal !== correctTotal) {
      corrections.push(`Corrected total from £${currentTotal.toLocaleString()} to £${correctTotal.toLocaleString()}`);
    }
    
    correctedAnalysis.investmentSummary.totalFirstYear = correctTotal;
    correctedAnalysis.investmentSummary.total = correctTotal;
    correctedAnalysis.investmentSummary.yearOneTotal = correctTotal;
    correctedAnalysis.investmentSummary.breakdown = correctServices
      .map(s => `${s.name}: £${s.price.toLocaleString()}`)
      .join(' + ');
  }
  
  return { correctedAnalysis, corrections };
}

// Use Claude Opus 4.5 for premium quality analysis
const MODEL = 'anthropic/claude-opus-4.5';

// ============================================================================
// MECHANICAL TEXT CLEANUP - Enforce British English & style rules
// ============================================================================

function cleanMechanical(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove em dashes, replace with comma
    .replace(/—/g, ', ')
    .replace(/, ,/g, ',')
    .replace(/, \./g, '.')
    // British English spellings
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\boptimized/gi, 'optimised')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\banalyzing/gi, 'analysing')
    .replace(/\banalyzed/gi, 'analysed')
    .replace(/\brealize/gi, 'realise')
    .replace(/\brealizing/gi, 'realising')
    .replace(/\brealized/gi, 'realised')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bbehaviors/gi, 'behaviours')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\bprograms\b/gi, 'programmes')
    .replace(/\borganize/gi, 'organise')
    .replace(/\borganizing/gi, 'organising')
    .replace(/\borganized/gi, 'organised')
    .replace(/\bfavor/gi, 'favour')
    .replace(/\bcolor/gi, 'colour')
    .replace(/\bhonor/gi, 'honour')
    .replace(/\brecognize/gi, 'recognise')
    .replace(/\brecognizing/gi, 'recognising')
    .replace(/\brecognized/gi, 'recognised')
    .replace(/\bspecialize/gi, 'specialise')
    .replace(/\bspecializing/gi, 'specialising')
    .replace(/\bspecialized/gi, 'specialised')
    // Clean up "Here's" patterns that slip through
    .replace(/Here's the thing[:\s]*/gi, '')
    .replace(/Here's the truth[:\s]*/gi, '')
    .replace(/Here's what I see[:\s]*/gi, '')
    .replace(/Here's what we see[:\s]*/gi, '')
    .replace(/Here's what I also see[:\s]*/gi, '')
    .replace(/But here's what I also see[:\s]*/gi, '')
    .replace(/Here's another[^.]+\.\s*/gi, '')
    // Clean up "hard work of" patterns
    .replace(/You've done the hard work of [^.]+\.\s*/gi, '')
    // Clean up "It doesn't mean X. It means Y." patterns
    .replace(/It doesn't mean [^.]+\. It means /gi, 'It means ')
    // Clean up "That's not a fantasy" patterns
    .replace(/That's not a fantasy\.\s*/gi, '')
    .replace(/That's not a dream\.\s*/gi, '')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    .trim();
}

// Recursively clean all string fields in an object
function cleanAllStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return cleanMechanical(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanAllStrings(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanAllStrings(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
}

// ============================================================================
// SERVICE SCORING UTILITY
// ============================================================================

interface ServiceScore {
  code: string;
  name: string;
  score: number;        // 0-100
  confidence: number;   // 0-100
  triggers: string[];   // Which questions triggered this
  priority: number;     // 1-5, 1 = highest
}

const SERVICES = [
  { code: '365_method', name: 'Goal Alignment Programme' },
  { code: 'management_accounts', name: 'Management Accounts' },
  { code: 'benchmarking', name: 'Industry Benchmarking' },
  { code: 'systems_audit', name: 'Systems Audit' },
  { code: 'fractional_cfo', name: 'Fractional CFO' },
  { code: 'fractional_coo', name: 'Fractional COO' },
  { code: 'business_advisory', name: 'Business Advisory & Exit Planning' },
  { code: 'hidden_value_audit', name: 'Hidden Value Audit' },
  { code: 'automation', name: 'Automation' },
];

// Helper to get field value with multiple possible names
function getField(responses: Record<string, any>, ...keys: string[]): any {
  for (const key of keys) {
    if (responses[key] !== undefined && responses[key] !== null && responses[key] !== '') {
      return responses[key];
    }
  }
  return undefined;
}

function scoreServicesFromDiscovery(
  responses: Record<string, any>
): ServiceScore[] {
  const scores: Record<string, ServiceScore> = {};
  
  // Initialize all services
  for (const service of SERVICES) {
    scores[service.code] = {
      code: service.code,
      name: service.name,
      score: 0,
      confidence: 0,
      triggers: [],
      priority: 5,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // EXTRACT RESPONSES WITH FALLBACKS
  // ═══════════════════════════════════════════════════════════════
  
  // Destination Discovery
  const vision = (getField(responses, 'dd_five_year_vision', 'dd_five_year_picture', 'five_year_vision') || '').toLowerCase();
  const successDef = getField(responses, 'dd_success_definition', 'success_definition') || '';
  const exitMindset = getField(responses, 'dd_exit_mindset', 'exit_mindset') || '';
  const weeklyHours = getField(responses, 'dd_weekly_hours', 'dd_owner_hours', 'weekly_hours') || '';
  const timeAllocation = getField(responses, 'dd_time_allocation', 'time_allocation') || '';
  const scalingConstraint = getField(responses, 'dd_scaling_constraint', 'scaling_constraint') || '';
  const sleepThieves = getField(responses, 'dd_sleep_thieves', 'dd_sleep_thief', 'sleep_thieves') || [];
  const coreFrustration = (getField(responses, 'dd_core_frustration', 'core_frustration') || '').toLowerCase();
  const teamConfidence = getField(responses, 'dd_team_confidence', 'team_confidence') || '';
  const keyPersonDep = getField(responses, 'dd_key_person_dependency', 'key_person_dependency') || '';
  const peopleChallenge = getField(responses, 'dd_people_challenge', 'people_challenge') || '';
  const delegationAbility = getField(responses, 'dd_delegation_ability', 'delegation_ability') || '';
  const externalPerspective = getField(responses, 'dd_external_perspective', 'dd_external_view', 'external_perspective') || '';
  const suspectedTruth = (getField(responses, 'dd_suspected_truth', 'dd_if_i_knew', 'suspected_truth') || '').toLowerCase();
  const priorityArea = getField(responses, 'dd_priority_area', 'priority_area') || '';
  const changeReadiness = getField(responses, 'dd_change_readiness', 'change_readiness') || '';
  
  // Service Diagnostics
  const financialConfidence = getField(responses, 'sd_financial_confidence', 'financial_confidence') || '';
  const numbersFreq = getField(responses, 'sd_numbers_action_frequency', 'numbers_action_frequency') || '';
  const benchmarkAwareness = getField(responses, 'sd_benchmark_awareness', 'benchmark_awareness') || '';
  const founderDep = getField(responses, 'sd_founder_dependency', 'founder_dependency') || '';
  const manualWork = getField(responses, 'sd_manual_work_percentage', 'manual_work_percentage') || '';
  const problemSpeed = getField(responses, 'sd_problem_awareness_speed', 'problem_awareness_speed') || '';
  const planClarity = getField(responses, 'sd_plan_clarity', 'plan_clarity') || '';
  const accountability = getField(responses, 'sd_accountability_source', 'accountability_source') || '';
  const decisionSupport = getField(responses, 'sd_decision_support', 'decision_support') || '';
  const growthBlocker = getField(responses, 'sd_growth_blocker', 'growth_blocker') || '';
  const scalingVuln = getField(responses, 'sd_scaling_vulnerability', 'scaling_vulnerability') || '';
  const operationalFrustration = (getField(responses, 'sd_operational_frustration', 'operational_frustration') || '').toLowerCase();
  const docReadiness = getField(responses, 'sd_documentation_readiness', 'documentation_readiness') || '';
  const valuationUnderstanding = getField(responses, 'sd_valuation_understanding', 'valuation_understanding') || '';
  const exitTimeline = getField(responses, 'sd_exit_timeline', 'exit_timeline') || '';
  
  // ═══════════════════════════════════════════════════════════════
  // GOAL ALIGNMENT SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (['Creating a business that runs profitably without me',
       'Building a legacy that outlasts me',
       'Building something I can sell for a life-changing amount'].includes(successDef)) {
    scores['365_method'].score += 25;
    scores['365_method'].triggers.push(`Success: "${successDef}"`);
  }
  
  if (vision.includes('invest') || vision.includes('portfolio') || 
      vision.includes('advisory') || vision.includes('board') ||
      vision.includes('step back') || vision.includes('chairman')) {
    scores['365_method'].score += 20;
    scores['365_method'].triggers.push('Vision: operator-to-investor transition');
  }
  
  if (['60-70 hours', '70+ hours'].includes(weeklyHours) && 
      changeReadiness === "Completely ready - I'll do whatever it takes") {
    scores['365_method'].score += 15;
    scores['365_method'].triggers.push('Burnout with high readiness');
  }
  
  if (['I have goals but not a real plan', 
       "I'm too busy to plan",
       "I've given up on planning - things always change"].includes(planClarity)) {
    scores['365_method'].score += 15;
    scores['365_method'].triggers.push(`Plan clarity: "${planClarity}"`);
  }
  
  if (['My spouse/family (informally)', 'No one - just me'].includes(accountability)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push('No formal accountability');
  }
  
  if (['I think about it but haven\'t planned', 
       'I\'d love to but can\'t see how'].includes(exitMindset)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push(`Exit desire without plan`);
  }
  
  if (['It\'s a significant source of tension',
       'They\'ve given up complaining',
       'They worry about me sometimes'].includes(externalPerspective)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push('Work-life balance strain');
  }

  // ═══════════════════════════════════════════════════════════════
  // MANAGEMENT ACCOUNTS SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (['Uncertain - Im often surprised', 
       'Not confident - I mostly guess',
       'I avoid financial decisions because I dont trust the data'].includes(financialConfidence)) {
    scores['management_accounts'].score += 30;
    scores['management_accounts'].triggers.push(`Financial confidence: "${financialConfidence}"`);
  }
  
  if (['Quarterly - when accounts come through',
       'Rarely - I dont find them useful',
       'Never - I dont get meaningful management information'].includes(numbersFreq)) {
    scores['management_accounts'].score += 25;
    scores['management_accounts'].triggers.push(`Numbers frequency: "${numbersFreq}"`);
  }
  
  if (suspectedTruth.includes('margin') || suspectedTruth.includes('profit') ||
      suspectedTruth.includes('losing') || suspectedTruth.includes('cost') ||
      suspectedTruth.includes('pricing') || suspectedTruth.includes('money')) {
    scores['management_accounts'].score += 20;
    scores['management_accounts'].triggers.push('Suspects financial issues');
  }
  
  const sleepArray = Array.isArray(sleepThieves) ? sleepThieves : [sleepThieves];
  if (sleepArray.some((s: string) => s && (s.includes('Cash flow') || s.includes('numbers') || s.includes('Cash flow and paying bills')))) {
    scores['management_accounts'].score += 15;
    scores['management_accounts'].triggers.push('Financial worries keeping awake');
  }
  
  if (priorityArea === 'Getting real financial visibility and control') {
    scores['management_accounts'].score += 30;
    scores['management_accounts'].triggers.push('Priority: financial visibility');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // BENCHMARKING SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (benchmarkAwareness === 'No - Id love to know but dont have access') {
    scores['benchmarking'].score += 40;
    scores['benchmarking'].triggers.push('Wants benchmarking but lacks access');
  } else if (benchmarkAwareness === 'Never considered it') {
    scores['benchmarking'].score += 25;
    scores['benchmarking'].triggers.push('Never considered benchmarking');
  } else if (benchmarkAwareness === 'Roughly - I have a general sense') {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('Only rough sense of market position');
  }
  
  if (suspectedTruth.includes('underperform') || suspectedTruth.includes('behind') ||
      suspectedTruth.includes('compared') || suspectedTruth.includes('competitor') ||
      suspectedTruth.includes('industry') || suspectedTruth.includes('average')) {
    scores['benchmarking'].score += 20;
    scores['benchmarking'].triggers.push('Suspects market underperformance');
  }
  
  if (['No idea - its never come up', 
       'I try not to think about it'].includes(valuationUnderstanding)) {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('No valuation understanding');
  }
  
  if (coreFrustration.includes('price') || coreFrustration.includes('compet') ||
      coreFrustration.includes('market') || coreFrustration.includes('rate')) {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('Frustration with competitive positioning');
  }

  // ═══════════════════════════════════════════════════════════════
  // SYSTEMS AUDIT SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (['Chaos - Im essential to everything',
       'Significant problems - but wouldnt collapse'].includes(founderDep)) {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Founder dependency: "${founderDep}"`);
  }
  
  if (['Significant - probably 30-50%', 
       'Too much - over half our effort is manual'].includes(manualWork)) {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Manual work: "${manualWork}"`);
    scores['automation'].score += 30;
    scores['automation'].triggers.push(`High manual work: "${manualWork}"`);
  } else if (manualWork === 'I dont know - never measured it') {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push('Unknown manual work level');
  }
  
  if (['Days later - when problems compound',
       'Often too late - when customers complain',
       'Were often blindsided'].includes(problemSpeed)) {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push(`Slow problem detection: "${problemSpeed}"`);
  }
  
  if (['Disaster - the business would struggle badly',
       'Major disruption for 6+ months'].includes(keyPersonDep)) {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push(`Key person risk: "${keyPersonDep}"`);
  }
  
  if (['90% firefighting / 10% strategic',
       '70% firefighting / 30% strategic'].includes(timeAllocation)) {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push(`Firefighting: "${timeAllocation}"`);
  }
  
  if (scalingVuln === 'Operational processes') {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push('Operations would break on scaling');
  }
  
  if (['Poor - I struggle to let go',
       'Terrible - I end up doing everything myself'].includes(delegationAbility)) {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push(`Delegation issues: "${delegationAbility}"`);
  }
  
  if (priorityArea === 'Building a business that runs without me' ||
      priorityArea === 'Scaling without scaling the chaos') {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Priority: "${priorityArea}"`);
  }
  
  if (operationalFrustration.includes('manual') || operationalFrustration.includes('process') ||
      operationalFrustration.includes('system') || operationalFrustration.includes('repeat')) {
    scores['systems_audit'].score += 15;
    scores['automation'].score += 15;
    scores['systems_audit'].triggers.push('Operational frustration with processes');
    scores['automation'].triggers.push('Frustration suggests automation opportunity');
  }

  // ═══════════════════════════════════════════════════════════════
  // FRACTIONAL CFO SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (scalingVuln === 'Financial systems and controls') {
    scores['fractional_cfo'].score += 30;
    scores['fractional_cfo'].triggers.push('Financial systems would break on scaling');
  }
  
  if (growthBlocker === 'Dont have the capital') {
    scores['fractional_cfo'].score += 20;
    scores['fractional_cfo'].triggers.push('Capital constraint');
  }
  
  if (['Uncertain - Im often surprised', 
       'Not confident - I mostly guess'].includes(financialConfidence) &&
      ['50-60 hours', '60-70 hours', '70+ hours'].includes(weeklyHours)) {
    scores['fractional_cfo'].score += 15;
    scores['fractional_cfo'].triggers.push('Founder stretched with financial uncertainty');
  }
  
  if (['Friends or family (not business experts)',
       'I figure it out myself',
       'I avoid major decisions'].includes(decisionSupport)) {
    scores['fractional_cfo'].score += 15;
    scores['fractional_cfo'].triggers.push('Lacks strategic financial advice');
  }

  // ═══════════════════════════════════════════════════════════════
  // FRACTIONAL COO SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (scalingConstraint === 'My team - were stretched thin') {
    scores['fractional_coo'].score += 25;
    scores['fractional_coo'].triggers.push('Team stretched thin');
  }
  
  if (scalingConstraint === 'My personal capacity - Im already maxed') {
    scores['fractional_coo'].score += 20;
    scores['365_method'].score += 10;
    scores['fractional_coo'].triggers.push('Personal capacity maxed');
  }
  
  if (['Finding good people to hire',
       'Developing future leaders',
       'Managing performance',
       'Getting the best from current team'].includes(peopleChallenge)) {
    scores['fractional_coo'].score += 20;
    scores['fractional_coo'].triggers.push(`People challenge: "${peopleChallenge}"`);
  }
  
  if (scalingVuln === 'Team capacity' || scalingVuln === 'My personal capacity') {
    scores['fractional_coo'].score += 20;
    scores['fractional_coo'].triggers.push('Team/capacity would break on scaling');
  }
  
  if (['1-3: Major concerns', '4-5: Some good people but significant gaps'].includes(teamConfidence)) {
    scores['fractional_coo'].score += 15;
    scores['fractional_coo'].triggers.push(`Team confidence: "${teamConfidence}"`);
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS ADVISORY SCORING
  // ═══════════════════════════════════════════════════════════════
  
  if (['Already exploring options',
       '1-3 years - actively preparing',
       '3-5 years - need to start thinking'].includes(exitTimeline)) {
    scores['business_advisory'].score += 30;
    scores['business_advisory'].triggers.push(`Exit timeline: "${exitTimeline}"`);
  }
  
  if (['It would take weeks to pull together',
       'Months - things are scattered',
       'I dont know where to start'].includes(docReadiness)) {
    scores['business_advisory'].score += 20;
    scores['business_advisory'].triggers.push(`Documentation: "${docReadiness}"`);
  }
  
  if (priorityArea === 'Protecting the value Ive built') {
    scores['business_advisory'].score += 30;
    scores['business_advisory'].triggers.push('Priority: value protection');
  }
  
  if (successDef === 'Building something I can sell for a life-changing amount') {
    scores['business_advisory'].score += 20;
    scores['business_advisory'].triggers.push('Success defined as exit');
  }
  
  if (exitMindset === 'Ive already got a clear exit plan') {
    scores['business_advisory'].score += 15;
    scores['business_advisory'].triggers.push('Already has exit plan - needs advisory support');
  }

  // ═══════════════════════════════════════════════════════════════
  // NORMALIZE AND PRIORITIZE
  // ═══════════════════════════════════════════════════════════════
  
  const results = Object.values(scores)
    .map(s => ({
      ...s,
      score: Math.min(100, s.score),
      confidence: Math.min(100, s.triggers.length * 20),
    }))
    .sort((a, b) => b.score - a.score);
  
  let priority = 1;
  for (const service of results) {
    if (service.score >= 50) {
      service.priority = priority++;
    } else if (service.score >= 30) {
      service.priority = Math.max(3, priority++);
    } else {
      service.priority = 5;
    }
  }
  
  return results;
}

// ============================================================================
// DESTINATION CLARITY FALLBACK CALCULATION
// ============================================================================

function calculateFallbackClarity(responses: Record<string, any>): number {
  const vision = responses.dd_five_year_vision || responses.dd_five_year_picture || '';
  
  if (!vision || vision.length < 20) return 1;
  
  let score = 0;
  
  // Time specificity (mentions times, days, routines)
  if (/\d{1,2}(am|pm|:\d{2})|0\d{3}/i.test(vision)) score += 2;
  if (/morning|afternoon|evening|night/i.test(vision)) score += 1;
  
  // Activity richness (verbs indicating actions)
  const activities = vision.match(/\b(wake|run|walk|take|drive|meet|call|play|work|travel|read|grab|head|pick|have|spend)\b/gi);
  score += Math.min((activities?.length || 0), 3);
  
  // Relationship mentions
  if (/wife|husband|partner|kids|children|boys|girls|family|friends|mates/i.test(vision)) score += 2;
  
  // Role transformation indicators
  if (/invest|portfolio|board|advisor|chairman|step back|ceo/i.test(vision)) score += 2;
  
  // Length and detail
  if (vision.length > 100) score += 1;
  if (vision.length > 200) score += 1;
  
  return Math.min(score, 10);
}

// ============================================================================
// AFFORDABILITY ASSESSMENT
// ============================================================================

interface AffordabilityProfile {
  stage: 'pre-revenue' | 'early-revenue' | 'established' | 'scaling';
  cashConstrained: boolean;
  activelyRaising: boolean;
  estimatedMonthlyCapacity: 'under_1k' | '1k_5k' | '5k_15k' | '15k_plus';
}

function assessAffordability(
  responses: Record<string, any>,
  financialContext?: any
): AffordabilityProfile {
  
  let stage: AffordabilityProfile['stage'] = 'established';
  
  // Check for pre-revenue signals
  const operationalFrustration = (responses.sd_operational_frustration || '').toLowerCase();
  if (operationalFrustration.includes('mvp') || 
      operationalFrustration.includes('launch') ||
      operationalFrustration.includes('product-market') ||
      operationalFrustration.includes('pre-revenue')) {
    stage = 'pre-revenue';
  }
  
  // Check for early-revenue signals
  if (responses.sd_growth_blocker === "Don't have the capital" &&
      !operationalFrustration.includes('mvp')) {
    stage = stage === 'pre-revenue' ? 'pre-revenue' : 'early-revenue';
  }
  
  // Override with financial context if available
  if (financialContext?.revenue) {
    if (financialContext.revenue < 100000) stage = 'pre-revenue';
    else if (financialContext.revenue < 500000) stage = 'early-revenue';
    else if (financialContext.revenue < 2000000) stage = 'established';
    else stage = 'scaling';
  }
  
  // Cash constraint detection
  const sleepThieves = responses.dd_sleep_thieves || responses.dd_sleep_thief || [];
  const sleepArray = Array.isArray(sleepThieves) ? sleepThieves : [sleepThieves];
  const cashConstrained = 
    responses.sd_growth_blocker === "Don't have the capital" ||
    sleepArray.some((s: string) => s && s.includes('Cash flow and paying bills'));
  
  // Fundraising detection
  const ifIKnew = (responses.dd_suspected_truth || responses.dd_if_i_knew || '').toLowerCase();
  const activelyRaising = 
    ifIKnew.includes('capital') ||
    ifIKnew.includes('raise') ||
    ifIKnew.includes('invest') ||
    (responses.sd_exit_readiness || '').includes('investment-ready');
  
  // Estimate monthly capacity
  let estimatedMonthlyCapacity: AffordabilityProfile['estimatedMonthlyCapacity'];
  
  switch (stage) {
    case 'pre-revenue':
      estimatedMonthlyCapacity = activelyRaising ? '1k_5k' : 'under_1k';
      break;
    case 'early-revenue':
      estimatedMonthlyCapacity = cashConstrained ? '1k_5k' : '5k_15k';
      break;
    case 'established':
      estimatedMonthlyCapacity = '5k_15k';
      break;
    case 'scaling':
      estimatedMonthlyCapacity = '15k_plus';
      break;
  }
  
  return { stage, cashConstrained, activelyRaising, estimatedMonthlyCapacity };
}

// ============================================================================
// GOAL ALIGNMENT TRANSFORMATION DETECTION
// ============================================================================

interface TransformationSignals {
  lifestyleTransformation: boolean;
  identityShift: boolean;
  burnoutWithReadiness: boolean;
  legacyFocus: boolean;
  reasons: string[];
}

function detect365Triggers(responses: Record<string, any>): TransformationSignals {
  const visionText = ((responses.dd_five_year_vision || responses.dd_five_year_picture || '')).toLowerCase();
  const successDef = responses.dd_success_definition || '';
  const reasons: string[] = [];
  
  // Lifestyle transformation: Vision describes fundamentally different role
  const lifestyleTransformation = 
    visionText.includes('invest') ||
    visionText.includes('portfolio') ||
    visionText.includes('advisory') ||
    visionText.includes('board') ||
    visionText.includes('chairman') ||
    visionText.includes('step back') ||
    (visionText.includes('ceo') && !visionText.includes('my ceo'));
  
  if (lifestyleTransformation) {
    reasons.push('Vision describes fundamentally different role (operator to investor transition)');
  }
  
  // Identity shift: Success defined as business running without them
  const identityShift = 
    successDef === "Creating a business that runs profitably without me" ||
    successDef === "Building a legacy that outlasts me" ||
    successDef === "Building something I can sell for a life-changing amount";
  
  if (identityShift) {
    reasons.push(`Success defined as "${successDef}" requires structured transition support`);
  }
  
  // Burnout with high readiness
  const weeklyHours = responses.dd_owner_hours || responses.dd_weekly_hours || '';
  const burnoutWithReadiness = 
    ['60-70 hours', '70+ hours'].includes(weeklyHours) &&
    responses.dd_change_readiness === "Completely ready - I'll do whatever it takes";
  
  if (burnoutWithReadiness) {
    reasons.push('Working 60-70+ hours but completely ready for change, needs structured pathway');
  }
  
  // Legacy focus
  const legacyFocus = 
    successDef.includes('legacy') ||
    responses.dd_exit_thoughts === "I've already got a clear exit plan" ||
    ['1-3 years - actively preparing', '3-5 years - need to start thinking'].includes(responses.sd_exit_timeline || '');
  
  if (legacyFocus) {
    reasons.push('Legacy or exit focus requires strategic roadmap');
  }
  
  return { lifestyleTransformation, identityShift, burnoutWithReadiness, legacyFocus, reasons };
}

// ============================================================================
// INTELLIGENT DOCUMENT EXTRACTION (LLM-Based)
// ============================================================================

interface ExtractedProjections {
  hasProjections: boolean;
  currentRevenue?: number;
  projectedRevenue?: { year: number; amount: number }[];
  grossMargin?: number;
  year5Revenue?: number;
  growthMultiple?: number;
  teamGrowth?: { current: number; projected: number };
  ebitdaMargin?: { year1?: number; year5?: number };
  customerMetrics?: { year1?: number; year5?: number };
  rawInsights?: string;
}

interface DocumentInsights {
  financialProjections: ExtractedProjections;
  businessContext: {
    stage: 'pre-revenue' | 'early-revenue' | 'growth' | 'established' | 'unknown';
    model?: string;
    fundingStatus?: string;
    launchTimeline?: string;
    keyRisks?: string[];
    keyStrengths?: string[];
  };
  relevantQuotes: string[];
}

async function extractDocumentInsights(
  documents: any[],
  openrouterKey: string
): Promise<DocumentInsights> {
  
  const emptyResult: DocumentInsights = {
    financialProjections: { hasProjections: false },
    businessContext: { stage: 'unknown' },
    relevantQuotes: []
  };
  
  if (!documents || documents.length === 0) {
    console.log('[DocExtract] No documents to process');
    return emptyResult;
  }
  
  // Combine all document content
  const documentContent = documents.map((doc, i) => {
    const content = doc.content || doc.text || '';
    if (!content) return '';
    return `\n--- DOCUMENT ${i + 1}: ${doc.fileName || 'Unnamed'} ---\n${content}\n`;
  }).filter(Boolean).join('\n');
  
  if (!documentContent || documentContent.length < 50) {
    console.log('[DocExtract] Insufficient document content');
    return emptyResult;
  }
  
  console.log('[DocExtract] Processing documents, total content length:', documentContent.length);
  
  const extractionPrompt = `You are a financial analyst extracting structured data from business documents.

Analyze the following document(s) and extract ALL financial and business information you can find.

<documents>
${documentContent}
</documents>

Return a JSON object with this EXACT structure (use null for missing data, not empty strings):

{
  "financialProjections": {
    "hasProjections": true/false,
    "projectedRevenue": [
      { "year": 1, "amount": 559000 },
      { "year": 2, "amount": 3100000 },
      ...
    ],
    "currentRevenue": <number or null - Year 1 revenue>,
    "year5Revenue": <number or null>,
    "growthMultiple": <number or null - e.g., 41 for 41x growth>,
    "grossMargin": <decimal 0-1, e.g., 0.90 for 90%>,
    "ebitdaMargin": {
      "year1": <decimal or null>,
      "year5": <decimal or null>
    },
    "teamGrowth": {
      "current": <number>,
      "projected": <number - Year 5 team size>
    },
    "customerMetrics": {
      "year1": <number or null>,
      "year5": <number or null>
    }
  },
  "businessContext": {
    "stage": "pre-revenue" | "early-revenue" | "growth" | "established",
    "model": "<business model description, e.g., 'B2B SaaS with Pro and Enterprise tiers'>",
    "fundingStatus": "<e.g., 'Raised £1m seed' or null>",
    "launchTimeline": "<e.g., 'Launching January 2025' or null>",
    "keyStrengths": ["<strength 1>", "<strength 2>"],
    "keyRisks": ["<risk 1>", "<risk 2>"]
  },
  "relevantQuotes": [
    "<any specific numbers or statements worth quoting directly>"
  ]
}

CRITICAL RULES:
1. All monetary amounts should be in GBP (£) as raw numbers (559000 not "£559K")
2. Percentages as decimals (0.90 not 90 or "90%")
3. If you can calculate growth multiple (Year5/Year1), include it
4. If data is ambiguous or missing, use null
5. Return ONLY valid JSON, no markdown, no explanation

Extract everything you can find - revenue, margins, team size, customer counts, growth rates, pricing, churn, etc.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Document Extraction',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5', // Better extraction quality
        max_tokens: 4000, // Increased to prevent truncation
        temperature: 0.1, // Low temp for consistent extraction
        messages: [
          { role: 'user', content: extractionPrompt }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error('[DocExtract] API error:', response.status, await response.text());
      return emptyResult;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[DocExtract] Raw extraction response length:', content.length);
    
    // Parse the JSON response with robust extraction
    let extracted: DocumentInsights;
    try {
      let jsonString = content.trim();
      
      // Method 1: Extract from code block if present (handles ```json ... ```)
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        console.log('[DocExtract] Extracted from code block');
      } else {
        // Method 2: Manual removal of fences at start/end
        jsonString = jsonString.replace(/^```(?:json)?\s*\n?/i, '');
        jsonString = jsonString.replace(/\n?```\s*$/g, '');
        jsonString = jsonString.trim();
      }
      
      // Method 3: Find JSON object start if still not clean
      if (!jsonString.startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart !== -1) {
          jsonString = jsonString.substring(jsonStart);
          console.log('[DocExtract] Found JSON start at position', jsonStart);
        }
      }
      
      // Method 4: Find the matching closing brace using brace counting
      if (jsonString.startsWith('{')) {
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonString.length; i++) {
          if (jsonString[i] === '{') braceCount++;
          if (jsonString[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        if (jsonEnd !== -1 && jsonEnd < jsonString.length - 1) {
          jsonString = jsonString.substring(0, jsonEnd + 1);
          console.log('[DocExtract] Trimmed to valid JSON ending at position', jsonEnd);
        }
      }
      
      console.log('[DocExtract] Cleaned JSON length:', jsonString.length, 'preview:', jsonString.substring(0, 100));
      
      extracted = JSON.parse(jsonString);
      
      // Validate structure
      if (!extracted.financialProjections) {
        extracted.financialProjections = { hasProjections: false };
      }
      if (!extracted.businessContext) {
        extracted.businessContext = { stage: 'unknown' };
      }
      if (!extracted.relevantQuotes) {
        extracted.relevantQuotes = [];
      }
      
      // Calculate growth multiple if we have the data but it wasn't calculated
      if (extracted.financialProjections.projectedRevenue?.length >= 2) {
        const revenues = extracted.financialProjections.projectedRevenue;
        const year1 = revenues.find(r => r.year === 1)?.amount;
        const year5 = revenues.find(r => r.year === 5)?.amount;
        
        if (year1 && year5 && !extracted.financialProjections.growthMultiple) {
          extracted.financialProjections.growthMultiple = Math.round(year5 / year1);
        }
        if (year1) extracted.financialProjections.currentRevenue = year1;
        if (year5) extracted.financialProjections.year5Revenue = year5;
        
        extracted.financialProjections.hasProjections = true;
      }
      
      console.log('[DocExtract] Successfully extracted:', {
        hasProjections: extracted.financialProjections.hasProjections,
        revenueYears: extracted.financialProjections.projectedRevenue?.length || 0,
        growthMultiple: extracted.financialProjections.growthMultiple,
        businessStage: extracted.businessContext.stage
      });
      
      return extracted;
      
    } catch (parseError: any) {
      console.error('[DocExtract] JSON parse error:', parseError.message);
      console.error('[DocExtract] Raw content (first 500):', content.substring(0, 500));
      
      // Fallback: Try to extract key data using regex
      try {
        const hasProjectionsMatch = content.match(/"hasProjections"\s*:\s*(true|false)/);
        const year1Match = content.match(/"year"\s*:\s*1\s*,\s*"amount"\s*:\s*(\d+)/);
        const year5Match = content.match(/"year"\s*:\s*5\s*,\s*"amount"\s*:\s*(\d+)/);
        const grossMarginMatch = content.match(/"grossMargin"\s*:\s*([\d.]+)/);
        
        if (hasProjectionsMatch && year1Match) {
          console.log('[DocExtract] Fallback regex extraction succeeded');
          const year1 = parseInt(year1Match[1]);
          const year5 = year5Match ? parseInt(year5Match[1]) : undefined;
          const grossMargin = grossMarginMatch ? parseFloat(grossMarginMatch[1]) : undefined;
          
          return {
            financialProjections: {
              hasProjections: true,
              currentRevenue: year1,
              year5Revenue: year5,
              growthMultiple: year5 && year1 ? Math.round(year5 / year1) : undefined,
              grossMargin: grossMargin
            },
            businessContext: { stage: 'unknown' },
            relevantQuotes: []
          };
        }
      } catch (fallbackError) {
        console.error('[DocExtract] Fallback extraction also failed');
      }
      
      return emptyResult;
    }
    
  } catch (error) {
    console.error('[DocExtract] Extraction error:', error);
    return emptyResult;
  }
}

// Build context string for the main prompt
function buildDocumentInsightsContext(insights: DocumentInsights): string {
  if (!insights.financialProjections.hasProjections && insights.businessContext.stage === 'unknown') {
    return '';
  }
  
  const fp = insights.financialProjections;
  const bc = insights.businessContext;
  
  let context = `\n## EXTRACTED DOCUMENT INSIGHTS (LLM-Parsed)\n`;
  
  if (fp.hasProjections) {
    context += `\n### Financial Projections\n`;
    
    if (fp.projectedRevenue && fp.projectedRevenue.length > 0) {
      context += `Revenue Trajectory:\n`;
      fp.projectedRevenue.forEach(r => {
        const formatted = r.amount >= 1000000 
          ? `£${(r.amount / 1000000).toFixed(1)}M`
          : `£${(r.amount / 1000).toFixed(0)}K`;
        context += `- Year ${r.year}: ${formatted}\n`;
      });
    }
    
    if (fp.growthMultiple) {
      context += `\nGrowth Multiple: ${fp.growthMultiple}x over 5 years\n`;
    }
    
    if (fp.grossMargin) {
      context += `Gross Margin: ${(fp.grossMargin * 100).toFixed(0)}%\n`;
    }
    
    if (fp.ebitdaMargin?.year1 || fp.ebitdaMargin?.year5) {
      context += `EBITDA Margin: ${fp.ebitdaMargin.year1 ? (fp.ebitdaMargin.year1 * 100).toFixed(0) + '% Y1' : ''} ${fp.ebitdaMargin.year5 ? '→ ' + (fp.ebitdaMargin.year5 * 100).toFixed(0) + '% Y5' : ''}\n`;
    }
    
    if (fp.teamGrowth?.current && fp.teamGrowth?.projected) {
      context += `Team Growth: ${fp.teamGrowth.current} → ${fp.teamGrowth.projected} people\n`;
    }
    
    if (fp.customerMetrics?.year1 || fp.customerMetrics?.year5) {
      context += `Customers: ${fp.customerMetrics.year1 || '?'} Y1 → ${fp.customerMetrics.year5 || '?'} Y5\n`;
    }
    
    // Investment context calculations
    if (fp.currentRevenue && fp.currentRevenue > 0) {
      const phase1Investment = 13300; // Could be dynamic
      const pctOfRevenue = ((phase1Investment / fp.currentRevenue) * 100).toFixed(1);
      context += `\n### Investment Context\n`;
      context += `- Phase 1 investment (£${phase1Investment.toLocaleString()}) = ${pctOfRevenue}% of Year 1 revenue\n`;
      
      if (fp.grossMargin && fp.grossMargin > 0.5) {
        context += `- At ${(fp.grossMargin * 100).toFixed(0)}% gross margin, efficiency gains go almost straight to profit\n`;
      }
      
      if (fp.year5Revenue && fp.year5Revenue > 1000000) {
        const y5m = fp.year5Revenue / 1000000;
        const founderDependent = y5m * 6;
        const systemised = y5m * 12;
        context += `- At Year 5 £${y5m.toFixed(1)}M ARR:\n`;
        context += `  - Founder-dependent (6x): £${founderDependent.toFixed(0)}M valuation\n`;
        context += `  - Systemised (12x): £${systemised.toFixed(0)}M valuation\n`;
        context += `  - Infrastructure delta: £${(systemised - founderDependent).toFixed(0)}M additional value\n`;
      }
    }
  }
  
  if (bc.stage !== 'unknown') {
    context += `\n### Business Context\n`;
    context += `- Stage: ${bc.stage}\n`;
    if (bc.model) context += `- Model: ${bc.model}\n`;
    if (bc.fundingStatus) context += `- Funding: ${bc.fundingStatus}\n`;
    if (bc.launchTimeline) context += `- Timeline: ${bc.launchTimeline}\n`;
    if (bc.keyStrengths?.length) context += `- Strengths: ${bc.keyStrengths.join(', ')}\n`;
    if (bc.keyRisks?.length) context += `- Risks: ${bc.keyRisks.join(', ')}\n`;
  }
  
  if (insights.relevantQuotes?.length > 0) {
    context += `\n### Key Data Points\n`;
    insights.relevantQuotes.slice(0, 5).forEach(q => {
      context += `- "${q}"\n`;
    });
  }
  
  context += `\n### How to Use This Data\n`;
  context += `1. Reference specific projections to show you understand their business\n`;
  context += `2. Calculate investment as % of their actual revenue\n`;
  context += `3. Show valuation impact using their growth trajectory\n`;
  context += `4. Connect efficiency gains to their margins\n`;
  context += `5. Quote specific numbers to build credibility\n`;
  
  return context;
}

// ============================================================================
// FINANCIAL DATA EXTRACTION FROM UPLOADED ACCOUNTS
// ============================================================================

interface ExtractedFinancials {
  hasAccounts: boolean;
  source: 'statutory_accounts' | 'management_accounts' | 'projection' | 'unknown';
  yearEnd?: string;
  
  // P&L Data
  turnover?: number;
  turnoverPriorYear?: number;
  turnoverGrowth?: number;
  grossProfit?: number;
  grossMarginPct?: number;
  operatingProfit?: number;
  operatingMarginPct?: number;
  profitBeforeTax?: number;
  profitAfterTax?: number;
  
  // Cost of Sales (separate from Staff Costs!)
  costOfSales?: number;
  
  // Staff Costs (critical for payroll analysis)
  totalStaffCosts?: number;
  directorsSalaries?: number;
  staffWages?: number;
  employerNI?: number;
  pensionCosts?: number;
  staffCostsPercentOfRevenue?: number;
  
  // Staff costs breakdown for validation
  staffCostsBreakdown?: {
    cosWages?: number;
    directorsSalaries?: number;
    adminStaffSalaries?: number;
    employerNI?: number;
    pensionCosts?: number;
    otherStaffCosts?: number;
  };
  staffCostsCorrected?: boolean;
  staffCostsUnreliable?: boolean;
  
  // Balance Sheet
  netAssets?: number;
  cash?: number;
  debtors?: number;
  creditors?: number;
  fixedAssets?: number;
  freeholdProperty?: number;
  
  // Calculated Metrics
  ebitda?: number;
  revenuePerEmployee?: number;
  employeeCount?: number;
  depreciation?: number;
  
  // Comparison Data
  priorYearData?: Partial<ExtractedFinancials>;
}

async function extractFinancialsFromAccounts(
  documents: any[],
  openrouterKey: string
): Promise<ExtractedFinancials> {
  
  const emptyResult: ExtractedFinancials = { hasAccounts: false, source: 'unknown' };
  
  if (!documents || documents.length === 0) {
    console.log('[FinancialExtract] No documents to process');
    return emptyResult;
  }
  
  // Filter for financial documents
  const financialDocs = documents.filter(doc => {
    const name = (doc.fileName || '').toLowerCase();
    const content = (doc.content || doc.text || '').toLowerCase();
    return name.includes('account') || 
           name.includes('financial') ||
           name.includes('statement') ||
           content.includes('profit and loss') ||
           content.includes('balance sheet') ||
           content.includes('turnover') ||
           content.includes('total assets') ||
           content.includes('directors\' report');
  });
  
  if (financialDocs.length === 0) {
    console.log('[FinancialExtract] No financial documents found');
    return emptyResult;
  }
  
  const documentContent = financialDocs.map((doc, i) => {
    const content = doc.content || doc.text || '';
    return `\n--- DOCUMENT ${i + 1}: ${doc.fileName || 'Unnamed'} ---\n${content}\n`;
  }).join('\n');
  
  console.log('[FinancialExtract] Processing financial documents, content length:', documentContent.length);
  
  const extractionPrompt = `You are a UK accountant extracting financial data from company accounts.

Analyse the following document(s) and extract ALL financial figures you can find.

<documents>
${documentContent}
</documents>

============================================================================
⚠️ CRITICAL: STAFF COSTS vs COST OF SALES - DO NOT CONFUSE THESE
============================================================================

"Cost of Sales" is NOT the same as "Staff Costs"!

COST OF SALES typically includes:
- Raw materials, stock purchased
- Direct production costs
- Carriage/freight
- SOME wages may appear here (production wages)

TOTAL STAFF COSTS must include ALL employment costs from EVERYWHERE:
- Directors' salaries/remuneration (often in Admin or Notes)
- Staff/employee salaries and wages (from Admin section)
- Production/COS wages (from Cost of Sales section if any)
- Employer National Insurance contributions
- Pension costs/contributions
- Staff welfare, training, other staff costs

EXAMPLE: If you see:
  Cost of Sales section: "Wages" = £301,119
  Admin section: "Directors salaries" = £180,028
  Admin section: "Staff salaries" = £264,156
  Admin section: "Employer NI" = £68,450
  Admin section: "Pension" = £17,251
  Admin section: "Staff welfare" = £7,108
  
THEN totalStaffCosts = £301,119 + £180,028 + £264,156 + £68,450 + £17,251 + £7,108 = £838,112
NOT just the Cost of Sales figure!

============================================================================

Return a JSON object with this EXACT structure. Use null for any data not found:

{
  "hasAccounts": true,
  "source": "statutory_accounts" | "management_accounts" | "projection",
  "yearEnd": "YYYY-MM-DD or null",
  
  "turnover": <number in £>,
  "turnoverPriorYear": <number in £>,
  "costOfSales": <number - the Cost of Sales LINE TOTAL, NOT staff costs>,
  "grossProfit": <number in £>,
  "grossMarginPct": <decimal 0-100>,
  "operatingProfit": <number in £>,
  "operatingMarginPct": <decimal 0-100>,
  "profitBeforeTax": <number in £>,
  "profitAfterTax": <number in £>,
  
  "totalStaffCosts": <number - SUM of ALL payroll items from ALL sections>,
  "staffCostsBreakdown": {
    "cosWages": <wages from Cost of Sales section, or 0 if none>,
    "directorsSalaries": <directors salaries/remuneration>,
    "adminStaffSalaries": <staff salaries from Admin section>,
    "employerNI": <employer NI contributions>,
    "pensionCosts": <pension contributions>,
    "otherStaffCosts": <welfare, training, etc>
  },
  "directorsSalaries": <number>,
  "staffWages": <number - non-director wages including COS wages>,
  "employerNI": <number>,
  "pensionCosts": <number>,
  
  "netAssets": <number>,
  "cash": <number>,
  "fixedAssets": <number>,
  "freeholdProperty": <number if property owned>,
  
  "employeeCount": <number>,
  "depreciation": <number if available>
}

CRITICAL EXTRACTION RULES:
1. totalStaffCosts MUST be the SUM of all payroll line items from BOTH COS and Admin sections
2. totalStaffCosts should typically be 25-50% of turnover (if > 50%, double-check!)
3. DO NOT put costOfSales as totalStaffCosts - these are DIFFERENT things
4. Look in the detailed P&L schedules/notes, not just the summary
5. Convert all figures to raw numbers (2,277,603 not "£2.28m")
6. If totalStaffCosts differs from sum of staffCostsBreakdown, USE THE SUM
7. Return ONLY valid JSON, no markdown, no explanation`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Financial Extraction',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{ role: 'user', content: extractionPrompt }]
      }),
    });
    
    if (!response.ok) {
      console.error('[FinancialExtract] API error:', response.status);
      return emptyResult;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON with robust extraction
    let jsonString = content.trim();
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
    
    if (!jsonString.startsWith('{')) {
      const jsonStart = jsonString.indexOf('{');
      if (jsonStart !== -1) {
        jsonString = jsonString.substring(jsonStart);
      }
    }
    
    // Find matching closing brace
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === '{') braceCount++;
      if (jsonString[i] === '}') braceCount--;
      if (braceCount === 0) { jsonEnd = i; break; }
    }
    if (jsonEnd !== -1) {
      jsonString = jsonString.substring(0, jsonEnd + 1);
    }
    
    const extracted = JSON.parse(jsonString);
    
    // Calculate derived metrics
    if (extracted.turnover && extracted.totalStaffCosts) {
      extracted.staffCostsPercentOfRevenue = 
        Math.round((extracted.totalStaffCosts / extracted.turnover) * 1000) / 10;
    }
    
    if (extracted.turnover && extracted.employeeCount) {
      extracted.revenuePerEmployee = 
        Math.round(extracted.turnover / extracted.employeeCount);
    }
    
    if (extracted.operatingProfit && extracted.depreciation) {
      extracted.ebitda = extracted.operatingProfit + extracted.depreciation;
    } else if (extracted.operatingProfit) {
      // Estimate depreciation at 5-10% of fixed assets if not provided
      const estDepreciation = (extracted.fixedAssets || 0) * 0.07;
      extracted.ebitda = extracted.operatingProfit + estDepreciation;
    }
    
    if (extracted.turnover && extracted.turnoverPriorYear) {
      extracted.turnoverGrowth = 
        Math.round(((extracted.turnover / extracted.turnoverPriorYear) - 1) * 1000) / 10;
    }
    
    // ========================================================================
    // VALIDATION: Check for common extraction errors
    // ========================================================================
    
    // Validate staff costs - check if Cost of Sales was accidentally used
    if (extracted.totalStaffCosts && extracted.turnover) {
      const staffPct = (extracted.totalStaffCosts / extracted.turnover) * 100;
      
      // If staff costs > 45% of turnover, verify against breakdown
      if (staffPct > 45) {
        console.warn(`[FinancialExtract] ⚠️ Staff costs ${staffPct.toFixed(1)}% of turnover seems high - validating...`);
        
        // If we have a breakdown, recalculate from components
        if (extracted.staffCostsBreakdown) {
          const breakdown = extracted.staffCostsBreakdown;
          const recalculated = 
            (breakdown.cosWages || 0) +
            (breakdown.directorsSalaries || 0) +
            (breakdown.adminStaffSalaries || 0) +
            (breakdown.employerNI || 0) +
            (breakdown.pensionCosts || 0) +
            (breakdown.otherStaffCosts || 0);
          
          if (recalculated > 0) {
            const recalcPct = (recalculated / extracted.turnover) * 100;
            console.log(`[FinancialExtract] Breakdown sum: £${recalculated.toLocaleString()} (${recalcPct.toFixed(1)}%)`);
            console.log(`[FinancialExtract] LLM extracted: £${extracted.totalStaffCosts.toLocaleString()} (${staffPct.toFixed(1)}%)`);
            
            // If breakdown is significantly different and more reasonable, use it
            if (Math.abs(recalculated - extracted.totalStaffCosts) > 50000 && recalcPct < staffPct) {
              console.warn(`[FinancialExtract] ⚠️ CORRECTING: Using breakdown sum (£${recalculated.toLocaleString()}) instead of LLM value`);
              extracted.totalStaffCosts = recalculated;
              extracted.staffCostsPercentOfRevenue = Math.round(recalcPct * 10) / 10;
              extracted.staffCostsCorrected = true;
            }
          }
        }
        
        // Check if costOfSales was mistakenly used as totalStaffCosts
        if (extracted.costOfSales && 
            Math.abs(extracted.costOfSales - extracted.totalStaffCosts) < 10000) {
          console.error(`[FinancialExtract] ⚠️⚠️ CRITICAL: Cost of Sales (£${extracted.costOfSales.toLocaleString()}) appears to have been used as Staff Costs!`);
          // Mark as unreliable
          extracted.staffCostsUnreliable = true;
        }
      }
      
      // Log validation result
      const finalPct = extracted.staffCostsPercentOfRevenue || 
                       (extracted.totalStaffCosts / extracted.turnover) * 100;
      if (finalPct >= 25 && finalPct <= 50) {
        console.log(`[FinancialExtract] ✅ Staff costs ${finalPct.toFixed(1)}% - within normal range`);
      } else if (finalPct < 25) {
        console.log(`[FinancialExtract] ℹ️ Staff costs ${finalPct.toFixed(1)}% - below typical (possible automation-heavy business)`);
      } else {
        console.warn(`[FinancialExtract] ⚠️ Staff costs ${finalPct.toFixed(1)}% - above typical (verify extraction)`);
      }
    }
    
    console.log('[FinancialExtract] Successfully extracted:', {
      turnover: extracted.turnover,
      costOfSales: extracted.costOfSales,
      staffCosts: extracted.totalStaffCosts,
      staffCostsPct: extracted.staffCostsPercentOfRevenue,
      staffCostsCorrected: extracted.staffCostsCorrected || false,
      ebitda: extracted.ebitda,
      netAssets: extracted.netAssets
    });
    
    return extracted;
    
  } catch (error) {
    console.error('[FinancialExtract] Error:', error);
    return emptyResult;
  }
}

// ============================================================================
// INDUSTRY PAYROLL BENCHMARKS (UK SME)
// ============================================================================

const PAYROLL_BENCHMARKS: Record<string, { 
  typical: number; 
  good: number; 
  concern: number;
  notes: string;
}> = {
  // Distribution & Wholesale
  'distribution': { typical: 25, good: 20, concern: 35, notes: 'Labour-light, logistics-focused' },
  'wholesale': { typical: 22, good: 18, concern: 30, notes: 'Low touch, volume-based' },
  'key_cutting_locksmith': { typical: 30, good: 25, concern: 40, notes: 'Skilled labour required' },
  
  // Professional Services
  'consulting': { typical: 55, good: 45, concern: 70, notes: 'People ARE the product' },
  'accounting': { typical: 50, good: 40, concern: 65, notes: 'High skill, billable hours' },
  'legal': { typical: 55, good: 45, concern: 70, notes: 'Partner-heavy model' },
  
  // Technology
  'saas': { typical: 45, good: 35, concern: 60, notes: 'Engineering-heavy' },
  'it_services': { typical: 50, good: 40, concern: 65, notes: 'Consultants + support' },
  
  // Trades & Construction
  'construction': { typical: 35, good: 28, concern: 45, notes: 'Project-based labour' },
  'trades': { typical: 40, good: 32, concern: 50, notes: 'Skilled labour dependent' },
  
  // Retail & Hospitality
  'retail': { typical: 20, good: 15, concern: 30, notes: 'Volume-based, min wage' },
  'hospitality': { typical: 35, good: 28, concern: 45, notes: 'Service-heavy' },
  
  // Manufacturing
  'manufacturing': { typical: 30, good: 25, concern: 40, notes: 'Automation dependent' },
  
  // Default
  'general_business': { typical: 30, good: 25, concern: 40, notes: 'UK SME average' }
};

function getPayrollBenchmark(industry: string): typeof PAYROLL_BENCHMARKS['general_business'] {
  // Try exact match
  if (PAYROLL_BENCHMARKS[industry]) {
    return PAYROLL_BENCHMARKS[industry];
  }
  
  // Try partial match
  const lowerIndustry = (industry || '').toLowerCase();
  for (const [key, value] of Object.entries(PAYROLL_BENCHMARKS)) {
    if (lowerIndustry.includes(key) || key.includes(lowerIndustry)) {
      return value;
    }
  }
  
  // Additional keyword matches
  if (lowerIndustry.includes('key') || lowerIndustry.includes('lock') || lowerIndustry.includes('security')) {
    return PAYROLL_BENCHMARKS['key_cutting_locksmith'];
  }
  if (lowerIndustry.includes('distrib') || lowerIndustry.includes('supply')) {
    return PAYROLL_BENCHMARKS['distribution'];
  }
  if (lowerIndustry.includes('tech') || lowerIndustry.includes('software')) {
    return PAYROLL_BENCHMARKS['saas'];
  }
  if (lowerIndustry.includes('consult') || lowerIndustry.includes('service')) {
    return PAYROLL_BENCHMARKS['consulting'];
  }
  
  return PAYROLL_BENCHMARKS['general_business'];
}

interface PayrollAnalysis {
  isOverstaffed: boolean;
  excessPercentage: number;
  annualExcess: number;
  benchmark: typeof PAYROLL_BENCHMARKS['general_business'];
  assessment: 'efficient' | 'typical' | 'elevated' | 'concerning';
  calculation: string;
  // V2: Added validation and source data
  staffCosts: number;
  turnover: number;
  staffCostsPct: number;
  isValidated: boolean;
  validationErrors: string[];
}

function analysePayrollEfficiency(
  financials: ExtractedFinancials,
  industry: string
): PayrollAnalysis | null {
  
  const validationErrors: string[] = [];
  
  // ========================================================================
  // STEP 1: Validate we have required data
  // ========================================================================
  
  if (!financials.turnover || financials.turnover <= 0) {
    console.warn('[Payroll] No valid turnover figure');
    return null;
  }
  
  if (!financials.totalStaffCosts || financials.totalStaffCosts <= 0) {
    console.warn('[Payroll] No valid staff costs figure');
    return null;
  }
  
  const turnover = financials.turnover;
  const staffCosts = financials.totalStaffCosts;
  
  // ========================================================================
  // STEP 2: ALWAYS calculate percentage from source (ignore stored percentage)
  // ========================================================================
  
  const calculatedPct = (staffCosts / turnover) * 100;
  
  // Sanity check: percentage should be between 5% and 80%
  if (calculatedPct < 5 || calculatedPct > 80) {
    validationErrors.push(`Calculated staff costs % (${calculatedPct.toFixed(1)}%) outside reasonable range (5-80%)`);
  }
  
  // If financials already has a staffCostsPct, check if it matches
  if (financials.staffCostsPercentOfRevenue) {
    const storedPct = financials.staffCostsPercentOfRevenue;
    const difference = Math.abs(storedPct - calculatedPct);
    if (difference > 1) {
      validationErrors.push(`Stored percentage (${storedPct.toFixed(1)}%) differs from calculated (${calculatedPct.toFixed(1)}%) by ${difference.toFixed(1)}%. Using CALCULATED value.`);
      console.warn('[Payroll] ⚠️ PERCENTAGE MISMATCH:', {
        stored: storedPct.toFixed(1) + '%',
        calculated: calculatedPct.toFixed(1) + '%',
        difference: difference.toFixed(1) + '%',
        usingCalculated: true
      });
    }
  }
  
  // ALWAYS use calculated percentage to ensure accuracy
  const actualPct = calculatedPct;
  
  console.log('[Payroll] Validated calculation:', {
    staffCosts: `£${staffCosts.toLocaleString()}`,
    turnover: `£${turnover.toLocaleString()}`,
    calculated: `${actualPct.toFixed(1)}%`,
    formula: `${staffCosts} / ${turnover} * 100 = ${actualPct.toFixed(1)}%`
  });
  
  // ========================================================================
  // STEP 3: Get benchmark and calculate excess
  // ========================================================================
  
  const benchmark = getPayrollBenchmark(industry);
  const excessPct = actualPct - benchmark.typical;
  const annualExcess = Math.round((excessPct / 100) * turnover);
  
  // Validate excess makes sense
  if (annualExcess < 0) {
    // Below benchmark is fine, just cap at 0
    console.log('[Payroll] Staff costs below benchmark - no excess');
  } else if (annualExcess > staffCosts) {
    validationErrors.push(`Calculated excess (£${annualExcess.toLocaleString()}) exceeds total staff costs (£${staffCosts.toLocaleString()})`);
  }
  
  console.log('[Payroll] Excess calculation:', {
    actualPct: `${actualPct.toFixed(1)}%`,
    benchmarkTypical: `${benchmark.typical}%`,
    excessPct: `${excessPct.toFixed(1)}%`,
    excessAmount: `£${Math.max(0, annualExcess).toLocaleString()}`
  });
  
  // ========================================================================
  // STEP 4: Determine assessment
  // ========================================================================
  
  let assessment: PayrollAnalysis['assessment'];
  if (actualPct <= benchmark.good) {
    assessment = 'efficient';
  } else if (actualPct <= benchmark.typical) {
    assessment = 'typical';
  } else if (actualPct <= benchmark.concern) {
    assessment = 'elevated';
  } else {
    assessment = 'concerning';
  }
  
  // ========================================================================
  // STEP 5: Build detailed calculation string
  // ========================================================================
  
  const calculation = `Staff costs £${staffCosts.toLocaleString()} ÷ Turnover £${turnover.toLocaleString()} = ${actualPct.toFixed(1)}%. Industry benchmark for ${industry}: ${benchmark.good}-${benchmark.typical}% (typical), ${benchmark.concern}% (concern). Current ${actualPct.toFixed(1)}% is ${actualPct > benchmark.typical ? (actualPct - benchmark.typical).toFixed(1) + '% above' : 'within'} benchmark. Excess: £${Math.max(0, annualExcess).toLocaleString()}/year.`;
  
  const isValidated = validationErrors.length === 0;
  
  if (!isValidated) {
    console.error('[Payroll] ⚠️ VALIDATION ERRORS:', validationErrors);
  } else {
    console.log('[Payroll] ✅ All figures validated and consistent');
  }
  
  return {
    isOverstaffed: actualPct > benchmark.concern,
    excessPercentage: Math.round(excessPct * 10) / 10,
    annualExcess: Math.max(0, Math.round(annualExcess)), // Never negative
    benchmark,
    assessment,
    calculation,
    // V2 fields
    staffCosts,
    turnover,
    staffCostsPct: actualPct,
    isValidated,
    validationErrors
  };
}

// ============================================================================
// CLIENT STAGE & JOURNEY DETECTION
// ============================================================================

type ClientJourney = 
  | 'pre-revenue-building'      // No revenue yet, building product
  | 'early-stage-growing'       // < £500k, scaling up
  | 'established-scaling'       // £500k-£2m, growth focused
  | 'established-optimising'    // £1m+, efficiency focused
  | 'established-exit-focused'  // Profitable, planning exit
  | 'lifestyle-maintaining';    // Profitable, happy as-is

interface ClientStageProfile {
  journey: ClientJourney;
  focusAreas: string[];
  inappropriateServices: string[];
  keyMetrics: string[];
  journeyFraming: string;
}

function detectClientStage(
  responses: Record<string, any>,
  financials: ExtractedFinancials
): ClientStageProfile {
  
  const exitTimeline = responses.sd_exit_timeline || responses.dd_exit_mindset || '';
  const weeklyHours = responses.dd_owner_hours || responses.dd_weekly_hours || '';
  const founderDep = responses.sd_founder_dependency || '';
  const successDef = responses.dd_success_definition || '';
  const firefighting = responses.dd_time_breakdown || responses.dd_time_allocation || '';
  
  const hasRevenue = financials.turnover && financials.turnover > 100000;
  const isProfitable = financials.profitAfterTax && financials.profitAfterTax > 0;
  const hasAssets = financials.netAssets && financials.netAssets > 500000;
  const isHighMargin = financials.operatingMarginPct && financials.operatingMarginPct > 10;
  
  const wantsExit = exitTimeline.includes('1-3 years') || 
                    exitTimeline.includes('Already exploring') ||
                    exitTimeline.includes('actively preparing');
  const businessRunsWithoutFounder = founderDep.includes('run fine') || 
                                      founderDep.includes('Minor issues') ||
                                      weeklyHours.includes('Under 30');
  const highFirefighting = firefighting.includes('90%') || firefighting.includes('70%');
  const wantsLifestyle = successDef.includes('control over my time');
  
  // EXIT-FOCUSED: Profitable, approaching exit, business runs without them
  if (hasRevenue && isProfitable && wantsExit && businessRunsWithoutFounder) {
    return {
      journey: 'established-exit-focused',
      focusAreas: ['Exit preparation', 'Valuation optimisation', 'Efficiency gains', 'Succession'],
      inappropriateServices: ['systems_audit', 'automation', 'fractional_coo'],
      keyMetrics: ['EBITDA', 'Valuation multiple', 'Staff costs %', 'Asset backing'],
      journeyFraming: 'Your destination is a successful exit. The question is: what will maximise your value and ensure your team is taken care of?'
    };
  }
  
  // LIFESTYLE: Profitable, not scaling, wants time freedom
  if (hasRevenue && isProfitable && businessRunsWithoutFounder && wantsLifestyle && !wantsExit) {
    return {
      journey: 'lifestyle-maintaining',
      focusAreas: ['Maintain profitability', 'Protect time', 'Reduce stress'],
      inappropriateServices: ['fractional_cfo', 'fractional_coo', 'systems_audit'],
      keyMetrics: ['Profit margin', 'Hours worked', 'Cash position'],
      journeyFraming: 'You have built something that works. The goal is to keep it working without it consuming your life.'
    };
  }
  
  // OPTIMISING: Established, profitable, but inefficiencies or chaos
  if (hasRevenue && isProfitable && (highFirefighting || !businessRunsWithoutFounder)) {
    return {
      journey: 'established-optimising',
      focusAreas: ['Reduce founder dependency', 'Improve efficiency', 'Build systems'],
      inappropriateServices: [],
      keyMetrics: ['Hours in firefighting', 'Founder hours', 'Staff productivity'],
      journeyFraming: 'You have a profitable business trapped in operational chaos. The destination is a business that runs without you.'
    };
  }
  
  // SCALING: Revenue, some profit, growth focused
  if (hasRevenue && financials.turnover && financials.turnover < 2000000) {
    return {
      journey: 'established-scaling',
      focusAreas: ['Growth', 'Team building', 'Systems', 'Cash management'],
      inappropriateServices: ['business_advisory'], // Not thinking about exit yet
      keyMetrics: ['Revenue growth', 'Gross margin', 'Cash runway'],
      journeyFraming: 'You are building something. The destination is scale without chaos.'
    };
  }
  
  // EARLY STAGE: Low/no revenue
  if (!hasRevenue || (financials.turnover && financials.turnover < 500000)) {
    return {
      journey: 'early-stage-growing',
      focusAreas: ['Product-market fit', 'First customers', 'Cash management'],
      inappropriateServices: ['business_advisory', 'benchmarking'],
      keyMetrics: ['Revenue', 'Burn rate', 'Customer count'],
      journeyFraming: 'You are in the building phase. The destination is sustainable revenue.'
    };
  }
  
  // PRE-REVENUE
  return {
    journey: 'pre-revenue-building',
    focusAreas: ['Launch', 'First revenue', 'Product'],
    inappropriateServices: ['business_advisory', 'benchmarking', 'fractional_coo'],
    keyMetrics: ['Time to launch', 'Runway', 'Milestones'],
    journeyFraming: 'You are pre-revenue. The destination is your first paying customers.'
  };
}

// ============================================================================
// APPROPRIATE SERVICE RECOMMENDATIONS (ANTI-OVERSELLING) - V2
// With Exit-Focused Logic, ROI Requirements, and Service Appropriateness Matrix
// ============================================================================

interface AppropriateRecommendation {
  code: string;
  name: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  specificBenefit: string;
  investmentContext: string;
  // V2: Mandatory ROI fields
  investment: number;
  valueCreated: number | null;
  valueCalculation: string;
  roiRatio: string;
  notRecommendedReason?: string;
}

interface ServiceAppropriateness {
  isAppropriate: boolean;
  reason: string;
  isMandatory?: boolean;
}

// ============================================================================
// SERVICE APPROPRIATENESS CHECKS
// ============================================================================

function checkFractionalCFOAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  clientStage: ClientStageProfile
): ServiceAppropriateness {
  // APPROPRIATE when: Raising capital, rapid scaling, financial crisis, no financial infrastructure
  const raisingCapital = (responses.sd_exit_timeline || '').includes('investment-ready') ||
                         (responses.sd_raising_capital || '').toLowerCase().includes('yes');
  const rapidGrowth = financials.turnoverGrowth && financials.turnoverGrowth > 30;
  // dd_sleep_thieves may be an array
  const sleepThievesForCFO = Array.isArray(responses.dd_sleep_thieves) 
    ? responses.dd_sleep_thieves.join(' ')
    : (responses.dd_sleep_thieves || '').toString();
  const financialCrisis = (responses.sd_financial_confidence || '').includes('Crisis') ||
                          sleepThievesForCFO.includes('Cash flow');
  const noFinancialInfrastructure = (responses.sd_financial_confidence || '').includes('No visibility');
  
  // NOT APPROPRIATE when: Stable, profitable, has accountant, no scaling, exit planning
  const stableAndProfitable = financials.operatingProfit && financials.operatingProfit > 0 &&
                               (!financials.turnoverGrowth || financials.turnoverGrowth < 20);
  const exitFocused = clientStage.journey === 'established-exit-focused';
  const hasAccountant = financials.hasAccounts && financials.source === 'statutory_accounts';
  
  if (raisingCapital) {
    return { isAppropriate: true, reason: 'Raising capital requires investor-ready financial infrastructure' };
  }
  if (rapidGrowth) {
    return { isAppropriate: true, reason: `Rapid growth (${financials.turnoverGrowth}%) requires financial infrastructure to scale` };
  }
  if (financialCrisis) {
    return { isAppropriate: true, reason: 'Financial crisis/cash flow issues require hands-on financial leadership' };
  }
  if (noFinancialInfrastructure) {
    return { isAppropriate: true, reason: 'No financial visibility requires building financial infrastructure' };
  }
  
  // NOT appropriate checks
  if (exitFocused) {
    return { isAppropriate: false, reason: 'Exit-focused client needs Business Advisory, not ongoing CFO. Different journey.' };
  }
  if (stableAndProfitable && hasAccountant) {
    return { isAppropriate: false, reason: 'Stable, profitable business with accountant support does not need Fractional CFO.' };
  }
  
  return { isAppropriate: false, reason: 'No clear trigger for Fractional CFO (no scaling, no fundraising, no crisis).' };
}

function checkFractionalCOOAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  clientStage: ClientStageProfile
): ServiceAppropriateness {
  // Get response values with lowercase for matching
  // NOTE: Correct field names from discovery assessment schema
  const founderDependency = (responses.sd_founder_dependency || '').toLowerCase();
  const timeAllocation = (responses.dd_time_breakdown || responses.dd_time_allocation || '').toLowerCase();
  const weeklyHours = (responses.dd_owner_hours || responses.dd_weekly_hours || '').toLowerCase();
  const workLifeBalance = (responses.dd_external_view || responses.dd_work_life_balance || '').toLowerCase();
  
  console.log('[COO Check] Inputs:', { founderDependency, timeAllocation, weeklyHours, workLifeBalance });
  
  // APPROPRIATE ONLY when ALL of these are true:
  // 1. Operational chaos (not just staff issues)
  // 2. 50+ hours per week
  // 3. Most time is firefighting operations (not strategic thinking or staff issues)
  // 4. Need is ONGOING (not one-time restructuring)
  
  const hasOperationalChaos = founderDependency.includes('chaos') ||
                              founderDependency.includes('significant problems') ||
                              founderDependency.includes('completely dependent');
  const highFirefighting = timeAllocation.includes('90%') ||
                           timeAllocation.includes('70%') ||
                           timeAllocation.includes('mostly firefighting');
  const excessiveHours = weeklyHours.includes('60') ||
                         weeklyHours.includes('50-60') ||
                         weeklyHours.includes('50+');
  
  // NOT APPROPRIATE when ANY of these are true:
  // - Business runs fine/ticks along without founder
  // - Reasonable hours (<40)
  // - Good work/life balance
  // - Exit-focused (needs exit planning, not ongoing COO)
  // - Staff issues only (HR problem, not operational)
  // - One-time restructuring (redundancies, not ongoing need)
  
  // Match actual assessment option text for founder dependency:
  // "It would run fine - I'm optional to daily operations"
  // "Minor issues - but the team would cope"
  const businessRunsFine = founderDependency.includes('tick') ||
                           founderDependency.includes('run fine') ||
                           founderDependency.includes('runs fine') ||
                           founderDependency.includes('optional') ||
                           founderDependency.includes('minor issues') ||
                           founderDependency.includes('team would cope') ||
                           founderDependency.includes('runs smoothly') ||
                           founderDependency.includes('well') ||
                           founderDependency.includes('minimal');
  
  // Match actual assessment options:
  // "Under 30 hours", "30-40 hours", "40-50 hours"
  // Reasonable is Under 30 or 30-40 (under 40 total)
  const reasonableHours = weeklyHours.includes('under 30') ||
                          weeklyHours.includes('30-40') ||
                          weeklyHours.includes('less than 30') ||
                          weeklyHours.includes('<30') ||
                          (weeklyHours.includes('30') && !weeklyHours.includes('50') && !weeklyHours.includes('60') && !weeklyHours.includes('70'));
  
  const hasGoodWorkLifeBalance = workLifeBalance.includes('good') ||
                                  workLifeBalance.includes('healthy') ||
                                  workLifeBalance.includes('balanced') ||
                                  workLifeBalance.includes('yes');
  
  const exitFocused = clientStage.journey === 'established-exit-focused';
  
  // Check for staff issues only (not operational chaos)
  const staffIssuesOnly = founderDependency.includes('staff') ||
                          (responses.dd_hard_truth || '').toLowerCase().includes('staff') ||
                          (responses.dd_avoided_conversation || '').toLowerCase().includes('redundan');
  
  // Check for one-time restructuring need (redundancies) vs ongoing operational need
  const avoidedConversation = (responses.dd_avoided_conversation || '').toLowerCase();
  const hardTruth = (responses.dd_hard_truth || '').toLowerCase();
  const isOneTimeRestructuring = avoidedConversation.includes('redundan') ||
                                  avoidedConversation.includes('staff') ||
                                  avoidedConversation.includes('payroll') ||
                                  avoidedConversation.includes('let go') ||
                                  avoidedConversation.includes('fire') ||
                                  hardTruth.includes('overstaffed') ||
                                  hardTruth.includes('too many') ||
                                  hardTruth.includes('payroll');
  
  console.log('[COO Check] Analysis:', { 
    hasOperationalChaos, highFirefighting, excessiveHours,
    businessRunsFine, reasonableHours, hasGoodWorkLifeBalance, exitFocused, staffIssuesOnly,
    isOneTimeRestructuring, avoidedConversation: avoidedConversation.substring(0, 50)
  });
  
  // STRICT GATING: Check NOT appropriate conditions FIRST
  if (reasonableHours) {
    return { 
      isAppropriate: false, 
      reason: `Owner works reasonable hours (${responses.dd_owner_hours || responses.dd_weekly_hours || 'under 40'}). Fractional COO at £45k/year not justified.` 
    };
  }
  
  if (businessRunsFine) {
    return { 
      isAppropriate: false, 
      reason: 'Business runs fine without founder. One-time restructuring does not justify ongoing £45k/year COO.' 
    };
  }
  
  if (hasGoodWorkLifeBalance && !hasOperationalChaos) {
    return { 
      isAppropriate: false, 
      reason: 'Good work/life balance indicates operations are manageable. COO not justified.' 
    };
  }
  
  if (exitFocused && !hasOperationalChaos) {
    return { 
      isAppropriate: false, 
      reason: 'Exit-focused client with stable operations needs exit planning, not ongoing £45k/year COO.' 
    };
  }
  
  if (staffIssuesOnly && !hasOperationalChaos) {
    return { 
      isAppropriate: false, 
      reason: 'Staff/HR issues do not justify ongoing COO. Consider one-time HR support or redundancy planning instead.' 
    };
  }
  
  // ONE-TIME RESTRUCTURING CHECK - This is critical!
  // If the main issue is redundancies/payroll restructuring, COO is NOT appropriate
  // Redundancies are a one-time exercise, not ongoing operational leadership
  if (isOneTimeRestructuring) {
    return { 
      isAppropriate: false, 
      reason: 'Redundancy/restructuring is a one-time exercise. Does not justify ongoing £45k/year COO. Consider HR consultant or one-time advisory instead.' 
    };
  }
  
  // EXIT-FOCUSED CHECK - Extra strict for exit clients
  // Exit-focused clients need exit planning, not ongoing operational overhead
  if (exitFocused) {
    return { 
      isAppropriate: false, 
      reason: 'Exit-focused client needs exit planning and value maximization, not ongoing £45k/year operational overhead that reduces sale value.' 
    };
  }
  
  // APPROPRIATE only when truly chaotic AND not a one-time problem
  if (hasOperationalChaos && excessiveHours && highFirefighting && !isOneTimeRestructuring) {
    return { 
      isAppropriate: true, 
      reason: 'Operational chaos with 50+ hours and high firefighting indicates sustained operational leadership gap' 
    };
  }
  
  // Default: NOT appropriate
  return { 
    isAppropriate: false, 
    reason: 'No sustained operational leadership gap identified. One-time interventions may be more appropriate than ongoing COO.' 
  };
}

function checkBusinessAdvisoryAppropriateness(
  _responses: Record<string, any>,
  _financials: ExtractedFinancials
): ServiceAppropriateness {
  // BUSINESS ADVISORY & EXIT PLANNING
  // BLOCKED: Currently in development per user request
  // Per user: "business advisory hasn't been built out yet... so i think for now 
  // we should remove it from being usable until we have some definition"
  // When ready: Enable for exit-focused clients who need structured fix roadmap
  
  return { 
    isAppropriate: false, 
    reason: 'Business Advisory & Exit Planning is currently in development. Use Benchmarking for diagnostics and Goal Alignment for ongoing support.' 
  };
}

function checkBenchmarkingAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  payrollAnalysis: PayrollAnalysis | null
): ServiceAppropriateness {
  // BENCHMARKING & HIDDEN VALUE ANALYSIS (Combined Service)
  // This is the FIRST step for exit-focused clients: "Where do you stand today?"
  // Includes: Industry benchmarking + Hidden value/detractor analysis
  
  const exitTimeline = responses.sd_exit_timeline || '';
  const exitWithin5Years = exitTimeline.includes('1-3 years') ||
                           exitTimeline.includes('3-5 years') ||
                           exitTimeline.includes('Already exploring') ||
                           exitTimeline.includes('actively preparing');
  
  const metricsOutsideNorms = payrollAnalysis && 
    (payrollAnalysis.assessment === 'elevated' || payrollAnalysis.assessment === 'concerning');
  
  // Hidden value factors that suppress multiples
  const founderDependency = (responses.sd_founder_dependency || '').includes('Chaos') ||
                            (responses.sd_founder_dependency || '').includes('Significant');
  const keyPersonRisk = (responses.dd_hard_truth || '').toLowerCase().includes('key person') ||
                        (responses.sd_business_overview || '').toLowerCase().includes('just me');
  const customerConcentration = (responses.sd_revenue_concentration || '').includes('one client') ||
                                (responses.sd_revenue_concentration || '').includes('top 3');
  
  const hasValueDetractors = founderDependency || keyPersonRisk || customerConcentration || metricsOutsideNorms;
  
  const wantsBenchmark = (responses.sd_benchmark_awareness || '').includes("No - I'd love to know");
  
  if (exitWithin5Years) {
    // MANDATORY for all exit-focused clients - this is STEP 1
    const detractorNote = hasValueDetractors 
      ? ' Value detractors identified that buyers will penalise.'
      : '';
    return { 
      isAppropriate: true, 
      isMandatory: true,
      reason: `Exit within 5 years. FIRST STEP: Know where you stand today - competitive position AND what's suppressing your value.${detractorNote}` 
    };
  }
  
  if (hasValueDetractors) {
    return { 
      isAppropriate: true, 
      reason: 'Value detractors identified. Benchmarking + Hidden Value analysis reveals what\'s suppressing your multiple.' 
    };
  }
  
  if (wantsBenchmark) {
    return { isAppropriate: true, reason: 'Client expressed interest in understanding industry positioning.' };
  }
  
  return { isAppropriate: false, reason: 'No exit timeline, no value detractors, and metrics appear within normal range.' };
}

function checkHiddenValueAuditAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  clientStage: ClientStageProfile
): ServiceAppropriateness {
  // MANDATORY when: Exit within 5 years + any risk factor
  const exitTimeline = responses.sd_exit_timeline || '';
  const exitWithin5Years = exitTimeline.includes('1-3 years') ||
                           exitTimeline.includes('3-5 years') ||
                           exitTimeline.includes('Already exploring') ||
                           exitTimeline.includes('actively preparing');
  
  // Risk factors
  const founderDependency = (responses.sd_founder_dependency || '').includes('Chaos') ||
                            (responses.sd_founder_dependency || '').includes('Significant') ||
                            (responses.sd_business_overview || '').toLowerCase().includes('i am the');
  const keyPersonRisk = (responses.dd_hard_truth || '').toLowerCase().includes('key person') ||
                        (responses.sd_business_overview || '').toLowerCase().includes('just me');
  const customerConcentration = (responses.sd_revenue_concentration || '').includes('one client') ||
                                (responses.sd_revenue_concentration || '').includes('top 3');
  const brandTiedToFounder = (responses.sd_business_overview || '').toLowerCase().includes('my name') ||
                             (responses.sd_business_overview || '').toLowerCase().includes('personal brand');
  
  const hasRiskFactors = founderDependency || keyPersonRisk || customerConcentration || brandTiedToFounder;
  
  if (exitWithin5Years && hasRiskFactors) {
    const risks = [];
    if (founderDependency) risks.push('founder dependency');
    if (keyPersonRisk) risks.push('key person risk');
    if (customerConcentration) risks.push('customer concentration');
    if (brandTiedToFounder) risks.push('brand tied to founder');
    
    return { 
      isAppropriate: true, 
      isMandatory: true,
      reason: `Exit within 5 years with risk factors (${risks.join(', ')}). These destroy multiples - must be identified and addressed.` 
    };
  }
  
  if (exitWithin5Years) {
    return { 
      isAppropriate: true, 
      reason: 'Exit within 5 years. Hidden Value Audit identifies factors suppressing your multiple.' 
    };
  }
  
  if (hasRiskFactors && clientStage.journey !== 'pre-revenue-building') {
    return { isAppropriate: true, reason: 'Risk factors identified that may be suppressing business value.' };
  }
  
  return { isAppropriate: false, reason: 'No exit timeline and no significant risk factors identified.' };
}

// ============================================================================
// GOAL ALIGNMENT TIER SELECTION
// ============================================================================
// Lite (£1,500/year): Quarterly reviews, for clients who can self-execute
// Growth (£4,500/year): Monthly accountability, for decision avoiders + exit prep
// Partner (£9,000/year): Weekly check-ins, for complex/imminent exits
// ============================================================================
function selectGoalAlignmentTier(
  responses: Record<string, any>,
  clientStage: ClientStageProfile
): { tier: 'Lite' | 'Growth' | 'Partner'; price: number; reason: string } {
  
  const exitTimeline = (responses.sd_exit_timeline || '').toLowerCase();
  const avoidedConversation = responses.dd_avoided_conversation || '';
  const hardTruth = (responses.dd_hard_truth || '').toLowerCase();
  const fiveYearVision = (responses.dd_five_year_vision || '').toLowerCase();
  const weeklyHours = responses.dd_owner_hours || responses.dd_weekly_hours || '';
  const growthBlocker = (responses.sd_growth_blocker || '').toLowerCase();
  
  // Detect key signals
  const hasAvoidedConversation = avoidedConversation.trim().length > 0;
  const avoidingDifficultDecisions = avoidedConversation.toLowerCase().includes('redundan') ||
                                      avoidedConversation.toLowerCase().includes('staff') ||
                                      avoidedConversation.toLowerCase().includes('difficult') ||
                                      avoidedConversation.toLowerCase().includes('firing') ||
                                      avoidedConversation.toLowerCase().includes('letting go');
  const needsAccountability = fiveYearVision.includes('someone in my corner') ||
                               fiveYearVision.includes('accountability') ||
                               hardTruth.includes('carrying') ||
                               hardTruth.includes('alone');
  const needsLeadershipSupport = growthBlocker.includes('leadership') ||
                                  growthBlocker.includes('direction') ||
                                  growthBlocker.includes('strategic');
  const isOverwhelmed = weeklyHours.includes('60+') || weeklyHours.includes('70+');
  const isExitFocused = clientStage.journey === 'established-exit-focused';
  
  // ========== PARTNER TIER (£9,000/year) ==========
  // Weekly check-ins for intense support needs
  const needsPartner = 
    // Imminent exit (already in process or < 1 year)
    exitTimeline.includes('already') ||
    exitTimeline.includes('in progress') ||
    // Avoiding decisions AND overwhelmed (needs intense support)
    (avoidingDifficultDecisions && isOverwhelmed) ||
    // Complex exit mentioned
    exitTimeline.includes('complex');
  
  if (needsPartner) {
    return {
      tier: 'Partner',
      price: 9000,
      reason: 'Weekly support for complex/imminent exit execution'
    };
  }
  
  // ========== GROWTH TIER (£4,500/year) ==========
  // Monthly accountability for decision avoiders, exit prep, accountability needs
  const needsGrowth = 
    // Exit within 5 years needs Business Value Analysis
    exitTimeline.includes('1-3') ||
    exitTimeline.includes('3-5') ||
    exitTimeline.includes('1 to 3') ||
    exitTimeline.includes('3 to 5') ||
    // Any avoided conversation needs monthly accountability (not quarterly)
    hasAvoidedConversation ||
    // Explicit accountability need
    needsAccountability ||
    // Leadership/strategic support request
    needsLeadershipSupport ||
    // Exit-focused journey
    isExitFocused;
  
  if (needsGrowth) {
    let reason = 'Monthly accountability + Business Value Analysis';
    if (avoidingDifficultDecisions) {
      reason = `Monthly accountability for the "${avoidedConversation.substring(0, 50)}${avoidedConversation.length > 50 ? '...' : ''}" conversation`;
    } else if (needsAccountability) {
      reason = 'Monthly accountability - someone in your corner';
    } else if (exitTimeline.includes('1-3') || exitTimeline.includes('1 to 3')) {
      reason = 'Monthly accountability + Business Value Analysis for exit preparation';
    }
    
    return {
      tier: 'Growth',
      price: 4500,
      reason
    };
  }
  
  // ========== LITE TIER (£1,500/year) ==========
  // Quarterly reviews for self-directed clients
  return {
    tier: 'Lite',
    price: 1500,
    reason: 'Quarterly check-ins to maintain alignment'
  };
}

function check365AlignmentAppropriateness(
  responses: Record<string, any>,
  clientStage: ClientStageProfile
): ServiceAppropriateness {
  // GOAL ALIGNMENT PROGRAMME - "You'll Have Someone In Your Corner"
  // This is STAGE 2 (ALIGN): Long-term destination + accountability to execute
  // For exit clients: Supports 3-year exit plan execution
  // Tier selection is done by selectGoalAlignmentTier()
  
  const avoidingDecisions = (responses.dd_avoided_conversation || '').toLowerCase().includes('redundan') ||
                            (responses.dd_avoided_conversation || '').toLowerCase().includes('staff') ||
                            (responses.dd_avoided_conversation || '').toLowerCase().includes('difficult');
  const identityTransition = (responses.dd_five_year_vision || '').toLowerCase().includes('investor') ||
                             (responses.dd_five_year_vision || '').toLowerCase().includes('chairman') ||
                             (responses.dd_five_year_vision || '').toLowerCase().includes('portfolio');
  const accountabilityGap = (responses.dd_hard_truth || '').toLowerCase().includes('carrying') ||
                            (responses.dd_hard_truth || '').toLowerCase().includes('alone');
  const exitPlanInHead = (responses.sd_exit_timeline || '').toLowerCase().includes('plan') &&
                          (responses.dd_external_perspective || '').includes('figure it out');
  
  const exitFocused = clientStage.journey === 'established-exit-focused';
  
  // NOT APPROPRIATE when: Operational chaos (needs COO) or financial crisis (needs CFO)
  const operationalChaos = (responses.sd_founder_dependency || '').includes('Chaos');
  // dd_sleep_thieves may be an array
  const sleepThievesFor365 = Array.isArray(responses.dd_sleep_thieves) 
    ? responses.dd_sleep_thieves.join(' ')
    : (responses.dd_sleep_thieves || '').toString();
  const financialCrisis = sleepThievesFor365.includes('Cash flow');
  
  if (operationalChaos) {
    return { isAppropriate: false, reason: 'Operational chaos needs COO, not Goal Alignment. Fix operations first.' };
  }
  
  if (financialCrisis) {
    return { isAppropriate: false, reason: 'Financial crisis needs CFO intervention, not Goal Alignment.' };
  }
  
  // For exit-focused clients with decision avoidance or carrying alone pattern
  if (exitFocused && (avoidingDecisions || accountabilityGap || exitPlanInHead)) {
    const triggers = [];
    if (avoidingDecisions) triggers.push('decisions you\'re avoiding');
    if (accountabilityGap) triggers.push('carrying the exit plan alone');
    if (exitPlanInHead) triggers.push('exit plan still in your head');
    
    return { 
      isAppropriate: true, 
      isMandatory: true, // Mandatory for exit-focused clients with these patterns
      reason: `Exit-focused with ${triggers.join(', ')}. Goal Alignment (Growth/Partner tier) ensures someone holds you accountable to execute the 3-year exit plan.` 
    };
  }
  
  // For exit-focused clients generally
  if (exitFocused) {
    return { 
      isAppropriate: true, 
      reason: 'Exit timeline requires ongoing accountability to execute the plan. Goal Alignment (Growth tier £4,500/year) provides that support.' 
    };
  }
  
  if (avoidingDecisions) {
    return { isAppropriate: true, reason: 'Avoiding known-necessary decisions requires structured accountability, not just advice.' };
  }
  
  if (identityTransition) {
    return { isAppropriate: true, reason: 'Transition from operator to investor/chairman requires structured identity shift support.' };
  }
  
  if (accountabilityGap) {
    return { isAppropriate: true, reason: 'Carrying strategic decisions alone. Goal Alignment provides accountability partner.' };
  }
  
  return { isAppropriate: false, reason: 'No clear accountability gap or decision avoidance identified.' };
}

function checkManagementAccountsAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials
): ServiceAppropriateness {
  // APPROPRIATE when: No financial visibility
  const noVisibility = (responses.sd_financial_confidence || '').includes('Uncertain') ||
                       (responses.sd_financial_confidence || '').includes('Not confident') ||
                       (responses.sd_numbers_action_frequency || '').includes('Rarely') ||
                       (responses.sd_numbers_action_frequency || '').includes('Never');
  
  // NOT APPROPRIATE when: Already has accountant providing regular reporting
  const hasReporting = financials.hasAccounts && financials.source === 'statutory_accounts';
  
  if (hasReporting && !noVisibility) {
    return { isAppropriate: false, reason: 'Already has accountant providing regular financial reporting. Would be duplicate.' };
  }
  
  if (noVisibility) {
    return { isAppropriate: true, reason: 'No current financial visibility. Decision-making needs data foundation.' };
  }
  
  return { isAppropriate: false, reason: 'Financial visibility appears adequate.' };
}

function checkSystemsAuditAppropriateness(
  responses: Record<string, any>,
  clientStage: ClientStageProfile
): ServiceAppropriateness {
  // APPROPRIATE when: Operational inefficiency causing measurable cost
  const manualProcesses = (responses.sd_business_overview || '').toLowerCase().includes('manual') ||
                          (responses.dd_operational_friction || '').toLowerCase().includes('manual');
  const scalingBlocked = (responses.sd_growth_blocker || '').includes('systems') ||
                         (responses.sd_growth_blocker || '').includes('capacity');
  
  // NOT APPROPRIATE when: Business runs smoothly, owner not in operations
  const businessRunsFine = (responses.sd_founder_dependency || '').includes('run fine') ||
                           (responses.sd_founder_dependency || '').includes('Minor issues');
  const lowHours = (responses.dd_owner_hours || responses.dd_weekly_hours || '').includes('Under 30');
  
  if (businessRunsFine || lowHours) {
    return { isAppropriate: false, reason: 'Business runs smoothly. No systems problem to solve.' };
  }
  
  if (manualProcesses) {
    return { isAppropriate: true, reason: 'Manual processes identified that may be consuming time/cost.' };
  }
  
  if (scalingBlocked) {
    return { isAppropriate: true, reason: 'Scaling blocked by systems limitations.' };
  }
  
  return { isAppropriate: false, reason: 'No clear systems inefficiency identified.' };
}

// ============================================================================
// SERVICE APPROPRIATENESS ENFORCEMENT (BINDING CONSTRAINTS)
// ============================================================================

interface ServiceAppropriatenessResults {
  appropriate: {
    code: string;
    name: string;
    reason: string;
    isMandatory: boolean;
    investment: number;
    stage: 'diagnose' | 'align' | 'triggered';
  }[];
  notAppropriate: {
    code: string;
    name: string;
    reason: string;
  }[];
  mandatory: {
    code: string;
    name: string;
    reason: string;
  }[];
}

/**
 * Evaluates ALL services against appropriateness checks BEFORE LLM call.
 * Returns binding constraints that the LLM MUST respect.
 */
function evaluateAllServiceAppropriateness(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  clientStage: ClientStageProfile,
  payrollAnalysis: PayrollAnalysis | null
): ServiceAppropriatenessResults {
  
  const results: ServiceAppropriatenessResults = {
    appropriate: [],
    notAppropriate: [],
    mandatory: []
  };
  
  // Service pricing - UPDATED: Business Advisory + Hidden Value combined at £2,000
  // Benchmarking includes Hidden Value assessment as part of the package
  const SERVICE_INVESTMENTS: Record<string, number> = {
    'fractional_cfo': 48000,
    'fractional_coo': 45000,
    'business_advisory': 2000, // Combined: Business Advisory + Hidden Value Audit
    'benchmarking': 2000,      // Includes competitive positioning + hidden value factors
    '365_method': 4500,        // Annual fee (Growth tier default for exit clients)
    'management_accounts': 7800,
    'systems_audit': 4000,
  };
  
  // Service stages for exit-focused journey
  const SERVICE_STAGES: Record<string, 'diagnose' | 'align' | 'triggered'> = {
    'benchmarking': 'diagnose',
    'business_advisory': 'diagnose',
    '365_method': 'align',
    'management_accounts': 'triggered',
    'systems_audit': 'triggered',
    'fractional_cfo': 'triggered',
    'fractional_coo': 'triggered',
  };
  
  // Run all checks
  // NOTE: Hidden Value Audit is now combined with Benchmarking as "Benchmarking & Hidden Value Analysis"
  // Business Advisory is for exit planning roadmap
  const checks = [
    { 
      code: 'benchmarking', 
      name: 'Benchmarking & Hidden Value Analysis', 
      check: checkBenchmarkingAppropriateness(responses, financials, payrollAnalysis),
      stage: SERVICE_STAGES['benchmarking']
    },
    { 
      code: 'business_advisory', 
      name: 'Business Advisory & Exit Planning', 
      check: checkBusinessAdvisoryAppropriateness(responses, financials),
      stage: SERVICE_STAGES['business_advisory']
    },
    { 
      code: '365_method', 
      name: 'Goal Alignment Programme', 
      check: check365AlignmentAppropriateness(responses, clientStage),
      stage: SERVICE_STAGES['365_method']
    },
    { 
      code: 'management_accounts', 
      name: 'Management Accounts', 
      check: checkManagementAccountsAppropriateness(responses, financials),
      stage: SERVICE_STAGES['management_accounts']
    },
    { 
      code: 'systems_audit', 
      name: 'Systems Audit', 
      check: checkSystemsAuditAppropriateness(responses, clientStage),
      stage: SERVICE_STAGES['systems_audit']
    },
    { 
      code: 'fractional_cfo', 
      name: 'Fractional CFO', 
      check: checkFractionalCFOAppropriateness(responses, financials, clientStage),
      stage: SERVICE_STAGES['fractional_cfo']
    },
    { 
      code: 'fractional_coo', 
      name: 'Fractional COO', 
      check: checkFractionalCOOAppropriateness(responses, financials, clientStage),
      stage: SERVICE_STAGES['fractional_coo']
    },
  ];
  
  for (const { code, name, check, stage } of checks) {
    const investment = SERVICE_INVESTMENTS[code] || 0;
    
    if (check.isAppropriate) {
      results.appropriate.push({ 
        code, 
        name, 
        reason: check.reason, 
        isMandatory: check.isMandatory || false, 
        investment,
        stage: stage || 'triggered'
      });
      if (check.isMandatory) {
        results.mandatory.push({ code, name, reason: check.reason });
      }
    } else {
      results.notAppropriate.push({ code, name, reason: check.reason });
    }
  }
  
  console.log('[Appropriateness] Evaluation results:', {
    appropriate: results.appropriate.map(s => s.code),
    notAppropriate: results.notAppropriate.map(s => s.code),
    mandatory: results.mandatory.map(s => s.code)
  });
  
  return results;
}

/**
 * Validates LLM recommendations against binding constraints.
 * Returns errors if constraints are violated.
 */
function validateRecommendationsAgainstConstraints(
  recommendations: any[],
  appropriateness: ServiceAppropriatenessResults
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const recommendedCodes = recommendations.map(r => r.code || r.serviceCode || '');
  const notAllowedCodes = appropriateness.notAppropriate.map(s => s.code);
  const mandatoryCodes = appropriateness.mandatory.map(s => s.code);
  
  // Check for blocked services being recommended
  for (const code of recommendedCodes) {
    if (notAllowedCodes.includes(code)) {
      const service = appropriateness.notAppropriate.find(s => s.code === code);
      errors.push(`BLOCKED SERVICE RECOMMENDED: ${service?.name} was recommended but is not appropriate. Reason: ${service?.reason}`);
    }
  }
  
  // Check for mandatory services being omitted
  for (const code of mandatoryCodes) {
    if (!recommendedCodes.includes(code)) {
      const service = appropriateness.mandatory.find(s => s.code === code);
      errors.push(`MANDATORY SERVICE OMITTED: ${service?.name} must be included. Reason: ${service?.reason}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Auto-corrects LLM recommendations to enforce binding constraints.
 * Removes blocked services and adds mandatory services if missing.
 */
function autoCorrectRecommendations(
  recommendations: any[],
  appropriateness: ServiceAppropriatenessResults,
  fullRecommendationDetails: AppropriateRecommendation[]
): any[] {
  const notAllowedCodes = appropriateness.notAppropriate.map(s => s.code);
  const mandatoryCodes = appropriateness.mandatory.map(s => s.code);
  
  // Remove blocked services
  let corrected = recommendations.filter(r => {
    const code = r.code || r.serviceCode || '';
    return !notAllowedCodes.includes(code);
  });
  
  // Add mandatory services if missing
  const recommendedCodes = corrected.map(r => r.code || r.serviceCode || '');
  for (const mandatory of appropriateness.mandatory) {
    if (!recommendedCodes.includes(mandatory.code)) {
      // Find the full recommendation details
      const fullDetails = fullRecommendationDetails.find(r => r.code === mandatory.code);
      if (fullDetails) {
        corrected.unshift({
          service: fullDetails.name,
          code: fullDetails.code,
          priority: 1,
          investmentType: fullDetails.investment > 10000 ? 'Ongoing' : 'One-time',
          estimatedInvestment: fullDetails.investment <= 10000 
            ? `£${fullDetails.investment.toLocaleString()}` 
            : `£${Math.round(fullDetails.investment / 12).toLocaleString()}/month`,
          whyThisService: mandatory.reason,
          whatYouGet: fullDetails.specificBenefit,
          whyNow: 'This is mandatory for your exit timeline.',
          autoAdded: true // Flag for debugging
        });
      }
    }
  }
  
  // Re-number priorities
  corrected = corrected.map((r, i) => ({ ...r, priority: i + 1 }));
  
  console.log('[AutoCorrect] Fixed recommendations:', {
    removed: recommendations.length - corrected.length + appropriateness.mandatory.length,
    added: appropriateness.mandatory.filter(m => !recommendedCodes.includes(m.code)).length,
    final: corrected.map(r => r.code || r.service)
  });
  
  return corrected;
}

/**
 * Builds the binding constraints section for the LLM prompt.
 * Uses explicit MUST/MUST NOT language to enforce appropriateness.
 * Now includes STAGE information for exit-focused journey flow.
 */
function buildBindingConstraintsPrompt(appropriateness: ServiceAppropriatenessResults): string {
  // Group services by stage
  const diagnoseServices = appropriateness.appropriate.filter(s => s.stage === 'diagnose');
  const alignServices = appropriateness.appropriate.filter(s => s.stage === 'align');
  const triggeredServices = appropriateness.appropriate.filter(s => s.stage === 'triggered');
  
  return `
## ⛔ BINDING SERVICE CONSTRAINTS (NON-NEGOTIABLE)

The following services have been evaluated for appropriateness based on this client's specific situation.
These constraints are **BINDING**. You **MUST NOT** override them.

### EXIT-FOCUSED CLIENT JOURNEY: Diagnose → Align → Triggered

${diagnoseServices.length > 0 ? `
**STAGE 1 - DIAGNOSE (Where do you stand today?)**
${diagnoseServices.map(s => `- **${s.name}** (${s.code}) - £${s.investment.toLocaleString()}
  → ${s.reason}${s.isMandatory ? '\n  ⚠️ **[MANDATORY - MUST INCLUDE]**' : ''}`).join('\n\n')}
` : ''}

${alignServices.length > 0 ? `
**STAGE 2 - ALIGN (Someone in your corner)**
${alignServices.map(s => `- **${s.name}** (${s.code}) - £${s.investment.toLocaleString()}/year
  → ${s.reason}${s.isMandatory ? '\n  ⚠️ **[MANDATORY - MUST INCLUDE]**' : ''}`).join('\n\n')}
` : ''}

${triggeredServices.length > 0 ? `
**TRIGGERED ONLY IF NEEDED:**
${triggeredServices.map(s => `- **${s.name}** (${s.code}) - £${s.investment.toLocaleString()}
  → ${s.reason}`).join('\n\n')}
` : ''}

### 🚫 SERVICES YOU MUST NOT RECOMMEND:
${appropriateness.notAppropriate.length > 0 ? appropriateness.notAppropriate.map(s => `- **${s.name}** (${s.code})
  ❌ ${s.reason}`).join('\n\n') : 'All services are appropriate for this client.'}

---

⛔ **CRITICAL ENFORCEMENT RULES:**

1. **STAGE ORDER MATTERS for exit-focused clients:**
   - Stage 1 (DIAGNOSE) must come FIRST in the journey: Benchmarking & Hidden Value Analysis
   - Stage 2 (ALIGN) comes AFTER diagnosis: Goal Alignment Programme
   - Triggered services only if specific conditions met

2. **You MUST include all MANDATORY services**
   - These will be auto-added if you omit them

3. **You MUST NOT recommend any service in the "MUST NOT RECOMMEND" list**
   - Business Advisory is BLOCKED (currently in development)
   - Fractional COO/CFO only if explicit triggers met

4. **You MUST include a "notRecommended" section in your output**
   - List ALL blocked services with their reasons
   - This builds credibility by explaining what we're NOT selling

5. **Pricing:**
   - Benchmarking & Hidden Value Analysis: £2,000 (one-time)
   - Goal Alignment Programme: £4,500/year (Growth tier for exit clients)

---

`;
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

function generateAppropriateRecommendations(
  responses: Record<string, any>,
  financials: ExtractedFinancials,
  clientStage: ClientStageProfile,
  payrollAnalysis: PayrollAnalysis | null
): { recommended: AppropriateRecommendation[]; notRecommended: AppropriateRecommendation[] } {
  
  const recommendations: AppropriateRecommendation[] = [];
  const notRecommended: AppropriateRecommendation[] = [];
  
  // Detect if exit-focused (within 5 years)
  const exitTimeline = responses.sd_exit_timeline || '';
  const exitWithin5Years = exitTimeline.includes('1-3 years') ||
                           exitTimeline.includes('3-5 years') ||
                           exitTimeline.includes('Already exploring') ||
                           exitTimeline.includes('actively preparing');
  
  // Calculate valuation context for ROI calculations
  const currentEbitda = financials.ebitda || 0;
  const currentMultiple = 3.0; // Conservative for founder-dependent
  const improvedMultiple = 4.0; // With risks addressed
  const payrollSavings = payrollAnalysis && payrollAnalysis.annualExcess > 0 
    ? Math.round(payrollAnalysis.annualExcess * 0.5) // Conservative 50% capture
    : 0;
  const improvedEbitda = currentEbitda + payrollSavings;
  const currentValuation = currentEbitda * currentMultiple;
  const potentialValuation = improvedEbitda * improvedMultiple;
  const valuationUplift = potentialValuation - currentValuation;
  
  // ========== BUSINESS ADVISORY (Check first for exit-focused) ==========
  const advisoryCheck = checkBusinessAdvisoryAppropriateness(responses, financials);
  if (advisoryCheck.isAppropriate) {
    const investment = 4000;
    recommendations.push({
      code: 'business_advisory',
      name: 'Business Advisory & Exit Planning',
      score: advisoryCheck.isMandatory ? 95 : 75,
      confidence: 'high',
      reasoning: advisoryCheck.reason,
      specificBenefit: financials.ebitda 
        ? `Valuation clarity for £${Math.round(currentValuation / 1000)}k-£${Math.round(potentialValuation / 1000)}k business. Exit roadmap and buyer-readiness assessment.`
        : 'Valuation clarity, exit roadmap, and buyer-readiness assessment.',
      investmentContext: financials.turnover 
        ? `£${investment.toLocaleString()} is ${((investment / financials.turnover) * 100).toFixed(2)}% of turnover`
        : `£${investment.toLocaleString()} one-time investment`,
      investment,
      valueCreated: exitWithin5Years ? valuationUplift : null,
      valueCalculation: exitWithin5Years && financials.ebitda
        ? `Foundation for valuation improvement from £${Math.round(currentValuation / 1000)}k to £${Math.round(potentialValuation / 1000)}k`
        : 'Foundational - enables all other value capture',
      roiRatio: exitWithin5Years && valuationUplift > 0 
        ? `Foundational for ${Math.round(valuationUplift / investment)}:1 total programme ROI` 
        : 'Foundational'
    });
  } else if (exitWithin5Years) {
    // Business Advisory should be flagged as missing if exit is planned
    notRecommended.push({
      code: 'business_advisory',
      name: 'Business Advisory & Exit Planning',
      score: 0,
      confidence: 'high',
      reasoning: 'Should be recommended for exit-focused client',
      specificBenefit: '',
      investmentContext: '',
      investment: 4000,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: 'ERROR: Exit within 5 years but Business Advisory not triggered. Review logic.'
    });
  }
  
  // ========== BENCHMARKING ==========
  const benchmarkingCheck = checkBenchmarkingAppropriateness(responses, financials, payrollAnalysis);
  if (benchmarkingCheck.isAppropriate) {
    const investment = 3500;
    const benchmarkValueCreated = payrollAnalysis && payrollSavings > 0 && exitWithin5Years
      ? Math.round(payrollSavings * 3.5) // Savings × exit multiple
      : payrollSavings;
    
    recommendations.push({
      code: 'benchmarking',
      name: 'Industry Benchmarking',
      score: benchmarkingCheck.isMandatory ? 90 : 80,
      confidence: payrollAnalysis ? 'high' : 'medium',
      reasoning: benchmarkingCheck.reason,
      specificBenefit: payrollAnalysis 
        ? `Validates £${payrollAnalysis.annualExcess.toLocaleString()}/year payroll excess (${payrollAnalysis.calculation}). Provides buyer-ready competitive positioning.`
        : 'Identifies where you sit vs industry peers. Buyers will benchmark - you should too.',
      investmentContext: financials.turnover 
        ? `£${investment.toLocaleString()} is ${((investment / financials.turnover) * 100).toFixed(2)}% of turnover`
        : `£${investment.toLocaleString()} one-time investment`,
      investment,
      valueCreated: benchmarkValueCreated > 0 ? benchmarkValueCreated : null,
      valueCalculation: payrollAnalysis && payrollSavings > 0
        ? `Identifies £${payrollAnalysis.annualExcess.toLocaleString()} payroll excess. 50% capture = £${payrollSavings.toLocaleString()}/year. At ${exitWithin5Years ? '3.5x exit multiple' : 'annual'} = £${benchmarkValueCreated.toLocaleString()}.`
        : 'Identifies gaps vs peers - quantification requires engagement',
      roiRatio: benchmarkValueCreated > 0 ? `${Math.round(benchmarkValueCreated / investment)}:1` : 'TBC on engagement'
    });
  } else {
    notRecommended.push({
      code: 'benchmarking',
      name: 'Industry Benchmarking',
      score: 0,
      confidence: 'high',
      reasoning: benchmarkingCheck.reason,
      specificBenefit: '',
      investmentContext: '',
      investment: 3500,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: benchmarkingCheck.reason
    });
  }
  
  // ========== HIDDEN VALUE AUDIT ==========
  const hiddenValueCheck = checkHiddenValueAuditAppropriateness(responses, financials, clientStage);
  if (hiddenValueCheck.isAppropriate) {
    const investment = 2500;
    // Multiple improvement from 3x to 4x on improved EBITDA
    const multipleImpact = exitWithin5Years && improvedEbitda > 0
      ? improvedEbitda * (improvedMultiple - currentMultiple)
      : 0;
    
    recommendations.push({
      code: 'hidden_value_audit',
      name: 'Hidden Value Audit',
      score: hiddenValueCheck.isMandatory ? 85 : 70,
      confidence: exitWithin5Years ? 'high' : 'medium',
      reasoning: hiddenValueCheck.reason,
      specificBenefit: exitWithin5Years && financials.ebitda
        ? `Identifies factors killing your multiple. Moving from ${currentMultiple}x to ${improvedMultiple}x on £${Math.round(improvedEbitda / 1000)}k EBITDA = £${Math.round(multipleImpact / 1000)}k additional value.`
        : 'Identifies risks that suppress business value (founder dependency, key person risk, concentration).',
      investmentContext: financials.turnover 
        ? `£${investment.toLocaleString()} is ${((investment / financials.turnover) * 100).toFixed(2)}% of turnover`
        : `£${investment.toLocaleString()} one-time investment`,
      investment,
      valueCreated: multipleImpact > 0 ? multipleImpact : null,
      valueCalculation: exitWithin5Years && multipleImpact > 0
        ? `Multiple improvement ${currentMultiple}x → ${improvedMultiple}x on £${Math.round(improvedEbitda / 1000)}k EBITDA = £${Math.round(multipleImpact / 1000)}k`
        : 'Quantifies value destruction from identified risks',
      roiRatio: multipleImpact > 0 ? `${Math.round(multipleImpact / investment)}:1` : 'TBC on engagement'
    });
  }
  
  // ========== 365 ALIGNMENT ==========
  const alignmentCheck = check365AlignmentAppropriateness(responses, clientStage);
  if (alignmentCheck.isAppropriate) {
    // Use tier selection logic to determine appropriate tier
    const tierSelection = selectGoalAlignmentTier(responses, clientStage);
    const investment = tierSelection.price;
    
    console.log(`[Service Selection] Goal Alignment tier: ${tierSelection.tier} (£${investment}) - ${tierSelection.reason}`);
    
    recommendations.push({
      code: '365_method',
      name: 'Goal Alignment Programme',
      recommendedTier: tierSelection.tier,
      score: tierSelection.tier === 'Partner' ? 85 : tierSelection.tier === 'Growth' ? 75 : 65,
      confidence: 'high',
      reasoning: `${alignmentCheck.reason} ${tierSelection.reason}`,
      specificBenefit: tierSelection.tier === 'Partner' 
        ? 'Weekly check-ins with full valuation and exit planning support.'
        : tierSelection.tier === 'Growth'
          ? 'Monthly accountability calls + Business Value Analysis for exit preparation.'
          : 'Structured accountability for decisions you know need making. Not advice - accountability.',
      investmentContext: financials.turnover 
        ? `£${investment.toLocaleString()}/year (${tierSelection.tier} tier) = ${((investment / financials.turnover) * 100).toFixed(2)}% of turnover`
        : `£${investment.toLocaleString()}/year (${tierSelection.tier} tier)`,
      investment,
      valueCreated: null,
      valueCalculation: tierSelection.tier === 'Growth' 
        ? 'Business Value Analysis included - identifies value creation opportunities'
        : 'Enables execution of identified value opportunities. Multiplier on other recommendations.',
      roiRatio: 'Multiplier on other ROI'
    });
  }
  
  // ========== MANAGEMENT ACCOUNTS ==========
  const maCheck = checkManagementAccountsAppropriateness(responses, financials);
  if (maCheck.isAppropriate) {
    const investment = 7800; // Annual
    recommendations.push({
      code: 'management_accounts',
      name: 'Management Accounts',
      score: 60,
      confidence: 'medium',
      reasoning: maCheck.reason,
      specificBenefit: 'Monthly visibility into actual performance. Foundation for all other decisions.',
      investmentContext: `£650/month (£${investment.toLocaleString()}/year)`,
      investment,
      valueCreated: null,
      valueCalculation: 'Foundational - enables data-driven decisions',
      roiRatio: 'Foundational'
    });
  } else {
    notRecommended.push({
      code: 'management_accounts',
      name: 'Management Accounts',
      score: 0,
      confidence: 'high',
      reasoning: maCheck.reason,
      specificBenefit: '',
      investmentContext: '',
      investment: 7800,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: maCheck.reason
    });
  }
  
  // ========== SYSTEMS AUDIT ==========
  const systemsCheck = checkSystemsAuditAppropriateness(responses, clientStage);
  if (systemsCheck.isAppropriate) {
    const investment = 4000;
    recommendations.push({
      code: 'systems_audit',
      name: 'Systems Audit',
      score: 55,
      confidence: 'medium',
      reasoning: systemsCheck.reason,
      specificBenefit: 'Map inefficiencies and build automation roadmap.',
      investmentContext: `£${investment.toLocaleString()} one-time investment`,
      investment,
      valueCreated: null,
      valueCalculation: 'Identifies time/cost savings - quantification requires engagement',
      roiRatio: 'TBC on engagement'
    });
  } else {
    notRecommended.push({
      code: 'systems_audit',
      name: 'Systems Audit',
      score: 0,
      confidence: 'high',
      reasoning: systemsCheck.reason,
      specificBenefit: '',
      investmentContext: '',
      investment: 4000,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: systemsCheck.reason
    });
  }
  
  // ========== FRACTIONAL CFO ==========
  const cfoCheck = checkFractionalCFOAppropriateness(responses, financials, clientStage);
  if (cfoCheck.isAppropriate) {
    const investment = 48000; // Annual
    recommendations.push({
      code: 'fractional_cfo',
      name: 'Fractional CFO',
      score: 70,
      confidence: 'high',
      reasoning: cfoCheck.reason,
      specificBenefit: 'Financial leadership for scaling or crisis management.',
      investmentContext: `£4,000/month (£${investment.toLocaleString()}/year)`,
      investment,
      valueCreated: null,
      valueCalculation: 'Value depends on specific situation (fundraise success, turnaround, etc.)',
      roiRatio: 'Situation-dependent'
    });
  } else {
    notRecommended.push({
      code: 'fractional_cfo',
      name: 'Fractional CFO',
      score: 0,
      confidence: 'high',
      reasoning: cfoCheck.reason,
      specificBenefit: '',
      investmentContext: '',
      investment: 48000,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: cfoCheck.reason
    });
  }
  
  // ========== FRACTIONAL COO ==========
  const cooCheck = checkFractionalCOOAppropriateness(responses, financials, clientStage);
  if (cooCheck.isAppropriate) {
    const investment = 45000; // Annual
    recommendations.push({
      code: 'fractional_coo',
      name: 'Fractional COO',
      score: 70,
      confidence: 'high',
      reasoning: cooCheck.reason,
      specificBenefit: 'Operational leadership for scaling or crisis.',
      investmentContext: `£3,750/month (£${investment.toLocaleString()}/year)`,
      investment,
      valueCreated: null,
      valueCalculation: 'Value depends on operational improvements achieved',
      roiRatio: 'Situation-dependent'
    });
  } else {
    notRecommended.push({
      code: 'fractional_coo',
      name: 'Fractional COO',
      score: 0,
      confidence: 'high',
      reasoning: cooCheck.reason,
      specificBenefit: '',
      investmentContext: '',
      investment: 45000,
      valueCreated: null,
      valueCalculation: '',
      roiRatio: '',
      notRecommendedReason: cooCheck.reason
    });
  }
  
  // ========== SANITY CHECKS ==========
  let sortedRecs = [...recommendations].sort((a, b) => b.score - a.score);
  
  // Calculate totals for sanity check
  const totalInvestment = sortedRecs.reduce((sum, r) => sum + r.investment, 0);
  const totalValueCreated = sortedRecs.reduce((sum, r) => sum + (r.valueCreated || 0), 0);
  
  // Sanity check: Investment as % of turnover
  if (financials.turnover && totalInvestment / financials.turnover > 0.03) {
    console.log(`[Recommendations] WARNING: Total investment ${((totalInvestment / financials.turnover) * 100).toFixed(1)}% of turnover exceeds 3% threshold`);
    // Trim lower-priority recommendations
    while (sortedRecs.length > 3 && totalInvestment / financials.turnover > 0.02) {
      const removed = sortedRecs.pop();
      if (removed) {
        notRecommended.push({
          ...removed,
          notRecommendedReason: `Removed due to investment cap: total would exceed 2% of turnover`
        });
      }
    }
  }
  
  // Sanity check: Investment as % of EBITDA
  if (financials.ebitda && totalInvestment / financials.ebitda > 0.15) {
    console.log(`[Recommendations] WARNING: Total investment ${((totalInvestment / financials.ebitda) * 100).toFixed(1)}% of EBITDA exceeds 15% threshold`);
  }
  
  // Sanity check: Minimum ROI threshold (only for non-foundational services)
  const filteredByROI = sortedRecs.filter(r => {
    if (r.valueCreated && r.valueCreated > 0) {
      const roi = r.valueCreated / r.investment;
      if (roi < 5) {
        console.log(`[Recommendations] WARNING: ${r.name} has ROI ${roi.toFixed(1)}:1, below 5:1 threshold`);
        return false; // Remove if ROI too low
      }
    }
    return true;
  });
  
  // Return maximum 4 recommendations (for exit-focused clients)
  return {
    recommended: filteredByROI.slice(0, 4),
    notRecommended
  };
}

// ============================================================================
// GROUNDED ROI CALCULATION (V2 - With Exit-Focused Valuation Impact)
// ============================================================================

interface GroundedROI {
  investmentTotal: number;
  investmentBreakdown: string;
  investmentAsPercentOfTurnover?: string;
  investmentAsPercentOfEbitda?: string;
  
  // V2: Valuation-focused for exit clients
  valuationContext?: {
    currentEbitda: number;
    currentMultiple: number;
    currentValuation: number;
    payrollSavings: number;
    improvedEbitda: number;
    improvedMultiple: number;
    potentialValuation: number;
    valuationUplift: number;
    calculation: string;
  };
  
  // Individual service ROI
  serviceROIs: Array<{
    service: string;
    investment: number;
    valueCreated: number | null;
    calculation: string;
    roiRatio: string;
    confidence: string;
  }>;
  
  // Totals
  totalValueCreated: number;
  totalROI: string;
  
  // Sanity check results
  sanityChecks: {
    investmentVsTurnover: { value: number; status: 'ok' | 'warning' | 'red_flag' };
    investmentVsEbitda: { value: number; status: 'ok' | 'warning' | 'red_flag' };
    minimumROI: { value: number; status: 'ok' | 'warning' | 'red_flag' };
  };
  
  roiSummary: string;
}

function calculateGroundedROI(
  recommendations: AppropriateRecommendation[],
  financials: ExtractedFinancials,
  payrollAnalysis: PayrollAnalysis | null,
  clientStage: ClientStageProfile
): GroundedROI {
  
  // Calculate investment from actual recommendations
  const investmentTotal = recommendations.reduce((sum, r) => sum + r.investment, 0);
  const investmentBreakdown = recommendations
    .map(r => `${r.name}: £${r.investment.toLocaleString()}`)
    .join(' + ');
  
  // Detect exit-focused
  const isExitFocused = clientStage.journey === 'established-exit-focused';
  
  // Build valuation context for exit-focused clients
  let valuationContext: GroundedROI['valuationContext'] | undefined;
  
  if (isExitFocused && financials.ebitda) {
    const currentEbitda = financials.ebitda;
    const currentMultiple = 3.0; // Conservative for founder-dependent
    const payrollSavings = payrollAnalysis && payrollAnalysis.annualExcess > 0 
      ? Math.round(payrollAnalysis.annualExcess * 0.5) 
      : 0;
    const improvedEbitda = currentEbitda + payrollSavings;
    const improvedMultiple = 4.0; // With risks addressed
    
    const currentValuation = currentEbitda * currentMultiple;
    const potentialValuation = improvedEbitda * improvedMultiple;
    const valuationUplift = potentialValuation - currentValuation;
    
    valuationContext = {
      currentEbitda,
      currentMultiple,
      currentValuation: Math.round(currentValuation),
      payrollSavings,
      improvedEbitda,
      improvedMultiple,
      potentialValuation: Math.round(potentialValuation),
      valuationUplift: Math.round(valuationUplift),
      calculation: `Current: £${Math.round(currentEbitda / 1000)}k EBITDA × ${currentMultiple}x = £${Math.round(currentValuation / 1000)}k. ` +
        `Potential: £${Math.round(improvedEbitda / 1000)}k EBITDA × ${improvedMultiple}x = £${Math.round(potentialValuation / 1000)}k. ` +
        `Uplift: £${Math.round(valuationUplift / 1000)}k.`
    };
  }
  
  // Build service ROIs
  const serviceROIs = recommendations.map(r => ({
    service: r.name,
    investment: r.investment,
    valueCreated: r.valueCreated,
    calculation: r.valueCalculation,
    roiRatio: r.roiRatio,
    confidence: r.confidence
  }));
  
  // Calculate totals
  const totalValueCreated = recommendations.reduce((sum, r) => sum + (r.valueCreated || 0), 0);
  const totalROI = totalValueCreated > 0 
    ? `${Math.round(totalValueCreated / investmentTotal)}:1`
    : valuationContext 
      ? `${Math.round(valuationContext.valuationUplift / investmentTotal)}:1 (valuation impact)`
      : 'TBC on engagement';
  
  // Sanity checks
  const investmentVsTurnoverPct = financials.turnover 
    ? (investmentTotal / financials.turnover) * 100 
    : 0;
  const investmentVsEbitdaPct = financials.ebitda 
    ? (investmentTotal / financials.ebitda) * 100 
    : 0;
  const effectiveROI = totalValueCreated > 0 
    ? totalValueCreated / investmentTotal 
    : valuationContext 
      ? valuationContext.valuationUplift / investmentTotal 
      : 0;
  
  const sanityChecks: GroundedROI['sanityChecks'] = {
    investmentVsTurnover: {
      value: investmentVsTurnoverPct,
      status: investmentVsTurnoverPct > 3 ? 'red_flag' : investmentVsTurnoverPct > 2 ? 'warning' : 'ok'
    },
    investmentVsEbitda: {
      value: investmentVsEbitdaPct,
      status: investmentVsEbitdaPct > 15 ? 'red_flag' : investmentVsEbitdaPct > 10 ? 'warning' : 'ok'
    },
    minimumROI: {
      value: effectiveROI,
      status: effectiveROI > 0 && effectiveROI < 5 ? 'red_flag' : effectiveROI < 10 ? 'warning' : 'ok'
    }
  };
  
  // Build ROI summary
  let roiSummary: string;
  
  if (valuationContext) {
    roiSummary = `Investment of £${investmentTotal.toLocaleString()} ` +
      `(${investmentVsTurnoverPct.toFixed(2)}% of turnover, ${investmentVsEbitdaPct.toFixed(1)}% of EBITDA) ` +
      `targets £${Math.round(valuationContext.valuationUplift / 1000)}k valuation improvement ` +
      `(£${Math.round(valuationContext.currentValuation / 1000)}k → £${Math.round(valuationContext.potentialValuation / 1000)}k). ` +
      `ROI: ${totalROI}.`;
  } else if (totalValueCreated > 0) {
    roiSummary = `Investment of £${investmentTotal.toLocaleString()} ` +
      `targets £${totalValueCreated.toLocaleString()} in identified value. ROI: ${totalROI}.`;
  } else {
    roiSummary = `Investment of £${investmentTotal.toLocaleString()} for strategic clarity. ` +
      `Value quantification requires engagement.`;
  }
  
  return {
    investmentTotal,
    investmentBreakdown,
    investmentAsPercentOfTurnover: financials.turnover 
      ? `${investmentVsTurnoverPct.toFixed(2)}% of turnover` 
      : undefined,
    investmentAsPercentOfEbitda: financials.ebitda 
      ? `${investmentVsEbitdaPct.toFixed(1)}% of EBITDA` 
      : undefined,
    valuationContext,
    serviceROIs,
    totalValueCreated,
    totalROI,
    sanityChecks,
    roiSummary
  };
}

// Helper to build financial grounding context for LLM prompt
function buildFinancialGroundingContext(
  financials: ExtractedFinancials,
  payrollAnalysis: PayrollAnalysis | null,
  clientStage: ClientStageProfile
): string {
  if (!financials.hasAccounts) {
    return '';
  }
  
  let context = '\n\n## EXTRACTED FINANCIAL DATA (USE THESE EXACT FIGURES)\n\n';
  
  context += '### Key Metrics\n';
  if (financials.turnover) {
    context += `- Turnover: £${financials.turnover.toLocaleString()}`;
    if (financials.turnoverPriorYear) {
      context += ` (prior year: £${financials.turnoverPriorYear.toLocaleString()})`;
    }
    if (financials.turnoverGrowth) {
      context += ` [${financials.turnoverGrowth > 0 ? '+' : ''}${financials.turnoverGrowth}% growth]`;
    }
    context += '\n';
  }
  if (financials.operatingProfit) {
    context += `- Operating Profit: £${financials.operatingProfit.toLocaleString()}`;
    if (financials.operatingMarginPct) {
      context += ` (${financials.operatingMarginPct.toFixed(1)}% margin)`;
    }
    context += '\n';
  }
  if (financials.ebitda) {
    context += `- EBITDA: ~£${Math.round(financials.ebitda / 1000)}k\n`;
  }
  if (financials.netAssets) {
    context += `- Net Assets: £${financials.netAssets.toLocaleString()}\n`;
  }
  if (financials.employeeCount) {
    context += `- Employees: ${financials.employeeCount}\n`;
  }
  
  // Staff costs breakdown
  if (financials.totalStaffCosts) {
    context += '\n### Staff Costs Analysis\n';
    context += `- Total Staff Costs: £${financials.totalStaffCosts.toLocaleString()}\n`;
    if (financials.directorsSalaries) {
      context += `  - Directors: £${financials.directorsSalaries.toLocaleString()}\n`;
    }
    if (financials.staffWages) {
      context += `  - Staff Wages: £${financials.staffWages.toLocaleString()}\n`;
    }
    if (financials.employerNI) {
      context += `  - Employer NI: £${financials.employerNI.toLocaleString()}\n`;
    }
    if (financials.pensionCosts) {
      context += `  - Pension: £${financials.pensionCosts.toLocaleString()}\n`;
    }
    if (financials.staffCostsPercentOfRevenue) {
      context += `- Staff Costs as % of Revenue: ${financials.staffCostsPercentOfRevenue.toFixed(1)}%\n`;
    }
  }
  
  // Payroll analysis
  if (payrollAnalysis) {
    context += '\n### PAYROLL EFFICIENCY ANALYSIS\n';
    context += `CALCULATION: ${payrollAnalysis.calculation}\n`;
    context += `INDUSTRY BENCHMARK: ${payrollAnalysis.benchmark.typical}% typical, ${payrollAnalysis.benchmark.good}% good, ${payrollAnalysis.benchmark.concern}% concerning\n`;
    context += `ASSESSMENT: ${payrollAnalysis.assessment.toUpperCase()}\n`;
    if (payrollAnalysis.excessPercentage > 0) {
      context += `EXCESS: ${payrollAnalysis.excessPercentage}% above typical = £${payrollAnalysis.annualExcess.toLocaleString()}/year potential efficiency gain\n`;
    }
  }
  
  // Client stage
  context += '\n### CLIENT JOURNEY STAGE\n';
  context += `Journey: ${clientStage.journey}\n`;
  context += `Focus Areas: ${clientStage.focusAreas.join(', ')}\n`;
  context += `Framing: ${clientStage.journeyFraming}\n`;
  if (clientStage.inappropriateServices.length > 0) {
    context += `DO NOT RECOMMEND: ${clientStage.inappropriateServices.join(', ')}\n`;
  }
  
  context += '\n### CRITICAL INSTRUCTIONS\n';
  context += '1. USE THESE EXACT FIGURES in your analysis - do not round or estimate\n';
  context += '2. SHOW YOUR CALCULATIONS - every claim must have visible working\n';
  context += '3. DO NOT RECOMMEND services on the "inappropriateServices" list\n';
  context += '4. MAXIMUM 3 RECOMMENDATIONS - quality over quantity\n';
  context += '5. For payroll claims, reference the calculation and benchmark above\n';
  context += '6. For valuation claims, use EBITDA × multiple with ranges shown\n';
  
  return context;
}

// ============================================================================
// GAP SCORE CALIBRATION
// ============================================================================

interface GapSeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface GapCalibration {
  score: number;
  counts: GapSeverity;
  explanation: string;
}

function calibrateGapScore(gaps: any[]): GapCalibration {
  // Revised weights: critical=2, high=1, medium=0.5
  const weights = {
    critical: 2,
    high: 1,
    medium: 0.5,
    low: 0.25
  };
  
  const counts: GapSeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Count gaps by severity (from analysis)
  for (const gap of gaps || []) {
    const severity = (gap.severity || gap.priority || 'medium').toLowerCase();
    if (severity === 'critical') counts.critical++;
    else if (severity === 'high') counts.high++;
    else if (severity === 'medium') counts.medium++;
    else counts.low++;
  }
  
  // Calculate weighted score with base of 3
  const baseScore = 3;
  const weightedSum = 
    baseScore +
    counts.critical * weights.critical +
    counts.high * weights.high +
    counts.medium * weights.medium +
    counts.low * weights.low;
  
  // Cap at 10 and round conservatively
  const normalizedScore = Math.min(10, Math.max(1, Math.round(weightedSum)));
  
  let explanation = '';
  if (normalizedScore >= 9) explanation = 'Crisis level, business at risk without intervention';
  else if (normalizedScore >= 7) explanation = 'Significant gaps, multiple critical issues affecting core operations';
  else if (normalizedScore >= 5) explanation = 'Multiple gaps, 1-2 critical issues need attention';
  else if (normalizedScore >= 3) explanation = 'Some gaps, no critical issues blocking growth';
  else explanation = 'Minor optimisations, business is fundamentally healthy';
  
  return { score: normalizedScore, counts, explanation };
}

// ============================================================================
// ENHANCED CLOSING MESSAGE GUIDANCE
// ============================================================================

function buildClosingMessageGuidance(
  responses: Record<string, any>,
  affordability: AffordabilityProfile
): string {
  const teamSecret = responses.dd_hidden_from_team || responses.dd_team_secret || '';
  const externalView = responses.dd_external_perspective || responses.dd_external_view || '';
  const hardTruth = responses.dd_hard_truth || '';
  const vision = responses.dd_five_year_vision || responses.dd_five_year_picture || '';
  
  const hasVulnerability = teamSecret.toLowerCase().includes('imposter') ||
    teamSecret.toLowerCase().includes('syndrome') ||
    teamSecret.toLowerCase().includes('fear') ||
    teamSecret.toLowerCase().includes('doubt');
  
  const hasRelationshipStrain = externalView.includes('tension') || 
    externalView.includes('given up') ||
    externalView.includes('married to');
  
  // Extract specific vision details to reference
  const visionDetails: string[] = [];
  if (vision.match(/\d{1,2}(am|pm)/i)) visionDetails.push('the specific time you wake up');
  if (vision.includes('run')) visionDetails.push('your morning run');
  if (vision.includes('school') || vision.includes('boys') || vision.includes('kids')) visionDetails.push('taking the kids to school');
  if (vision.includes('lunch') && vision.includes('wife')) visionDetails.push('lunch with your wife');
  if (vision.includes('padel') || vision.includes('mates')) visionDetails.push('Padel with your mates');
  if (vision.includes('invest')) visionDetails.push('managing your investment portfolio');
  
  return `
## CLOSING MESSAGE - THIS IS THE MOST IMPORTANT SECTION

⚠️ CRITICAL: DO NOT INVENT FACTS
Only reference things the client actually said OR that appear in the ADVISOR CONTEXT NOTES. 
- If they didn't mention a valuation, don't say "you've had a professional valuation"
- If they didn't mention funding, don't say "you've raised a seed round" (unless it's in context notes)
- If context notes mention funding: "Given your recent raise..." NOT "You said you raised..."
Hallucinating facts destroys trust instantly. One invented fact undermines the entire report.

You're not writing marketing copy. You're having a blunt conversation with someone who respects directness.

${hasVulnerability ? `
VULNERABILITY DETECTED: They shared "${teamSecret}"
Acknowledge it briefly. One sentence. Don't dwell or get therapy-speak.
Example: "The [thing they mentioned]? It's not unusual at this stage. What matters is what you do next."
NOT: "[Thing they mentioned]? It's lying to you. You're building something real, something you want to outlast you. That takes courage, not credentials."
` : ''}

${hasRelationshipStrain ? `
RELATIONSHIP STRAIN DETECTED: Their partner views work as "${externalView}"
State it plainly as a cost of the current situation. Don't soften it, but don't dramatise it either.
Example: "That tension at home? It's the cost of 70-hour weeks without the systems to support them."
` : ''}

${visionDetails.length > 0 ? `
VISION DETAILS AVAILABLE (pick ONE only):
${visionDetails.map(d => `- ${d}`).join('\n')}

Pick the single most impactful one. ONE. Not two. Not three.
BAD: "morning runs, school drop-offs, Padel with mates"
BAD: "taking your boys to school, managing a portfolio, building something that outlasts you"
GOOD: "the school drop-offs you described"
GOOD: "the portfolio life you want"
` : ''}

${affordability.stage === 'pre-revenue' ? `
FOR PRE-REVENUE CLIENT:
State the Phase 1 number. Mention Phase 2 exists. Move on.
Example: "£[X] gets [specific outcomes]. The [bigger service] comes later, after you've raised."
` : ''}

WRITING STYLE - THIS IS CRITICAL:
- Short sentences. Punch, don't pad.
- No "I believe in you" energy. State facts.
- No explaining why you're not being salesy. That's salesy.
- No parallel structures ("hard work / easier work", "not X, but Y").
- No over-explaining ("It doesn't mean X. It means Y." - just say what it means)
- Professional but direct. Senior consultant who's seen this before, not a motivational coach.
- Credible and authoritative, but approachable. Not corporate, not casual.
- Cut anything that sounds like you're building to a point. Just make the point.

TONE CALIBRATION:
Too casual: "Call me, mate"
Too corporate: "We would welcome the opportunity to schedule a discovery session"
Right tone: "Let's talk this week." or "Book a call when you're ready."

Too casual: "You've got this"
Too corporate: "We are confident in your ability to execute"
Right tone: "You've built something real. Now build the infrastructure to match."

STRUCTURE (keep it tight):
1. Acknowledge one thing they shared (1 sentence)
2. Name the gap between where they are and the destination they described (1-2 sentences)
3. Paint the destination, then mention the investment (1-2 sentences) - DESTINATION FIRST
4. Close with next step (1 sentence)

Total: 5-6 sentences MAX. Not a paragraph. Not a speech.

EXAMPLE (adapt to each client):
"The imposter syndrome? Common at this stage. You're operating in chaos, and the school drop-offs stay in the future until that changes. In 12 months you could have investor-ready numbers, a team that runs without you, and a path to the portfolio life you described. £13,300 starts that journey. Let's talk this week."

Notice: DESTINATION first ("school drop-offs", "portfolio life"), INVESTMENT second ("£13,300 starts that journey").

That's 5 sentences. That's enough.

## CLOSING MESSAGE - HARD LIMITS

MAXIMUM: 350 characters (about 5 short sentences)

If your closing is longer than 350 characters, you've written too much. Cut it.

STRUCTURE (4-5 sentences only):
1. Acknowledge ONE vulnerability they shared (1 sentence)
2. Name the destination they want (1 sentence)
3. State the gap (1 sentence)
4. Investment + next step (1-2 sentences)

EXAMPLE (318 characters):
"The imposter syndrome you mentioned? Common at this stage. You've raised nearly £1m, you're projecting 41x growth. The gap isn't capability. It's infrastructure. £13,300 starts that journey. Let's talk this week."

BAD (too long):
"The imposter syndrome you mentioned? Common at this stage. You've raised nearly £1m, you're launching in January, and you're projecting 41x growth. The gap isn't capability, it's infrastructure. The school drop-offs you described stay in the future until the chaos is addressed. £9,150 starts that journey. Let's talk this week."

That's 383 characters - trim it.

BAD PATTERNS:
- Leading with services ("£13,300 gets you management accounts, a systems audit, and Goal Alignment programme")
- Leading with features ("Financial visibility, operational clarity, transition roadmap")
- Over-explaining ("It doesn't mean you're not capable. It means you're operating without infrastructure." - just say the second part)
- Listing vision details ("taking your boys to school, managing a portfolio, building something" - pick ONE)
- "That's not a fantasy. But it requires..." (variant of It's not X. It's Y.)
- Therapy-speak ("That takes courage, not credentials")
- False intimacy with strangers ("We're in this together", "Call me")

## CONTEXT NOTE URGENCY - USE TIME-SENSITIVE DETAILS

ALWAYS check advisorContextNotes for:
- Upcoming launches ("Launching January" → "before your January launch")
- Funding rounds ("Raising Series A" → "before you go to investors")
- Deadlines ("Board meeting next month" → "before your board meeting")
- Milestones ("Product launch Q1" → "before Q1 launch")

If a time-sensitive event exists within 3 months:
1. Reference it in the closing
2. Use it as the call-to-action urgency

EXAMPLE:
Without context: "Let's talk this week."
With context: "Let's talk this week, before the January launch."

The second version creates real urgency tied to THEIR timeline.

### Context Note Extraction

Look for these patterns in advisorContextNotes:
- "Launching [month]" → deadline
- "Raising" / "fundraising" → investor urgency
- "Board" / "meeting" → governance deadline
- Dates within next 90 days → immediate urgency

If found, the closing MUST reference it.

CALL TO ACTION:
One sentence. Professional but direct.
Good: "Let's talk this week."
Good: "Let's talk this week, before the January launch." (with context)
Good: "Book a call when you're ready."
Good: "We should talk."
Bad: "Call me." (too casual for someone you've never met)
Bad: "Let's schedule a call this week. Not a sales pitch. A conversation about which of these three starting points makes the most sense for where you are right now." (over-explains)

BANNED PHRASES IN CLOSING:
- "I want to be direct with you" (just be direct)
- "because I think you can handle it"
- "playing the long game with you" (sounds like manipulation)
- "Not a sales pitch. A conversation about..."
- "You've done the hard work of X" or "You've done the hard work of getting X" (patronising)
- "I believe in you" or any variant
- Any sentence starting with "Here's"
- "What I also see:" or "What I notice:"
- "Call me" (too casual for strangers)
- "We're in this together" (false intimacy)
- "That's not a fantasy. But it..." (variant of It's not X. It's Y.)
- "It doesn't mean X. It means Y." (over-explaining)
- Listing more than 2 vision details (don't list "morning runs, school drop-offs, Padel with mates" - pick ONE)
- Listing more than 2 goals (don't list "taking boys to school, managing a portfolio, building something" - pick ONE)

ALLOWED:
- "Let's talk this week."
- "Book a call when you're ready."
- "Start with what you can afford."
- "We're here when you're ready for more."
`;
}

// Service line definitions
const SERVICE_LINES = {
  '365_method': { 
    name: 'Goal Alignment Programme', 
    tiers: [
      { name: 'Lite', price: 1500 }, 
      { name: 'Growth', price: 4500 }, 
      { name: 'Partner', price: 9000 }
    ] 
  },
  'management_accounts': { 
    name: 'Management Accounts', 
    tiers: [
      { name: 'Monthly', price: 650, isMonthly: true },
      { name: 'Quarterly', price: 1750, isQuarterly: true }
    ] 
  },
  'benchmarking': { 
    name: 'Benchmarking Services', 
    tiers: [
      { name: 'Snapshot', price: 450 },
      { name: 'Full Package', price: 3500 }
    ] 
  },
  'systems_audit': { 
    name: 'Systems Audit', 
    tiers: [
      { name: 'Diagnostic', price: 1500 },
      { name: 'Comprehensive', price: 4000 }
    ] 
  },
  'fractional_cfo': { 
    name: 'Fractional CFO Services', 
    tiers: [
      { name: '1 day/month', price: 2000, isMonthly: true },
      { name: '2 days/month', price: 4000, isMonthly: true },
      { name: '4 days/month', price: 7500, isMonthly: true }
    ] 
  },
  'fractional_coo': { 
    name: 'Fractional COO Services', 
    tiers: [
      { name: '1 day/month', price: 1875, isMonthly: true },
      { name: '2 days/month', price: 3750, isMonthly: true },
      { name: '4 days/month', price: 7000, isMonthly: true }
    ] 
  },
  'combined_advisory': { 
    name: 'Combined CFO/COO Advisory', 
    tiers: [
      { name: '2 days each', price: 7500, isMonthly: true },
      { name: '4 days each', price: 14000, isMonthly: true }
    ] 
  },
  'business_advisory': { 
    name: 'Business Advisory & Exit Planning', 
    tiers: [
      { name: 'Valuation', price: 1000 },
      { name: 'Full Package', price: 4000 }
    ] 
  },
  'automation': { 
    name: 'Automation Services', 
    tiers: [
      { name: 'Per hour', price: 150 },
      { name: 'Day rate', price: 1000 }
    ] 
  }
};

const SYSTEM_PROMPT = `You are a senior business advisor analysing a discovery assessment. Generate a comprehensive, personalised report.

## THE TRAVEL AGENT PRINCIPLE

You are a travel agent selling a holiday, NOT an airline selling seats.

THE DESTINATION is the life they described in their assessment - the school drop-offs, the freedom, the portfolio investor lifestyle, the business that runs without them.

THE JOURNEY is how they get there - what their life looks like at Month 3, Month 6, Month 12. Each phase is a postcard from their future.

THE SERVICES are just the planes. They're how you get there, not why you go. Nobody books a holiday because of seat pitch. They book because of the beach.

When you write this report:
- Lead with where they're going, not what they're buying
- Describe each phase as "here's what your life looks like" not "here's what the service does"
- Services are footnotes that "enable" each phase, not headlines

BAD (selling planes): "Management Accounts - £650/month - Monthly financial visibility, investor-ready reporting"
GOOD (selling destination): "Month 1-3: Investor-ready numbers. Answers when VCs ask questions. You stop guessing."

CRITICAL REQUIREMENTS:
1. Quote client's EXACT WORDS at least 10 times throughout
2. Calculate specific £ figures for every cost and benefit
3. Structure as a TRANSFORMATION JOURNEY, not a service list
4. Recommend services in PHASES based on affordability (see affordability context)
5. Show the domino effect: how each phase enables the next
6. Make the comparison crystal clear: investment cost vs. cost of inaction

⚠️ DO NOT HALLUCINATE FACTS:
Only reference things the client actually said in their responses OR that appear in the ADVISOR CONTEXT NOTES.

STRICT VERIFICATION RULES:
- If they said "investment-ready" that does NOT mean they've had a professional valuation
- If they've raised funding, you can say "you've raised funding" but NOT "you've had a professional valuation" unless explicitly stated
- If context notes mention funding, reference it as "Given your recent funding..." not as something they said in the assessment
- NEVER infer credentials, achievements, or milestones that aren't explicitly stated
- When in doubt, don't include it

CLAIM SOURCES - every factual claim must come from ONE of these:
1. DIRECT QUOTE from their assessment responses (use exact quotes)
2. ADVISOR CONTEXT NOTES (reference as "Given [context]..." or "Your recent [milestone]...")
3. CALCULATED from known data (show your working)

If you cannot point to the source, DO NOT include the claim.

EXAMPLES OF PROHIBITED INFERENCES:
- "investment-ready" → "professionally valued" ❌
- "raised funding" → "investors believe in you" ❌  
- "has a board" → "experienced governance" ❌
- "working 60-70 hours" → "dedicated founder" ❌ (editorialising)

EXAMPLES OF VALID CLAIMS:
- "You said you're 'investment-ready'" ✅ (direct quote)
- "Given your recent £1m raise..." ✅ (from context notes)
- "50% manual work on a 3-person team = ~£40k in labour waste" ✅ (calculated)

⚠️ FINANCIAL CALCULATIONS MUST BE CREDIBLE:
- Use CONSERVATIVE estimates, not inflated ones
- Don't value founder time at £200/hour as "cost" - that's not real money lost
- Real costs: actual labour waste (hours × actual wage), revenue leakage, direct inefficiency
- Opportunity cost is NOT the same as actual cost - be clear about the difference
- If manual work is 50% of a £100k payroll, the waste is £50k, not £500k
- Projected returns should be realistic and defensible, not inflated for impact
- A credible advisor gives conservative numbers that hold up to scrutiny
- An inflated number destroys trust faster than a conservative one builds it

BAD: "£364,000/year trapped in operations" (values founder time as billable - it's not)
GOOD: "£78,000/year in manual work that could be automated" (actual labour cost)

BAD: "£492,000 minimum cost of inaction"
GOOD: "£75,000-£100,000 in direct inefficiency, plus the harder-to-quantify cost of investor readiness"

## LABOUR WASTE CALCULATION - USE THEIR ACTUAL DATA

When the client says "over half our effort is manual" or similar:

1. CHECK if we have staff costs from their projections
   - documentInsights.financialProjections may contain staffCosts, overheads, or team costs
   - Check Year 1 projections for staff/team costs
   - If Year 1 staff costs = £198,000, use that EXACT number

2. CALCULATE actual waste:
   - "Over half" = 55% (conservative estimate)
   - "About half" = 50%
   - "31-50%" = 40%
   - "11-30%" = 20%
   - Waste = Staff Costs × Manual Work %
   - £198,000 × 55% = £109,000

3. DO NOT default to generic estimates (£30-40k) when you have their actual numbers

4. SHOW THE CALCULATION in the report:
   "£109,000/year in labour inefficiency (55% of £198k Year 1 staff costs)"

This makes the report credible and specific to THEM, not generic.

### Projection-Based Calculations Priority

ALWAYS prefer calculations from their projections over generic estimates:
- Staff costs from projections > industry average
- Their gross margin (90%) > assumed margin
- Their revenue (£559k) > "early stage" assumptions
- Their team size (3→28) > generic growth assumptions

## VALUATION IMPACT - ALWAYS CALCULATE FOR FOUNDER DEPENDENCY

When founder dependency is detected AND we have Year 5 projections:

1. GET Year 5 revenue from documentInsights.financialProjections.year5Revenue
2. ESTIMATE EBITDA:
   - Use their gross margin if available (e.g., 90% gross margin → assume 40-50% EBITDA for SaaS)
   - Or assume 40-50% EBITDA margin for SaaS businesses
   - Or use 30-40% for services businesses
3. CALCULATE valuation delta:
   - Founder-dependent: EBITDA × 6
   - Systemised: EBITDA × 12
   - Delta = Systemised - Founder-dependent

4. SHOW THIS IN THE GAP:
   "At your Year 5 projections (£22.7M), founder dependency costs you:
   - Founder-dependent (6x): £68M valuation
   - Systemised (12x): £136M valuation
   - Infrastructure delta: £68M in lost value"

Or more simply:
"6x vs 12x at £22.7M ARR = £136M difference in exit value"

This is not speculation - it's standard M&A math. Use it.

### When to Include Valuation Impact

ALWAYS include when:
- founderDependency = true (from advisoryInsights or pattern detection)
- Year 5 revenue > £5M
- Client has mentioned exit/legacy/investor goals

The number makes the founder dependency gap REAL and URGENT.

## ANTI-AI-SLOP WRITING RULES

Your prose should sound like a smart advisor talking over coffee—direct, warm, useful. NOT like a corporate annual report.

### BANNED VOCABULARY (never use these words):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (look at, examine, dig into)
- Crucial, pivotal, vital, key as adjective (important, or show why it matters)
- Testament to, underscores, highlights (shows, makes clear)
- Showcases, fostering, garnered (shows, building, got)
- Tapestry, landscape, ecosystem (figurative uses)
- Intricate, vibrant, enduring (puffery)
- Synergy, leverage (verb), value-add (corporate nonsense)
- Streamline, optimize, holistic, impactful, scalable (consultant clichés)

### BANNED SENTENCE STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note that..." (just say the thing)
- "In summary..." / "In conclusion..." (don't summarize, end)
- Rule of three adjective/noun lists like "X, Y, and Z" (pick the best one)
- "Despite challenges, positioned for growth" formula
- "While X, it's worth noting Y" (commit to your point)
- Ending sentences with "-ing" phrases ("ensuring excellence, fostering growth")
- Explaining significance ("plays a pivotal role in fostering...")

### THE HUMAN TEST:
Read every sentence aloud. If it sounds like an annual report, rewrite it.
If it sounds like you explaining this over coffee, keep it.

### REQUIRED:
- One point per paragraph
- End on concrete, not abstract (what they get, not what you recommend)
- Quote their actual words
- Say it once—don't restate

### EXAMPLE TRANSFORMATIONS:

BAD (AI slop): "The comprehensive analysis underscores the pivotal importance of enhanced financial visibility, which plays a crucial role in fostering data-driven decision-making."

GOOD (human): "You can't make good decisions with bad numbers. This fixes the numbers."

BAD: "Not only does this address operational challenges, but it also positions you for sustainable long-term growth in an evolving market landscape."

GOOD: "This fixes the chaos. Then you can grow."

INVESTMENT PHASING IS CRITICAL:
- For pre-revenue/cash-constrained clients: PHASE services by affordability
- Phase 1 = Start Now (under £15k/year)
- Phase 2 = After Raise/Revenue (when they can afford it)
- Phase 3 = At Scale (when revenue supports it)
- HEADLINE the affordable number, not the total if-everything number

## INVESTMENT CALCULATION RULES

CRITICAL: Be consistent with investment figures throughout the report.

1. **Phase 1 Investment** = Services recommended for "now" timing
   - Include FULL first year cost of monthly services (e.g., £650 × 12 = £7,800)
   - Add one-time fees
   - This is the "First Year Investment" for most clients
   
2. **First Year Investment** = Same as Phase 1 for most clients
   - Only different if Phase 2 services start mid-year (rare)
   - For 99% of clients, Phase 1 = First Year Investment

3. **"Starts that journey" figure** = Phase 1 Investment (the full number)

NEVER show a partial figure like "£9,150" without explaining what it includes.

EXAMPLE CALCULATION (show your working):
- Management Accounts: £650/month × 12 months = £7,800
- Systems Audit: £4,000 (one-time)
- Goal Alignment Programme: £1,500 (one-time)
- **Phase 1 Total: £13,300**

Use £13,300 consistently:
- In the journey header: "This is what £13,300 and 12 months builds"
- In the investment box: "YOUR INVESTMENT £13,300 FIRST YEAR"
- In the closing: "£13,300 starts that journey"

If you show a different number, you've made an error. Check your math.

## INVESTMENT FRAMING - ALWAYS SHOW % OF REVENUE

When we have Year 1 revenue projections:

1. CALCULATE: Investment ÷ Year 1 Revenue × 100
   - £13,300 ÷ £559,000 = 2.38% ≈ 2.4%

2. USE in investment summary:
   "£13,300 - that's 2.4% of your Year 1 revenue"

3. USE in closing:
   "2.4% of Year 1 revenue buys you investor-ready numbers, operational clarity, and a transition path"

This reframes the investment from "expense" to "rounding error on your growth trajectory."

### Framing Hierarchy

Best → Worst:
1. "2.4% of Year 1 revenue" (specific, powerful)
2. "Less than one month's staff costs" (relatable if staff costs known)
3. "£13,300 for the year" (okay but not compelling)
4. "£13,300" (never use alone in closing)

Always use the most powerful framing you have data for.

## REVENUE TRAJECTORY - SHOW THE ARC

When we have multi-year revenue projections, show the trajectory.

INSTEAD OF:
"You're building for £22.7M ARR"

USE:
"You're building from £559k to £22.7M over 5 years - 41x growth"

OR in gap analysis:
"Your projections show £559k → £3.1M → £7.1M → £13.1M → £22.7M. 
Current systems won't survive that trajectory."

The trajectory shows:
1. The SCALE of ambition (not just end state)
2. The SPEED of growth (41x isn't incremental)
3. Why infrastructure matters NOW (Year 2 is 5.5x growth alone)

### Where to Use Trajectory

- Executive summary headline: Include Year 5 target AND growth multiple
- Gap analysis (systems): Reference Year 2 growth spike specifically
- Cost of inaction: "Another year at current trajectory means..."
- Closing: Can reference "41x growth" as credibility marker

## PAYBACK CALCULATION - BE PRECISE

Calculate payback from actual efficiency gains:

1. Investment: £13,300
2. Annual efficiency gain: Use calculated labour waste (e.g., £109,000)
3. Conservative capture rate: 30% in Year 1 = £32,700
4. Monthly savings = Annual savings ÷ 12
5. Payback = Investment ÷ Monthly savings

Round to nearest quarter:
- < 3.5 months → "3 months"
- 3.5-4.5 months → "3-4 months"
- 4.5-5.5 months → "4-5 months"
- 5.5-6.5 months → "5-6 months"

EXAMPLE CALCULATION:
- £13,300 investment
- £109,000 annual waste × 30% = £32,700 captured
- £32,700 ÷ 12 = £2,725/month savings
- Payback = £13,300 ÷ £2,725 = 4.9 months → **"4-5 months"**

Or with 40% capture rate:
- £109,000 × 40% = £43,600
- £43,600 ÷ 12 = £3,633/month
- Payback = £13,300 ÷ £3,633 = 3.7 months → **"3-4 months"**

Use the calculation, don't guess. Show your working in the ROI calculation field.

GOAL ALIGNMENT PROGRAMME:
This is NOT just for people without plans. It's for founders undergoing TRANSFORMATION:
- OPERATOR to INVESTOR transition
- FOUNDER to CHAIRMAN transition
- BURNOUT to BALANCE transition
If transformation signals are detected, recommend Goal Alignment even if they have a business plan.

## FINANCIAL GROUNDING (CRITICAL - READ CAREFULLY)

When financial data is provided (accounts, statements), you MUST:

1. **USE EXACT FIGURES** - do not estimate when data exists
2. **SHOW CALCULATIONS** - every claim must have visible working
3. **BENCHMARK APPROPRIATELY** - compare to industry standards, not arbitrary figures
4. **BE CONSERVATIVE** - understate rather than overstate potential gains

### PAYROLL ANALYSIS FORMAT (when payroll data is available)
"Staff costs: £[X] (including directors £Y, wages £Z, NI £A, pension £B)
Turnover: £[X]
Payroll as % of revenue: X%
Industry benchmark: Y-Z%
Assessment: [efficient/typical/elevated/concerning]
Potential efficiency gain: £[X]/year (calculation: ...)"

NEVER claim "excess payroll" without:
- Actual staff cost figure
- Actual turnover figure  
- Industry benchmark for comparison
- Specific calculation of excess

### VALUATION ANALYSIS FORMAT (when exit is discussed)
"Current EBITDA: £[X] (operating profit £Y + depreciation £Z)
Industry multiple range: X-Y×
Current implied valuation: £[X]-£[Y]
Asset backing: £[X] net assets
Key value drivers: [list]
Key value detractors: [list]"

NEVER claim "valuation impact" without:
- EBITDA figure
- Multiple range with reasoning
- Specific uplift calculation

### ANTI-OVERSELLING RULES
1. **MATCH SERVICES TO JOURNEY** - Exit-focused clients don't need scaling services
2. **MAXIMUM 4 RECOMMENDATIONS** - More than 4 is overselling
3. **JUSTIFY EXCLUSIONS** - Explain why other services are NOT appropriate
4. **INVESTMENT IN CONTEXT** - Always show % of turnover or profit

### SERVICE APPROPRIATENESS MATRIX (CHECK BEFORE RECOMMENDING)

**Fractional COO (£3,000-£10,000/month) - ONLY recommend if:**
- Founder working 50+ hours AND most time is operational firefighting
- Operational chaos is blocking business performance
- Need is ONGOING (12+ months), not one-time project
- DO NOT recommend for: one-time restructuring, stable operations, strategic issues

**Fractional CFO (£3,500-£12,000/month) - ONLY recommend if:**
- Raising capital, rapid scaling, or financial crisis
- No adequate financial infrastructure exists
- DO NOT recommend for: stable profitable businesses with accountant support

**Business Advisory (£4,000-£9,000) - RECOMMEND when:**
- Any exit timeline mentioned (MANDATORY if <5 years)
- Valuation questions or succession planning needed

**Benchmarking (£3,500) - MANDATORY when:**
- Exit within 5 years (buyers will benchmark, client should too)
- Any financial metric outside normal range for their industry

**Hidden Value Audit (£2,500-£4,000) - STRONGLY RECOMMENDED when:**
- Exit within 5 years
- Founder dependency, key person risk, or customer concentration detected

**365 Alignment (£1,500-£4,500) - RECOMMEND when:**
- Avoiding known-necessary decisions (not just busy)
- Transition in founder identity/role
- DO NOT recommend for: operational chaos (needs COO) or financial crisis (needs CFO)

**Management Accounts (£650/month) - ONLY recommend if:**
- No current financial visibility
- DO NOT recommend if: accountant already provides regular reporting

**Systems Audit (£4,000) - ONLY recommend if:**
- Manual processes causing measurable cost/time waste
- DO NOT recommend if: business runs smoothly, owner works <40 hours

### EXIT-FOCUSED LOGIC (WHEN EXIT <5 YEARS)

For any client with exit timeline within 5 years, the PRIMARY FRAME is VALUATION IMPACT:

1. Calculate current indicative valuation: EBITDA × industry multiple (typically 3-4x for SME)
2. Identify factors suppressing the multiple (founder dependency, concentration, etc.)
3. Identify factors suppressing EBITDA (excess costs, margin issues)
4. Calculate potential valuation with issues addressed
5. Frame ALL recommendations in terms of valuation impact

**Primary recommendations for exit-focused clients:**
1. Business Advisory & Exit Planning (valuation + roadmap) - MANDATORY
2. Industry Benchmarking (competitive positioning for buyers) - MANDATORY if metrics outside norms
3. Hidden Value Audit (risk identification + multiple impact) - STRONGLY RECOMMENDED

Secondary recommendations only if specific operational gaps exist.

### ROI REQUIREMENTS (MANDATORY)

Every service recommendation MUST include:
- Investment amount
- Value created (with calculation showing working)
- ROI ratio
- Confidence level (high/medium/low)

**"ROI: Unknown" or "ROI: Measured at exit" without numbers is NOT acceptable.**

If you cannot calculate a credible ROI with the available data, either:
1. State what additional data would be needed, OR
2. Do not recommend the service

### SANITY CHECKS

| Metric | Reasonable Range | Red Flag |
|--------|------------------|----------|
| Investment as % of turnover | 0.2% - 2% | >3% without exceptional justification |
| Investment as % of EBITDA | 1% - 10% | >15% needs strong ROI case |
| Investment vs opportunity | 1:10 minimum ROI | <1:5 ROI is hard to justify |
| Phase 1 vs total | 30-50% in Phase 1 | >70% in Phase 1 suggests overselling |

### EXAMPLE OF GROUNDED OUTPUT (EXIT-FOCUSED CLIENT)

For a client with £2.3m turnover, £406k EBITDA, 36.5% payroll, exit in 1-3 years:

**Valuation Context:**
- Current: £406k EBITDA × 3.0x (founder-dependent, overstaffed) = £1.22m
- Potential: £554k EBITDA × 4.0x (risks addressed, right-sized) = £2.22m
- Value opportunity: £1.0m

RECOMMENDED:
| Service | Investment | Value Created | ROI |
|---------|------------|---------------|-----|
| Business Advisory | £4,000 | Foundation for £1m+ improvement | Foundational |
| Benchmarking | £3,500 | Validates £148k excess → £74k/year → £259k at 3.5x | 74:1 |
| Hidden Value Audit | £2,500 | Multiple improvement 3x→4x = £554k | 222:1 |
| **Total** | **£10,000** | **£1.0m+ potential** | **100:1** |

NOT RECOMMENDED:
- Fractional COO (£45k/year): Business runs fine. Owner works <30 hours. One-time restructuring doesn't justify ongoing COO.
- Management Accounts: Already has accountant providing reporting.
- Systems Audit: Operations are smooth.

Investment sanity check:
- £10,000 / £2.28m turnover = 0.44% ✅
- £10,000 / £406k EBITDA = 2.5% ✅
- ROI = 100:1 ✅

LANGUAGE RULES (non-negotiable):

1. No em dashes (the long dash). Use commas or full stops instead.

2. British English only: optimise, analyse, realise, behaviour, centre, programme, organisation, recognise, specialise

3. Banned words (never use these): delve, realm, harness, unlock, leverage, seamless, empower, streamline, elevate, unprecedented, reimagine, holistic, foster, robust, scalable, breakthrough, disruptive, transformative, game-changer, cutting-edge, synergy, frictionless, data-driven, next-gen, paradigm, innovative

4. Banned patterns (never use these, they sound like AI):
   - Any sentence starting with "Here's" (e.g. "Here's the truth:", "Here's the thing:", "Here's what I see:", "Here's what I also see:")
   - Any sentence containing "what I see:" or "what I notice:" or "what I also see:"
   - "In a world where..."
   - "It's not about X. It's about Y."
   - "That's not a fantasy. But it..." or "That's not X. It's Y." (same pattern, different words)
   - "It doesn't mean X. It means Y." (over-explaining)
   - "Most people [X]. The few who [Y]."
   - "The real work is..."
   - "If you're not doing X, you're already behind"
   - "Let me be clear:" or "To be clear:"
   - "At the end of the day..."
   - "It goes without saying..."
   - "I want to be direct with you" (just be direct, don't announce it)
   - "because I think you can handle it"
   - "playing the long game with you" (sounds manipulative)
   - "Not a sales pitch. A conversation about..."
   - "You've done the hard work of X" (patronising)
   - Parallel structures like "You've done X. Now do Y." or "hard work / easier work"
   - Listing multiple vision details ("morning runs, school drop-offs, Padel" - pick ONE)
   - Listing multiple goals ("taking your boys to school, managing a portfolio, building something" - pick ONE)

5. Write like a senior consultant in a meeting. Direct. Credible. Professional but not corporate. Has an edge but not casual.

Writing style:
- Short sentences punch. Use them.
- State facts, not feelings. No "I believe in you" energy.
- Don't explain why you're being direct. Just be direct.
- Vary sentence length but favour short.
- For pre-revenue clients: optimise for THEIR outcome, not our revenue
- Authoritative but approachable. Not therapy-speak. Not LinkedIn motivation.
- This could go to a stranger. Keep it professional with an edge.`;

serve(async (req) => {
  console.log('=== GENERATE-DISCOVERY-ANALYSIS STARTED ===');
  
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

    const { preparedData, advisoryInsights } = await req.json();

    if (!preparedData) {
      throw new Error('preparedData is required - call prepare-discovery-data first');
    }
    
    // Log if advisory insights are provided
    if (advisoryInsights) {
      console.log('[Discovery] Advisory insights received from Stage 2:', {
        phase1Services: advisoryInsights.serviceRecommendations?.phase1?.services,
        phase2Services: advisoryInsights.serviceRecommendations?.phase2?.services,
        phase3Services: advisoryInsights.serviceRecommendations?.phase3?.services,
        topNarrativeHooks: advisoryInsights.topNarrativeHooks?.length || 0
      });
    } else {
      console.log('[Discovery] No advisory insights provided - proceeding with standard analysis');
    }

    console.log(`Generating analysis for: ${preparedData.client.name}`);

    // ========================================================================
    // FETCH PRACTICE LEARNING LIBRARY
    // ========================================================================
    
    let practiceLearnings: any[] = [];
    try {
      const practiceId = preparedData.client?.practice_id || preparedData.practiceId;
      const clientStage = preparedData.patternAnalysis?.clientStage?.journey || null;
      const industry = preparedData.client?.industry || null;
      
      if (practiceId) {
        console.log('[Discovery] Fetching practice learnings for:', { practiceId, clientStage, industry });
        
        const { data: learningsData, error: learningsError } = await supabase
          .rpc('get_relevant_learnings', {
            p_practice_id: practiceId,
            p_client_stage: clientStage,
            p_industry: industry,
            p_services: null,
            p_limit: 20
          });
        
        if (learningsError) {
          console.error('[Discovery] Error fetching learnings:', learningsError);
        } else if (learningsData && learningsData.length > 0) {
          practiceLearnings = learningsData;
          console.log('[Discovery] Loaded practice learnings:', learningsData.length, 'rules');
        } else {
          console.log('[Discovery] No practice learnings found (this is normal for new practices)');
        }
      }
    } catch (learningError) {
      console.error('[Discovery] Learning library fetch failed (non-fatal):', learningError);
    }

    // ========================================================================
    // FETCH SERVICE PRICING FROM DATABASE
    // ========================================================================
    
    let servicePricing: any = null;
    try {
      const practiceId = preparedData.client?.practice_id || preparedData.practiceId;
      
      if (practiceId) {
        console.log('[Discovery] Fetching service pricing for practice:', practiceId);
        
        const { data: pricingData, error: pricingError } = await supabase
          .rpc('get_service_pricing', {
            p_practice_id: practiceId
          });
        
        if (pricingError) {
          console.error('[Discovery] Error fetching pricing:', pricingError);
        } else if (pricingData && Object.keys(pricingData).length > 0) {
          servicePricing = pricingData;
          console.log('[Discovery] Loaded service pricing from database:', Object.keys(pricingData).length, 'services');
        } else {
          console.log('[Discovery] No custom pricing found, using defaults');
        }
      }
    } catch (pricingError) {
      console.error('[Discovery] Pricing fetch failed (using defaults):', pricingError);
    }
    
    // Use database pricing if available, otherwise fall back to hardcoded defaults
    const activeServicePricing = servicePricing || SERVICE_LINES;

    // Debug: Log what documents we received
    if (preparedData.documents && preparedData.documents.length > 0) {
      console.log('[Discovery] Documents received:', preparedData.documents.map((d: any) => ({
        fileName: d.fileName,
        hasContent: !!(d.content || d.text),
        contentLength: (d.content || d.text || '').length,
        contentPreview: (d.content || d.text || '').substring(0, 300)
      })));
    } else {
      console.log('[Discovery] No documents in preparedData');
    }

    // ========================================================================
    // CALCULATE CLARITY SCORE (with fallback)
    // ========================================================================
    
    const patternClarityScore = preparedData.patternAnalysis?.destinationClarity?.score;
    const fallbackClarityScore = calculateFallbackClarity(preparedData.discovery.responses);
    const clarityScore = patternClarityScore ?? fallbackClarityScore;
    const claritySource = patternClarityScore ? 'pattern_detection' : 'fallback';
    
    console.log('[Discovery] Clarity score:', {
      patternDetectionScore: patternClarityScore,
      fallbackScore: fallbackClarityScore,
      finalScore: clarityScore,
      source: claritySource
    });

    // ========================================================================
    // ASSESS AFFORDABILITY
    // ========================================================================
    
    const affordability = assessAffordability(
      preparedData.discovery.responses,
      preparedData.financialContext
    );
    
    console.log('[Discovery] Affordability:', affordability);

    // ========================================================================
    // EXTRACT ASSESSMENT SIGNALS (Both strengths AND gaps)
    // ========================================================================
    
    const assessmentSignals = extractAssessmentSignals(preparedData.discovery.responses);
    const balancedHealthSummary = buildBalancedHealthSummary(assessmentSignals);
    
    console.log('[Discovery] Assessment Signals:', {
      isHighPerformer: assessmentSignals.isHighPerformer,
      isExitFocused: assessmentSignals.isExitFocused,
      strengthCount: Object.values(assessmentSignals.strengths).filter(Boolean).length,
      gapCount: Object.values(assessmentSignals.gaps).filter(g => g).length
    });

    // ========================================================================
    // DETECT GOAL ALIGNMENT TRANSFORMATION TRIGGERS
    // ========================================================================
    
    const transformationSignals = detect365Triggers(preparedData.discovery.responses);
    
    console.log('[Discovery] Goal Alignment Triggers:', transformationSignals);

    // ========================================================================
    // PRE-COMPUTE SERVICE SCORES
    // ========================================================================
    
    const serviceScores = scoreServicesFromDiscovery(preparedData.discovery.responses);
    console.log('[Discovery] Service scores:', serviceScores.filter(s => s.score > 0));

    // ========================================================================
    // USE DOCUMENT INSIGHTS FROM STAGE 1 (or extract if not available)
    // ========================================================================
    
    let documentInsights: DocumentInsights;
    
    if (preparedData.documentInsights?.hasProjections) {
      console.log('[Discovery] Using document insights from Stage 1', {
        hasProjections: true,
        revenueYears: preparedData.documentInsights.financialProjections?.projectedRevenue?.length || 0,
        teamYears: preparedData.documentInsights.financialProjections?.projectedTeamSize?.length || 0
      });
      
      // Convert Stage 1 format to Stage 3 format
      const stage1Insights = preparedData.documentInsights;
      const fp = stage1Insights.financialProjections;
      
      // Calculate growth multiple
      let growthMultiple: number | undefined;
      if (fp?.projectedRevenue?.length) {
        const year1 = fp.projectedRevenue.find((r: any) => r.year === 1);
        const year5 = fp.projectedRevenue.find((r: any) => r.year === 5);
        if (year1 && year5 && year1.amount > 0) {
          growthMultiple = Math.round(year5.amount / year1.amount);
        }
      }
      
      // Extract funding status and launch timeline from extractedFacts
      const facts = stage1Insights.extractedFacts || [];
      const fundingStatus = facts.find((f: string) => 
        f.toLowerCase().includes('raised') || 
        f.toLowerCase().includes('funding') ||
        f.toLowerCase().includes('£') && f.toLowerCase().includes('seed')
      );
      const launchTimeline = facts.find((f: string) => 
        f.toLowerCase().includes('launch') || 
        f.toLowerCase().includes('january') ||
        f.toLowerCase().includes('february') ||
        f.toLowerCase().includes('march')
      );
      
      // Determine stage from revenue projections
      let stage: 'pre-revenue' | 'early-revenue' | 'growth' | 'established' | 'unknown' = 'unknown';
      if (fp?.projectedRevenue?.length) {
        const year1 = fp.projectedRevenue.find((r: any) => r.year === 1);
        if (year1) {
          const rev = year1.amount;
          if (rev >= 10000000) stage = 'established';
          else if (rev >= 2000000) stage = 'established';
          else if (rev >= 500000) stage = 'growth';
          else if (rev >= 100000) stage = 'early-revenue';
          else if (rev > 0) stage = 'early-revenue';
          else stage = 'pre-revenue';
        }
      }
      
      documentInsights = {
        financialProjections: {
          hasProjections: true,
          currentRevenue: fp?.projectedRevenue?.find((r: any) => r.year === 1)?.amount,
          year5Revenue: fp?.projectedRevenue?.find((r: any) => r.year === 5)?.amount,
          projectedRevenue: fp?.projectedRevenue?.map((r: any) => ({ year: r.year, amount: r.amount })),
          growthMultiple: growthMultiple,
          grossMargin: fp?.projectedGrossMargin?.[0]?.percent ? fp.projectedGrossMargin[0].percent / 100 : undefined
        },
        businessContext: {
          stage: stage,
          model: stage1Insights.businessContext?.businessModel,
          fundingStatus: fundingStatus || undefined,
          launchTimeline: launchTimeline || undefined
        },
        relevantQuotes: facts
      };
      
      console.log('[Discovery] Converted Stage 1 insights:', {
        hasProjections: documentInsights.financialProjections.hasProjections,
        growthMultiple: documentInsights.financialProjections.growthMultiple,
        year1: documentInsights.financialProjections.currentRevenue,
        year5: documentInsights.financialProjections.year5Revenue
      });
    } else {
      // Fall back to extracting ourselves (backward compatibility)
      console.log('[Discovery] Extracting document insights (Stage 1 had none)...');
      documentInsights = await extractDocumentInsights(
      preparedData.documents || [],
      openrouterKey
    );
    
    const financialProjections = documentInsights.financialProjections;
    console.log('[Discovery] Document insights extracted:', {
      hasProjections: financialProjections.hasProjections,
      growthMultiple: financialProjections.growthMultiple,
      businessStage: documentInsights.businessContext.stage,
      year1: financialProjections.currentRevenue,
      year5: financialProjections.year5Revenue
    });
    }
    
    const financialProjections = documentInsights.financialProjections;
    const documentInsightsContext = buildDocumentInsightsContext(documentInsights);

    // ========================================================================
    // FINANCIAL GROUNDING - Extract actual figures from uploaded accounts
    // ========================================================================
    
    console.log('[Discovery] Extracting financials from accounts...');
    const extractedFinancials = await extractFinancialsFromAccounts(
      preparedData.documents || [],
      openrouterKey
    );
    
    console.log('[Discovery] Extracted financials:', {
      hasAccounts: extractedFinancials.hasAccounts,
      turnover: extractedFinancials.turnover,
      staffCosts: extractedFinancials.totalStaffCosts,
      staffCostsPct: extractedFinancials.staffCostsPercentOfRevenue,
      ebitda: extractedFinancials.ebitda
    });
    
    // DIAGNOSTIC TRACE: After financial extraction
    traceFinancialData('A1_EXTRACTION', {
      staffCosts: extractedFinancials.totalStaffCosts,
      turnover: extractedFinancials.turnover,
      storedPct: extractedFinancials.staffCostsPercentOfRevenue,
      source: 'extractFinancialsFromAccounts',
      details: { hasAccounts: extractedFinancials.hasAccounts, ebitda: extractedFinancials.ebitda }
    });

    // ========================================================================
    // PAYROLL EFFICIENCY ANALYSIS
    // ========================================================================
    
    // Detect industry from business overview
    const businessOverview = (preparedData.discovery.responses.sd_business_overview || 
                              preparedData.client?.description || '').toLowerCase();
    
    const payrollAnalysis = analysePayrollEfficiency(extractedFinancials, businessOverview);
    
    if (payrollAnalysis) {
      console.log('[Discovery] Payroll analysis (VALIDATED):', {
        staffCosts: `£${payrollAnalysis.staffCosts.toLocaleString()}`,
        turnover: `£${payrollAnalysis.turnover.toLocaleString()}`,
        staffCostsPct: `${payrollAnalysis.staffCostsPct.toFixed(1)}%`,
        benchmark: `${payrollAnalysis.benchmark.good}-${payrollAnalysis.benchmark.typical}% (typical), ${payrollAnalysis.benchmark.concern}% (concern)`,
        excessPct: `${payrollAnalysis.excessPercentage.toFixed(1)}%`,
        excessAmount: `£${payrollAnalysis.annualExcess.toLocaleString()}`,
        assessment: payrollAnalysis.assessment,
        isValidated: payrollAnalysis.isValidated,
        validationErrors: payrollAnalysis.validationErrors
      });
      
      // DIAGNOSTIC TRACE: After payroll analysis
      traceFinancialData('B1_PAYROLL_ANALYSIS', {
        staffCosts: payrollAnalysis.staffCosts,
        turnover: payrollAnalysis.turnover,
        storedPct: payrollAnalysis.staffCostsPct,
        source: 'analysePayrollEfficiency',
        details: { 
          benchmark: payrollAnalysis.benchmark.typical,
          excessPct: payrollAnalysis.excessPercentage,
          excessAmount: payrollAnalysis.annualExcess,
          assessment: payrollAnalysis.assessment,
          isValidated: payrollAnalysis.isValidated
        }
      });
      
      // Sanity check: Log warning if excess seems unreasonably high
      if (payrollAnalysis.annualExcess > payrollAnalysis.staffCosts * 0.5) {
        console.warn('[Discovery] ⚠️ WARNING: Calculated excess (£' + payrollAnalysis.annualExcess.toLocaleString() + 
          ') is more than 50% of staff costs. This seems high - please verify.');
      }
    }

    // ========================================================================
    // CLIENT JOURNEY STAGE DETECTION
    // ========================================================================
    
    const clientJourneyStage = detectClientStage(
      preparedData.discovery.responses,
      extractedFinancials
    );
    
    console.log('[Discovery] Client journey stage:', {
      journey: clientJourneyStage.journey,
      focusAreas: clientJourneyStage.focusAreas,
      inappropriateServices: clientJourneyStage.inappropriateServices
    });

    // ========================================================================
    // APPROPRIATE SERVICE RECOMMENDATIONS (ANTI-OVERSELLING)
    // ========================================================================
    
    const appropriateRecommendations = generateAppropriateRecommendations(
      preparedData.discovery.responses,
      extractedFinancials,
      clientJourneyStage,
      payrollAnalysis
    );
    
    console.log('[Discovery] Appropriate recommendations:', {
      recommended: appropriateRecommendations.recommended.map(r => r.code),
      notRecommended: appropriateRecommendations.notRecommended.map(r => r.code)
    });
    
    // DIAGNOSTIC TRACE: Investment from service recommendations
    traceInvestmentTotal('C1_SERVICE_RECOMMENDATIONS', 
      appropriateRecommendations.recommended.map(r => ({
        name: r.name,
        code: r.code,
        price: r.investment
      }))
    );

    // ========================================================================
    // BINDING SERVICE APPROPRIATENESS (ENFORCEMENT LAYER)
    // ========================================================================
    
    let bindingAppropriateness: ServiceAppropriatenessResults;
    let bindingConstraintsPrompt: string;
    
    try {
      bindingAppropriateness = evaluateAllServiceAppropriateness(
        preparedData.discovery.responses,
        extractedFinancials,
        clientJourneyStage,
        payrollAnalysis
      );
      
      console.log('[Discovery] BINDING appropriateness constraints:', {
        mayRecommend: bindingAppropriateness.appropriate.map(s => s.code),
        mustNotRecommend: bindingAppropriateness.notAppropriate.map(s => `${s.code}: ${s.reason}`),
        mandatory: bindingAppropriateness.mandatory.map(s => s.code)
      });
      
      // DIAGNOSTIC TRACE: Investment from binding appropriateness
      traceInvestmentTotal('E1_BINDING_APPROPRIATE', 
        bindingAppropriateness.appropriate.map(s => ({
          name: s.name,
          code: s.code,
          price: s.investment
        }))
      );
      
      // Build binding constraints for prompt
      bindingConstraintsPrompt = buildBindingConstraintsPrompt(bindingAppropriateness);
    } catch (appropriatenessError: any) {
      console.error('[Discovery] Error in service appropriateness evaluation:', appropriatenessError?.message || appropriatenessError);
      // Fallback to empty constraints if evaluation fails
      bindingAppropriateness = { appropriate: [], notAppropriate: [], mandatory: [] };
      bindingConstraintsPrompt = '## SERVICE CONSTRAINTS\n\nNo constraints computed - evaluation failed.';
    }

    // ========================================================================
    // GROUNDED ROI CALCULATION
    // ========================================================================
    
    const groundedROI = calculateGroundedROI(
      appropriateRecommendations.recommended,
      extractedFinancials,
      payrollAnalysis,
      clientJourneyStage
    );
    
    console.log('[Discovery] Grounded ROI:', {
      investmentTotal: groundedROI.investmentTotal,
      investmentAsPercentOfTurnover: groundedROI.investmentAsPercentOfTurnover,
      investmentAsPercentOfEbitda: groundedROI.investmentAsPercentOfEbitda,
      valuationUplift: groundedROI.valuationContext?.valuationUplift,
      totalROI: groundedROI.totalROI,
      sanityChecks: groundedROI.sanityChecks
    });
    
    // DIAGNOSTIC TRACE: Investment from ROI calculation
    traceInvestmentTotal('D1_GROUNDED_ROI', 
      groundedROI.serviceROIs.map((sr: any) => ({
        name: sr.service,
        code: '',
        price: sr.investment
      }))
    );

    // Build financial grounding context for LLM
    const financialGroundingContext = buildFinancialGroundingContext(
      extractedFinancials,
      payrollAnalysis,
      clientJourneyStage
    );

    // ========================================================================
    // BUSINESS STAGE DETECTION - For realistic timeframe calibration
    // ========================================================================
    
    interface BusinessStageProfile {
      stage: 'early-stage' | 'scaling' | 'established' | 'lifestyle';
      destinationTimeframe: '3-5 years' | '2-3 years' | '12-18 months' | '6-12 months';
      journeyFraming: 'foundations' | 'progress' | 'achievement';
    }
    
    const detectBusinessStage = (
      responses: Record<string, any>,
      projections: any
    ): BusinessStageProfile => {
      // Check for early-stage indicators
      const hasLongGrowthTrajectory = projections?.growthMultiple && projections.growthMultiple > 10;
      const isPreRevenue = !projections?.currentRevenue || projections.currentRevenue < 100000;
      const mentionsLaunching = (responses.sd_business_overview || '').toLowerCase().includes('launch');
      const mentionsRaising = (responses.sd_business_overview || '').toLowerCase().includes('raising') || 
                              (responses.sd_business_overview || '').toLowerCase().includes('investors') ||
                              (responses.sd_raising_capital || '').toLowerCase().includes('yes');
      const hasLongExitTimeline = ['3-5 years', '5+ years', 'Not thinking about it'].includes(responses.sd_exit_timeline || '');
      
      // Check for established indicators
      const hasNearExitTimeline = ['1-2 years', 'Within 12 months'].includes(responses.sd_exit_timeline || '');
      const visionForSteppingBack = (responses.dd_five_year_vision || responses.dd_five_year_picture || '').toLowerCase();
      const mentionsSteppingBack = visionForSteppingBack.includes('step back') ||
                                    visionForSteppingBack.includes('retirement');
      
      // Determine stage
      if ((hasLongGrowthTrajectory || isPreRevenue || mentionsLaunching || mentionsRaising) && hasLongExitTimeline) {
        return {
          stage: 'early-stage',
          destinationTimeframe: '3-5 years',
          journeyFraming: 'foundations'
        };
      }
      
      if (hasNearExitTimeline || mentionsSteppingBack) {
        return {
          stage: 'established',
          destinationTimeframe: '12-18 months',
          journeyFraming: 'achievement'
        };
      }
      
      if (hasLongGrowthTrajectory && !isPreRevenue) {
        return {
          stage: 'scaling',
          destinationTimeframe: '2-3 years',
          journeyFraming: 'progress'
        };
      }
      
      return {
        stage: 'lifestyle',
        destinationTimeframe: '6-12 months',
        journeyFraming: 'achievement'
      };
    };
    
    const businessStage = detectBusinessStage(
      preparedData.discovery.responses,
      financialProjections
    );

    // ========================================================================
    // BUILD PROJECTION ENFORCEMENT (if projections available)
    // ========================================================================
    
    let projectionEnforcement = '';
    
    if (financialProjections.hasProjections) {
      const y1 = financialProjections.currentRevenue || 0;
      const y5 = financialProjections.year5Revenue || 0;
      const gm = financialProjections.grossMargin || 0;
      const mult = financialProjections.growthMultiple || 0;
      const phase1 = 13300; // Base phase 1 investment
      
      const investmentPct = y1 > 0 ? ((phase1 / y1) * 100).toFixed(1) : null;
      const founderDepVal = y5 > 0 ? (y5 * 6 / 1000000).toFixed(0) : null;
      const systemisedVal = y5 > 0 ? (y5 * 12 / 1000000).toFixed(0) : null;
      const infraDelta = y5 > 0 ? ((y5 * 6) / 1000000).toFixed(0) : null;
      
      projectionEnforcement = `
## ⚠️ MANDATORY: USE THEIR FINANCIAL PROJECTIONS EXPLICITLY

Their documents contain real financial data. This differentiates a generic report from a personalised one.

### Extracted Numbers (verified from their documents):
${y1 > 0 ? `- Year 1 Revenue: £${y1.toLocaleString()}` : ''}
${y5 > 0 ? `- Year 5 Revenue: £${y5.toLocaleString()}` : ''}
${mult > 0 ? `- Growth Multiple: ${mult.toFixed(0)}x over 5 years` : ''}
${gm > 0 ? `- Gross Margin: ${(gm * 100).toFixed(0)}%` : ''}

### REQUIRED in your output:

**1. Executive Summary** - Reference their scale:
${y5 > 0 ? `- Use "£${(y5/1000000).toFixed(1)}M trajectory" or "${mult.toFixed(0)}x growth" in the headline` : '- Reference their growth ambitions'}

**2. Investment Context** - Show the math:
${investmentPct ? `- "£${phase1.toLocaleString()} represents ${investmentPct}% of Year 1 revenue"` : ''}
${gm > 0.7 ? `- "At ${(gm*100).toFixed(0)}% gross margins, efficiency savings go straight to profit"` : ''}

**3. Valuation Impact** (if Year 5 > £1M):
${y5 > 1000000 ? `- Founder-dependent (6x): £${founderDepVal}M
- Systemised (10-12x): £${systemisedVal}M  
- Infrastructure value: £${infraDelta}M difference
- Use this in closing: "The delta between 6x and 12x at your scale is £${infraDelta}M. That's what infrastructure is worth."` : ''}

**4. Closing Message** - ONE killer projection stat:
Pick the single most impactful:
${investmentPct ? `- "£${phase1.toLocaleString()} is ${investmentPct}% of your Year 1 revenue"` : ''}
${mult > 20 ? `- "${mult.toFixed(0)}x growth only happens with infrastructure"` : ''}
${infraDelta ? `- "£${infraDelta}M is what the infrastructure is worth at exit"` : ''}

### DO NOT:
- Mention projections without connecting to investment decision
- Use round/generic numbers when you have their exact figures
- Bury the projection data in the middle of the report
- List all the stats - pick the most powerful ONE for each section
`;
    } else {
      projectionEnforcement = `
## NO FINANCIAL PROJECTIONS AVAILABLE

No projection documents provided. Use assessment-based framing:
- Frame costs in terms of hours and manual work they mentioned
- Use industry benchmarks cautiously (state they're estimates)
- Focus on operational efficiency rather than revenue multiples
- Don't invent growth rates or revenue figures
`;
    }

    // ========================================================================
    // BUILD CLOSING MESSAGE GUIDANCE
    // ========================================================================
    
    const closingGuidance = buildClosingMessageGuidance(
      preparedData.discovery.responses,
      affordability
    );

    // ========================================================================
    // BUILD THE ANALYSIS PROMPT
    // ========================================================================

    const patternContext = preparedData.patternAnalysis ? `
## PATTERN ANALYSIS (Pre-computed)
- Destination Clarity: ${preparedData.patternAnalysis.destinationClarity?.score || 'N/A'}/10
- Contradictions: ${JSON.stringify(preparedData.patternAnalysis.contradictions || [])}
- Emotional State: Stress=${preparedData.patternAnalysis.emotionalState?.stressLevel}, Burnout Risk=${preparedData.patternAnalysis.emotionalState?.burnoutRisk}
- Capital Raising Detected: ${preparedData.patternAnalysis.capitalRaisingSignals?.detected || false}
- Lifestyle Transformation: ${preparedData.patternAnalysis.lifestyleTransformation?.detected || false}
` : '';

    const financialContext = preparedData.financialContext ? `
## KNOWN FINANCIALS
- Revenue: £${preparedData.financialContext.revenue?.toLocaleString() || 'Unknown'}
- Gross Margin: ${preparedData.financialContext.grossMarginPct || 'Unknown'}%
- Net Profit: £${preparedData.financialContext.netProfit?.toLocaleString() || 'Unknown'}
- Staff Count: ${preparedData.financialContext.staffCount || 'Unknown'}
` : '';

    const documentsContext = preparedData.documents.length > 0 ? `
## UPLOADED DOCUMENTS (USE THIS DATA!)
${preparedData.documents.map((doc: any, i: number) => `
### Document ${i + 1}: ${doc.fileName}
${doc.content}
`).join('\n')}
` : '';

    // Build context notes section
    const advisorNotes = preparedData.advisorContextNotes || [];
    const contextNotesSection = advisorNotes.length > 0 ? `
## ADVISOR CONTEXT NOTES (CRITICAL - TRUST THESE OVER ASSESSMENT!)
These are dated updates from the advisor that may supersede or add context to what the assessment captured.
The assessment captures a moment in time, these notes capture what's happened SINCE.

${advisorNotes.map((note: any) => {
  const dateStr = note.eventDate ? new Date(note.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';
  const futureFlag = note.isFutureEvent ? ' (PLANNED)' : '';
  const importanceEmoji = note.importance === 'critical' ? '🚨' : note.importance === 'high' ? '⚠️' : '';
  return `### ${importanceEmoji} ${note.title} [${dateStr}${futureFlag}]
Type: ${note.type}
${note.content}
`;
}).join('\n')}

USE THIS CONTEXT TO:
1. Update your understanding of their financial position (e.g., if they've raised funding)
2. Adjust affordability assessment (funding changes everything)
3. Understand upcoming milestones that affect timing (product launches, etc.)
4. Reference these specifics in your analysis ("Given your recent raise..." or "With your January launch...")

⚠️ CONTEXT NOTES RULES:
- You CAN reference facts stated in context notes
- You CANNOT infer unstated facts from context notes
- "Raised £1m" does NOT mean "professionally valued" unless valuation is explicitly stated
- "Launching in January" does NOT mean "product is ready" unless explicitly stated
- Frame context note facts as external knowledge: "Given your..." not "You said..."
` : '';

    // Build practice learning library section
    const learningLibrarySection = practiceLearnings.length > 0 ? `
## PRACTICE LEARNING LIBRARY (CRITICAL - FOLLOW THESE RULES!)

The following rules have been learned from previous analyses and corrections by this practice's advisors.
These represent the practice's accumulated wisdom and preferred style. ALWAYS follow these rules.

${practiceLearnings.map((learning: any, idx: number) => `
### Rule ${idx + 1}: ${learning.title}
Type: ${learning.learning_type}
**Rule:** ${learning.learning_rule}
${learning.learning_rationale ? `**Rationale:** ${learning.learning_rationale}` : ''}
${learning.before_example ? `
**❌ Before (don't do this):** ${learning.before_example.substring(0, 200)}...` : ''}
${learning.after_example ? `
**✅ After (do this instead):** ${learning.after_example.substring(0, 200)}...` : ''}
Confidence: ${Math.round((learning.confidence_score || 1) * 100)}% | Validated ${learning.times_validated || 0} times
`).join('\n')}

⚠️ LEARNING LIBRARY RULES:
- These rules are MANDATORY - they represent what this practice's advisors want
- If a rule says "never recommend X", do NOT recommend X
- If a rule says "always phrase Y as Z", phrase Y as Z
- These rules take precedence over general guidelines when they conflict
- Ignore rules if they would contradict specific client facts from context notes
` : '';

    // Build business stage context
    const stageContext = `
## BUSINESS STAGE ASSESSMENT
Stage: ${businessStage.stage}
Destination Timeframe: ${businessStage.destinationTimeframe}
Journey Framing: ${businessStage.journeyFraming}

${businessStage.stage === 'early-stage' ? `
⚠️ CRITICAL: This is an early-stage/high-growth client.
- Their ultimate destination is 3-5 YEARS away, NOT 12 months
- Frame the hero as "YOUR 5-YEAR DESTINATION" 
- Frame the journey as "THE FOUNDATIONS" not "achieving the dream"
- DO NOT promise they'll be a portfolio investor in 12 months
- Use "destinationLabel": "YOUR 5-YEAR DESTINATION"
- Use "destinationContext": "This is what the next 5 years builds."
- Use "journeyLabel": "THE FOUNDATIONS (12 months)"
- Use "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination"
` : ''}

${businessStage.stage === 'established' ? `
This is an established client looking to step back.
- Their destination is achievable in 12-18 months
- Frame as "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationLabel": "IN 12-18 MONTHS, YOU COULD BE..."
- Use "destinationContext": "This is what £13,300 and 12 months builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "12-18 months to fundamental change"
` : ''}

${businessStage.stage === 'scaling' ? `
This is a scaling business with high growth trajectory.
- Their destination is 2-3 years away
- Frame as meaningful progress toward destination
- Use "destinationLabel": "YOUR 2-3 YEAR DESTINATION"
- Use "destinationContext": "This is what the next 2-3 years builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "12 months to operational foundations; 2-3 years to full destination"
` : ''}

${businessStage.stage === 'lifestyle' ? `
This is a lifestyle business seeking work-life balance.
- Their destination is achievable in 6-12 months
- Frame as "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationLabel": "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationContext": "This is what £13,300 and 12 months builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "6-12 months to fundamental change"
` : ''}
`;

    const analysisPrompt = `
Analyse this discovery assessment for ${preparedData.client.name} (${preparedData.client.company || 'their business'}).

${balancedHealthSummary}

## CLIENT DISCOVERY RESPONSES
${JSON.stringify(preparedData.discovery.responses, null, 2)}

## EXTRACTED EMOTIONAL ANCHORS
${JSON.stringify(preparedData.discovery.extractedAnchors, null, 2)}

## EXISTING SERVICE RECOMMENDATIONS
${JSON.stringify(preparedData.discovery.recommendedServices, null, 2)}

${patternContext}
${financialContext}
${documentsContext}
${contextNotesSection}
${learningLibrarySection}
${stageContext}

## AFFORDABILITY ASSESSMENT
- Client Stage: ${affordability.stage}
- Cash Constrained: ${affordability.cashConstrained}
- Actively Raising: ${affordability.activelyRaising}
- Estimated Monthly Capacity: ${affordability.estimatedMonthlyCapacity}

${affordability.stage === 'pre-revenue' ? `
⚠️ PRE-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

## PHASE TIMING RULES

Phases are SEQUENTIAL milestones, not overlapping activities.

STANDARD PHASE STRUCTURE:
- Phase 1: Month 1-3 (Foundation)
- Phase 2: Month 3-6 (Build)  
- Phase 3: Month 6-12 (Transform)

TIMING RULES:
1. Phase 2 starts AFTER Phase 1 ends (Month 3, not Month 2)
2. Phase 3 starts AFTER Phase 2 ends (Month 6, not Month 1)
3. Each phase timeframe should be 3-6 months, not 12 months

SERVICE TIMING:
- Monthly services (Management Accounts): Start in Phase 1, continue through all phases
- One-time services (Systems Audit): Placed in the phase where they deliver impact
- Long-running programmes (Goal Alignment): Can span phases but should show the START phase

BAD EXAMPLE:
- Phase 1: Month 1-3, Management Accounts
- Phase 2: Month 2-4, Systems Audit  ← WRONG: overlaps
- Phase 3: Month 1-12, Goal Alignment Programme ← WRONG: spans everything

GOOD EXAMPLE:
- Phase 1: Month 1-3, "Investor-Ready Numbers" (Management Accounts £650/month)
- Phase 2: Month 3-6, "Operational Clarity" (Systems Audit £4,000)
- Phase 3: Month 6-12, "The Transition" (Goal Alignment Programme £1,500)

The TRANSFORMATION is the narrative arc. Services enable each phase but don't define the timing.

Phase 1 - Foundation (Month 1-3, Start Now, max £15,000/year):
- Only recommend what they NEED NOW
- Focus on services that help them raise or launch faster
- Management Accounts + Systems Audit are appropriate

Phase 2 - Post-Raise (Month 3-6, After funding):
- Fractional executives go here
- Frame as "when you've closed your round"
- Starts AFTER Phase 1 ends

Phase 3 - At Scale (Month 6-12, when revenue supports):
- Full operational support
- Only mention as future horizon
- Starts AFTER Phase 2 ends

CRITICAL: Headline the Phase 1 number. Do NOT say "total investment £150k" to a pre-revenue startup.
` : ''}

${affordability.stage === 'early-revenue' ? `
EARLY-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

Phase 1 - Essential (Start Now, max £36,000/year):
- Management Accounts and Systems Audit
- Goal Alignment if transformation needed
- Focus on efficiency gains that pay for themselves

Phase 2 - Growth Support (3-6 months):
- Fractional CFO at lower tier
- As revenue stabilises

Phase 3 - Full Support (12+ months):
- Full fractional suite when revenue supports
` : ''}

## GOAL ALIGNMENT DETECTION
${transformationSignals.reasons.length > 0 ? `
🎯 GOAL ALIGNMENT TRANSFORMATION TRIGGERS DETECTED:
${transformationSignals.reasons.map(r => `- ${r}`).join('\n')}

Even if they have a business plan, recommend Goal Alignment because they need structured support for their PERSONAL transformation, not just business strategy.

Position Goal Alignment as: "You have a business plan. What you don't have is a structured path to becoming the person in your 5-year vision. The Goal Alignment programme bridges that gap."
` : 'No specific transformation triggers detected.'}

${documentInsightsContext}
${financialGroundingContext}

${bindingConstraintsPrompt}

## PRE-COMPUTED RECOMMENDATION DETAILS (Use these for your output)

The following recommendation details have been computed. Use these exact values:

### SERVICES TO RECOMMEND:
${appropriateRecommendations.recommended.map(r => `
**${r.name}** (${r.code})
- Investment: £${r.investment.toLocaleString()}
- Score: ${r.score}/100, Confidence: ${r.confidence}
- Reasoning: ${r.reasoning}
- Specific Benefit: ${r.specificBenefit}
- Value Created: ${r.valueCreated ? `£${r.valueCreated.toLocaleString()}` : 'See calculation'}
- Calculation: ${r.valueCalculation}
- ROI: ${r.roiRatio}
`).join('\n')}

### SERVICES NOT TO RECOMMEND (MUST include in "notRecommended" output section):
${bindingAppropriateness.notAppropriate.map(s => `
- **${s.name}** (${s.code}): ${s.reason}
`).join('\n') || 'None - all services are appropriate.'}

### GROUNDED ROI WITH VALUATION IMPACT (Use these EXACT figures):
- **Total Investment**: £${groundedROI.investmentTotal.toLocaleString()}
- **Investment Breakdown**: ${groundedROI.investmentBreakdown}
${groundedROI.investmentAsPercentOfTurnover ? `- **As % of Turnover**: ${groundedROI.investmentAsPercentOfTurnover}` : ''}
${groundedROI.investmentAsPercentOfEbitda ? `- **As % of EBITDA**: ${groundedROI.investmentAsPercentOfEbitda}` : ''}
${groundedROI.valuationContext ? `
### VALUATION CONTEXT (EXIT-FOCUSED):
- Current EBITDA: £${Math.round(groundedROI.valuationContext.currentEbitda / 1000)}k
- Current Multiple: ${groundedROI.valuationContext.currentMultiple}x (founder-dependent)
- Current Valuation: £${Math.round(groundedROI.valuationContext.currentValuation / 1000)}k
- Payroll Savings: £${groundedROI.valuationContext.payrollSavings.toLocaleString()}/year
- Improved EBITDA: £${Math.round(groundedROI.valuationContext.improvedEbitda / 1000)}k
- Improved Multiple: ${groundedROI.valuationContext.improvedMultiple}x (risks addressed)
- Potential Valuation: £${Math.round(groundedROI.valuationContext.potentialValuation / 1000)}k
- **Valuation Uplift: £${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k**
- Calculation: ${groundedROI.valuationContext.calculation}
` : ''}

### SERVICE-BY-SERVICE ROI:
${groundedROI.serviceROIs.map(s => `| ${s.service} | £${s.investment.toLocaleString()} | ${s.valueCreated ? `£${s.valueCreated.toLocaleString()}` : 'TBC'} | ${s.roiRatio} | ${s.confidence} |`).join('\n')}

### TOTALS:
- Total Value Created: ${groundedROI.totalValueCreated > 0 ? `£${groundedROI.totalValueCreated.toLocaleString()}` : groundedROI.valuationContext ? `£${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k (valuation impact)` : 'TBC on engagement'}
- Total ROI: ${groundedROI.totalROI}

### SANITY CHECKS:
- Investment vs Turnover: ${groundedROI.sanityChecks.investmentVsTurnover.value.toFixed(2)}% [${groundedROI.sanityChecks.investmentVsTurnover.status.toUpperCase()}]
- Investment vs EBITDA: ${groundedROI.sanityChecks.investmentVsEbitda.value.toFixed(1)}% [${groundedROI.sanityChecks.investmentVsEbitda.status.toUpperCase()}]
- Minimum ROI: ${groundedROI.sanityChecks.minimumROI.value.toFixed(0)}:1 [${groundedROI.sanityChecks.minimumROI.status.toUpperCase()}]

**ROI Summary**: ${groundedROI.roiSummary}

## ⚠️ MANDATORY: PROJECTED RETURN & PAYBACK (USE THESE EXACT VALUES)

These values have been pre-calculated. Use them EXACTLY in the investmentSummary output.

${payrollAnalysis && payrollAnalysis.annualExcess > 0 ? `
**ANNUAL SAVINGS (from payroll efficiency)**:
- Payroll excess identified: £${payrollAnalysis.annualExcess.toLocaleString()}/year
- Conservative recovery (50%): £${Math.round(payrollAnalysis.annualExcess * 0.5).toLocaleString()}/year
- Optimistic recovery (75%): £${Math.round(payrollAnalysis.annualExcess * 0.75).toLocaleString()}/year
- Use in output: "£${Math.round(payrollAnalysis.annualExcess * 0.5 / 1000)}k-${Math.round(payrollAnalysis.annualExcess * 0.75 / 1000)}k/year"
` : ''}

${groundedROI.valuationContext ? `
**VALUATION IMPACT (exit-focused)**:
- Current valuation: £${Math.round(groundedROI.valuationContext.currentValuation / 1000)}k
- Potential valuation: £${Math.round(groundedROI.valuationContext.potentialValuation / 1000)}k
- Uplift: £${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k
` : ''}

**PROJECTED RETURN** (COPY THIS EXACTLY):
\`projectedReturn\`: "${payrollAnalysis && payrollAnalysis.annualExcess > 0 && groundedROI.valuationContext 
  ? `£${Math.round((payrollAnalysis.annualExcess * 0.5 + groundedROI.valuationContext.valuationUplift * 0.5) / 1000)}k-${Math.round((payrollAnalysis.annualExcess * 0.75 + groundedROI.valuationContext.valuationUplift) / 1000)}k`
  : payrollAnalysis && payrollAnalysis.annualExcess > 0
    ? `£${Math.round(payrollAnalysis.annualExcess * 0.5 / 1000)}k-${Math.round(payrollAnalysis.annualExcess * 0.75 / 1000)}k/year`
    : groundedROI.valuationContext
      ? `£${Math.round(groundedROI.valuationContext.valuationUplift * 0.5 / 1000)}k-${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k`
      : 'Valuation clarity + exit readiness'}"

**PAYBACK PERIOD** (COPY THIS EXACTLY):
\`paybackPeriod\`: "${payrollAnalysis && payrollAnalysis.annualExcess > 0 
  ? `${Math.ceil((groundedROI.investmentTotal / (payrollAnalysis.annualExcess * 0.5)) * 12)} months`
  : groundedROI.valuationContext 
    ? 'At exit'
    : 'Strategic investment'}"

**ROI RATIO** (COPY THIS EXACTLY):
\`roiRatio\`: "${groundedROI.totalROI}"

⚠️ CRITICAL: 
1. Use these EXACT figures in your output - do NOT leave projectedReturn, paybackPeriod, or roiRatio blank
2. Do not add services beyond those recommended
3. Include the NOT RECOMMENDED section in your output with the exact reasons given
4. Show your calculations using the numbers above

## PRE-COMPUTED SERVICE SCORES (use as guidance)
These scores are computed from explicit question triggers. The AI should generally agree,
but can adjust based on holistic assessment. If deviating significantly, explain why.

${serviceScores
  .filter(s => s.score >= 20)
  .map(s => `- **${s.name}** (${s.code}): ${s.score}/100
  Triggers: ${s.triggers.join('; ')}`)
  .join('\n\n')}

${advisoryInsights ? `
## ADVISORY DEEP DIVE INSIGHTS (Stage 2 Analysis)

The following service recommendations and insights have been pre-analyzed using our advisory logic:

### EXTRACTED METRICS
${JSON.stringify(advisoryInsights.extractedMetrics, null, 2)}

### PHASED SERVICE RECOMMENDATIONS
**Phase 1 (Start Now):**
${advisoryInsights.serviceRecommendations.phase1.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase1.totalInvestment.toLocaleString()}
Rationale: ${advisoryInsights.serviceRecommendations.phase1.rationale}

${advisoryInsights.serviceRecommendations.phase2 ? `
**Phase 2 (${advisoryInsights.serviceRecommendations.phase2.timing}):**
${advisoryInsights.serviceRecommendations.phase2.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase2.totalInvestment.toLocaleString()}
Trigger: ${advisoryInsights.serviceRecommendations.phase2.trigger}
` : ''}

${advisoryInsights.serviceRecommendations.phase3 ? `
**Phase 3 (${advisoryInsights.serviceRecommendations.phase3.timing}):**
${advisoryInsights.serviceRecommendations.phase3.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase3.totalInvestment.toLocaleString()}
Trigger: ${advisoryInsights.serviceRecommendations.phase3.trigger}
` : ''}

### KEY FIGURES
${Object.entries(advisoryInsights.keyFigures || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

### TOP NARRATIVE HOOKS
${advisoryInsights.topNarrativeHooks?.map((hook: string) => `- ${hook}`).join('\n') || 'None provided'}

### OVERSELLING CHECK
${advisoryInsights.oversellingCheck.rulesApplied.length > 0 ? `
Rules Applied: ${advisoryInsights.oversellingCheck.rulesApplied.join(', ')}
Services Excluded: ${advisoryInsights.oversellingCheck.servicesExcluded.join(', ') || 'None'}
Phase 1 Capped: ${advisoryInsights.oversellingCheck.phase1Capped ? 'Yes' : 'No'}
${advisoryInsights.oversellingCheck.explanation ? `Explanation: ${advisoryInsights.oversellingCheck.explanation}` : ''}
` : 'No overselling rules applied'}

**USE THESE INSIGHTS TO:**
1. Validate and refine the service recommendations in your analysis
2. Use the narrative hooks as starting points for compelling copy
3. Reference the key figures in your ROI calculations
4. Respect the phasing logic - don't recommend Phase 2/3 services in Phase 1
5. Incorporate the quantified impacts into your value propositions

**IMPORTANT:** These are advisory insights, not final recommendations. You should still apply your judgment and client-specific context, but use these as a strong foundation.
` : ''}

${projectionEnforcement}

${closingGuidance}

## GAP SCORE CALIBRATION - REVISED

Score based on severity counts:
- Each CRITICAL gap = 2 points
- Each HIGH gap = 1 point
- Each MEDIUM gap = 0.5 points

Base score = 3 (everyone has some gaps)
Final score = Base + Critical×2 + High×1 + Medium×0.5 (cap at 10)

EXAMPLES:
- 2 critical + 2 high = 3 + 4 + 2 = 9 → show as 8/10 (round conservatively)
- 2 critical + 1 high = 3 + 4 + 1 = 8 → show as 7/10
- 1 critical + 2 high = 3 + 2 + 2 = 7 → show as 6/10
- 0 critical + 3 high = 3 + 0 + 3 = 6 → show as 5/10

For Ben Stocken example:
- 2 CRITICAL (financial visibility, founder dependency)
- 2 HIGH (manual work, systems at scale)
- Score = 3 + 4 + 2 = 9 → **display as 7 or 8/10**

A score of 6/10 with 2 critical gaps undersells the urgency.

## AVAILABLE SERVICES
${JSON.stringify(activeServicePricing, null, 2)}

## OUTPUT FORMAT - CRITICAL: USE EXACT FIELD NAMES

⚠️ THE UI WILL BREAK IF YOU USE DIFFERENT FIELD NAMES ⚠️

BEFORE generating the report, mentally verify each factual claim has a source.

Return ONLY a valid JSON object (no markdown, no explanation, just the JSON):

{
  "verifiedFacts": {
    "fromResponses": ["list of facts directly quoted from their assessment responses"],
    "fromContextNotes": ["list of facts from advisor context notes"],
    "calculated": ["list of calculated figures with working shown"]
  },
  "executiveSummary": {
    "headline": "Destination vs current reality in one sentence (e.g., 'You're building for legacy but operating in chaos.')",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes",
    "destinationVision": "The life they described - ONE specific detail, not a list",
    "currentReality": "Where they are now - concrete, not abstract",
    "criticalInsight": "The gap between destination and reality",
    "urgencyStatement": "Why the destination stays distant without action"
  },
  "destinationAnalysis": {
    "theDestination": "Paint the picture: what does their life look like when they arrive? Use THEIR words and details.",
    "fiveYearVision": "Their stated destination in their words",
    "coreEmotionalDrivers": [{ "driver": "Freedom/Legacy/Security", "evidence": "exact quote", "whatItMeans": "why this matters to them" }],
    "lifestyleGoals": ["Pick ONE specific non-business goal they mentioned - the postcard image"]
  },
  "gapAnalysis": {
    "primaryGaps": [{ 
      "gap": "specific gap", 
      "category": "Financial", 
      "severity": "critical", 
      "evidence": "quote", 
      "currentImpact": { "timeImpact": "X hours/week", "financialImpact": "£X - REAL cost, not opportunity cost", "emotionalImpact": "how it feels" } 
    }],
    "costOfInaction": { 
      "annualFinancialCost": "£X,XXX - use REAL costs only (labour waste, revenue leakage), not inflated opportunity costs", 
      "personalCost": "The destination stays distant - reference ONE specific thing they want that won't happen", 
      "compoundingEffect": "How another year of inaction pushes the destination further away" 
    }
  },
  "transformationJourney": {
    "destinationLabel": "YOUR 5-YEAR DESTINATION" or "IN 12 MONTHS, YOU COULD BE..." (based on business stage),
    "destination": "One sentence: the life they described (e.g., 'Portfolio investor. School drop-offs. A business that runs without you.')",
    "destinationContext": "This is what the next 5 years builds." or "This is what £13,300 and 12 months builds." (based on stage),
    "journeyLabel": "THE FOUNDATIONS (12 months)" or "YOUR JOURNEY" (based on stage),
    "totalInvestment": "£X,XXX", // MUST match sum of all phase services (Phase 1 = First Year for most clients)
    "investmentBreakdown": "£X,XXX management accounts + £X,XXX systems audit + £X,XXX Goal Alignment programme", // Show your working
    "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination" or "12-18 months to fundamental change" (based on stage),
    "phases": [
      {
        "phase": 1,
        "timeframe": "Month 1-3", // Always starts at Month 1
        "title": "Short punchy title (e.g., 'Financial Clarity')",
        "youWillHave": "What their life/business looks like at this point. Concrete, tangible, desirable.",
        "whatChanges": "One sentence on the shift (e.g., 'The fog lifts. You stop guessing.')",
        "enabledBy": "Service name - this is the plane, not the destination",
        "enabledByCode": "service_code_for_ui",
        "investment": "£X,XXX/frequency"
      },
      {
        "phase": 2,
        "timeframe": "Month 3-6", // Starts where Phase 1 ends (NOT Month 2-4)
        "title": "Next phase title",
        "youWillHave": "Next milestone in their journey",
        "whatChanges": "What's different now",
        "enabledBy": "Service name",
        "enabledByCode": "service_code",
        "investment": "£X,XXX"
      },
      {
        "phase": 3,
        "timeframe": "Month 6-12",
        "title": "The destination phase",
        "youWillHave": "The life they described. Reference ONE specific vision detail.",
        "whatChanges": "The fundamental transformation",
        "enabledBy": "Service name",
        "enabledByCode": "service_code",
        "investment": "£X,XXX"
      }
    ]
  },
  "recommendedInvestments": [
    {
      "service": "Service name",
      "code": "service_code",
      "priority": 1,
      "recommendedTier": "tier name",
      "investment": "£X,XXX",
      "investmentFrequency": "per month or one-time",
      "whyThisService": "Why they need this based on their responses",
      "expectedROI": "Xx in Y months",
      "keyOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"]
    }
  ],
  "financialContext": {
    "hasAccounts": true, // Did we have actual financial documents?
    "source": "statutory_accounts", // or "management_accounts" or "projection"
    "keyMetrics": {
      "turnover": 2277603, // Use exact figures if available
      "operatingProfit": 377321,
      "operatingMarginPct": 16.6,
      "ebitda": 406000,
      "totalStaffCosts": 831000,
      "staffCostsPct": 36.5,
      "netAssets": 1478592,
      "employeeCount": 21
    },
    "payrollAnalysis": {
      "calculation": "Staff costs £831k ÷ Turnover £2.28m = 36.5%", // SHOW YOUR WORKING
      "industryBenchmark": "28-30% for distribution/wholesale",
      "assessment": "elevated", // efficient/typical/elevated/concerning
      "potentialExcess": 54000, // Only if elevated/concerning
      "excessCalculation": "£2.28m × (36.5% - 30%) = £148k gross, conservative £54k recoverable"
    }
  },
  "clientStage": {
    "journey": "established-exit-focused", // or pre-revenue-building, early-stage-growing, established-scaling, established-optimising, lifestyle-maintaining
    "focusAreas": ["Exit preparation", "Valuation optimisation", "Efficiency gains"],
    "inappropriateServices": ["systems_audit", "automation", "fractional_coo"], // Services NOT to recommend
    "journeyFraming": "Your destination is a successful exit. The question is: what will maximise your value and ensure your team is taken care of?"
  },
  "notRecommended": [
    {
      "service": "Management Accounts",
      "reason": "Already has accountant providing regular financial reporting"
    },
    {
      "service": "Systems Audit", 
      "reason": "Business runs smoothly. Owner works <30 hours. No systems problem to solve."
    },
    {
      "service": "Fractional COO",
      "reason": "Business runs fine. One-time restructuring doesn't justify ongoing £45k/year COO."
    }
  ],
  "investmentSummary": {
    "totalFirstYearInvestment": "£10,000", // Sum of all recommended services
    "investmentBreakdown": "Business Advisory £4,000 + Benchmarking £3,500 + Hidden Value Audit £2,500",
    "investmentAsPercentOfTurnover": "0.44%", // MUST be <3%
    "investmentAsPercentOfEbitda": "2.5%", // MUST be <15%
    
    // ⚠️ MANDATORY ROI FIELDS - MUST BE POPULATED:
    "projectedReturn": "£250k-475k", // Use groundedROI calculation - NEVER leave blank
    "projectedReturnBreakdown": "£54-74k/year savings + £200-400k valuation uplift",
    "paybackPeriod": "2-3 months", // Use groundedROI calculation - NEVER leave blank  
    "paybackCalculation": "£10,000 ÷ £54k/year = 2.2 months",
    "roiRatio": "70:1", // Use groundedROI.totalROI
    
    "valuationContext": {
      "currentEbitda": 406000,
      "currentMultiple": 3.0,
      "currentValuation": 1218000,
      "payrollSavings": 74000,
      "improvedEbitda": 480000,
      "improvedMultiple": 4.0,
      "potentialValuation": 1920000,
      "valuationUplift": 702000,
      "calculation": "Current £406k × 3.0x = £1.22m. With payroll savings and risks addressed: £480k × 4.0x = £1.92m. Uplift: £702k."
    },
    "serviceROIs": [
      {
        "service": "Business Advisory",
        "investment": 4000,
        "valueCreated": "Foundational",
        "calculation": "Foundation for £702k valuation improvement",
        "roi": "Foundational"
      },
      {
        "service": "Benchmarking",
        "investment": 3500,
        "valueCreated": 259000,
        "calculation": "Validates £148k excess → 50% = £74k/year → at 3.5x = £259k",
        "roi": "74:1"
      },
      {
        "service": "Hidden Value Audit",
        "investment": 2500,
        "valueCreated": 554000,
        "calculation": "Multiple improvement 3x→4x on £554k EBITDA",
        "roi": "222:1"
      }
    ],
    "totalValueCreated": "£702,000 valuation uplift",
    "totalROI": "70:1",
    "sanityChecks": {
      "investmentVsTurnover": "0.44% [OK - under 3%]",
      "investmentVsEbitda": "2.5% [OK - under 15%]",
      "minimumROI": "70:1 [OK - above 10:1]"
    },
    "roiSummary": "Investment of £10,000 (0.44% of turnover) targets £702k valuation improvement (£1.22m → £1.92m). ROI: 70:1."
  },
  "recommendedNextSteps": [
    { "step": 1, "action": "Schedule discovery call", "timing": "This week", "owner": "Oracle team" }
  ],
  "closingMessage": {
    "personalNote": "Acknowledge vulnerability, name the destination they want, state the gap. DESTINATION FIRST, investment second.",
    "callToAction": "One sentence. Let's talk this week.",
    "urgencyReminder": "Why the destination stays distant without action - ONE sentence"
  }
}

CRITICAL FIELD NAME REQUIREMENTS:
- Include BOTH "transformationJourney" AND "recommendedInvestments" (for backwards compatibility)
- transformationJourney phases need: "phase", "timeframe", "title", "youWillHave", "whatChanges", "enabledBy", "enabledByCode", "investment"
- recommendedInvestments need: "service", "code", "priority", "recommendedTier", "investment", "investmentFrequency", "whyThisService", "expectedROI", "keyOutcomes"
- Use "totalFirstYearInvestment" NOT "total" or "totalFirstYear"
- Use "recommendedNextSteps" with "step", "action", "timing", "owner"

TRANSFORMATION JOURNEY PHILOSOPHY:
You are a travel agent selling a holiday, not an airline selling seats.

CRITICAL: DESTINATION TIMEFRAME MUST BE REALISTIC
- The ULTIMATE DESTINATION is the life they described (school drop-offs, freedom, the portfolio)
- BUT: The timeframe to reach that destination depends on their business stage
- The 12-MONTH JOURNEY is about BUILDING THE FOUNDATION, not achieving the final destination

TIMEFRAME CALIBRATION (use financial projections if available):

1. PRE-REVENUE / EARLY-STAGE STARTUPS (like clients with 5-year growth trajectories):
   - Ultimate destination: 3-5 YEARS away
   - 12-month milestone: "The infrastructure that makes it possible"
   - Frame as: "In 12 months, you'll have the foundations for..."
   - Hero text: "YOUR 5-YEAR DESTINATION" (not "In 12 months")
   - DO NOT promise they'll be a "portfolio investor" in 12 months when they haven't launched yet!

2. ESTABLISHED BUSINESSES (stable revenue, looking to exit or step back):
   - Ultimate destination: 12-18 months away
   - 12-month milestone: Meaningful progress toward destination
   - Frame as: "IN 12 MONTHS, YOU COULD BE..."

3. LIFESTYLE BUSINESSES (owner wants work-life balance, not scaling):
   - Ultimate destination: 6-12 months away
   - 12-month milestone: The destination itself
   - Frame as: "In 12 months, you could be..."

HOW TO DETECT BUSINESS STAGE:
- Check for growth projections showing 5+ year trajectory → Early-stage
- Check for "launching soon" or "pre-revenue" language → Early-stage
- Check for exit timeline of 3-5 years → Established
- Check for mentions of "raising capital" or "investors" → Early-stage/Scaling
- Check for "stepping back" or "retirement" → Established

ADJUST THE HERO SECTION ACCORDINGLY:

For early-stage (Ben's case):
{
  "destinationLabel": "YOUR 5-YEAR DESTINATION",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what the next 5 years builds.",
  "journeyLabel": "THE FOUNDATIONS (12 months)",
  "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination"
}

For established businesses:
{
  "destinationLabel": "IN 12-18 MONTHS, YOU COULD BE...",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what £13,300 and 12 months builds.",
  "journeyLabel": "YOUR JOURNEY",
  "totalTimeframe": "12-18 months to fundamental change"
}

Write "youWillHave" as if describing a postcard from that point in the journey:
BAD: "Monthly financial visibility and investor-ready reporting" (feature list)
GOOD: "Investor-ready numbers. Answers when VCs ask questions. Decisions based on data, not gut." (what life feels like)

Write "whatChanges" as the shift they'll feel:
BAD: "Improved financial oversight"
GOOD: "The fog lifts. You stop guessing."

TRANSFORMATION JOURNEY SCHEMA - ADJUST TIMEFRAME TO BUSINESS STAGE:

For EARLY-STAGE / HIGH-GROWTH clients (e.g., pre-revenue startup with 5-year projections):
{
  "destinationLabel": "YOUR 5-YEAR DESTINATION",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what the next 5 years builds.",
  "journeyLabel": "THE FOUNDATIONS (12 months)",
  "totalInvestment": "£13,300 (Phase 1)",
  "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination",
  "phases": [
    {
      "phase": 1,
      "timeframe": "Month 1-3",
      "title": "Financial Clarity",
      "youWillHave": "Investor-ready numbers. Answers when VCs ask questions. Decisions based on data, not gut.",
      "whatChanges": "The fog lifts. You stop guessing.",
      "enabledBy": "Management Accounts",
      "enabledByCode": "management_accounts",
      "investment": "£650/month"
    },
    {
      "phase": 2,
      "timeframe": "Month 3-6",
      "title": "Operational Freedom",
      "youWillHave": "A team that runs without firefighting. Manual work mapped and prioritised for automation. Your evenings back.",
      "whatChanges": "You work ON the business, not IN it.",
      "enabledBy": "Systems Audit",
      "enabledByCode": "systems_audit",
      "investment": "£4,000"
    },
    {
      "phase": 3,
      "timeframe": "Month 6-12",
      "title": "The Transition",
      "youWillHave": "A structured path from operator to investor. The school drop-offs you described. Progress toward the portfolio life.",
      "whatChanges": "You become optional to daily operations.",
      "enabledBy": "Goal Alignment Programme",
      "enabledByCode": "goal_alignment_lite",
      "investment": "£1,500"
    }
  ]
}

Notice: Every "youWillHave" describes LIFE, not FEATURES. The services are afterthoughts.

NOTE: Output BOTH transformationJourney AND recommendedInvestments. The frontend will transition from the old view to the new view, and needs both during the migration.

Return ONLY the JSON object with no additional text.`;

    // ========================================================================
    // CALL CLAUDE OPUS 4.5
    // ========================================================================

    // Log prompt size to help debug token limits
    const promptSize = analysisPrompt.length;
    const systemSize = SYSTEM_PROMPT.length;
    console.log(`Prompt sizes - System: ${systemSize} chars, User: ${promptSize} chars, Total: ${systemSize + promptSize} chars`);
    console.log('Calling Claude Opus 4.5...');
    const llmStartTime = Date.now();

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Analysis'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 12000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    const llmTime = Date.now() - llmStartTime;
    console.log(`LLM response in ${llmTime}ms`);

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter error status:', openrouterResponse.status);
      console.error('OpenRouter error body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('OpenRouter error details:', JSON.stringify(errorJson, null, 2));
        throw new Error(`AI analysis failed: ${errorJson?.error?.message || errorJson?.message || openrouterResponse.status}`);
      } catch (e) {
        throw new Error(`AI analysis failed: ${openrouterResponse.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const openrouterData = await openrouterResponse.json();
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';
    
    if (!analysisText) {
      throw new Error('Empty response from AI');
    }

    console.log('[Discovery] Raw LLM response length:', analysisText.length);
    console.log('[Discovery] First 500 chars:', analysisText.substring(0, 500));
    console.log('[Discovery] Last 200 chars:', analysisText.substring(analysisText.length - 200));

    // Parse JSON from response with robust extraction
    console.log('[Discovery] Starting JSON parsing...');
    let analysis;
    try {
      let jsonString = analysisText;
      
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        console.log('[Discovery] Extracted from code block');
      }
      
      // Find the actual JSON object boundaries
      if (!jsonString.trim().startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
          console.log('[Discovery] Extracted JSON from position', jsonStart, 'to', jsonEnd);
        }
      }
      
      analysis = JSON.parse(jsonString);
      console.log('[Discovery] JSON parsed successfully');
      
      // ======================================================================
      // FORCE CORRECTION: Fix wrong payroll figures in LLM output
      // ======================================================================
      if (payrollAnalysis) {
        const analysisStr = JSON.stringify(analysis);
        const { correctedText, corrections } = forceCorrectPayrollFigures(analysisStr, payrollAnalysis);
        
        if (corrections.length > 0) {
          console.log('[FORCE CORRECTION] Payroll figure corrections applied:', corrections);
          try {
            analysis = JSON.parse(correctedText);
          } catch (e) {
            console.error('[FORCE CORRECTION] Failed to parse corrected JSON, using original');
          }
        }
      }
      
      // ======================================================================
      // FORCE CORRECTION: Fix wrong investment totals
      // ======================================================================
      // Build the authoritative service list from binding appropriateness
      const authoritativeServices = bindingAppropriateness.appropriate.map(s => ({
        name: s.name,
        code: s.code,
        price: s.investment
      }));
      
      if (authoritativeServices.length > 0) {
        const { correctedAnalysis, corrections } = forceCorrectInvestmentTotal(analysis, authoritativeServices);
        
        if (corrections.length > 0) {
          console.log('[FORCE CORRECTION] Investment total corrections applied:', corrections);
          analysis = correctedAnalysis;
        }
      }
      
      // Debug: Log the structure of the parsed analysis
      console.log('[Discovery] Analysis structure:', {
        hasExecutiveSummary: !!analysis.executiveSummary,
        hasGapAnalysis: !!analysis.gapAnalysis,
        hasTransformationJourney: !!analysis.transformationJourney,
        transformationJourneyPhases: analysis.transformationJourney?.phases?.length || 0,
        hasRecommendedInvestments: !!analysis.recommendedInvestments,
        recommendedInvestmentsCount: analysis.recommendedInvestments?.length || 0,
        hasInvestmentSummary: !!analysis.investmentSummary,
        hasClosingMessage: !!analysis.closingMessage
      });
      
      // Debug: Log first transformation phase if exists
      if (analysis.transformationJourney?.phases?.[0]) {
        console.log('[Discovery] First transformation phase:', JSON.stringify(analysis.transformationJourney.phases[0], null, 2));
      }
      
      // Debug: Log first investment if exists
      if (analysis.recommendedInvestments?.[0]) {
        console.log('[Discovery] First investment:', JSON.stringify(analysis.recommendedInvestments[0], null, 2));
      }
      
      // DIAGNOSTIC TRACE: Investments from LLM output
      if (analysis.recommendedInvestments && Array.isArray(analysis.recommendedInvestments)) {
        traceInvestmentTotal('G1_LLM_OUTPUT_RAW', 
          analysis.recommendedInvestments.map((inv: any) => ({
            name: inv.service || inv.name || 'Unknown',
            code: inv.code || '',
            price: typeof inv.investment === 'number' ? inv.investment :
                   parseInt((inv.investment || inv.price || '0').toString().replace(/[£,]/g, '')) || 0
          }))
        );
      }
      
      // Normalize investment structure in case of field name variations
      if (analysis.recommendedInvestments && Array.isArray(analysis.recommendedInvestments)) {
        analysis.recommendedInvestments = analysis.recommendedInvestments.map((inv: any) => ({
          service: inv.service || inv.serviceName || inv.name || 'Unknown Service',
          code: inv.code || inv.serviceCode || '',
          priority: inv.priority || inv.order || 1,
          recommendedTier: inv.recommendedTier || inv.tier || '',
          investment: inv.investment || inv.price || inv.cost || '',
          investmentFrequency: inv.investmentFrequency || inv.frequency || inv.period || 'per month',
          whyThisTier: inv.whyThisTier || inv.reasoning || '',
          problemsSolved: inv.problemsSolved || inv.problems || [],
          expectedROI: {
            multiplier: inv.expectedROI?.multiplier || inv.roi?.multiplier || inv.roi?.multiple || '',
            timeframe: inv.expectedROI?.timeframe || inv.roi?.timeframe || inv.roi?.period || '',
            calculation: inv.expectedROI?.calculation || inv.roi?.calculation || ''
          },
          keyOutcomes: inv.keyOutcomes || inv.outcomes || [],
          riskOfNotActing: inv.riskOfNotActing || inv.risk || ''
        }));
        console.log('[Discovery] Normalised investments:', analysis.recommendedInvestments.length);
        
        // ======================================================================
        // BINDING CONSTRAINT ENFORCEMENT - Validate and auto-correct recommendations
        // ======================================================================
        console.log('[Discovery] Validating recommendations against binding constraints...');
        
        const validation = validateRecommendationsAgainstConstraints(
          analysis.recommendedInvestments,
          bindingAppropriateness
        );
        
        if (!validation.valid) {
          console.warn('[Discovery] ⚠️ CONSTRAINT VIOLATIONS DETECTED:', validation.errors);
          
          // Auto-correct the recommendations
          analysis.recommendedInvestments = autoCorrectRecommendations(
            analysis.recommendedInvestments,
            bindingAppropriateness,
            appropriateRecommendations.recommended
          );
          
          // Add warning to output for transparency
          analysis.validationWarnings = validation.errors;
          analysis.wasAutoCorrected = true;
          
          console.log('[Discovery] ✅ Recommendations auto-corrected:', 
            analysis.recommendedInvestments.map((r: any) => r.code || r.service));
        } else {
          console.log('[Discovery] ✓ All recommendations valid, no corrections needed');
          analysis.wasAutoCorrected = false;
        }
        
        // Ensure notRecommended section exists and is complete
        if (!analysis.notRecommended || analysis.notRecommended.length === 0) {
          // Build notRecommended from binding constraints
          analysis.notRecommended = bindingAppropriateness.notAppropriate.map(s => ({
            service: s.name,
            code: s.code,
            reason: s.reason
          }));
          console.log('[Discovery] Added notRecommended section with', analysis.notRecommended.length, 'services');
        }
      }
      
      // ======================================================================
      // VALIDATE & CORRECT TRANSFORMATION JOURNEY PHASES
      // ======================================================================
      try {
        if (analysis.transformationJourney?.phases && Array.isArray(analysis.transformationJourney.phases) && bindingAppropriateness.notAppropriate.length > 0) {
          const blockedCodes = bindingAppropriateness.notAppropriate.map(s => s.code.toLowerCase());
          const blockedNames = bindingAppropriateness.notAppropriate.map(s => s.name.toLowerCase());
          
          console.log('[Discovery] Validating transformation journey phases...');
          console.log('[Discovery] Blocked service codes:', blockedCodes);
          
          // Check each phase for blocked services
          const originalPhaseCount = analysis.transformationJourney.phases.length;
          analysis.transformationJourney.phases = analysis.transformationJourney.phases.filter((phase: any) => {
            const enabledByCode = (phase.enabledByCode || '').toLowerCase();
            const enabledBy = (phase.enabledBy || '').toLowerCase();
            
            // Check if this phase references a blocked service
            const isBlocked = blockedCodes.some(code => enabledByCode.includes(code)) ||
                             blockedNames.some(name => enabledBy.includes(name));
            
            if (isBlocked) {
              console.warn(`[Discovery] ⚠️ REMOVING PHASE: "${phase.title}" - enabled by blocked service: ${phase.enabledBy}`);
              return false;
            }
            return true;
          });
          
          if (analysis.transformationJourney.phases.length !== originalPhaseCount) {
            console.log(`[Discovery] Removed ${originalPhaseCount - analysis.transformationJourney.phases.length} phases with blocked services`);
            analysis.transformationJourneyWasCorrected = true;
            
            // Re-number the phases
            analysis.transformationJourney.phases = analysis.transformationJourney.phases.map((phase: any, index: number) => ({
              ...phase,
              phase: index + 1
            }));
          }
          
          // Recalculate total investment from remaining phases
          let totalInvestment = 0;
          analysis.transformationJourney.phases.forEach((phase: any) => {
            const investment = phase.investment || '';
            const match = investment.match(/£([\d,]+)/);
            if (match) {
              const amount = parseInt(match[1].replace(/,/g, ''), 10);
              totalInvestment += amount;
            }
          });
          
          if (totalInvestment > 0) {
            analysis.transformationJourney.totalInvestment = `£${totalInvestment.toLocaleString()}`;
            console.log(`[Discovery] Updated total investment: £${totalInvestment.toLocaleString()}`);
          }
        }
      } catch (journeyValidationError: any) {
        console.error('[Discovery] Error validating transformation journey:', journeyValidationError?.message || journeyValidationError);
        // Continue without validation - don't crash the whole function
      }
      
      // Normalize investment summary
      if (analysis.investmentSummary) {
        analysis.investmentSummary = {
          totalFirstYearInvestment: analysis.investmentSummary.totalFirstYearInvestment || 
                                     analysis.investmentSummary.totalFirstYear || 
                                     analysis.investmentSummary.total || '',
          investmentBreakdown: analysis.investmentSummary.investmentBreakdown || '',
          investmentAsPercentOfRevenue: analysis.investmentSummary.investmentAsPercentOfRevenue || '',
          projectedFirstYearReturn: analysis.investmentSummary.projectedFirstYearReturn || 
                                     analysis.investmentSummary.projectedReturn || 
                                     analysis.investmentSummary.return || '',
          paybackPeriod: analysis.investmentSummary.paybackPeriod || 
                          analysis.investmentSummary.payback || '',
          netBenefitYear1: analysis.investmentSummary.netBenefitYear1 || 
                           analysis.investmentSummary.netBenefit || '',
          roiCalculation: analysis.investmentSummary.roiCalculation || 
                          analysis.investmentSummary.calculation || '',
          comparisonToInaction: analysis.investmentSummary.comparisonToInaction || '',
          roiRatio: analysis.investmentSummary.roiRatio || ''
        };
        
        // ======================================================================
        // AUTO-POPULATE ROI FIELDS FROM GROUNDED CALCULATIONS
        // ======================================================================
        // If LLM didn't include these, use our pre-calculated values
        // Note: groundedROI.valuationContext existing indicates exit-focused client
        
        // Auto-populate projectedReturn if empty
        if (!analysis.investmentSummary.projectedFirstYearReturn || 
            analysis.investmentSummary.projectedFirstYearReturn === '' ||
            analysis.investmentSummary.projectedFirstYearReturn === 'Unknown') {
          
          if (payrollAnalysis && payrollAnalysis.annualExcess > 0 && groundedROI.valuationContext) {
            // Exit client with payroll savings AND valuation uplift
            const lowReturn = Math.round((payrollAnalysis.annualExcess * 0.5 + groundedROI.valuationContext.valuationUplift * 0.5) / 1000);
            const highReturn = Math.round((payrollAnalysis.annualExcess * 0.75 + groundedROI.valuationContext.valuationUplift) / 1000);
            analysis.investmentSummary.projectedFirstYearReturn = `£${lowReturn}k-${highReturn}k`;
            analysis.investmentSummary.projectedReturnBreakdown = 
              `£${Math.round(payrollAnalysis.annualExcess * 0.5 / 1000)}k-${Math.round(payrollAnalysis.annualExcess * 0.75 / 1000)}k/year savings + £${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k valuation uplift`;
            console.log('[ROI Auto-Fill] Populated projectedReturn from payroll + valuation:', analysis.investmentSummary.projectedFirstYearReturn);
          } else if (payrollAnalysis && payrollAnalysis.annualExcess > 0) {
            // Just payroll savings
            const lowReturn = Math.round(payrollAnalysis.annualExcess * 0.5 / 1000);
            const highReturn = Math.round(payrollAnalysis.annualExcess * 0.75 / 1000);
            analysis.investmentSummary.projectedFirstYearReturn = `£${lowReturn}k-${highReturn}k/year`;
            analysis.investmentSummary.projectedReturnBreakdown = 'Operational efficiency gains from payroll restructuring';
            console.log('[ROI Auto-Fill] Populated projectedReturn from payroll:', analysis.investmentSummary.projectedFirstYearReturn);
          } else if (groundedROI.valuationContext) {
            // Just valuation uplift
            const lowReturn = Math.round(groundedROI.valuationContext.valuationUplift * 0.5 / 1000);
            const highReturn = Math.round(groundedROI.valuationContext.valuationUplift / 1000);
            analysis.investmentSummary.projectedFirstYearReturn = `£${lowReturn}k-${highReturn}k`;
            analysis.investmentSummary.projectedReturnBreakdown = 'Valuation improvement at exit';
            console.log('[ROI Auto-Fill] Populated projectedReturn from valuation:', analysis.investmentSummary.projectedFirstYearReturn);
          } else {
            analysis.investmentSummary.projectedFirstYearReturn = 'Valuation clarity + exit readiness';
            analysis.investmentSummary.projectedReturnBreakdown = 'Strategic value in informed decision-making';
            console.log('[ROI Auto-Fill] Used strategic fallback for projectedReturn');
          }
          analysis.investmentSummary.projectedReturnWasAutoFilled = true;
        }
        
        // Auto-populate paybackPeriod if empty
        if (!analysis.investmentSummary.paybackPeriod || 
            analysis.investmentSummary.paybackPeriod === '' ||
            analysis.investmentSummary.paybackPeriod === 'Unknown') {
          
          if (payrollAnalysis && payrollAnalysis.annualExcess > 0) {
            const annualSavings = payrollAnalysis.annualExcess * 0.5;
            const monthsToPayback = (groundedROI.investmentTotal / annualSavings) * 12;
            if (monthsToPayback <= 12) {
              analysis.investmentSummary.paybackPeriod = `${Math.ceil(monthsToPayback)} months`;
            } else {
              analysis.investmentSummary.paybackPeriod = `${(monthsToPayback / 12).toFixed(1)} years`;
            }
            analysis.investmentSummary.paybackCalculation = 
              `£${groundedROI.investmentTotal.toLocaleString()} ÷ £${Math.round(annualSavings).toLocaleString()}/year = ${monthsToPayback.toFixed(1)} months`;
            console.log('[ROI Auto-Fill] Populated paybackPeriod from payroll savings:', analysis.investmentSummary.paybackPeriod);
          } else if (groundedROI.valuationContext) {
            analysis.investmentSummary.paybackPeriod = 'At exit';
            analysis.investmentSummary.paybackCalculation = 
              `£${groundedROI.investmentTotal.toLocaleString()} investment against £${Math.round(groundedROI.valuationContext.valuationUplift / 1000)}k valuation uplift = ${Math.round(groundedROI.valuationContext.valuationUplift / groundedROI.investmentTotal)}:1 at exit`;
            console.log('[ROI Auto-Fill] Populated paybackPeriod as "At exit" for exit client');
          } else {
            analysis.investmentSummary.paybackPeriod = 'Strategic investment';
            analysis.investmentSummary.paybackCalculation = 'Primary return is strategic clarity and exit readiness';
            console.log('[ROI Auto-Fill] Used strategic fallback for paybackPeriod');
          }
          analysis.investmentSummary.paybackWasAutoFilled = true;
        }
        
        // Auto-populate roiRatio if empty
        if (!analysis.investmentSummary.roiRatio || 
            analysis.investmentSummary.roiRatio === '' ||
            analysis.investmentSummary.roiRatio === 'Unknown') {
          analysis.investmentSummary.roiRatio = groundedROI.totalROI;
          analysis.investmentSummary.roiWasAutoFilled = true;
          console.log('[ROI Auto-Fill] Populated roiRatio from groundedROI:', analysis.investmentSummary.roiRatio);
        }
        
        // If we corrected the transformation journey, update the investment summary
        if (analysis.transformationJourneyWasCorrected && analysis.transformationJourney?.totalInvestment) {
          analysis.investmentSummary.totalFirstYearInvestment = analysis.transformationJourney.totalInvestment;
          analysis.investmentSummary.wasAutoCorrected = true;
          console.log('[Discovery] Investment summary corrected to:', analysis.transformationJourney.totalInvestment);
        }
        
        console.log('[Discovery] Investment summary:', JSON.stringify(analysis.investmentSummary, null, 2));
      } else {
        // If investmentSummary doesn't exist at all, create it from groundedROI
        console.log('[ROI Auto-Fill] Creating investmentSummary from groundedROI as none provided by LLM');
        
        analysis.investmentSummary = {
          totalFirstYearInvestment: `£${groundedROI.investmentTotal.toLocaleString()}`,
          investmentBreakdown: groundedROI.investmentBreakdown,
          investmentAsPercentOfRevenue: groundedROI.investmentAsPercentOfTurnover || '',
          roiRatio: groundedROI.totalROI,
          wasFullyAutoGenerated: true
        };
        
        // Add projectedReturn
        if (payrollAnalysis && payrollAnalysis.annualExcess > 0 && groundedROI.valuationContext) {
          const lowReturn = Math.round((payrollAnalysis.annualExcess * 0.5 + groundedROI.valuationContext.valuationUplift * 0.5) / 1000);
          const highReturn = Math.round((payrollAnalysis.annualExcess * 0.75 + groundedROI.valuationContext.valuationUplift) / 1000);
          analysis.investmentSummary.projectedFirstYearReturn = `£${lowReturn}k-${highReturn}k`;
        } else if (groundedROI.valuationContext) {
          const lowReturn = Math.round(groundedROI.valuationContext.valuationUplift * 0.5 / 1000);
          const highReturn = Math.round(groundedROI.valuationContext.valuationUplift / 1000);
          analysis.investmentSummary.projectedFirstYearReturn = `£${lowReturn}k-${highReturn}k`;
        } else {
          analysis.investmentSummary.projectedFirstYearReturn = 'Strategic investment';
        }
        
        // Add paybackPeriod
        if (payrollAnalysis && payrollAnalysis.annualExcess > 0) {
          const monthsToPayback = (groundedROI.investmentTotal / (payrollAnalysis.annualExcess * 0.5)) * 12;
          analysis.investmentSummary.paybackPeriod = monthsToPayback <= 12 
            ? `${Math.ceil(monthsToPayback)} months` 
            : `${(monthsToPayback / 12).toFixed(1)} years`;
        } else if (groundedROI.valuationContext) {
          analysis.investmentSummary.paybackPeriod = 'At exit';
        } else {
          analysis.investmentSummary.paybackPeriod = 'Strategic investment';
        }
        
        console.log('[ROI Auto-Fill] Created full investmentSummary:', JSON.stringify(analysis.investmentSummary, null, 2));
      }
      
      // ======================================================================
      // APPLY MECHANICAL TEXT CLEANUP - British English & style fixes
      // ======================================================================
      console.log('[Discovery] Applying mechanical text cleanup...');
      analysis = cleanAllStrings(analysis);
      console.log('[Discovery] Text cleanup complete');
      
      // ======================================================================
      // POST-PROCESSING VALIDATION - Fix incorrect figures & service listings
      // ======================================================================
      
      // VALIDATE PAYROLL FIGURES IN OUTPUT
      if (payrollAnalysis) {
        const outputText = JSON.stringify(analysis);
        
        // Check for obviously wrong payroll figures
        // The £414k figure from the bug should be ~£193k (at 36.5% vs 28% benchmark)
        const wrongExcessPatterns = [
          /£?414[,.]?\d*k?/gi,  // Wrong excess amount
          /43\.?[12]%/gi,       // Wrong percentage
        ];
        
        for (const pattern of wrongExcessPatterns) {
          if (pattern.test(outputText)) {
            console.error(`[Validation] ⚠️ Found potentially incorrect payroll figure matching ${pattern}`);
            console.error(`[Validation] Correct values: ${payrollAnalysis.staffCostsPct.toFixed(1)}% excess, £${payrollAnalysis.annualExcess.toLocaleString()}`);
          }
        }
        
        // Log the correct values for debugging
        console.log('[Validation] CORRECT payroll figures to use:', {
          staffCostsPct: `${payrollAnalysis.staffCostsPct.toFixed(1)}%`,
          benchmarkMid: `${payrollAnalysis.benchmark.typical}%`,
          excessPct: `${payrollAnalysis.excessPercentage.toFixed(1)}%`,
          excessAmount: `£${payrollAnalysis.annualExcess.toLocaleString()}`
        });
      }
      
      // VALIDATE SERVICE LISTINGS - Combine separate services if found
      if (analysis.transformationJourney?.phases) {
        for (const phase of analysis.transformationJourney.phases) {
          const serviceName = (phase.enabledBy || phase.service || '').toLowerCase();
          
          // Check if phase mentions "benchmarking" OR "hidden value" separately
          if (serviceName.includes('benchmarking') && !serviceName.includes('hidden value')) {
            console.log('[Validation] Correcting separate Benchmarking to combined service');
            if (typeof phase.enabledBy === 'string') {
              phase.enabledBy = 'Benchmarking & Hidden Value Analysis (£2,000)';
            } else if (phase.enabledBy?.service) {
              phase.enabledBy.service = 'Benchmarking & Hidden Value Analysis';
              phase.enabledBy.price = 2000;
            }
          }
          
          // Check for separate Hidden Value Audit
          if (serviceName.includes('hidden value') && !serviceName.includes('benchmarking')) {
            console.warn('[Validation] Found separate Hidden Value Audit - this should be combined with Benchmarking');
            // Mark for removal or merge
            phase._shouldMerge = true;
          }
          
          // Fix wrong pricing
          const priceMatch = (phase.investment || phase.enabledBy || '').toString().match(/£([\d,]+)/);
          if (priceMatch) {
            const price = parseInt(priceMatch[1].replace(/,/g, ''));
            if (serviceName.includes('benchmark') && price > 2500) {
              console.log(`[Validation] Correcting Benchmarking price from £${price} to £2,000`);
              if (typeof phase.enabledBy === 'string') {
                phase.enabledBy = phase.enabledBy.replace(/£[\d,]+/, '£2,000');
              } else if (phase.enabledBy?.price) {
                phase.enabledBy.price = 2000;
              }
              if (phase.investment) {
                phase.investment = phase.investment.replace(/£[\d,]+/, '£2,000');
              }
            }
          }
        }
        
        // Remove phases that were marked for merge (Hidden Value as separate)
        analysis.transformationJourney.phases = analysis.transformationJourney.phases.filter(
          (phase: any) => !phase._shouldMerge
        );
      }
      
      // VALIDATE RECOMMENDED INVESTMENTS
      if (analysis.recommendedInvestments) {
        // Remove separate "Hidden Value Audit" if present
        const hadSeparateHVA = analysis.recommendedInvestments.some(
          (s: any) => (s.service || s.name || '').toLowerCase().includes('hidden value') && 
                      !(s.service || s.name || '').toLowerCase().includes('benchmarking')
        );
        
        if (hadSeparateHVA) {
          console.log('[Validation] Removing separate Hidden Value Audit - should be combined with Benchmarking');
          analysis.recommendedInvestments = analysis.recommendedInvestments.filter(
            (s: any) => !(s.service || s.name || '').toLowerCase().includes('hidden value') ||
                        (s.service || s.name || '').toLowerCase().includes('benchmarking')
          );
        }
        
        // Fix Benchmarking pricing
        for (const service of analysis.recommendedInvestments) {
          const name = (service.service || service.name || '').toLowerCase();
          if (name.includes('benchmark')) {
            const priceStr = (service.investment || service.price || '').toString();
            const priceMatch = priceStr.match(/£?([\d,]+)/);
            if (priceMatch) {
              const price = parseInt(priceMatch[1].replace(/,/g, ''));
              if (price > 2500) {
                console.log(`[Validation] Correcting recommended service ${service.service || service.name} price from £${price} to £2,000`);
                service.investment = '£2,000';
                service.price = 2000;
              }
            }
          }
        }
        
        // ========================================================================
        // CRITICAL FIX: FORCE totalFirstYearInvestment TO MATCH recommendedInvestments
        // ========================================================================
        // The LLM often puts a different value in totalFirstYearInvestment than the
        // sum of recommendedInvestments. This MUST be corrected as recommendedInvestments
        // is the authoritative source of what services are being recommended.
        
        console.log('[Discovery] === FINAL INVESTMENT TOTAL VALIDATION ===');
        
        let calculatedTotal = 0;
        const serviceBreakdown: string[] = [];
        
        for (const inv of analysis.recommendedInvestments) {
          // Extract numeric value from strings like "£2,000", "£1,500/year", "£4,500/year"
          const investmentStr = inv.investment || inv.price || inv.cost || '0';
          const match = investmentStr.toString().match(/£?([\d,]+)/);
          const value = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
          
          console.log(`[Discovery] → ${inv.service || inv.code || 'Unknown'}: "${investmentStr}" = £${value.toLocaleString()}`);
          calculatedTotal += value;
          
          if (value > 0) {
            serviceBreakdown.push(`${inv.service || inv.code}: £${value.toLocaleString()}`);
          }
        }
        
        console.log(`[Discovery] Sum of recommendedInvestments: £${calculatedTotal.toLocaleString()}`);
        
        // Check what was previously set
        const previousTotal = analysis.investmentSummary?.totalFirstYearInvestment || 'not set';
        const previousMatch = previousTotal.toString().match(/£?([\d,]+)/);
        const previousValue = previousMatch ? parseInt(previousMatch[1].replace(/,/g, ''), 10) : 0;
        
        // ALWAYS override with calculated total if we have services
        if (calculatedTotal > 0) {
          if (!analysis.investmentSummary) {
            analysis.investmentSummary = {};
          }
          
          analysis.investmentSummary.totalFirstYearInvestment = `£${calculatedTotal.toLocaleString()}`;
          analysis.investmentSummary.investmentBreakdown = serviceBreakdown.join(' + ');
          
          if (previousValue !== calculatedTotal) {
            console.warn(`[Discovery] ⚠️ CORRECTED INVESTMENT TOTAL: was "${previousTotal}" (£${previousValue}), now "£${calculatedTotal.toLocaleString()}"`);
            analysis.investmentSummary.wasForceRecalculated = true;
          } else {
            console.log(`[Discovery] ✓ Investment total matches: £${calculatedTotal.toLocaleString()}`);
          }
          
          // Also sync to transformationJourney if it exists
          if (analysis.transformationJourney) {
            analysis.transformationJourney.totalInvestment = `£${calculatedTotal.toLocaleString()}`;
          }
          
          console.log(`[Discovery] ✅ Final totalFirstYearInvestment: £${calculatedTotal.toLocaleString()}`);
        } else {
          console.warn('[Discovery] ⚠️ No calculable investment from recommendedInvestments');
        }
        
        // ========================================================================
        // FIX: Replace incorrect investment amounts in all narrative text fields
        // ========================================================================
        // The LLM may have used wrong amounts in closing messages/CTAs
        const correctTotal = analysis.investmentSummary?.totalFirstYearInvestment || '';
        const correctTotalMatch = correctTotal.match(/£?([\d,]+)/);
        const correctAmount = correctTotalMatch ? `£${correctTotalMatch[1]}` : '';
        
        if (correctAmount) {
          // Pattern to find investment amounts in context (near words like "gets", "for", "investment")
          const wrongAmountContextPattern = /£[\d,]+(?=\s+(?:gets|gives|buys|for|to\s+know|investment|builds|and\s+\d+))/gi;
          
          // Also match standalone amounts that look like yearly investments (common patterns)
          const commonWrongAmounts = ['£7,500', '£6,500', '£5,500', '£10,000', '£11,500', '£4,000'];
          
          // Helper to replace in text
          const fixInvestmentInText = (text: string | undefined): string => {
            if (!text || typeof text !== 'string') return text || '';
            let fixed = text;
            
            // Replace contextual patterns
            fixed = fixed.replace(wrongAmountContextPattern, correctAmount);
            
            // Replace common wrong amounts
            for (const wrong of commonWrongAmounts) {
              if (wrong !== correctAmount && fixed.includes(wrong)) {
                // Only replace if in investment context
                const investmentContext = new RegExp(wrong.replace(/[£,]/g, '\\$&') + '(?=\\s+(?:gets|gives|buys|for|to|investment|builds|and|first))', 'gi');
                fixed = fixed.replace(investmentContext, correctAmount);
              }
            }
            
            return fixed;
          };
          
          // Fix closing message fields
          if (analysis.closingMessage) {
            if (typeof analysis.closingMessage === 'string') {
              const fixed = fixInvestmentInText(analysis.closingMessage);
              if (fixed !== analysis.closingMessage) {
                console.log('[Discovery] Fixed investment amount in closingMessage');
                analysis.closingMessage = fixed;
              }
            } else if (typeof analysis.closingMessage === 'object') {
              for (const key of Object.keys(analysis.closingMessage)) {
                if (typeof analysis.closingMessage[key] === 'string') {
                  const fixed = fixInvestmentInText(analysis.closingMessage[key]);
                  if (fixed !== analysis.closingMessage[key]) {
                    console.log(`[Discovery] Fixed investment amount in closingMessage.${key}`);
                    analysis.closingMessage[key] = fixed;
                  }
                }
              }
            }
          }
          
          // Fix nextSteps fields
          if (analysis.nextSteps) {
            for (const key of Object.keys(analysis.nextSteps)) {
              if (typeof analysis.nextSteps[key] === 'string') {
                const fixed = fixInvestmentInText(analysis.nextSteps[key]);
                if (fixed !== analysis.nextSteps[key]) {
                  console.log(`[Discovery] Fixed investment amount in nextSteps.${key}`);
                  analysis.nextSteps[key] = fixed;
                }
              }
            }
          }
          
          // Fix callToAction if at top level
          if (analysis.callToAction && typeof analysis.callToAction === 'string') {
            const fixed = fixInvestmentInText(analysis.callToAction);
            if (fixed !== analysis.callToAction) {
              console.log('[Discovery] Fixed investment amount in callToAction');
              analysis.callToAction = fixed;
            }
          }
          
          // Fix destinationContext and journeyLabel if they include amounts
          if (analysis.transformationJourney) {
            if (analysis.transformationJourney.destinationContext) {
              const fixed = fixInvestmentInText(analysis.transformationJourney.destinationContext);
              if (fixed !== analysis.transformationJourney.destinationContext) {
                console.log('[Discovery] Fixed investment amount in transformationJourney.destinationContext');
                analysis.transformationJourney.destinationContext = fixed;
              }
            }
          }
          
          console.log(`[Discovery] ✅ Checked narrative fields for investment amount (correct: ${correctAmount})`);
        }
      }
      
    } catch (e: any) {
      console.error('[Discovery] JSON parse error:', e.message);
      console.error('[Discovery] Failed to parse text (first 1000 chars):', analysisText.substring(0, 1000));
      analysis = { rawAnalysis: cleanMechanical(analysisText), parseError: true };
    }

    // ========================================================================
    // CALIBRATE GAP SCORE FROM ANALYSIS
    // ========================================================================
    
    const gapCalibration = calibrateGapScore(analysis.gapAnalysis?.primaryGaps || []);
    console.log('[Discovery] Gap calibration:', gapCalibration);

    // ========================================================================
    // SAVE REPORT TO DATABASE
    // ========================================================================

    const report = {
      client_id: preparedData.client.id,
      practice_id: preparedData.client.practiceId,
      discovery_id: preparedData.discovery.id,
      report_type: 'discovery_analysis',
      report_data: {
        generatedAt: new Date().toISOString(),
        clientName: preparedData.client.name,
        companyName: preparedData.client.company,
        analysis,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: gapCalibration.score,
          gapCounts: gapCalibration.counts,
          gapExplanation: gapCalibration.explanation
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null,
        documentInsights: documentInsights.businessContext.stage !== 'unknown' ? documentInsights : null,
        serviceScores: serviceScores
      },
      created_at: new Date().toISOString()
    };

    console.log('[Discovery] Post-processing complete, preparing to save report...');
    console.log('[Discovery] Report data size:', JSON.stringify(report).length, 'chars');
    
    // Check if a report already exists for this client/discovery combination
    const { data: existingReport } = await supabase
      .from('client_reports')
      .select('id, is_shared_with_client, shared_at')
      .eq('client_id', preparedData.client.id)
      .eq('discovery_id', preparedData.discovery.id)
      .eq('report_type', 'discovery_analysis')
      .maybeSingle();

    let savedReport;
    let saveError;

    if (existingReport) {
      // Update existing report, preserving sharing status
      console.log('[Discovery] Updating existing report:', existingReport.id);
      const { data: updatedReport, error: updateError } = await supabase
        .from('client_reports')
        .update({
          report_data: report.report_data,
          // Preserve sharing status and shared_at timestamp
          is_shared_with_client: existingReport.is_shared_with_client,
          shared_at: existingReport.shared_at
        })
        .eq('id', existingReport.id)
        .select()
        .single();
      
      savedReport = updatedReport;
      saveError = updateError;
      
      if (saveError) {
        console.error('[Discovery] Error updating report:', saveError);
      } else {
        console.log('[Discovery] Report updated successfully, sharing status preserved:', {
          isShared: existingReport.is_shared_with_client,
          sharedAt: existingReport.shared_at
        });
      }
    } else {
      // Insert new report
      console.log('[Discovery] Creating new report');
      const { data: insertedReport, error: insertError } = await supabase
      .from('client_reports')
      .insert(report)
      .select()
      .single();

      savedReport = insertedReport;
      saveError = insertError;

    if (saveError) {
        console.error('[Discovery] Error inserting report:', saveError);
      }
    }

    // Update discovery record
    await supabase
      .from('destination_discovery')
      .update({
        analysis_completed_at: new Date().toISOString(),
        analysis_report_id: savedReport?.id
      })
      .eq('id', preparedData.discovery.id);

    // ======================================================================
    // ALSO UPDATE discovery_reports TABLE (for the admin portal UI)
    // ======================================================================
    // The admin portal prefers discovery_reports over client_reports
    // We need to update this table too for the report to display correctly
    try {
      console.log('[Discovery] Updating discovery_reports table...');
      
      // Find the engagement for this client
      const { data: engagement } = await supabase
        .from('discovery_engagements')
        .select('id')
        .eq('client_id', preparedData.client.id)
        .maybeSingle();
      
      if (engagement?.id) {
        // Build the page structure for destination-focused report
        const page1_destination = {
          tuesdayTest: preparedData.discovery?.responses?.dd_perfect_tuesday || 
                       preparedData.discovery?.responses?.dd_tuesday_test || '',
          clarityScore: clarityScore,
          clarityNarrative: analysis.executiveSummary?.clarityNarrative || 
                           analysis.destinationAnalysis?.clarityNarrative || '',
          visionNarrative: analysis.destinationAnalysis?.visionNarrative || 
                          analysis.executiveSummary?.whatWeHeard || ''
        };
        
        const page2_gaps = {
          headline: analysis.gapAnalysis?.headline || "The Gap Between Here and There",
          introduction: analysis.gapAnalysis?.introduction || '',
          primaryGaps: analysis.gapAnalysis?.primaryGaps || [],
          conversationsAvoiding: analysis.gapAnalysis?.conversationsAvoiding || [],
          costOfInaction: analysis.gapAnalysis?.costOfInaction || {}
        };
        
        // Normalize phases to match the structure expected by the UI
        // UI expects: whatChanges as array, headline, feelsLike, outcome, enabledBy, price
        const normalizedPhases = (analysis.transformationJourney?.phases || []).map((phase: any) => {
          // Ensure whatChanges is always an array
          let whatChanges = phase.whatChanges || phase.changes || [];
          if (typeof whatChanges === 'string') {
            // Split string by newlines or bullet points
            whatChanges = whatChanges.split(/[\n•\-]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          }
          if (!Array.isArray(whatChanges)) {
            whatChanges = [String(whatChanges)];
          }
          
          return {
            timeframe: phase.timeframe || phase.period || `Month ${phase.phase || 1}`,
            headline: phase.title || phase.headline || phase.name || 'Transformation Phase',
            whatChanges: whatChanges,
            feelsLike: phase.feelsLike || phase.emotionalImpact || phase.youWillFeel || '',
            outcome: phase.outcome || phase.youWillHave || phase.result || '',
            enabledBy: phase.enabledBy || phase.service || '',
            enabledByCode: phase.enabledByCode || phase.code || '',
            price: phase.investment || phase.price || phase.cost || ''
          };
        });
        
        const page3_journey = {
          phases: normalizedPhases,
          totalInvestment: analysis.transformationJourney?.totalInvestment || '',
          totalTimeframe: analysis.transformationJourney?.totalTimeframe || '',
          destination: analysis.transformationJourney?.destination || '',
          journeyLabel: analysis.transformationJourney?.journeyLabel || 'YOUR JOURNEY',
          destinationLabel: analysis.transformationJourney?.destinationLabel || '',
          destinationContext: analysis.transformationJourney?.destinationContext || ''
        };
        
        // ========================================================================
        // BUILD FINANCIAL INSIGHTS for display (with calculation breakdowns)
        // ========================================================================
        const financialInsights: any = {};
        
        if (payrollAnalysis) {
          const recoverableLow = Math.round(payrollAnalysis.annualExcess * 0.35);
          const recoverableHigh = Math.round(payrollAnalysis.annualExcess * 0.50);
          
          financialInsights.payroll = {
            staffCosts: payrollAnalysis.staffCosts,
            turnover: payrollAnalysis.turnover,
            actualPct: payrollAnalysis.staffCostsPct,
            benchmarkPct: payrollAnalysis.benchmark?.typical || 28,
            grossExcess: payrollAnalysis.annualExcess,
            recoverableLow,
            recoverableHigh,
            calculationBreakdown: `Staff costs £${Math.round(payrollAnalysis.staffCosts / 1000)}k ÷ Turnover £${Math.round(payrollAnalysis.turnover / 1000)}k = ${payrollAnalysis.staffCostsPct.toFixed(1)}%
Industry benchmark: ${payrollAnalysis.benchmark?.typical || 28}%
Excess: ${payrollAnalysis.excessPercentage?.toFixed(1) || (payrollAnalysis.staffCostsPct - 28).toFixed(1)}% above benchmark
Gross annual excess: £${Math.round(payrollAnalysis.annualExcess / 1000)}k
Conservative recovery (35-50%): £${Math.round(recoverableLow / 1000)}k-£${Math.round(recoverableHigh / 1000)}k/year`,
            summary: `£${Math.round(recoverableLow / 1000)}k-£${Math.round(recoverableHigh / 1000)}k/year recoverable from payroll restructuring`
          };
          
          console.log('[Discovery] Built payroll financial insights:', financialInsights.payroll.summary);
        }
        
        // Valuation insights if we have EBITDA
        if (extractedFinancials.ebitda && extractedFinancials.ebitda > 0) {
          const currentMultiple = 3.0;
          const improvedMultiple = clientJourneyStage.journey === 'established-exit-focused' ? 4.0 : 3.5;
          const currentVal = extractedFinancials.ebitda * currentMultiple;
          const payrollUplift = financialInsights.payroll 
            ? Math.round((financialInsights.payroll.recoverableLow + financialInsights.payroll.recoverableHigh) / 2)
            : 0;
          const improvedEbitda = extractedFinancials.ebitda + payrollUplift;
          const improvedVal = improvedEbitda * improvedMultiple;
          const uplift = improvedVal - currentVal;
          
          financialInsights.valuation = {
            currentEbitda: extractedFinancials.ebitda,
            currentMultiple,
            currentValuation: currentVal,
            improvedEbitda,
            improvedMultiple,
            improvedValuation: improvedVal,
            uplift,
            calculationBreakdown: `Current: £${Math.round(extractedFinancials.ebitda / 1000)}k EBITDA × ${currentMultiple}x = £${Math.round(currentVal / 1000)}k
With payroll savings: £${Math.round(improvedEbitda / 1000)}k EBITDA
At improved multiple: ${improvedMultiple}x = £${Math.round(improvedVal / 1000)}k
Uplift potential: £${Math.round(uplift / 1000)}k`,
            summary: `£${Math.round(uplift / 1000 * 0.8)}k-£${Math.round(uplift / 1000 * 1.2)}k valuation uplift potential`
          };
          
          console.log('[Discovery] Built valuation financial insights:', financialInsights.valuation.summary);
        }
        
        const page4_numbers = {
          investmentSummary: analysis.investmentSummary || {},
          costOfStaying: analysis.gapAnalysis?.costOfInaction || {},
          returnProjection: analysis.investmentSummary?.projectedFirstYearReturn || '',
          returnBreakdown: analysis.investmentSummary?.projectedReturnBreakdown || '',
          paybackPeriod: analysis.investmentSummary?.paybackPeriod || '',
          paybackCalculation: analysis.investmentSummary?.paybackCalculation || '',
          roiRatio: analysis.investmentSummary?.roiRatio || '',
          // STORE PAYROLL ANALYSIS for Pass 2 and PDF
          payrollAnalysis: payrollAnalysis ? {
            turnover: payrollAnalysis.turnover,
            staffCosts: payrollAnalysis.staffCosts,
            staffCostsPct: payrollAnalysis.staffCostsPct,
            benchmarkPct: payrollAnalysis.benchmark?.typical || 28,
            excessPct: payrollAnalysis.excessPercentage,
            annualExcess: payrollAnalysis.annualExcess,
            calculation: payrollAnalysis.calculation
          } : null,
          // STORE FINANCIAL INSIGHTS for display
          financialInsights
        };
        
        const page5_next_steps = {
          thisWeek: analysis.nextSteps?.thisWeek || analysis.closingMessage?.thisWeek || '',
          yourFirstStep: analysis.nextSteps?.yourFirstStep || analysis.closingMessage?.yourFirstStep || '',
          closingMessage: analysis.closingMessage?.personalMessage || analysis.closingMessage?.message || '',
          callToAction: analysis.nextSteps?.callToAction || analysis.closingMessage?.callToAction || 'Book a Conversation'
        };
        
        // Build the complete destination_report object
        const destination_report = {
          page1_destination,
          page2_gaps,
          page3_journey,
          page4_numbers,
          page5_next_steps,
          // Also include the full analysis for fallback
          analysis: analysis,
          // Include recommended investments at top level for easy access
          recommendedInvestments: analysis.recommendedInvestments || [],
          notRecommended: analysis.notRecommended || [],
          // Metadata
          generatedAt: new Date().toISOString(),
          wasAutoCorrected: analysis.wasAutoCorrected || false
        };
        
        // Check if a discovery_report exists for this engagement
        const { data: existingDiscoveryReport } = await supabase
          .from('discovery_reports')
          .select('id')
          .eq('engagement_id', engagement.id)
          .maybeSingle();
        
        if (existingDiscoveryReport?.id) {
          // Update existing
          const { error: updateError } = await supabase
            .from('discovery_reports')
            .update({
              destination_report: destination_report,
              page1_destination: page1_destination,
              page2_gaps: page2_gaps,
              page3_journey: page3_journey,
              page4_numbers: page4_numbers,
              page5_next_steps: page5_next_steps,
              status: 'generated',
              generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDiscoveryReport.id);
          
          if (updateError) {
            console.error('[Discovery] Error updating discovery_reports:', updateError);
          } else {
            console.log('[Discovery] ✅ Updated discovery_reports:', existingDiscoveryReport.id);
          }
        } else {
          // Insert new
          const { data: newReport, error: insertError } = await supabase
            .from('discovery_reports')
            .insert({
              engagement_id: engagement.id,
              destination_report: destination_report,
              page1_destination: page1_destination,
              page2_gaps: page2_gaps,
              page3_journey: page3_journey,
              page4_numbers: page4_numbers,
              page5_next_steps: page5_next_steps,
              status: 'generated',
              generated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('[Discovery] Error inserting discovery_reports:', insertError);
          } else {
            console.log('[Discovery] ✅ Created discovery_reports:', newReport?.id);
          }
        }
      } else {
        console.log('[Discovery] No discovery_engagement found for client, skipping discovery_reports update');
      }
    } catch (discoveryReportsError: any) {
      // Non-fatal - client_reports is the primary storage
      console.error('[Discovery] Error updating discovery_reports (non-fatal):', discoveryReportsError?.message);
    }

    // ========================================================================
    // LOG LEARNING LIBRARY APPLICATION
    // ========================================================================
    
    if (practiceLearnings.length > 0 && savedReport?.id) {
      try {
        // Get engagement_id if available
        const { data: engData } = await supabase
          .from('discovery_engagements')
          .select('id')
          .eq('client_id', preparedData.client.id)
          .maybeSingle();
        
        if (engData?.id) {
          // Log which learnings were applied
          const learningLogs = practiceLearnings.map((learning: any) => ({
            learning_id: learning.id,
            engagement_id: engData.id,
            report_id: savedReport.id,
            applied_at: new Date().toISOString()
          }));
          
          const { error: logError } = await supabase
            .from('learning_application_log')
            .insert(learningLogs);
          
          if (logError) {
            console.error('[Discovery] Error logging learning application:', logError);
          } else {
            console.log(`[Discovery] Logged ${learningLogs.length} learning applications`);
            
            // Update times_applied counter on each learning
            for (const learning of practiceLearnings) {
              await supabase
                .from('practice_learning_library')
                .update({ 
                  times_applied: (learning.times_applied || 0) + 1,
                  last_applied_at: new Date().toISOString()
                })
                .eq('id', learning.id);
            }
          }
        }
      } catch (learningLogError) {
        console.error('[Discovery] Learning log failed (non-fatal):', learningLogError);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Analysis complete in ${totalTime}ms (LLM: ${llmTime}ms)`);
    
    // ======================================================================
    // DIAGNOSTIC: Log trace summaries for debugging
    // ======================================================================
    logFinancialTracesSummary();
    logInvestmentTracesSummary();
    
    // Final investment total trace
    const finalServices = analysis.recommendedInvestments || analysis.transformationJourney?.phases?.map((p: any) => ({
      name: p.enabledBy || p.service || 'Unknown',
      price: parseInt((p.investment || p.price || '0').toString().replace(/[£,]/g, '')) || 0
    })) || [];
    
    if (finalServices.length > 0) {
      traceInvestmentTotal('F1_FINAL_OUTPUT', finalServices.map((s: any) => ({
        name: s.service || s.name || 'Unknown',
        code: s.code || '',
        price: typeof s.investment === 'number' ? s.investment : 
               parseInt((s.investment || s.price || '0').toString().replace(/[£,]/g, '')) || 0
      })));
    }

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: savedReport?.id,
        generatedAt: new Date().toISOString(),
        client: preparedData.client,
        practice: preparedData.practice,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: gapCalibration.score,
          gapCounts: gapCalibration.counts,
          gapExplanation: gapCalibration.explanation
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null,
        documentInsights: documentInsights.businessContext.stage !== 'unknown' ? documentInsights : null,
        analysis
      },
      metadata: {
        model: MODEL,
        executionTimeMs: totalTime,
        llmTimeMs: llmTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

