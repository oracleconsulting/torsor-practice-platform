// ============================================================================
// VALUE ANALYZER
// ============================================================================
// Analyzes Part 3 (Hidden Value Audit) responses to identify:
// - Asset scores across 6 categories
// - Value gaps and opportunities
// - Risk register
// - Business valuation impact
// - Prioritized action plan

export interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

export interface ValueGap {
  area: string;
  currentValue: number;
  potentialValue: number;
  gap: number;
  actions: string[];
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
  priority: number;
}

export interface Risk {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
  estimatedCost: number;
}

export interface ValuationAnalysis {
  currentValuation: number;
  potentialValuation: number;
  valuationIncrease: number;
  percentageIncrease: number;
  exitReadinessScore: number;
  currentMultiple: number;
  potentialMultiple: number;
  timeframe: string;
}

export interface ActionPlan {
  quickWins: ValueGap[];
  criticalFixes: Risk[];
  strategicInitiatives: ValueGap[];
  totalActions: number;
  estimatedImpact: number;
  timeRequirement: string;
}

export interface ValueAnalysisResult {
  assetScores: AssetScore[];
  valueGaps: ValueGap[];
  riskRegister: Risk[];
  valuationAnalysis: ValuationAnalysis;
  actionPlan: ActionPlan;
  overallScore: number;
  generatedAt: string;
}

