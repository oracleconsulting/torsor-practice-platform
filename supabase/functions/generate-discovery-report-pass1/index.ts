// ============================================================================
// DISCOVERY REPORT - PASS 1: EXTRACTION & SCORING + 8-DIMENSION ANALYSIS
// ============================================================================
// Enhanced version with:
// - Hidden assets extraction (freehold property, excess cash)
// - Indicative valuation range (including hidden assets)
// - Gross margin analysis
// - Achievement tracking (what they've done RIGHT)
// - Enhanced emotional anchor extraction
// - Market position capture
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// NEW: Import structured calculator integration
import { 
  runStructuredCalculations, 
  convertFinancialsFormat,
  buildPass2PromptInjection 
} from './calculators/integration.ts'
import type { Pass1Output } from './types/pass1-output.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PayrollBenchmark {
  typical: number;
  good: number;
  concern: number;
  notes: string;
}

interface PayrollAnalysis {
  isOverstaffed: boolean;
  excessPercentage: number;
  annualExcess: number;
  benchmark: PayrollBenchmark;
  assessment: 'efficient' | 'typical' | 'elevated' | 'concerning';
  calculation: string;
  staffCosts: number;
  turnover: number;
  staffCostsPct: number;
  isValidated: boolean;
  validationErrors: string[];
}

interface HiddenAsset {
  type: 'freehold_property' | 'excess_cash' | 'stock' | 'ip' | 'contracts' | 'other';
  value: number;
  description: string;
  source: 'accounts' | 'assessment' | 'calculated';
}

interface HiddenAssetsAnalysis {
  hasData: boolean;
  freeholdProperty: number | null;
  excessCash: number | null;
  totalHiddenAssets: number;
  assets: HiddenAsset[];
  narrative: string;
}

interface ValuationAnalysis {
  hasData: boolean;
  operatingProfit: number | null;
  ebitda: number | null;
  netAssets: number | null;
  baseMultipleLow: number;
  baseMultipleHigh: number;
  adjustedMultipleLow: number;
  adjustedMultipleHigh: number;
  conservativeValue: number | null;
  optimisticValue: number | null;
  // NEW: Include hidden assets in total enterprise value
  hiddenAssets: HiddenAsset[];
  totalHiddenAssetsValue: number;
  enterpriseValueLow: number | null;
  enterpriseValueHigh: number | null;
  narrative: string;
  adjustments: { factor: string; impact: number; reason: string; source: string }[];
}

interface TrajectoryAnalysis {
  hasData: boolean;
  currentRevenue: number | null;
  priorRevenue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  trend: 'growing' | 'stable' | 'declining' | 'unknown';
  concernLevel: 'none' | 'low' | 'medium' | 'high';
  ownerPerception: string | null;
  marketContext: string | null;
  narrative: string;
}

interface ProductivityAnalysis {
  hasData: boolean;
  revenue: number;
  employeeCount: number;
  revenuePerHead: number;
  benchmarkLow: number;
  benchmarkHigh: number;
  gap: number | null;
  impliedHeadcount: number;
  excessHeadcount: number | null;
  narrative: string;
}

interface GrossMarginAnalysis {
  hasData: boolean;
  grossProfit: number | null;
  turnover: number | null;
  grossMarginPct: number | null;
  assessment: 'excellent' | 'healthy' | 'typical' | 'concerning';
  industryBenchmark: { low: number; high: number };
  narrative: string;
}

interface WorkingCapitalAnalysis {
  hasData: boolean;
  debtorDays: number | null;
  creditorDays: number | null;
  stockDays: number | null;
  cashConversionCycle: number | null;
  stockOpportunity: number | null;  // Cash that could be released from stock
  narrative: string;
}

interface ExitReadinessAnalysis {
  score: number;
  maxScore: number;
  readiness: 'ready' | 'nearly' | 'not_ready';
  factors: { factor: string; score: number; maxScore: number; note: string }[];
  strengths: string[];
  blockers: string[];
  narrative: string;
}

interface CostComponent {
  category: string;
  annualCost: number;
  costOverHorizon: number;
  calculation: string;
  confidence: 'calculated' | 'estimated' | 'inferred';
}

interface CostOfInactionAnalysis {
  totalAnnual: number;
  totalOverHorizon: number;
  timeHorizon: number;
  components: CostComponent[];
  narrative: string;
}

// NEW: Track what the client has done RIGHT
interface AchievementAnalysis {
  achievements: { achievement: string; evidence: string; significance: string }[];
  narrative: string;
}

interface ValuationSignals {
  marketPosition: 'leader' | 'niche' | 'competitor' | 'unknown';
  founderDependency: 'optional' | 'moderate' | 'critical';
  hasDocumentation: boolean;
  hasUnresolvedIssues: boolean;
  coreBusinessDeclining: boolean;
  exitTimeline: string;
  avoidedConversation: string;
  neverHadBreak: boolean;  // NEW: Powerful emotional anchor
}

interface ComprehensiveAnalysis {
  dataQuality: 'comprehensive' | 'partial' | 'limited';
  availableMetrics: string[];
  missingMetrics: string[];
  valuation: ValuationAnalysis | null;
  trajectory: TrajectoryAnalysis | null;
  payroll: PayrollAnalysis | null;
  productivity: ProductivityAnalysis | null;
  grossMargin: GrossMarginAnalysis | null;  // NEW
  workingCapital: WorkingCapitalAnalysis | null;
  hiddenAssets: HiddenAssetsAnalysis | null;  // NEW
  exitReadiness: ExitReadinessAnalysis | null;
  costOfInaction: CostOfInactionAnalysis | null;
  achievements: AchievementAnalysis | null;  // NEW
}

interface ExtractedFinancials {
  source: string;
  
  // === CORE P&L ===
  turnover?: number;
  turnoverPriorYear?: number;
  turnoverGrowth?: number;
  grossProfit?: number;
  grossProfitPriorYear?: number;
  grossMarginPct?: number;
  operatingProfit?: number;
  operatingProfitPriorYear?: number;
  operatingMarginPct?: number;
  netProfit?: number;
  netProfitPriorYear?: number;
  netMarginPct?: number;
  ebitda?: number;
  costOfSales?: number;
  costOfSalesPriorYear?: number;
  
  // === STAFF COSTS (Detailed breakdown) ===
  totalStaffCosts?: number;
  staffCostsPercentOfRevenue?: number;
  directorsRemuneration?: number;        // Directors' salaries/fees
  directorsRemunerationPriorYear?: number;
  staffWages?: number;                   // Non-director wages
  socialSecurityCosts?: number;          // Employer's NI
  pensionCosts?: number;                 // Pension contributions
  costOfSalesWages?: number;             // Wages in COGS (e.g., production staff)
  employeeCount?: number;
  employeeCountPriorYear?: number;
  revenuePerEmployee?: number;
  
  // === BALANCE SHEET ASSETS ===
  netAssets?: number;
  totalAssets?: number;
  fixedAssets?: number;                  // Total tangible + intangible
  tangibleAssets?: number;
  intangibleAssets?: number;
  freeholdProperty?: number;             // Land & buildings (owned)
  leaseholdProperty?: number;            // Leasehold improvements
  plantAndMachinery?: number;
  fixturesAndFittings?: number;
  motorVehicles?: number;
  investments?: number;                  // Investment holdings
  
  // === WORKING CAPITAL ===
  cash?: number;
  cashPriorYear?: number;
  debtors?: number;                      // Trade debtors
  debtorsPriorYear?: number;
  otherDebtors?: number;                 // Other receivables
  prepayments?: number;
  stock?: number;
  stockPriorYear?: number;
  creditors?: number;                    // Trade creditors
  creditorsPriorYear?: number;
  accruals?: number;
  deferredIncome?: number;
  
  // === LIABILITIES ===
  totalLiabilities?: number;
  currentLiabilities?: number;
  longTermLiabilities?: number;
  bankLoans?: number;
  financeLeases?: number;
  directorLoans?: number;                // Loans from/to directors
  taxLiability?: number;                 // Corporation tax
  vatLiability?: number;
  
  // === EQUITY ===
  shareCapital?: number;
  calledUpShareCapital?: number;
  profitAndLossReserve?: number;
  revaluationReserve?: number;
  
  // === CALCULATED RATIOS (from table data) ===
  debtorDays?: number;
  creditorDays?: number;
  stockDays?: number;
  currentRatio?: number;
  quickRatio?: number;
  
  // === DEPRECIATION & AMORTISATION ===
  depreciation?: number;
  amortisation?: number;
}

interface DestinationClarityAnalysis {
  score: number;
  reasoning: string;
  factors: string[];
}

// ============================================================================
// INDUSTRY PAYROLL BENCHMARKS (UK SME)
// ============================================================================

const PAYROLL_BENCHMARKS: Record<string, PayrollBenchmark> = {
  // Distribution & Wholesale (28-32% is healthy range)
  'wholesale_distribution': { typical: 30, good: 28, concern: 32, notes: 'Wholesale/distribution - 28-32% healthy' },
  'distribution': { typical: 30, good: 28, concern: 32, notes: 'Distribution' },
  'wholesale': { typical: 30, good: 28, concern: 32, notes: 'Wholesale' },
  'keys_lockers': { typical: 30, good: 28, concern: 32, notes: 'Keys/lockers wholesale' },
  
  // Professional Services (45-60% typical)
  'professional_services': { typical: 52, good: 45, concern: 60, notes: 'People are the product' },
  'consulting': { typical: 52, good: 45, concern: 60, notes: 'Consulting' },
  'accountancy': { typical: 50, good: 45, concern: 55, notes: 'Accountancy' },
  'legal': { typical: 52, good: 45, concern: 60, notes: 'Legal' },
  
  // Technology (35-50% typical)
  'technology': { typical: 42, good: 35, concern: 50, notes: 'Technology' },
  'saas': { typical: 38, good: 30, concern: 45, notes: 'SaaS' },
  'software': { typical: 42, good: 35, concern: 50, notes: 'Software' },
  
  // Construction (30-40% typical)
  'construction': { typical: 35, good: 30, concern: 40, notes: 'Construction' },
  'trades': { typical: 35, good: 30, concern: 40, notes: 'Trades' },
  
  // Retail (15-25% typical)
  'retail': { typical: 20, good: 15, concern: 25, notes: 'Retail' },
  
  // Manufacturing (25-35% typical)
  'manufacturing': { typical: 30, good: 25, concern: 35, notes: 'Manufacturing' },
  
  // Default
  'general_business': { typical: 35, good: 30, concern: 40, notes: 'UK SME average' }
};

// ============================================================================
// GROSS MARGIN BENCHMARKS BY INDUSTRY
// ============================================================================

