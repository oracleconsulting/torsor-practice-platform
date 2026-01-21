/**
 * Advisory Services Skills Mapping
 * Maps all 7 BSG service lines to the 111 RPGCC assessed skills
 * Includes seniority levels for task allocation
 */

export type SeniorityLevel = 'Partner' | 'Director' | 'Associate Director' | 'Manager' | 'Assistant Manager' | 'Senior' | 'Junior' | 'Admin';

export interface ServiceSkillRequirement {
  skillName: string; // From the 111 assessed skills
  minimumLevel: number; // 1-5 scale
  idealLevel: number; // 1-5 scale
  criticalToDelivery: boolean; // Must-have vs nice-to-have
  recommendedSeniority: SeniorityLevel[]; // Who should perform this
}

export interface ServiceLine {
  id: string;
  name: string;
  description: string;
  comingSoon?: boolean;
  priceRange: string;
  deliveryTime: string;
  features: string[];
  benefits: string[];
  requiredSkills: ServiceSkillRequirement[];
  deliveryTeam: {
    seniority: SeniorityLevel;
    responsibilities: string[];
    hoursEstimate: string;
  }[];
}

/**
 * Complete mapping of all 7 BSG service lines
 */
export const advisoryServicesMap: ServiceLine[] = [
  {
    id: 'automation',
    name: 'Automation',
    description: 'Data capture, system integration, and finance automation',
    priceRange: '£115-£180/hour + setup costs',
    deliveryTime: 'Half-day to multi-day depending on scope',
    features: [
      'Data capture: scan invoices & receipts to electronic format',
      'System integration: auto-upload to data entry software',
      'Bank feed setup and troubleshooting',
      'AI-driven categorisation rules',
      'Chart of accounts setup',
      'Link bookkeeping to analytics (Xero → Spotlight/Syft)',
      'Dashboard setup for monitoring',
      'Produce Business Intelligence reports',
      'Forecasting and cashflow facilitation'
    ],
    benefits: [
      'Time savings through automation',
      'Error reduction and improved efficiency',
      'Quick access to financial information',
      'Improved visibility for decision-making',
      'Lower costs through optimised processes'
    ],
    requiredSkills: [
      {
        skillName: 'System Implementation & Change Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Technology & Digital Literacy',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Process Design & Optimisation',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Software Proficiency',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior', 'Junior']
      },
      {
        skillName: 'Data Management & Analysis',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Chart of Accounts Design',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Client Communication',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Training & Knowledge Transfer',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Problem Diagnosis & Troubleshooting',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Director',
        responsibilities: [
          'Initial consultation and scope definition',
          'System architecture design',
          'Client sign-off and project oversight',
          'Complex integration troubleshooting'
        ],
        hoursEstimate: '2-4 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Technical implementation',
          'Chart of accounts design',
          'Rule-based categorisation setup',
          'Testing and quality assurance',
          'Client training delivery'
        ],
        hoursEstimate: '4-8 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Data migration and cleanup',
          'Bank feed configuration',
          'Dashboard template setup',
          'User acceptance testing support',
          'Documentation creation'
        ],
        hoursEstimate: '3-6 hours'
      },
      {
        seniority: 'Junior',
        responsibilities: [
          'Data entry and verification',
          'Basic software configuration',
          'Client onboarding admin',
          'Follow-up support'
        ],
        hoursEstimate: '2-4 hours'
      }
    ]
  },
  {
    id: 'business-intelligence',
    name: 'Business Intelligence',
    description: 'Financial clarity with True Cash position, KPIs, AI insights and forecasts',
    priceRange: '£650/month (monthly) or £1,750/quarter',
    deliveryTime: 'Monthly or quarterly delivery',
    features: [
      'Completed on suitable software package',
      'Data check for year-end compatibility',
      'Monthly, quarterly, or adhoc frequency',
      'KPI commentary and key findings',
      'Cash flow waterfall analysis',
      'Spotlight-derived position and performance analysis'
    ],
    benefits: [
      'Reliable financial information throughout the year',
      'Assists with finance, lending, and working capital decisions',
      'Better liquidity management',
      'Performance monitoring against targets',
      'Informed decision-making'
    ],
    requiredSkills: [
      {
        skillName: 'Management Reporting',
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
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Financial Analysis',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Cash Flow Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Variance Analysis',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Commercial Acumen',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Data Visualisation & Reporting',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Attention to Detail',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior', 'Junior']
      },
      {
        skillName: 'Written Communication',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Business Understanding',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Director',
        responsibilities: [
          'Review and sign-off on management pack',
          'KPI commentary and insights',
          'Client presentation (if required)',
          'Strategic recommendations'
        ],
        hoursEstimate: '1-2 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Prepare management accounts pack',
          'Variance analysis and commentary',
          'Cash flow waterfall creation',
          'Spotlight/analytics integration',
          'Quality review of all outputs'
        ],
        hoursEstimate: '3-5 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Data extraction and reconciliation',
          'Report generation from software',
          'Basic variance calculations',
          'Chart and graph creation'
        ],
        hoursEstimate: '2-3 hours'
      },
      {
        seniority: 'Junior',
        responsibilities: [
          'Data verification',
          'Report formatting',
          'Distribution to client'
        ],
        hoursEstimate: '0.5-1 hour'
      }
    ]
  },
  {
    id: 'advisory-accelerator',
    name: 'Future Financial Information / Advisory Accelerator',
    description: 'Budgets, forecasts, valuations, and ongoing advisory support',
    priceRange: '£1,000-£4,000 (forecasts) | £1,500-£9,000 (ongoing programs)',
    deliveryTime: 'One-off engagements or monthly/quarterly retainers',
    features: [
      'Budgets, forecasts, and cashflow projections',
      'Business valuations',
      'Historic financial information analysis',
      'Hands-on sessions to establish expectations',
      'Scenario planning (margins, volumes, staff)',
      'Re-occurring advisory at set intervals'
    ],
    benefits: [
      'Visibility of future performance and business impact',
      'Understanding of business value',
      'Focused decision-making on improvement',
      'Work "on" the business, not "in" it',
      'Enhanced BSG relationships and cross-sell'
    ],
    requiredSkills: [
      {
        skillName: 'Business Planning & Budgeting',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Forecasting & Scenario Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Business Valuation',
        minimumLevel: 3,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Cash Flow Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Financial Modeling',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Strategic Thinking',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Commercial Acumen',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Consulting & Advisory',
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
      },
      {
        skillName: 'Presentation Skills',
        minimumLevel: 3,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Facilitation Skills',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Questioning & Listening',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Client relationship ownership',
          'Strategic advisory sessions',
          'Valuation sign-off',
          'Board-level presentations',
          'Growth strategy recommendations'
        ],
        hoursEstimate: '4-8 hours'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Financial model construction',
          'Scenario planning facilitation',
          'Valuation methodology application',
          'Assumptions workshop with client',
          'Quarterly business reviews'
        ],
        hoursEstimate: '6-12 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Data gathering and analysis',
          'Model building support',
          'Sensitivity analysis',
          'Report preparation',
          'Follow-up actions tracking'
        ],
        hoursEstimate: '4-8 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Historical data extraction',
          'Comparables research',
          'Report formatting',
          'Schedule coordination'
        ],
        hoursEstimate: '2-4 hours'
      }
    ]
  },
  {
    id: 'benchmarking',
    name: 'Benchmarking - External and Internal',
    description: 'Comparative financial analysis across industry and internally',
    priceRange: '£450 (base report) to £1,200-£1,500 (with consultation)',
    deliveryTime: '2-3 days',
    features: [
      'Comparative financial data across industry/country',
      'KPI measurement vs same-industry companies',
      'Follow-up consultation to interpret data'
    ],
    benefits: [
      'Identifies improvement areas and actions',
      'Enables comparison of best-in-class performance',
      'Informs strategic adaptation',
      'Data-driven decision support'
    ],
    requiredSkills: [
      {
        skillName: 'Benchmarking & Comparative Analysis',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Industry Knowledge',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Data Analysis & Interpretation',
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
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Report Writing',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Commercial Acumen',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Data Visualisation & Reporting',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Critical Thinking',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Director',
        responsibilities: [
          'Consultation delivery',
          'Insights and recommendations',
          'Action plan development',
          'Client Q&A facilitation'
        ],
        hoursEstimate: '1-2 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Benchmarking analysis',
          'Industry comparables selection',
          'Report writing',
          'Data interpretation'
        ],
        hoursEstimate: '3-4 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Data extraction from databases',
          'Client data normalization',
          'Chart and graph creation',
          'Quality checks'
        ],
        hoursEstimate: '2-3 hours'
      }
    ]
  },
  {
    id: 'profit-extraction',
    name: 'Profit Extraction / Remuneration Strategies',
    description: 'Tax-efficient director remuneration and profit extraction planning',
    priceRange: '£0 (compliance advice) to £500 (advisory meeting)',
    deliveryTime: 'Ongoing advice or one-off consultations',
    features: [
      'Optimal profit extraction tool',
      'Company vs personal tax optimization',
      'Salary vs dividend analysis',
      'Financial planning referral opportunities'
    ],
    benefits: [
      'Maximise client drawings',
      'Optimise income and minimize tax',
      'Access to wealth management services',
      'Holistic financial planning'
    ],
    requiredSkills: [
      {
        skillName: 'Tax Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Corporate Tax',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Personal Tax',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Dividend & Remuneration Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'NICs & Payroll Tax',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Pension Planning',
        minimumLevel: 2,
        idealLevel: 3,
        criticalToDelivery: false,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Client Communication',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      },
      {
        skillName: 'Tax Legislation & Compliance',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Commercial Awareness',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Senior', 'Director', 'Partner']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Advisory meeting (Upper End)',
          'Wealth management introductions',
          'Complex tax planning strategies',
          'Client relationship ownership'
        ],
        hoursEstimate: '0.5-1 hour'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Profit extraction calculations',
          'Scenario modeling',
          'Tax efficiency review',
          'Recommendations report'
        ],
        hoursEstimate: '1-2 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Data gathering',
          'Current position analysis',
          'Calculation preparation',
          'Follow-up actions'
        ],
        hoursEstimate: '1-1.5 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Compliance advice letter (standard)',
          'Tool/template population',
          'Documentation'
        ],
        hoursEstimate: '0.5 hours'
      }
    ]
  },
  {
    id: '365-alignment',
    name: 'Goal Alignment Programme',
    description: 'Structured personal-business planning with AI-generated execution plans',
    priceRange: '£1,500 (Lite) | £4,500 (Growth) | £9,000 (Partner)',
    deliveryTime: 'Tiered delivery over 3-12 months',
    features: [
      'Tiered diagnostics (Lite/Growth/Partner)',
      'AI-generated plan: outcomes, constraints, resources, risks, milestones',
      'Quarterly accountability reviews',
      'Weekly progress tracker in portal',
      'Optional BRaaS/Business Intelligence integration'
    ],
    benefits: [
      'Aligns personal and corporate goals',
      'Clear strategy → numbers → tasks translation',
      'Improves execution discipline',
      'Enhances BSG stickiness and cross-sell'
    ],
    requiredSkills: [
      {
        skillName: 'Strategic Planning & Execution',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Goal Setting & OKRs',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Business Coaching',
        minimumLevel: 3,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Facilitation Skills',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Questioning & Listening',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Business Planning & Budgeting',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Performance Management',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'AI & Technology Integration',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: false,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Client Relationship Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner']
      },
      {
        skillName: 'Accountability & Follow-Through',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Initial diagnostic session',
          'Strategy day facilitation (Partner tier)',
          'Quarterly business reviews',
          'Cross-sell opportunity identification',
          'Client relationship stewardship'
        ],
        hoursEstimate: '6-12 hours (varies by tier)'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'AI-generated plan review and customization',
          'Quarterly accountability reviews',
          'Progress tracking oversight',
          'Plan adjustments and refinements'
        ],
        hoursEstimate: '4-8 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Diagnostic data collection',
          'Portal setup and training',
          'Weekly tracker monitoring',
          'Milestone tracking'
        ],
        hoursEstimate: '2-4 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Administrative coordination',
          'Report generation',
          'Client communications',
          'Documentation maintenance'
        ],
        hoursEstimate: '1-2 hours'
      }
    ]
  },
  {
    id: 'systems-audit',
    name: 'Systems Audit',
    description: 'Independent review of finance workflows to find root-causes of issues',
    comingSoon: true,
    priceRange: '£7.5k-£25k (diagnostic + implementation)',
    deliveryTime: 'Multi-week engagement',
    features: [
      'Targeted data pull from bookkeeping/ERP/payroll/bank feeds',
      'Sample walk-throughs with process owners',
      'Process & controls mapping (authorisations, segregation, fraud resilience)',
      'Efficiency diagnostics: templates, rules/automation, OCR, integrations, roles',
      'Tech-stack review (keep, simplify, replace)',
      'Remediation plan with effort/owner/time/£ benefit',
      'Optional: Client Portal for secure document flow and versioning'
    ],
    benefits: [
      'Fewer errors and bad debts',
      'Faster cycles and cleaner workflows',
      'Audit-ready controls',
      'Productivity gains for owners/FDs',
      'Direct cash and margin impact',
      'Clear executable roadmap'
    ],
    requiredSkills: [
      {
        skillName: 'Process Design & Optimisation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Internal Controls & Risk Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'System Implementation & Change Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Technology & Digital Literacy',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Problem Diagnosis & Troubleshooting',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      },
      {
        skillName: 'Data Management & Analysis',
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
        skillName: 'Project Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Fraud Detection & Prevention',
        minimumLevel: 3,
        idealLevel: 4,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Software Proficiency',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Manager', 'Senior']
      },
      {
        skillName: 'Stakeholder Interviewing',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Partner']
      },
      {
        skillName: 'Report Writing',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Senior', 'Director']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Client engagement leadership',
          'Diagnostic oversight',
          'Remediation plan sign-off',
          'Board-level presentation',
          'Implementation strategy'
        ],
        hoursEstimate: '8-12 hours'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Process mapping and controls analysis',
          'Stakeholder interviews',
          'Tech-stack evaluation',
          'Fraud resilience assessment',
          'Remediation plan authoring',
          'Project management'
        ],
        hoursEstimate: '20-40 hours'
      },
      {
        seniority: 'Senior',
        responsibilities: [
          'Data extraction and analysis',
          'Walk-through execution',
          'Efficiency diagnostics',
          'Template and automation recommendations',
          'Implementation support'
        ],
        hoursEstimate: '15-30 hours'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Data gathering coordination',
          'Documentation of current processes',
          'Meeting scheduling and notes',
          'Report formatting'
        ],
        hoursEstimate: '8-15 hours'
      }
    ]
  },
  {
    id: 'fractional-cfo',
    name: 'Fractional CFO Services',
    description: 'Part-time strategic finance director services for growing businesses',
    priceRange: '£5,000-£15,000/month (recurring)',
    deliveryTime: 'Ongoing monthly engagement (typically 3-6 day equivalent per month)',
    features: [
      'Strategic financial planning and forecasting',
      'Board-level reporting and presentations',
      'Cash flow management and optimization',
      'Fundraising support and investor relations',
      'Financial systems and controls implementation',
      'Budget creation and variance analysis',
      'KPI framework design and monitoring',
      'M&A financial due diligence support',
      'Exit planning and value maximization',
      'Team leadership and finance function build-out'
    ],
    benefits: [
      'Strategic finance leadership without full-time CFO cost',
      'Access to senior expertise on demand',
      'Improved financial decision-making',
      'Scalable solution as business grows',
      'External perspective and best practices',
      'Enhanced credibility with investors and lenders'
    ],
    requiredSkills: [
      {
        skillName: 'Board Presentation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Strategic Planning',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Three-way Forecasting',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Scenario Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Commercial Thinking',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Strategic Options Appraisal',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Financial Statements Prep & Interpretation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Data Insights Interpretation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Executive Writing & Documentation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Stakeholder Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Client relationship ownership',
          'Strategic direction setting',
          'Board meeting attendance',
          'High-level advisory',
          'Network leveraging for client benefit'
        ],
        hoursEstimate: '4-8 hours/month'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Day-to-day CFO responsibilities',
          'Financial planning and analysis',
          'Board pack preparation',
          'Cash flow forecasting',
          'Team supervision',
          'Systems implementation'
        ],
        hoursEstimate: '16-24 hours/month'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Financial reporting preparation',
          'Data analysis and insight generation',
          'Model building and maintenance',
          'Process documentation'
        ],
        hoursEstimate: '8-12 hours/month'
      }
    ]
  },
  {
    id: 'fractional-coo',
    name: 'Fractional COO Services',
    description: 'Part-time operational excellence leadership for scaling businesses',
    priceRange: '£5,000-£12,000/month (recurring)',
    deliveryTime: 'Ongoing monthly engagement (typically 3-6 day equivalent per month)',
    features: [
      'Operational strategy development',
      'Process optimization and efficiency gains',
      'Team structure design and recruitment support',
      'Systems and technology implementation',
      'Performance management framework',
      'Supply chain and vendor management',
      'Project management oversight',
      'Scalability planning',
      'Change management leadership',
      'Operational risk mitigation'
    ],
    benefits: [
      'Operational leadership without full-time COO cost',
      'Rapid process improvement and efficiency',
      'Scalable systems and structures',
      'Team productivity enhancement',
      'External best practice implementation',
      'Reduced operational risk'
    ],
    requiredSkills: [
      {
        skillName: 'System Implementation & Change Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Process Design & Optimisation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Project Management',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director', 'Manager']
      },
      {
        skillName: 'Team Leadership & People Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Strategic Planning',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Technology & Digital Literacy',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Data Management & Analysis',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: false,
        recommendedSeniority: ['Manager']
      },
      {
        skillName: 'Workflow Optimisation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Client relationship oversight',
          'Strategic operational direction',
          'Senior stakeholder management',
          'High-level problem solving'
        ],
        hoursEstimate: '4-6 hours/month'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Day-to-day COO responsibilities',
          'Process improvement initiatives',
          'Team structure optimization',
          'Systems selection and implementation',
          'Performance management',
          'Change management execution'
        ],
        hoursEstimate: '16-24 hours/month'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Process mapping and documentation',
          'Data analysis for operational insights',
          'Project coordination',
          'Systems training and support'
        ],
        hoursEstimate: '8-12 hours/month'
      }
    ]
  },
  {
    id: 'combined-cfo-coo',
    name: 'Combined CFO/COO Advisory',
    description: 'Integrated strategic finance and operations leadership',
    priceRange: '£8,000-£20,000/month (recurring)',
    deliveryTime: 'Ongoing monthly engagement (typically 5-10 day equivalent per month)',
    features: [
      'Unified strategic and operational leadership',
      'Financial and operational planning alignment',
      'Integrated KPI frameworks',
      'Holistic business optimization',
      'Unified board reporting',
      'Cross-functional project leadership',
      'Scalability and growth strategy',
      'Investor readiness (finance + operations)',
      'M&A integration support',
      'Complete C-suite leadership coverage'
    ],
    benefits: [
      'Comprehensive C-level leadership',
      'Better finance-operations alignment',
      'Faster decision-making with unified view',
      'Cost-effective vs two separate roles',
      'Holistic business optimization',
      'Single point of accountability'
    ],
    requiredSkills: [
      {
        skillName: 'Board Presentation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Strategic Planning',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Three-way Forecasting',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Commercial Thinking',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'System Implementation & Change Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Process Design & Optimisation',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      },
      {
        skillName: 'Team Leadership & People Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Stakeholder Management',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Strategic Options Appraisal',
        minimumLevel: 5,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Partner', 'Director']
      },
      {
        skillName: 'Data Insights Interpretation',
        minimumLevel: 4,
        idealLevel: 5,
        criticalToDelivery: true,
        recommendedSeniority: ['Director']
      }
    ],
    deliveryTeam: [
      {
        seniority: 'Partner',
        responsibilities: [
          'Overall client relationship leadership',
          'Strategic direction (finance + operations)',
          'Board attendance and advisory',
          'Investor/stakeholder relations',
          'Growth strategy formulation'
        ],
        hoursEstimate: '8-12 hours/month'
      },
      {
        seniority: 'Director',
        responsibilities: [
          'Integrated CFO/COO execution',
          'Financial and operational planning',
          'Unified reporting and dashboards',
          'Cross-functional initiatives',
          'Systems and process optimization',
          'Team leadership and development'
        ],
        hoursEstimate: '24-40 hours/month'
      },
      {
        seniority: 'Manager',
        responsibilities: [
          'Financial and operational reporting',
          'Analysis and insights',
          'Project coordination',
          'Process documentation',
          'Systems support'
        ],
        hoursEstimate: '12-16 hours/month'
      }
    ]
  }
];

