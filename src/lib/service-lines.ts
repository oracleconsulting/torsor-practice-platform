/**
 * BSG Service Lines - All 10 Active Advisory Services
 * Copied from live archive and adapted for clean v2 architecture
 */

export const BSG_SERVICE_LINES = [
  'Automation',
  'Management Accounts',
  'Future Financial Information / Advisory Accelerator',
  'Benchmarking - External and Internal',
  '365 Alignment Programme',
  'Systems Audit',
  'Profit Extraction / Remuneration Strategies',
  'Fractional CFO Services',
  'Fractional COO Services',
  'Combined CFO/COO Advisory'
] as const;

export type BSGServiceLine = typeof BSG_SERVICE_LINES[number];

// Simple service definitions for capability assessment
export const SERVICE_DEFINITIONS = {
  'Automation': {
    id: 'automation',
    description: 'Data capture, system integration, and finance automation',
    priceRange: '£115-£180/hour',
    deliveryTime: 'Half-day to multi-day',
    coreSkills: [
      'System Implementation & Change Management',
      'Technology & Digital Literacy',
      'Process Design & Optimisation',
      'Software Proficiency',
      'Client Communication'
    ]
  },
  'Management Accounts': {
    id: 'management-accounts',
    description: 'Regular financial reporting with KPI analysis',
    priceRange: '£650/month',
    deliveryTime: 'Monthly/quarterly',
    coreSkills: [
      'Management Reporting',
      'Financial Analysis',
      'KPI Framework Design',
      'Cash Flow Management',
      'Variance Analysis'
    ]
  },
  'Future Financial Information / Advisory Accelerator': {
    id: 'ffi-advisory',
    description: 'Forward-looking financial planning and scenario analysis',
    priceRange: '£2,500-£5,000',
    deliveryTime: '2-4 weeks',
    coreSkills: [
      'Budgeting & Forecasting',
      'Financial Modelling',
      'Scenario Planning',
      'Cash Flow Forecasting',
      'Strategic Planning'
    ]
  },
  'Benchmarking - External and Internal': {
    id: 'benchmarking',
    description: 'Comparative analysis and performance measurement',
    priceRange: '£1,500-£3,500',
    deliveryTime: '1-2 weeks',
    coreSkills: [
      'Data Analysis & Interpretation',
      'Financial Analysis',
      'Industry Analysis',
      'Performance Metrics',
      'Report Writing'
    ]
  },
  '365 Alignment Programme': {
    id: '365-alignment',
    description: 'Microsoft 365 optimization and business alignment',
    priceRange: '£3,000-£7,500',
    deliveryTime: '2-6 weeks',
    coreSkills: [
      'Technology & Digital Literacy',
      'System Implementation & Change Management',
      'Process Design & Optimisation',
      'Training & Knowledge Transfer',
      'Project Management'
    ]
  },
  'Systems Audit': {
    id: 'systems-audit',
    description: 'Comprehensive review of financial systems and processes',
    priceRange: '£2,000-£5,000',
    deliveryTime: '1-3 weeks',
    coreSkills: [
      'Systems Analysis',
      'Process Review',
      'Risk Assessment',
      'Compliance Knowledge',
      'Report Writing'
    ]
  },
  'Profit Extraction / Remuneration Strategies': {
    id: 'profit-extraction',
    description: 'Tax-efficient profit distribution and remuneration planning',
    priceRange: '£1,500-£3,000',
    deliveryTime: '1-2 weeks',
    coreSkills: [
      'Tax Planning',
      'Financial Strategy',
      'Regulatory Knowledge',
      'Financial Modelling',
      'Client Communication'
    ]
  },
  'Fractional CFO Services': {
    id: 'fractional-cfo',
    description: 'Part-time strategic finance leadership',
    priceRange: '£2,500-£5,000/month',
    deliveryTime: 'Ongoing',
    coreSkills: [
      'Strategic Planning',
      'Financial Strategy',
      'Leadership & Management',
      'Stakeholder Management',
      'Commercial Acumen'
    ]
  },
  'Fractional COO Services': {
    id: 'fractional-coo',
    description: 'Part-time operational leadership and efficiency',
    priceRange: '£2,500-£5,000/month',
    deliveryTime: 'Ongoing',
    coreSkills: [
      'Operations Management',
      'Process Optimisation',
      'Leadership & Management',
      'Project Management',
      'Performance Management'
    ]
  },
  'Combined CFO/COO Advisory': {
    id: 'combined-cfo-coo',
    description: 'Integrated financial and operational leadership',
    priceRange: '£4,000-£8,000/month',
    deliveryTime: 'Ongoing',
    coreSkills: [
      'Strategic Planning',
      'Financial Strategy',
      'Operations Management',
      'Leadership & Management',
      'Change Management'
    ]
  }
};