const GROSS_MARGIN_BENCHMARKS: Record<string, { low: number; high: number }> = {
  'wholesale_distribution': { low: 25, high: 40 },
  'keys_lockers': { low: 45, high: 60 },  // Higher margin niche
  'professional_services': { low: 60, high: 80 },
  'accountancy': { low: 65, high: 85 },
  'construction': { low: 15, high: 30 },
  'manufacturing': { low: 30, high: 50 },
  'retail': { low: 30, high: 50 },
  'technology': { low: 60, high: 80 },
  'saas': { low: 70, high: 90 },
  'general_business': { low: 35, high: 55 }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPayrollBenchmark(industry: string): PayrollBenchmark {
  const lower = (industry || '').toLowerCase();
  
  // Exact match
  if (PAYROLL_BENCHMARKS[lower]) return PAYROLL_BENCHMARKS[lower];
  
  // Keys/lockers detection
  if (lower.includes('key') || lower.includes('lock') || lower.includes('locker') || lower.includes('security hardware')) {
    console.log('[Pass1] Detected keys/lockers -> wholesale_distribution');
    return PAYROLL_BENCHMARKS['wholesale_distribution'];
  }
  
  // Distribution
  if (lower.includes('distrib') || lower.includes('wholesale') || lower.includes('supply')) {
    return PAYROLL_BENCHMARKS['wholesale_distribution'];
  }
  
  // Technology
  if (lower.includes('tech') || lower.includes('software') || lower.includes('saas')) {
    return PAYROLL_BENCHMARKS['technology'];
  }
  
  // Professional services
  if (lower.includes('consult') || lower.includes('advisory')) {
    return PAYROLL_BENCHMARKS['professional_services'];
  }
  
  // Accountancy
  if (lower.includes('account') || lower.includes('bookkeep')) {
    return PAYROLL_BENCHMARKS['accountancy'];
  }
  
  return PAYROLL_BENCHMARKS['general_business'];
}

function detectIndustry(responses: Record<string, any>, companyName?: string): string {
  const allText = JSON.stringify({ ...responses, companyName }).toLowerCase();
  
  if (allText.includes('key') || allText.includes('locker') || allText.includes('lock') || 
      allText.includes('security hardware') || allText.includes('office furniture')) {
    return 'keys_lockers';
  }
  if (allText.includes('distribut') || allText.includes('wholesale') || allText.includes('supply chain')) {
    return 'wholesale_distribution';
  }
  if (allText.includes('saas') || allText.includes('software') || allText.includes('platform') || allText.includes('app')) {
    return 'saas';
  }
  if (allText.includes('consult') || allText.includes('advisory')) {
    return 'professional_services';
  }
  if (allText.includes('accountan') || allText.includes('bookkeep')) {
    return 'accountancy';
  }
  if (allText.includes('construction') || allText.includes('building') || allText.includes('trade')) {
    return 'construction';
  }
  if (allText.includes('retail') || allText.includes('shop') || allText.includes('ecommerce')) {
    return 'retail';
  }
  if (allText.includes('manufactur') || allText.includes('factory')) {
    return 'manufacturing';
  }
  
  return 'general_business';
}

// ============================================================================
// EXTRACT VALUATION SIGNALS FROM ASSESSMENT RESPONSES
// ============================================================================

function extractValuationSignals(responses: Record<string, any>): ValuationSignals {
  const allText = JSON.stringify(responses).toLowerCase();
  
  // Market position - CHECK FOR EXPLICIT CLAIMS
  let marketPosition: 'leader' | 'niche' | 'competitor' | 'unknown' = 'unknown';
  const marketResponse = (responses.sd_market_position || '').toLowerCase();
  if (marketResponse.includes('leader') || marketResponse.includes('clear market leader')) {
    marketPosition = 'leader';
  } else if (marketResponse.includes('niche') || marketResponse.includes('specialist')) {
    marketPosition = 'niche';
  } else if (marketResponse.includes('competitor')) {
    marketPosition = 'competitor';
  }
  
  // Founder dependency
  let founderDependency: 'optional' | 'moderate' | 'critical' = 'moderate';
  const dependencyResponse = (responses.sd_founder_dependency || '').toLowerCase();
  if (dependencyResponse.includes('run fine') || dependencyResponse.includes('optional') || 
      dependencyResponse.includes('without me')) {
    founderDependency = 'optional';
  } else if (dependencyResponse.includes('critical') || dependencyResponse.includes('fall apart')) {
    founderDependency = 'critical';
  }
  
  // Documentation
  const docResponse = (responses.sd_documentation_ready || '').toLowerCase();
  const hasDocumentation = docResponse.includes('yes') || docResponse.includes('most things') || docResponse.includes('documented');
  
  // Unresolved issues (avoided conversation)
  const avoidedConversation = responses.ht_avoided_conversation || responses.dd_avoided_conversation || '';
  const hasUnresolvedIssues = avoidedConversation.length > 10 && 
    !avoidedConversation.toLowerCase().includes('nothing') && 
    !avoidedConversation.toLowerCase().includes('no');
  
  // Core business declining
  const magicFix = (responses.dd_magic_fix || responses.dd_90_day_magic || '').toLowerCase();
  const coreBusinessDeclining = magicFix.includes('decline') || magicFix.includes('slow decline') || 
    allText.includes('declining') || allText.includes('shrinking');
  
  // Exit timeline
  const exitTimeline = responses.sd_exit_timeline || responses.dd_exit_mindset || '';
  
  // NEW: "Never had a break" - POWERFUL emotional anchor
  const breakResponse = (responses.rl_last_break || responses.dd_last_real_break || '').toLowerCase();
  const neverHadBreak = breakResponse.includes('never') || breakResponse.includes('not once') || 
    breakResponse.includes("haven't") || breakResponse.includes('can\'t remember');
  
  return {
    marketPosition,
    founderDependency,
    hasDocumentation,
    hasUnresolvedIssues,
    coreBusinessDeclining,
    exitTimeline,
    avoidedConversation,
    neverHadBreak
  };
}

// ============================================================================
// 1. PAYROLL EFFICIENCY ANALYSIS
// ============================================================================

function analysePayrollEfficiency(financials: ExtractedFinancials, industry: string): PayrollAnalysis | null {
  if (!financials.turnover || !financials.totalStaffCosts) {
    return null;
  }
  
  const turnover = financials.turnover;
  const staffCosts = financials.totalStaffCosts;
  const staffCostsPct = (staffCosts / turnover) * 100;
  const benchmark = getPayrollBenchmark(industry);
  
  // Compare against the GOOD benchmark (the target), not typical
  const excessPercentage = Math.max(0, staffCostsPct - benchmark.good);
  const annualExcess = Math.round((excessPercentage / 100) * turnover);
  const isOverstaffed = staffCostsPct > benchmark.concern;
  
  let assessment: 'efficient' | 'typical' | 'elevated' | 'concerning' = 'typical';
  if (staffCostsPct <= benchmark.good) assessment = 'efficient';
  else if (staffCostsPct <= benchmark.typical) assessment = 'typical';
  else if (staffCostsPct <= benchmark.concern) assessment = 'elevated';
  else assessment = 'concerning';
  
  const calculation = `£${staffCosts.toLocaleString()} ÷ £${turnover.toLocaleString()} = ${staffCostsPct.toFixed(1)}%. ` +
    `Benchmark ${benchmark.good}-${benchmark.typical}%. Excess ${excessPercentage.toFixed(1)}% = £${annualExcess.toLocaleString()}/year`;
  
  return {
    isOverstaffed, excessPercentage, annualExcess, benchmark, assessment, calculation,
    staffCosts, turnover, staffCostsPct, isValidated: true, validationErrors: []
  };
}

// ============================================================================
// 2. HIDDEN ASSETS ANALYSIS (ENHANCED)
// ============================================================================

function analyseHiddenAssets(financials: ExtractedFinancials): HiddenAssetsAnalysis {
  const assets: HiddenAsset[] = [];
  let totalHiddenAssets = 0;
  
  // 1. Freehold Property - often valued at cost, could be worth more at market
  const freeholdProperty = financials.freeholdProperty || null;
  if (freeholdProperty && freeholdProperty > 0) {
    assets.push({
      type: 'freehold_property',
      value: freeholdProperty,
      description: `Freehold property at book value £${(freeholdProperty/1000).toFixed(0)}k - typically worth more at market rates`,
      source: 'accounts'
    });
    totalHiddenAssets += freeholdProperty;
  }
  
  // 2. Excess Cash - above working capital needs
  // Estimate working capital buffer as 1.5 months of turnover or £150k, whichever is higher
  const estimatedWorkingCapital = Math.max(150000, (financials.turnover || 0) / 8);
  const excessCash = financials.cash ? Math.max(0, financials.cash - estimatedWorkingCapital) : null;
  if (excessCash && excessCash > 50000) {  // Only flag if material (>£50k)
    assets.push({
      type: 'excess_cash',
      value: excessCash,
      description: `Excess cash £${(excessCash/1000).toFixed(0)}k above working capital needs`,
      source: 'calculated'
    });
    totalHiddenAssets += excessCash;
  }
  
  // 3. Investments - if holding investment assets
  if (financials.investments && financials.investments > 0) {
    assets.push({
      type: 'other',
      value: financials.investments,
      description: `Investment holdings £${(financials.investments/1000).toFixed(0)}k`,
      source: 'accounts'
    });
    totalHiddenAssets += financials.investments;
  }
  
  // 4. Director loans owed TO company (asset)
  if (financials.directorLoans && financials.directorLoans > 0) {
    assets.push({
      type: 'other',
      value: financials.directorLoans,
      description: `Director loan account £${(financials.directorLoans/1000).toFixed(0)}k (owed to company)`,
      source: 'accounts'
    });
    totalHiddenAssets += financials.directorLoans;
  }
  
  // 5. Excess stock - opportunity to release cash (note: this is an OPPORTUNITY, not hidden value)
  // Calculate stock days and identify if excessive
  let stockOpportunity: number | null = null;
  if (financials.stock && financials.costOfSales) {
    const stockDays = (financials.stock / financials.costOfSales) * 365;
    if (stockDays > 90) {  // More than 90 days is typically excessive
      const targetStockDays = 60;
      const targetStock = (financials.costOfSales / 365) * targetStockDays;
      stockOpportunity = Math.round(financials.stock - targetStock);
      // Note: Don't add to totalHiddenAssets - this is a cash release opportunity, not hidden value
    }
  }
  
  let narrative = '';
  if (assets.length > 0) {
    narrative = `Hidden assets totalling £${(totalHiddenAssets/1000).toFixed(0)}k identified: `;
    narrative += assets.map(a => a.description).join('. ');
    narrative += '. These sit OUTSIDE normal earnings-based valuations and transfer to buyer.';
    
    if (stockOpportunity && stockOpportunity > 50000) {
      narrative += ` Additionally, reducing stock to 60 days could release £${(stockOpportunity/1000).toFixed(0)}k cash.`;
    }
  } else {
    narrative = 'No significant hidden assets identified beyond normal business operations.';
  }
  
  return {
    hasData: assets.length > 0,
    freeholdProperty,
    excessCash,
    totalHiddenAssets,
    assets,
    narrative
  };
}

// ============================================================================
// 3. VALUATION ANALYSIS (ENHANCED with hidden assets)
// ============================================================================

function analyseValuation(
  financials: ExtractedFinancials, 
  valuationSignals: ValuationSignals, 
  industry: string,
  hiddenAssets: HiddenAssetsAnalysis
): ValuationAnalysis | null {
  if (!financials.operatingProfit && !financials.ebitda && !financials.netAssets) {
    return null;
  }
  
  // Industry-specific base multiples
  const industryMultiples: Record<string, { low: number; high: number }> = {
    'wholesale_distribution': { low: 3.0, high: 5.0 },
    'keys_lockers': { low: 3.0, high: 5.0 },
    'professional_services': { low: 4.0, high: 8.0 },
    'accountancy': { low: 4.0, high: 7.0 },
    'construction': { low: 2.5, high: 4.5 },
    'manufacturing': { low: 3.0, high: 5.0 },
    'retail': { low: 2.0, high: 4.0 },
    'technology': { low: 5.0, high: 10.0 },
    'saas': { low: 6.0, high: 12.0 },
    'general_business': { low: 3.0, high: 5.0 }
  };
  
  const industryLower = industry.toLowerCase();
  let selectedIndustry = 'general_business';
  for (const key of Object.keys(industryMultiples)) {
    if (industryLower.includes(key)) { selectedIndustry = key; break; }
  }
  
  const baseMultiple = industryMultiples[selectedIndustry] || industryMultiples['general_business'];
  let adjustedLow = baseMultiple.low;
  let adjustedHigh = baseMultiple.high;
  
  const adjustments: { factor: string; impact: number; reason: string; source: string }[] = [];
  
  // Market position adjustment - NOW ACTUALLY USING IT
  if (valuationSignals.marketPosition === 'leader') {
    adjustments.push({ factor: 'Market Leader', impact: 0.5, reason: 'Premium for market leadership position', source: 'assessment' });
    adjustedLow += 0.5;
    adjustedHigh += 0.5;
  } else if (valuationSignals.marketPosition === 'niche') {
    adjustments.push({ factor: 'Niche Position', impact: 0.25, reason: 'Specialist positioning', source: 'assessment' });
    adjustedLow += 0.25;
    adjustedHigh += 0.25;
  }
  
  // Founder dependency
  if (valuationSignals.founderDependency === 'optional') {
    adjustments.push({ factor: 'Low Founder Dependency', impact: 0.5, reason: 'Business runs without owner', source: 'assessment' });
    adjustedLow += 0.5;
    adjustedHigh += 0.5;
  } else if (valuationSignals.founderDependency === 'critical') {
    adjustments.push({ factor: 'High Founder Dependency', impact: -1.0, reason: 'Critical dependency on owner', source: 'assessment' });
    adjustedLow -= 1.0;
    adjustedHigh -= 1.0;
  }
  
  // Documentation
  if (valuationSignals.hasDocumentation) {
    adjustments.push({ factor: 'Documentation', impact: 0.25, reason: 'Systems documented', source: 'assessment' });
    adjustedLow += 0.25;
    adjustedHigh += 0.25;
  }
  
  // Unresolved issues
  if (valuationSignals.hasUnresolvedIssues) {
    adjustments.push({ factor: 'Unresolved Issues', impact: -0.25, reason: 'Avoided conversations/issues', source: 'assessment' });
    adjustedLow -= 0.25;
    adjustedHigh -= 0.25;
  }
  
  // Core business declining
  if (valuationSignals.coreBusinessDeclining) {
    adjustments.push({ factor: 'Declining Core', impact: -0.5, reason: 'Core business in decline', source: 'assessment' });
    adjustedLow -= 0.5;
    adjustedHigh -= 0.5;
  }
  
  // Ensure minimums
  adjustedLow = Math.max(adjustedLow, 1.5);
  adjustedHigh = Math.max(adjustedHigh, 2.0);
  
  // Calculate values
  const earningsBase = financials.operatingProfit || financials.ebitda || 0;
  const conservativeValue = earningsBase > 0 ? Math.round(earningsBase * adjustedLow) : null;
  const optimisticValue = earningsBase > 0 ? Math.round(earningsBase * adjustedHigh) : null;
  
  // NEW: Add hidden assets to get total enterprise value
  const totalHiddenAssetsValue = hiddenAssets.totalHiddenAssets || 0;
  const enterpriseValueLow = conservativeValue ? conservativeValue + totalHiddenAssetsValue : null;
  const enterpriseValueHigh = optimisticValue ? optimisticValue + totalHiddenAssetsValue : null;
  
  // Build narrative
  let narrative = '';
  if (earningsBase > 0) {
    narrative = `Operating profit £${(earningsBase/1000).toFixed(0)}k × ${adjustedLow.toFixed(1)}-${adjustedHigh.toFixed(1)}x = £${conservativeValue ? (conservativeValue/1000000).toFixed(1) : '?'}M-£${optimisticValue ? (optimisticValue/1000000).toFixed(1) : '?'}M earnings-based valuation. `;
    if (totalHiddenAssetsValue > 0) {
      narrative += `Plus hidden assets £${(totalHiddenAssetsValue/1000).toFixed(0)}k = total enterprise value £${enterpriseValueLow ? (enterpriseValueLow/1000000).toFixed(1) : '?'}M-£${enterpriseValueHigh ? (enterpriseValueHigh/1000000).toFixed(1) : '?'}M.`;
    }
  } else {
    narrative = 'Insufficient earnings data for multiple-based valuation. ';
    if (financials.netAssets) {
      narrative += `Net asset value: £${(financials.netAssets/1000).toFixed(0)}k provides floor.`;
    }
  }
  
  return {
    hasData: true,
    operatingProfit: financials.operatingProfit || null,
    ebitda: financials.ebitda || null,
    netAssets: financials.netAssets || null,
    baseMultipleLow: baseMultiple.low,
    baseMultipleHigh: baseMultiple.high,
    adjustedMultipleLow: adjustedLow,
    adjustedMultipleHigh: adjustedHigh,
    conservativeValue,
    optimisticValue,
    hiddenAssets: hiddenAssets.assets,
    totalHiddenAssetsValue,
    enterpriseValueLow,
    enterpriseValueHigh,
    narrative,
    adjustments
  };
}

// ============================================================================
// 4. TRAJECTORY ANALYSIS
// ============================================================================

function analyseTrajectory(financials: ExtractedFinancials, responses: Record<string, any>): TrajectoryAnalysis | null {
  const currentRevenue = financials.turnover || null;
  const priorRevenue = financials.turnoverPriorYear || null;
  
  // Extract owner's perception of trajectory
  const frustration = responses.rl_core_frustration || responses.dd_core_frustration || '';
  const magicFix = responses.dd_magic_fix || responses.dd_90_day_magic || '';
  const ownerPerception = frustration.toLowerCase().includes('growth') ? 'concerned_about_growth' :
                         frustration.toLowerCase().includes('decline') ? 'acknowledging_decline' : null;
  
  const marketContext = magicFix.toLowerCase().includes('decline') || magicFix.toLowerCase().includes('competition') 
    ? 'market_pressure' : null;
  
  let absoluteChange: number | null = null;
  let percentageChange: number | null = null;
  let trend: 'growing' | 'stable' | 'declining' | 'unknown' = 'unknown';
  let concernLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
  let narrative = '';
  
  if (currentRevenue && priorRevenue) {
    absoluteChange = currentRevenue - priorRevenue;
    percentageChange = (absoluteChange / priorRevenue) * 100;
    
    if (percentageChange < -5) {
      trend = 'declining';
      concernLevel = percentageChange < -10 ? 'high' : 'medium';
      narrative = `Revenue declined ${Math.abs(percentageChange).toFixed(1)}% year-on-year (£${(Math.abs(absoluteChange)/1000).toFixed(0)}k). `;
      if (ownerPerception) {
        narrative += `Owner acknowledges this - "${frustration.substring(0, 50)}..."`;
      }
    } else if (percentageChange > 5) {
      trend = 'growing';
      concernLevel = 'none';
      narrative = `Revenue grew ${percentageChange.toFixed(1)}% year-on-year. Positive momentum.`;
    } else {
      trend = 'stable';
      concernLevel = 'low';
      narrative = `Revenue stable year-on-year (${percentageChange.toFixed(1)}% change).`;
    }
  } else if (currentRevenue) {
    narrative = `Revenue £${(currentRevenue/1000000).toFixed(2)}M. No prior year comparison available.`;
  } else {
    return null;
  }
  
  return {
    hasData: true, currentRevenue, priorRevenue, absoluteChange, percentageChange,
    trend, concernLevel, ownerPerception, marketContext, narrative
  };
}

// ============================================================================
// 5. PRODUCTIVITY ANALYSIS
// ============================================================================

function analyseProductivity(financials: ExtractedFinancials, industry: string): ProductivityAnalysis | null {
  if (!financials.turnover || !financials.employeeCount) return null;
  
  const revenue = financials.turnover;
  const employeeCount = financials.employeeCount;
  const revenuePerHead = revenue / employeeCount;
  
  const industryBenchmarks: Record<string, { low: number; high: number }> = {
    'wholesale_distribution': { low: 120000, high: 180000 },
    'keys_lockers': { low: 120000, high: 180000 },
    'professional_services': { low: 80000, high: 150000 },
    'accountancy': { low: 80000, high: 150000 },
    'construction': { low: 100000, high: 150000 },
    'manufacturing': { low: 80000, high: 120000 },
    'retail': { low: 60000, high: 100000 },
    'technology': { low: 100000, high: 200000 },
    'saas': { low: 150000, high: 300000 },
    'general_business': { low: 80000, high: 130000 }
  };
  
  const industryLower = industry.toLowerCase();
  let selectedIndustry = 'general_business';
  for (const key of Object.keys(industryBenchmarks)) {
    if (industryLower.includes(key)) { selectedIndustry = key; break; }
  }
  
  const benchmark = industryBenchmarks[selectedIndustry];
  const gap = benchmark.low - revenuePerHead;
  const impliedHeadcount = Math.round(revenue / benchmark.low);
  const excessHeadcount = employeeCount - impliedHeadcount;
  
  let narrative = `Revenue per head £${(revenuePerHead/1000).toFixed(0)}k vs industry benchmark £${(benchmark.low/1000).toFixed(0)}k-£${(benchmark.high/1000).toFixed(0)}k. `;
  if (revenuePerHead < benchmark.low) {
    narrative += `Below benchmark suggests ${excessHeadcount > 0 ? `~${excessHeadcount} potential excess employees` : 'productivity improvement opportunity'}.`;
  } else if (revenuePerHead > benchmark.high) {
    narrative += `Above benchmark - team is highly productive.`;
  } else {
    narrative += `Within healthy range.`;
  }
  
  return {
    hasData: true, revenue, employeeCount, revenuePerHead,
    benchmarkLow: benchmark.low, benchmarkHigh: benchmark.high,
    gap: gap > 0 ? gap : null, impliedHeadcount, excessHeadcount: excessHeadcount > 0 ? excessHeadcount : null, narrative
  };
}

// ============================================================================
// 6. GROSS MARGIN ANALYSIS (NEW)
// ============================================================================

function analyseGrossMargin(financials: ExtractedFinancials, industry: string): GrossMarginAnalysis | null {
  if (!financials.turnover || !financials.grossProfit) return null;
  
  const turnover = financials.turnover;
  const grossProfit = financials.grossProfit;
  const grossMarginPct = (grossProfit / turnover) * 100;
  
  const industryLower = industry.toLowerCase();
  let selectedIndustry = 'general_business';
  for (const key of Object.keys(GROSS_MARGIN_BENCHMARKS)) {
    if (industryLower.includes(key)) { selectedIndustry = key; break; }
  }
  
  const benchmark = GROSS_MARGIN_BENCHMARKS[selectedIndustry] || GROSS_MARGIN_BENCHMARKS['general_business'];
  
  let assessment: 'excellent' | 'healthy' | 'typical' | 'concerning' = 'typical';
  if (grossMarginPct >= benchmark.high) assessment = 'excellent';
  else if (grossMarginPct >= (benchmark.low + benchmark.high) / 2) assessment = 'healthy';
  else if (grossMarginPct >= benchmark.low) assessment = 'typical';
  else assessment = 'concerning';
  
  let narrative = `Gross margin ${grossMarginPct.toFixed(1)}% `;
  if (assessment === 'excellent') {
    narrative += `is excellent for the industry (benchmark ${benchmark.low}-${benchmark.high}%). This is a genuine strength.`;
  } else if (assessment === 'healthy') {
    narrative += `is healthy for the industry.`;
  } else if (assessment === 'concerning') {
    narrative += `is below industry benchmark of ${benchmark.low}%. May indicate pricing or cost issues.`;
  } else {
    narrative += `is within typical range.`;
  }
  
  return {
    hasData: true,
    grossProfit,
    turnover,
    grossMarginPct,
    assessment,
    industryBenchmark: benchmark,
    narrative
  };
}

// ============================================================================
// 7. WORKING CAPITAL ANALYSIS (ENHANCED)
// ============================================================================

function analyseWorkingCapital(financials: ExtractedFinancials): WorkingCapitalAnalysis | null {
  if (!financials.turnover) return null;
  
  const turnover = financials.turnover;
  const costOfSales = financials.costOfSales || turnover * 0.5;  // Estimate if not available
  
  // Calculate days metrics
  const debtorDays = financials.debtorDays || 
    (financials.debtors ? Math.round((financials.debtors / turnover) * 365) : null);
  const creditorDays = financials.creditorDays || 
    (financials.creditors ? Math.round((financials.creditors / costOfSales) * 365) : null);
  const stockDays = financials.stockDays || 
    (financials.stock ? Math.round((financials.stock / costOfSales) * 365) : null);
  
  // Cash conversion cycle
  let cashConversionCycle: number | null = null;
  if (debtorDays !== null && stockDays !== null && creditorDays !== null) {
    cashConversionCycle = debtorDays + stockDays - creditorDays;
  }
  
  // Calculate stock opportunity (if holding >90 days)
  let stockOpportunity: number | null = null;
  if (stockDays && stockDays > 90 && financials.stock) {
    const targetStockDays = 60;  // Target 60 days for most businesses
    const targetStock = (costOfSales / 365) * targetStockDays;
    stockOpportunity = Math.round(financials.stock - targetStock);
  }
  
  // YoY comparisons
  const cashChange = financials.cash && financials.cashPriorYear ? 
    financials.cash - financials.cashPriorYear : null;
  const cashChangePct = cashChange && financials.cashPriorYear ? 
    (cashChange / financials.cashPriorYear) * 100 : null;
  
  // Build narrative
  const parts: string[] = [];
  
  if (debtorDays !== null) {
    let debtorAssessment = '';
    if (debtorDays <= 30) debtorAssessment = ' (excellent)';
    else if (debtorDays <= 45) debtorAssessment = ' (good)';
    else if (debtorDays > 60) debtorAssessment = ' (high - chase required)';
    parts.push(`Debtor days: ${debtorDays}${debtorAssessment}`);
  }
  
  if (stockDays !== null) {
    let stockAssessment = '';
    if (stockDays > 120) stockAssessment = ' (very high - significant cash tied up)';
    else if (stockDays > 90) stockAssessment = ' (high - opportunity to release cash)';
    parts.push(`Stock days: ${stockDays}${stockAssessment}`);
    
    if (stockOpportunity && stockOpportunity > 50000) {
      parts.push(`Potential cash release from stock: £${(stockOpportunity/1000).toFixed(0)}k`);
    }
  }
  
  if (creditorDays !== null) {
    parts.push(`Creditor days: ${creditorDays}`);
  }
  
  if (cashChange && Math.abs(cashChange) > 10000) {
    const direction = cashChange > 0 ? 'up' : 'down';
    parts.push(`Cash ${direction} £${(Math.abs(cashChange)/1000).toFixed(0)}k YoY${cashChangePct ? ` (${cashChangePct > 0 ? '+' : ''}${cashChangePct.toFixed(0)}%)` : ''}`);
  }
  
  const narrative = parts.length > 0 ? parts.join('. ') + '.' : 'Insufficient data for working capital analysis.';
  
  return {
    hasData: debtorDays !== null || stockDays !== null || creditorDays !== null,
    debtorDays, 
    creditorDays, 
    stockDays, 
    cashConversionCycle, 
    stockOpportunity, 
    narrative
  };
}

// ============================================================================
// 8. EXIT READINESS ANALYSIS
// ============================================================================

function analyseExitReadiness(responses: Record<string, any>, financials: ExtractedFinancials): ExitReadinessAnalysis | null {
  const factors: { factor: string; score: number; maxScore: number; note: string }[] = [];
  const strengths: string[] = [];
  const blockers: string[] = [];
  
  // 1. Founder Dependency (20 points)
  const dependencyResponse = (responses.sd_founder_dependency || '').toLowerCase();
  let dependencyScore = 10;
  if (dependencyResponse.includes('run fine') || dependencyResponse.includes('optional') || 
      dependencyResponse.includes('without me')) {
    dependencyScore = 20;
    strengths.push('Business runs without owner');
  } else if (dependencyResponse.includes('critical') || dependencyResponse.includes('fall apart')) {
    dependencyScore = 0;
    blockers.push('High founder dependency');
  }
  factors.push({ factor: 'Founder Dependency', score: dependencyScore, maxScore: 20, note: dependencyResponse.substring(0, 50) });
  
  // 2. Financial Clarity (15 points)
  const financialResponse = (responses.sd_financial_confidence || '').toLowerCase();
  let financialScore = 8;
  if (financialResponse.includes('very confident') || financialResponse.includes('completely')) {
    financialScore = 15;
    strengths.push('Strong financial visibility');
  } else if (financialResponse.includes('not confident') || financialResponse.includes('unsure')) {
    financialScore = 0;
    blockers.push('Financial data unreliable');
  }
  factors.push({ factor: 'Financial Clarity', score: financialScore, maxScore: 15, note: financialResponse.substring(0, 50) });
  
  // 3. Documentation (15 points)
  const docResponse = (responses.sd_documentation_ready || '').toLowerCase();
  let docScore = 8;
  if (docResponse.includes('yes') || docResponse.includes('everything')) {
    docScore = 15;
    strengths.push('Systems documented');
  } else if (docResponse.includes('probably') || docResponse.includes('most things')) {
    docScore = 10;
  } else if (docResponse.includes('no') || docResponse.includes('nothing')) {
    docScore = 0;
    blockers.push('Poor documentation');
  }
  factors.push({ factor: 'Documentation', score: docScore, maxScore: 15, note: docResponse.substring(0, 50) });
  
  // 4. Revenue Trajectory (20 points)
  let trajectoryScore = 10;
  if (financials.turnover && financials.turnoverPriorYear) {
    const growth = (financials.turnover - financials.turnoverPriorYear) / financials.turnoverPriorYear;
    if (growth > 0.05) {
      trajectoryScore = 20;
      strengths.push('Revenue growing');
    } else if (growth >= -0.02) {
      trajectoryScore = 15;
    } else {
      trajectoryScore = 5;
      blockers.push('Revenue declining');
    }
  }
  factors.push({ factor: 'Revenue Trajectory', score: trajectoryScore, maxScore: 20, note: '' });
  
  // 5. People Issues (15 points)
  const avoidedConversation = (responses.ht_avoided_conversation || responses.dd_avoided_conversation || '').toLowerCase();
  let peopleScore = 15;
  if (avoidedConversation.includes('redundanc') || avoidedConversation.includes('fire') || 
      avoidedConversation.includes('staff')) {
    peopleScore = 0;
    blockers.push('Unresolved people issues');
  } else if (avoidedConversation.length > 10 && !avoidedConversation.includes('nothing') && !avoidedConversation.includes('no')) {
    peopleScore = 5;
    blockers.push('Avoided conversation pending');
  }
  factors.push({ factor: 'People Issues', score: peopleScore, maxScore: 15, note: avoidedConversation.substring(0, 50) });
  
  // 6. Market Position (15 points)
  const marketResponse = (responses.sd_market_position || '').toLowerCase();
  let marketScore = 8;
  if (marketResponse.includes('leader') || marketResponse.includes('dominant')) {
    marketScore = 15;
    strengths.push('Market leader position');
  } else if (marketResponse.includes('niche') || marketResponse.includes('specialist')) {
    marketScore = 12;
  } else if (marketResponse.includes('struggling') || marketResponse.includes('losing')) {
    marketScore = 0;
    blockers.push('Weak market position');
  }
  factors.push({ factor: 'Market Position', score: marketScore, maxScore: 15, note: marketResponse.substring(0, 50) });
  
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);
  const readiness: 'ready' | 'nearly' | 'not_ready' = totalScore >= 70 ? 'ready' : totalScore >= 50 ? 'nearly' : 'not_ready';
  
  let narrative = `Exit readiness score: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%). `;
  if (strengths.length > 0) narrative += `Strengths: ${strengths.join(', ').toLowerCase()}. `;
  if (blockers.length > 0) narrative += `Blockers: ${blockers.join(', ').toLowerCase()}.`;
  
  return { score: totalScore, maxScore, readiness, factors, strengths, blockers, narrative };
}

