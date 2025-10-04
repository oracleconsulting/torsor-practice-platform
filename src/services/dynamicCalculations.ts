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

export class DynamicCalculationService {
  // Industry average rates as fallback
  private static readonly INDUSTRY_AVERAGES = {
    accounting_finance: 150,
    legal_services: 200,
    tech_consulting: 120,
    management_consulting: 180,
    creative_agency: 80,
    general_business: 100
  };

  // Oracle pricing by tier
  private static readonly ORACLE_PRICING = {
    starter: 99,
    growth: 299,
    enterprise: 599
  };

  // Replace hardcoded £65/hour with actual rate
  static getHourlyRate(user: UserMetrics): number {
    // Use actual rate or industry average
    return user.billable_rate_gbp || this.getIndustryAverage(user.industry);
  }

  // Get industry average as fallback
  static getIndustryAverage(industry?: string): number {
    return this.INDUSTRY_AVERAGES[industry as keyof typeof this.INDUSTRY_AVERAGES] || 100;
  }

  // Replace hardcoded 5 hours with actual freed time
  static calculateFreedHours(user: UserMetrics): number {
    const currentHours = user.working_hours_per_week;
    const targetHours = user.target_working_hours;
    const potentialFreedHours = currentHours - targetHours;
    
    // Realistic expectation: 20-40% efficiency gain
    return Math.round(potentialFreedHours * 0.3);
  }

  // Replace hardcoded £975/month with actual calculation
  static calculateFirstRevenue(user: UserMetrics): number {
    const hourlyRate = this.getHourlyRate(user);
    const initialBillableHours = Math.min(10, this.calculateFreedHours(user));
    
    return Math.round(hourlyRate * initialBillableHours * 4); // 4 weeks/month
  }

  // Replace hardcoded £15,600/year with actual potential
  static calculateAnnualPotential(user: UserMetrics): number {
    const hourlyRate = this.getHourlyRate(user);
    const freedHours = this.calculateFreedHours(user);
    const workingWeeks = user.working_weeks_per_year || 48;
    
    return hourlyRate * freedHours * workingWeeks;
  }

  // Replace hardcoded ROI multipliers
  static calculateROIMultiple(user: UserMetrics): number {
    const annualPotential = this.calculateAnnualPotential(user);
    const oracleInvestment = this.getOracleInvestment(user);
    
    return Math.round((annualPotential / oracleInvestment) * 10) / 10;
  }

  // Get Oracle investment based on tier
  static getOracleInvestment(user: UserMetrics): number {
    const tier = user.subscription_tier || 'growth';
    return this.ORACLE_PRICING[tier as keyof typeof this.ORACLE_PRICING] * 12;
  }

  // Dynamic burnout thresholds based on user
  static getBurnoutThreshold(user: UserMetrics): number {
    const baseThreshold = {
      'tech_startup': 55,
      'accounting_finance': 50,
      'consulting': 60,
      'agency': 65,
      'general_business': 55
    };
    
    return baseThreshold[user.industry as keyof typeof baseThreshold] || 55;
  }

  // Dynamic success metrics based on actual goals
  static getSuccessMetrics(user: UserMetrics, timeframe: string): string {
    switch(timeframe) {
      case '3_month':
        return `£${Math.round(user.annual_revenue_target / 12)}+/month revenue`;
      case '6_month':
        return `£${Math.round(user.annual_revenue_target / 6)}+ revenue, ${user.target_working_hours} hour weeks`;
      case '12_month':
        return `£${user.annual_revenue_target}+ annual revenue`;
      default:
        return '';
    }
  }

  // Calculate time value of Oracle investment
  static calculateTimeValue(user: UserMetrics): number {
    const hourlyRate = this.getHourlyRate(user);
    const oracleInvestment = this.getOracleInvestment(user);
    
    return Math.round(oracleInvestment / hourlyRate);
  }

  // Calculate realistic efficiency gains
  static calculateEfficiencyGain(user: UserMetrics): number {
    const currentHours = user.working_hours_per_week;
    const targetHours = user.target_working_hours;
    
    if (currentHours <= targetHours) {
      return 0.15; // 15% efficiency gain even if already at target hours
    }
    
    const excessHours = currentHours - targetHours;
    const efficiencyGain = Math.min(0.4, excessHours / currentHours * 0.6);
    
    return Math.round(efficiencyGain * 100) / 100;
  }

