// =============================================================================
// VALUE CALCULATOR
// Calculates business valuation with HVA-based suppressors
// =============================================================================

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

export interface FinancialInputs {
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  ebitda: number;
  cash: number;
  employees: number;
  revenueGrowth?: number;
}

export interface HVAResponses {
  knowledge_dependency_percentage?: string | number;
  personal_brand_percentage?: string | number;
  top3_customer_revenue_percentage?: string | number;
  client_concentration_top3?: string | number;
  succession_your_role?: string;
  autonomy_strategy?: string;
  autonomy_sales?: string;
  autonomy_finance?: string;
  unique_methods_protection?: string;
  unique_methods?: string;
  critical_processes_undocumented?: string[];
  documentation_score?: string | number;
  recurring_revenue_percentage?: string | number;
  contract_backlog_months?: number;
  team_advocacy_percentage?: string | number;
  tech_stack_health_percentage?: string | number;
  employee_turnover_rate?: string | number;
  last_price_increase?: string;
  competitive_moat?: string[];
  [key: string]: any;
}

export interface SurplusCashData {
  surplusCash: number;
  supplierFundedWorkingCapital?: number;
}

export interface ValueSuppressor {
  id: string;
  name: string;
  category: 'founder_dependency' | 'concentration' | 'documentation' | 'succession' | 'trajectory' | 'recurring_revenue' | 'other';
  hvaField: string;
  hvaValue: string | number;
  evidence: string;
  discountPercent: { low: number; high: number };
  impactAmount: { low: number; high: number };
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediable: boolean;
  remediationService?: string;
  remediationTimeMonths?: number;
  talkingPoint?: string;
  questionToAsk?: string;
}

export interface ValueEnhancer {
  id: string;
  name: string;
  evidence: string;
  impact: 'premium_protection' | 'additive' | 'trajectory';
  value?: number;
}

export interface ValueAnalysis {
  asOfDate: string;
  baseline: {
    method: 'EBITDA' | 'Revenue' | 'SDE';
    ebitda: number;
    ebitdaMargin: number;
    multipleRange: { low: number; mid: number; high: number };
    baseValue: { low: number; mid: number; high: number };
    surplusCash: number;
    enterpriseValue: { low: number; mid: number; high: number };
    multipleJustification: string;
  };
  suppressors: ValueSuppressor[];
  aggregateDiscount: {
    percentRange: { low: number; mid: number; high: number };
    methodology: string;
  };
  currentMarketValue: { low: number; mid: number; high: number };
  valueGap: { low: number; mid: number; high: number };
  valueGapPercent: number;
  exitReadiness: {
    score: number;
    verdict: 'ready' | 'needs_work' | 'not_ready';
    blockers: string[];
    strengths: string[];
  };
  potentialValue: { low: number; mid: number; high: number };
  pathToValue: {
    timeframeMonths: number;
    recoverableValue: { low: number; mid: number; high: number };
    keyActions: string[];
  };
  enhancers: ValueEnhancer[];
}

// -----------------------------------------------------------------------------
// INDUSTRY MULTIPLES
// -----------------------------------------------------------------------------