// ============================================================================
// 9. COST OF INACTION ANALYSIS
// ============================================================================

function calculateCostOfInaction(
  payrollAnalysis: PayrollAnalysis | null,
  trajectoryAnalysis: TrajectoryAnalysis | null,
  valuationAnalysis: ValuationAnalysis | null,
  responses: Record<string, any>
): CostOfInactionAnalysis {
  const components: CostComponent[] = [];
  
  // Determine time horizon from exit timeline
  let timeHorizon = 3;
  const exitResponse = (responses.sd_exit_timeline || responses.dd_exit_mindset || '').toLowerCase();
  if (exitResponse.includes('1-3') || exitResponse.includes('actively preparing')) timeHorizon = 2;
  else if (exitResponse.includes('3-5')) timeHorizon = 4;
  else if (exitResponse.includes('5+') || exitResponse.includes('never')) timeHorizon = 5;
  
  // 1. Payroll excess
  if (payrollAnalysis?.annualExcess && payrollAnalysis.annualExcess > 0) {
    components.push({
      category: 'Payroll Excess',
      annualCost: payrollAnalysis.annualExcess,
      costOverHorizon: payrollAnalysis.annualExcess * timeHorizon,
      calculation: `£${(payrollAnalysis.annualExcess/1000).toFixed(0)}k/year × ${timeHorizon} years`,
      confidence: 'calculated'
    });
  }
  
  // 2. Revenue decline (if applicable)
  if (trajectoryAnalysis?.trend === 'declining' && trajectoryAnalysis.absoluteChange) {
    const annualDecline = Math.abs(trajectoryAnalysis.absoluteChange);
    // Compound the decline
    let totalDecline = annualDecline;
    for (let i = 1; i < timeHorizon; i++) {
      totalDecline += annualDecline * Math.pow(1.1, i);  // 10% compounding assumption
    }
    components.push({
      category: 'Revenue Decline',
      annualCost: annualDecline,
      costOverHorizon: Math.round(totalDecline),
      calculation: `£${(annualDecline/1000).toFixed(0)}k decline, compounding over ${timeHorizon} years`,
      confidence: 'estimated'
    });
  }
  
  // 3. Valuation erosion (if declining + no action)
  if (valuationAnalysis?.conservativeValue && trajectoryAnalysis?.trend === 'declining') {
    // Assume 5% valuation erosion per year of inaction
    const annualErosion = Math.round(valuationAnalysis.conservativeValue * 0.05);
    components.push({
      category: 'Valuation Erosion',
      annualCost: annualErosion,
      costOverHorizon: annualErosion * timeHorizon,
      calculation: `5% annual multiple erosion on £${(valuationAnalysis.conservativeValue/1000000).toFixed(1)}M base`,
      confidence: 'estimated'
    });
  }
  
  const totalAnnual = components.reduce((sum, c) => sum + c.annualCost, 0);
  const totalOverHorizon = components.reduce((sum, c) => sum + c.costOverHorizon, 0);
  
  let narrative = '';
  if (components.length > 0) {
    narrative = `Cost of inaction over ${timeHorizon}-year horizon: £${(totalOverHorizon/1000).toFixed(0)}k+. `;
    narrative += `Breakdown: ${components.map(c => `${c.category}: £${(c.costOverHorizon/1000).toFixed(0)}k`).join(', ')}.`;
  } else {
    narrative = `No quantifiable cost of inaction calculated - likely qualitative (stress, time, health).`;
  }
  
  return { totalAnnual, totalOverHorizon, timeHorizon, components, narrative };
}

