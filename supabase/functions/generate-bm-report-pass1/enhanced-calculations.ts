// =============================================================================
// ENHANCED CALCULATIONS MODULE
// Full transparency calculations for opportunity sizing, suppressors, and exit readiness
// =============================================================================

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CalculationStep {
  description: string;
  formula: string;
  values: Record<string, number | string>;
  result: number;
  unit: string;
}

export interface Assumption {
  name: string;
  value: string;
  rationale: string;
  source: 'industry_data' | 'client_data' | 'professional_judgement';
}

export interface Adjustment {
  name: string;
  factor: number;
  rationale: string;
}

export interface OpportunityCalculation {
  id: string;
  title: string;
  headlineValue: number;
  calculationType: 'margin_gap' | 'efficiency_gap' | 'pricing_gap' | 'cost_saving' | 'revenue_growth';
  calculation: {
    steps: CalculationStep[];
    assumptions: Assumption[];
    adjustments: Adjustment[];
    finalValue: number;
  };
  interpretation: {
    whatThisMeans: string;
    whyThisMatters: string;
    caveat: string;
  };
  pathToCapture: {
    fullCapture: string;
    realisticCapture: string;
    quickWin: string;
    timeframe: string;
  };
}

export interface EnhancedValueSuppressor {
  code: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  current: {
    value: string;
    metric: string;
    discountPercent: number;
    discountValue: number;
  };
  target: {
    value: string;
    metric: string;
    discountPercent: number;
    discountValue: number;
  };
  recovery: {
    valueRecoverable: number;
    percentageRecovery: number;
    timeframe: string;
  };
  evidence: string;
  whyThisDiscount: string;
  industryContext: string;
  pathToFix: {
    summary: string;
    steps: string[];
    investment: number;
    dependencies: string[];
  };
  fixable: boolean;
  category: 'concentration' | 'founder' | 'succession' | 'revenue_model' | 'governance' | 'other';
}

export interface ExitReadinessComponent {
  id: string;
  name: string;
  currentScore: number;
  maxScore: number;
  targetScore: number;
  gap: string;
  improvementActions: string[];
}

export interface ExitReadinessBreakdown {
  totalScore: number;
  maxScore: number;
  level: 'not_ready' | 'needs_work' | 'progressing' | 'credibly_ready' | 'exit_ready';
  levelLabel: string;
  components: ExitReadinessComponent[];
  pathTo70: {
    actions: string[];
    timeframe: string;
    investment: number;
    valueUnlocked: number;
  };
}

export interface TwoPathsNarrative {
  headline: string;
  explanation: string;
  ownerJourney: {
    year1: string;
    year2: string;
    year3: string;
  };
  bottomLine: string;
}