const INDUSTRY_MULTIPLES: Record<string, { low: number; mid: number; high: number; factors: string[] }> = {
  'TELECOM_INFRA': { low: 4, mid: 5, high: 6, factors: ['Contract security', 'Customer concentration', 'Growth trajectory'] },
  'IT_SERVICES': { low: 5, mid: 7, high: 9, factors: ['Recurring revenue', 'Customer retention', 'IP/tooling'] },
  'IT_CONSULTING': { low: 4, mid: 6, high: 8, factors: ['Founder dependency', 'Customer relationships', 'Specialisation'] },
  'PROFESSIONAL_SERVICES': { low: 4, mid: 6, high: 8, factors: ['Recurring clients', 'Documentation', 'Team stability'] },
  'ACCOUNTING_SERVICES': { low: 5, mid: 7, high: 9, factors: ['Recurring fees', 'Customer tenure', 'Partner dependency'] },
  'LEGAL_SERVICES': { low: 5, mid: 6, high: 8, factors: ['Recurring matters', 'Specialisation', 'Partner dependency'] },
  'CONSTRUCTION': { low: 3, mid: 4, high: 5, factors: ['Contract backlog', 'Equipment assets', 'Key relationships'] },
  'ENGINEERING': { low: 4, mid: 5, high: 6, factors: ['IP/designs', 'Certifications', 'Customer contracts'] },
  'HEALTHCARE': { low: 6, mid: 8, high: 10, factors: ['Patient base', 'Location', 'Practitioner retention'] },
  'HEALTHCARE_SERVICES': { low: 5, mid: 7, high: 9, factors: ['Contracts', 'Accreditation', 'Staff stability'] },
  'MANUFACTURING': { low: 4, mid: 5, high: 7, factors: ['Equipment', 'Customer contracts', 'IP'] },
  'WHOLESALE_DISTRIBUTION': { low: 3, mid: 4, high: 5, factors: ['Customer relationships', 'Supplier terms', 'Inventory'] },
  'RETAIL_TRADE': { low: 2, mid: 3, high: 4, factors: ['Location', 'Brand', 'Customer loyalty'] },
  'HOSPITALITY': { low: 3, mid: 4, high: 6, factors: ['Location', 'Brand', 'Reviews'] },
  'MEDIA_CREATIVE': { low: 4, mid: 6, high: 8, factors: ['Recurring clients', 'IP/portfolio', 'Team retention'] },
  'EDUCATION_TRAINING': { low: 4, mid: 5, high: 7, factors: ['Course IP', 'Student retention', 'Accreditation'] },
  'SAAS_SOFTWARE': { low: 6, mid: 10, high: 15, factors: ['ARR growth', 'Churn rate', 'NRR'] },
  'ECOMMERCE': { low: 3, mid: 5, high: 7, factors: ['Brand', 'Customer database', 'Supply chain'] },
  'RECRUITMENT_STAFFING': { low: 3, mid: 5, high: 7, factors: ['Temp vs perm mix', 'Customer relationships', 'Candidate database'] },
  'DEFAULT': { low: 4, mid: 5, high: 6, factors: ['Industry benchmark', 'Profitability', 'Growth'] },
};

// -----------------------------------------------------------------------------
// MAIN CALCULATION FUNCTION
// -----------------------------------------------------------------------------