// ============================================================================
// 10. ACHIEVEMENT ANALYSIS (ENHANCED - What they've done RIGHT)
// ============================================================================

function analyseAchievements(
  responses: Record<string, any>, 
  financials: ExtractedFinancials,
  payroll: PayrollAnalysis | null,
  grossMargin: GrossMarginAnalysis | null,
  exitReadiness: ExitReadinessAnalysis | null
): AchievementAnalysis {
  const achievements: { achievement: string; evidence: string; significance: string }[] = [];
  
  // === OPERATIONAL ACHIEVEMENTS (from assessment) ===
  
  // 1. Low working hours
  const hoursResponse = (responses.rl_weekly_hours || responses.dd_weekly_hours || responses.dd_owner_hours || '').toLowerCase();
  if (hoursResponse.includes('under 30') || hoursResponse.includes('under 35') || hoursResponse.includes('30') || 
      hoursResponse.includes('less than 30')) {
    achievements.push({
      achievement: 'Business runs without constant attention',
      evidence: `Works ${hoursResponse.includes('under 30') ? 'under 30' : '30-40'} hours per week`,
      significance: 'Exceptional for a £2M+ business - most owners work 50-60 hours'
    });
  }
  
  // 2. High strategic time
  const timeAllocation = (responses.rl_time_allocation || responses.dd_time_allocation || responses.dd_time_breakdown || '').toLowerCase();
  if (timeAllocation.includes('70%') || timeAllocation.includes('80%') || timeAllocation.includes('90%') || 
      timeAllocation.includes('strategic') || timeAllocation.includes('optional')) {
    achievements.push({
      achievement: 'Working ON the business, not in it',
      evidence: 'Majority of time on strategic work',
      significance: 'Buyers pay premium for businesses that don\'t need the owner in operations'
    });
  }
  
  // 3. Business runs without them
  const dependency = (responses.sd_founder_dependency || responses.dd_founder_dependency || '').toLowerCase();
  if (dependency.includes('run fine') || dependency.includes('optional') || dependency.includes('without me') ||
      dependency.includes('ticks along')) {
    achievements.push({
      achievement: 'True founder optionality achieved',
      evidence: 'Business runs fine without daily involvement',
      significance: 'Dramatically increases valuation multiples'
    });
  }
  
  // 4. Strong financial visibility
  const financialConfidence = (responses.sd_financial_confidence || responses.dd_financial_confidence || '').toLowerCase();
  if (financialConfidence.includes('very confident') || financialConfidence.includes('completely') ||
      financialConfidence.includes('on top of')) {
    achievements.push({
      achievement: 'Financial data is trustworthy',
      evidence: 'Complete confidence in financial data',
      significance: 'Many businesses have unreliable data - this is a genuine strength for buyers'
    });
  }
  
  // 5. Market leadership
  const marketPosition = (responses.sd_market_position || responses.dd_market_position || '').toLowerCase();
  if (marketPosition.includes('leader') || marketPosition.includes('clear market leader') || 
      marketPosition.includes('dominant') || marketPosition.includes('number one')) {
    achievements.push({
      achievement: 'Market leader position established',
      evidence: `Describes business as "${responses.sd_market_position || responses.dd_market_position}"`,
      significance: 'Market leaders command premium valuations (+0.5x multiple typical)'
    });
  }
  
  // 6. Data-driven management
  const dataDecisions = (responses.sd_data_driven || responses.dd_data_driven || '').toLowerCase();
  if (dataDecisions.includes('weekly') || dataDecisions.includes('daily') || 
      dataDecisions.includes('numbers') || dataDecisions.includes('actively managing')) {
    achievements.push({
      achievement: 'Data-driven decision making',
      evidence: 'Actively managing by the numbers',
      significance: 'Sophisticated management approach - attractive to acquirers'
    });
  }
  
  // 7. Systems documented
  const documentation = (responses.sd_documentation_ready || responses.dd_documentation_ready || '').toLowerCase();
  if (documentation.includes('yes') || documentation.includes('documented') || documentation.includes('most things')) {
    achievements.push({
      achievement: 'Business systems documented',
      evidence: 'Processes and procedures written down',
      significance: 'Reduces risk for buyers and accelerates due diligence'
    });
  }
  
  // === FINANCIAL ACHIEVEMENTS (from accounts) ===
  
  // 8. Strong gross margin (from financials)
  if (grossMargin?.assessment === 'excellent') {
    achievements.push({
      achievement: `Excellent gross margins (${grossMargin.grossMarginPct?.toFixed(1)}%)`,
      evidence: `Well above industry average of ${grossMargin.industryBenchmark.low}-${grossMargin.industryBenchmark.high}%`,
      significance: 'Indicates strong pricing power and operational efficiency'
    });
  } else if (grossMargin?.assessment === 'healthy') {
    achievements.push({
      achievement: `Healthy gross margins (${grossMargin.grossMarginPct?.toFixed(1)}%)`,
      evidence: 'Above industry average',
      significance: 'Solid foundation for profitability'
    });
  }
  
  // 9. Efficient payroll (if actually efficient)
  if (payroll?.assessment === 'efficient') {
    achievements.push({
      achievement: 'Lean staffing structure',
      evidence: `Staff costs ${payroll.staffCostsPct.toFixed(1)}% vs ${payroll.benchmark.good}% benchmark`,
      significance: 'Operating at efficient levels - no fat to cut'
    });
  }
  
  // 10. Profit growing despite revenue challenges
  if (financials.operatingProfit && financials.operatingProfitPriorYear && 
      financials.turnover && financials.turnoverPriorYear) {
    const profitGrowth = (financials.operatingProfit - financials.operatingProfitPriorYear) / financials.operatingProfitPriorYear;
    const revenueGrowth = (financials.turnover - financials.turnoverPriorYear) / financials.turnoverPriorYear;
    
    if (profitGrowth > 0 && revenueGrowth <= 0) {
      achievements.push({
        achievement: 'Profit grew despite flat/declining revenue',
        evidence: `Operating profit up ${(profitGrowth * 100).toFixed(1)}% while revenue ${revenueGrowth < 0 ? 'down' : 'flat'} ${Math.abs(revenueGrowth * 100).toFixed(1)}%`,
        significance: 'Demonstrates strong cost management and operational discipline'
      });
    } else if (profitGrowth > 0.1) {  // >10% profit growth
      achievements.push({
        achievement: 'Strong profit growth',
        evidence: `Operating profit up ${(profitGrowth * 100).toFixed(1)}% year-on-year`,
        significance: 'Positive earnings trajectory attractive to buyers'
      });
    }
  }
  
  // 11. Cash generation
  if (financials.cash && financials.cashPriorYear) {
    const cashGrowth = (financials.cash - financials.cashPriorYear) / financials.cashPriorYear;
    if (cashGrowth > 0.2) {  // >20% cash growth
      achievements.push({
        achievement: 'Strong cash generation',
        evidence: `Cash up ${(cashGrowth * 100).toFixed(0)}% year-on-year (£${((financials.cash - financials.cashPriorYear)/1000).toFixed(0)}k)`,
        significance: 'Business generating real cash, not just paper profits'
      });
    }
  }
  
  // 12. Good work/life balance achieved
  const sacrificed = (responses.rl_sacrifice || responses.dd_sacrifice || '').toLowerCase();
  if (sacrificed.includes('good work/life') || sacrificed.includes('balance') || 
      sacrificed.includes('apart from that')) {
    achievements.push({
      achievement: 'Maintained work/life balance',
      evidence: 'Acknowledges reasonable balance despite challenges',
      significance: 'Business hasn\'t completely consumed personal life'
    });
  }
  
  // 13. Healthy debtor collection
  if (financials.debtors && financials.turnover) {
    const debtorDays = (financials.debtors / financials.turnover) * 365;
    if (debtorDays < 30) {
      achievements.push({
        achievement: 'Excellent debtor control',
        evidence: `Debtor days at ${Math.round(debtorDays)} - well below typical 45 days`,
        significance: 'Cash coming in quickly - sign of strong customer relationships and credit control'
      });
    }
  }
  
  // Build narrative
  let narrative = '';
  if (achievements.length >= 4) {
    narrative = `You've built something most owners dream of. ${achievements.slice(0, 4).map(a => a.achievement.toLowerCase()).join(', ')}. These are genuine achievements - they're also what buyers pay premium for.`;
  } else if (achievements.length >= 2) {
    narrative = `Foundation strengths: ${achievements.map(a => a.achievement.toLowerCase()).join(', ')}. These position you well.`;
  } else if (achievements.length > 0) {
    narrative = `Key strength: ${achievements[0].achievement}.`;
  } else {
    narrative = '';
  }
  
  return { achievements, narrative };
}

