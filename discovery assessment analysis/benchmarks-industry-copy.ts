// ============================================================================
// INDUSTRY BENCHMARKS - UK SME Standards
// ============================================================================
// Source: Industry data, Torsor client benchmarking
// Last updated: January 2026
// ============================================================================

export interface IndustryBenchmark {
  name: string;
  code: string;
  
  payroll: {
    good: number;      // Efficient - below this is excellent
    typical: number;   // Industry average
    concern: number;   // Above this needs attention
  };
  
  grossMargin: {
    low: number;       // Concern threshold
    typical: number;   // Industry average
    high: number;      // Excellent threshold
  };
  
  revenuePerHead: {
    low: number;       // Below this is concerning
    typical: number;   // Industry average
    high: number;      // Excellent threshold
  };
  
  debtorDays: {
    good: number;      // Excellent collection
    typical: number;   // Industry average
    concern: number;   // Needs attention
  };
  
  stockDays: {
    good: number;      // Efficient inventory
    typical: number;   // Industry average
    concern: number;   // Excess stock
  };
  
  currentRatio: {
    minimum: number;   // Below this is danger
    healthy: number;   // Comfortable position
  };
  
  ebitdaMultiple: {
    low: number;       // Conservative valuation
    typical: number;   // Market average
    high: number;      // Premium valuation
  };
  
  notes: string;
}

