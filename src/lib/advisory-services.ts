/**
 * Advisory Services Skills Mapping
 * All 10 BSG service lines with required skills
 */

export type SeniorityLevel = 'Partner' | 'Director' | 'Associate Director' | 'Manager' | 'Assistant Manager' | 'Senior' | 'Junior' | 'Admin';

export interface ServiceSkillRequirement {
  skillName: string;
  minimumLevel: number; // 1-5
  idealLevel: number; // 1-5
  criticalToDelivery: boolean;
  recommendedSeniority: SeniorityLevel[];
}

export interface ServiceLine {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  deliveryTime: string;
  requiredSkills: ServiceSkillRequirement[];
}

export const ADVISORY_SERVICES: ServiceLine[] = [
  {
    id: 'automation',
    name: 'Automation',
    description: 'Data capture, system integration, and finance automation',
    priceRange: '£115-£180/hour',
    deliveryTime: 'Half-day to multi-day',
    requiredSkills: [
      {
        skillName: 'Accounting System Selection',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Xero Complete Mastery',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'QuickBooks Advanced',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Zapier/Make Automation',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior', 'Junior']
      },
      {
        skillName: 'Dext (Receipt Bank)',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Client Relationship Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      }
    ]
  },
  {
    id: 'management-accounts',
    name: 'Management Accounts',
    description: 'Regular financial reporting with KPI analysis',
    priceRange: '£650/month',
    deliveryTime: 'Monthly/quarterly',
    requiredSkills: [
      {
        skillName: 'Management Pack Production',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Financial Statements Preparation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'KPI Framework Design',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Dashboard Design',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Variance Commentary',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      }
    ]
  },
  {
    id: 'ffi-advisory',
    name: 'Future Financial Information / Advisory Accelerator',
    description: 'Forward-looking financial planning and scenario analysis',
    priceRange: '£2,500-£5,000',
    deliveryTime: '2-4 weeks',
    requiredSkills: [
      {
        skillName: 'Budget Preparation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Senior']
      },
      {
        skillName: 'Financial Modelling & Forecasting',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Senior']
      },
      {
        skillName: 'Scenario Planning',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Senior']
      },
      {
        skillName: 'Three-way Forecasting',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Strategic Financial Planning',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Director']
      }
    ]
  },
  {
    id: 'benchmarking',
    name: 'Benchmarking - External and Internal',
    description: 'Comparative analysis and performance measurement',
    priceRange: '£1,500-£3,500',
    deliveryTime: '1-2 weeks',
    requiredSkills: [
      {
        skillName: 'Benchmarking Interpretation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'KPI Framework Design',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Dashboard Design',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Senior', 'Director']
      }
    ]
  },
  {
    id: '365-alignment',
    name: '365 Alignment Programme',
    description: 'Microsoft 365 optimization and business alignment',
    priceRange: '£3,000-£7,500',
    deliveryTime: '2-6 weeks',
    requiredSkills: [
      {
        skillName: '365 Alignment Facilitation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Strategic Options Appraisal',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Training Design & Delivery',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Project Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager', 'Senior']
      }
    ]
  },
  {
    id: 'systems-audit',
    name: 'Systems Audit',
    description: 'Comprehensive review of financial systems and processes',
    priceRange: '£2,000-£5,000',
    deliveryTime: '1-3 weeks',
    requiredSkills: [
      {
        skillName: 'Accounting System Selection',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Risk Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      }
    ]
  },
  {
    id: 'profit-extraction',
    name: 'Profit Extraction / Remuneration Strategies',
    description: 'Tax-efficient profit distribution and remuneration planning',
    priceRange: '£1,500-£3,000',
    deliveryTime: '1-2 weeks',
    requiredSkills: [
      {
        skillName: 'Tax Planning & Advisory',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Strategic Financial Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Capital Gains Tax Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      }
    ]
  },
  {
    id: 'fractional-cfo',
    name: 'Fractional CFO Services',
    description: 'Part-time strategic finance leadership',
    priceRange: '£2,500-£5,000/month',
    deliveryTime: 'Ongoing',
    requiredSkills: [
      {
        skillName: 'Strategic Financial Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Board Presentation Skills',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Leadership & Mentoring',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Client Relationship Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      }
    ]
  },
  {
    id: 'fractional-coo',
    name: 'Fractional COO Services',
    description: 'Part-time operational leadership and efficiency',
    priceRange: '£2,500-£5,000/month',
    deliveryTime: 'Ongoing',
    requiredSkills: [
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Performance Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Leadership & Mentoring',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Project Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Director']
      }
    ]
  },
  {
    id: 'combined-cfo-coo',
    name: 'Combined CFO/COO Advisory',
    description: 'Integrated financial and operational leadership',
    priceRange: '£4,000-£8,000/month',
    deliveryTime: 'Ongoing',
    requiredSkills: [
      {
        skillName: 'Strategic Financial Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Board Presentation Skills',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Leadership & Mentoring',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Performance Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      }
    ]
  }
];

