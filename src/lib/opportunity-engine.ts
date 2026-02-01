/**
 * Comprehensive Opportunity Engine
 * 
 * Analyses ALL client data (HVA, financials, assessment, supplementary) to:
 * 1. Identify every possible improvement opportunity
 * 2. Map to existing services where fit exists
 * 3. Suggest NEW service concepts where gaps exist
 * 4. Build a library of potential services to develop
 */

// =============================================================================
// DATA SOURCES TO ANALYSE
// =============================================================================

export interface ClientDataBundle {
  // From HVA Part 3
  hva?: {
    competitive_moat?: string[];
    unique_methods?: string;
    knowledge_dependency_percentage?: number;
    personal_brand_percentage?: number;
    succession_your_role?: string;
    succession_sales?: string;
    succession_technical?: string;
    succession_operations?: string;
    autonomy_finance?: string;
    autonomy_strategy?: string;
    autonomy_sales?: string;
    autonomy_delivery?: string;
    risk_tech_lead?: string;
    risk_sales_lead?: string;
    risk_finance_lead?: string;
    risk_operations_lead?: string;
    team_advocacy_percentage?: number;
    tech_stack_health_percentage?: number;
    last_price_increase?: string;
    price_setting_method?: string;
    recurring_revenue_percentage?: number;
    average_client_tenure?: string;
    customer_acquisition_method?: string[];
  };
  
  // From Financial Data
  financials?: {
    revenue: number;
    revenueGrowth?: number;
    grossMargin?: number;
    grossMarginTrend?: 'improving' | 'stable' | 'declining';
    netMargin?: number;
    ebitdaMargin?: number;
    employeeCount?: number;
    revenuePerEmployee?: number;
    debtorDays?: number;
    creditorDays?: number;
    currentRatio?: number;
    cashPosition?: number;
    surplusCash?: number;
    freeholdProperty?: number;
    investments?: number;
  };
  
  // From Benchmarking Assessment
  assessment?: {
    suspected_underperformance?: string;
    leaving_money?: string;
    magic_fix?: string;
    blind_spot_fear?: string;
    top_quartile_ambition?: string[];
    competitor_envy?: string;
  };
  
  // From Supplementary Collection
  supplementary?: {
    client_concentration_top3?: number;
    top_customers?: Array<{ name: string; percentage: number; since?: string }>;
    utilisation_rate?: number;
    blended_hourly_rate?: number;
    avg_project_margin?: number;
    pipeline_conversion_rate?: number;
    employee_turnover_rate?: number;
    contract_terms?: string;
  };
  
  // Industry context
  industry?: {
    code: string;
    name: string;
    benchmarks: Record<string, { p25?: number; p50?: number; p75?: number }>;
  };
  
  // Founder risk from calculations
  founderRisk?: {
    level: string;
    score: number;
    factors: string[];
    valuationImpact: string;
  };
}

// =============================================================================
// OPPORTUNITY TYPES
// =============================================================================

export type OpportunitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'opportunity';

export type OpportunityCategory = 
  | 'financial_performance'
  | 'cash_management'
  | 'risk_mitigation'
  | 'operational_efficiency'
  | 'growth_capacity'
  | 'people_capability'
  | 'systems_processes'
  | 'strategic_positioning'
  | 'exit_readiness'
  | 'governance';

const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  financial_performance: 'Financial Performance',
  cash_management: 'Cash Management',
  risk_mitigation: 'Risk Mitigation',
  operational_efficiency: 'Operational Efficiency',
  growth_capacity: 'Growth Capacity',
  people_capability: 'People & Capability',
  systems_processes: 'Systems & Processes',
  strategic_positioning: 'Strategic Positioning',
  exit_readiness: 'Exit Readiness',
  governance: 'Governance & Visibility',
};

export interface FinancialImpact {
  type: 'revenue' | 'cost' | 'value' | 'risk';
  amount: number;
  confidence: 'high' | 'medium' | 'low';
  calculation: string;
}

export interface ExistingServiceFit {
  id: string;
  name: string;
  priceRange: string;
  fitScore: number; // 1-100 how well service fits this issue
  howItHelps: string;
  expectedOutcome: string;
  timeToValue: string;
}