// ============================================================================
// INDUSTRY BENCHMARK DATA
// ============================================================================

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  // Distribution & Wholesale
  keys_lockers: {
    name: 'Keys/Lockers Wholesale',
    code: 'keys_lockers',
    payroll: { good: 28, typical: 30, concern: 32 },
    grossMargin: { low: 45, typical: 52, high: 60 },
    revenuePerHead: { low: 100000, typical: 120000, high: 150000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 21, typical: 30, concern: 45 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 3.5, typical: 4.0, high: 5.0 },
    notes: 'Niche wholesale - stable but mature market'
  },
  
  wholesale_distribution: {
    name: 'Wholesale Distribution',
    code: 'wholesale_distribution',
    payroll: { good: 28, typical: 30, concern: 32 },
    grossMargin: { low: 20, typical: 28, high: 35 },
    revenuePerHead: { low: 150000, typical: 200000, high: 300000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 30, typical: 45, concern: 60 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 3.0, typical: 4.0, high: 5.0 },
    notes: 'General wholesale - volume-driven business'
  },
  
  distribution: {
    name: 'Distribution',
    code: 'distribution',
    payroll: { good: 30, typical: 32, concern: 35 },
    grossMargin: { low: 15, typical: 22, high: 30 },
    revenuePerHead: { low: 180000, typical: 250000, high: 350000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 21, typical: 35, concern: 50 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 3.0, typical: 3.5, high: 4.5 },
    notes: 'Logistics-focused distribution'
  },
  
  // Professional Services
  professional_services: {
    name: 'Professional Services',
    code: 'professional_services',
    payroll: { good: 45, typical: 52, concern: 60 },
    grossMargin: { low: 50, typical: 65, high: 80 },
    revenuePerHead: { low: 80000, typical: 120000, high: 180000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 0, typical: 0, concern: 5 },
    currentRatio: { minimum: 1.0, healthy: 1.3 },
    ebitdaMultiple: { low: 3.0, typical: 4.5, high: 6.0 },
    notes: 'People are the product - high payroll is expected'
  },
  
  consulting: {
    name: 'Consulting',
    code: 'consulting',
    payroll: { good: 45, typical: 52, concern: 60 },
    grossMargin: { low: 55, typical: 70, high: 85 },
    revenuePerHead: { low: 100000, typical: 150000, high: 220000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 0, typical: 0, concern: 0 },
    currentRatio: { minimum: 1.0, healthy: 1.3 },
    ebitdaMultiple: { low: 4.0, typical: 5.0, high: 7.0 },
    notes: 'High-value consulting'
  },
  
  accountancy: {
    name: 'Accountancy Practice',
    code: 'accountancy',
    payroll: { good: 45, typical: 50, concern: 55 },
    grossMargin: { low: 55, typical: 65, high: 75 },
    revenuePerHead: { low: 70000, typical: 95000, high: 130000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 0, typical: 0, concern: 0 },
    currentRatio: { minimum: 1.0, healthy: 1.3 },
    ebitdaMultiple: { low: 0.8, typical: 1.0, high: 1.2 }, // GRF multiple for accountancy
    notes: 'Valued on GRF multiple typically'
  },
  
  legal: {
    name: 'Legal Services',
    code: 'legal',
    payroll: { good: 45, typical: 52, concern: 58 },
    grossMargin: { low: 50, typical: 65, high: 80 },
    revenuePerHead: { low: 100000, typical: 150000, high: 250000 },
    debtorDays: { good: 45, typical: 60, concern: 90 },
    stockDays: { good: 0, typical: 0, concern: 0 },
    currentRatio: { minimum: 1.0, healthy: 1.2 },
    ebitdaMultiple: { low: 3.0, typical: 4.0, high: 5.5 },
    notes: 'Legal services - WIP and debtor management critical'
  },
  
  // Technology
  technology: {
    name: 'Technology Services',
    code: 'technology',
    payroll: { good: 35, typical: 42, concern: 50 },
    grossMargin: { low: 50, typical: 65, high: 80 },
    revenuePerHead: { low: 80000, typical: 120000, high: 180000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 0, typical: 5, concern: 15 },
    currentRatio: { minimum: 1.0, healthy: 1.5 },
    ebitdaMultiple: { low: 5.0, typical: 7.0, high: 10.0 },
    notes: 'Tech services - recurring revenue valued highly'
  },
  
  saas: {
    name: 'SaaS / Software',
    code: 'saas',
    payroll: { good: 30, typical: 38, concern: 45 },
    grossMargin: { low: 65, typical: 75, high: 85 },
    revenuePerHead: { low: 100000, typical: 180000, high: 300000 },
    debtorDays: { good: 15, typical: 30, concern: 45 },
    stockDays: { good: 0, typical: 0, concern: 0 },
    currentRatio: { minimum: 1.0, healthy: 1.5 },
    ebitdaMultiple: { low: 6.0, typical: 10.0, high: 15.0 },
    notes: 'SaaS - ARR and churn are key metrics'
  },
  
  software: {
    name: 'Software Development',
    code: 'software',
    payroll: { good: 35, typical: 42, concern: 50 },
    grossMargin: { low: 55, typical: 70, high: 85 },
    revenuePerHead: { low: 80000, typical: 130000, high: 200000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 0, typical: 0, concern: 0 },
    currentRatio: { minimum: 1.0, healthy: 1.5 },
    ebitdaMultiple: { low: 4.0, typical: 6.0, high: 10.0 },
    notes: 'Software development services'
  },
  
  // Construction & Trades
  construction: {
    name: 'Construction',
    code: 'construction',
    payroll: { good: 30, typical: 35, concern: 40 },
    grossMargin: { low: 15, typical: 22, high: 30 },
    revenuePerHead: { low: 100000, typical: 150000, high: 220000 },
    debtorDays: { good: 45, typical: 60, concern: 90 },
    stockDays: { good: 15, typical: 25, concern: 40 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 2.5, typical: 3.5, high: 4.5 },
    notes: 'Construction - project-based, working capital intensive'
  },
  
  trades: {
    name: 'Trade Services',
    code: 'trades',
    payroll: { good: 30, typical: 35, concern: 40 },
    grossMargin: { low: 25, typical: 35, high: 45 },
    revenuePerHead: { low: 60000, typical: 85000, high: 120000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 10, typical: 20, concern: 30 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 2.0, typical: 3.0, high: 4.0 },
    notes: 'Trade services - electricians, plumbers, etc.'
  },
  
  // Retail
  retail: {
    name: 'Retail',
    code: 'retail',
    payroll: { good: 15, typical: 20, concern: 25 },
    grossMargin: { low: 25, typical: 40, high: 55 },
    revenuePerHead: { low: 100000, typical: 150000, high: 250000 },
    debtorDays: { good: 5, typical: 15, concern: 30 },
    stockDays: { good: 30, typical: 60, concern: 90 },
    currentRatio: { minimum: 1.0, healthy: 1.3 },
    ebitdaMultiple: { low: 3.0, typical: 4.0, high: 5.5 },
    notes: 'Retail - stock management is critical'
  },
  
  ecommerce: {
    name: 'E-commerce',
    code: 'ecommerce',
    payroll: { good: 12, typical: 18, concern: 25 },
    grossMargin: { low: 30, typical: 45, high: 60 },
    revenuePerHead: { low: 200000, typical: 350000, high: 600000 },
    debtorDays: { good: 0, typical: 5, concern: 15 },
    stockDays: { good: 21, typical: 35, concern: 60 },
    currentRatio: { minimum: 1.0, healthy: 1.3 },
    ebitdaMultiple: { low: 4.0, typical: 6.0, high: 10.0 },
    notes: 'E-commerce - efficient operations expected'
  },
  
  // Manufacturing
  manufacturing: {
    name: 'Manufacturing',
    code: 'manufacturing',
    payroll: { good: 25, typical: 30, concern: 35 },
    grossMargin: { low: 25, typical: 35, high: 45 },
    revenuePerHead: { low: 100000, typical: 150000, high: 220000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 30, typical: 50, concern: 75 },
    currentRatio: { minimum: 1.3, healthy: 1.6 },
    ebitdaMultiple: { low: 3.0, typical: 4.5, high: 6.0 },
    notes: 'Manufacturing - asset and stock intensive'
  },
  
  // Default for unknown industries
  general_business: {
    name: 'General Business',
    code: 'general_business',
    payroll: { good: 30, typical: 35, concern: 40 },
    grossMargin: { low: 30, typical: 45, high: 60 },
    revenuePerHead: { low: 80000, typical: 120000, high: 180000 },
    debtorDays: { good: 30, typical: 45, concern: 60 },
    stockDays: { good: 21, typical: 35, concern: 60 },
    currentRatio: { minimum: 1.2, healthy: 1.5 },
    ebitdaMultiple: { low: 3.0, typical: 4.0, high: 5.0 },
    notes: 'UK SME average benchmarks'
  }
};