export class ValueAnalyzer {
  /**
   * Generate complete value analysis from Part 3 responses
   */
  analyze(
    part1Responses: Record<string, any>,
    part2Responses: Record<string, any>,
    part3Responses: Record<string, any>
  ): ValueAnalysisResult {
    // Calculate asset scores
    const assetScores = this.calculateAssetScores(part3Responses);
    
    // Identify value gaps
    const valueGaps = this.identifyValueGaps(part1Responses, part2Responses, part3Responses);
    
    // Assess risks
    const riskRegister = this.assessRisks(part3Responses);
    
    // Calculate valuation impact
    const valuationAnalysis = this.calculateValuationImpact(assetScores, valueGaps, part2Responses);
    
    // Generate action plan
    const timeCommitment = part1Responses.commitment_hours || '10-15 hours';
    const actionPlan = this.generateActionPlan(valueGaps, riskRegister, timeCommitment);
    
    // Calculate overall score
    const overallScore = Math.round(
      assetScores.reduce((sum, s) => sum + s.percentage, 0) / assetScores.length
    );
    
    return {
      assetScores,
      valueGaps,
      riskRegister,
      valuationAnalysis,
      actionPlan,
      overallScore,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate scores for each of the 6 asset categories
   */
  calculateAssetScores(responses: Record<string, any>): AssetScore[] {
    return [
      this.scoreIntellectualCapital(responses),
      this.scoreBrandTrust(responses),
      this.scoreMarketPosition(responses),
      this.scoreSystemsScale(responses),
      this.scorePeopleCulture(responses),
      this.scoreFinancialExit(responses)
    ];
  }

  private scoreIntellectualCapital(responses: Record<string, any>): AssetScore {
    let score = 50; // Start at midpoint
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Process documentation (more undocumented = worse)
    const undocumented = responses.critical_processes_undocumented || [];
    if (undocumented.length > 4) {
      issues.push(`${undocumented.length} critical processes are undocumented`);
      score -= undocumented.length * 5;
    } else if (undocumented.length > 0) {
      opportunities.push(`Document ${undocumented.length} remaining processes`);
      score -= undocumented.length * 3;
    } else {
      score += 20;
    }
    
    // Knowledge dependency
    const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
    if (dependency > 67) {
      issues.push(`${dependency}% knowledge dependency on founder - critical risk`);
      score -= 20;
    } else if (dependency > 40) {
      opportunities.push('Reduce knowledge dependency through documentation');
      score -= 10;
    } else {
      score += 15;
    }
    
    // Unutilized customer data
    const unusedData = responses.customer_data_unutilized || [];
    if (unusedData.length > 3) {
      opportunities.push(`Analyze ${unusedData.length} types of underutilized customer data`);
    }
    
    // IP/funding awareness
    const ipAwareness = responses.awareness_rd_tax_credits;
    if (ipAwareness === 'Not aware') {
      opportunities.push('Explore R&D tax credits (avg £45k benefit for eligible SMEs)');
    }
    
    const financialImpact = undocumented.length * 50000 + unusedData.length * 15000;
    
    return {
      category: 'Intellectual Capital',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  private scoreBrandTrust(responses: Record<string, any>): AssetScore {
    let score = 50;
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Hidden trust signals
    const hiddenSignals = responses.hidden_trust_signals || [];
    if (hiddenSignals.length > 3) {
      issues.push(`${hiddenSignals.length} credibility markers not displayed prominently`);
      score -= hiddenSignals.length * 3;
    }
    opportunities.push('Display all trust signals prominently on website');
    
    // Personal vs business brand
    const personalPercentage = parseInt(responses.personal_brand_percentage) || 0;
    if (personalPercentage > 60) {
      issues.push(`${personalPercentage}% buy from YOU personally - business is unsellable`);
      score -= 25;
    } else if (personalPercentage > 40) {
      opportunities.push('Build business brand independent of founder');
      score -= 10;
    } else {
      score += 20;
    }
    
    // Story consistency
    const storyConsistency = responses.team_story_consistency;
    if (storyConsistency === "Only I can tell it properly" || storyConsistency === "We don't have a clear story") {
      issues.push('No consistent company story across team');
      opportunities.push('Document and train team on company story');
      score -= 10;
    }
    
    // Customer advocates
    const advocates = parseInt(responses.active_customer_advocates) || 0;
    if (advocates < 20) {
      opportunities.push(`Build from ${advocates} to 20+ active customer advocates`);
    } else {
      score += Math.min(advocates * 2, 30);
    }
    
    const financialImpact = hiddenSignals.length * 12000 + Math.max(0, 20 - advocates) * 5000;
    
    return {
      category: 'Brand & Trust Equity',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  private scoreMarketPosition(responses: Record<string, any>): AssetScore {
    let score = 50;
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Competitive moat
    const moatFactors = responses.competitive_moat || [];
    if (moatFactors.includes('Nothing - we compete on price')) {
      issues.push('No competitive moat - competing on price only');
      score -= 30;
    } else {
      score += moatFactors.length * 6;
    }
    
    // Customer concentration
    const concentration = parseInt(responses.top3_customer_revenue_percentage) || 0;
    if (concentration > 50) {
      issues.push(`${concentration}% revenue from top 3 customers - extreme vulnerability`);
      score -= 20;
    } else if (concentration > 30) {
      opportunities.push('Diversify customer base to reduce concentration');
      score -= 10;
    } else {
      score += 15;
    }
    
    // Channel dependency
    const channelDep = parseInt(responses.external_channel_percentage) || 0;
    if (channelDep > 70) {
      issues.push(`${channelDep}% revenue through external channels - you're sharecropping`);
      score -= 15;
    }
    
    // Price increase ability
    const lastIncrease = responses.last_price_increase;
    if (lastIncrease === 'More than 2 years ago' || lastIncrease === 'Never raised prices') {
      issues.push('Unable to raise prices - weak market position');
      score -= 15;
    }
    
    const financialImpact = Math.max(0, concentration - 30) * 2000 + Math.max(0, channelDep - 50) * 1000;
    
    return {
      category: 'Market Position',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  private scoreSystemsScale(responses: Record<string, any>): AssetScore {
    let score = 50;
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Process autonomy - count "Would fail" responses
    let failedProcesses = 0;
    ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance', 'autonomy_hiring', 'autonomy_strategy', 'autonomy_quality'].forEach(field => {
      if (responses[field] === 'Would fail') {
        failedProcesses++;
      }
    });
    
    if (failedProcesses > 2) {
      issues.push(`${failedProcesses} processes would fail without you`);
      score -= failedProcesses * 10;
    }
    
    // Data re-entry
    const reEntry = responses.data_re_entry_frequency;
    if (reEntry === '4-5 times' || reEntry === 'Constantly re-entering data') {
      issues.push('Excessive data re-entry reducing efficiency');
      opportunities.push('Integrate systems to eliminate re-entry');
      score -= 10;
    }
    
    // Quality control
    const qcMethod = responses.quality_control_method;
    if (qcMethod === 'I personally check everything') {
      issues.push('Personal quality checking - not scalable');
      opportunities.push('Implement automated quality systems');
      score -= 15;
    }
    
    // Tech stack health
    const techDebt = parseInt(responses.tech_stack_health_percentage) || 0;
    if (techDebt > 40) {
      issues.push(`${techDebt}% of tech stack "just about works"`);
      opportunities.push('Modernize technology stack');
      score -= Math.round(techDebt * 0.3);
    }
    
    const financialImpact = failedProcesses * 25000 + techDebt * 500;
    
    return {
      category: 'Systems & Scale',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  private scorePeopleCulture(responses: Record<string, any>): AssetScore {
    let score = 50;
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Key person risk - count "Crisis situation" responses
    let crisisRoles = 0;
    ['risk_operations_lead', 'risk_sales_lead', 'risk_tech_lead', 'risk_customer_lead', 'risk_finance_lead'].forEach(field => {
      if (responses[field] === 'Crisis situation') {
        crisisRoles++;
      }
    });
    
    if (crisisRoles > 1) {
      issues.push(`${crisisRoles} roles would cause crisis if person left`);
      score -= crisisRoles * 12;
    }
    
    // Succession depth - count "Nobody" responses
    let noSuccession = 0;
    ['succession_your_role', 'succession_operations', 'succession_sales', 'succession_technical', 'succession_customer'].forEach(field => {
      if (responses[field] === 'Nobody') {
        noSuccession++;
      }
    });
    
    if (noSuccession > 2) {
      issues.push(`${noSuccession} roles have no succession plan`);
      opportunities.push('Develop succession plans for key roles');
      score -= noSuccession * 8;
    }
    
    // Culture documentation
    const cultureMethods = responses.culture_preservation_methods || [];
    if (cultureMethods.includes('Nothing formal')) {
      issues.push('No formal culture preservation');
      opportunities.push('Document and preserve company culture');
      score -= 10;
    } else {
      score += cultureMethods.length * 4;
    }
    
    // Team advocacy
    const advocacy = parseInt(responses.team_advocacy_percentage) || 0;
    if (advocacy < 80) {
      opportunities.push(`Increase team advocacy from ${advocacy}% to 80%+`);
    } else {
      score += 15;
    }
    
    const financialImpact = crisisRoles * 30000 + noSuccession * 15000;
    
    return {
      category: 'People & Culture',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  private scoreFinancialExit(responses: Record<string, any>): AssetScore {
    let score = 50;
    const maxScore = 100;
    const issues: string[] = [];
    const opportunities: string[] = [];
    
    // Documentation readiness
    const readyDocs = responses.documentation_24hr_ready || [];
    if (readyDocs.length < 4) {
      issues.push(`Only ${readyDocs.length}/8 documents ready for sale`);
      opportunities.push('Prepare due diligence data room');
      score -= (8 - readyDocs.length) * 5;
    } else {
      score += readyDocs.length * 5;
    }
    
    // Business valuation knowledge
    const valuationKnowledge = responses.know_business_worth;
    if (valuationKnowledge === 'Rough idea only' || valuationKnowledge === 'No idea at all') {
      issues.push('Unknown business value');
      opportunities.push('Get professional business valuation');
      score -= 10;
    }
    
    // Personal risk exposure
    const bankruptcyRisks = responses.personal_bankruptcy_risks || [];
    const actualRisks = bankruptcyRisks.filter((r: string) => r !== 'None of these apply');
    if (actualRisks.length > 2) {
      issues.push(`${actualRisks.length} personal bankruptcy risks`);
      opportunities.push('Mitigate personal financial exposure');
      score -= actualRisks.length * 8;
    }
    
    // UK funding exploration - count "Currently using"
    let fundingExplored = 0;
    ['explored_rd_tax', 'explored_grants', 'explored_eis_seis', 'explored_debt', 'explored_equity'].forEach(field => {
      if (responses[field] === 'Currently using') {
        fundingExplored++;
      }
    });
    
    if (fundingExplored < 2) {
      opportunities.push(`Explore ${5 - fundingExplored} additional UK funding options`);
    } else {
      score += fundingExplored * 5;
    }
    
    // Investability assets
    const investableAssets = responses.investability_assets || [];
    if (investableAssets.includes('Just buying a job')) {
      issues.push('Business is just a job - not investable');
      score -= 25;
    } else {
      score += investableAssets.length * 4;
    }
    
    const financialImpact = (8 - readyDocs.length) * 10000 + actualRisks.length * 15000;
    
    return {
      category: 'Financial & Exit',
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      issues,
      opportunities,
      financialImpact
    };
  }

  /**
   * Identify specific value gaps and opportunities
   */
  identifyValueGaps(
    part1Data: Record<string, any>,
    part2Data: Record<string, any>,
    part3Data: Record<string, any>
  ): ValueGap[] {
    const gaps: ValueGap[] = [];
    
    // Process documentation gap
    const undocumented = part3Data.critical_processes_undocumented || [];
    if (undocumented.length > 0) {
      gaps.push({
        area: 'Process Documentation',
        currentValue: 0,
        potentialValue: undocumented.length * 50000,
        gap: undocumented.length * 50000,
        actions: [
          `Document "${undocumented[0]}" process first`,
          'Create process template for consistency',
          'Train team on documented processes'
        ],
        timeframe: '4-8 weeks',
        effort: 'Medium',
        priority: 1
      });
    }
    
    // Customer concentration gap
    const concentration = parseInt(part3Data.top3_customer_revenue_percentage) || 0;
    if (concentration > 50) {
      gaps.push({
        area: 'Customer Diversification',
        currentValue: 0,
        potentialValue: 200000,
        gap: 200000,
        actions: [
          'Develop customer acquisition strategy',
          'Target 10 new customers in next quarter',
          'Reduce top 3 concentration below 30%'
        ],
        timeframe: '3-6 months',
        effort: 'High',
        priority: 2
      });
    }
    
    // Trust signals gap
    const hiddenSignals = part3Data.hidden_trust_signals || [];
    if (hiddenSignals.length > 0) {
      gaps.push({
        area: 'Trust Signal Optimization',
        currentValue: 0,
        potentialValue: hiddenSignals.length * 12000,
        gap: hiddenSignals.length * 12000,
        actions: [
          'Add trust badges to website header',
          'Create dedicated credibility page',
          'Include testimonials on key pages'
        ],
        timeframe: '1-2 weeks',
        effort: 'Low',
        priority: 3
      });
    }
    
    // Data utilization gap
    const unusedData = part3Data.customer_data_unutilized || [];
    if (unusedData.length > 2) {
      gaps.push({
        area: 'Data Analytics Implementation',
        currentValue: 0,
        potentialValue: 45000,
        gap: 45000,
        actions: [
          'Set up customer analytics dashboard',
          'Analyze purchase patterns monthly',
          'Create data-driven marketing campaigns'
        ],
        timeframe: '2-4 weeks',
        effort: 'Low',
        priority: 4
      });
    }
    
    // Succession planning gap
    let noSuccession = 0;
    ['succession_your_role', 'succession_operations', 'succession_sales'].forEach(field => {
      if (part3Data[field] === 'Nobody') noSuccession++;
    });
    if (noSuccession > 1) {
      gaps.push({
        area: 'Succession Planning',
        currentValue: 0,
        potentialValue: noSuccession * 40000,
        gap: noSuccession * 40000,
        actions: [
          'Identify potential successors for key roles',
          'Create role documentation and training plans',
          'Implement cross-training program'
        ],
        timeframe: '2-3 months',
        effort: 'Medium',
        priority: 5
      });
    }
    
    return gaps.sort((a, b) => b.gap - a.gap);
  }

  /**
   * Assess business risks from Part 3 responses
   */
  assessRisks(responses: Record<string, any>): Risk[] {
    const risks: Risk[] = [];
    
    // Key person risk
    let crisisRoles = 0;
    ['risk_operations_lead', 'risk_sales_lead', 'risk_tech_lead', 'risk_customer_lead', 'risk_finance_lead'].forEach(field => {
      if (responses[field] === 'Crisis situation') crisisRoles++;
    });
    
    if (crisisRoles > 1) {
      risks.push({
        title: 'Critical Key Person Dependencies',
        severity: crisisRoles > 3 ? 'Critical' : 'High',
        impact: `${crisisRoles} roles would cause crisis if person left`,
        mitigation: 'Implement immediate succession planning and cross-training',
        estimatedCost: 25000
      });
    }
    
    // Customer concentration risk
    const concentration = parseInt(responses.top3_customer_revenue_percentage) || 0;
    if (concentration > 50) {
      risks.push({
        title: 'Extreme Customer Concentration',
        severity: concentration > 70 ? 'Critical' : 'High',
        impact: `${concentration}% revenue from top 3 customers`,
        mitigation: 'Diversify customer base urgently - target 10 new accounts',
        estimatedCost: 50000
      });
    }
    
    // Personal guarantee risk
    const bankruptcyRisks = responses.personal_bankruptcy_risks || [];
    if (bankruptcyRisks.includes('Personal guarantees on loans')) {
      risks.push({
        title: 'Personal Financial Exposure',
        severity: 'High',
        impact: 'Personal assets at risk from business liabilities',
        mitigation: 'Restructure debt to remove personal guarantees where possible',
        estimatedCost: 15000
      });
    }
    
    // Documentation readiness
    const readyDocs = responses.documentation_24hr_ready || [];
    if (readyDocs.length < 4) {
      risks.push({
        title: 'Poor Exit Readiness',
        severity: 'Medium',
        impact: 'Would take 3+ months to prepare for sale',
        mitigation: 'Create and maintain due diligence data room',
        estimatedCost: 10000
      });
    }
    
    // Knowledge dependency
    const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
    if (dependency > 80) {
      risks.push({
        title: 'Critical Knowledge Concentration',
        severity: 'Critical',
        impact: `${dependency}% of business knowledge inaccessible if founder unavailable`,
        mitigation: 'Immediate documentation of critical processes and knowledge transfer',
        estimatedCost: 20000
      });
    }
    
    // No competitive moat
    const moat = responses.competitive_moat || [];
    if (moat.includes('Nothing - we compete on price')) {
      risks.push({
        title: 'No Competitive Moat',
        severity: 'High',
        impact: 'Vulnerable to price wars and competitor disruption',
        mitigation: 'Develop unique value proposition and customer lock-in',
        estimatedCost: 30000
      });
    }
    
    // Sort by severity
    const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Calculate business valuation impact
   */
  calculateValuationImpact(
    assetScores: AssetScore[],
    valueGaps: ValueGap[],
    part2Responses: Record<string, any>
  ): ValuationAnalysis {
    // Estimate current revenue from Part 2
    const revenueBand = part2Responses.annual_turnover || '£250k-£500k';
    let currentRevenue = 375000; // Default midpoint
    
    if (revenueBand.includes('Under £100k')) currentRevenue = 50000;
    else if (revenueBand.includes('£100k-£250k')) currentRevenue = 175000;
    else if (revenueBand.includes('£250k-£500k')) currentRevenue = 375000;
    else if (revenueBand.includes('£500k-£1m')) currentRevenue = 750000;
    else if (revenueBand.includes('£1m-£5m')) currentRevenue = 2500000;
    else if (revenueBand.includes('Over £5m')) currentRevenue = 7500000;
    
    // Industry multiple (simplified - could be enhanced with industry data)
    const baseMultiple = 2.5;
    
    // Current valuation
    const currentValuation = currentRevenue * baseMultiple;
    
    // Calculate score-based multiplier adjustment
    const totalScore = assetScores.reduce((sum, s) => sum + s.score, 0);
    const maxPossibleScore = assetScores.reduce((sum, s) => sum + s.maxScore, 0);
    const scorePercentage = (totalScore / maxPossibleScore) * 100;
    
    // Potential multiplier increase based on improvements
    let multiplierIncrease = 0;
    if (scorePercentage < 40) {
      multiplierIncrease = 1.5; // Could increase from 2.5x to 4x
    } else if (scorePercentage < 60) {
      multiplierIncrease = 1.0; // Could increase from 2.5x to 3.5x
    } else {
      multiplierIncrease = 0.5; // Could increase from 2.5x to 3x
    }
    
    // Value gap impact
    const totalValueGap = valueGaps.reduce((sum, g) => sum + g.gap, 0);
    const revenueIncreasePotential = totalValueGap * 0.3; // Conservative estimate
    
    // Potential valuation
    const potentialRevenue = currentRevenue + revenueIncreasePotential;
    const potentialMultiple = baseMultiple + multiplierIncrease;
    const potentialValuation = potentialRevenue * potentialMultiple;
    
    return {
      currentValuation,
      potentialValuation,
      valuationIncrease: potentialValuation - currentValuation,
      percentageIncrease: ((potentialValuation / currentValuation) - 1) * 100,
      exitReadinessScore: scorePercentage,
      currentMultiple: baseMultiple,
      potentialMultiple,
      timeframe: '12-18 months'
    };
  }

  /**
   * Generate prioritized action plan
   */
  generateActionPlan(
    valueGaps: ValueGap[],
    risks: Risk[],
    timeCommitment: string
  ): ActionPlan {
    // Quick wins (low effort, high impact)
    const quickWins = valueGaps
      .filter(g => g.effort === 'Low' && g.gap > 10000)
      .slice(0, 3);
    
    // Critical fixes (address high/critical risks)
    const criticalFixes = risks
      .filter(r => r.severity === 'Critical' || r.severity === 'High')
      .slice(0, 3);
    
    // Strategic initiatives (high effort, high impact)
    const strategicInitiatives = valueGaps
      .filter(g => g.effort === 'High' && g.gap > 50000)
      .slice(0, 2);
    
    const estimatedImpact = 
      quickWins.reduce((sum, g) => sum + g.gap, 0) +
      strategicInitiatives.reduce((sum, g) => sum + g.gap, 0);
    
    return {
      quickWins,
      criticalFixes,
      strategicInitiatives,
      totalActions: quickWins.length + criticalFixes.length + strategicInitiatives.length,
      estimatedImpact,
      timeRequirement: timeCommitment
    };
  }
}

// Singleton instance
export const valueAnalyzer = new ValueAnalyzer();

