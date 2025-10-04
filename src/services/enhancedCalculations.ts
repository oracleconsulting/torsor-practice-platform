export interface UserMetrics {
  working_hours_per_week: number;
  billable_rate_gbp: number;
  target_working_hours: number;
  annual_revenue_target: number;
  working_weeks_per_year: number;
  current_revenue?: number;
  industry?: string;
  business_stage?: string;
  subscription_tier?: string;
}

export interface EnhancedROIAnalysis {
  revenue_potential: {
    value: string;
    calculation: string;
    description: string;
    data_source: string;
  };
  first_revenue: {
    value: string;
    timeline: string;
    description: string;
    data_source: string;
  };
  oracle_investment: {
    value: string;
    description: string;
    roi_multiple: string;
    data_source: string;
  };
  efficiency_gain: {
    value: string;
    description: string;
    impact: string;
    data_source: string;
  };
  cost_savings: {
    value: string;
    description: string;
    calculation: string;
    data_source: string;
  };
  revenue_growth: {
    value: string;
    description: string;
    timeline: string;
    data_source: string;
  };
  total_opportunity_value: number;
  confidence_level: 'high' | 'medium' | 'low';
  data_sources_summary: string[];
}

export class EnhancedCalculationService {
  // Oracle pricing by tier
  private static readonly ORACLE_PRICING = {
    starter: 99,
    growth: 299,
    enterprise: 599
  };

  // Industry benchmarks as fallback only
  private static readonly INDUSTRY_BENCHMARKS = {
    accounting_finance: 150,
    legal_services: 200,
    tech_consulting: 120,
    management_consulting: 180,
    creative_agency: 80,
    general_business: 100
  };

  /**
   * Get hourly rate with clear data source tracking
   */
  static getHourlyRate(user: UserMetrics): { rate: number; source: string } {
    if (user.billable_rate_gbp && user.billable_rate_gbp > 0) {
      return { 
        rate: user.billable_rate_gbp, 
        source: `your £${user.billable_rate_gbp}/hour rate` 
      };
    }
    
    // Fallback to industry benchmark
    const benchmarkRate = this.INDUSTRY_BENCHMARKS[user.industry as keyof typeof this.INDUSTRY_BENCHMARKS] || 100;
    return { 
      rate: benchmarkRate, 
      source: `industry average (${user.industry || 'general business'})` 
    };
  }

  /**
   * Calculate freed hours based on actual user data
   */
  static calculateFreedHours(user: UserMetrics): { hours: number; source: string } {
    const currentHours = user.working_hours_per_week || 50;
    const targetHours = user.target_working_hours || 35;
    const potentialFreedHours = Math.max(0, currentHours - targetHours);
    
    // Realistic expectation: 20-40% efficiency gain
    const efficiencyMultiplier = potentialFreedHours > 0 ? 0.3 : 0.2;
    const freedHours = Math.round(Math.min(currentHours * efficiencyMultiplier, potentialFreedHours));
    
    return {
      hours: freedHours,
      source: `${currentHours} current hours → ${targetHours} target hours`
    };
  }

  /**
   * Calculate first revenue milestone
   */
  static calculateFirstRevenue(user: UserMetrics): { amount: number; source: string } {
    const { rate, source: rateSource } = this.getHourlyRate(user);
    const { hours: freedHours } = this.calculateFreedHours(user);
    const initialBillableHours = Math.min(10, freedHours);
    
    return {
      amount: Math.round(rate * initialBillableHours * 4), // 4 weeks/month
      source: `${initialBillableHours} hours × £${rate}/hour × 4 weeks (using ${rateSource})`
    };
  }

  /**
   * Calculate annual revenue potential
   */
  static calculateAnnualPotential(user: UserMetrics): { amount: number; calculation: string } {
    const { rate } = this.getHourlyRate(user);
    const { hours: freedHours } = this.calculateFreedHours(user);
    const workingWeeks = user.working_weeks_per_year || 48;
    
    return {
      amount: rate * freedHours * workingWeeks,
      calculation: `${freedHours} hours × £${rate} × ${workingWeeks} weeks`
    };
  }

  /**
   * Calculate ROI multiple with clear calculation
   */
  static calculateROIMultiple(user: UserMetrics): { multiple: number; calculation: string } {
    const { amount: annualPotential } = this.calculateAnnualPotential(user);
    const oracleInvestment = this.getOracleInvestment(user);
    const multiple = Math.round((annualPotential / oracleInvestment) * 10) / 10;
    
    return {
      multiple,
      calculation: `£${annualPotential.toLocaleString()} potential ÷ £${oracleInvestment.toLocaleString()} investment`
    };
  }