export function calculateValueAnalysis(
  financials: FinancialInputs,
  hvaResponses: HVAResponses,
  industryCode: string,
  surplusCash: SurplusCashData | null,
  concentrationFromAssessment?: number
): ValueAnalysis {
  console.log('[Value Calculator] Starting calculation for industry:', industryCode);
  
  // 1. Get industry multiples
  const multiples = INDUSTRY_MULTIPLES[industryCode] || INDUSTRY_MULTIPLES['DEFAULT'];
  
  // 2. Calculate or estimate EBITDA
  let ebitda = financials.ebitda;
  if (!ebitda || ebitda <= 0) {
    // Estimate from operating profit (add back ~5% for D&A)
    ebitda = financials.operatingProfit * 1.05;
  }
  if (!ebitda || ebitda <= 0) {
    // Estimate from net profit
    ebitda = financials.netProfit * 1.3;
  }
  
  const ebitdaMargin = financials.revenue > 0 ? (ebitda / financials.revenue) * 100 : 0;
  
  // 3. Calculate base value
  const baseValue = {
    low: ebitda * multiples.low,
    mid: ebitda * multiples.mid,
    high: ebitda * multiples.high,
  };
  
  // 4. Add surplus cash for enterprise value
  const surplus = surplusCash?.surplusCash || 0;
  const enterpriseValue = {
    low: baseValue.low + surplus,
    mid: baseValue.mid + surplus,
    high: baseValue.high + surplus,
  };
  
  console.log('[Value Calculator] Enterprise value (mid):', enterpriseValue.mid);
  
  // 5. Map HVA responses to value suppressors
  const suppressors = mapHVAToSuppressors(
    hvaResponses, 
    enterpriseValue.mid,
    concentrationFromAssessment
  );
  
  console.log('[Value Calculator] Identified suppressors:', suppressors.length);
  
  // 6. Calculate aggregate discount (handles overlapping factors)
  const aggregateDiscount = calculateAggregateDiscount(suppressors);
  
  // 7. Calculate current market value
  const currentMarketValue = {
    low: enterpriseValue.low * (1 - aggregateDiscount.percentRange.high / 100),
    mid: enterpriseValue.mid * (1 - aggregateDiscount.percentRange.mid / 100),
    high: enterpriseValue.high * (1 - aggregateDiscount.percentRange.low / 100),
  };
  
  // 8. Calculate value gap
  const valueGap = {
    low: enterpriseValue.low - currentMarketValue.high,
    mid: enterpriseValue.mid - currentMarketValue.mid,
    high: enterpriseValue.high - currentMarketValue.low,
  };
  
  const valueGapPercent = enterpriseValue.mid > 0 
    ? (valueGap.mid / enterpriseValue.mid) * 100 
    : 0;
  
  // 9. Calculate exit readiness
  const exitReadiness = calculateExitReadiness(hvaResponses, suppressors, financials);
  
  // 10. Calculate path to value
  const remediableSuppressors = suppressors.filter(s => s.remediable);
  const totalRemediableImpact = remediableSuppressors.reduce(
    (sum, s) => sum + (s.impactAmount.low + s.impactAmount.high) / 2,
    0
  );
  // Assume 70% recovery is realistic
  const potentialRecovery = totalRemediableImpact * 0.7;
  
  // 11. Identify value enhancers
  const enhancers = identifyEnhancers(financials, hvaResponses, industryCode, surplusCash);
  
  const result: ValueAnalysis = {
    asOfDate: new Date().toISOString(),
    baseline: {
      method: 'EBITDA',
      ebitda,
      ebitdaMargin,
      multipleRange: multiples,
      baseValue,
      surplusCash: surplus,
      enterpriseValue,
      multipleJustification: `${industryCode} industry standard for £${(financials.revenue / 1000000).toFixed(1)}M revenue business. Multiple factors: ${multiples.factors.join(', ')}.`,
    },
    suppressors,
    aggregateDiscount,
    currentMarketValue,
    valueGap,
    valueGapPercent,
    exitReadiness,
    potentialValue: {
      low: currentMarketValue.low + potentialRecovery * 0.5,
      mid: currentMarketValue.mid + potentialRecovery * 0.7,
      high: currentMarketValue.high + potentialRecovery * 0.9,
    },
    pathToValue: {
      timeframeMonths: 24,
      recoverableValue: {
        low: potentialRecovery * 0.5,
        mid: potentialRecovery * 0.7,
        high: potentialRecovery * 0.9,
      },
      keyActions: remediableSuppressors
        .slice(0, 5)
        .map(s => s.remediationService || `Address ${s.name}`),
    },
    enhancers,
  };
  
  console.log('[Value Calculator] Complete. Value gap:', valueGapPercent.toFixed(1) + '%');
  
  return result;
}

// -----------------------------------------------------------------------------
// HVA TO SUPPRESSORS MAPPING
// -----------------------------------------------------------------------------