// ============================================================================
// DESTINATION CLARITY CALCULATOR
// ============================================================================

function calculateDestinationClarity(responses: Record<string, any>): DestinationClarityAnalysis {
  const factors: string[] = [];
  let score = 0;
  
  // Tuesday Test / 5-year vision
  const vision = responses.dd_five_year_picture || responses.dd_five_year_vision || '';
  if (vision.length > 100) {
    score += 2;
    factors.push('Detailed vision provided');
    
    // Outcome specificity
    if (/sold|exit|sell|retire|step back/i.test(vision)) {
      score += 2;
      factors.push('Clear exit-focused outcome');
    }
    
    // People/stakeholder awareness
    if (/team|colleague|staff|employee|family|wife|husband|partner|kids|children/i.test(vision)) {
      score += 2;
      factors.push('Considers stakeholders');
    }
    
    // Financial clarity
    if (/good sum|well paid|financial|money|secure/i.test(vision)) {
      score += 1;
      factors.push('Financial outcome mentioned');
    }
  }
  
  // Success definition
  const success = responses.dd_success_definition || '';
  if (success.length > 20) {
    score += 1;
    if (/profitab|without me|passive|freedom/i.test(success)) {
      score += 1;
      factors.push('Success = independence');
    }
  }
  
  // Non-negotiables
  const nonNegotiables = responses.dd_non_negotiables || [];
  if (Array.isArray(nonNegotiables) && nonNegotiables.length >= 3) {
    score += 1;
    factors.push(`${nonNegotiables.length} clear non-negotiables`);
  }
  
  // Business relationship (conviction)
  const relationship = responses.rl_business_relationship || responses.dd_business_relationship || '';
  if (relationship.toLowerCase().includes('time to move on') || relationship.toLowerCase().includes('exit')) {
    score += 2;
    factors.push('Strong exit conviction');
  }
  
  // Exit timeline specificity
  const timeline = responses.sd_exit_timeline || '';
  if (timeline.includes('1-3') || timeline.includes('actively preparing')) {
    score += 1;
    factors.push('Clear 1-3 year timeline');
  }
  
  // Cap at 10
  score = Math.min(score, 10);
  
  // Generate reasoning
  let reasoning = '';
  if (score >= 8) reasoning = 'Crystal clear - knows exactly what the destination looks like, who needs to be taken care of, and that it\'s time to move on.';
  else if (score >= 6) reasoning = 'Good clarity on direction with some specific elements defined.';
  else if (score >= 4) reasoning = 'General sense of direction but lacking specific details.';
  else reasoning = 'Destination unclear - needs discovery work to define outcomes.';
  
  return { score: Math.max(score, 1), reasoning, factors };
}