export interface SurplusCashBreakdown {
  actualCash: number;
  requiredCash: number;
  surplusCash: number;
  surplusAsPercentOfRevenue: number;
  components: {
    operatingBuffer: number;
    workingCapitalRequirement: number;
    staffCostsQuarterly: number;
    adminExpensesQuarterly: number;
    debtors: number;
    creditors: number;
    stock: number;
    netWorkingCapital: number;
  };
  methodology: string;
  confidence: 'high' | 'medium' | 'low';
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractNumericValue(text: string | number | null | undefined): number | null {
  if (text === null || text === undefined) return null;
  if (typeof text === 'number') return text;
  
  const str = String(text).trim();
  const percentMatch = str.match(/(\d+(?:\.\d+)?)\s*%?/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }
  return null;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
  return `£${value.toFixed(0)}`;
}

// =============================================================================
// OPPORTUNITY CALCULATION WITH FULL TRANSPARENCY
// =============================================================================

export function calculateMarginOpportunity(
  clientGrossMargin: number,
  medianGrossMargin: number,
  revenue: number,
  industryCode: string
): OpportunityCalculation {
  
  const marginGapPercent = medianGrossMargin - clientGrossMargin;
  const fullGapValue = (marginGapPercent / 100) * revenue;
  
  // Determine recovery factor based on industry
  const recoveryFactors: Record<string, { factor: number; rationale: string }> = {
    'TELECOM_INFRA': { 
      factor: 0.60, 
      rationale: 'Infrastructure delivery has structural margin constraints from hardware pass-through and subcontractor costs. 60% recovery assumes pricing discipline and project selection improvements.' 
    },
    'IT_SERVICES': { 
      factor: 0.75, 
      rationale: 'IT services margins more controllable through utilisation and rate improvements.' 
    },
    'CONSULTING': { 
      factor: 0.80, 
      rationale: 'Consulting margins primarily driven by utilisation and rate card.' 
    },
    'CONSTRUCTION': {
      factor: 0.55,
      rationale: 'Construction margins constrained by material costs and subcontractor pricing.'
    },
    'MANUFACTURING': {
      factor: 0.65,
      rationale: 'Manufacturing margins affected by input costs but improvable through efficiency.'
    },
    'PROFESSIONAL_SERVICES': {
      factor: 0.75,
      rationale: 'Professional services margins primarily driven by utilisation and pricing.'
    },
    'DEFAULT': { 
      factor: 0.70, 
      rationale: 'Standard recovery factor for mixed service delivery.' 
    }
  };
  
  const recovery = recoveryFactors[industryCode] || recoveryFactors['DEFAULT'];
  const addressableValue = Math.round(fullGapValue * recovery.factor);
  
  return {
    id: 'margin_opportunity',
    title: 'Margin Improvement Opportunity',
    headlineValue: addressableValue,
    calculationType: 'margin_gap',
    
    calculation: {
      steps: [
        {
          description: 'Your gross margin',
          formula: 'Gross Profit ÷ Revenue × 100',
          values: { grossMargin: clientGrossMargin },
          result: clientGrossMargin,
          unit: '%'
        },
        {
          description: 'Industry median gross margin',
          formula: 'P50 benchmark for your sector',
          values: { medianMargin: medianGrossMargin, sector: industryCode },
          result: medianGrossMargin,
          unit: '%'
        },
        {
          description: 'Margin gap',
          formula: 'Median - Your margin',
          values: { median: medianGrossMargin, yours: clientGrossMargin },
          result: marginGapPercent,
          unit: 'percentage points'
        },
        {
          description: 'Full gap value at your revenue',
          formula: 'Gap % × Revenue',
          values: { gap: marginGapPercent, revenue: revenue },
          result: fullGapValue,
          unit: '£'
        },
        {
          description: 'Realistically addressable (after structural constraints)',
          formula: 'Full gap × Recovery factor',
          values: { fullGap: fullGapValue, recoveryFactor: recovery.factor },
          result: addressableValue,
          unit: '£'
        }
      ],
      assumptions: [
        {
          name: 'Recovery Factor',
          value: `${(recovery.factor * 100).toFixed(0)}%`,
          rationale: recovery.rationale,
          source: 'professional_judgement'
        },
        {
          name: 'Benchmark Source',
          value: `${industryCode} sector median`,
          rationale: 'Based on UK industry data for comparable businesses',
          source: 'industry_data'
        }
      ],
      adjustments: [
        {
          name: 'Structural margin constraints',
          factor: recovery.factor,
          rationale: recovery.rationale
        }
      ],
      finalValue: addressableValue
    },
    
    interpretation: {
      whatThisMeans: `If you operated at the industry median margin, you'd generate an additional ${formatCurrency(fullGapValue)} annually. Realistically, ${formatCurrency(addressableValue)} of this is addressable given your business model.`,
      whyThisMatters: `This is recurring annual value. Over a 5-year hold, that's ${formatCurrency(addressableValue * 5)} in cumulative profit - or ${formatCurrency(addressableValue * 5 * 0.8)} in additional enterprise value at exit.`,
      caveat: `Not all margin gap is controllable. Some is structural to your delivery model. We've applied a ${(recovery.factor * 100).toFixed(0)}% recovery factor to account for this.`
    },
    
    pathToCapture: {
      fullCapture: `Reach industry median margin (${medianGrossMargin}%) through pricing discipline, project selection, and cost control.`,
      realisticCapture: `Capture ${(recovery.factor * 100).toFixed(0)}% of the gap (${formatCurrency(addressableValue)}) through targeted improvements.`,
      quickWin: 'Review all projects running below 15% margin this week. Flag for repricing or scope adjustment.',
      timeframe: '12-18 months to full capture'
    }
  };
}

// =============================================================================
// ENHANCED VALUE SUPPRESSORS
// =============================================================================

interface ValueSupressorInput {
  knowledgeDependency?: number;
  personalBrand?: number;
  customerConcentration?: number;
  successionPlan?: string;
  recurringRevenue?: number;
  contractBacklog?: number;
  documentationScore?: number;
}

export function calculateEnhancedSuppressors(
  inputs: ValueSupressorInput,
  baselineValue: number,
  revenue: number,
  industryCode: string
): EnhancedValueSuppressor[] {
  
  const suppressors: EnhancedValueSuppressor[] = [];
  
  // ==========================================================================
  // CONCENTRATION SUPPRESSOR
  // ==========================================================================
  const concentration = inputs.customerConcentration || 0;
  
  if (concentration >= 50) {
    const currentDiscount = concentration >= 90 ? 30 : concentration >= 75 ? 20 : 10;
    const targetDiscount = 10; // Assumes reduction to <60%
    const currentDiscountValue = baselineValue * (currentDiscount / 100);
    const targetDiscountValue = baselineValue * (targetDiscount / 100);
    
    const isInfra = ['TELECOM_INFRA', 'CONSTRUCTION', 'INFRASTRUCTURE'].includes(industryCode);
    
    suppressors.push({
      code: 'CONCENTRATION',
      name: 'Customer Concentration Risk',
      severity: concentration >= 90 ? 'CRITICAL' : concentration >= 75 ? 'HIGH' : 'MEDIUM',
      
      current: {
        value: `${concentration}%`,
        metric: 'from top 3 clients',
        discountPercent: currentDiscount,
        discountValue: currentDiscountValue
      },
      
      target: {
        value: '<60%',
        metric: 'from top 3 clients',
        discountPercent: targetDiscount,
        discountValue: targetDiscountValue
      },
      
      recovery: {
        valueRecoverable: currentDiscountValue - targetDiscountValue,
        percentageRecovery: Math.round(((currentDiscount - targetDiscount) / currentDiscount) * 100),
        timeframe: '18-24 months'
      },
      
      evidence: `${concentration}% of revenue comes from your top 3 clients. Loss of one major client would impact ${Math.round(concentration / 3)}%+ of revenue.`,
      
      whyThisDiscount: `Industry buyers apply ${currentDiscount - 5}-${currentDiscount + 5}% discounts for this level of concentration because it represents existential dependency risk. One procurement decision at a key client could eliminate a third of your revenue overnight.`,
      
      industryContext: isInfra 
        ? 'Infrastructure contractors typically have higher concentration than average due to framework agreements. However, 99% is extreme even for this sector.'
        : 'Most buyers want to see no single client above 15-20% of revenue.',
      
      pathToFix: {
        summary: 'Win 2-3 new clients at £2-5M each to reduce dependency',
        steps: [
          'Map 10 target prospects outside current top 3',
          'Hire or assign dedicated BD resource',
          'Develop framework bid pipeline',
          'Target adjacent sectors (hospitals, schools, transport)',
          'Consider M&A of complementary contractor'
        ],
        investment: 50000,
        dependencies: ['Capacity to deliver without compromising existing clients']
      },
      
      fixable: true,
      category: 'concentration'
    });
  }
  
  // ==========================================================================
  // FOUNDER DEPENDENCY SUPPRESSOR
  // ==========================================================================
  const kc = inputs.knowledgeDependency || 0;
  const pb = inputs.personalBrand || 0;
  const maxDep = Math.max(kc, pb);
  
  if (maxDep >= 40) {
    const currentDiscount = maxDep >= 70 ? 20 : maxDep >= 50 ? 12 : 8;
    const targetDiscount = 5; // Assumes founder becomes optional
    const currentDiscountValue = baselineValue * (currentDiscount / 100);
    const targetDiscountValue = baselineValue * (targetDiscount / 100);
    
    const evidenceParts: string[] = [];
    if (kc >= 40) evidenceParts.push(`${kc}% of critical knowledge in founder's head`);
    if (pb >= 40) evidenceParts.push(`${pb}% of revenue tied to founder relationships`);
    
    suppressors.push({
      code: 'FOUNDER_DEPENDENCY',
      name: 'Founder/Knowledge Dependency',
      severity: maxDep >= 70 ? 'CRITICAL' : maxDep >= 50 ? 'HIGH' : 'MEDIUM',
      
      current: {
        value: `${maxDep}%`,
        metric: 'dependent on founder',
        discountPercent: currentDiscount,
        discountValue: currentDiscountValue
      },
      
      target: {
        value: '<30%',
        metric: 'dependent on founder',
        discountPercent: targetDiscount,
        discountValue: targetDiscountValue
      },
      
      recovery: {
        valueRecoverable: currentDiscountValue - targetDiscountValue,
        percentageRecovery: Math.round(((currentDiscount - targetDiscount) / currentDiscount) * 100),
        timeframe: '12-24 months'
      },
      
      evidence: evidenceParts.join('. '),
      
      whyThisDiscount: `Buyers see founder dependency as continuity risk. If you leave, the business value walks out the door. This ${currentDiscount}% discount reflects the risk that key relationships and knowledge won't transfer.`,
      
      industryContext: "Common in founder-led businesses. The fix isn't about the founder leaving, it's about creating options.",
      
      pathToFix: {
        summary: 'Document critical knowledge and transition key relationships',
        steps: [
          'Hire or promote #2 (COO/GM role)',
          'Document top 20 critical processes',
          'Introduce #2 to key client relationships',
          'Gradually reduce founder involvement in operations',
          'Build management meeting cadence that runs without founder'
        ],
        investment: 75000,
        dependencies: ['Finding right successor candidate', 'Client acceptance of transition']
      },
      
      fixable: true,
      category: 'founder'
    });
  }
  
  // ==========================================================================
  // SUCCESSION SUPPRESSOR
  // ==========================================================================
  const successionPlan = (inputs.successionPlan || '').toLowerCase();
  const noSuccessor = successionPlan.includes('nobody') || 
                      successionPlan.includes('need to hire') ||
                      successionPlan === 'none' ||
                      successionPlan === '';
  
  if (noSuccessor) {
    // Don't double-count if we already have founder dependency
    const hasFounderDep = suppressors.some(s => s.code === 'FOUNDER_DEPENDENCY');
    const currentDiscount = hasFounderDep ? 8 : 12;
    const targetDiscount = 3;
    const currentDiscountValue = baselineValue * (currentDiscount / 100);
    const targetDiscountValue = baselineValue * (targetDiscount / 100);
    
    suppressors.push({
      code: 'SUCCESSION',
      name: 'No Succession Plan',
      severity: 'HIGH',
      
      current: {
        value: 'None',
        metric: 'succession plan',
        discountPercent: currentDiscount,
        discountValue: currentDiscountValue
      },
      
      target: {
        value: 'Clear successor',
        metric: 'identified and developing',
        discountPercent: targetDiscount,
        discountValue: targetDiscountValue
      },
      
      recovery: {
        valueRecoverable: currentDiscountValue - targetDiscountValue,
        percentageRecovery: Math.round(((currentDiscount - targetDiscount) / currentDiscount) * 100),
        timeframe: '24-36 months'
      },
      
      evidence: `Current succession plan: "${inputs.successionPlan || 'None'}". No clear path to owner optionality.`,
      
      whyThisDiscount: "Without a succession plan, buyers face key-person risk and transition uncertainty. They'll either discount the price or require earnouts tied to your continued involvement.",
      
      industryContext: "Most SME owners delay succession planning. Starting now gives you a 2-3 year runway to develop options.",
      
      pathToFix: {
        summary: 'Identify and develop successor within 24 months',
        steps: [
          'Define ideal successor profile',
          'Assess internal candidates vs. external hire',
          'Recruit if needed (6-12 months to find right person)',
          'Structured handover plan (12-24 months)',
          'Board or advisory oversight of transition'
        ],
        investment: 100000,
        dependencies: ['Finding right candidate', 'Owner commitment to transition']
      },
      
      fixable: true,
      category: 'succession'
    });
  }
  
  // ==========================================================================
  // REVENUE PREDICTABILITY SUPPRESSOR
  // ==========================================================================
  const rr = inputs.recurringRevenue ?? 0;
  const cb = inputs.contractBacklog ?? 0;
  
  if (rr < 40 || cb < 6) {
    const currentDiscount = rr < 20 ? 12 : rr < 40 ? 8 : 5;
    const targetDiscount = 4;
    const currentDiscountValue = baselineValue * (currentDiscount / 100);
    const targetDiscountValue = baselineValue * (targetDiscount / 100);
    
    const evidenceParts: string[] = [];
    if (rr < 40) evidenceParts.push(`Only ${rr}% recurring revenue`);
    if (cb < 6) evidenceParts.push(`${cb} months of contracted backlog`);
    
    suppressors.push({
      code: 'REVENUE_PREDICTABILITY',
      name: 'Low Revenue Predictability',
      severity: rr < 20 ? 'HIGH' : 'MEDIUM',
      
      current: {
        value: `${rr}%`,
        metric: 'recurring revenue',
        discountPercent: currentDiscount,
        discountValue: currentDiscountValue
      },
      
      target: {
        value: '>40%',
        metric: 'recurring revenue',
        discountPercent: targetDiscount,
        discountValue: targetDiscountValue
      },
      
      recovery: {
        valueRecoverable: currentDiscountValue - targetDiscountValue,
        percentageRecovery: Math.round(((currentDiscount - targetDiscount) / currentDiscount) * 100),
        timeframe: '12-18 months'
      },
      
      evidence: evidenceParts.join('. ') + '. Business starts from near-zero each year.',
      
      whyThisDiscount: "Buyers pay more for predictable revenue streams. Project-based businesses trade at lower multiples than recurring revenue businesses because next year's revenue is uncertain.",
      
      industryContext: 'Infrastructure contractors typically have lower recurring revenue than IT services. Framework agreements can provide predictability even without subscription models.',
      
      pathToFix: {
        summary: 'Improve contract terms and build framework pipeline',
        steps: [
          'Extend contract terms on renewals (target 2+ years)',
          'Build maintenance/support revenue stream',
          'Pursue multi-year framework agreements',
          'Add retainer elements to project relationships',
          'Create service level agreements with recurring fees'
        ],
        investment: 25000,
        dependencies: ['Client willingness to commit longer term']
      },
      
      fixable: true,
      category: 'revenue_model'
    });
  }
  
  console.log(`[Enhanced Suppressors] Generated ${suppressors.length} enhanced suppressors`);
  suppressors.forEach(s => {
    console.log(`  - ${s.code}: ${s.current.discountPercent}% discount, ${formatCurrency(s.recovery.valueRecoverable)} recoverable`);
  });
  
  return suppressors;
}

// =============================================================================
// EXIT READINESS BREAKDOWN
// =============================================================================

export function calculateExitReadinessBreakdown(
  enhancedSuppressors: EnhancedValueSuppressor[],
  inputs: ValueSupressorInput,
  baselineValue: number
): ExitReadinessBreakdown {
  
  const components: ExitReadinessComponent[] = [];
  
  // 1. Customer Concentration (25 points)
  const concentrationSuppressor = enhancedSuppressors.find(s => s.code === 'CONCENTRATION');
  const concentration = inputs.customerConcentration || 0;
  
  let concentrationScore = 25;
  if (concentration >= 90) concentrationScore = 5;
  else if (concentration >= 75) concentrationScore = 10;
  else if (concentration >= 60) concentrationScore = 15;
  else if (concentration >= 40) concentrationScore = 20;
  
  components.push({
    id: 'concentration',
    name: 'Customer Concentration',
    currentScore: concentrationScore,
    maxScore: 25,
    targetScore: 20,
    gap: concentration >= 60 ? 'Win 2-3 new clients' : 'Maintain diversification',
    improvementActions: [
      'Identify 10 target prospects',
      'Hire BD resource',
      'Develop framework bid pipeline'
    ]
  });
  
  // 2. Founder Dependency (25 points)
  const founderSuppressor = enhancedSuppressors.find(s => s.code === 'FOUNDER_DEPENDENCY');
  const founderDep = Math.max(inputs.knowledgeDependency || 0, inputs.personalBrand || 0);
  
  let founderScore = 25;
  if (founderDep >= 70) founderScore = 5;
  else if (founderDep >= 50) founderScore = 10;
  else if (founderDep >= 30) founderScore = 18;
  
  components.push({
    id: 'founder',
    name: 'Founder Dependency',
    currentScore: founderScore,
    maxScore: 25,
    targetScore: 15,
    gap: founderDep >= 50 ? 'Hire #2, document processes' : 'Continue transition',
    improvementActions: [
      'Hire or promote COO/GM',
      'Document top 20 processes',
      'Transition key relationships'
    ]
  });
  
  // 3. Revenue Predictability (20 points)
  const recurringPct = inputs.recurringRevenue || 0;
  
  let revenueScore = 20;
  if (recurringPct < 20) revenueScore = 5;
  else if (recurringPct < 40) revenueScore = 10;
  else if (recurringPct < 60) revenueScore = 15;
  
  components.push({
    id: 'revenue',
    name: 'Revenue Predictability',
    currentScore: revenueScore,
    maxScore: 20,
    targetScore: 15,
    gap: recurringPct < 40 ? 'Extend contract terms' : 'Good position',
    improvementActions: [
      'Negotiate longer contract terms',
      'Add maintenance/support revenue',
      'Build framework pipeline'
    ]
  });
  
  // 4. Management Team (15 points)
  const successionPlan = (inputs.successionPlan || '').toLowerCase();
  const noSuccessor = successionPlan.includes('nobody') || 
                      successionPlan.includes('need to hire') ||
                      successionPlan === 'none' ||
                      successionPlan === '';
  
  let managementScore = 15;
  if (noSuccessor) {
    managementScore = 5;
  } else if (successionPlan.includes('developing')) {
    managementScore = 10;
  }
  
  components.push({
    id: 'management',
    name: 'Management Team',
    currentScore: managementScore,
    maxScore: 15,
    targetScore: 10,
    gap: managementScore < 10 ? 'Build leadership bench' : 'Develop team',
    improvementActions: [
      'Hire senior leader',
      'Develop internal talent',
      'Create leadership meeting cadence'
    ]
  });
  
  // 5. Documentation (15 points)
  const docScore = inputs.documentationScore || 0;
  
  let documentationPoints = 15;
  if (docScore < 30) documentationPoints = 5;
  else if (docScore < 60) documentationPoints = 10;
  
  components.push({
    id: 'documentation',
    name: 'Documentation',
    currentScore: documentationPoints,
    maxScore: 15,
    targetScore: 10,
    gap: documentationPoints < 10 ? 'Document key processes' : 'Maintain documentation',
    improvementActions: [
      'Map critical processes',
      'Create operations manual',
      'Implement knowledge base'
    ]
  });
  
  // Calculate total
  const totalScore = components.reduce((sum, c) => sum + c.currentScore, 0);
  const maxScore = components.reduce((sum, c) => sum + c.maxScore, 0);
  
  // Determine level
  let level: ExitReadinessBreakdown['level'];
  let levelLabel: string;
  
  if (totalScore >= 80) {
    level = 'exit_ready';
    levelLabel = 'Exit Ready';
  } else if (totalScore >= 65) {
    level = 'credibly_ready';
    levelLabel = 'Credibly Ready';
  } else if (totalScore >= 50) {
    level = 'progressing';
    levelLabel = 'Progressing';
  } else if (totalScore >= 35) {
    level = 'needs_work';
    levelLabel = 'Needs Work';
  } else {
    level = 'not_ready';
    levelLabel = 'Not Exit Ready';
  }
  
  // Calculate path to 70
  const potentialRecovery = enhancedSuppressors.reduce((sum, s) => sum + s.recovery.valueRecoverable, 0);
  
  // Build actions based on biggest gaps
  const sortedComponents = [...components].sort((a, b) => 
    (b.targetScore - b.currentScore) - (a.targetScore - a.currentScore)
  );
  
  const actions = sortedComponents
    .filter(c => c.currentScore < c.targetScore)
    .slice(0, 4)
    .map(c => `${c.gap} (+${c.targetScore - c.currentScore} points)`);
  
  console.log(`[Exit Readiness] Score: ${totalScore}/${maxScore} (${levelLabel})`);
  
  return {
    totalScore,
    maxScore,
    level,
    levelLabel,
    components,
    pathTo70: {
      actions,
      timeframe: '18-24 months',
      investment: 150000,
      valueUnlocked: potentialRecovery * 0.7
    }
  };
}

// =============================================================================
// TWO PATHS NARRATIVE GENERATOR
// =============================================================================

export function generateTwoPathsNarrative(
  marginOpportunity: number,
  valueGap: number,
  ownerName: string,
  exitReadinessScore: number,
  targetExitValue: number
): TwoPathsNarrative {
  
  const marginFormatted = formatCurrency(marginOpportunity);
  const valueGapFormatted = formatCurrency(valueGap);
  const targetValueFormatted = formatCurrency(targetExitValue);
  
  return {
    headline: 'Two opportunities. One destination.',
    
    explanation: `The ${marginFormatted} margin opportunity and ${valueGapFormatted} value gap aren't competing priorities—they're connected. Improving margins funds your diversification. Diversification reduces concentration risk. Reduced risk unlocks trapped value. Every pound of margin improvement accelerates your path to optionality.`,
    
    ownerJourney: {
      year1: `Capture ${formatCurrency(marginOpportunity * 0.5)} of margin improvement. Hire BD lead. Win first 2 new clients.`,
      year2: `Hire COO. Reduce concentration to 70%. Document key processes.`,
      year3: `Exit-ready at ${targetValueFormatted}. Option to sell, scale, or step back.`
    },
    
    bottomLine: exitReadinessScore < 50 
      ? `Every pound of margin improvement funds your path to optionality. The question isn't which to pursue—it's how fast you want to move.`
      : `You're closer than you think. Focus on the operational improvements and the strategic value will follow.`
  };
}

// =============================================================================
// SURPLUS CASH BREAKDOWN FORMATTER
// =============================================================================

export function formatSurplusCashBreakdown(
  surplusCashData: any,
  revenue: number
): SurplusCashBreakdown | null {
  if (!surplusCashData || !surplusCashData.hasData) return null;
  
  return {
    actualCash: surplusCashData.actualCash || 0,
    requiredCash: surplusCashData.requiredCash || 0,
    surplusCash: surplusCashData.surplusCash || 0,
    surplusAsPercentOfRevenue: surplusCashData.surplusAsPercentOfRevenue || 0,
    components: {
      operatingBuffer: surplusCashData.components?.operatingBuffer || 0,
      workingCapitalRequirement: surplusCashData.components?.workingCapitalRequirement || 0,
      staffCostsQuarterly: surplusCashData.components?.staffCostsQuarterly || 0,
      adminExpensesQuarterly: surplusCashData.components?.adminExpensesQuarterly || 0,
      debtors: surplusCashData.components?.debtors || 0,
      creditors: surplusCashData.components?.creditors || 0,
      stock: surplusCashData.components?.stock || 0,
      netWorkingCapital: surplusCashData.components?.netWorkingCapital || 0
    },
    methodology: surplusCashData.methodology || 'Operating buffer (3 months expenses) + working capital requirement',
    confidence: surplusCashData.confidence || 'medium'
  };
}