function mapHVAToSuppressors(
  hva: HVAResponses, 
  baseValue: number,
  concentrationFromAssessment?: number
): ValueSuppressor[] {
  const suppressors: ValueSuppressor[] = [];
  
  // 1. Founder/Knowledge Dependency
  const knowledgeDep = parsePercentage(hva.knowledge_dependency_percentage);
  const personalBrand = parsePercentage(hva.personal_brand_percentage);
  
  if (knowledgeDep > 40 || personalBrand > 40) {
    const maxDep = Math.max(knowledgeDep, personalBrand);
    const severity: 'critical' | 'high' | 'medium' | 'low' = 
      maxDep > 70 ? 'critical' : maxDep > 50 ? 'high' : 'medium';
    
    const discountLow = maxDep > 70 ? 20 : maxDep > 50 ? 12 : 8;
    const discountHigh = maxDep > 70 ? 35 : maxDep > 50 ? 22 : 15;
    
    suppressors.push({
      id: 'founder_dependency',
      name: 'Founder Dependency',
      category: 'founder_dependency',
      hvaField: 'knowledge_dependency_percentage + personal_brand_percentage',
      hvaValue: `${knowledgeDep}% knowledge, ${personalBrand}% revenue`,
      evidence: `${knowledgeDep}% of operational knowledge concentrated in founder. ${personalBrand}% of revenue tied to personal relationships. Business cannot operate autonomously.`,
      discountPercent: { low: discountLow, high: discountHigh },
      impactAmount: { low: baseValue * discountLow / 100, high: baseValue * discountHigh / 100 },
      severity,
      remediable: true,
      remediationService: 'Goal Alignment Programme + Succession Planning',
      remediationTimeMonths: 18,
      talkingPoint: knowledgeDep > 60 
        ? `"Right now, you ARE the business. If you stepped away, ${knowledgeDep}% of the knowledge walks out the door. That's a 20-35% hit to what someone would pay you."`
        : `"There's work to do on reducing your day-to-day involvement. Buyers will see you as a risk until you can demonstrate the business runs without you."`,
      questionToAsk: 'If you had to take 3 months off tomorrow, what would fail first?',
    });
  }
  
  // 2. Customer Concentration
  const concentration = concentrationFromAssessment || 
                        parsePercentage(hva.top3_customer_revenue_percentage) ||
                        parsePercentage(hva.client_concentration_top3);
  
  if (concentration > 40) {
    const severity: 'critical' | 'high' | 'medium' | 'low' = 
      concentration > 80 ? 'critical' : concentration > 60 ? 'high' : 'medium';
    
    const discountLow = concentration > 80 ? 20 : concentration > 60 ? 12 : 6;
    const discountHigh = concentration > 90 ? 40 : concentration > 80 ? 30 : concentration > 60 ? 20 : 12;
    
    suppressors.push({
      id: 'customer_concentration',
      name: 'Customer Concentration',
      category: 'concentration',
      hvaField: 'top3_customer_revenue_percentage',
      hvaValue: concentration,
      evidence: `${concentration}% of revenue from top 3 clients. ${concentration > 80 ? 'Single client loss would be existential.' : 'Buyer will see this as high risk.'}`,
      discountPercent: { low: discountLow, high: discountHigh },
      impactAmount: { low: baseValue * discountLow / 100, high: baseValue * discountHigh / 100 },
      severity,
      remediable: true,
      remediationService: 'Revenue Diversification Programme',
      remediationTimeMonths: 24,
      talkingPoint: concentration > 80 
        ? `"${concentration}% from three clients isn't a customer base - it's a dependency. If ${concentration > 90 ? 'any one of them' : 'your biggest client'} walked, you're not selling a business anymore - you're selling a problem."`
        : `"Your top 3 clients at ${concentration}% is above the comfort zone for most buyers. They'll want to see a plan to diversify before they write a cheque."`,
      questionToAsk: 'When do your major contracts come up for renewal? What happens if one doesn\'t renew?',
    });
  }
  
  // 3. Undocumented IP & Processes
  const ipUnprotected = hva.unique_methods_protection === 'Not formally protected' ||
                        hva.unique_methods_protection === 'In my head';
  const hasUndocumentedProcesses = hva.critical_processes_undocumented && 
                                   Array.isArray(hva.critical_processes_undocumented) &&
                                   hva.critical_processes_undocumented.length > 2;
  const documentationScore = parsePercentage(hva.documentation_score);
  
  if (ipUnprotected || hasUndocumentedProcesses || documentationScore < 40) {
    suppressors.push({
      id: 'undocumented_ip',
      name: 'Undocumented IP & Processes',
      category: 'documentation',
      hvaField: 'unique_methods_protection + critical_processes_undocumented',
      hvaValue: hva.unique_methods_protection || `${hva.critical_processes_undocumented?.length || 0} undocumented processes`,
      evidence: 'Competitive advantages and key processes not formally documented or protected. Buyer cannot verify what they\'re acquiring.',
      discountPercent: { low: 5, high: 15 },
      impactAmount: { low: baseValue * 0.05, high: baseValue * 0.15 },
      severity: 'high',
      remediable: true,
      remediationService: 'Systems Audit + Process Documentation',
      remediationTimeMonths: 6,
      talkingPoint: '"When a buyer asks \'show me how the magic happens\', you need to hand them a playbook, not point at someone\'s head. Right now, your IP isn\'t an asset - it\'s a liability."',
      questionToAsk: 'If you had to train someone to do your top 3 money-making activities, what would you hand them?',
    });
  }
  
  // 4. Succession Gap
  const noSuccessor = hva.succession_your_role === 'Nobody' || 
                      hva.succession_your_role === 'Need to hire';
  const strategyFails = hva.autonomy_strategy === 'Would fail';
  const salesFails = hva.autonomy_sales === 'Would fail';
  
  if (noSuccessor || (strategyFails && salesFails)) {
    suppressors.push({
      id: 'succession_gap',
      name: 'No Succession Plan',
      category: 'succession',
      hvaField: 'succession_your_role + autonomy_strategy + autonomy_sales',
      hvaValue: hva.succession_your_role || 'Key functions fail without owner',
      evidence: 'No clear successor identified. Business cannot function strategically or commercially without owner. Buyer must essentially buy the owner.',
      discountPercent: { low: 8, high: 18 },
      impactAmount: { low: baseValue * 0.08, high: baseValue * 0.18 },
      severity: noSuccessor ? 'critical' : 'high',
      remediable: true,
      remediationService: 'Exit Readiness Programme',
      remediationTimeMonths: 24,
      talkingPoint: '"Right now, you can\'t sell this business - you\'d have to sell yourself with it. And buyers don\'t want to buy people who might leave."',
      questionToAsk: 'If you had to step back to 2 days a week in 12 months, what would need to change?',
    });
  }
  
  // 5. Low Recurring Revenue
  const recurring = parsePercentage(hva.recurring_revenue_percentage);
  const backlog = hva.contract_backlog_months || 0;
  
  if (recurring < 30 && backlog < 6) {
    suppressors.push({
      id: 'low_recurring',
      name: 'Low Revenue Predictability',
      category: 'recurring_revenue',
      hvaField: 'recurring_revenue_percentage + contract_backlog_months',
      hvaValue: `${recurring}% recurring, ${backlog}mo backlog`,
      evidence: `Only ${recurring}% recurring revenue with ${backlog} months forward visibility. High dependency on winning new business every period.`,
      discountPercent: { low: 5, high: 12 },
      impactAmount: { low: baseValue * 0.05, high: baseValue * 0.12 },
      severity: 'medium',
      remediable: true,
      remediationService: 'Revenue Model Optimisation',
      remediationTimeMonths: 12,
      talkingPoint: '"${recurring}% recurring means you\'re essentially starting from zero each year. Buyers pay premiums for predictability - they\'ll discount heavily for businesses that have to keep hunting."',
      questionToAsk: 'What would it take to get 30% of your revenue on annual retainers?',
    });
  }
  
  // 6. Revenue Decline (Trajectory)
  const revenueGrowth = hva.revenue_growth_yoy || 0;
  if (revenueGrowth < -10) {
    const severity: 'critical' | 'high' | 'medium' | 'low' = revenueGrowth < -25 ? 'critical' : 'high';
    suppressors.push({
      id: 'declining_trajectory',
      name: 'Declining Revenue',
      category: 'trajectory',
      hvaField: 'revenue_growth_yoy',
      hvaValue: `${revenueGrowth}% YoY`,
      evidence: `Revenue declined ${Math.abs(revenueGrowth)}% year-on-year. Buyers question whether the business model is still viable.`,
      discountPercent: { low: 10, high: 25 },
      impactAmount: { low: baseValue * 0.10, high: baseValue * 0.25 },
      severity,
      remediable: true,
      remediationService: 'Revenue Recovery Programme',
      remediationTimeMonths: 12,
      talkingPoint: '"A ${Math.abs(revenueGrowth)}% drop raises alarm bells. The first question every buyer will ask is \'what broke?\' You need a clear answer and evidence it\'s fixed."',
      questionToAsk: 'What caused the revenue decline and what\'s your confidence it\'s stabilised?',
    });
  }
  
  // 7. Team Instability
  const turnover = parsePercentage(hva.employee_turnover_rate);
  const teamAdvocacy = parsePercentage(hva.team_advocacy_percentage);
  
  if (turnover > 25 || teamAdvocacy < 40) {
    suppressors.push({
      id: 'team_instability',
      name: 'Team Instability',
      category: 'other',
      hvaField: 'employee_turnover_rate + team_advocacy_percentage',
      hvaValue: `${turnover}% turnover, ${teamAdvocacy}% advocacy`,
      evidence: `High staff turnover (${turnover}%) or low team advocacy (${teamAdvocacy}%). Institutional knowledge at risk. Buyer will factor in re-hiring costs.`,
      discountPercent: { low: 3, high: 10 },
      impactAmount: { low: baseValue * 0.03, high: baseValue * 0.10 },
      severity: turnover > 35 ? 'high' : 'medium',
      remediable: true,
      remediationService: 'Team Engagement Programme',
      remediationTimeMonths: 12,
      talkingPoint: '"Your team isn\'t just delivery resource - they\'re part of what a buyer is purchasing. High turnover or low engagement means the buyer is inheriting a problem, not an asset."',
      questionToAsk: 'If I asked your team anonymously whether they\'d recommend working here, what would they say?',
    });
  }
  
  return suppressors;
}

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