  // Calculate revenue growth potential
  static calculateRevenueGrowthPotential(user: UserMetrics): number {
    const currentRevenue = user.current_revenue || 0;
    const targetRevenue = user.annual_revenue_target;
    
    if (currentRevenue === 0) {
      // Pre-revenue business
      return this.calculateFirstRevenue(user) * 12;
    }
    
    const growthPotential = targetRevenue - currentRevenue;
    return Math.max(0, growthPotential);
  }

  // Calculate cost savings from better operations
  static calculateCostSavings(user: UserMetrics): number {
    const currentHours = user.working_hours_per_week;
    const targetHours = user.target_working_hours;
    const hourlyRate = this.getHourlyRate(user);
    
    if (currentHours <= targetHours) {
      return 0;
    }
    
    const excessHours = currentHours - targetHours;
    const workingWeeks = user.working_weeks_per_year || 48;
    
    return excessHours * hourlyRate * workingWeeks;
  }

  // Generate comprehensive ROI analysis
  static generateROIAnalysis(user: UserMetrics) {
    const hourlyRate = this.getHourlyRate(user);
    const freedHours = this.calculateFreedHours(user);
    const annualPotential = this.calculateAnnualPotential(user);
    const firstRevenue = this.calculateFirstRevenue(user);
    const oracleInvestment = this.getOracleInvestment(user);
    const roiMultiple = this.calculateROIMultiple(user);
    const efficiencyGain = this.calculateEfficiencyGain(user);
    const costSavings = this.calculateCostSavings(user);
    const revenueGrowth = this.calculateRevenueGrowthPotential(user);

    return {
      revenue_potential: {
        value: `£${annualPotential.toLocaleString()}/year`,
        calculation: `${freedHours} hours × £${hourlyRate} × ${user.working_weeks_per_year || 48} weeks`,
        description: `Revenue potential from ${freedHours} freed weekly hours`
      },
      first_revenue: {
        value: `£${firstRevenue.toLocaleString()}/month`,
        timeline: "Target for month 3",
        description: "Initial revenue from optimized operations"
      },
      oracle_investment: {
        value: `£${oracleInvestment.toLocaleString()}/year`,
        description: "Investment in strategic guidance",
        roi_multiple: `${roiMultiple}x potential return`
      },
      efficiency_gain: {
        value: `${Math.round(efficiencyGain * 100)}%`,
        description: "Realistic efficiency improvement",
        impact: `Saves ${freedHours} hours per week`
      },
      cost_savings: {
        value: `£${costSavings.toLocaleString()}/year`,
        description: "Savings from reduced burnout hours",
        calculation: `Excess hours × £${hourlyRate} × ${user.working_weeks_per_year || 48} weeks`
      },
      revenue_growth: {
        value: `£${revenueGrowth.toLocaleString()}/year`,
        description: "Growth potential to target revenue",
        timeline: "12-month target"
      },
      total_opportunity_value: annualPotential + costSavings + revenueGrowth,
      confidence_level: this.calculateConfidenceLevel(user)
    };
  }

  // Calculate confidence level based on data quality
  static calculateConfidenceLevel(user: UserMetrics): 'high' | 'medium' | 'low' {
    let score = 0;
    
    if (user.billable_rate_gbp) score += 2;
    if (user.working_hours_per_week) score += 2;
    if (user.target_working_hours) score += 2;
    if (user.annual_revenue_target) score += 2;
    if (user.working_weeks_per_year) score += 1;
    if (user.industry) score += 1;
    if (user.current_revenue !== undefined) score += 1;
    
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  // Generate personalized time commitment
  static generateTimeCommitment(user: UserMetrics): string {
    const freedHours = this.calculateFreedHours(user);
    const targetHours = user.target_working_hours;
    
    if (freedHours <= 0) {
      return `${targetHours} hours/week (optimized schedule)`;
    }
    
    return `${targetHours} hours/week (saving ${freedHours} hours)`;
  }

  // Calculate realistic weekly tasks
  static calculateWeeklyTaskCapacity(user: UserMetrics): number {
    const targetHours = user.target_working_hours;
    const efficiencyGain = this.calculateEfficiencyGain(user);
    
    // Assume 2-3 hours per significant task
    const effectiveHours = targetHours * (1 + efficiencyGain);
    return Math.round(effectiveHours / 2.5);
  }

  // Generate personalized success metrics
  static generateSuccessMetrics(user: UserMetrics) {
    return {
      three_month: this.getSuccessMetrics(user, '3_month'),
      six_month: this.getSuccessMetrics(user, '6_month'),
      twelve_month: this.getSuccessMetrics(user, '12_month'),
      weekly_tasks: this.calculateWeeklyTaskCapacity(user),
      time_commitment: this.generateTimeCommitment(user)
    };
  }
} 