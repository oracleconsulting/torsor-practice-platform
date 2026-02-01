/**
 * Issue-to-Service Mapping for Benchmarking ACT Phase
 * Links identified issues/gaps to recommended Torsor services
 */

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  description: string;
  priceRange: string;
  howItHelps: string;
  expectedOutcome: string;
  timeToValue: string;
  priority: 'immediate' | 'short-term' | 'medium-term';
}

export interface IssueMapping {
  issueType: string;
  triggerConditions: (metrics: IssueMetrics) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  headline: string;
  description: string;
  services: ServiceRecommendation[];
}

export interface IssueMetrics {
  grossMargin?: number;
  netMargin?: number;
  ebitdaMargin?: number;
  revenuePerEmployee?: number;
  debtorDays?: number;
  creditorDays?: number;
  clientConcentration?: number;
  founderRiskScore?: number;
  founderRiskLevel?: string;
  cashMonths?: number;
  surplusCash?: number;
  revenue?: number;
  employeeCount?: number;
  industryCode?: string;
  // Benchmark medians for comparison
  benchmarks?: {
    grossMargin?: number;
    netMargin?: number;
    revenuePerEmployee?: number;
    debtorDays?: number;
  };
}

export interface DetectedIssue {
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  headline: string;
  description: string;
  dataPoint: string;
  services: ServiceRecommendation[];
}

// =============================================================================
// SERVICE DEFINITIONS
// =============================================================================

const SERVICES = {
  businessIntelligence: {
    serviceId: 'business-intelligence',
    serviceName: 'Business Intelligence',
    description: 'Monthly financial clarity with KPIs, True Cash position, and actionable insights',
    priceRange: '£650-£2,000/month',
    timeToValue: '30 days',
  },
  benchmarking: {
    serviceId: 'benchmarking',
    serviceName: 'Benchmarking Deep Dive',
    description: 'Quarterly benchmark refresh with trend analysis and action tracking',
    priceRange: '£1,500-£3,500/quarter',
    timeToValue: '2 weeks',
  },
  goalAlignment: {
    serviceId: '365-alignment',
    serviceName: 'Goal Alignment Programme',
    description: '12-month transformation with 5-year vision, 6-month shifts, and 12-week sprints',
    priceRange: '£1,500-£4,500/month',
    timeToValue: '90 days',
  },
  systemsAudit: {
    serviceId: 'systems-audit',
    serviceName: 'Systems Audit',
    description: 'Comprehensive review of financial systems, processes, and controls',
    priceRange: '£2,000-£5,000',
    timeToValue: '3 weeks',
  },
  fractionalCFO: {
    serviceId: 'fractional-cfo',
    serviceName: 'Fractional CFO',
    description: 'Strategic finance leadership on a part-time basis',
    priceRange: '£2,500-£5,000/month',
    timeToValue: '60 days',
  },
  fractionalCOO: {
    serviceId: 'fractional-coo',
    serviceName: 'Fractional COO',
    description: 'Operational leadership and efficiency improvement',
    priceRange: '£2,500-£5,000/month',
    timeToValue: '60 days',
  },
  profitExtraction: {
    serviceId: 'profit-extraction',
    serviceName: 'Profit Extraction Strategy',
    description: 'Tax-efficient profit distribution and remuneration planning',
    priceRange: '£1,500-£3,000',
    timeToValue: '2 weeks',
  },
  automation: {
    serviceId: 'automation',
    serviceName: 'Finance Automation',
    description: 'Streamline data capture, reduce manual work, improve accuracy',
    priceRange: '£115-£180/hour',
    timeToValue: '4 weeks',
  },
  ffi: {
    serviceId: 'ffi-advisory',
    serviceName: 'Future Financial Information',
    description: 'Forward-looking financial planning with scenario modelling',
    priceRange: '£2,500-£5,000',
    timeToValue: '4 weeks',
  },
};

// =============================================================================
// ISSUE MAPPINGS
// =============================================================================

