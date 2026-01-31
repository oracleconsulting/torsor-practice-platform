import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// TYPE DEFINITIONS FOR FINANCIAL ANALYSIS
// =============================================================================

interface YearlyFinancials {
  fiscal_year: number;
  revenue: number | null;
  gross_profit: number | null;
  gross_margin: number | null;
  operating_profit: number | null;
  operating_margin: number | null;
  net_profit: number | null;
  net_margin: number | null;
  cash: number | null;
  net_assets: number | null;
  debtors: number | null;
  creditors: number | null;
  employee_count: number | null;
}

interface BalanceSheet {
  cash: number | null;
  net_assets: number | null;
  total_assets: number | null;
  current_assets: number | null;
  current_liabilities: number | null;
  debtors: number | null;
  creditors: number | null;
  stock: number | null;
  fixed_assets: number | null;
  investments: number | null;
  freehold_property: number | null;
}

interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'stable' | 'declining' | 'volatile';
  currentValue: number;
  priorValue: number;
  change: number;
  changePercent: number;
  isRecovering: boolean;
  narrative: string;
}

interface InvestmentSignals {
  likelyInvestmentYear: boolean;
  indicators: string[];
  confidence: 'high' | 'medium' | 'low';
  priorYearWasTrough: boolean;
}

interface SurplusCashAnalysis {
  hasData: boolean;
  actualCash: number | null;
  requiredCash: number | null;
  surplusCash: number | null;
  surplusAsPercentOfRevenue: number | null;
  components: {
    operatingBuffer: number | null;
    workingCapitalRequirement: number | null;
    staffCostsQuarterly: number | null;
    adminExpensesQuarterly: number | null;
    debtors: number | null;
    creditors: number | null;
    stock: number | null;
    netWorkingCapital: number | null;
  };
  methodology: string;
  narrative: string;
  confidence: 'high' | 'medium' | 'low';
  missingFields: string[];
}

// =============================================================================
// SURPLUS CASH CALCULATION
// =============================================================================

function calculateSurplusCash(financials: Record<string, any>, revenue: number | null): SurplusCashAnalysis {
  const missingFields: string[] = [];
  
  // Extract values with multiple field name variations
  const actualCash = financials.cash || financials.cash_at_bank || financials.cash_at_bank_and_in_hand || null;
  const staffCosts = financials.staff_costs || financials.total_staff_costs || financials.wages_and_salaries || null;
  const adminExpenses = financials.admin_expenses || financials.administrative_expenses || financials.other_operating_charges || null;
  const debtors = financials.debtors || financials.trade_debtors || financials.debtors_due_within_one_year || null;
  const creditors = financials.creditors || financials.trade_creditors || 
                    financials.amounts_falling_due_within_one_year || financials.current_liabilities || null;
  const stock = financials.stock || financials.stocks || financials.inventory || 0;
  
  // Track missing fields
  if (!actualCash) missingFields.push('cash');
  if (!staffCosts) missingFields.push('staffCosts');
  if (!adminExpenses) missingFields.push('adminExpenses');
  if (!debtors) missingFields.push('debtors');
  if (!creditors) missingFields.push('creditors');
  
  // If we don't have cash, we can't calculate anything
  if (!actualCash) {
    return {
      hasData: false,
      actualCash: null,
      requiredCash: null,
      surplusCash: null,
      surplusAsPercentOfRevenue: null,
      components: {
        operatingBuffer: null,
        workingCapitalRequirement: null,
        staffCostsQuarterly: null,
        adminExpensesQuarterly: null,
        debtors: null,
        creditors: null,
        stock: null,
        netWorkingCapital: null
      },
      methodology: 'Unable to calculate - missing cash position',
      narrative: 'Insufficient data to calculate surplus cash position.',
      confidence: 'low',
      missingFields
    };
  }
  
  // Calculate operating buffer (3 months fixed costs)
  let operatingBuffer: number | null = null;
  let staffCostsQuarterly: number | null = null;
  let adminExpensesQuarterly: number | null = null;
  
  if (staffCosts && adminExpenses) {
    staffCostsQuarterly = staffCosts / 4;
    adminExpensesQuarterly = adminExpenses / 4;
    operatingBuffer = staffCostsQuarterly + adminExpensesQuarterly;
  } else if (staffCosts) {
    // If we only have staff costs, use 1.5x as proxy for total fixed costs
    staffCostsQuarterly = staffCosts / 4;
    operatingBuffer = staffCostsQuarterly * 1.5;
  } else if (revenue) {
    // Fallback: assume fixed costs are ~25% of revenue for service businesses
    operatingBuffer = (revenue * 0.25) / 4;
  }
  
  // Calculate working capital requirement
  let netWorkingCapital: number | null = null;
  let workingCapitalRequirement: number | null = null;
  
  if (debtors !== null && creditors !== null) {
    netWorkingCapital = (debtors || 0) + (stock || 0) - (creditors || 0);
    workingCapitalRequirement = Math.max(0, netWorkingCapital);
  }
  
  // Calculate required cash
  let requiredCash: number | null = null;
  if (operatingBuffer !== null) {
    requiredCash = operatingBuffer + (workingCapitalRequirement || 0);
  }
  
  // Calculate surplus
  let surplusCash: number | null = null;
  if (requiredCash !== null) {
    surplusCash = Math.max(0, actualCash - requiredCash);
  }
  
  // Calculate as percentage of revenue
  let surplusAsPercentOfRevenue: number | null = null;
  if (surplusCash !== null && revenue) {
    surplusAsPercentOfRevenue = (surplusCash / revenue) * 100;
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (missingFields.length === 0) {
    confidence = 'high';
  } else if (missingFields.length <= 2 && actualCash && (staffCosts || revenue)) {
    confidence = 'medium';
  }
  
  // Build methodology explanation
  const methodology = `Operating buffer = 3 months fixed costs (${staffCosts && adminExpenses ? 'staff + admin' : staffCosts ? 'estimated from staff costs' : 'estimated from revenue'}). ` +
    `Working capital requirement = MAX(0, debtors + stock - creditors)${netWorkingCapital && netWorkingCapital < 0 ? ' — negative means suppliers fund the business' : ''}.`;
  
  // Build narrative
  let narrative = '';
  if (surplusCash && surplusCash > 100000) {
    const surplusFormatted = surplusCash >= 1000000 
      ? `£${(surplusCash / 1000000).toFixed(1)}M` 
      : `£${(surplusCash / 1000).toFixed(0)}k`;
    
    narrative = `Surplus cash of ${surplusFormatted} identified above operating requirements. `;
    
    if (netWorkingCapital && netWorkingCapital < 0) {
      narrative += `Supplier payment terms provide additional £${(Math.abs(netWorkingCapital) / 1000).toFixed(0)}k of free working capital. `;
    }
    
    if (surplusAsPercentOfRevenue) {
      narrative += `This represents ${surplusAsPercentOfRevenue.toFixed(1)}% of annual revenue.`;
    }
  } else if (surplusCash !== null) {
    narrative = 'Cash position is in line with operating requirements — no material surplus identified.';
  } else {
    narrative = 'Unable to calculate surplus cash from available data.';
  }
  
  return {
    hasData: surplusCash !== null,
    actualCash,
    requiredCash,
    surplusCash,
    surplusAsPercentOfRevenue,
    components: {
      operatingBuffer,
      workingCapitalRequirement,
      staffCostsQuarterly,
      adminExpensesQuarterly,
      debtors,
      creditors,
      stock,
      netWorkingCapital
    },
    methodology,
    narrative,
    confidence,
    missingFields
  };
}

// =============================================================================
// TREND ANALYSIS FUNCTIONS
// =============================================================================

function analyseFinancialTrends(
  current: Record<string, any>,
  historical: YearlyFinancials[]
): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];
  
  if (!historical || historical.length === 0) return trends;
  
  // Gross margin trend
  const currentGM = current.gross_margin;
  const priorYears = historical.filter(h => h.gross_margin !== null);
  
  if (currentGM != null && priorYears.length >= 1) {
    const priorGM = priorYears[0].gross_margin!;
    const change = currentGM - priorGM;
    const twoYearsAgoGM = priorYears[1]?.gross_margin;
    
    // Check if recovering from a trough
    const isRecovering = twoYearsAgoGM != null && 
                         priorGM < twoYearsAgoGM && 
                         currentGM > priorGM;
    
    let direction: 'improving' | 'stable' | 'declining' | 'volatile';
    if (Math.abs(change) < 1) direction = 'stable';
    else if (change > 0) direction = 'improving';
    else direction = 'declining';
    
    let narrative = '';
    if (isRecovering) {
      narrative = `Gross margin RECOVERING: ${priorGM.toFixed(1)}% → ${currentGM.toFixed(1)}% (was ${twoYearsAgoGM!.toFixed(1)}% before trough). This is positive trajectory.`;
    } else if (direction === 'improving') {
      narrative = `Gross margin improving: ${priorGM.toFixed(1)}% → ${currentGM.toFixed(1)}% (+${change.toFixed(1)}pp)`;
    } else if (direction === 'declining') {
      narrative = `Gross margin declining: ${priorGM.toFixed(1)}% → ${currentGM.toFixed(1)}% (${change.toFixed(1)}pp)`;
    } else {
      narrative = `Gross margin stable at ${currentGM.toFixed(1)}%`;
    }
    
    trends.push({
      metric: 'gross_margin',
      direction: isRecovering ? 'improving' : direction,
      currentValue: currentGM,
      priorValue: priorGM,
      change,
      changePercent: priorGM !== 0 ? (change / priorGM) * 100 : 0,
      isRecovering,
      narrative
    });
  }
  
  // Revenue trend
  const currentRevenue = current._enriched_revenue;
  const priorRevenueYears = historical.filter(h => h.revenue !== null);
  
  if (currentRevenue && priorRevenueYears.length >= 1) {
    const priorRevenue = priorRevenueYears[0].revenue!;
    const change = currentRevenue - priorRevenue;
    const changePercent = priorRevenue !== 0 ? (change / priorRevenue) * 100 : 0;
    
    let direction: 'improving' | 'stable' | 'declining' | 'volatile';
    if (Math.abs(changePercent) < 3) direction = 'stable';
    else if (changePercent > 0) direction = 'improving';
    else direction = 'declining';
    
    let narrative = '';
    if (direction === 'improving') {
      narrative = `Revenue grew: £${(priorRevenue / 1000000).toFixed(1)}M → £${(currentRevenue / 1000000).toFixed(1)}M (+${changePercent.toFixed(1)}%)`;
    } else if (direction === 'declining') {
      narrative = `Revenue declined: £${(priorRevenue / 1000000).toFixed(1)}M → £${(currentRevenue / 1000000).toFixed(1)}M (${changePercent.toFixed(1)}%)`;
    } else {
      narrative = `Revenue stable at £${(currentRevenue / 1000000).toFixed(1)}M`;
    }
    
    trends.push({
      metric: 'revenue',
      direction,
      currentValue: currentRevenue,
      priorValue: priorRevenue,
      change,
      changePercent,
      isRecovering: false,
      narrative
    });
  }
  
  // Net margin trend
  const currentNM = current.net_margin;
  const priorNetMarginYears = historical.filter(h => h.net_margin !== null);
  
  if (currentNM != null && priorNetMarginYears.length >= 1) {
    const priorNM = priorNetMarginYears[0].net_margin!;
    const change = currentNM - priorNM;
    const twoYearsAgoNM = priorNetMarginYears[1]?.net_margin;
    
    const isRecovering = twoYearsAgoNM != null && 
                         priorNM < twoYearsAgoNM && 
                         currentNM > priorNM;
    
    let direction: 'improving' | 'stable' | 'declining' | 'volatile';
    if (Math.abs(change) < 1) direction = 'stable';
    else if (change > 0) direction = 'improving';
    else direction = 'declining';
    
    let narrative = '';
    if (isRecovering) {
      narrative = `Net margin RECOVERING: ${priorNM.toFixed(1)}% → ${currentNM.toFixed(1)}% (bouncing back from investment trough)`;
    } else if (direction === 'improving') {
      narrative = `Net margin improving: ${priorNM.toFixed(1)}% → ${currentNM.toFixed(1)}%`;
    } else if (direction === 'declining') {
      narrative = `Net margin declining: ${priorNM.toFixed(1)}% → ${currentNM.toFixed(1)}%`;
    } else {
      narrative = `Net margin stable at ${currentNM.toFixed(1)}%`;
    }
    
    trends.push({
      metric: 'net_margin',
      direction: isRecovering ? 'improving' : direction,
      currentValue: currentNM,
      priorValue: priorNM,
      change,
      changePercent: priorNM !== 0 ? (change / priorNM) * 100 : 0,
      isRecovering,
      narrative
    });
  }
  
  return trends;
}

// =============================================================================
// INVESTMENT PATTERN DETECTION
// =============================================================================

function detectInvestmentPattern(
  current: Record<string, any>,
  historical: YearlyFinancials[],
  assessmentResponses: Record<string, any>
): InvestmentSignals {
  const indicators: string[] = [];
  let investmentScore = 0;
  let priorYearWasTrough = false;
  
  if (historical && historical.length >= 1) {
    const priorYear = historical[0];
    
    // Pattern 1: Revenue up + margin down = investment signature
    if (current._enriched_revenue && priorYear.revenue && 
        current._enriched_revenue > priorYear.revenue && 
        current.gross_margin != null && priorYear.gross_margin != null &&
        current.gross_margin < priorYear.gross_margin) {
      indicators.push('Revenue grew while margin compressed (classic investment pattern)');
      investmentScore += 2;
    }
    
    // Pattern 2: Margin recovering from prior year trough
    if (historical.length >= 2 && 
        current.gross_margin != null && 
        priorYear.gross_margin != null && 
        historical[1].gross_margin != null) {
      
      if (current.gross_margin > priorYear.gross_margin && 
          priorYear.gross_margin < historical[1].gross_margin) {
        indicators.push(`Margin recovering from ${priorYear.fiscal_year} trough: ${priorYear.gross_margin.toFixed(1)}% → ${current.gross_margin.toFixed(1)}%`);
        investmentScore += 3;
        priorYearWasTrough = true;
      }
    }
    
    // Pattern 3: Revenue grew significantly in trough year (investment drove costs)
    if (historical.length >= 2 && priorYear.revenue && historical[1].revenue) {
      const troughYearGrowth = ((priorYear.revenue - historical[1].revenue) / historical[1].revenue) * 100;
      if (troughYearGrowth > 15 && priorYear.gross_margin != null && 
          historical[1].gross_margin != null &&
          priorYear.gross_margin < historical[1].gross_margin) {
        indicators.push(`High growth year (${troughYearGrowth.toFixed(0)}%) with compressed margins suggests capacity building`);
        investmentScore += 2;
      }
    }
  }
  
  // Check assessment responses for investment language
  const suspectedIssue = assessmentResponses?.['bm suspected underperformance'] || 
                         assessmentResponses?.['bm_suspected_underperformance'] || '';
  const leavingMoney = assessmentResponses?.['bm leaving money'] || 
                       assessmentResponses?.['bm_leaving_money'] || '';
  const businessDesc = assessmentResponses?.['bm business description'] || 
                       assessmentResponses?.['bm_business_description'] || '';
  const combinedText = `${suspectedIssue} ${leavingMoney} ${businessDesc}`.toLowerCase();
  
  if (/invest|growth|building|capability|scaling|expansion|infrastructure/.test(combinedText)) {
    indicators.push('Client mentions investment/growth/building in assessment');
    investmentScore += 1;
  }
  
  // Check for new assessment questions about investment context
  const recentInvestment = assessmentResponses?.['bm recent investment'] || 
                           assessmentResponses?.['bm_recent_investment'];
  const marginContext = assessmentResponses?.['bm margin context'] || 
                        assessmentResponses?.['bm_margin_context'];
  
  if (recentInvestment && !recentInvestment.includes('None')) {
    indicators.push(`Client confirmed investment in: ${recentInvestment}`);
    investmentScore += 2;
  }
  
  if (marginContext === 'Planned investment in growth') {
    indicators.push('Client explicitly states margins reflect planned investment');
    investmentScore += 3;
  }
  
  return {
    likelyInvestmentYear: investmentScore >= 2,
    indicators,
    confidence: investmentScore >= 4 ? 'high' : investmentScore >= 2 ? 'medium' : 'low',
    priorYearWasTrough
  };
}