// ============================================================================
// MASTER ORCHESTRATOR
// ============================================================================

function performComprehensiveAnalysis(
  financials: ExtractedFinancials,
  responses: Record<string, any>,
  industry: string
): ComprehensiveAnalysis {
  const valuationSignals = extractValuationSignals(responses);
  
  // Run all analyses
  const payroll = analysePayrollEfficiency(financials, industry);
  const grossMargin = analyseGrossMargin(financials, industry);
  const hiddenAssets = analyseHiddenAssets(financials);
  const valuation = analyseValuation(financials, valuationSignals, industry, hiddenAssets);
  const trajectory = analyseTrajectory(financials, responses);
  const productivity = analyseProductivity(financials, industry);
  const workingCapital = analyseWorkingCapital(financials);
  const exitReadiness = analyseExitReadiness(responses, financials);
  const costOfInaction = calculateCostOfInaction(payroll, trajectory, valuation, responses);
  const achievements = analyseAchievements(responses, financials, payroll, grossMargin, exitReadiness);
  
  // Track data quality
  const availableMetrics: string[] = [];
  const missingMetrics: string[] = [];
  
  if (valuation?.hasData) availableMetrics.push('valuation'); else missingMetrics.push('valuation');
  if (trajectory?.hasData) availableMetrics.push('trajectory'); else missingMetrics.push('trajectory');
  if (payroll) availableMetrics.push('payroll'); else missingMetrics.push('payroll');
  if (productivity?.hasData) availableMetrics.push('productivity'); else missingMetrics.push('productivity');
  if (grossMargin?.hasData) availableMetrics.push('grossMargin'); else missingMetrics.push('grossMargin');
  if (workingCapital?.hasData) availableMetrics.push('workingCapital'); else missingMetrics.push('workingCapital');
  if (hiddenAssets?.hasData) availableMetrics.push('hiddenAssets'); else missingMetrics.push('hiddenAssets');
  if (exitReadiness) availableMetrics.push('exitReadiness');
  
  const dataQuality = availableMetrics.length >= 6 ? 'comprehensive' :
                      availableMetrics.length >= 4 ? 'partial' : 'limited';
  
  console.log('[Pass1] Comprehensive Analysis complete:', { 
    dataQuality, 
    availableMetrics,
    achievements: achievements.achievements.length
  });
  
  return {
    dataQuality, availableMetrics, missingMetrics,
    valuation, trajectory, payroll, productivity, grossMargin, 
    workingCapital, hiddenAssets, exitReadiness, costOfInaction, achievements
  };
}

// ============================================================================
// SCORING ENGINE (Inlined from service-scorer-v2)
// ============================================================================

interface ServiceScore {
  code: string;
  name: string;
  score: number;
  confidence: number;
  triggers: string[];
  priority: number;
}

interface ScoringResult {
  scores: Record<string, ServiceScore>;
  recommendations: { code: string; name: string; score: number; recommended: boolean }[];
  patterns: {
    isExitFocused: boolean;
    isGrowthFocused: boolean;
    isInCrisis: boolean;
    urgencyMultiplier: number;
  };
  emotionalAnchors: string[];
}