function parsePercentage(value: string | number | undefined | null): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  
  // Handle ranges like "61-80%" - take midpoint
  if (str.includes('-')) {
    const match = str.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
  }
  
  // Handle "Over X%" or "More than X%"
  if (str.toLowerCase().includes('over') || str.toLowerCase().includes('more than')) {
    const match = str.match(/(\d+)/);
    if (match) return parseInt(match[1]) + 10;
  }
  
  // Handle "Under X%" or "Less than X%"
  if (str.toLowerCase().includes('under') || str.toLowerCase().includes('less than')) {
    const match = str.match(/(\d+)/);
    if (match) return Math.max(0, parseInt(match[1]) - 5);
  }
  
  // Extract any number
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  
  return 0;
}

function calculateAggregateDiscount(suppressors: ValueSuppressor[]): { 
  percentRange: { low: number; mid: number; high: number }; 
  methodology: string;
} {
  if (suppressors.length === 0) {
    return { 
      percentRange: { low: 0, mid: 0, high: 0 }, 
      methodology: 'No significant value suppressors identified' 
    };
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...suppressors].sort((a, b) => 
    severityOrder[a.severity] - severityOrder[b.severity]
  );
  
  // Base discount from highest impact suppressor
  let baseLow = sorted[0].discountPercent.low;
  let baseHigh = sorted[0].discountPercent.high;
  
  // Add diminishing returns for additional suppressors
  // Second suppressor: 50% of its discount added
  // Third: 33%, Fourth: 25%, etc.
  let additionalLow = 0;
  let additionalHigh = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const weight = 1 / (i + 1); // 0.5, 0.33, 0.25...
    additionalLow += sorted[i].discountPercent.low * weight;
    additionalHigh += sorted[i].discountPercent.high * weight;
  }
  
  // Cap total discounts (a business is never worth 0)
  const totalLow = Math.min(baseLow + additionalLow, 60);
  const totalHigh = Math.min(baseHigh + additionalHigh, 75);
  
  const critical = suppressors.filter(s => s.severity === 'critical').length;
  const high = suppressors.filter(s => s.severity === 'high').length;
  
  return {
    percentRange: {
      low: Math.round(totalLow),
      mid: Math.round((totalLow + totalHigh) / 2),
      high: Math.round(totalHigh),
    },
    methodology: `Primary discount from ${sorted[0].name}${critical > 0 ? ` (${critical} critical)` : ''}, with incremental adjustments for ${suppressors.length - 1} additional factors using diminishing impact model.`,
  };
}