// ============================================================================
// BENCHMARK LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get industry benchmark by code
 */
export function getBenchmark(industryCode: string): IndustryBenchmark {
  const code = (industryCode || '').toLowerCase().replace(/[^a-z_]/g, '_');
  return INDUSTRY_BENCHMARKS[code] || INDUSTRY_BENCHMARKS.general_business;
}

/**
 * Detect industry from assessment responses and company name
 */
export function detectIndustry(
  responses: Record<string, any>,
  companyName?: string
): string {
  const allText = JSON.stringify({ ...responses, companyName }).toLowerCase();
  
  // Keys/lockers detection (specific niche)
  if (allText.includes('key') || allText.includes('locker') || allText.includes('lock') || 
      allText.includes('security hardware') || allText.includes('office furniture')) {
    return 'keys_lockers';
  }
  
  // Distribution
  if (allText.includes('distribut') || allText.includes('wholesale') || allText.includes('supply chain')) {
    return 'wholesale_distribution';
  }
  
  // SaaS / Software
  if (allText.includes('saas') || allText.includes('subscription') || allText.includes('recurring revenue')) {
    return 'saas';
  }
  if (allText.includes('software') || allText.includes('platform') || allText.includes('app')) {
    return 'software';
  }
  
  // Technology
  if (allText.includes('tech') || allText.includes('it services') || allText.includes('digital')) {
    return 'technology';
  }
  
  // Professional Services
  if (allText.includes('consult') || allText.includes('advisory')) {
    return 'consulting';
  }
  if (allText.includes('accountan') || allText.includes('bookkeep')) {
    return 'accountancy';
  }
  if (allText.includes('legal') || allText.includes('solicitor') || allText.includes('law firm')) {
    return 'legal';
  }
  
  // Construction & Trades
  if (allText.includes('construction') || allText.includes('building') || allText.includes('contractor')) {
    return 'construction';
  }
  if (allText.includes('electrician') || allText.includes('plumber') || allText.includes('tradesman')) {
    return 'trades';
  }
  
  // Retail
  if (allText.includes('ecommerce') || allText.includes('online store') || allText.includes('shopify')) {
    return 'ecommerce';
  }
  if (allText.includes('retail') || allText.includes('shop') || allText.includes('store')) {
    return 'retail';
  }
  
  // Manufacturing
  if (allText.includes('manufactur') || allText.includes('factory') || allText.includes('production')) {
    return 'manufacturing';
  }
  
  return 'general_business';
}

/**
 * Get payroll benchmark status
 */
export function getPayrollStatus(
  staffCostsPct: number,
  benchmark: IndustryBenchmark
): 'efficient' | 'typical' | 'elevated' | 'concerning' {
  if (staffCostsPct <= benchmark.payroll.good) return 'efficient';
  if (staffCostsPct <= benchmark.payroll.typical) return 'typical';
  if (staffCostsPct <= benchmark.payroll.concern) return 'elevated';
  return 'concerning';
}

/**
 * Get gross margin status
 */
export function getGrossMarginStatus(
  grossMarginPct: number,
  benchmark: IndustryBenchmark
): 'excellent' | 'healthy' | 'typical' | 'concerning' {
  if (grossMarginPct >= benchmark.grossMargin.high) return 'excellent';
  if (grossMarginPct >= benchmark.grossMargin.typical) return 'healthy';
  if (grossMarginPct >= benchmark.grossMargin.low) return 'typical';
  return 'concerning';
}

/**
 * Get revenue per head status
 */
export function getRevenuePerHeadStatus(
  revenuePerHead: number,
  benchmark: IndustryBenchmark
): 'excellent' | 'good' | 'typical' | 'concerning' {
  if (revenuePerHead >= benchmark.revenuePerHead.high) return 'excellent';
  if (revenuePerHead >= benchmark.revenuePerHead.typical) return 'good';
  if (revenuePerHead >= benchmark.revenuePerHead.low) return 'typical';
  return 'concerning';
}