/**
 * Get all unique skills required across all services
 */
export function getAllRequiredSkills(): string[] {
  const skillsSet = new Set<string>();
  advisoryServicesMap.forEach(service => {
    service.requiredSkills.forEach(skill => {
      skillsSet.add(skill.skillName);
    });
  });
  return Array.from(skillsSet).sort();
}

/**
 * Get services that require a specific skill
 */
export function getServicesForSkill(skillName: string): ServiceLine[] {
  return advisoryServicesMap.filter(service =>
    service.requiredSkills.some(skill => skill.skillName === skillName)
  );
}

/**
 * Check if a team member can deliver a service based on their skills
 */
export function canDeliverService(
  serviceLine: ServiceLine,
  teamMemberSkills: { skillName: string; level: number }[]
): {
  canDeliver: boolean;
  matchedSkills: number;
  totalRequired: number;
  criticalGaps: string[];
  niceToHaveGaps: string[];
} {
  const requiredSkills = serviceLine.requiredSkills;
  // const criticalSkills = requiredSkills.filter(s => s.criticalToDelivery);
  
  let matchedCount = 0;
  const criticalGaps: string[] = [];
  const niceToHaveGaps: string[] = [];

  requiredSkills.forEach(required => {
    const memberSkill = teamMemberSkills.find(s => s.skillName === required.skillName);
    
    if (memberSkill && memberSkill.level >= required.minimumLevel) {
      matchedCount++;
    } else {
      if (required.criticalToDelivery) {
        criticalGaps.push(required.skillName);
      } else {
        niceToHaveGaps.push(required.skillName);
      }
    }
  });

  // Can deliver if all critical skills are met
  const canDeliver = criticalGaps.length === 0;

  return {
    canDeliver,
    matchedSkills: matchedCount,
    totalRequired: requiredSkills.length,
    criticalGaps,
    niceToHaveGaps
  };
}