export const ISSUE_MAPPINGS: IssueMapping[] = [
  // =========================================================================
  // MARGIN ISSUES
  // =========================================================================
  {
    issueType: 'low_gross_margin',
    triggerConditions: (m) => {
      const benchmark = m.benchmarks?.grossMargin || 35;
      return (m.grossMargin || 0) < benchmark * 0.7; // More than 30% below median
    },
    severity: 'high',
    headline: 'Gross margin significantly below industry',
    description: 'Your gross margin indicates potential pricing or efficiency issues that are costing you significant profit.',
    services: [
      {
        ...SERVICES.businessIntelligence,
        howItHelps: 'Monthly project-level profitability analysis reveals which work is margin-dilutive',
        expectedOutcome: 'Identify and eliminate unprofitable work; 3-5% margin improvement typical',
        priority: 'immediate',
      },
      {
        ...SERVICES.fractionalCFO,
        howItHelps: 'Strategic pricing review and cost structure optimisation',
        expectedOutcome: 'Pricing strategy that protects margins without losing clients',
        priority: 'short-term',
      },
    ],
  },
  
  {
    issueType: 'margin_below_median',
    triggerConditions: (m) => {
      const benchmark = m.benchmarks?.grossMargin || 35;
      return (m.grossMargin || 0) < benchmark && (m.grossMargin || 0) >= benchmark * 0.7;
    },
    severity: 'medium',
    headline: 'Gross margin below industry median',
    description: 'There\'s opportunity to improve margins through pricing or operational efficiency.',
    services: [
      {
        ...SERVICES.benchmarking,
        howItHelps: 'Quarterly tracking keeps margin improvement front and centre',
        expectedOutcome: 'Structured improvement plan with measurable milestones',
        priority: 'short-term',
      },
    ],
  },
  
  // =========================================================================
  // CUSTOMER CONCENTRATION
  // =========================================================================
  {
    issueType: 'critical_concentration',
    triggerConditions: (m) => (m.clientConcentration || 0) >= 80,
    severity: 'critical',
    headline: 'Critical customer concentration risk',
    description: 'With over 80% of revenue from your top 3 clients, your business is highly vulnerable. This significantly impacts valuation and exit options.',
    services: [
      {
        ...SERVICES.goalAlignment,
        howItHelps: 'Structured diversification strategy with accountability and tracking',
        expectedOutcome: 'Reduce concentration to <60% over 12-18 months',
        priority: 'immediate',
      },
      {
        ...SERVICES.fractionalCOO,
        howItHelps: 'Operational capacity to pursue new clients without dropping service quality',
        expectedOutcome: 'Systems to scale client acquisition without founder bottleneck',
        priority: 'short-term',
      },
    ],
  },
  
  {
    issueType: 'high_concentration',
    triggerConditions: (m) => (m.clientConcentration || 0) >= 60 && (m.clientConcentration || 0) < 80,
    severity: 'high',
    headline: 'High customer concentration',
    description: 'With 60%+ of revenue from your top 3 clients, you\'re exposed to significant risk if any relationship changes.',
    services: [
      {
        ...SERVICES.goalAlignment,
        howItHelps: 'Build diversification into your strategic plan with quarterly reviews',
        expectedOutcome: 'Reduce concentration to <50% over 18-24 months',
        priority: 'short-term',
      },
    ],
  },
  
  // =========================================================================
  // FOUNDER/KEY PERSON RISK
  // =========================================================================
  {
    issueType: 'critical_founder_risk',
    triggerConditions: (m) => m.founderRiskLevel === 'critical' || (m.founderRiskScore || 0) >= 60,
    severity: 'critical',
    headline: 'Critical founder dependency',
    description: 'Your business cannot function without you. This creates personal risk and a 30-50% valuation discount.',
    services: [
      {
        ...SERVICES.goalAlignment,
        howItHelps: 'Systematic delegation and documentation of your role over 12 months',
        expectedOutcome: 'Business that runs without you for 90+ days',
        priority: 'immediate',
      },
      {
        ...SERVICES.systemsAudit,
        howItHelps: 'Document all critical processes and identify knowledge gaps',
        expectedOutcome: 'Complete process documentation and succession roadmap',
        priority: 'immediate',
      },
      {
        ...SERVICES.fractionalCOO,
        howItHelps: 'Build operational capability that doesn\'t depend on you',
        expectedOutcome: 'Self-sufficient operations team within 6 months',
        priority: 'short-term',
      },
    ],
  },
  
  {
    issueType: 'high_founder_risk',
    triggerConditions: (m) => m.founderRiskLevel === 'high' || ((m.founderRiskScore || 0) >= 40 && (m.founderRiskScore || 0) < 60),
    severity: 'high',
    headline: 'High founder dependency',
    description: 'Key business functions still depend heavily on you, creating a 20-30% valuation discount.',
    services: [
      {
        ...SERVICES.goalAlignment,
        howItHelps: 'Structured plan to reduce dependency through delegation',
        expectedOutcome: 'Reduced dependency to medium/low within 12 months',
        priority: 'short-term',
      },
    ],
  },
  
  // =========================================================================
  // CASH & WORKING CAPITAL
  // =========================================================================
  {
    issueType: 'poor_cash_collection',
    triggerConditions: (m) => (m.debtorDays || 0) > 60,
    severity: 'high',
    headline: 'Slow cash collection',
    description: 'Long debtor days tie up working capital and increase financing costs.',
    services: [
      {
        ...SERVICES.automation,
        howItHelps: 'Automated invoicing and chase sequences to reduce manual effort',
        expectedOutcome: 'Reduce debtor days by 15-20 days within 60 days',
        priority: 'immediate',
      },
      {
        ...SERVICES.businessIntelligence,
        howItHelps: 'Weekly cash tracking and debtor aging analysis',
        expectedOutcome: 'Visibility to catch slow payers early',
        priority: 'short-term',
      },
    ],
  },
  
  {
    issueType: 'elevated_debtor_days',
    triggerConditions: (m) => (m.debtorDays || 0) > 45 && (m.debtorDays || 0) <= 60,
    severity: 'medium',
    headline: 'Above-average debtor days',
    description: 'Your cash collection is slower than ideal, reducing available working capital.',
    services: [
      {
        ...SERVICES.businessIntelligence,
        howItHelps: 'Monthly debtor tracking keeps collection front of mind',
        expectedOutcome: 'Reduce debtor days to under 45 within 90 days',
        priority: 'short-term',
      },
    ],
  },
  
  // =========================================================================
  // EFFICIENCY / PRODUCTIVITY
  // =========================================================================
  {
    issueType: 'low_revenue_per_employee',
    triggerConditions: (m) => {
      const benchmark = m.benchmarks?.revenuePerEmployee || 120000;
      return (m.revenuePerEmployee || 0) < benchmark * 0.75;
    },
    severity: 'high',
    headline: 'Low revenue per employee',
    description: 'Your team productivity is significantly below industry benchmarks, suggesting utilisation or pricing issues.',
    services: [
      {
        ...SERVICES.businessIntelligence,
        howItHelps: 'Utilisation tracking and capacity planning insights',
        expectedOutcome: 'Identify and address the productivity gaps',
        priority: 'immediate',
      },
      {
        ...SERVICES.fractionalCOO,
        howItHelps: 'Operational review to identify bottlenecks and inefficiencies',
        expectedOutcome: '15-25% improvement in revenue per employee',
        priority: 'short-term',
      },
    ],
  },
  
  // =========================================================================
  // SURPLUS CASH / HIDDEN VALUE
  // =========================================================================
  {
    issueType: 'significant_surplus_cash',
    triggerConditions: (m) => (m.surplusCash || 0) > 500000,
    severity: 'low', // Not a problem, but an opportunity
    headline: 'Significant surplus cash identified',
    description: 'You have cash above your operating requirements that could be working harder.',
    services: [
      {
        ...SERVICES.profitExtraction,
        howItHelps: 'Tax-efficient strategies to extract or deploy surplus cash',
        expectedOutcome: 'Optimised cash deployment with tax efficiency',
        priority: 'medium-term',
      },
      {
        ...SERVICES.ffi,
        howItHelps: 'Model investment scenarios to put surplus cash to work',
        expectedOutcome: 'Clear investment plan with projected returns',
        priority: 'medium-term',
      },
    ],
  },
  
  // =========================================================================
  // FINANCIAL VISIBILITY
  // =========================================================================
  {
    issueType: 'no_regular_reporting',
    triggerConditions: () => false, // Triggered manually based on assessment
    severity: 'medium',
    headline: 'Limited financial visibility',
    description: 'Without regular management reporting, you\'re flying blind on business performance.',
    services: [
      {
        ...SERVICES.businessIntelligence,
        howItHelps: 'Monthly management accounts with KPIs and insights',
        expectedOutcome: 'Clear visibility into business performance within 30 days',
        priority: 'immediate',
      },
    ],
  },
];