function calculateExitReadiness(
  hva: HVAResponses, 
  suppressors: ValueSuppressor[],
  financials: FinancialInputs
): {
  score: number;
  verdict: 'ready' | 'needs_work' | 'not_ready';
  blockers: string[];
  strengths: string[];
} {
  let score = 50; // Start neutral
  const blockers: string[] = [];
  const strengths: string[] = [];
  
  // Deduct for suppressors
  for (const s of suppressors) {
    if (s.severity === 'critical') {
      score -= 15;
      blockers.push(s.name);
    } else if (s.severity === 'high') {
      score -= 8;
      if (blockers.length < 5) blockers.push(s.name);
    } else if (s.severity === 'medium') {
      score -= 4;
    }
  }
  
  // Add for positive factors
  const documentationScore = parsePercentage(hva.documentation_score);
  if (documentationScore > 70) {
    score += 10;
    strengths.push('Good process documentation');
  }
  
  const recurring = parsePercentage(hva.recurring_revenue_percentage);
  if (recurring > 50) {
    score += 10;
    strengths.push('Strong recurring revenue');
  }
  
  const teamAdvocacy = parsePercentage(hva.team_advocacy_percentage);
  if (teamAdvocacy > 70) {
    score += 5;
    strengths.push('High team engagement');
  }
  
  // Financial health
  if (financials.revenue > 0 && financials.netProfit / financials.revenue > 0.1) {
    score += 8;
    strengths.push('Healthy profit margins');
  }
  
  // Competitive moat
  if (hva.competitive_moat && Array.isArray(hva.competitive_moat) && hva.competitive_moat.length >= 3) {
    score += 5;
    strengths.push('Multiple competitive advantages');
  }
  
  // Bound the score
  score = Math.max(0, Math.min(100, score));
  
  const verdict: 'ready' | 'needs_work' | 'not_ready' = 
    score >= 70 ? 'ready' : 
    score >= 40 ? 'needs_work' : 
    'not_ready';
  
  return { score, verdict, blockers, strengths };
}