/**
 * Get team capability matrix for all services
 */
export function getTeamCapabilityMatrix(
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    skills: { skillName: string; level: number }[];
  }>
): Array<{
  serviceLine: ServiceLine;
  capableMembers: string[];
  partialCapableMembers: string[];
  totalCapacity: number;
  readiness: 'ready' | 'partial' | 'not-ready' | 'coming-soon';
}> {
  return advisoryServicesMap.map(service => {
    if (service.comingSoon) {
      return {
        serviceLine: service,
        capableMembers: [],
        partialCapableMembers: [],
        totalCapacity: 0,
        readiness: 'coming-soon' as const
      };
    }

    const capableMembers: string[] = [];
    const partialCapableMembers: string[] = [];

    teamMembers.forEach(member => {
      const capability = canDeliverService(service, member.skills);
      if (capability.canDeliver) {
        capableMembers.push(member.name);
      } else if (capability.matchedSkills > 0) {
        partialCapableMembers.push(member.name);
      }
    });

    let readiness: 'ready' | 'partial' | 'not-ready' = 'not-ready';
    if (capableMembers.length > 0) {
      readiness = 'ready';
    } else if (partialCapableMembers.length > 0) {
      readiness = 'partial';
    }

    return {
      serviceLine: service,
      capableMembers,
      partialCapableMembers,
      totalCapacity: capableMembers.length,
      readiness
    };
  });
}