export interface NewServiceConcept {
  suggestedName: string;
  description: string;
  deliverables: string[];
  suggestedPricing: string;
  skillsRequired: string[];
  marketSize: 'niche' | 'moderate' | 'broad';
  developmentPriority: 'immediate' | 'short-term' | 'medium-term' | 'exploratory';
}

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  categoryLabel: string;
  severity: OpportunitySeverity;
  
  // The evidence
  dataPoint: string;
  benchmark?: string;
  gap?: string;
  
  // The impact
  financialImpact?: FinancialImpact;
  
  // The solution
  existingService?: ExistingServiceFit;
  newServiceConcept?: NewServiceConcept;
  
  // Actions
  quickWin?: string;
  recommendedAction: string;
}

// =============================================================================
// DETECTION RULES
// =============================================================================

interface DetectionRule {
  id: string;
  title: string;
  category: OpportunityCategory;
  detect: (data: ClientDataBundle) => boolean;
  getSeverity: (data: ClientDataBundle) => OpportunitySeverity;
  buildOpportunity: (data: ClientDataBundle) => Partial<Opportunity>;
}

const DETECTION_RULES: DetectionRule[] = [
  // =========================================================================
  // FINANCIAL PERFORMANCE
  // =========================================================================
  {
    id: 'margin_critical',
    title: 'Gross margin critically below industry',
    category: 'financial_performance',
    detect: (d) => {
      const margin = d.financials?.grossMargin;
      const p25 = d.industry?.benchmarks?.gross_margin?.p25;
      return margin !== undefined && p25 !== undefined && margin < p25;
    },
    getSeverity: (d) => {
      const margin = d.financials?.grossMargin || 0;
      const p25 = d.industry?.benchmarks?.gross_margin?.p25 || 0;
      return margin < p25 * 0.5 ? 'critical' : 'high';
    },
    buildOpportunity: (d) => ({
      dataPoint: `${d.financials?.grossMargin?.toFixed(1)}% gross margin`,
      benchmark: `Industry P25: ${d.industry?.benchmarks?.gross_margin?.p25}%`,
      gap: `${((d.industry?.benchmarks?.gross_margin?.p25 || 0) - (d.financials?.grossMargin || 0)).toFixed(1)} points below bottom quartile`,
      financialImpact: {
        type: 'revenue',
        amount: (d.financials?.revenue || 0) * ((d.industry?.benchmarks?.gross_margin?.p50 || 0) - (d.financials?.grossMargin || 0)) / 100,
        confidence: 'medium',
        calculation: 'Revenue × margin gap to median',
      },
      existingService: {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        priceRange: '£650-£2,000/month',
        fitScore: 85,
        howItHelps: 'Project-level margin analysis identifies where value is being lost',
        expectedOutcome: '3-5% margin improvement typical within 90 days',
        timeToValue: '30 days',
      },
    }),
  },

  {
    id: 'margin_below_median',
    title: 'Gross margin below industry median',
    category: 'financial_performance',
    detect: (d) => {
      const margin = d.financials?.grossMargin;
      const p50 = d.industry?.benchmarks?.gross_margin?.p50;
      const p25 = d.industry?.benchmarks?.gross_margin?.p25;
      return margin !== undefined && p50 !== undefined && margin < p50 && margin >= (p25 || 0);
    },
    getSeverity: () => 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.financials?.grossMargin?.toFixed(1)}% gross margin`,
      benchmark: `Industry median: ${d.industry?.benchmarks?.gross_margin?.p50}%`,
      existingService: {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        priceRange: '£650-£2,000/month',
        fitScore: 75,
        howItHelps: 'Monthly margin monitoring and variance analysis',
        expectedOutcome: 'Reach median margin within 6-12 months',
        timeToValue: '30 days',
      },
    }),
  },

  {
    id: 'margin_recovering',
    title: 'Margin recovery underway - protect gains',
    category: 'financial_performance',
    detect: (d) => d.financials?.grossMarginTrend === 'improving',
    getSeverity: () => 'opportunity',
    buildOpportunity: () => ({
      dataPoint: 'Margin trend: Improving',
      existingService: {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        priceRange: '£650-£2,000/month',
        fitScore: 80,
        howItHelps: 'Protect recovery with ongoing monitoring and early warning',
        expectedOutcome: 'Sustained margin improvement with visibility',
        timeToValue: '14 days',
      },
    }),
  },

  // =========================================================================
  // CONCENTRATION RISK
  // =========================================================================
  {
    id: 'concentration_critical',
    title: 'Critical customer concentration',
    category: 'risk_mitigation',
    detect: (d) => (d.supplementary?.client_concentration_top3 || 0) >= 80,
    getSeverity: () => 'critical',
    buildOpportunity: (d) => {
      const concentration = d.supplementary?.client_concentration_top3 || 0;
      const revenue = d.financials?.revenue || 0;
      const atRisk = revenue * (concentration / 100) / 3;
      
      return {
        dataPoint: `${concentration}% from top 3 clients`,
        benchmark: 'Healthy: <40%',
        gap: `${concentration - 40} points above healthy level`,
        financialImpact: {
          type: 'risk',
          amount: atRisk,
          confidence: 'high',
          calculation: 'Revenue at risk if one major client lost',
        },
        existingService: {
          id: '365-alignment',
          name: 'Goal Alignment Programme',
          priceRange: '£1,500-£4,500/month',
          fitScore: 70,
          howItHelps: 'Strategic diversification plan with accountability',
          expectedOutcome: 'Reduce to <60% within 18 months',
          timeToValue: '90 days',
        },
        newServiceConcept: {
          suggestedName: 'Client Diversification Accelerator',
          description: 'Intensive 90-day programme focused solely on winning new clients to reduce concentration',
          deliverables: [
            'Target client identification and profiling',
            'Outreach strategy and templates',
            'Weekly pipeline review and coaching',
            'CRM setup if needed',
          ],
          suggestedPricing: '£5,000-£10,000 fixed fee',
          skillsRequired: ['Business Development', 'Strategic Planning', 'Sales Coaching'],
          marketSize: 'moderate',
          developmentPriority: 'short-term',
        },
      };
    },
  },

  {
    id: 'concentration_high',
    title: 'High customer concentration',
    category: 'risk_mitigation',
    detect: (d) => {
      const conc = d.supplementary?.client_concentration_top3 || 0;
      return conc >= 60 && conc < 80;
    },
    getSeverity: () => 'high',
    buildOpportunity: (d) => ({
      dataPoint: `${d.supplementary?.client_concentration_top3}% from top 3 clients`,
      benchmark: 'Healthy: <40%',
      existingService: {
        id: '365-alignment',
        name: 'Goal Alignment Programme',
        priceRange: '£1,500-£4,500/month',
        fitScore: 65,
        howItHelps: 'Long-term strategic planning including diversification',
        expectedOutcome: 'Structured approach to client acquisition',
        timeToValue: '90 days',
      },
    }),
  },

  // =========================================================================
  // FOUNDER DEPENDENCY
  // =========================================================================
  {
    id: 'founder_critical',
    title: 'Critical founder dependency',
    category: 'exit_readiness',
    detect: (d) => {
      const knowledge = d.hva?.knowledge_dependency_percentage || 0;
      const brand = d.hva?.personal_brand_percentage || 0;
      const noSuccessor = d.hva?.succession_your_role === 'Nobody';
      const riskLevel = d.founderRisk?.level;
      return knowledge >= 80 || brand >= 85 || noSuccessor || riskLevel === 'critical';
    },
    getSeverity: (d) => {
      const knowledge = d.hva?.knowledge_dependency_percentage || 0;
      const noSuccessor = d.hva?.succession_your_role === 'Nobody';
      return knowledge >= 90 || noSuccessor ? 'critical' : 'high';
    },
    buildOpportunity: (d) => ({
      dataPoint: d.founderRisk?.level 
        ? `Founder risk: ${d.founderRisk.level} (score: ${d.founderRisk.score})`
        : `${d.hva?.knowledge_dependency_percentage}% knowledge concentration`,
      financialImpact: {
        type: 'value',
        amount: (d.financials?.revenue || 0) * 0.3,
        confidence: 'medium',
        calculation: 'Estimated 30% valuation discount',
      },
      existingService: {
        id: '365-alignment',
        name: 'Goal Alignment Programme',
        priceRange: '£1,500-£4,500/month',
        fitScore: 90,
        howItHelps: 'Structured delegation and knowledge transfer with accountability',
        expectedOutcome: 'Reduce dependency to medium/low within 12 months',
        timeToValue: '90 days',
      },
      newServiceConcept: {
        suggestedName: 'Succession Readiness Programme',
        description: 'Intensive focus on documenting processes, transferring relationships, and preparing the business to operate without the founder',
        deliverables: [
          'Business process documentation',
          'Key relationship transition plan',
          'Deputy/successor identification and development',
          'Autonomy testing (founder takes extended leave)',
        ],
        suggestedPricing: '£8,000-£15,000 over 6 months',
        skillsRequired: ['Change Management', 'Process Documentation', 'Leadership Development'],
        marketSize: 'moderate',
        developmentPriority: 'immediate',
      },
    }),
  },

  {
    id: 'founder_high',
    title: 'High founder dependency',
    category: 'exit_readiness',
    detect: (d) => {
      const knowledge = d.hva?.knowledge_dependency_percentage || 0;
      const riskLevel = d.founderRisk?.level;
      return (knowledge >= 60 && knowledge < 80) || riskLevel === 'high';
    },
    getSeverity: () => 'high',
    buildOpportunity: (d) => ({
      dataPoint: d.founderRisk?.valuationImpact || `${d.hva?.knowledge_dependency_percentage}% knowledge concentration`,
      existingService: {
        id: '365-alignment',
        name: 'Goal Alignment Programme',
        priceRange: '£1,500-£4,500/month',
        fitScore: 80,
        howItHelps: 'Knowledge transfer and succession planning',
        expectedOutcome: 'Reduced dependency within 12 months',
        timeToValue: '90 days',
      },
    }),
  },

  // =========================================================================
  // SURPLUS CASH
  // =========================================================================
  {
    id: 'surplus_cash_significant',
    title: 'Significant surplus cash - deployment opportunity',
    category: 'cash_management',
    detect: (d) => (d.financials?.surplusCash || 0) > 500000,
    getSeverity: () => 'opportunity',
    buildOpportunity: (d) => ({
      dataPoint: `£${((d.financials?.surplusCash || 0) / 1000000).toFixed(1)}M surplus`,
      existingService: {
        id: 'profit-extraction',
        name: 'Profit Extraction Strategy',
        priceRange: '£1,500-£3,000',
        fitScore: 85,
        howItHelps: 'Tax-efficient strategies for extracting or deploying surplus',
        expectedOutcome: 'Clear deployment plan with tax efficiency',
        timeToValue: '2 weeks',
      },
      newServiceConcept: {
        suggestedName: 'Capital Deployment Advisory',
        description: 'Strategic advice on deploying surplus cash: acquisition targets, investment returns, debt reduction, dividend strategy',
        deliverables: [
          'Cash deployment options analysis',
          'Acquisition target screening (if relevant)',
          'Investment return modelling',
          'Tax-efficient extraction strategies',
        ],
        suggestedPricing: '£3,000-£8,000',
        skillsRequired: ['Corporate Finance', 'Tax Planning', 'Investment Analysis'],
        marketSize: 'niche',
        developmentPriority: 'medium-term',
      },
    }),
  },

  // =========================================================================
  // PRICING
  // =========================================================================
  {
    id: 'pricing_stale',
    title: 'No recent price increase',
    category: 'financial_performance',
    detect: (d) => {
      const lastIncrease = d.hva?.last_price_increase?.toLowerCase() || '';
      return lastIncrease.includes('more than 2') || lastIncrease.includes('never') || lastIncrease.includes('3+ years');
    },
    getSeverity: () => 'medium',
    buildOpportunity: () => ({
      dataPoint: 'No price increase in 2+ years',
      quickWin: 'Review rates for next client renewal',
      existingService: {
        id: 'fractional-cfo',
        name: 'Fractional CFO',
        priceRange: '£2,500-£5,000/month',
        fitScore: 70,
        howItHelps: 'Pricing strategy and value-based pricing implementation',
        expectedOutcome: '5-15% rate improvement without client loss',
        timeToValue: '60 days',
      },
      newServiceConcept: {
        suggestedName: 'Pricing Power Workshop',
        description: 'Half-day workshop to review pricing, identify value delivered, and plan rate increases',
        deliverables: [
          'Current pricing analysis',
          'Value proposition clarification',
          'Rate increase roadmap',
          'Client communication templates',
        ],
        suggestedPricing: '£750-£1,500',
        skillsRequired: ['Pricing Strategy', 'Client Communication', 'Value Selling'],
        marketSize: 'broad',
        developmentPriority: 'immediate',
      },
    }),
  },

  // =========================================================================
  // SYSTEMS & PROCESSES
  // =========================================================================
  {
    id: 'tech_stack_poor',
    title: 'Technology systems need attention',
    category: 'systems_processes',
    detect: (d) => (d.hva?.tech_stack_health_percentage || 100) < 50,
    getSeverity: (d) => (d.hva?.tech_stack_health_percentage || 100) < 30 ? 'high' : 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.hva?.tech_stack_health_percentage}% tech stack health`,
      existingService: {
        id: 'systems-audit',
        name: 'Systems Audit',
        priceRange: '£2,000-£5,000',
        fitScore: 95,
        howItHelps: 'Comprehensive review of financial and operational systems',
        expectedOutcome: 'Clear roadmap for system improvements',
        timeToValue: '2-3 weeks',
      },
    }),
  },

  // =========================================================================
  // REVENUE TRENDS
  // =========================================================================
  {
    id: 'revenue_declining',
    title: 'Revenue declining year-on-year',
    category: 'growth_capacity',
    detect: (d) => (d.financials?.revenueGrowth || 0) < -10,
    getSeverity: (d) => (d.financials?.revenueGrowth || 0) < -25 ? 'critical' : 'high',
    buildOpportunity: (d) => ({
      dataPoint: `${d.financials?.revenueGrowth?.toFixed(0)}% revenue growth`,
      quickWin: 'Diagnose cause: lost clients, market shift, or capacity?',
      existingService: {
        id: 'fractional-cfo',
        name: 'Fractional CFO',
        priceRange: '£2,500-£5,000/month',
        fitScore: 75,
        howItHelps: 'Strategic analysis of revenue decline and recovery planning',
        expectedOutcome: 'Clear diagnosis and recovery roadmap',
        timeToValue: '30 days',
      },
      newServiceConcept: {
        suggestedName: 'Revenue Recovery Sprint',
        description: '12-week intensive to diagnose decline, win back lost clients, and rebuild pipeline',
        deliverables: [
          'Lost client analysis and win-back plan',
          'Pipeline health assessment',
          'Quick-win identification',
          'Weekly progress reviews',
        ],
        suggestedPricing: '£6,000-£12,000',
        skillsRequired: ['Sales Strategy', 'Client Relationship', 'Pipeline Management'],
        marketSize: 'moderate',
        developmentPriority: 'immediate',
      },
    }),
  },

  // =========================================================================
  // TEAM
  // =========================================================================
  {
    id: 'team_advocacy_low',
    title: 'Low team advocacy (internal NPS)',
    category: 'people_capability',
    detect: (d) => (d.hva?.team_advocacy_percentage || 100) < 50,
    getSeverity: (d) => (d.hva?.team_advocacy_percentage || 100) < 30 ? 'high' : 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.hva?.team_advocacy_percentage}% team advocacy`,
      benchmark: 'Healthy: >70%',
      newServiceConcept: {
        suggestedName: 'Team Engagement Diagnostic',
        description: 'Anonymous survey + facilitated session to understand and address team concerns',
        deliverables: [
          'Anonymous team survey',
          'Facilitated feedback session',
          'Priority issue identification',
          'Action plan',
        ],
        suggestedPricing: '£1,500-£3,000',
        skillsRequired: ['HR', 'Facilitation', 'Change Management'],
        marketSize: 'broad',
        developmentPriority: 'medium-term',
      },
    }),
  },

  {
    id: 'turnover_high',
    title: 'High employee turnover',
    category: 'people_capability',
    detect: (d) => (d.supplementary?.employee_turnover_rate || 0) > 20,
    getSeverity: (d) => (d.supplementary?.employee_turnover_rate || 0) > 35 ? 'high' : 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.supplementary?.employee_turnover_rate}% annual turnover`,
      benchmark: 'Healthy: <15%',
      newServiceConcept: {
        suggestedName: 'Retention Strategy Review',
        description: 'Diagnose turnover causes and develop retention improvement plan',
        deliverables: [
          'Exit interview analysis',
          'Compensation benchmarking',
          'Culture assessment',
          'Retention action plan',
        ],
        suggestedPricing: '£2,000-£4,000',
        skillsRequired: ['HR', 'Compensation', 'Culture'],
        marketSize: 'moderate',
        developmentPriority: 'short-term',
      },
    }),
  },

  // =========================================================================
  // EFFICIENCY
  // =========================================================================
  {
    id: 'utilisation_low',
    title: 'Low utilisation rate',
    category: 'operational_efficiency',
    detect: (d) => (d.supplementary?.utilisation_rate || 100) < 60,
    getSeverity: (d) => (d.supplementary?.utilisation_rate || 100) < 50 ? 'high' : 'medium',
    buildOpportunity: (d) => {
      const revenue = d.financials?.revenue || 0;
      const currentUtil = d.supplementary?.utilisation_rate || 60;
      const targetUtil = 75;
      const upside = revenue * ((targetUtil - currentUtil) / currentUtil);
      
      return {
        dataPoint: `${currentUtil}% utilisation`,
        benchmark: 'Target: 75%',
        financialImpact: {
          type: 'revenue',
          amount: upside,
          confidence: 'medium',
          calculation: 'Revenue capacity at target utilisation',
        },
        existingService: {
          id: 'fractional-coo',
          name: 'Fractional COO',
          priceRange: '£2,500-£5,000/month',
          fitScore: 85,
          howItHelps: 'Resource planning and utilisation optimisation',
          expectedOutcome: '10-15% utilisation improvement',
          timeToValue: '60 days',
        },
      };
    },
  },

  {
    id: 'rpe_low',
    title: 'Low revenue per employee',
    category: 'operational_efficiency',
    detect: (d) => {
      const rpe = d.financials?.revenuePerEmployee || 0;
      const p25 = d.industry?.benchmarks?.revenue_per_employee?.p25 || 80000;
      return rpe > 0 && rpe < p25;
    },
    getSeverity: () => 'high',
    buildOpportunity: (d) => ({
      dataPoint: `£${Math.round((d.financials?.revenuePerEmployee || 0) / 1000)}k per employee`,
      benchmark: `Industry P25: £${Math.round((d.industry?.benchmarks?.revenue_per_employee?.p25 || 80000) / 1000)}k`,
      existingService: {
        id: 'fractional-coo',
        name: 'Fractional COO',
        priceRange: '£2,500-£5,000/month',
        fitScore: 80,
        howItHelps: 'Operational efficiency and process improvement',
        expectedOutcome: '15-25% RPE improvement',
        timeToValue: '90 days',
      },
    }),
  },

  // =========================================================================
  // CASH FLOW
  // =========================================================================
  {
    id: 'debtor_days_high',
    title: 'Cash trapped in debtors',
    category: 'cash_management',
    detect: (d) => (d.financials?.debtorDays || 0) > 60,
    getSeverity: (d) => (d.financials?.debtorDays || 0) > 90 ? 'high' : 'medium',
    buildOpportunity: (d) => {
      const revenue = d.financials?.revenue || 0;
      const debtorDays = d.financials?.debtorDays || 0;
      const cashTied = (revenue / 365) * Math.max(0, debtorDays - 30);
      
      return {
        dataPoint: `${debtorDays} debtor days`,
        benchmark: 'Best practice: 30 days',
        financialImpact: {
          type: 'cost',
          amount: cashTied * 0.08,
          confidence: 'high',
          calculation: 'Working capital × 8% interest',
        },
        existingService: {
          id: 'systems-audit',
          name: 'Systems Audit',
          priceRange: '£2,000-£5,000',
          fitScore: 70,
          howItHelps: 'Credit control process review and optimisation',
          expectedOutcome: 'Reduce debtor days to <45',
          timeToValue: '30 days',
        },
        quickWin: 'Chase oldest unpaid invoices this week',
      };
    },
  },

  // =========================================================================
  // GOVERNANCE
  // =========================================================================
  {
    id: 'no_management_accounts',
    title: 'Limited financial visibility',
    category: 'governance',
    detect: (d) => {
      const suspected = d.assessment?.suspected_underperformance?.toLowerCase() || '';
      const blindspot = d.assessment?.blind_spot_fear?.toLowerCase() || '';
      return suspected.includes('visibility') || 
             blindspot.includes('numbers') ||
             blindspot.includes('financial');
    },
    getSeverity: () => 'high',
    buildOpportunity: () => ({
      dataPoint: 'Operating without regular management information',
      existingService: {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        priceRange: '£650-£2,000/month',
        fitScore: 100,
        howItHelps: 'Monthly management accounts with KPIs and insights',
        expectedOutcome: 'Complete financial visibility within 30 days',
        timeToValue: '14 days',
      },
    }),
  },

  // =========================================================================
  // RECURRING REVENUE
  // =========================================================================
  {
    id: 'low_recurring',
    title: 'Low recurring revenue percentage',
    category: 'strategic_positioning',
    detect: (d) => {
      const recurring = d.hva?.recurring_revenue_percentage;
      return recurring !== undefined && recurring < 30;
    },
    getSeverity: () => 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.hva?.recurring_revenue_percentage}% recurring revenue`,
      benchmark: 'Valuable: >50%',
      newServiceConcept: {
        suggestedName: 'Recurring Revenue Strategy',
        description: 'Workshop to identify opportunities to convert project work to recurring relationships',
        deliverables: [
          'Service productisation analysis',
          'Retainer model design',
          'Client transition roadmap',
          'Pricing structure',
        ],
        suggestedPricing: '£2,500-£5,000',
        skillsRequired: ['Product Strategy', 'Pricing', 'Business Model Design'],
        marketSize: 'moderate',
        developmentPriority: 'short-term',
      },
    }),
  },

  // =========================================================================
  // PIPELINE
  // =========================================================================
  {
    id: 'pipeline_conversion_low',
    title: 'Low pipeline conversion rate',
    category: 'growth_capacity',
    detect: (d) => (d.supplementary?.pipeline_conversion_rate || 100) < 20,
    getSeverity: () => 'medium',
    buildOpportunity: (d) => ({
      dataPoint: `${d.supplementary?.pipeline_conversion_rate}% conversion rate`,
      benchmark: 'Healthy: >30%',
      newServiceConcept: {
        suggestedName: 'Sales Conversion Optimisation',
        description: 'Review and improve sales process to increase win rate',
        deliverables: [
          'Pipeline analysis',
          'Lost deal review',
          'Sales process mapping',
          'Improvement recommendations',
        ],
        suggestedPricing: '£3,000-£6,000',
        skillsRequired: ['Sales Process', 'B2B Sales', 'CRM'],
        marketSize: 'broad',
        developmentPriority: 'short-term',
      },
    }),
  },
];

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export function analyseAllOpportunities(data: ClientDataBundle): Opportunity[] {
  const opportunities: Opportunity[] = [];
  
  for (const rule of DETECTION_RULES) {
    try {
      if (rule.detect(data)) {
        const severity = rule.getSeverity(data);
        const partialOpp = rule.buildOpportunity(data);
        
        opportunities.push({
          id: rule.id,
          title: rule.title,
          category: rule.category,
          categoryLabel: CATEGORY_LABELS[rule.category],
          severity,
          dataPoint: partialOpp.dataPoint || '',
          benchmark: partialOpp.benchmark,
          gap: partialOpp.gap,
          financialImpact: partialOpp.financialImpact,
          existingService: partialOpp.existingService,
          newServiceConcept: partialOpp.newServiceConcept,
          quickWin: partialOpp.quickWin,
          recommendedAction: partialOpp.existingService 
            ? `Consider ${partialOpp.existingService.name}`
            : partialOpp.newServiceConcept 
              ? `Opportunity for: ${partialOpp.newServiceConcept.suggestedName}`
              : 'Review and address',
        });
      }
    } catch (e) {
      console.warn(`[OpportunityEngine] Error evaluating ${rule.id}:`, e);
    }
  }
  
  // Sort by severity
  const severityOrder: Record<OpportunitySeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    opportunity: 4,
  };
  
  return opportunities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// =============================================================================
// ANALYSIS SUMMARY
// =============================================================================

export interface OpportunitySummary {
  totalOpportunities: number;
  bySeverity: Record<OpportunitySeverity, number>;
  byCategory: Record<OpportunityCategory, number>;
  totalFinancialImpact: number;
  existingServiceMatches: number;
  newServiceConcepts: number;
  quickWins: string[];
  priorityActions: Opportunity[];
}

export function getOpportunitySummary(opportunities: Opportunity[]): OpportunitySummary {
  const bySeverity: Record<OpportunitySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    opportunity: 0,
  };
  
  const byCategory: Partial<Record<OpportunityCategory, number>> = {};
  let totalImpact = 0;
  let existingMatches = 0;
  let newConcepts = 0;
  const quickWins: string[] = [];
  
  for (const opp of opportunities) {
    bySeverity[opp.severity]++;
    byCategory[opp.category] = (byCategory[opp.category] || 0) + 1;
    
    if (opp.financialImpact?.amount) {
      totalImpact += opp.financialImpact.amount;
    }
    
    if (opp.existingService) existingMatches++;
    if (opp.newServiceConcept) newConcepts++;
    if (opp.quickWin) quickWins.push(opp.quickWin);
  }
  
  const priorityActions = opportunities.filter(
    o => o.severity === 'critical' || o.severity === 'high'
  ).slice(0, 5);
  
  return {
    totalOpportunities: opportunities.length,
    bySeverity,
    byCategory: byCategory as Record<OpportunityCategory, number>,
    totalFinancialImpact: totalImpact,
    existingServiceMatches: existingMatches,
    newServiceConcepts: newConcepts,
    quickWins,
    priorityActions,
  };
}

// =============================================================================
// NEW SERVICE LIBRARY BUILDER
// =============================================================================

export interface ServiceLibraryEntry extends NewServiceConcept {
  triggeredBy: string[];
  frequency: number;
}

export function buildNewServiceLibrary(
  opportunitiesAcrossClients: Opportunity[][]
): ServiceLibraryEntry[] {
  const serviceMap = new Map<string, ServiceLibraryEntry & { clientCount: number }>();
  
  for (const clientOpps of opportunitiesAcrossClients) {
    for (const opp of clientOpps) {
      if (opp.newServiceConcept) {
        const key = opp.newServiceConcept.suggestedName;
        const existing = serviceMap.get(key);
        
        if (existing) {
          existing.clientCount++;
          if (!existing.triggeredBy.includes(opp.id)) {
            existing.triggeredBy.push(opp.id);
          }
        } else {
          serviceMap.set(key, {
            ...opp.newServiceConcept,
            triggeredBy: [opp.id],
            frequency: 1,
            clientCount: 1,
          });
        }
      }
    }
  }
  
  return Array.from(serviceMap.values())
    .map(({ clientCount, ...service }) => ({
      ...service,
      frequency: clientCount,
    }))
    .sort((a, b) => {
      const priorityOrder = { immediate: 0, 'short-term': 1, 'medium-term': 2, exploratory: 3 };
      const pDiff = priorityOrder[a.developmentPriority] - priorityOrder[b.developmentPriority];
      if (pDiff !== 0) return pDiff;
      return b.frequency - a.frequency;
    });
}

// =============================================================================
// HELPER: BUILD CLIENT DATA BUNDLE FROM REPORT DATA
// =============================================================================

export function buildClientDataBundle(
  reportData: any,
  hvaData?: any,
  supplementaryData?: Record<string, any>,
  industryData?: any
): ClientDataBundle {
  return {
    hva: hvaData?.responses || hvaData,
    financials: {
      revenue: reportData.revenue || reportData.pass1_data?._enriched_revenue || 0,
      revenueGrowth: reportData.financial_trends?.find((t: any) => t.metric === 'revenue')?.direction === 'improving' ? 5 : 
                     reportData.financial_trends?.find((t: any) => t.metric === 'revenue')?.direction === 'declining' ? -10 : 0,
      grossMargin: reportData.gross_margin || reportData.pass1_data?.gross_margin,
      grossMarginTrend: reportData.financial_trends?.find((t: any) => t.metric === 'gross_margin')?.direction,
      netMargin: reportData.net_margin || reportData.pass1_data?.net_margin,
      ebitdaMargin: reportData.ebitda_margin || reportData.pass1_data?.ebitda_margin,
      employeeCount: reportData.employee_count || reportData.pass1_data?._enriched_employee_count,
      revenuePerEmployee: reportData.pass1_data?.revenue_per_employee,
      debtorDays: reportData.debtor_days || reportData.pass1_data?.debtor_days,
      creditorDays: reportData.creditor_days || reportData.pass1_data?.creditor_days,
      currentRatio: reportData.current_ratio,
      cashPosition: reportData.balance_sheet?.cash,
      surplusCash: reportData.surplus_cash?.surplusCash,
      freeholdProperty: reportData.balance_sheet?.freehold_property,
      investments: reportData.balance_sheet?.investments,
    },
    assessment: reportData.assessment_responses?.responses,
    supplementary: {
      client_concentration_top3: reportData.client_concentration_top3 || 
                                  reportData.pass1_data?.client_concentration_top3 ||
                                  supplementaryData?.client_concentration_top3,
      utilisation_rate: supplementaryData?.utilisation_rate,
      blended_hourly_rate: supplementaryData?.blended_hourly_rate,
      avg_project_margin: supplementaryData?.avg_project_margin,
      employee_turnover_rate: supplementaryData?.employee_turnover_rate,
    },
    industry: industryData ? {
      code: industryData.code,
      name: industryData.name,
      benchmarks: industryData.benchmarks || {},
    } : undefined,
    founderRisk: reportData.founder_risk_level ? {
      level: reportData.founder_risk_level,
      score: reportData.founder_risk_score || 0,
      factors: reportData.founder_risk_factors || [],
      valuationImpact: reportData.valuation_impact || '',
    } : undefined,
  };
}