// =============================================================================
// DETECTION FUNCTION
// =============================================================================

export function detectIssues(metrics: IssueMetrics): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  
  for (const mapping of ISSUE_MAPPINGS) {
    try {
      if (mapping.triggerConditions(metrics)) {
        // Build data point string based on issue type
        let dataPoint = '';
        switch (mapping.issueType) {
          case 'low_gross_margin':
          case 'margin_below_median':
            dataPoint = `${metrics.grossMargin?.toFixed(1)}% gross margin vs ${metrics.benchmarks?.grossMargin || 35}% median`;
            break;
          case 'critical_concentration':
          case 'high_concentration':
            dataPoint = `${metrics.clientConcentration}% from top 3 clients`;
            break;
          case 'critical_founder_risk':
          case 'high_founder_risk':
            dataPoint = `Founder risk score: ${metrics.founderRiskScore}/100`;
            break;
          case 'poor_cash_collection':
          case 'elevated_debtor_days':
            dataPoint = `${metrics.debtorDays} days vs 45 day benchmark`;
            break;
          case 'low_revenue_per_employee':
            dataPoint = `£${Math.round((metrics.revenuePerEmployee || 0) / 1000)}k vs £${Math.round((metrics.benchmarks?.revenuePerEmployee || 120000) / 1000)}k median`;
            break;
          case 'significant_surplus_cash':
            dataPoint = `£${((metrics.surplusCash || 0) / 1000000).toFixed(1)}M surplus identified`;
            break;
          default:
            dataPoint = 'Based on your data';
        }
        
        issues.push({
          issueType: mapping.issueType,
          severity: mapping.severity,
          headline: mapping.headline,
          description: mapping.description,
          dataPoint,
          services: mapping.services,
        });
      }
    } catch (e) {
      console.warn(`[IssueMapping] Error evaluating ${mapping.issueType}:`, e);
    }
  }
  
  // Sort by severity (critical > high > medium > low)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return issues;
}

// =============================================================================
// GET PRIORITY SERVICES (Top 3 across all issues)
// =============================================================================

export function getPriorityServices(issues: DetectedIssue[], maxServices: number = 3): ServiceRecommendation[] {
  const serviceMap = new Map<string, { service: ServiceRecommendation; score: number }>();
  
  const severityScores = { critical: 10, high: 7, medium: 4, low: 2 };
  const priorityScores = { immediate: 5, 'short-term': 3, 'medium-term': 1 };
  
  for (const issue of issues) {
    for (const service of issue.services) {
      const existing = serviceMap.get(service.serviceId);
      const score = severityScores[issue.severity] + priorityScores[service.priority];
      
      if (!existing || existing.score < score) {
        serviceMap.set(service.serviceId, { service, score });
      }
    }
  }
  
  return Array.from(serviceMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxServices)
    .map(item => item.service);
}