function scoreServicesFromDiscovery(responses: Record<string, any>): ScoringResult {
  const scores: Record<string, ServiceScore> = {};
  const emotionalAnchors: string[] = [];
  
  // Initialize all services
  const services = [
    { code: 'benchmarking', name: 'Benchmarking & Hidden Value Analysis' },
    { code: '365_method', name: 'Goal Alignment Programme' },
    { code: 'management_accounts', name: 'Management Accounts' },
    { code: 'systems_audit', name: 'Systems Audit' },
    { code: 'fractional_cfo', name: 'Fractional CFO Services' },
    { code: 'fractional_coo', name: 'Fractional COO Services' },
    { code: 'automation', name: 'Automation Services' },
    { code: 'business_advisory', name: 'Business Advisory & Exit Planning' }
  ];
  
  services.forEach(s => {
    scores[s.code] = { code: s.code, name: s.name, score: 0, confidence: 0, triggers: [], priority: 0 };
  });
  
  const allText = JSON.stringify(responses).toLowerCase();
  
  // Detect patterns
  const isExitFocused = /exit|sold|sell|retire|move on|step back|succession/i.test(allText);
  const isGrowthFocused = /grow|scale|expand|hire|revenue target/i.test(allText) && !isExitFocused;
  const isInCrisis = /crisis|urgent|emergency|critical|failing|cashflow problem/i.test(allText);
  
  // Extract emotional anchors (ENHANCED)
  const vision = responses.dd_five_year_picture || responses.dd_five_year_vision || '';
  if (vision.length > 50) {
    // Look for quotable phrases
    const sentences = vision.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
    if (sentences.length > 0) {
      emotionalAnchors.push(sentences[0].trim());
    }
  }
  
  // "Never had a break" - POWERFUL anchor
  const breakResponse = responses.rl_last_break || responses.dd_last_real_break || '';
  if (/never|not once|haven't|can't remember/i.test(breakResponse)) {
    emotionalAnchors.push("You've never had a proper break. Not once.");
  }
  
  const avoidedConv = responses.ht_avoided_conversation || responses.dd_avoided_conversation || '';
  if (avoidedConv.length > 10 && !/nothing|no|none/i.test(avoidedConv)) {
    emotionalAnchors.push(`The avoided conversation: "${avoidedConv}"`);
  }
  
  const frustration = responses.rl_core_frustration || responses.dd_core_frustration || '';
  if (frustration.length > 10) {
    emotionalAnchors.push(`Core frustration: "${frustration}"`);
  }
  
  // Score services based on patterns
  if (isExitFocused) {
    scores['benchmarking'].score += 40;
    scores['benchmarking'].triggers.push('Exit focus detected');
    scores['benchmarking'].priority = 1;
    
    scores['365_method'].score += 30;
    scores['365_method'].triggers.push('Exit planning needed');
    scores['365_method'].priority = 2;
  }
  
  if (isGrowthFocused) {
    scores['365_method'].score += 35;
    scores['365_method'].triggers.push('Growth focus detected');
    
    scores['fractional_cfo'].score += 25;
    scores['fractional_cfo'].triggers.push('Growth requires financial strategy');
  }
  
  // Financial confidence triggers
  const financialConfidence = responses.sd_financial_confidence || '';
  if (/not confident|unsure|unreliable/i.test(financialConfidence)) {
    scores['management_accounts'].score += 30;
    scores['management_accounts'].triggers.push('Financial data concerns');
  }
  
  // Operational triggers
  const manualTasks = responses.sd_manual_tasks || [];
  if (Array.isArray(manualTasks) && manualTasks.length >= 3) {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push('Multiple manual processes');
    
    scores['automation'].score += 20;
    scores['automation'].triggers.push('Automation opportunities');
  }
  
  // People triggers
  if (/staff|people|team|redundan/i.test(avoidedConv)) {
    scores['fractional_coo'].score += 20;
    scores['fractional_coo'].triggers.push('People management issues');
  }
  
  const urgencyMultiplier = isInCrisis ? 1.5 : isExitFocused ? 1.2 : 1.0;
  
  // Build recommendations
  const recommendations = Object.values(scores)
    .map(s => ({
      code: s.code,
      name: s.name,
      score: Math.round(s.score * urgencyMultiplier),
      recommended: s.score >= 20
    }))
    .sort((a, b) => b.score - a.score);
  
  return {
    scores,
    recommendations,
    patterns: { isExitFocused, isGrowthFocused, isInCrisis, urgencyMultiplier },
    emotionalAnchors
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'engagementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Pass1] Starting for engagement:', engagementId);
    const startTime = Date.now();

    // ========================================================================
    // FETCH ENGAGEMENT DATA
    // IMPORTANT: Query discovery_engagements table (matches frontend)
    // ========================================================================
    
    const { data: engagement, error: engagementError } = await supabase
      .from('discovery_engagements')
      .select(`
        *,
        client:practice_members!discovery_engagements_client_id_fkey(id, name, email, client_company),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      console.error('[Pass1] Engagement not found:', engagementError?.message);
      throw new Error('Engagement not found');
    }

    console.log('[Pass1] Found engagement for client:', engagement.client?.name);

    // ========================================================================
    // EXTRACT DISCOVERY RESPONSES
    // ========================================================================
    
    let discoveryResponses: Record<string, any> = {};
    
    if (engagement.discovery) {
      if (engagement.discovery.responses) {
        discoveryResponses = typeof engagement.discovery.responses === 'string' 
          ? JSON.parse(engagement.discovery.responses) 
          : engagement.discovery.responses;
      } else {
        // Try to build from individual columns
        const d = engagement.discovery;
        discoveryResponses = {
          dd_five_year_picture: d.dd_five_year_picture || d.five_year_vision,
          dd_success_definition: d.dd_success_definition || d.success_definition,
          dd_non_negotiables: d.dd_non_negotiables || d.non_negotiables,
          dd_magic_fix: d.dd_magic_fix || d.magic_fix,
          rl_weekly_hours: d.rl_weekly_hours || d.weekly_hours,
          rl_time_allocation: d.rl_time_allocation || d.time_allocation,
          rl_core_frustration: d.rl_core_frustration || d.core_frustration,
          rl_business_relationship: d.rl_business_relationship || d.business_relationship,
          rl_sacrifice: d.rl_sacrifice || d.sacrifice,
          rl_last_break: d.rl_last_break || d.last_break,
          rl_sleep_thief: d.rl_sleep_thief || d.sleep_thief,
          ht_avoided_conversation: d.ht_avoided_conversation || d.avoided_conversation,
          ht_hard_truth: d.ht_hard_truth || d.hard_truth,
          ht_suspected_truth: d.ht_suspected_truth || d.suspected_truth,
          sd_financial_confidence: d.sd_financial_confidence || d.financial_confidence,
          sd_founder_dependency: d.sd_founder_dependency || d.founder_dependency,
          sd_manual_tasks: d.sd_manual_tasks || d.manual_tasks,
          sd_documentation_ready: d.sd_documentation_ready || d.documentation_ready,
          sd_market_position: d.sd_market_position || d.market_position,
          sd_exit_timeline: d.sd_exit_timeline || d.exit_timeline,
          dd_change_readiness: d.dd_change_readiness || d.change_readiness
        };
      }
    }

    console.log('[Pass1] Discovery responses loaded:', Object.keys(discoveryResponses).length, 'fields');

    // ========================================================================
    // FETCH FINANCIAL CONTEXT
    // ========================================================================
    
    const { data: financialContext } = await supabase
      .from('client_financial_context')
      .select('*')
      .eq('client_id', engagement.client_id)
      .order('period_end_date', { ascending: false })
      .limit(1)
      .single();

    // ========================================================================
    // EXTRACT FINANCIALS - COMPREHENSIVE EXTRACTION
    // Pulls from both table columns AND extracted_insights JSONB
    // ========================================================================
    
    let extractedFinancials: ExtractedFinancials = { source: 'none' };
    
    if (financialContext) {
      const insights = financialContext.extracted_insights || {};
      
      // Get prior year data if available (from separate record or insights)
      const { data: priorYearContext } = await supabase
        .from('client_financial_context')
        .select('*')
        .eq('client_id', engagement.client_id)
        .lt('period_end_date', financialContext.period_end_date)
        .order('period_end_date', { ascending: false })
        .limit(1)
        .single();
      
      const priorInsights = priorYearContext?.extracted_insights || {};
      
      // === CORE P&L ===
      const turnover = financialContext.turnover || financialContext.revenue || insights.turnover || insights.revenue;
      const turnoverPriorYear = priorYearContext?.turnover || priorYearContext?.revenue || 
                                insights.turnover_prior_year || insights.prior_year_turnover ||
                                priorInsights.turnover;
      
      const grossProfit = financialContext.gross_profit || insights.gross_profit;
      const grossProfitPriorYear = priorYearContext?.gross_profit || insights.gross_profit_prior_year || priorInsights.gross_profit;
      
      const operatingProfit = financialContext.operating_profit || insights.operating_profit;
      const operatingProfitPriorYear = priorYearContext?.operating_profit || insights.operating_profit_prior_year || priorInsights.operating_profit;
      
      const netProfit = financialContext.net_profit || insights.net_profit || insights.profit_after_tax;
      const netProfitPriorYear = priorYearContext?.net_profit || insights.net_profit_prior_year || priorInsights.net_profit;
      
      const costOfSales = insights.cost_of_sales || insights.cost_of_goods_sold;
      const costOfSalesPriorYear = insights.cost_of_sales_prior_year || priorInsights.cost_of_sales;
      
      // === STAFF COSTS (Detailed breakdown) ===
      // Total staff costs from multiple possible sources
      const totalStaffCosts = financialContext.staff_cost || financialContext.staff_costs || 
                              financialContext.total_staff_costs || insights.total_staff_costs || 
                              insights.staff_costs || insights.employee_costs;
      
      // Staff cost components (from accounts notes)
      const directorsRemuneration = insights.directors_remuneration || insights.directors_fees || 
                                    insights.director_salary || insights.directors_salaries;
      const directorsRemunerationPriorYear = insights.directors_remuneration_prior_year || priorInsights.directors_remuneration;
      
      const staffWages = insights.wages_salaries || insights.staff_wages || insights.wages || 
                         insights.employee_wages;
      const socialSecurityCosts = insights.social_security_costs || insights.national_insurance || 
                                  insights.employer_ni || insights.ni_costs;
      const pensionCosts = insights.pension_costs || insights.pension_contributions || insights.pensions;
      const costOfSalesWages = insights.cost_of_sales_wages || insights.production_wages || 
                               insights.direct_labour;
      
      const employeeCount = financialContext.staff_count || insights.employee_count || 
                            insights.average_employees || insights.staff_count;
      const employeeCountPriorYear = priorYearContext?.staff_count || insights.employee_count_prior_year || 
                                     priorInsights.employee_count;
      
      // === BALANCE SHEET ASSETS ===
      const netAssets = financialContext.net_assets || insights.net_assets || insights.total_equity;
      const totalAssets = financialContext.total_assets || insights.total_assets;
      
      // Fixed assets breakdown
      const fixedAssets = insights.fixed_assets || insights.total_fixed_assets;
      const tangibleAssets = insights.tangible_assets || insights.tangible_fixed_assets;
      const intangibleAssets = insights.intangible_assets || insights.intangible_fixed_assets;
      
      // Property (critical for hidden assets)
      const freeholdProperty = insights.freehold_property || insights.freehold_land_buildings || 
                               insights.land_and_buildings_freehold;
      const leaseholdProperty = insights.leasehold_property || insights.leasehold_improvements;
      
      // Other fixed assets
      const plantAndMachinery = insights.plant_and_machinery || insights.plant_machinery;
      const fixturesAndFittings = insights.fixtures_and_fittings || insights.fixtures_fittings;
      const motorVehicles = insights.motor_vehicles || insights.vehicles;
      const investments = insights.investments || insights.fixed_asset_investments;
      
      // === WORKING CAPITAL ===
      const cash = financialContext.cash_position || insights.cash || insights.cash_at_bank || 
                   insights.bank_balance || insights.cash_and_equivalents;
      const cashPriorYear = priorYearContext?.cash_position || insights.cash_prior_year || priorInsights.cash;
      
      const debtors = insights.debtors || insights.trade_debtors || insights.accounts_receivable || 
                      insights.trade_receivables;
      const debtorsPriorYear = insights.debtors_prior_year || priorInsights.debtors;
      const otherDebtors = insights.other_debtors || insights.other_receivables;
      const prepayments = insights.prepayments || insights.prepayments_and_accrued_income;
      
      const stock = insights.stock || insights.inventory || insights.stocks;
      const stockPriorYear = insights.stock_prior_year || priorInsights.stock;
      
      const creditors = insights.creditors || insights.trade_creditors || insights.accounts_payable || 
                        insights.trade_payables;
      const creditorsPriorYear = insights.creditors_prior_year || priorInsights.creditors;
      const accruals = insights.accruals || insights.accrued_expenses;
      const deferredIncome = insights.deferred_income || insights.deferred_revenue;
      
      // === LIABILITIES ===
      const totalLiabilities = insights.total_liabilities;
      const currentLiabilities = insights.current_liabilities || insights.creditors_due_within_one_year;
      const longTermLiabilities = insights.long_term_liabilities || insights.creditors_due_after_one_year;
      const bankLoans = insights.bank_loans || insights.bank_borrowings;
      const financeLeases = insights.finance_leases || insights.hire_purchase;
      const directorLoans = insights.director_loans || insights.directors_loan_account;
      const taxLiability = insights.tax_liability || insights.corporation_tax;
      const vatLiability = insights.vat_liability || insights.vat_payable;
      
      // === EQUITY ===
      const shareCapital = insights.share_capital || insights.issued_share_capital;
      const calledUpShareCapital = insights.called_up_share_capital;
      const profitAndLossReserve = insights.profit_and_loss_reserve || insights.retained_earnings || 
                                   insights.profit_loss_account;
      const revaluationReserve = insights.revaluation_reserve;
      
      // === RATIOS (if pre-calculated) ===
      const debtorDays = financialContext.debtors_days || insights.debtor_days;
      const creditorDays = financialContext.creditors_days || insights.creditor_days;
      const stockDays = insights.stock_days || insights.inventory_days;
      const currentRatio = insights.current_ratio;
      const quickRatio = insights.quick_ratio || insights.acid_test;
      
      // === DEPRECIATION ===
      const depreciation = insights.depreciation || insights.depreciation_charge;
      const amortisation = insights.amortisation || insights.amortisation_charge;
      
      // Calculate derived values
      const grossMarginPct = financialContext.gross_margin_pct || 
                             (grossProfit && turnover ? (grossProfit / turnover) * 100 : undefined);
      const operatingMarginPct = operatingProfit && turnover ? (operatingProfit / turnover) * 100 : undefined;
      const netMarginPct = financialContext.net_margin_pct || 
                           (netProfit && turnover ? (netProfit / turnover) * 100 : undefined);
      const staffCostsPercentOfRevenue = totalStaffCosts && turnover ? (totalStaffCosts / turnover) * 100 : undefined;
      const turnoverGrowth = turnover && turnoverPriorYear ? 
                             ((turnover - turnoverPriorYear) / turnoverPriorYear) * 100 : 
                             financialContext.revenue_growth_pct;
      const revenuePerEmployee = employeeCount && turnover ? turnover / employeeCount : 
                                 financialContext.revenue_per_head;
      
      if (turnover) {
        extractedFinancials = {
          source: 'client_financial_context',
          
          // Core P&L
          turnover,
          turnoverPriorYear,
          turnoverGrowth,
          grossProfit,
          grossProfitPriorYear,
          grossMarginPct,
          operatingProfit,
          operatingProfitPriorYear,
          operatingMarginPct,
          netProfit,
          netProfitPriorYear,
          netMarginPct,
          ebitda: financialContext.ebitda || insights.ebitda,
          costOfSales,
          costOfSalesPriorYear,
          
          // Staff costs (detailed)
          totalStaffCosts,
          staffCostsPercentOfRevenue,
          directorsRemuneration,
          directorsRemunerationPriorYear,
          staffWages,
          socialSecurityCosts,
          pensionCosts,
          costOfSalesWages,
          employeeCount,
          employeeCountPriorYear,
          revenuePerEmployee,
          
          // Balance sheet assets
          netAssets,
          totalAssets,
          fixedAssets,
          tangibleAssets,
          intangibleAssets,
          freeholdProperty,
          leaseholdProperty,
          plantAndMachinery,
          fixturesAndFittings,
          motorVehicles,
          investments,
          
          // Working capital
          cash,
          cashPriorYear,
          debtors,
          debtorsPriorYear,
          otherDebtors,
          prepayments,
          stock,
          stockPriorYear,
          creditors,
          creditorsPriorYear,
          accruals,
          deferredIncome,
          
          // Liabilities
          totalLiabilities,
          currentLiabilities,
          longTermLiabilities,
          bankLoans,
          financeLeases,
          directorLoans,
          taxLiability,
          vatLiability,
          
          // Equity
          shareCapital,
          calledUpShareCapital,
          profitAndLossReserve,
          revaluationReserve,
          
          // Ratios
          debtorDays,
          creditorDays,
          stockDays,
          currentRatio,
          quickRatio,
          
          // Depreciation
          depreciation,
          amortisation,
        };
        
        // Log what we extracted for debugging
        const extractedFields = Object.entries(extractedFinancials)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, _]) => k);
        
        console.log('[Pass1] ✅ Loaded financials (' + extractedFields.length + ' fields):', { 
          turnover, 
          turnoverPriorYear,
          grossProfit,
          operatingProfit,
          totalStaffCosts,
          directorsRemuneration,
          staffWages,
          socialSecurityCosts,
          pensionCosts,
          employeeCount,
          freeholdProperty,
          cash,
          netAssets,
          stock,
          debtors,
          creditors,
        });
        
        console.log('[Pass1] Available fields:', extractedFields.join(', '));
      }
    }
    
    // ========================================================================
    // RUN 8-DIMENSION COMPREHENSIVE ANALYSIS
    // ========================================================================
    
    const industry = detectIndustry(discoveryResponses, engagement.client?.client_company);
    console.log('[Pass1] Detected industry:', industry);
    
    const comprehensiveAnalysis = performComprehensiveAnalysis(extractedFinancials, discoveryResponses, industry);
    const destinationClarity = calculateDestinationClarity(discoveryResponses);
    
    console.log('[Pass1] Analysis Results:', {
      dataQuality: comprehensiveAnalysis.dataQuality,
      payrollExcess: comprehensiveAnalysis.payroll?.annualExcess,
      hiddenAssets: comprehensiveAnalysis.hiddenAssets?.totalHiddenAssets,
      enterpriseValueRange: comprehensiveAnalysis.valuation ? 
        `£${(comprehensiveAnalysis.valuation.enterpriseValueLow!/1000000).toFixed(1)}M - £${(comprehensiveAnalysis.valuation.enterpriseValueHigh!/1000000).toFixed(1)}M` : 'N/A',
      exitReadiness: comprehensiveAnalysis.exitReadiness?.score,
      achievements: comprehensiveAnalysis.achievements?.achievements.length,
      destinationClarity: destinationClarity.score
    });

    // ========================================================================
    // NEW: RUN STRUCTURED CALCULATIONS WITH PRE-BUILT PHRASES
    // ========================================================================
    
    let structuredOutput: Pass1Output | null = null;
    let pass2PromptInjection: string | null = null;
    
    try {
      const convertedFinancials = convertFinancialsFormat(extractedFinancials);
      
      structuredOutput = runStructuredCalculations(
        engagementId,
        engagement.client_id,
        engagement.client?.full_name || engagement.client?.client_name || 'Unknown',
        engagement.client?.client_company || 'Unknown Company',
        convertedFinancials,
        discoveryResponses
      );
      
      // Build the prompt injection for Pass 2
      pass2PromptInjection = buildPass2PromptInjection(structuredOutput);
      
      console.log('[Pass1] ✅ Structured calculations complete:', {
        dataQuality: structuredOutput.meta.dataQuality,
        payrollPhrase: structuredOutput.payroll?.annualExcess?.phrases?.impact || 'N/A',
        valuationRange: structuredOutput.valuation?.enterpriseValue?.formatted || 'N/A'
      });
    } catch (structuredError: any) {
      console.error('[Pass1] ⚠️ Structured calculations failed (non-fatal):', structuredError.message);
      // Continue with existing flow - structured output is enhancement, not requirement
    }

    // ========================================================================
    // RUN SERVICE SCORING
    // ========================================================================

    const scoringResult = scoreServicesFromDiscovery(discoveryResponses);

    const primaryRecommendations = scoringResult.recommendations
      .filter(r => r.recommended)
      .slice(0, 3);
    
    const secondaryRecommendations = scoringResult.recommendations
      .filter(r => r.recommended)
      .slice(3);

    const processingTime = Date.now() - startTime;

    // ========================================================================
    // SAVE TO DATABASE
    // ========================================================================

    const { data: existingReport } = await supabase
      .from('discovery_reports')
      .select('id')
      .eq('engagement_id', engagementId)
      .single();

    const reportData = {
      engagement_id: engagementId,
      status: 'pass1_complete',
      service_scores: scoringResult.scores,
      detection_patterns: scoringResult.patterns,
      emotional_anchors: scoringResult.emotionalAnchors,
      urgency_multiplier: scoringResult.patterns.urgencyMultiplier,
      change_readiness: discoveryResponses.dd_change_readiness || engagement.discovery?.dd_change_readiness,
      primary_recommendations: primaryRecommendations,
      secondary_recommendations: secondaryRecommendations,
      
      // 8-Dimension Analysis Results
      comprehensive_analysis: comprehensiveAnalysis,
      destination_clarity: destinationClarity,
      detected_industry: industry,
      
      // Raw extracted financials (for debugging and future use)
      extracted_financials: extractedFinancials,
      
      // Pre-calculated values for Pass 2 injection
      page4_numbers: {
        payrollAnalysis: comprehensiveAnalysis.payroll ? {
          turnover: comprehensiveAnalysis.payroll.turnover,
          staffCosts: comprehensiveAnalysis.payroll.staffCosts,
          staffCostsPct: comprehensiveAnalysis.payroll.staffCostsPct,
          benchmarkPct: comprehensiveAnalysis.payroll.benchmark.good,
          excessPct: comprehensiveAnalysis.payroll.excessPercentage,
          annualExcess: comprehensiveAnalysis.payroll.annualExcess,
          calculation: comprehensiveAnalysis.payroll.calculation,
          assessment: comprehensiveAnalysis.payroll.assessment
        } : null,
        
        // NEW: Detailed staff cost breakdown
        staffCostBreakdown: {
          directorsRemuneration: extractedFinancials.directorsRemuneration,
          staffWages: extractedFinancials.staffWages,
          socialSecurityCosts: extractedFinancials.socialSecurityCosts,
          pensionCosts: extractedFinancials.pensionCosts,
          costOfSalesWages: extractedFinancials.costOfSalesWages,
          totalStaffCosts: extractedFinancials.totalStaffCosts,
          employeeCount: extractedFinancials.employeeCount
        },
        
        valuationAnalysis: comprehensiveAnalysis.valuation ? {
          operatingProfit: comprehensiveAnalysis.valuation.operatingProfit,
          multipleLow: comprehensiveAnalysis.valuation.adjustedMultipleLow,
          multipleHigh: comprehensiveAnalysis.valuation.adjustedMultipleHigh,
          earningsValueLow: comprehensiveAnalysis.valuation.conservativeValue,
          earningsValueHigh: comprehensiveAnalysis.valuation.optimisticValue,
          hiddenAssetsTotal: comprehensiveAnalysis.valuation.totalHiddenAssetsValue,
          enterpriseValueLow: comprehensiveAnalysis.valuation.enterpriseValueLow,
          enterpriseValueHigh: comprehensiveAnalysis.valuation.enterpriseValueHigh,
          adjustments: comprehensiveAnalysis.valuation.adjustments
        } : null,
        
        hiddenAssets: comprehensiveAnalysis.hiddenAssets,
        grossMargin: comprehensiveAnalysis.grossMargin,
        trajectoryAnalysis: comprehensiveAnalysis.trajectory,
        productivityAnalysis: comprehensiveAnalysis.productivity,
        workingCapitalAnalysis: comprehensiveAnalysis.workingCapital,
        
        exitReadiness: comprehensiveAnalysis.exitReadiness ? {
          score: comprehensiveAnalysis.exitReadiness.score,
          maxScore: comprehensiveAnalysis.exitReadiness.maxScore,
          percentage: Math.round(comprehensiveAnalysis.exitReadiness.score / comprehensiveAnalysis.exitReadiness.maxScore * 100),
          strengths: comprehensiveAnalysis.exitReadiness.strengths,
          blockers: comprehensiveAnalysis.exitReadiness.blockers
        } : null,
        
        costOfInaction: comprehensiveAnalysis.costOfInaction,
        achievements: comprehensiveAnalysis.achievements,
        
        // NEW: Key YoY comparisons
        yearOnYearComparisons: {
          turnover: {
            current: extractedFinancials.turnover,
            prior: extractedFinancials.turnoverPriorYear,
            change: extractedFinancials.turnover && extractedFinancials.turnoverPriorYear ? 
              extractedFinancials.turnover - extractedFinancials.turnoverPriorYear : null,
            changePct: extractedFinancials.turnoverGrowth
          },
          operatingProfit: {
            current: extractedFinancials.operatingProfit,
            prior: extractedFinancials.operatingProfitPriorYear,
            change: extractedFinancials.operatingProfit && extractedFinancials.operatingProfitPriorYear ?
              extractedFinancials.operatingProfit - extractedFinancials.operatingProfitPriorYear : null
          },
          cash: {
            current: extractedFinancials.cash,
            prior: extractedFinancials.cashPriorYear,
            change: extractedFinancials.cash && extractedFinancials.cashPriorYear ?
              extractedFinancials.cash - extractedFinancials.cashPriorYear : null
          }
        }
      },
      
      processing_metadata: {
        pass1CompletedAt: new Date().toISOString(),
        processingTimeMs: processingTime,
        financialDataSource: extractedFinancials.source,
        analysisVersion: '3.0-structured-phrases'
      },
      
      // NEW: Structured output with pre-built phrases
      structured_output: structuredOutput,
      
      // NEW: Pre-built prompt injection for Pass 2
      pass2_prompt_injection: pass2PromptInjection,
      
      // NEW: Flattened phrase lookup for easy Pass 2 access
      prebuilt_phrases: structuredOutput ? {
        payroll: {
          headline: structuredOutput.payroll?.annualExcess?.phrases?.headline || null,
          impact: structuredOutput.payroll?.annualExcess?.phrases?.impact || null,
          monthly: structuredOutput.payroll?.monthlyExcess?.phrases?.impact || null,
          twoYear: structuredOutput.payroll?.twoYearExcess?.phrases?.impact || null,
          comparison: structuredOutput.payroll?.staffCostsPercent?.phrases?.comparison || null,
          action: structuredOutput.payroll?.staffCostsPercent?.phrases?.actionRequired || null,
          isOverstaffed: structuredOutput.payroll?.summary?.isOverstaffed || false
        },
        valuation: {
          headline: structuredOutput.valuation?.enterpriseValue?.phrases?.headline || null,
          range: structuredOutput.valuation?.enterpriseValue?.formatted || null,
          multiple: structuredOutput.valuation?.multipleRange?.phrases?.headline || null
        },
        trajectory: {
          headline: structuredOutput.trajectory?.revenueGrowthYoY?.phrases?.headline || null,
          impact: structuredOutput.trajectory?.revenueGrowthYoY?.phrases?.impact || null,
          trend: structuredOutput.trajectory?.trend?.classification || null
        },
        costOfInaction: {
          headline: structuredOutput.costOfInaction?.totalCostOfInaction?.phrases?.headline || null,
          breakdown: structuredOutput.costOfInaction?.totalCostOfInaction?.phrases?.breakdown || null,
          urgency: structuredOutput.costOfInaction?.totalCostOfInaction?.phrases?.urgency || null
        },
        exitReadiness: {
          headline: structuredOutput.exitReadiness?.overallScore?.phrases?.headline || null,
          summary: structuredOutput.exitReadiness?.phrases?.summary || null,
          topStrength: structuredOutput.exitReadiness?.phrases?.topStrength || null,
          topBlocker: structuredOutput.exitReadiness?.phrases?.topBlocker || null
        },
        closing: {
          openingLine: structuredOutput.narrativeBlocks?.executiveSummary?.openingLine || null,
          situationStatement: structuredOutput.narrativeBlocks?.executiveSummary?.situationStatement || null,
          theAsk: structuredOutput.narrativeBlocks?.closingPhrases?.theAsk || null,
          urgencyAnchor: structuredOutput.narrativeBlocks?.closingPhrases?.urgencyAnchor || null,
          neverHadBreak: structuredOutput.narrativeBlocks?.closingPhrases?.neverHadBreak || null
        }
      } : null
    };

    if (existingReport) {
      await supabase
        .from('discovery_reports')
        .update(reportData)
        .eq('id', existingReport.id);
    } else {
      await supabase
        .from('discovery_reports')
        .insert(reportData);
    }

    console.log('[Pass1] ✅ Complete in', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        status: 'pass1_complete',
        industry,
        dataQuality: comprehensiveAnalysis.dataQuality,
        destinationClarity: destinationClarity.score,
        payrollExcess: comprehensiveAnalysis.payroll?.annualExcess || 0,
        hiddenAssets: comprehensiveAnalysis.hiddenAssets?.totalHiddenAssets || 0,
        enterpriseValueRange: comprehensiveAnalysis.valuation?.enterpriseValueLow && comprehensiveAnalysis.valuation?.enterpriseValueHigh ?
          `£${(comprehensiveAnalysis.valuation.enterpriseValueLow/1000000).toFixed(1)}M - £${(comprehensiveAnalysis.valuation.enterpriseValueHigh/1000000).toFixed(1)}M` : null,
        exitReadiness: comprehensiveAnalysis.exitReadiness?.score || null,
        achievements: comprehensiveAnalysis.achievements?.achievements.length || 0,
        processingTimeMs: processingTime,
        primaryServices: primaryRecommendations.map(r => r.code)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Pass1] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