// =============================================================================
// PASS 1: EXTRACTION & ANALYSIS (Sonnet)
// Compares client metrics to industry benchmarks
// Calculates percentile positions and annual £ impact
// Saves to bm_reports with status 'pass1_complete'
// Triggers Pass 2 automatically
// =============================================================================

function buildPass1Prompt(
  assessment: any,
  benchmarks: any[],
  maData: any | null,
  hvaContextSection: string,
  clientName: string,
  industry: any
): string {
  // Format benchmarks for prompt
  const benchmarkDetails = benchmarks.map(b => {
    const metric = b.benchmark_metrics;
    return `
${metric?.name || b.metric_code} (${b.metric_code}):
  - P25: ${b.p25 ?? 'N/A'}
  - P50 (Median): ${b.p50 ?? 'N/A'}
  - P75: ${b.p75 ?? 'N/A'}
  - Sample: ${b.sample_size ?? 'Unknown'} businesses
  - Source: ${b.data_source || 'Unknown'}
`;
  }).join('\n');

  // Extract HVA (Hidden Value Audit) metrics - ALL clients have this
  // Note: Rich HVA context is now provided in hvaContextSection parameter
  const hvaMetricsText = hvaContextSection ? 'See HVA Context section below for detailed analysis.' : 'No HVA data available (unexpected - all clients should have this).';

  // Extract MA metrics if available
  const maMetricsText = maData ? `
FINANCIAL METRICS FROM MANAGEMENT ACCOUNTS:
- Revenue: £${maData.revenue?.toLocaleString() || 'N/A'}
- Gross Profit: £${maData.gross_profit?.toLocaleString() || 'N/A'} (${((maData.gross_profit / maData.revenue) * 100).toFixed(1)}%)
- Net Profit: £${maData.net_profit?.toLocaleString() || 'N/A'} (${((maData.net_profit / maData.revenue) * 100).toFixed(1)}%)
- Revenue per Employee: £${maData.revenue_per_employee?.toLocaleString() || 'N/A'}
- Debtor Days: ${maData.debtor_days || 'N/A'}
- Creditor Days: ${maData.creditor_days || 'N/A'}
` : 'No Management Accounts data available.';

  // Show enriched/derived metrics
  const enrichedMetricsText = assessment.derived_fields && assessment.derived_fields.length > 0 ? `
DERIVED METRICS (Calculated from available data):
${assessment.revenue_per_employee ? `- Revenue per Employee: £${assessment.revenue_per_employee.toLocaleString()} (calculated from revenue ÷ employees)` : ''}
${assessment.gross_margin ? `- Gross Margin: ${assessment.gross_margin}% (calculated from gross profit ÷ revenue)` : ''}
${assessment.net_margin ? `- Net Margin: ${assessment.net_margin}% (calculated from net profit ÷ revenue)` : ''}
${assessment.client_concentration_top3 ? `- Client Concentration (Top 3): ${assessment.client_concentration_top3}%` : ''}
${assessment._enriched_revenue ? `- Revenue: £${assessment._enriched_revenue.toLocaleString()} (extracted from assessment)` : ''}
${assessment._enriched_employee_count ? `- Employee Count: ${assessment._enriched_employee_count} (extracted from assessment)` : ''}

SUPPLEMENTARY METRICS (Collected during practitioner conversations):
${assessment.utilisation_rate ? `- Utilisation Rate: ${assessment.utilisation_rate}% (billable time as % of total)` : ''}
${assessment.hourly_rate ? `- Average Hourly Rate: £${assessment.hourly_rate}/hr (blended across all staff)` : ''}
${assessment.project_margin ? `- Project Margins: ${assessment.project_margin}% (gross margin on projects)` : ''}
${assessment.ebitda_margin ? `- EBITDA Margin: ${assessment.ebitda_margin}%` : ''}
${assessment.debtor_days ? `- Debtor Days: ${assessment.debtor_days} days` : ''}
${assessment.revenue_growth ? `- Revenue Growth: ${assessment.revenue_growth}% YoY` : ''}
` : '';

  // ==========================================================================
  // BALANCE SHEET CONTEXT (Critical for understanding financial health)
  // ==========================================================================
  
  // Build balance sheet summary (concise)
  const bsItems: string[] = [];
  if (assessment.balance_sheet?.cash) bsItems.push(`Cash: £${(assessment.balance_sheet.cash / 1000000).toFixed(1)}M`);
  if (assessment.balance_sheet?.net_assets) bsItems.push(`Net Assets: £${(assessment.balance_sheet.net_assets / 1000000).toFixed(1)}M`);
  if (assessment.cash_months) bsItems.push(`${assessment.cash_months}mo runway`);
  
  const balanceSheetText = bsItems.length > 0 ? `
BALANCE SHEET: ${bsItems.join(' | ')}
${assessment.cash_months && assessment.cash_months >= 2 ? '→ Strong cash = financially resilient' : ''}
` : '';

  // Build trend summary (concise - only include if recovering or investing)
  const trendSummary: string[] = [];
  if (assessment.financial_trends) {
    const gmTrend = assessment.financial_trends.find((t: TrendAnalysis) => t.metric === 'gross_margin');
    if (gmTrend?.isRecovering) {
      trendSummary.push(`⚠️ MARGIN RECOVERING: ${gmTrend.narrative}`);
    }
  }
  if (assessment.investment_signals?.likelyInvestmentYear) {
    trendSummary.push(`⚠️ INVESTMENT PATTERN (${assessment.investment_signals.confidence}): ${assessment.investment_signals.indicators[0] || 'Recovery from investment'}`);
  }
  
  const trendsText = trendSummary.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL CONTEXT - DO NOT IGNORE
═══════════════════════════════════════════════════════════════════════════════
${trendSummary.join('\n')}

RULE: If margin is RECOVERING, do NOT flag as "crisis" or "insolvent risk".
Instead: "Margins recovering strongly from investment period"
` : '';

  // Historical data - just show the trend, not all years
  const historicalText = assessment.historical_financials && assessment.historical_financials.length > 0 ? `
HISTORICAL: ${assessment.historical_financials.map((h: YearlyFinancials) => 
  `FY${h.fiscal_year}: ${h.gross_margin?.toFixed(1) || '?'}% GM`
).join(' → ')}
` : '';

  return `
You are a financial analyst preparing a benchmarking report for a UK business.

═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

BUSINESS: ${clientName}
INDUSTRY: ${industry?.name || assessment.industry_code} (${assessment.industry_code})
REVENUE BAND: ${assessment.revenue_band}
EMPLOYEES: ${assessment.employee_count}
LOCATION: ${assessment.location_type}

THEIR DESCRIPTION:
"${assessment.business_description}"

═══════════════════════════════════════════════════════════════════════════════
THEIR ASSESSMENT RESPONSES
═══════════════════════════════════════════════════════════════════════════════

PERFORMANCE PERCEPTION: ${assessment.performance_perception}
METRICS THEY TRACK: ${(assessment.current_tracking || []).join(', ')}
CURRENT COMPARISON METHOD: "${assessment.comparison_method}"

SUSPECTED UNDERPERFORMANCE: "${assessment.suspected_underperformance}"
WHERE THEY'RE LEAVING MONEY: "${assessment.leaving_money}"
TOP QUARTILE AMBITIONS: ${(assessment.top_quartile_ambition || []).join(', ')}
COMPETITOR ENVY: "${assessment.competitor_envy || 'Not specified'}"

MAGIC FIX: "${assessment.benchmark_magic_fix}"
ACTION READINESS: ${assessment.action_readiness}
BLIND SPOT FEAR: "${assessment.blind_spot_fear || 'Not specified'}"

═══════════════════════════════════════════════════════════════════════════════
HIDDEN VALUE AUDIT DATA (Standard metrics for all clients)
═══════════════════════════════════════════════════════════════════════════════

${hvaMetricsText || 'HVA data will be provided in context section below'}

═══════════════════════════════════════════════════════════════════════════════
CLIENT'S ACTUAL METRICS (from MA data if available)
═══════════════════════════════════════════════════════════════════════════════

${maMetricsText}

${enrichedMetricsText}

${balanceSheetText}

${trendsText}

${historicalText}

═══════════════════════════════════════════════════════════════════════════════
INDUSTRY BENCHMARKS
═══════════════════════════════════════════════════════════════════════════════

${benchmarkDetails}

${hvaContextSection}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Analyze this client against the benchmarks and produce a structured JSON output.

RULES:
1. Compare EVERY available metric (including derived/calculated metrics shown above)
2. Calculate percentile position for each (where client value falls between p25/p50/p75)
3. Quantify the annual £ impact of gaps - BUT READ THE DOUBLE-COUNTING RULES BELOW
4. Use their EXACT WORDS when referencing their concerns
5. Generate actionable admin guidance
6. Flag any data gaps that need collection

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: DO NOT DOUBLE-COUNT OPPORTUNITIES
═══════════════════════════════════════════════════════════════════════════════

Revenue per employee is an OUTCOME METRIC - it improves WHEN you fix utilisation, rates, or margins.
It is NOT a separate lever you can pull.

WRONG (double counting):
- Utilisation gap: £184,000
- Rate increase: £82,000  
- Revenue per employee gap: £410,000
- TOTAL: £676,000 ❌ This is fantasy

RIGHT (realistic):
- Utilisation gap: £184,000 (this is the PRIMARY lever)
- Rate increase: £82,000 (independent lever)
- TOTAL REALISTIC OPPORTUNITY: £266,000 ✓

HIERARCHY OF METRICS:
1. INPUT LEVERS (count these): Utilisation rate, Hourly rates, Project margins
2. OUTCOME METRICS (DO NOT add to total): Revenue per employee (this is the RESULT)

REALISTIC OPPORTUNITY CALCULATION:
- Pick the 2-3 most actionable INPUT levers
- Calculate their individual impact on revenue
- Be conservative - assume 50-70% of theoretical gap is capturable
- The totalAnnualOpportunity should be 15-40% of current revenue MAX for most firms
- If your total exceeds 50% of current revenue, you've almost certainly double-counted

PRESENT HONESTLY:
- "Improving utilisation to median could add £X"
- "This would bring revenue per employee closer to the £145K median"
- NOT "£410K from revenue per employee PLUS £184K from utilisation"

The client isn't stupid. Telling a £750K business they're leaving £700K on the table sounds like nonsense.

═══════════════════════════════════════════════════════════════════════════════
MINIMUM VIABLE ANALYSIS RULES - CRITICAL
═══════════════════════════════════════════════════════════════════════════════

You MUST produce quantified analysis if ANY of these conditions are met:

### Condition 1: Revenue + Headcount Available
If you have:
- Revenue (from any source: assessment, MA data, or derived)
- Employee count (from any source)

Then you MUST calculate:
- Revenue per employee = revenue ÷ employees (if not already provided)
- Compare to benchmark median
- Calculate gap: (benchmark_median - client_value) × employees = annual opportunity
- NEVER return £0 opportunity when revenue and headcount are available

### Condition 2: Revenue + Any Margin Available
If you have:
- Revenue
- Gross margin OR net margin (as % or absolute)

Then you MUST:
- Calculate margin % if given absolutes
- Compare to benchmark median
- Calculate gap: revenue × (benchmark_margin - client_margin) = annual opportunity

### Condition 3: Client Concentration Available
If you have:
- Top 3 customer % (from HVA: top3_customer_revenue_percentage or derived)

Then you MUST:
- Compare to benchmark median
- Assess concentration risk
- Note in narrative

### NEVER RETURN £0 OPPORTUNITY WHEN:
- Revenue data exists (derive what you can)
- At least 2 data points are available
- HVA provides supplementary metrics

### ALWAYS ACKNOWLEDGE LIMITATIONS:
If data is partial, clearly state:
- Which metrics were calculated vs. provided
- Which metrics could not be assessed
- What additional data would enable fuller analysis

Example GOOD analysis (honest, actionable):
"Your utilisation rate of 57% is 14 points below the 71% industry median. 
Improving to median would add approximately £130,000-£180,000 in billable 
capacity - if you have the work to fill it. Combined with a modest rate 
increase (£85 to £95/hr), the realistic opportunity is £200,000-£250,000 
annually. This would bring your revenue per employee from £93,750 closer 
to the £120,000 mark - not quite median, but a solid improvement."

Example BAD analysis (double-counted nonsense):
"Revenue per employee gap: £410,000. Plus utilisation gap: £184,000. 
Plus rate gap: £82,000. Total: £676,000!" 
❌ This is absurd - you've told a £750K business to nearly double.

THE SMELL TEST: If your total opportunity exceeds 40% of current revenue, 
you've probably made an error. Re-check for double counting.

OUTPUT FORMAT (JSON):
{
  "classification": {
    "industryCode": "${assessment.industry_code}",
    "industryConfidence": number,
    "revenueBand": "${assessment.revenue_band}",
    "employeeBand": "calculated_from_employee_count"
  },
  
  "metricsComparison": [
    {
      "metricCode": "string",
      "metricName": "string",
      "clientValue": number | null,
      "clientValueSource": "ma_data" | "assessment" | "calculated" | "missing",
      "p25": number,
      "p50": number,
      "p75": number,
      "percentile": number,
      "assessment": "top_10" | "top_quartile" | "above_median" | "below_median" | "bottom_quartile" | "bottom_10",
      "vsMedian": number,
      "vsTopQuartile": number,
      "annualImpact": number,
      "impactCalculation": "string explaining the calculation",
      "isPrimary": boolean
    }
  ],
  
  "overallPosition": {
    "percentile": number,
    "summary": "string",
    "strengthCount": number,
    "gapCount": number
  },
  
  "topStrengths": [
    {
      "metric": "string",
      "position": "string",
      "clientQuoteRelevant": "string or null",
      "implication": "string"
    }
  ],
  
  "topGaps": [
    {
      "metric": "string",
      "position": "string",
      "annualImpact": number,
      "clientQuoteRelevant": "string or null",
      "rootCauseHypothesis": "string"
    }
  ],
  
  "opportunitySizing": {
    "totalAnnualOpportunity": number, // MUST be realistic - typically 15-40% of current revenue. NEVER double-count.
    "realisticCaptureRate": number, // What % of the theoretical gap is realistically capturable (typically 50-70%)
    "breakdown": [
      {
        "metric": "string", // ONLY actionable INPUT levers (utilisation, rates, margins) - NOT outcome metrics like revenue per employee
        "currentValue": number,
        "targetValue": number, // Target should be median, NOT top quartile (be realistic)
        "theoreticalGap": number, // The full mathematical gap
        "realisticCapture": number, // What they can actually capture (50-70% of theoretical)
        "annualImpact": number, // Use realisticCapture, not theoreticalGap
        "difficulty": "easy" | "medium" | "hard",
        "timeframe": "string",
        "dependsOn": "string or null" // What else needs to happen first
      }
    ],
    "outcomeProjection": {
      "currentRevenuePerEmployee": number,
      "projectedRevenuePerEmployee": number, // What it WOULD be if they capture the opportunity
      "percentileImprovement": "string" // e.g., "15th to 35th percentile"
    }
  },
  
  "recommendations": [
    {
      "priority": number,
      "title": "string",
      "description": "string",
      "metricImpacted": "string",
      "expectedImprovement": number,
      "annualValue": number,
      "difficulty": "easy" | "medium" | "hard",
      "timeframe": "string",
      "linkedService": "string or null",
      "implementationSteps": [
        "string - Specific actionable step 1",
        "string - Specific actionable step 2",
        "string - Specific actionable step 3 (minimum 3, maximum 6 steps)"
      ],
      "quickWins": ["string - Things they can do this week"],
      "warningSignsOfFailure": ["string - How to know if this isn't working"],
      "whatWeCanHelp": "string - Specific service/support we can provide for this recommendation"
    }
  ],
  
  "adminGuidance": {
    "openingStatement": "A 2-3 sentence opening statement the practitioner should use. Reference the £ opportunity and percentile position. Connect to their stated concern. Example: 'Based on our benchmarking analysis, we've identified a £410,000 annual opportunity. Your revenue per employee of £93,750 places you at the 15th percentile - meaning 85% of comparable firms are generating more revenue per head.'",
    
    "talkingPoints": [
      {
        "topic": "string - The main subject area (e.g., 'Revenue efficiency gap', 'Founder dependency risk')",
        "point": "string - The specific insight to communicate to the client",
        "clientQuoteToReference": "string - Exact quote from their assessment to reference back",
        "dataPoint": "string - The specific numbers to cite (e.g., '£93,750 vs £145,000 median')",
        "importance": "critical" | "high" | "medium",
        "conversationScript": "string - FULL script of exactly what to say to the client, including: 1) How to introduce this topic, 2) How to present the data, 3) How to connect to their stated concern, 4) What questions this should prompt",
        "whatToListenFor": "string - Signs and signals to look for in client's response",
        "potentialPushback": "string - How clients might resist this finding and how to respond"
      }
    ],
    
    "questionsToAsk": [
      {
        "question": "string - The actual question to ask",
        "purpose": "string - What you're trying to learn",
        "expectedInsight": "string - What a good answer would reveal",
        "followUp": "string - Follow-up question if they don't fully answer",
        "probeDeeper": ["string - Additional probing questions to dig deeper"],
        "dataThisReveals": "string - What metric or insight this question helps collect"
      }
    ],
    
    "dataCollectionScript": [
      {
        "metricNeeded": "string - e.g., 'Utilisation Rate', 'Hourly Rates', 'Project Margins'",
        "whyNeeded": "string - Why this data matters for the analysis",
        "howToAsk": "string - Exactly how to phrase the request",
        "industryContext": "string - Industry benchmark to provide context (e.g., 'Most agencies run 65-75% utilisation')",
        "followUpIfUnsure": "string - What to ask if they don't know the number",
        "howToRecord": "string - What format/unit to capture the answer"
      }
    ],
    
    "nextSteps": [
      {
        "action": "string - Specific action to take",
        "owner": "practice" | "client" | "joint",
        "timing": "string - When this should happen",
        "outcome": "string - What success looks like",
        "priority": number,
        "scriptToAgree": "string - Exact words to use when agreeing this action with the client"
      }
    ],
    
    "tasks": [
      {
        "task": "string - Specific internal task that ADDS VALUE beyond what this report already provides",
        "assignTo": "string - Role that should handle this",
        "dueDate": "string - Relative timing (e.g., '3 days', '1 week')",
        "deliverable": "string - What artifact this produces",
        "dependsOn": "string or null - What needs to happen first"
      }
    ],
    
    "TASK_RULES": "NEVER suggest tasks like 'research industry benchmarks' or 'analyse benchmarking data' - WE JUST DID THAT. Tasks should be ADDITIVE value: 1) Client-specific deliverables (time tracking templates, rate cards), 2) Implementation support (process documentation, training materials), 3) Follow-up analysis (deep dives into specific areas). If a task duplicates what this benchmarking report provides, DELETE IT.",
    
    "riskFlags": [
      {
        "flag": "string - The risk or concern",
        "mitigation": "string - How to address it",
        "severity": "high" | "medium" | "low",
        "warningSignsInConversation": "string - What the client might say that confirms this risk"
      }
    ],
    
    "closingScript": "string - How to wrap up the conversation. Should include: 1) Summary of key findings, 2) Confirmation of agreed next steps, 3) Timeline for follow-up, 4) Any homework for the client"
  },
  
  "dataGaps": [
    {
      "metric": "string",
      "needed": "string",
      "source": "string",
      "critical": boolean
    }
  ],
  
  "clientQuotes": {
    "suspectedUnderperformance": "${assessment.suspected_underperformance}",
    "leavingMoney": "${assessment.leaving_money}",
    "competitorEnvy": "${assessment.competitor_envy || ''}",
    "magicFix": "${assessment.benchmark_magic_fix}",
    "blindSpotFear": "${assessment.blind_spot_fear || ''}"
  }
}

IMPORTANT:
- Every gap must have a calculated £ annual impact
- Reference their exact words in talking points
- Recommendations must link to specific metrics
- Flag gaps in their data that would improve the analysis
- Percentile calculation: Use linear interpolation between percentiles if client value falls between p25/p50/p75

═══════════════════════════════════════════════════════════════════════════════
ANTI-AI-SLOP WRITING RULES
═══════════════════════════════════════════════════════════════════════════════

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (look at, examine, dig into)
- Crucial, pivotal, vital, key as adjective (show why it matters)
- Testament to, underscores, highlights (shows, makes clear)
- Showcases, fostering, garnered (shows, building, got)
- Tapestry, landscape, ecosystem (figurative uses)
- Intricate, vibrant, enduring (puffery)
- Synergy, leverage (verb), value-add, streamline, optimize, holistic (corporate nonsense)

BANNED STRUCTURES:
- "Not only X but also Y" (pick X or Y)
- "It's important to note..." / "In summary..." / "In conclusion..."
- Rule of three lists (pick the best one)
- "Despite challenges, positioned for growth" formula
- Ending sentences with "-ing" phrases ("ensuring excellence, fostering growth")

THE HUMAN TEST:
If it sounds like an annual report, rewrite it. If it sounds like a smart advisor over coffee, keep it.

Return ONLY valid JSON.
`;
}

function calculateEmployeeBand(employeeCount: number): string {
  if (employeeCount <= 5) return '1_5';
  if (employeeCount <= 10) return '6_10';
  if (employeeCount <= 25) return '11_25';
  if (employeeCount <= 50) return '26_50';
  if (employeeCount <= 100) return '51_100';
  return '100_plus';
}

/**
 * Extract benchmarkable metrics from HVA data
 */
function extractHVAMetrics(hvaData: any): Record<string, number> {
  const metrics: Record<string, number> = {};
  const hva = hvaData?.responses || {};
  
  // Client concentration (Top 3 customers as % of revenue)
  if (hva.top3_customer_revenue_percentage != null) {
    metrics.client_concentration_top3 = parseFloat(hva.top3_customer_revenue_percentage);
  }
  
  // Knowledge dependency
  if (hva.knowledge_dependency_percentage != null) {
    metrics.knowledge_concentration = parseFloat(hva.knowledge_dependency_percentage);
  }
  
  // Personal brand dependency
  if (hva.personal_brand_percentage != null) {
    metrics.founder_brand_dependency = parseFloat(hva.personal_brand_percentage);
  }
  
  // Team advocacy
  if (hva.team_advocacy_percentage != null) {
    metrics.team_advocacy_score = parseFloat(hva.team_advocacy_percentage);
  }
  
  // Tech stack health
  if (hva.tech_stack_health_percentage != null) {
    metrics.tech_health_score = parseFloat(hva.tech_stack_health_percentage);
  }
  
  return metrics;
}

/**
 * Calculate founder risk score from HVA data
 */
function calculateFounderRisk(hvaData: any): any {
  const hva = hvaData?.responses || {};
  const riskFactors: any[] = [];
  let totalPoints = 0;
  
  // Succession signals (highest weight)
  const successionWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    succession_your_role: {
      'Nobody': { points: 25, severity: 'critical' },
      'Need 6 months': { points: 15, severity: 'high' },
      'Need 1 month': { points: 8, severity: 'medium' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_sales: {
      'Nobody': { points: 10, severity: 'high' },
      'Need 6 months': { points: 6, severity: 'medium' },
      'Need 1 month': { points: 3, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_technical: {
      'Nobody': { points: 12, severity: 'critical' },
      'Need 6 months': { points: 7, severity: 'high' },
      'Need 1 month': { points: 4, severity: 'medium' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_operations: {
      'Nobody': { points: 8, severity: 'high' },
      'Need 6 months': { points: 5, severity: 'medium' },
      'Need 1 month': { points: 2, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_customer: {
      'Nobody': { points: 8, severity: 'high' },
      'Need 6 months': { points: 5, severity: 'medium' },
      'Need 1 month': { points: 2, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    }
  };
  
  // Autonomy signals
  const autonomyWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    autonomy_finance: {
      'Would fail': { points: 15, severity: 'critical' },
      'Needs oversight': { points: 8, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_strategy: {
      'Would fail': { points: 12, severity: 'high' },
      'Needs oversight': { points: 6, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_sales: {
      'Would fail': { points: 12, severity: 'high' },
      'Needs oversight': { points: 6, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_delivery: {
      'Would fail': { points: 10, severity: 'high' },
      'Needs oversight': { points: 5, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    }
  };
  
  // Key person risk signals
  const riskWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    risk_sales_lead: {
      'Crisis situation': { points: 10, severity: 'high' },
      'Disrupted for weeks': { points: 6, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    },
    risk_finance_lead: {
      'Crisis situation': { points: 10, severity: 'high' },
      'Disrupted for weeks': { points: 6, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    },
    risk_tech_lead: {
      'Crisis situation': { points: 12, severity: 'critical' },
      'Disrupted for weeks': { points: 7, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    }
  };
  
  // Check succession signals
  for (const [field, weights] of Object.entries(successionWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Succession Planning',
          signal: `${field.replace('succession_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Check autonomy signals
  for (const [field, weights] of Object.entries(autonomyWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Operational Autonomy',
          signal: `${field.replace('autonomy_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Check key person risk signals
  for (const [field, weights] of Object.entries(riskWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Key Person Risk',
          signal: `${field.replace('risk_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Percentage-based risk factors
  const kd = hva.knowledge_dependency_percentage;
  if (kd != null) {
    if (kd >= 80) {
      totalPoints += 15;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% of critical knowledge held by founder/key person`,
        severity: 'critical',
        points: 15,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    } else if (kd >= 60) {
      totalPoints += 10;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% of critical knowledge concentrated`,
        severity: 'high',
        points: 10,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    } else if (kd >= 40) {
      totalPoints += 5;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% knowledge dependency`,
        severity: 'medium',
        points: 5,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    }
  }
  
  const pb = hva.personal_brand_percentage;
  if (pb != null) {
    if (pb >= 85) {
      totalPoints += 12;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% of brand value tied to founder personally`,
        severity: 'critical',
        points: 12,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    } else if (pb >= 70) {
      totalPoints += 8;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% personal brand dependency`,
        severity: 'high',
        points: 8,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    } else if (pb >= 50) {
      totalPoints += 4;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% brand tied to individual`,
        severity: 'medium',
        points: 4,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    }
  }
  
  // Determine risk level
  let riskLevel: string;
  let valuationImpact: string;
  
  if (totalPoints >= 60) {
    riskLevel = 'critical';
    valuationImpact = '30-50% valuation discount';
  } else if (totalPoints >= 40) {
    riskLevel = 'high';
    valuationImpact = '20-30% valuation discount';
  } else if (totalPoints >= 20) {
    riskLevel = 'medium';
    valuationImpact = '10-20% valuation discount';
  } else {
    riskLevel = 'low';
    valuationImpact = 'Minimal valuation impact';
  }
  
  // Assess succession readiness
  const successionFields = [
    { field: 'succession_sales', role: 'Sales' },
    { field: 'succession_technical', role: 'Technical' },
    { field: 'succession_operations', role: 'Operations' },
    { field: 'succession_customer', role: 'Customer' },
    { field: 'succession_your_role', role: 'Founder/CEO' }
  ];
  
  const roleGaps: string[] = [];
  const readyRoles: string[] = [];
  
  for (const { field, role } of successionFields) {
    const value = hva[field];
    if (value === 'Ready now') {
      readyRoles.push(role);
    } else if (value === 'Nobody' || value === 'Need 6 months' || !value) {
      roleGaps.push(`${role}: ${value || 'Not assessed'}`);
    }
  }
  
  let successionReadiness: string = 'partial';
  let timeToReady = '3-6 months';
  
  if (roleGaps.length === 0 && readyRoles.length >= 4) {
    successionReadiness = 'ready';
    timeToReady = 'Ready now';
  } else if (roleGaps.length >= 4 || hva.succession_your_role === 'Nobody') {
    successionReadiness = 'none';
    timeToReady = '12-24 months';
  } else if (roleGaps.length >= 2) {
    timeToReady = '6-12 months';
  }
  
  // Sort risk factors by severity
  riskFactors.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return {
    overallScore: Math.min(100, totalPoints),
    riskLevel,
    riskFactors: riskFactors.slice(0, 10), // Top 10 risk factors
    successionReadiness: {
      overallReadiness: successionReadiness,
      roleGaps,
      readyRoles,
      timeToReady
    },
    valuationImpact
  };
}

/**
 * Extract narrative quotes from HVA data
 */
function extractNarrativeQuotes(hvaData: any): any[] {
  const quotes: any[] = [];
  const hva = hvaData?.responses || {};
  
  // Context quotes
  if (hva.bm_business_description || hva.business_description) {
    quotes.push({
      category: 'context',
      field: 'Business Description',
      value: hva.bm_business_description || hva.business_description,
      useCase: 'Opening paragraph - establish what the business does',
      priority: 1
    });
  }
  
  // Strength quotes
  if (hva.unique_methods) {
    quotes.push({
      category: 'strength',
      field: 'Unique Methods',
      value: hva.unique_methods,
      useCase: 'Strength narrative - competitive differentiation',
      priority: 2
    });
  }
  
  if (hva.competitive_moat) {
    quotes.push({
      category: 'strength',
      field: 'Competitive Moat',
      value: hva.competitive_moat,
      useCase: 'Strength narrative - defensibility factors',
      priority: 2
    });
  }
  
  // Gap quotes
  if (hva.bm_leaving_money) {
    quotes.push({
      category: 'gap',
      field: 'Leaving Money',
      value: hva.bm_leaving_money,
      useCase: 'Gap narrative - self-identified revenue leakage',
      priority: 1
    });
  }
  
  if (hva.bm_suspected_underperformance) {
    quotes.push({
      category: 'gap',
      field: 'Suspected Underperformance',
      value: hva.bm_suspected_underperformance,
      useCase: 'Gap narrative - performance concerns',
      priority: 1
    });
  }
  
  if (hva.critical_processes_undocumented) {
    quotes.push({
      category: 'gap',
      field: 'Undocumented Processes',
      value: hva.critical_processes_undocumented,
      useCase: 'Gap narrative - knowledge capture risk',
      priority: 2
    });
  }
  
  // Fear quotes
  if (hva.bm_blind_spot_fear) {
    quotes.push({
      category: 'fear',
      field: 'Blind Spot Fear',
      value: hva.bm_blind_spot_fear,
      useCase: 'Executive summary - address core anxiety',
      priority: 1
    });
  }
  
  // Aspiration quotes
  if (hva.bm_top_quartile_ambition) {
    quotes.push({
      category: 'aspiration',
      field: 'Top Quartile Ambition',
      value: Array.isArray(hva.bm_top_quartile_ambition) 
        ? hva.bm_top_quartile_ambition.join(', ')
        : hva.bm_top_quartile_ambition,
      useCase: 'Recommendation framing - align to stated goals',
      priority: 2
    });
  }
  
  if (hva.bm_benchmark_magic_fix) {
    quotes.push({
      category: 'aspiration',
      field: 'Magic Fix',
      value: hva.bm_benchmark_magic_fix,
      useCase: 'Recommendation prioritization - address stated priority',
      priority: 1
    });
  }
  
  quotes.sort((a, b) => a.priority - b.priority);
  return quotes;
}

/**
 * Format quotes for AI prompt
 */
function formatQuotesForPrompt(quotes: any[]): string {
  const sections: Record<string, any[]> = {
    context: [],
    strength: [],
    gap: [],
    fear: [],
    aspiration: []
  };
  
  for (const quote of quotes) {
    if (sections[quote.category]) {
      sections[quote.category].push(quote);
    }
  }
  
  let output = '## CLIENT QUOTES FOR NARRATIVE (use verbatim where appropriate)\n\n';
  
  if (sections.context.length > 0) {
    output += '### Business Context\n';
    for (const q of sections.context) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.fear.length > 0) {
    output += '### Client Fears/Concerns (address these directly)\n';
    for (const q of sections.fear) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.gap.length > 0) {
    output += '### Self-Identified Gaps (validate with benchmarks)\n';
    for (const q of sections.gap) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.strength.length > 0) {
    output += '### Strengths/Differentiation (acknowledge in narrative)\n';
    for (const q of sections.strength) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.aspiration.length > 0) {
    output += '### Goals/Aspirations (frame recommendations against)\n';
    for (const q of sections.aspiration) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  return output;
}

/**
 * Enrich benchmark data by calculating derived metrics from available raw data
 * Priority: Uploaded Accounts > Supplementary Data > Assessment Data
 */
// Helper to parse money strings like "£63,000,000" or "63000000"
function parseMoneyString(value: any): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[£$€,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function enrichBenchmarkData(assessmentData: any, hvaData: any, uploadedFinancialData?: any[]): any {
  const enriched = { ...assessmentData };
  const derivedFields: string[] = [];
  
  // ==========================================================================
  // UPLOADED ACCOUNTS DATA (Highest priority - actual verified figures)
  // ==========================================================================
  
  // Build historical financials array for trend analysis
  const historicalFinancials: YearlyFinancials[] = [];
  
  if (uploadedFinancialData && uploadedFinancialData.length > 0) {
    const latest = uploadedFinancialData[0]; // Most recent confirmed year
    
    console.log('[BM Enrich] Using uploaded accounts data:', {
      fiscalYear: latest.fiscal_year,
      revenue: latest.revenue,
      confidence: latest.confidence_score,
      yearsAvailable: uploadedFinancialData.length
    });
    
    // Use actual revenue from accounts
    if (latest.revenue) {
      enriched._enriched_revenue = latest.revenue;
      enriched.data_source = 'uploaded_accounts';
      derivedFields.push('revenue (from uploaded accounts)');
    }
    
    // Use actual employee count if available
    if (latest.employee_count) {
      enriched._enriched_employee_count = latest.employee_count;
      derivedFields.push('employee_count (from uploaded accounts)');
    }
    
    // Use actual gross margin
    if (latest.gross_margin_pct) {
      enriched.gross_margin = latest.gross_margin_pct;
      derivedFields.push('gross_margin (from uploaded accounts)');
    }
    
    // Use actual EBITDA margin
    if (latest.ebitda_margin_pct) {
      enriched.ebitda_margin = latest.ebitda_margin_pct;
      derivedFields.push('ebitda_margin (from uploaded accounts)');
    }
    
    // Use actual net margin
    if (latest.net_margin_pct) {
      enriched.net_margin = latest.net_margin_pct;
      derivedFields.push('net_margin (from uploaded accounts)');
    }
    
    // Use actual debtor days
    if (latest.debtor_days) {
      enriched.debtor_days = latest.debtor_days;
      derivedFields.push('debtor_days (from uploaded accounts)');
    }
    
    // Use actual revenue per employee
    if (latest.revenue_per_employee) {
      enriched.revenue_per_employee = latest.revenue_per_employee;
      derivedFields.push('revenue_per_employee (from uploaded accounts)');
    }
    
    // ==========================================================================
    // BALANCE SHEET EXTRACTION (New - for context on financial health)
    // ==========================================================================
    
    const balanceSheet: BalanceSheet = {
      cash: latest.cash || latest.cash_at_bank || latest.cash_and_bank || null,
      net_assets: latest.net_assets || latest.total_equity || latest.shareholders_funds || null,
      total_assets: latest.total_assets || null,
      current_assets: latest.current_assets || null,
      current_liabilities: latest.current_liabilities || null,
      debtors: latest.debtors || latest.trade_debtors || latest.accounts_receivable || null,
      creditors: latest.creditors || latest.trade_creditors || latest.accounts_payable || null,
      stock: latest.stock || latest.inventory || null,
      fixed_assets: latest.fixed_assets || latest.tangible_assets || null,
      investments: latest.investments || latest.fixed_asset_investments || null,
      freehold_property: latest.freehold_property || latest.land_and_buildings || null
    };
    
    // Only add balance sheet if we have meaningful data
    const hasBalanceSheetData = Object.values(balanceSheet).some(v => v !== null);
    if (hasBalanceSheetData) {
      enriched.balance_sheet = balanceSheet;
      derivedFields.push('balance_sheet (from uploaded accounts)');
      console.log('[BM Enrich] Extracted balance sheet data:', {
        cash: balanceSheet.cash,
        net_assets: balanceSheet.net_assets,
        debtors: balanceSheet.debtors
      });
      
      // Calculate liquidity ratios
      if (balanceSheet.current_assets && balanceSheet.current_liabilities && balanceSheet.current_liabilities > 0) {
        enriched.current_ratio = Number((balanceSheet.current_assets / balanceSheet.current_liabilities).toFixed(2));
        const quickAssets = balanceSheet.current_assets - (balanceSheet.stock || 0);
        enriched.quick_ratio = Number((quickAssets / balanceSheet.current_liabilities).toFixed(2));
        derivedFields.push('current_ratio', 'quick_ratio');
      }
      
      // Calculate working capital days from balance sheet if not already set
      // Note: These can be overridden by supplementary data later in the function
      if (!enriched.debtor_days && balanceSheet.debtors && enriched._enriched_revenue) {
        enriched.debtor_days = Math.round((balanceSheet.debtors / enriched._enriched_revenue) * 365);
        derivedFields.push('debtor_days (calculated from balance sheet)');
      }
      if (!enriched.creditor_days && balanceSheet.creditors && enriched._enriched_revenue) {
        enriched.creditor_days = Math.round((balanceSheet.creditors / enriched._enriched_revenue) * 365);
        derivedFields.push('creditor_days (calculated from balance sheet)');
      }
      
      // Cash months runway (based on monthly fixed costs, not revenue)
      if (balanceSheet.cash) {
        const staffCosts = latest.staff_costs || latest.total_staff_costs || latest.wages_and_salaries || 0;
        const adminExpenses = latest.admin_expenses || latest.administrative_expenses || latest.other_operating_charges || 0;
        const monthlyFixedCosts = (staffCosts + adminExpenses) / 12;
        
        if (monthlyFixedCosts > 0) {
          enriched.cash_months = Number((balanceSheet.cash / monthlyFixedCosts).toFixed(1));
          derivedFields.push('cash_months (based on monthly fixed costs)');
          console.log(`[BM Pass 1] Cash runway: £${(balanceSheet.cash/1000000).toFixed(1)}M / £${(monthlyFixedCosts/1000000).toFixed(2)}M monthly = ${enriched.cash_months} months`);
        } else if (enriched._enriched_revenue) {
          // Fallback: assume fixed costs are 25% of revenue
          const estimatedMonthlyFixedCosts = (enriched._enriched_revenue * 0.25) / 12;
          enriched.cash_months = Number((balanceSheet.cash / estimatedMonthlyFixedCosts).toFixed(1));
          derivedFields.push('cash_months (estimated from 25% of revenue)');
        }
      }
      
      // ==========================================================================
      // SURPLUS CASH CALCULATION
      // ==========================================================================
      // Calculate surplus cash using proper methodology:
      // Surplus = Actual Cash - (3-month Operating Buffer + Working Capital Requirement)
      
      const surplusCashData = {
        ...balanceSheet,
        // Add P&L items for operating buffer calculation
        staff_costs: latest.staff_costs || latest.total_staff_costs || latest.wages_and_salaries,
        admin_expenses: latest.admin_expenses || latest.administrative_expenses || latest.other_operating_charges
      };
      
      const surplusCashAnalysis = calculateSurplusCash(surplusCashData, enriched._enriched_revenue);
      
      if (surplusCashAnalysis.hasData) {
        enriched.surplus_cash = surplusCashAnalysis;
        derivedFields.push(`surplus_cash (${surplusCashAnalysis.confidence} confidence)`);
        
        console.log('[BM Enrich] Surplus cash analysis:', {
          actualCash: surplusCashAnalysis.actualCash,
          requiredCash: surplusCashAnalysis.requiredCash,
          surplusCash: surplusCashAnalysis.surplusCash,
          surplusPercent: surplusCashAnalysis.surplusAsPercentOfRevenue?.toFixed(1) + '%',
          confidence: surplusCashAnalysis.confidence,
          netWorkingCapital: surplusCashAnalysis.components.netWorkingCapital
        });
        
        // Log if material surplus found
        if (surplusCashAnalysis.surplusCash && surplusCashAnalysis.surplusCash >= 500000) {
          console.log(`[BM Enrich] 💰 MATERIAL SURPLUS CASH: £${(surplusCashAnalysis.surplusCash / 1000000).toFixed(1)}M`);
        }
        
        // Log if suppliers are funding working capital
        if (surplusCashAnalysis.components.netWorkingCapital && surplusCashAnalysis.components.netWorkingCapital < 0) {
          console.log(`[BM Enrich] 📊 Negative working capital: suppliers fund £${(Math.abs(surplusCashAnalysis.components.netWorkingCapital) / 1000).toFixed(0)}k`);
        }
      }
    }
    
    // ==========================================================================
    // MULTI-YEAR HISTORICAL DATA (for trend analysis)
    // ==========================================================================
    
    // Build historical array from all uploaded years (excluding current)
    for (let i = 1; i < uploadedFinancialData.length; i++) {
      const yearData = uploadedFinancialData[i];
      historicalFinancials.push({
        fiscal_year: yearData.fiscal_year,
        revenue: yearData.revenue || null,
        gross_profit: yearData.gross_profit || null,
        gross_margin: yearData.gross_margin_pct || null,
        operating_profit: yearData.operating_profit || null,
        operating_margin: yearData.operating_margin_pct || null,
        net_profit: yearData.net_profit || null,
        net_margin: yearData.net_margin_pct || null,
        cash: yearData.cash || yearData.cash_at_bank || null,
        net_assets: yearData.net_assets || yearData.total_equity || null,
        debtors: yearData.debtors || yearData.trade_debtors || null,
        creditors: yearData.creditors || yearData.trade_creditors || null,
        employee_count: yearData.employee_count || null
      });
    }
    
    // Sort by year descending (most recent prior year first)
    historicalFinancials.sort((a, b) => b.fiscal_year - a.fiscal_year);
    
    if (historicalFinancials.length > 0) {
      enriched.historical_financials = historicalFinancials;
      derivedFields.push(`historical_financials (${historicalFinancials.length} prior years)`);
      console.log('[BM Enrich] Historical years available:', historicalFinancials.map(h => h.fiscal_year));
    }
    
    // Calculate YoY growth if we have 2+ years
    if (uploadedFinancialData.length >= 2) {
      const prevYear = uploadedFinancialData[1];
      if (latest.revenue && prevYear.revenue && prevYear.revenue > 0) {
        enriched.revenue_growth = Number((((latest.revenue - prevYear.revenue) / prevYear.revenue) * 100).toFixed(1));
        derivedFields.push('revenue_growth (from uploaded accounts YoY)');
      }
    }
    
    // Store metadata about the data source
    enriched._accounts_data = {
      years_available: uploadedFinancialData.length,
      latest_year: latest.fiscal_year,
      confidence: latest.confidence_score,
      source: 'uploaded_accounts'
    };
  }
  
  // ==========================================================================
  // FALLBACK TO ASSESSMENT DATA (if not from accounts)
  // ==========================================================================
  
  // Extract revenue from multiple possible field names (only if not from accounts)
  // Note: Assessment fields may use spaces OR underscores depending on source
  const revenue = enriched._enriched_revenue || 
    parseMoneyString(assessmentData.responses?.['bm revenue exact']) ||
    parseMoneyString(assessmentData.responses?.['bm_revenue_exact']) ||
    parseMoneyString(assessmentData.responses?.bm_revenue_exact) ||
    parseFloat(assessmentData.responses?.revenue) ||
    parseFloat(assessmentData.responses?.annual_revenue) ||
    parseFloat(assessmentData.responses?.turnover) ||
    assessmentData.revenue;
  
  if (revenue && !enriched._enriched_revenue) {
    enriched._enriched_revenue = revenue;
    console.log(`[BM Enrich] Found revenue from assessment: £${revenue.toLocaleString()}`);
  }
  
  // Extract employee count from multiple possible field names (only if not from accounts)
  const employeeCount = enriched._enriched_employee_count ||
    parseFloat(assessmentData.responses?.['bm employee count']) ||
    parseFloat(assessmentData.responses?.['bm_employee_count']) ||
    parseFloat(assessmentData.responses?.bm_employee_count) ||
    parseFloat(assessmentData.responses?.employee_count) ||
    parseFloat(assessmentData.responses?.headcount) ||
    parseFloat(assessmentData.responses?.team_size) ||
    assessmentData.employee_count;
  
  if (employeeCount && !enriched._enriched_employee_count) {
    enriched._enriched_employee_count = employeeCount;
    console.log(`[BM Enrich] Found employee count from assessment: ${employeeCount}`);
  }
  
  // Calculate Revenue per Employee
  if (revenue && employeeCount && !enriched.revenue_per_employee) {
    enriched.revenue_per_employee = Math.round(revenue / employeeCount);
    derivedFields.push('revenue_per_employee');
    console.log(`[BM Pass 1] Calculated revenue_per_employee: £${enriched.revenue_per_employee} (from £${revenue} ÷ ${employeeCount})`);
  }
  
  // Extract gross profit and calculate gross margin
  const grossProfit = 
    parseFloat(assessmentData.responses?.gross_profit) ||
    assessmentData.gross_profit;
  
  if (revenue && grossProfit && !enriched.gross_margin) {
    enriched.gross_margin = Number(((grossProfit / revenue) * 100).toFixed(1));
    derivedFields.push('gross_margin');
    console.log(`[BM Pass 1] Calculated gross_margin: ${enriched.gross_margin}%`);
  }
  
  // Extract net profit and calculate net margin
  const netProfit = 
    parseFloat(assessmentData.responses?.net_profit) ||
    assessmentData.net_profit;
  
  if (revenue && netProfit && !enriched.net_margin) {
    enriched.net_margin = Number(((netProfit / revenue) * 100).toFixed(1));
    derivedFields.push('net_margin');
    console.log(`[BM Pass 1] Calculated net_margin: ${enriched.net_margin}%`);
  }
  
  // Pull client concentration from HVA (will be merged with other HVA metrics later)
  if (hvaData?.responses?.top3_customer_revenue_percentage != null) {
    enriched.client_concentration_top3 = parseFloat(hvaData.responses.top3_customer_revenue_percentage);
    derivedFields.push('client_concentration_top3 (from HVA)');
    console.log(`[BM Pass 1] Extracted client_concentration_top3 from HVA: ${enriched.client_concentration_top3}%`);
  }
  
  // ==========================================================================
  // SUPPLEMENTARY DATA (Collected by practitioners via Data Collection panel)
  // ==========================================================================
  
  const responses = assessmentData.responses || {};
  
  // Utilisation Rate - percentage of billable time
  const utilisationRate = parseFloat(responses['Utilisation Rate']) || parseFloat(responses['bm_supp_Utilisation Rate']);
  if (utilisationRate) {
    enriched.utilisation_rate = utilisationRate;
    derivedFields.push('utilisation_rate (supplementary)');
    console.log(`[BM Pass 1] Supplementary: utilisation_rate = ${utilisationRate}%`);
  }
  
  // Hourly Rates - average blended rate
  const hourlyRates = parseFloat(responses['Hourly Rates']) || parseFloat(responses['bm_supp_Hourly Rates']);
  if (hourlyRates) {
    enriched.hourly_rate = hourlyRates;
    derivedFields.push('hourly_rate (supplementary)');
    console.log(`[BM Pass 1] Supplementary: hourly_rate = £${hourlyRates}/hr`);
  }
  
  // Project Margins - gross margin on projects
  const projectMargins = parseFloat(responses['Project Margins']) || parseFloat(responses['bm_supp_Project Margins']);
  if (projectMargins) {
    enriched.project_margin = projectMargins;
    derivedFields.push('project_margin (supplementary)');
    console.log(`[BM Pass 1] Supplementary: project_margin = ${projectMargins}%`);
  }
  
  // Client Concentration - from supplementary (overrides HVA if present)
  const clientConcentration = parseFloat(responses['Client Concentration']) || parseFloat(responses['bm_supp_Client Concentration']);
  if (clientConcentration) {
    enriched.client_concentration_top3 = clientConcentration;
    derivedFields.push('client_concentration_top3 (supplementary)');
    console.log(`[BM Pass 1] Supplementary: client_concentration = ${clientConcentration}%`);
  }
  
  // EBITDA Margin
  const ebitdaMargin = parseFloat(responses['EBITDA Margin']) || parseFloat(responses['bm_supp_EBITDA Margin']);
  if (ebitdaMargin) {
    enriched.ebitda_margin = ebitdaMargin;
    derivedFields.push('ebitda_margin (supplementary)');
    console.log(`[BM Pass 1] Supplementary: ebitda_margin = ${ebitdaMargin}%`);
  }
  
  // Debtor Days (override from manual entry takes priority over calculated)
  const debtorDays = parseFloat(responses['Debtor Days']) || parseFloat(responses['bm_supp_Debtor Days']);
  if (debtorDays) {
    enriched.debtor_days = debtorDays;
    derivedFields.push('debtor_days (supplementary override)');
    console.log(`[BM Pass 1] Supplementary OVERRIDE: debtor_days = ${debtorDays} days`);
  }
  
  // Creditor Days (override from manual entry takes priority over calculated)
  const creditorDays = parseFloat(responses['Creditor Days']) || parseFloat(responses['bm_supp_Creditor Days']);
  if (creditorDays) {
    enriched.creditor_days = creditorDays;
    derivedFields.push('creditor_days (supplementary override)');
    console.log(`[BM Pass 1] Supplementary OVERRIDE: creditor_days = ${creditorDays} days`);
  }
  
  // Revenue Growth
  const revenueGrowth = parseFloat(responses['Revenue Growth']) || parseFloat(responses['bm_supp_Revenue Growth']);
  if (revenueGrowth) {
    enriched.revenue_growth = revenueGrowth;
    derivedFields.push('revenue_growth (supplementary)');
    console.log(`[BM Pass 1] Supplementary: revenue_growth = ${revenueGrowth}%`);
  }
  
  enriched.derived_fields = derivedFields;
  enriched._enriched_revenue = revenue;
  enriched._enriched_employee_count = employeeCount;
  
  // ==========================================================================
  // TREND ANALYSIS (requires historical data)
  // ==========================================================================
  
  if (historicalFinancials.length > 0) {
    const trends = analyseFinancialTrends(enriched, historicalFinancials);
    if (trends.length > 0) {
      enriched.financial_trends = trends;
      derivedFields.push(`financial_trends (${trends.length} metrics analysed)`);
      
      // Log key findings
      const grossMarginTrend = trends.find(t => t.metric === 'gross_margin');
      if (grossMarginTrend) {
        console.log(`[BM Enrich] Gross margin trend: ${grossMarginTrend.direction}${grossMarginTrend.isRecovering ? ' (RECOVERING)' : ''}`);
        console.log(`[BM Enrich] ${grossMarginTrend.narrative}`);
      }
    }
    
    // ==========================================================================
    // INVESTMENT PATTERN DETECTION
    // ==========================================================================
    
    const investmentSignals = detectInvestmentPattern(enriched, historicalFinancials, responses);
    enriched.investment_signals = investmentSignals;
    
    if (investmentSignals.likelyInvestmentYear) {
      console.log(`[BM Enrich] ⚠️ INVESTMENT PATTERN DETECTED (confidence: ${investmentSignals.confidence})`);
      investmentSignals.indicators.forEach(ind => console.log(`[BM Enrich]   - ${ind}`));
      derivedFields.push(`investment_signals (${investmentSignals.confidence} confidence)`);
    }
  }
  
  return enriched;
}

/**
 * Map SIC code to industry code with fallbacks
 * IMPORTANT: Some SIC codes (like 62090) are too broad and need description-based disambiguation
 */
function resolveIndustryFromSIC(sicCode: string, subSectorHint?: string, businessDescription?: string): string | null {
  
  // FIRST: Handle ambiguous SIC codes that need description-based classification
  const ambiguousSICs = ['62090']; // "Other IT service activities" covers too many business types
  
  if (ambiguousSICs.includes(sicCode) && businessDescription) {
    const desc = businessDescription.toLowerCase();
    
    // Telecoms / Network Infrastructure (NOT software agencies)
    if (desc.includes('network infrastructure') || 
        desc.includes('wireless') || 
        desc.includes('telephony') ||
        desc.includes('telecoms') ||
        desc.includes('connectivity') ||
        desc.includes('data solutions') ||
        desc.includes('cabling') ||
        desc.includes('broadband')) {
      console.log(`[BM Pass 1] SIC 62090 + description suggests TELECOMS/INFRASTRUCTURE business`);
      return 'ITSERV'; // IT Services - closer fit than software agency
    }
    
    // Systems Integration
    if (desc.includes('systems integrat') || 
        desc.includes('system integration') ||
        desc.includes('erp') ||
        desc.includes('implementation')) {
      console.log(`[BM Pass 1] SIC 62090 + description suggests SYSTEMS INTEGRATION business`);
      return 'CONSULT'; // Consulting - systems integrators are consultancies
    }
    
    // Hardware / Infrastructure
    if (desc.includes('hardware') ||
        desc.includes('infrastructure') ||
        desc.includes('server') ||
        desc.includes('data centre')) {
      console.log(`[BM Pass 1] SIC 62090 + description suggests IT INFRASTRUCTURE business`);
      return 'ITSERV';
    }
    
    // Only map to AGENCY_DEV if clearly software/digital
    if (desc.includes('software') || 
        desc.includes('app development') ||
        desc.includes('web development') ||
        desc.includes('digital agency') ||
        desc.includes('mobile app')) {
      console.log(`[BM Pass 1] SIC 62090 + description confirms SOFTWARE AGENCY`);
      return 'AGENCY_DEV';
    }
    
    // Default for 62090 when unclear - don't assume software agency
    console.log(`[BM Pass 1] SIC 62090 with unclear description - defaulting to ITSERV`);
    return 'ITSERV';
  }
  
  const sicMap: Record<string, string> = {
    // Technology - CRITICAL FIX (SIC 62020 = IT consultancy = Software Development Agency)
    '62020': 'AGENCY_DEV', // IT consultancy activities - maps to Software Development Agency (AGENCY_DEV in database)
    '62012': 'AGENCY_DEV', // Business software development
    '62011': 'SAAS', // Ready-made software (SaaS products)
    // '62090' is handled above via description-based classification (too broad to map directly)
    '62030': 'ITSERV', // Computer facilities management
    
    // Professional Services
    '69201': 'ACCT',
    '69202': 'ACCT',
    '69101': 'LEGAL',
    '69102': 'LEGAL',
    '69109': 'LEGAL',
    '70229': 'CONSULT',
    '70210': 'CONSULT',
    '78109': 'RECRUIT',
    '78200': 'RECRUIT',
    '78300': 'RECRUIT',
    '73110': 'MARKET',
    '73120': 'MARKET',
    
    // Healthcare
    '86230': 'DENTAL',
    '75000': 'VET',
    '86210': 'PRIVATE_HEALTH',
    '86220': 'PRIVATE_HEALTH',
    '87100': 'CARE',
    '87200': 'CARE',
    '87300': 'CARE',
    '47730': 'PHARMA',
    '93130': 'FITNESS',
    
    // Hospitality
    '56101': 'RESTAURANT',
    '56102': 'RESTAURANT',
    '56210': 'CATERING',
    '56301': 'PUB',
    '55100': 'HOTEL',
    
    // Construction
    '41100': 'CONST_MAIN',
    '41201': 'CONST_MAIN',
    '41202': 'CONST_MAIN',
    '43210': 'TRADES',
    '43220': 'TRADES',
    '43310': 'CONST_SPEC',
    '68310': 'ESTATE',
    '68320': 'PROP_MGMT',
    
    // Retail
    '47110': 'RETAIL_FOOD',
    '47190': 'RETAIL_GEN',
    '45111': 'AUTO_RETAIL',
    '45112': 'AUTO_RETAIL',
    
    // Manufacturing
    '18110': 'PRINT',
    '25620': 'MFG_PREC',
    
    // Wholesale
    '49410': 'LOGISTICS',
    '52290': 'LOGISTICS',
    
    // Financial
    '66190': 'IFA',
    '66220': 'INSURANCE',
    
    // Creative
    '74100': 'DESIGN',
    '74201': 'PHOTO',
    
    // Other
    '79110': 'TRAVEL_AGENT',
    '80100': 'SECURITY',
    '81210': 'CLEANING',
    '96020': 'PERSONAL',
  };
  
  // Direct SIC lookup
  if (sicCode && sicMap[sicCode]) {
    console.log(`[BM Pass 1] Mapped SIC ${sicCode} to industry: ${sicMap[sicCode]}`);
    return sicMap[sicCode];
  }
  
  // Fallback: Check sub-sector hint
  if (subSectorHint) {
    const lowerHint = subSectorHint.toLowerCase();
    if (lowerHint.includes('software') || lowerHint.includes('development') || lowerHint.includes('digital agency')) {
      return 'AGENCY_DEV';
    }
    if (lowerHint.includes('marketing') || lowerHint.includes('pr ') || lowerHint.includes('advertising')) {
      return 'MARKET';
    }
    if (lowerHint.includes('design') || lowerHint.includes('creative')) {
      return 'DESIGN';
    }
  }
  
  // Fallback: Check business description
  if (businessDescription) {
    const lowerDesc = businessDescription.toLowerCase();
    if ((lowerDesc.includes('web') || lowerDesc.includes('digital')) && 
        (lowerDesc.includes('agency') || lowerDesc.includes('consultancy'))) {
      return 'AGENCY_DEV';
    }
  }
  
  return null;
}

/**
 * Dynamically determine industry code from SIC codes and business description
 * Returns industry code if found, null otherwise
 */
async function detectIndustryFromContext(
  supabaseClient: any,
  sicCodes: string[] | null | undefined,
  businessDescription: string | null | undefined
): Promise<string | null> {
  // First try: Match SIC codes to industries
  if (sicCodes && sicCodes.length > 0) {
    // Clean SIC codes (remove any formatting)
    const cleanSicCodes = sicCodes.map(code => code.trim().replace(/[^0-9]/g, ''));
    
    // Query all active industries first (more efficient than multiple queries)
    const { data: allIndustries, error: industriesError } = await supabaseClient
      .from('industries')
      .select('code, name, sic_codes')
      .eq('is_active', true);
    
    if (industriesError || !allIndustries) {
      console.warn('[BM Pass 1] Could not fetch industries for SIC code matching');
      return null;
    }
    
    // Match SIC codes to industries
    for (const sicCode of cleanSicCodes) {
      if (!sicCode || sicCode.length < 5) continue; // Skip invalid SIC codes
      
      // Find industry where sic_codes array contains this SIC code
      const matchedIndustry = allIndustries.find((ind: any) => 
        ind.sic_codes && Array.isArray(ind.sic_codes) && ind.sic_codes.includes(sicCode)
      );
      
      if (matchedIndustry) {
        console.log(`[BM Pass 1] Matched SIC code ${sicCode} to industry: ${matchedIndustry.code} (${matchedIndustry.name})`);
        return matchedIndustry.code;
      }
    }
  }
  
  // Second try: Use AI to classify business description
  if (businessDescription && businessDescription.trim().length > 20) {
    try {
      console.log('[BM Pass 1] Attempting AI classification from business description...');
      
      // Get all active industries with their keywords for context
      const { data: allIndustries, error: industriesError } = await supabaseClient
        .from('industries')
        .select('code, name, category, keywords')
        .eq('is_active', true);
      
      if (industriesError || !allIndustries || allIndustries.length === 0) {
        console.warn('[BM Pass 1] Could not fetch industries for AI classification');
        return null;
      }
      
      // Create a simple mapping of industries for the AI
      const industryList = allIndustries.map((ind: any) => ({
        code: ind.code,
        name: ind.name,
        category: ind.category,
        keywords: ind.keywords || []
      }));
      
      // Use OpenRouter to classify
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
          'HTTP-Referer': Deno.env.get('OPENROUTER_REFERRER_URL') || '',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-20250514',
          messages: [{
            role: 'user',
            content: `Based on this business description, determine the most appropriate industry code from the list below.

Business Description:
"${businessDescription}"

Available Industries:
${industryList.map((ind: any) => `- ${ind.code}: ${ind.name} (Category: ${ind.category})${ind.keywords.length > 0 ? ` [Keywords: ${ind.keywords.join(', ')}]` : ''}`).join('\n')}

Respond with ONLY the industry code (e.g., "AGENCY_DEV" or "CONSULT"). Do not include any explanation or formatting.`
          }],
          temperature: 0.3,
          max_tokens: 20,
        }),
      });
      
      if (!response.ok) {
        console.warn('[BM Pass 1] AI classification request failed:', response.status);
        return null;
      }
      
      const result = await response.json();
      const classifiedCode = result.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      if (classifiedCode) {
        // Verify the code exists in our industries
        const { data: verifiedIndustry } = await supabaseClient
          .from('industries')
          .select('code, name')
          .eq('code', classifiedCode)
          .eq('is_active', true)
          .maybeSingle();
        
        if (verifiedIndustry) {
          console.log(`[BM Pass 1] AI classified business description to industry: ${classifiedCode} (${verifiedIndustry.name})`);
          return classifiedCode;
        } else {
          console.warn(`[BM Pass 1] AI returned invalid industry code: ${classifiedCode}`);
        }
      }
    } catch (error) {
      console.warn('[BM Pass 1] Error in AI classification:', error);
    }
  }
  
  return null;
}

/**
 * Build rich source data for display - simplified list for client view
 */
function buildRichSourceData(benchmarks: any[]): string[] {
  const sources = new Set<string>();
  
  for (const b of benchmarks) {
    // Add primary data source
    if (b.data_source) {
      sources.add(b.data_source);
    }
    
    // Add any additional sources from the sources array
    if (b.sources && Array.isArray(b.sources)) {
      for (const s of b.sources) {
        if (typeof s === 'string' && s.trim()) {
          sources.add(s);
        }
      }
    }
  }
  
  return Array.from(sources).slice(0, 20);
}

/**
 * Build detailed source data for admin view - includes full metadata
 */
function buildDetailedSourceData(benchmarks: any[]): any {
  const metricSources: Record<string, any> = {};
  const uniqueSources: any[] = [];
  const seenSourceUrls = new Set<string>();
  
  for (const b of benchmarks) {
    const metricCode = b.metric_code;
    
    // Build per-metric source info
    metricSources[metricCode] = {
      metricCode,
      metricName: b.benchmark_metrics?.name || metricCode,
      p25: b.p25,
      p50: b.p50,
      p75: b.p75,
      source: b.data_source || 'Research data',
      sources: b.sources || [],
      confidence: b.confidence_score,
      fetchedVia: b.fetched_via || 'manual',
      lastUpdated: b.updated_at,
      region: b.region || 'UK'
    };
    
    // Extract unique sources with metadata
    if (b.raw_search_response?.sources && Array.isArray(b.raw_search_response.sources)) {
      for (const source of b.raw_search_response.sources) {
        const url = source.url || source.name;
        if (url && !seenSourceUrls.has(url)) {
          seenSourceUrls.add(url);
          uniqueSources.push({
            name: source.name || extractDomainName(url),
            url: source.url,
            type: source.type || classifySourceType(source.name || source.url || ''),
            relevance: source.relevance,
            metrics: [metricCode]
          });
        } else if (url && seenSourceUrls.has(url)) {
          // Add metric to existing source
          const existing = uniqueSources.find(s => s.url === url || s.name === source.name);
          if (existing && !existing.metrics.includes(metricCode)) {
            existing.metrics.push(metricCode);
          }
        }
      }
    }
    
    // Also extract from sources array if present
    if (b.sources && Array.isArray(b.sources)) {
      for (const sourceStr of b.sources) {
        if (typeof sourceStr === 'string' && !seenSourceUrls.has(sourceStr)) {
          seenSourceUrls.add(sourceStr);
          uniqueSources.push({
            name: extractDomainName(sourceStr),
            url: sourceStr.startsWith('http') ? sourceStr : null,
            type: classifySourceType(sourceStr),
            metrics: [metricCode]
          });
        }
      }
    }
    
    // Extract from data_source field (for manually seeded data)
    if (b.data_source && typeof b.data_source === 'string' && !seenSourceUrls.has(b.data_source)) {
      seenSourceUrls.add(b.data_source);
      uniqueSources.push({
        name: b.data_source,
        url: null,
        type: classifySourceType(b.data_source),
        metrics: [metricCode]
      });
    } else if (b.data_source && seenSourceUrls.has(b.data_source)) {
      // Add metric to existing source
      const existing = uniqueSources.find(s => s.name === b.data_source);
      if (existing && !existing.metrics.includes(metricCode)) {
        existing.metrics.push(metricCode);
      }
    }
  }
  
  // Find most recent search response for methodology context
  const latestSearchResponse = benchmarks.find(b => b.raw_search_response)?.raw_search_response;
  
  return {
    metricSources,
    uniqueSources,
    totalMetrics: Object.keys(metricSources).length,
    liveSearchCount: benchmarks.filter(b => b.fetched_via === 'live_search').length,
    manualDataCount: benchmarks.filter(b => b.fetched_via === 'manual' || !b.fetched_via).length,
    overallConfidence: latestSearchResponse?.overallConfidence,
    dataQualityNotes: latestSearchResponse?.dataQualityNotes,
    marketContext: latestSearchResponse?.marketContext,
    lastRefreshed: benchmarks.reduce((latest, b) => {
      const updated = new Date(b.updated_at);
      return updated > latest ? updated : latest;
    }, new Date(0)).toISOString()
  };
}

/**
 * Extract domain name from URL for display
 */
function extractDomainName(urlOrName: string): string {
  if (!urlOrName) return 'Unknown Source';
  
  try {
    if (urlOrName.startsWith('http')) {
      const url = new URL(urlOrName);
      return url.hostname.replace('www.', '');
    }
    return urlOrName;
  } catch {
    return urlOrName;
  }
}

/**
 * Classify source type based on name/URL
 */
function classifySourceType(sourceName: string): string {
  const name = sourceName.toLowerCase();
  
  if (name.includes('ons') || name.includes('gov.uk') || name.includes('statistics') || name.includes('hmrc')) {
    return 'government';
  }
  if (name.includes('ibis') || name.includes('statista') || name.includes('euromonitor')) {
    return 'research';
  }
  if (name.includes('spi') || name.includes('deltek') || name.includes('benchbee') || name.includes('association')) {
    return 'trade_association';
  }
  if (name.includes('companies house') || name.includes('annual report') || name.includes('financial')) {
    return 'company_data';
  }
  if (name.includes('crunchbase') || name.includes('linkedin') || name.includes('glassdoor')) {
    return 'aggregator';
  }
  
  return 'research';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[BM Pass 1] Starting extraction for:', engagementId);
    
    // Fetch engagement and assessment first (they can be done in parallel)
    const [
      { data: engagement, error: engagementError },
      { data: assessment, error: assessmentError }
    ] = await Promise.all([
      supabaseClient.from('bm_engagements').select('*, clients:client_id(*)').eq('id', engagementId).single(),
      supabaseClient.from('bm_assessment_responses').select('*').eq('engagement_id', engagementId).single()
    ]);
    
    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }
    
    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message || 'Not found'}`);
    }
    
    // Get business description - check both top level and responses with bm_ prefix
    const businessDescription = 
      assessment.business_description || 
      assessment.responses?.business_description ||
      assessment.responses?.['bm business description'] ||
      assessment.responses?.bm_business_description;
    
    console.log('[BM Pass 1] Industry detection start. Description:', businessDescription ? businessDescription.substring(0, 100) : 'none');
    
    // Check if description indicates network/telecoms business
    let forceIndustryCode: string | null = null;
    if (businessDescription) {
      const desc = businessDescription.toLowerCase();
      if (desc.includes('network infrastructure') || desc.includes('wireless telephony') || desc.includes('telecoms')) {
        console.log('[BM Pass 1] Network/infrastructure business detected');
        forceIndustryCode = 'ITSERV';
      }
    }
    
    // Check if client explicitly said standard categories don't fit
    const industryHint = assessment.responses?.['bm industry suggestion'] || 
                         assessment.responses?.bm_industry_suggestion;
    const clientSaysOther = industryHint === 'Other';
    
    // Get SIC code from assessment
    const sicCodeFromAssessment = assessment.responses?.['bm sic code'] ||
                                   assessment.responses?.bm_sic_code || 
                                   assessment.responses?.sic_code;
    
    // Extract stored industry_code from assessment
    let storedIndustryCode = assessment.industry_code || assessment.responses?.industry_code;
    
    console.log('[BM Pass 1] Assessment data:', {
      stored_industry_code: storedIndustryCode,
      sic_code: sicCodeFromAssessment,
      industry_suggestion: industryHint,
      client_says_other: clientSaysOther,
      has_business_description: !!businessDescription
    });
    
    // CRITICAL: If client selected "Other" OR we have an ambiguous SIC code,
    // we should re-evaluate industry based on SIC + description, not use stored value
    const ambiguousSICs = ['62090']; // SIC codes that are too broad to map directly
    const shouldReevaluate = clientSaysOther || 
                             (sicCodeFromAssessment && ambiguousSICs.includes(sicCodeFromAssessment));
    
    let industryCode: string | null = null;
    
    // Use forced industry code if we detected a specific business type from description
    if (forceIndustryCode) {
      console.log('[BM Pass 1] Using FORCED industry code from description analysis:', forceIndustryCode);
      industryCode = forceIndustryCode;
    } else if (shouldReevaluate) {
      console.log('[BM Pass 1] Re-evaluating industry (client says Other OR ambiguous SIC code)...');
      // Force re-evaluation - don't use stored industry_code
    } else if (storedIndustryCode && storedIndustryCode !== 'undefined' && storedIndustryCode !== 'null') {
      // Use stored industry code if we have one and don't need to re-evaluate
      industryCode = storedIndustryCode;
      console.log('[BM Pass 1] Using stored industry_code:', industryCode);
    }
    
    // If industry_code is missing OR we're re-evaluating, detect from SIC codes and business description
    if (!industryCode) {
      console.log('[BM Pass 1] Detecting industry from SIC code and business description...');
      
      const subSectorHint = assessment.responses?.['bm sub sector'] ||
                            assessment.responses?.bm_sub_sector;
      
      // Try SIC code mapping first (faster and more accurate)
      if (sicCodeFromAssessment) {
        const mappedIndustry = resolveIndustryFromSIC(
          sicCodeFromAssessment,
          subSectorHint,
          businessDescription
        );
        
        console.log(`[BM Pass 1] SIC mapping returned: ${mappedIndustry} for SIC ${sicCodeFromAssessment}`);
        
        if (mappedIndustry) {
          // Verify the industry exists in database
          const { data: verifiedIndustry } = await supabaseClient
            .from('industries')
            .select('code, name')
            .eq('code', mappedIndustry)
            .eq('is_active', true)
            .maybeSingle();
          
          if (verifiedIndustry) {
            console.log(`[BM Pass 1] Verified industry exists: ${mappedIndustry} (${verifiedIndustry.name})`);
            industryCode = mappedIndustry;
          } else {
            console.log(`[BM Pass 1] WARNING: Industry ${mappedIndustry} not found in database! Checking fallbacks...`);
            
            // Try fallback industries if the mapped one doesn't exist
            const fallbackIndustries = ['CONSULT', 'AGENCY_DEV']; // Common industries that should exist
            for (const fallback of fallbackIndustries) {
              if (fallback === 'AGENCY_DEV' && businessDescription?.toLowerCase().includes('network')) {
                // Don't fall back to AGENCY_DEV for network businesses
                console.log(`[BM Pass 1] Skipping AGENCY_DEV fallback for network infrastructure business`);
                continue;
              }
              
              const { data: fallbackIndustry } = await supabaseClient
                .from('industries')
                .select('code, name')
                .eq('code', fallback)
                .eq('is_active', true)
                .maybeSingle();
              
              if (fallbackIndustry) {
                console.log(`[BM Pass 1] Using fallback industry: ${fallback} (${fallbackIndustry.name})`);
                industryCode = fallback;
                break;
              }
            }
          }
        }
      }
      
      // If SIC mapping didn't work, try full context detection
      if (!industryCode || industryCode === 'undefined' || industryCode === 'null') {
        let sicCodes: string[] | null = null;
        
        if (sicCodeFromAssessment) {
          sicCodes = Array.isArray(sicCodeFromAssessment) ? sicCodeFromAssessment : [sicCodeFromAssessment];
          console.log('[BM Pass 1] SIC mapping failed, trying full context detection with SIC:', sicCodes);
        }
        
        // If not in assessment, try client data
        if (!sicCodes && engagement.client_id) {
          const { data: client } = await supabaseClient
            .from('practice_members')
            .select('sic_codes, metadata')
            .eq('id', engagement.client_id)
            .maybeSingle();
          
          // SIC codes might be in sic_codes column or metadata JSONB
          const clientSicCodes = client?.sic_codes || client?.metadata?.sic_codes;
          if (clientSicCodes) {
            sicCodes = Array.isArray(clientSicCodes) ? clientSicCodes : [clientSicCodes];
            console.log('[BM Pass 1] Found SIC codes from client:', sicCodes);
          }
        }
        
        // Attempt dynamic detection
        const detectedIndustryCode = await detectIndustryFromContext(
          supabaseClient,
          sicCodes,
          businessDescription
        );
        
        if (detectedIndustryCode) {
          console.log(`[BM Pass 1] Successfully detected industry code: ${detectedIndustryCode}`);
          industryCode = detectedIndustryCode;
        } else {
          console.error('[BM Pass 1] Could not detect industry code from context. Full assessment:', JSON.stringify(assessment, null, 2));
          throw new Error(`Industry code is required but not found in assessment and could not be determined from SIC codes or business description. engagementId: ${engagementId}. SIC code: ${sicCodes?.join(', ') || 'none'}, Business description: ${businessDescription ? 'present' : 'missing'}. Please ensure the assessment has an industry selected or the client has SIC codes/business description.`);
        }
      }
    }
    
    // Now fetch industry using the industry_code from assessment
    const { data: industry, error: industryError } = await supabaseClient
      .from('industries')
      .select('*')
      .eq('code', industryCode)
      .maybeSingle();
    
    if (industryError) {
      console.warn('[BM Pass 1] Warning: Failed to fetch industry:', industryError.message);
    }
    
    if (!industry) {
      console.warn('[BM Pass 1] Warning: Industry not found for code:', industryCode);
    }
    
    // Get client name
    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }
    
    // Extract assessment fields - they might be in responses JSONB or individual columns
    // Note: responses use bm_ prefix (e.g., bm_revenue_band, bm_employee_count)
    // Use industryCode we already validated above
    const rawAssessmentData = {
      industry_code: industryCode,
      revenue_band: assessment.revenue_band || assessment.responses?.revenue_band || assessment.responses?.bm_revenue_band,
      employee_count: assessment.employee_count || assessment.responses?.employee_count || assessment.responses?.bm_employee_count,
      location_type: assessment.location_type || assessment.responses?.location_type || assessment.responses?.bm_location_type,
      business_description: assessment.business_description || assessment.responses?.business_description || assessment.responses?.bm_business_description,
      performance_perception: assessment.performance_perception || assessment.responses?.performance_perception,
      current_tracking: assessment.current_tracking || assessment.responses?.current_tracking,
      comparison_method: assessment.comparison_method || assessment.responses?.comparison_method,
      suspected_underperformance: assessment.suspected_underperformance || assessment.responses?.suspected_underperformance,
      leaving_money: assessment.leaving_money || assessment.responses?.leaving_money,
      top_quartile_ambition: assessment.top_quartile_ambition || assessment.responses?.top_quartile_ambition,
      competitor_envy: assessment.competitor_envy || assessment.responses?.competitor_envy,
      benchmark_magic_fix: assessment.benchmark_magic_fix || assessment.responses?.benchmark_magic_fix,
      action_readiness: assessment.action_readiness || assessment.responses?.action_readiness,
      blind_spot_fear: assessment.blind_spot_fear || assessment.responses?.blind_spot_fear,
      responses: assessment.responses, // Keep full responses for enrichment
    };
    
    // Get HVA data first (needed for enrichment)
    const { data: hvaData } = await supabaseClient
      .from('client_assessments')
      .select('responses, value_analysis_data')
      .eq('client_id', engagement.client_id)
      .eq('assessment_type', 'part3')
      .maybeSingle();
    
    // Get uploaded financial data if available
    // Priority: confirmed > extracted with high confidence > any extracted
    let uploadedFinancialData = null;
    try {
      // First try confirmed data
      const { data: confirmedData } = await supabaseClient
        .from('client_financial_data')
        .select('*')
        .eq('client_id', engagement.client_id)
        .not('confirmed_at', 'is', null)
        .order('fiscal_year', { ascending: false })
        .limit(3);
      
      if (confirmedData && confirmedData.length > 0) {
        uploadedFinancialData = confirmedData;
        console.log('[BM Pass 1] Found CONFIRMED accounts data:', {
          years: confirmedData.map(f => f.fiscal_year),
          latestRevenue: confirmedData[0].revenue,
          dataSource: 'confirmed_accounts'
        });
      } else {
        // Fall back to unconfirmed but high-confidence extracted data
        const { data: extractedData } = await supabaseClient
          .from('client_financial_data')
          .select('*')
          .eq('client_id', engagement.client_id)
          .gte('confidence_score', 0.7)  // At least 70% confidence
          .order('fiscal_year', { ascending: false })
          .limit(3);
        
        if (extractedData && extractedData.length > 0) {
          uploadedFinancialData = extractedData;
          console.log('[BM Pass 1] Found EXTRACTED accounts data (unconfirmed, high confidence):', {
            years: extractedData.map(f => f.fiscal_year),
            latestRevenue: extractedData[0].revenue,
            confidence: extractedData[0].confidence_score,
            dataSource: 'extracted_accounts'
          });
        }
      }
    } catch (finErr) {
      console.log('[BM Pass 1] No uploaded accounts data (table may not exist yet)');
    }
    
    // ENRICH DATA: Calculate derived metrics (using uploaded accounts if available)
    const assessmentData = enrichBenchmarkData(rawAssessmentData, hvaData, uploadedFinancialData);
    
    console.log('[BM Pass 1] Data enrichment complete:', {
      derived_fields: assessmentData.derived_fields,
      revenue: assessmentData._enriched_revenue,
      employee_count: assessmentData._enriched_employee_count,
      revenue_per_employee: assessmentData.revenue_per_employee,
      gross_margin: assessmentData.gross_margin,
      client_concentration: assessmentData.client_concentration_top3
    });
    
    // Calculate employee band for benchmark lookup
    const employeeBand = calculateEmployeeBand(assessmentData._enriched_employee_count || assessmentData.employee_count || 0);
    
    // ═══════════════════════════════════════════════════════════════
    // LIVE BENCHMARK REFRESH: Always check for fresh data on benchmarking service
    // ═══════════════════════════════════════════════════════════════
    
    // Get industry name for live search
    let industryNameForSearch = industry?.name || assessmentData.industry_code;
    
    // Check if benchmarks need refreshing (always refresh for benchmarking service line)
    console.log('[BM Pass 1] Checking benchmark data freshness for:', assessmentData.industry_code);
    
    try {
      // Call fetch-industry-benchmarks to refresh if needed
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && serviceRoleKey) {
        const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-industry-benchmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({
            industryCode: assessmentData.industry_code,
            industryName: industryNameForSearch,
            revenueBand: assessmentData.revenue_band,
            employeeBand: employeeBand,
            forceRefresh: false, // Let the function check cache freshness (30 days)
            triggeredBy: 'benchmarking_service',
            engagementId: engagementId
          })
        });
        
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          console.log('[BM Pass 1] Benchmark refresh result:', {
            source: refreshResult.source,
            metricsCount: refreshResult.metricCount,
            updated: refreshResult.metricsUpdated,
            created: refreshResult.metricsCreated,
            confidence: refreshResult.confidenceScore
          });
          
          if (refreshResult.source === 'live_search') {
            console.log('[BM Pass 1] Fresh benchmark data fetched from live search');
            console.log('[BM Pass 1] Sources:', refreshResult.sources?.slice(0, 3));
          }
        } else {
          console.warn('[BM Pass 1] Benchmark refresh failed, using existing data:', refreshResponse.status);
        }
      }
    } catch (refreshError) {
      // Non-fatal: continue with existing benchmark data
      console.warn('[BM Pass 1] Benchmark refresh error (continuing with existing data):', refreshError);
    }
    
    // Get benchmarks for this industry/size (now potentially refreshed)
    const { data: benchmarks } = await supabaseClient
      .from('benchmark_data')
      .select(`
        *,
        benchmark_metrics (*)
      `)
      .eq('industry_code', assessmentData.industry_code)
      .or(`revenue_band.eq.${assessmentData.revenue_band},revenue_band.eq.all`)
      .or(`employee_band.eq.${employeeBand},employee_band.eq.all`)
      .eq('is_current', true);
    
    // Log benchmark data sources for transparency
    if (benchmarks && benchmarks.length > 0) {
      const liveSearchCount = benchmarks.filter((b: any) => b.fetched_via === 'live_search').length;
      const manualCount = benchmarks.filter((b: any) => b.fetched_via === 'manual' || !b.fetched_via).length;
      console.log(`[BM Pass 1] Using ${benchmarks.length} benchmarks (${liveSearchCount} from live search, ${manualCount} from static data)`);
    } else {
      console.warn('[BM Pass 1] No benchmark data found for industry:', assessmentData.industry_code);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HVA INTEGRATION: Extract metrics, calculate risk, extract quotes
    // ═══════════════════════════════════════════════════════════════
    
    let hvaMetricsForBenchmarking: Record<string, number> = {};
    let founderRisk: any = null;
    let hvaQuotes: any[] = [];
    let hvaContextSection = '';
    
    if (hvaData) {
      // Extract benchmarkable metrics from HVA
      hvaMetricsForBenchmarking = extractHVAMetrics(hvaData);
      console.log('[BM Pass 1] Extracted HVA metrics:', Object.keys(hvaMetricsForBenchmarking));
      
      // Calculate founder risk score
      founderRisk = calculateFounderRisk(hvaData);
      console.log('[BM Pass 1] Founder risk calculated:', {
        score: founderRisk.overallScore,
        level: founderRisk.riskLevel,
        valuationImpact: founderRisk.valuationImpact
      });
      
      // Extract narrative quotes
      hvaQuotes = extractNarrativeQuotes(hvaData);
      console.log('[BM Pass 1] Extracted narrative quotes:', hvaQuotes.length);
      
      // Build HVA context section for prompt
      const founderRiskSection = `
**Overall Risk Level**: ${founderRisk.riskLevel.toUpperCase()} (Score: ${founderRisk.overallScore}/100)
**Valuation Impact**: ${founderRisk.valuationImpact}

**Key Risk Factors**:
${founderRisk.riskFactors.slice(0, 5).map((f: any) => 
  `- [${f.severity.toUpperCase()}] ${f.signal}`
).join('\n')}
`;

      const successionSection = `
**Readiness**: ${founderRisk.successionReadiness.overallReadiness}
**Time to Ready**: ${founderRisk.successionReadiness.timeToReady}
**Role Gaps**: ${founderRisk.successionReadiness.roleGaps.join(', ') || 'None identified'}
**Ready Roles**: ${founderRisk.successionReadiness.readyRoles.join(', ') || 'None ready'}
`;

      const quotesSection = formatQuotesForPrompt(hvaQuotes);
      
      const hvaMetricsText = Object.entries(hvaMetricsForBenchmarking)
        .map(([code, value]) => `- ${code}: ${value}%`)
        .join('\n');
      
      hvaContextSection = `
## HVA CONTEXT DATA

The client has completed a Hidden Value Audit which provides rich qualitative context. 
Use this data to:
1. Ground your narrative in their specific situation
2. Validate/challenge their self-perceptions with benchmark data
3. Quote their exact words when describing concerns or goals
4. Address their stated fears directly in the executive summary

### Founder Risk Assessment
${founderRiskSection}

### Succession Readiness
${successionSection}

### Client Quotes
${quotesSection}

### Additional HVA Metrics
${hvaMetricsText || 'No additional metrics available'}

## NARRATIVE REQUIREMENTS

When writing narratives:
1. If client stated a fear (e.g., "we're busy but not efficient"), ADDRESS IT DIRECTLY with benchmark evidence
2. If client identified a gap (e.g., "we undercharge"), VALIDATE OR CHALLENGE with data
3. Reference specific HVA percentages (e.g., "with ${founderRisk.riskFactors.find((f: any) => f.hvaField === 'knowledge_dependency_percentage')?.hvaValue || 'X'}% of knowledge concentrated in the founder...")
4. Use verbatim quotes where they add authenticity (e.g., "As you noted, 'we still rely on founder-led sales'")
5. Connect benchmark gaps to founder risk factors where relevant
`;
    }
    
    // Merge HVA metrics into enriched data
    Object.assign(assessmentData, hvaMetricsForBenchmarking);
    if (Object.keys(hvaMetricsForBenchmarking).length > 0) {
      console.log('[BM Pass 1] Merged HVA metrics into assessment data');
    }
    
    // Get MA data if available
    const { data: maData } = await supabaseClient
      .from('ma_reports')
      .select('*')
      .eq('client_id', engagement.client_id)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Build and send prompt
    console.log('[BM Pass 1] Calling Sonnet for extraction...');
    const startTime = Date.now();
    
    const prompt = buildPass1Prompt(
      assessmentData,
      benchmarks || [],
      maData,
      hvaContextSection,
      clientName,
      industry || {}
    );
    
    // Single attempt with timeout - retries eat into the 30s function limit
    console.log(`[BM Pass 1] Calling Claude API...`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
    
    let result: any = null;
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }
      
      result = await response.json();
      console.log(`[BM Pass 1] Claude API response received`);
      
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[BM Pass 1] Claude API failed:`, errorMessage);
      throw new Error(`Failed to get response from Claude: ${errorMessage}`);
    }
    
    let content = result.choices[0].message.content;
    
    // Strip markdown code blocks if present (```json ... ```)
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ```
      content = content.replace(/^```(?:json)?\n?/i, '');
      // Remove closing ```
      content = content.replace(/\n?```$/i, '');
      content = content.trim();
    }
    
    const pass1Data = JSON.parse(content);
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.003; // Approximate cost for Sonnet 4
    const generationTime = Date.now() - startTime;
    
    console.log('[BM Pass 1] Extraction complete. Tokens:', tokensUsed, 'Cost: £', cost.toFixed(4));
    
    // Calculate employee band
    const calculatedEmployeeBand = calculateEmployeeBand(assessmentData.employee_count || 0);
    
    // Use the validated industry_code from assessment (we've already validated it exists above)
    // The LLM shouldn't change the industry code - it's determined by the assessment
    const finalIndustryCode = assessmentData.industry_code;
    
    console.log('[BM Pass 1] Using industry_code for report:', finalIndustryCode);
    
    // Double-check it's valid (should never happen given validation above, but safety check)
    if (!finalIndustryCode || typeof finalIndustryCode !== 'string' || finalIndustryCode.trim() === '') {
      throw new Error(`Invalid industry_code: ${finalIndustryCode}. This should have been caught earlier.`);
    }
    
    // ==========================================================================
    // INJECT ADDITIONAL RISK FLAGS (concentration, founder risk)
    // ==========================================================================
    const additionalRiskFlags: any[] = [];
    
    // Client Concentration Risk
    const concentration = assessmentData.client_concentration_top3;
    if (concentration && concentration >= 75) {
      const revenue = assessmentData._enriched_revenue || 0;
      const riskAtStake = revenue * (concentration / 100) / 3;
      
      additionalRiskFlags.push({
        flag: `CRITICAL: ${concentration}% customer concentration`,
        severity: concentration >= 90 ? 'critical' : 'high',
        mitigation: 'Urgent diversification strategy needed. This concentration significantly impacts business value and exit options.',
        warningSignsInConversation: 'Any mention of client contract renewals, relationship changes, or budget pressures from major clients',
        annualRiskValue: riskAtStake,
        valuationImpact: concentration >= 90 ? '30-40% valuation discount' : '20-30% valuation discount',
        details: `Loss of one major client = £${(riskAtStake / 1000000).toFixed(1)}M at risk`
      });
      console.log(`[BM Pass 1] Added concentration risk flag: ${concentration}%, £${(riskAtStake / 1000000).toFixed(1)}M at risk`);
    }
    
    // Founder Dependency Risk (from HVA)
    if (founderRisk && (founderRisk.riskLevel === 'CRITICAL' || founderRisk.riskLevel === 'HIGH')) {
      additionalRiskFlags.push({
        flag: `Founder dependency: ${founderRisk.riskLevel}`,
        severity: founderRisk.riskLevel === 'CRITICAL' ? 'critical' : 'high',
        mitigation: 'Succession planning and knowledge transfer needed before any exit consideration.',
        warningSignsInConversation: 'Client mentions being essential to operations, key relationships, or institutional knowledge',
        valuationImpact: founderRisk.valuationImpact,
        details: founderRisk.riskFactors?.join('; ') || 'High founder dependency detected'
      });
      console.log(`[BM Pass 1] Added founder risk flag: ${founderRisk.riskLevel}`);
    }
    
    // Merge additional flags into LLM-generated flags
    if (additionalRiskFlags.length > 0) {
      pass1Data.adminGuidance = pass1Data.adminGuidance || {};
      pass1Data.adminGuidance.riskFlags = [
        ...additionalRiskFlags,
        ...(pass1Data.adminGuidance.riskFlags || [])
      ];
      console.log(`[BM Pass 1] Total risk flags: ${pass1Data.adminGuidance.riskFlags.length}`);
    }
    
    // Save to database (including founder risk data if available)
    const reportData: any = {
      engagement_id: engagementId,
      industry_code: finalIndustryCode,
      status: 'pass1_complete',
      revenue_band: pass1Data.classification?.revenueBand || assessmentData.revenue_band,
      employee_band: calculatedEmployeeBand,
      metrics_comparison: pass1Data.metricsComparison,
      overall_percentile: pass1Data.overallPosition.percentile,
      strength_count: pass1Data.overallPosition.strengthCount,
      gap_count: pass1Data.overallPosition.gapCount,
      top_strengths: pass1Data.topStrengths,
      top_gaps: pass1Data.topGaps,
      total_annual_opportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
      opportunity_breakdown: pass1Data.opportunitySizing.breakdown,
      recommendations: pass1Data.recommendations,
      admin_opening_statement: pass1Data.adminGuidance.openingStatement,
      admin_talking_points: pass1Data.adminGuidance.talkingPoints,
      admin_questions_to_ask: pass1Data.adminGuidance.questionsToAsk,
      admin_data_collection_script: pass1Data.adminGuidance.dataCollectionScript,
      admin_next_steps: pass1Data.adminGuidance.nextSteps,
      admin_tasks: pass1Data.adminGuidance.tasks,
      admin_risk_flags: pass1Data.adminGuidance.riskFlags,
      admin_closing_script: pass1Data.adminGuidance.closingScript,
      pass1_data: pass1Data,
      llm_model: 'claude-sonnet-4',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      benchmark_data_as_of: new Date().toISOString().split('T')[0],
      // Rich source information for transparency
      data_sources: buildRichSourceData(benchmarks || []),
      // Balance sheet and trend data (new)
      balance_sheet: assessmentData.balance_sheet || null,
      financial_trends: assessmentData.financial_trends || null,
      investment_signals: assessmentData.investment_signals || null,
      historical_financials: assessmentData.historical_financials || null,
      current_ratio: assessmentData.current_ratio || null,
      quick_ratio: assessmentData.quick_ratio || null,
      cash_months: assessmentData.cash_months || null,
      creditor_days: assessmentData.creditor_days || null,
      benchmark_sources_detail: buildDetailedSourceData(benchmarks || []),
      // Surplus cash analysis (new)
      surplus_cash: assessmentData.surplus_cash || null
    };
    
    // Add founder risk data if available
    if (founderRisk) {
      reportData.founder_risk_level = founderRisk.riskLevel;
      reportData.founder_risk_score = founderRisk.overallScore;
      reportData.valuation_impact = founderRisk.valuationImpact;
      reportData.founder_risk_factors = founderRisk.riskFactors;
      reportData.succession_readiness = founderRisk.successionReadiness;
      console.log('[BM Pass 1] Added founder risk data to report');
    }
    
    const { data: report, error: saveError } = await supabaseClient
      .from('bm_reports')
      .upsert(reportData, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    if (saveError || !report) {
      throw saveError || new Error('Failed to save report');
    }
    
    // Save individual metric comparisons
    await supabaseClient.from('bm_metric_comparisons').delete().eq('engagement_id', engagementId);
    
    for (const [index, metric] of pass1Data.metricsComparison.entries()) {
      await supabaseClient.from('bm_metric_comparisons').insert({
        engagement_id: engagementId,
        metric_code: metric.metricCode,
        metric_name: metric.metricName,
        client_value: metric.clientValue,
        client_value_source: metric.clientValueSource,
        p25: metric.p25,
        p50: metric.p50,
        p75: metric.p75,
        percentile: metric.percentile,
        assessment: metric.assessment,
        vs_median: metric.vsMedian,
        vs_top_quartile: metric.vsTopQuartile,
        annual_impact: metric.annualImpact,
        impact_calculation: metric.impactCalculation,
        is_primary: metric.isPrimary,
        display_order: index
      });
    }
    
    // ==========================================================================
    // INSERT SUPPLEMENTARY METRICS (from Data Collection tab)
    // ==========================================================================
    const supplementaryMetrics: any[] = [];
    const revenue = assessmentData._enriched_revenue || 0;
    
    // Client Concentration (Top 3)
    // Check assessmentData (already enriched from responses) and also raw responses
    const clientConcentration = assessmentData.client_concentration_top3;
    if (clientConcentration) {
      // Parse numeric value from string if needed (e.g., "99%" or "99% - Boldyn, Capita, GSTT")
      const concentrationValue = typeof clientConcentration === 'string' 
        ? parseFloat(clientConcentration.replace(/[^0-9.]/g, '')) 
        : clientConcentration;
      
      if (concentrationValue && !isNaN(concentrationValue)) {
        const percentile = concentrationValue >= 90 ? 2 : concentrationValue >= 75 ? 10 : concentrationValue >= 50 ? 35 : 75;
        const atRisk = concentrationValue >= 75 ? (revenue * concentrationValue / 100 / 3) : 0;
        
        supplementaryMetrics.push({
          engagement_id: engagementId,
          metric_code: 'client_concentration_top3',
          metric_name: 'Client Concentration (Top 3)',
          client_value: concentrationValue,
          client_value_source: 'collected',
          p25: 60, p50: 40, p75: 20,  // Lower is better for concentration
          percentile: percentile,
          assessment: concentrationValue >= 75 ? 'bottom_10' : concentrationValue >= 50 ? 'below_median' : 'above_median',
          vs_median: concentrationValue - 40,
          vs_top_quartile: concentrationValue - 20,
          annual_impact: atRisk,
          impact_calculation: concentrationValue >= 75 
            ? `${concentrationValue}% from top 3 clients. Loss of one = £${(atRisk / 1000000).toFixed(1)}M at risk`
            : `${concentrationValue}% concentration is acceptable`,
          display_order: 50,
          is_primary: concentrationValue >= 75  // Flag as critical if high concentration
        });
        console.log(`[BM Pass 1] Added client concentration metric: ${concentrationValue}%`);
      }
    }
    
    // Project Margin
    const projectMargin = assessmentData.project_margin;
    if (projectMargin) {
      const marginValue = typeof projectMargin === 'string' 
        ? parseFloat(projectMargin.replace(/[^0-9.]/g, '')) 
        : projectMargin;
      
      if (marginValue && !isNaN(marginValue)) {
        supplementaryMetrics.push({
          engagement_id: engagementId,
          metric_code: 'project_margin',
          metric_name: 'Project Margin',
          client_value: marginValue,
          client_value_source: 'collected',
          p25: 15, p50: 25, p75: 40,
          percentile: marginValue < 15 ? 10 : marginValue < 25 ? 35 : marginValue < 40 ? 60 : 85,
          assessment: marginValue < 25 ? 'below_median' : 'above_median',
          vs_median: marginValue - 25,
          vs_top_quartile: marginValue - 40,
          annual_impact: 0,
          impact_calculation: `${marginValue}% project margin`,
          display_order: 51,
          is_primary: false
        });
        console.log(`[BM Pass 1] Added project margin metric: ${marginValue}%`);
      }
    }
    
    // Recurring Revenue Percentage
    const recurringRevenue = assessmentData.recurring_revenue_percentage;
    if (recurringRevenue) {
      const rrValue = typeof recurringRevenue === 'string' 
        ? parseFloat(recurringRevenue.replace(/[^0-9.]/g, '')) 
        : recurringRevenue;
      
      if (rrValue && !isNaN(rrValue)) {
        supplementaryMetrics.push({
          engagement_id: engagementId,
          metric_code: 'recurring_revenue_pct',
          metric_name: 'Recurring Revenue %',
          client_value: rrValue,
          client_value_source: 'collected',
          p25: 20, p50: 40, p75: 65,
          percentile: rrValue < 20 ? 15 : rrValue < 40 ? 35 : rrValue < 65 ? 60 : 85,
          assessment: rrValue < 40 ? 'below_median' : 'above_median',
          vs_median: rrValue - 40,
          vs_top_quartile: rrValue - 65,
          annual_impact: 0,
          impact_calculation: `${rrValue}% recurring revenue`,
          display_order: 52,
          is_primary: false
        });
        console.log(`[BM Pass 1] Added recurring revenue metric: ${rrValue}%`);
      }
    }
    
    // Insert supplementary metrics (delete existing first, then insert)
    if (supplementaryMetrics.length > 0) {
      // Delete any existing supplementary metrics for this engagement
      const metricCodes = supplementaryMetrics.map(m => m.metric_code);
      await supabaseClient
        .from('bm_metric_comparisons')
        .delete()
        .eq('engagement_id', engagementId)
        .in('metric_code', metricCodes);
      
      // Insert the new supplementary metrics
      const { error: suppError } = await supabaseClient
        .from('bm_metric_comparisons')
        .insert(supplementaryMetrics);
      
      if (suppError) {
        console.error('[BM Pass 1] Supplementary metrics insert error:', suppError);
      } else {
        console.log(`[BM Pass 1] Inserted ${supplementaryMetrics.length} supplementary metrics`);
      }
    }
    
    // Update engagement status
    await supabaseClient
      .from('bm_engagements')
      .update({ status: 'pass1_complete' })
      .eq('id', engagementId);
    
    console.log('[BM Pass 1] ✅ Report saved to database. Now triggering Pass 2...');
    
    // Trigger Pass 2 - fire and forget (don't await completion)
    // IMPORTANT: Must trigger BEFORE returning response, setTimeout is unreliable in edge functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[BM Pass 1] ❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY - cannot trigger Pass 2!');
    } else {
      // Fire-and-forget: Start the request but don't wait for response
      // This ensures the request is sent before the function returns
      const pass2Url = `${supabaseUrl}/functions/v1/generate-bm-report-pass2`;
      console.log(`[BM Pass 1] Calling Pass 2 at: ${pass2Url}`);
      
      try {
        const pass2Response = await fetch(pass2Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ engagementId })
        });
        
        if (!pass2Response.ok) {
          const errorText = await pass2Response.text();
          console.error('[BM Pass 1] ❌ Pass 2 trigger failed:', pass2Response.status, errorText);
        } else {
          console.log('[BM Pass 1] ✅ Pass 2 triggered successfully (response received)');
        }
      } catch (pass2Err) {
        console.error('[BM Pass 1] ❌ Failed to trigger Pass 2:', pass2Err);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        engagementId,
        status: 'pass1_complete',
        overallPercentile: pass1Data.overallPosition.percentile,
        totalOpportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
        strengthsCount: pass1Data.overallPosition.strengthCount,
        gapsCount: pass1Data.overallPosition.gapCount,
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BM Pass 1] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

