// ============================================================================
// INTEGRATION LAYER - Bridge between old and new calculator structures
// ============================================================================
// This allows gradual migration from the old ComprehensiveAnalysis format
// to the new Pass1Output format with pre-built phrases.
// ============================================================================

import { Pass1Output } from '../types/pass1-output.ts';
import { orchestratePass1Calculations, ExtractedFinancials } from './orchestrator.ts';

/**
 * Run new structured calculations alongside existing analysis
 * Returns both formats for backward compatibility
 */
export function runStructuredCalculations(
  engagementId: string,
  clientId: string,
  clientName: string,
  companyName: string,
  financials: ExtractedFinancials,
  responses: Record<string, any>
): Pass1Output {
  console.log('[Integration] Running new structured calculations...');
  
  const structuredOutput = orchestratePass1Calculations({
    engagementId,
    clientId,
    clientName,
    companyName,
    financials,
    responses
  });
  
  console.log('[Integration] Structured output complete:', {
    dataQuality: structuredOutput.meta.dataQuality,
    payrollExcess: structuredOutput.payroll?.annualExcess?.formatted,
    valuationRange: structuredOutput.valuation?.enterpriseValue?.formatted,
    achievements: structuredOutput.achievements?.achievements?.length
  });
  
  return structuredOutput;
}

/**
 * Convert legacy ExtractedFinancials format to new format
 */
export function convertFinancialsFormat(legacy: Record<string, any>): ExtractedFinancials {
  return {
    hasAccounts: legacy.hasAccounts || false,
    source: legacy.source,
    
    // Core P&L
    turnover: legacy.turnover,
    turnoverPriorYear: legacy.turnoverPriorYear,
    grossProfit: legacy.grossProfit,
    operatingProfit: legacy.operatingProfit,
    netProfit: legacy.netProfit,
    ebitda: legacy.ebitda,
    
    // Staff
    totalStaffCosts: legacy.totalStaffCosts,
    employeeCount: legacy.employeeCount,
    directorSalary: legacy.directorsRemuneration,
    
    // Balance Sheet
    netAssets: legacy.netAssets,
    cash: legacy.cash,
    debtors: legacy.debtors,
    creditors: legacy.creditors,
    stock: legacy.stock,
    fixedAssets: legacy.fixedAssets,
    
    // Depreciation
    depreciation: legacy.depreciation,
    amortisation: legacy.amortisation
  };
}

/**
 * Extract key phrases for Pass 2 prompt injection
 * This is the "golden" output that Pass 2 should use verbatim
 */
export function extractPhrasesForPass2(output: Pass1Output): Record<string, string> {
  const phrases: Record<string, string> = {};
  
  // Payroll phrases
  if (output.payroll?.summary?.isOverstaffed) {
    phrases['PAYROLL_HEADLINE'] = output.payroll.annualExcess.phrases.headline;
    phrases['PAYROLL_IMPACT'] = output.payroll.annualExcess.phrases.impact;
    phrases['PAYROLL_MONTHLY'] = output.payroll.monthlyExcess.phrases.impact;
    phrases['PAYROLL_TWO_YEAR'] = output.payroll.twoYearExcess.phrases.impact;
    phrases['PAYROLL_COMPARISON'] = output.payroll.staffCostsPercent.phrases.comparison || '';
    phrases['PAYROLL_ACTION'] = output.payroll.staffCostsPercent.phrases.actionRequired || '';
  }
  
  // Valuation phrases
  if (output.valuation?.enterpriseValue?.formatted !== 'Unknown') {
    phrases['VALUATION_HEADLINE'] = output.valuation.enterpriseValue.phrases.headline;
    phrases['VALUATION_RANGE'] = output.valuation.enterpriseValue.formatted;
    phrases['VALUATION_MULTIPLE'] = output.valuation.multipleRange.phrases.headline;
  }
  
  // Trajectory phrases
  if (output.trajectory?.trend?.classification === 'declining') {
    phrases['TRAJECTORY_HEADLINE'] = output.trajectory.revenueGrowthYoY.phrases.headline;
    phrases['TRAJECTORY_IMPACT'] = output.trajectory.revenueGrowthYoY.phrases.impact;
    phrases['TRAJECTORY_IMPLICATION'] = output.trajectory.trend.phrases.implication;
  }
  
  // Productivity phrases
  if (output.productivity?.excessHeadcount?.value && output.productivity.excessHeadcount.value > 0) {
    phrases['PRODUCTIVITY_HEADLINE'] = output.productivity.excessHeadcount.phrases.headline;
    phrases['PRODUCTIVITY_COMPARISON'] = output.productivity.revenuePerHead.phrases.comparison || '';
  }
  
  // Exit readiness phrases
  phrases['EXIT_READINESS_HEADLINE'] = output.exitReadiness.overallScore.phrases.headline;
  phrases['EXIT_READINESS_SUMMARY'] = output.exitReadiness.phrases.summary;
  phrases['EXIT_TOP_STRENGTH'] = output.exitReadiness.phrases.topStrength;
  phrases['EXIT_TOP_BLOCKER'] = output.exitReadiness.phrases.topBlocker;
  
  // Cost of inaction phrases
  phrases['COI_HEADLINE'] = output.costOfInaction.totalCostOfInaction.phrases.headline;
  phrases['COI_BREAKDOWN'] = output.costOfInaction.totalCostOfInaction.phrases.breakdown;
  phrases['COI_URGENCY'] = output.costOfInaction.totalCostOfInaction.phrases.urgency;
  
  // Hidden assets phrases
  if (output.hiddenAssets?.totalHiddenAssets?.value && output.hiddenAssets.totalHiddenAssets.value > 0) {
    phrases['HIDDEN_ASSETS_HEADLINE'] = output.hiddenAssets.totalHiddenAssets.phrases.headline;
    phrases['HIDDEN_ASSETS_CONTEXT'] = output.hiddenAssets.totalHiddenAssets.phrases.context;
  }
  
  // Profitability phrases
  if (output.profitability?.grossMargin?.status === 'excellent') {
    phrases['GROSS_MARGIN_HEADLINE'] = output.profitability.grossMargin.phrases.headline;
  }
  
  // Achievement phrases
  if (output.achievements?.achievements?.length > 0) {
    phrases['ACHIEVEMENTS_TOP'] = output.achievements.phrases.topAchievements;
    phrases['ACHIEVEMENTS_FOUNDATION'] = output.achievements.phrases.foundationStatement;
  }
  
  // Narrative blocks
  phrases['OPENING_LINE'] = output.narrativeBlocks.executiveSummary.openingLine;
  phrases['SITUATION_STATEMENT'] = output.narrativeBlocks.executiveSummary.situationStatement;
  phrases['THE_ASK'] = output.narrativeBlocks.closingPhrases.theAsk;
  phrases['URGENCY_ANCHOR'] = output.narrativeBlocks.closingPhrases.urgencyAnchor;
  
  if (output.narrativeBlocks.closingPhrases.neverHadBreak) {
    phrases['NEVER_HAD_BREAK'] = output.narrativeBlocks.closingPhrases.neverHadBreak;
  }
  
  return phrases;
}

