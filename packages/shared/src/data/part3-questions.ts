// ============================================================================
// PART 3: HIDDEN VALUE AUDIT (32 Questions)
// ============================================================================
// Deep analysis of business value, exit readiness, and hidden assets

export interface Part3Question {
  id: string;
  fieldName: string;
  question: string;
  type: 'radio' | 'checkbox' | 'slider' | 'text' | 'textarea' | 'number' | 'percentage' | 'matrix';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
  insight?: string;
  benchmark?: string;
  matrixRows?: Array<{ id: string; label: string; fieldName: string }>;
  matrixColumns?: string[];
  min?: number;
  max?: number;
  step?: number;
  format?: 'currency' | 'percentage' | 'number';
}

export interface Part3Section {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  theme: string;
  questions: Part3Question[];
}

export const part3Sections: Part3Section[] = [
  {
    id: 'intellectual_capital',
    number: 1,
    title: 'Intellectual Capital Audit',
    shortTitle: 'Intellectual Capital',
    description: 'Discover the valuable knowledge that walks out the door every night',
    theme: 'What valuable knowledge walks out the door every night?',
    questions: [
      {
        id: 'process_documentation',
        fieldName: 'critical_processes_undocumented',
        question: 'Which of these critical processes exist only in your head or someone else\'s?',
        type: 'checkbox',
        required: true,
        options: [
          'How we win new customers',
          'How we deliver our core service',
          'How we handle customer complaints',
          'How we onboard new team members',
          'How we manage finances',
          'How we make key decisions',
          'Our pricing methodology',
          'Our quality control process'
        ],
        insight: 'Each undocumented process = 5% lower sale value',
        helperText: 'Select all that apply'
      },
      {
        id: 'unique_methods',
        fieldName: 'unique_methods',
        question: 'What unique ways of doing things give you an edge over competitors?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your unique methods, processes, or approaches that competitors can\'t easily replicate',
        helperText: 'Think about what customers specifically choose you for'
      },
      {
        id: 'unique_methods_protection',
        fieldName: 'unique_methods_protection',
        question: 'How are these unique methods protected?',
        type: 'radio',
        required: true,
        options: [
          'Patent filed or granted',
          'Trade secret (documented internally)',
          'Not formally protected',
          'Don\'t know'
        ]
      },
      {
        id: 'knowledge_dependency',
        fieldName: 'knowledge_dependency_percentage',
        question: 'If you were unavailable for 90 days, what % of your business knowledge would be inaccessible?',
        type: 'slider',
        required: true,
        min: 0,
        max: 100,
        step: 5,
        format: 'percentage',
        benchmark: 'UK SMEs average 67% knowledge dependency'
      },
      {
        id: 'customer_data_unutilized',
        fieldName: 'customer_data_unutilized',
        question: 'What customer data do you collect but never analyze?',
        type: 'checkbox',
        required: true,
        options: [
          'Purchase patterns and frequency',
          'Customer feedback and reviews',
          'Complaints and support tickets',
          'Usage data and engagement metrics',
          'Customer demographics',
          'Referral sources',
          'Lifetime value data',
          'Churn reasons'
        ],
        insight: 'Unused data = missed revenue averaging £45k/year',
        helperText: 'Select all that apply'
      },
      {
        id: 'content_assets_unleveraged',
        fieldName: 'content_assets_unleveraged',
        question: 'Which valuable content have you created but not leveraged?',
        type: 'checkbox',
        required: true,
        options: [
          'Case studies and success stories',
          'How-to guides and tutorials',
          'Training materials and courses',
          'Process documentation',
          'Research and insights',
          'Templates and tools',
          'Webinar recordings',
          'Customer testimonials'
        ],
        helperText: 'Each unutilized content asset = lost marketing value of £5-10k'
      },
      {
        id: 'ip_funding_awareness',
        fieldName: 'ip_funding_awareness',
        question: 'Are you aware of these UK funding/tax benefits for innovation?',
        type: 'matrix',
        required: true,
        matrixRows: [
          { id: 'rd_tax_credits', label: 'R&D Tax Credits', fieldName: 'awareness_rd_tax_credits' },
          { id: 'patent_box', label: 'Patent Box relief', fieldName: 'awareness_patent_box' },
          { id: 'innovation_grants', label: 'Innovate UK grants', fieldName: 'awareness_innovation_grants' },
          { id: 'creative_tax', label: 'Creative industry tax reliefs', fieldName: 'awareness_creative_tax' }
        ],
        matrixColumns: ['Not aware', 'Aware but not using', 'Currently using', 'Have used before']
      }
    ]
  },
  {
    id: 'brand_trust_equity',
    number: 2,
    title: 'Brand & Trust Equity',
    shortTitle: 'Brand & Trust',
    description: 'Understand why customers really choose you (and would they stay if you left)',
    theme: 'Why do customers really choose you (and would they stay if you left)?',
    questions: [
      {
        id: 'hidden_trust_signals',
        fieldName: 'hidden_trust_signals',
        question: 'Which credibility markers do you have but don\'t display prominently?',
        type: 'checkbox',
        required: true,
        options: [
          'Industry awards and recognition',
          'Professional certifications',
          'Client testimonials and reviews',
          'Case studies with metrics',
          'Media mentions and press',
          'Years in business',
          'Number of clients served',
          'Industry association memberships'
        ],
        insight: 'Each hidden trust signal = 12% lower conversion rate',
        helperText: 'Select all that apply'
      },
      {
        id: 'personal_vs_business_brand',
        fieldName: 'personal_brand_percentage',
        question: 'What % of customers buy from your business vs buying from YOU personally?',
        type: 'slider',
        required: true,
        min: 0,
        max: 100,
        step: 5,
        format: 'percentage',
        helperText: 'Over 60% personal = unsellable business'
      },
      {
        id: 'reputation_build_time',
        fieldName: 'reputation_build_time',
        question: 'How long would it take a competitor to build your reputation from scratch?',
        type: 'radio',
        required: true,
        options: [
          '6 months or less',
          '1 year',
          '2-5 years',
          '5-10 years',
          'More than 10 years',
          'They could do it immediately'
        ],
        benchmark: 'Strong brands take 5+ years to replicate'
      },
      {
        id: 'team_story_consistency',
        fieldName: 'team_story_consistency',
        question: 'Can your team consistently tell your company\'s origin story and values?',
        type: 'radio',
        required: true,
        options: [
          'Yes, everyone knows it well',
          'Some can tell it well',
          'Only I can tell it properly',
          'We don\'t have a clear story'
        ],
        insight: 'Companies with clear stories command 20% price premiums'
      },
      {
        id: 'active_customer_advocates',
        fieldName: 'active_customer_advocates',
        question: 'How many customers actively refer others without being asked?',
        type: 'number',
        required: true,
        min: 0,
        placeholder: 'Enter number of active advocates',
        benchmark: 'Top SMEs have 20+ active advocates'
      }
    ]
  },
  {
    id: 'market_position_vulnerabilities',
    number: 3,
    title: 'Market Position Vulnerabilities',
    shortTitle: 'Market Position',
    description: 'Discover what\'s stopping someone with £100k from eating your lunch',
    theme: 'What\'s stopping someone with £100k from eating your lunch?',
    questions: [
      {
        id: 'competitive_moat',
        fieldName: 'competitive_moat',
        question: 'What prevents a well-funded competitor from replicating your business?',
        type: 'checkbox',
        required: true,
        options: [
          'Exclusive contracts or partnerships',
          'Proprietary technology or systems',
          'Regulatory barriers or licenses',
          'Deep customer relationships',
          'Unique location advantages',
          'Specialized expertise/talent',
          'Brand recognition and trust',
          'Nothing - we compete on price'
        ],
        helperText: 'Red flag: Selecting "nothing" or "we\'re cheapest"'
      },
      {
        id: 'customer_concentration',
        fieldName: 'top3_customer_revenue_percentage',
        question: 'What % of revenue comes from your top 3 customers?',
        type: 'percentage',
        required: true,
        min: 0,
        max: 100,
        placeholder: 'Enter percentage',
        helperText: 'Over 50% = extreme vulnerability'
      },
      {
        id: 'channel_dependency',
        fieldName: 'external_channel_percentage',
        question: 'How much revenue flows through channels you don\'t control?',
        type: 'percentage',
        required: true,
        min: 0,
        max: 100,
        placeholder: 'Enter percentage (Amazon, distributors, etc.)',
        insight: 'Over 70% external = you\'re sharecropping'
      },
      {
        id: 'last_price_increase',
        fieldName: 'last_price_increase',
        question: 'When did you last raise prices without losing customers?',
        type: 'radio',
        required: true,
        options: [
          'Within last 6 months',
          '6-12 months ago',
          '1-2 years ago',
          'More than 2 years ago',
          'Never raised prices'
        ],
        helperText: 'No price increase in 2 years = weak market position'
      },
      {
        id: 'market_intelligence',
        fieldName: 'market_intelligence_methods',
        question: 'How do you track competitor moves and market changes?',
        type: 'checkbox',
        required: true,
        options: [
          'Google alerts for competitors',
          'Industry reports and analysis',
          'Customer feedback and intel',
          'Trade publications',
          'Networking and events',
          'Social media monitoring',
          'We don\'t track systematically'
        ],
        helperText: 'No tracking = flying blind'
      }
    ]
  },
  {
    id: 'systems_scale_readiness',
    number: 4,
    title: 'Systems & Scale Readiness',
    shortTitle: 'Systems & Scale',
    description: 'Assess if your business could run for 90 days without you',
    theme: 'Could your business run for 90 days without you?',
    questions: [
      {
        id: 'process_autonomy',
        fieldName: 'process_autonomy',
        question: 'Which processes would break if you weren\'t there?',
        type: 'matrix',
        required: true,
        matrixRows: [
          { id: 'sales', label: 'Sales & Business Development', fieldName: 'autonomy_sales' },
          { id: 'delivery', label: 'Service/Product Delivery', fieldName: 'autonomy_delivery' },
          { id: 'finance', label: 'Financial Management', fieldName: 'autonomy_finance' },
          { id: 'hiring', label: 'Hiring & HR', fieldName: 'autonomy_hiring' },
          { id: 'strategy', label: 'Strategic Decisions', fieldName: 'autonomy_strategy' },
          { id: 'quality', label: 'Quality Control', fieldName: 'autonomy_quality' }
        ],
        matrixColumns: ['Runs perfectly', 'Needs oversight', 'Would fail'],
        helperText: 'Each "Would fail" = 5 hours/week trapped'
      },
      {
        id: 'data_re_entry',
        fieldName: 'data_re_entry_frequency',
        question: 'How many times do you enter the same data in different places?',
        type: 'radio',
        required: true,
        options: [
          'Never - fully integrated',
          '2-3 times',
          '4-5 times',
          'Constantly re-entering data'
        ],
        insight: 'Each re-entry = 2% profit margin lost'
      },
      {
        id: 'quality_control_method',
        fieldName: 'quality_control_method',
        question: 'How do you ensure consistent quality without personal checking?',
        type: 'radio',
        required: true,
        options: [
          'Automated systems and checks',
          'Team culture and training',
          'I personally check everything',
          'Hope for the best'
        ],
        helperText: 'Personal checking = unscalable business'
      },
      {
        id: 'tech_stack_health',
        fieldName: 'tech_stack_health_percentage',
        question: 'What % of your technology "just about works" vs working smoothly?',
        type: 'slider',
        required: true,
        min: 0,
        max: 100,
        step: 5,
        format: 'percentage',
        benchmark: 'Most SMEs have 40% technical debt'
      },
      {
        id: 'compliance_automation',
        fieldName: 'compliance_automation',
        question: 'Which UK compliance requirements are automated?',
        type: 'checkbox',
        required: true,
        options: [
          'VAT returns',
          'PAYE/payroll',
          'Workplace pensions',
          'GDPR compliance',
          'Health & Safety records',
          'Insurance renewals',
          'Company filings',
          'None automated'
        ],
        helperText: 'Each manual compliance = quarterly stress + error risk'
      }
    ]
  },
  {
    id: 'people_culture_assets',
    number: 5,
    title: 'People & Culture Assets',
    shortTitle: 'People & Culture',
    description: 'Determine if your team is an asset or just an expense',
    theme: 'Is your team an asset or just an expense?',
    questions: [
      {
        id: 'key_person_risk',
        fieldName: 'key_person_risk',
        question: 'If these people left tomorrow, what happens to your business?',
        type: 'matrix',
        required: true,
        matrixRows: [
          { id: 'operations_lead', label: 'Operations Lead', fieldName: 'risk_operations_lead' },
          { id: 'sales_lead', label: 'Sales Lead', fieldName: 'risk_sales_lead' },
          { id: 'tech_lead', label: 'Technical Lead', fieldName: 'risk_tech_lead' },
          { id: 'customer_lead', label: 'Customer Service Lead', fieldName: 'risk_customer_lead' },
          { id: 'finance_lead', label: 'Finance Lead', fieldName: 'risk_finance_lead' }
        ],
        matrixColumns: ['Business fine', 'Disrupted for weeks', 'Crisis situation'],
        helperText: 'More than 2 crisis roles = ticking time bomb'
      },
      {
        id: 'succession_depth',
        fieldName: 'succession_depth',
        question: 'Who could step into each key role with <1 week training?',
        type: 'matrix',
        required: true,
        matrixRows: [
          { id: 'your_role', label: 'Your role', fieldName: 'succession_your_role' },
          { id: 'operations', label: 'Operations', fieldName: 'succession_operations' },
          { id: 'sales', label: 'Sales', fieldName: 'succession_sales' },
          { id: 'technical', label: 'Technical', fieldName: 'succession_technical' },
          { id: 'customer', label: 'Customer Service', fieldName: 'succession_customer' }
        ],
        matrixColumns: ['Ready now', 'Need 1 month', 'Need to hire', 'Nobody'],
        helperText: '"Nobody" answers = unsellable business'
      },
      {
        id: 'culture_documentation',
        fieldName: 'culture_preservation_methods',
        question: 'How do you preserve your culture as you grow?',
        type: 'checkbox',
        required: true,
        options: [
          'Written values and behaviors',
          'Structured onboarding process',
          'Regular culture activities',
          'Performance reviews include culture',
          'Culture stories and examples',
          'Team rituals and traditions',
          'Nothing formal'
        ],
        insight: 'Undocumented culture dies with growth'
      },
      {
        id: 'team_advocacy_percentage',
        fieldName: 'team_advocacy_percentage',
        question: 'What % of your team actively recommends working here?',
        type: 'percentage',
        required: true,
        min: 0,
        max: 100,
        placeholder: 'Enter percentage',
        benchmark: 'Best SMEs have 80%+ advocacy'
      },
      {
        id: 'knowledge_transfer_time',
        fieldName: 'average_knowledge_transfer_months',
        question: 'On average, how many months to train someone to fully do each person\'s job?',
        type: 'number',
        required: true,
        min: 0,
        placeholder: 'Enter average months',
        helperText: 'Over 3 months anywhere = dangerous dependency'
      }
    ]
  },
  {
    id: 'financial_exit_readiness',
    number: 6,
    title: 'Financial Structure & Exit Readiness',
    shortTitle: 'Financial & Exit',
    description: 'Could you sell tomorrow if the perfect offer came?',
    theme: 'Could you sell tomorrow if the perfect offer came?',
    questions: [
      {
        id: 'documentation_readiness',
        fieldName: 'documentation_24hr_ready',
        question: 'Which documents could you produce within 24 hours?',
        type: 'checkbox',
        required: true,
        options: [
          'Last 3 years P&L',
          'Current balance sheet',
          'Customer contracts',
          'Supplier agreements',
          'Employee contracts',
          'Systems documentation',
          'IP documentation',
          'Due diligence data room'
        ],
        helperText: 'Most SMEs need 3 months to get sale-ready'
      },
      {
        id: 'business_valuation_knowledge',
        fieldName: 'know_business_worth',
        question: 'Do you know what your business is worth and why?',
        type: 'radio',
        required: true,
        options: [
          'Yes, with professional valuation',
          'Yes, based on industry multiples',
          'Rough idea only',
          'No idea at all'
        ],
        insight: 'Unknown value = missed opportunities'
      },
      {
        id: 'personal_risk_exposure',
        fieldName: 'personal_bankruptcy_risks',
        question: 'Which risks could personally bankrupt you?',
        type: 'checkbox',
        required: true,
        options: [
          'Personal guarantees on loans',
          'Personal guarantees on leases',
          'No professional indemnity insurance',
          'No directors liability insurance',
          'Trading while insolvent',
          'Tax liabilities',
          'None of these apply'
        ],
        helperText: 'Calculate total exposure in £'
      },
      {
        id: 'uk_funding_explored',
        fieldName: 'uk_funding_explored',
        question: 'Which of these UK funding options have you explored?',
        type: 'matrix',
        required: true,
        matrixRows: [
          { id: 'rd_tax', label: 'R&D Tax Credits', fieldName: 'explored_rd_tax' },
          { id: 'grants', label: 'Government Grants', fieldName: 'explored_grants' },
          { id: 'eis_seis', label: 'EIS/SEIS', fieldName: 'explored_eis_seis' },
          { id: 'debt', label: 'Debt Finance', fieldName: 'explored_debt' },
          { id: 'equity', label: 'Equity Investment', fieldName: 'explored_equity' }
        ],
        matrixColumns: ['Never heard of it', 'Aware but not explored', 'Explored but didn\'t pursue', 'Currently using'],
        helperText: 'Average SME misses £45k in available funding'
      },
      {
        id: 'investability_assets',
        fieldName: 'investability_assets',
        question: 'What would an investor/buyer actually be buying?',
        type: 'checkbox',
        required: true,
        options: [
          'Proven systems and processes',
          'Strong brand and reputation',
          'Talented and stable team',
          'Long-term contracts',
          'Intellectual property',
          'Strategic relationships',
          'Market position',
          'Just buying a job'
        ],
        helperText: 'Last option = worth <1x revenue'
      }
    ]
  }
];

// Computed totals
export const PART3_TOTAL_SECTIONS = part3Sections.length;
export const PART3_TOTAL_QUESTIONS = part3Sections.reduce(
  (total, section) => total + section.questions.length,
  0
);