  /**
   * Get Oracle investment amount
   */
  static getOracleInvestment(user: UserMetrics): number {
    const tier = user.subscription_tier || 'growth';
    return this.ORACLE_PRICING[tier as keyof typeof this.ORACLE_PRICING] * 12;
  }

  /**
   * Calculate efficiency gain percentage
   */
  static calculateEfficiencyGain(user: UserMetrics): { percentage: number; impact: string } {
    const currentHours = user.working_hours_per_week || 50;
    const targetHours = user.target_working_hours || 35;
    const { hours: freedHours } = this.calculateFreedHours(user);
    
    let efficiencyGain: number;
    if (currentHours <= targetHours) {
      efficiencyGain = 0.15; // 15% efficiency gain even if already at target
    } else {
      const excessHours = currentHours - targetHours;
      efficiencyGain = Math.min(0.4, excessHours / currentHours * 0.6);
    }
    
    return {
      percentage: Math.round(efficiencyGain * 100),
      impact: `Save ${freedHours} hours per week while maintaining output`
    };
  }

  /**
   * Calculate cost savings from reduced hours
   */
  static calculateCostSavings(user: UserMetrics): { amount: number; calculation: string } {
    const currentHours = user.working_hours_per_week || 50;
    const targetHours = user.target_working_hours || 35;
    const { rate } = this.getHourlyRate(user);
    
    if (currentHours <= targetHours) {
      return { amount: 0, calculation: 'Already at target hours' };
    }
    
    const excessHours = currentHours - targetHours;
    const workingWeeks = user.working_weeks_per_year || 48;
    const amount = excessHours * rate * workingWeeks;
    
    return {
      amount,
      calculation: `${excessHours} excess hours × £${rate} × ${workingWeeks} weeks`
    };
  }

  /**
   * Calculate revenue growth potential
   */
  static calculateRevenueGrowthPotential(user: UserMetrics): { amount: number; description: string } {
    const currentRevenue = user.current_revenue || 0;
    const targetRevenue = user.annual_revenue_target || 250000;
    
    if (currentRevenue === 0) {
      const { amount: firstRevenue } = this.calculateFirstRevenue(user);
      return {
        amount: firstRevenue * 12,
        description: 'Pre-revenue → First revenue milestone'
      };
    }
    
    const growthPotential = Math.max(0, targetRevenue - currentRevenue);
    return {
      amount: growthPotential,
      description: `£${currentRevenue.toLocaleString()} → £${targetRevenue.toLocaleString()}`
    };
  }

  /**
   * Calculate confidence level based on data completeness
   */
  static calculateConfidenceLevel(user: UserMetrics): { level: 'high' | 'medium' | 'low'; score: number; missing: string[] } {
    let score = 0;
    const missing: string[] = [];
    
    if (user.billable_rate_gbp && user.billable_rate_gbp > 0) {
      score += 3;
    } else {
      missing.push('actual hourly rate');
    }
    
    if (user.working_hours_per_week) {
      score += 2;
    } else {
      missing.push('current working hours');
    }
    
    if (user.target_working_hours) {
      score += 2;
    } else {
      missing.push('target working hours');
    }
    
    if (user.annual_revenue_target) {
      score += 2;
    } else {
      missing.push('revenue target');
    }
    
    if (user.working_weeks_per_year) score += 1;
    if (user.industry) score += 1;
    if (user.current_revenue !== undefined) score += 1;
    
    const level = score >= 9 ? 'high' : score >= 6 ? 'medium' : 'low';
    
    return { level, score, missing };
  }