/**
 * Build the Pass 2 prompt injection section
 * This is the complete block that Pass 2 should inject into its LLM prompt
 */
export function buildPass2PromptInjection(output: Pass1Output): string {
  const phrases = extractPhrasesForPass2(output);
  
  let injection = `
============================================================================
⛔ MANDATORY PRE-CALCULATED PHRASES - USE THESE VERBATIM
============================================================================

The following phrases have been calculated by Pass 1 using validated financial data.
DO NOT calculate your own figures. USE THESE EXACT PHRASES.

`;

  // Payroll section
  if (phrases['PAYROLL_HEADLINE']) {
    injection += `
## PAYROLL (CRITICAL - USE EXACT FIGURES)

HEADLINE: "${phrases['PAYROLL_HEADLINE']}"
IMPACT: "${phrases['PAYROLL_IMPACT']}"
MONTHLY: "${phrases['PAYROLL_MONTHLY']}"
TWO-YEAR: "${phrases['PAYROLL_TWO_YEAR']}"
COMPARISON: "${phrases['PAYROLL_COMPARISON']}"
ACTION: "${phrases['PAYROLL_ACTION']}"

⛔ When discussing payroll excess, use the IMPACT phrase: "${phrases['PAYROLL_IMPACT']}"

---
`;
  }

  // Valuation section
  if (phrases['VALUATION_RANGE'] && phrases['VALUATION_RANGE'] !== 'Unknown') {
    injection += `
## VALUATION (MANDATORY)

HEADLINE: "${phrases['VALUATION_HEADLINE']}"
RANGE: "${phrases['VALUATION_RANGE']}"
MULTIPLE: "${phrases['VALUATION_MULTIPLE']}"

⛔ When discussing valuation, state: "${phrases['VALUATION_HEADLINE']}"

---
`;
  }

  // Trajectory section
  if (phrases['TRAJECTORY_HEADLINE']) {
    injection += `
## TRAJECTORY (IF DECLINING - MANDATORY GAP)

HEADLINE: "${phrases['TRAJECTORY_HEADLINE']}"
IMPACT: "${phrases['TRAJECTORY_IMPACT']}"
IMPLICATION: "${phrases['TRAJECTORY_IMPLICATION']}"

---
`;
  }

  // Exit readiness section
  injection += `
## EXIT READINESS (MANDATORY)

HEADLINE: "${phrases['EXIT_READINESS_HEADLINE']}"
SUMMARY: "${phrases['EXIT_READINESS_SUMMARY']}"
TOP STRENGTH: "${phrases['EXIT_TOP_STRENGTH']}"
TOP BLOCKER: "${phrases['EXIT_TOP_BLOCKER']}"

---
`;

  // Cost of inaction section
  injection += `
## COST OF INACTION (MANDATORY)

HEADLINE: "${phrases['COI_HEADLINE']}"
BREAKDOWN: "${phrases['COI_BREAKDOWN']}"
URGENCY: "${phrases['COI_URGENCY']}"

⛔ Use the HEADLINE when discussing what waiting costs: "${phrases['COI_HEADLINE']}"

---
`;

  // Achievements section
  if (phrases['ACHIEVEMENTS_TOP']) {
    injection += `
## ACHIEVEMENTS (ACKNOWLEDGE THESE)

TOP ACHIEVEMENTS: "${phrases['ACHIEVEMENTS_TOP']}"
FOUNDATION: "${phrases['ACHIEVEMENTS_FOUNDATION']}"

---
`;
  }

  // Closing section
  injection += `
## CLOSING (USE FOR PAGE 5)

OPENING LINE: "${phrases['OPENING_LINE']}"
SITUATION: "${phrases['SITUATION_STATEMENT']}"
THE ASK: "${phrases['THE_ASK']}"
URGENCY: "${phrases['URGENCY_ANCHOR']}"
${phrases['NEVER_HAD_BREAK'] ? `NEVER HAD BREAK: "${phrases['NEVER_HAD_BREAK']}" - USE THIS IN CLOSING` : ''}

============================================================================
`;

  return injection;
}