function identifyEnhancers(
  financials: FinancialInputs, 
  hva: HVAResponses,
  industryCode: string,
  surplusCash: SurplusCashData | null
): ValueEnhancer[] {
  const enhancers: ValueEnhancer[] = [];
  
  // Strong cash position
  if (surplusCash && surplusCash.surplusCash > 500000) {
    enhancers.push({
      id: 'surplus_cash',
      name: 'Significant Surplus Cash',
      evidence: `£${(surplusCash.surplusCash / 1000000).toFixed(1)}M surplus above operating requirements`,
      impact: 'additive',
      value: surplusCash.surplusCash,
    });
  }
  
  // Revenue productivity
  const revPerEmployee = financials.employees > 0 
    ? financials.revenue / financials.employees 
    : 0;
  if (revPerEmployee > 350000) {
    enhancers.push({
      id: 'high_productivity',
      name: 'High Revenue per Employee',
      evidence: `£${(revPerEmployee / 1000).toFixed(0)}k per employee - indicates efficient operations`,
      impact: 'premium_protection',
    });
  }
  
  // Strong margins
  const netMargin = financials.revenue > 0 
    ? (financials.netProfit / financials.revenue) * 100 
    : 0;
  if (netMargin > 12) {
    enhancers.push({
      id: 'strong_margins',
      name: 'Above-Average Profitability',
      evidence: `${netMargin.toFixed(1)}% net margin demonstrates pricing power and operational efficiency`,
      impact: 'premium_protection',
    });
  }
  
  // High recurring revenue
  const recurring = parsePercentage(hva.recurring_revenue_percentage);
  if (recurring > 60) {
    enhancers.push({
      id: 'high_recurring',
      name: 'Strong Recurring Revenue',
      evidence: `${recurring}% recurring revenue provides predictability and reduces buyer risk`,
      impact: 'premium_protection',
    });
  }
  
  // Team advocacy
  const teamAdvocacy = parsePercentage(hva.team_advocacy_percentage);
  if (teamAdvocacy > 80) {
    enhancers.push({
      id: 'team_culture',
      name: 'Strong Team Culture',
      evidence: `${teamAdvocacy}% team advocacy score indicates engaged workforce that will stay through transition`,
      impact: 'premium_protection',
    });
  }
  
  // Documented competitive moat
  if (hva.competitive_moat && Array.isArray(hva.competitive_moat) && hva.competitive_moat.length >= 3) {
    if (hva.unique_methods_protection && !hva.unique_methods_protection.includes('Not formally')) {
      enhancers.push({
        id: 'protected_ip',
        name: 'Protected Competitive Advantages',
        evidence: `${hva.competitive_moat.length} documented competitive advantages with formal protection`,
        impact: 'premium_protection',
      });
    }
  }
  
  return enhancers;
}