  /**
   * Generate comprehensive ROI analysis with data source tracking
   */
  static generateEnhancedROIAnalysis(user: UserMetrics): EnhancedROIAnalysis {
    const { rate, source: rateSource } = this.getHourlyRate(user);
    const { hours: freedHours, source: hoursSource } = this.calculateFreedHours(user);
    const { amount: annualPotential, calculation: potentialCalc } = this.calculateAnnualPotential(user);
    const { amount: firstRevenue, source: firstRevSource } = this.calculateFirstRevenue(user);
    const oracleInvestment = this.getOracleInvestment(user);
    const { multiple: roiMultiple, calculation: roiCalc } = this.calculateROIMultiple(user);
    const { percentage: efficiencyGain, impact: efficiencyImpact } = this.calculateEfficiencyGain(user);
    const { amount: costSavings, calculation: savingsCalc } = this.calculateCostSavings(user);
    const { amount: revenueGrowth, description: growthDesc } = this.calculateRevenueGrowthPotential(user);
    const { level: confidenceLevel, missing } = this.calculateConfidenceLevel(user);

    const dataSources = new Set<string>();
    
    // Track all data sources
    if (user.billable_rate_gbp) {
      dataSources.add('Your actual hourly rate');
    } else {
      dataSources.add('Industry benchmark rates');
    }
    
    if (user.working_hours_per_week && user.target_working_hours) {
      dataSources.add('Your working hours data');
    }
    
    if (user.annual_revenue_target) {
      dataSources.add('Your revenue targets');
    }
    
    if (user.working_weeks_per_year) {
      dataSources.add('Your annual schedule');
    }

    return {
      revenue_potential: {
        value: `£${annualPotential.toLocaleString()}/year`,
        calculation: potentialCalc,
        description: `Revenue from ${freedHours} optimized hours weekly`,
        data_source: `Based on ${rateSource}`
      },
      first_revenue: {
        value: `£${firstRevenue.toLocaleString()}/month`,
        timeline: "Target for month 3",
        description: "Initial revenue from newly freed time",
        data_source: firstRevSource
      },
      oracle_investment: {
        value: `£${oracleInvestment.toLocaleString()}/year`,
        description: "Oracle Method strategic guidance",
        roi_multiple: `${roiMultiple}x`,
        data_source: `${user.subscription_tier || 'Growth'} tier pricing`
      },
      efficiency_gain: {
        value: `${efficiencyGain}%`,
        description: "Productivity improvement",
        impact: efficiencyImpact,
        data_source: hoursSource
      },
      cost_savings: {
        value: `£${costSavings.toLocaleString()}/year`,
        description: "Value of reduced burnout hours",
        calculation: savingsCalc,
        data_source: `Based on ${rateSource}`
      },
      revenue_growth: {
        value: `£${revenueGrowth.toLocaleString()}/year`,
        description: "Path to target revenue",
        timeline: "12-month journey",
        data_source: growthDesc
      },
      total_opportunity_value: annualPotential + costSavings + revenueGrowth,
      confidence_level: confidenceLevel,
      data_sources_summary: Array.from(dataSources)
    };
  }

  /**
   * Generate time commitment string with context
   */
  static generateTimeCommitment(user: UserMetrics): string {
    const { hours: freedHours } = this.calculateFreedHours(user);
    const targetHours = user.target_working_hours || 35;
    const currentHours = user.working_hours_per_week || 50;
    
    if (freedHours <= 0) {
      return `${targetHours} hours/week (maintaining current efficiency)`;
    }
    
    return `${currentHours} → ${targetHours} hours/week (saving ${freedHours} hours)`;
  }

  /**
   * Calculate weekly task capacity based on available time
   */
  static calculateWeeklyTaskCapacity(user: UserMetrics): { tasks: number; reasoning: string } {
    const targetHours = user.target_working_hours || 35;
    const { percentage: efficiencyGain } = this.calculateEfficiencyGain(user);
    
    // Assume 2-3 hours per significant task
    const effectiveHours = targetHours * (1 + efficiencyGain / 100);
    const taskCapacity = Math.round(effectiveHours / 2.5);
    
    return {
      tasks: taskCapacity,
      reasoning: `${targetHours} weekly hours with ${efficiencyGain}% efficiency gain`
    };
  }

  /**
   * Generate personalised success metrics
   */
  static generateSuccessMetrics(user: UserMetrics) {
    const monthlyTarget = Math.round((user.annual_revenue_target || 250000) / 12);
    const { tasks: weeklyTasks, reasoning } = this.calculateWeeklyTaskCapacity(user);
    
    return {
      three_month: {
        metric: `£${monthlyTarget.toLocaleString()}+/month revenue`,
        source: 'Based on your annual target'
      },
      six_month: {
        metric: `£${Math.round(monthlyTarget * 1.2).toLocaleString()}/month, ${user.target_working_hours || 35} hour weeks`,
        source: 'Progressive growth model'
      },
      twelve_month: {
        metric: `£${(user.annual_revenue_target || 250000).toLocaleString()} annual revenue achieved`,
        source: 'Your stated goal'
      },
      weekly_tasks: {
        count: weeklyTasks,
        reasoning: reasoning
      },
      time_commitment: this.generateTimeCommitment(user)
    };
  }
} 