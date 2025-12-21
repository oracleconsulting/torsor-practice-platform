// ============================================================================
// SERVICE LINE ASSESSMENT DEFINITIONS
// ============================================================================
// Question definitions for each service line onboarding assessment
// ============================================================================

export interface AssessmentQuestion {
  id: string;
  section: string;
  question: string;
  type: 'single' | 'multi' | 'text' | 'rank';
  options?: string[];
  maxSelections?: number;
  placeholder?: string;
  charLimit?: number;
  emotionalAnchor?: string;  // For value proposition generation
  technicalField?: string;   // For technical/scope fields
  required?: boolean;
}

export interface ServiceLineAssessment {
  code: string;
  name: string;
  title: string;
  subtitle: string;
  sections: string[];
  questions: AssessmentQuestion[];
}

// ============================================================================
// MANAGEMENT ACCOUNTS - Financial Visibility Diagnostic
// ============================================================================

export const MANAGEMENT_ACCOUNTS_ASSESSMENT: ServiceLineAssessment = {
  code: 'management_accounts',
  name: 'Management Accounts',
  title: 'Financial Visibility Diagnostic',
  subtitle: 'Help us understand your relationship with your numbers',
  sections: [
    'Current State',
    'Pain Points',
    'System Context',
    'Desired Outcomes',
    'Frequency & Scope'
  ],
  questions: [
    // Section 1: Current State
    {
      id: 'ma_relationship_with_numbers',
      section: 'Current State',
      question: 'How would you describe your current relationship with your business numbers?',
      type: 'single',
      options: [
        'I check them religiously every week',
        'I look at bank balance, that\'s about it',
        'I wait for my accountant to tell me how we did',
        'Numbers stress me out - I avoid them',
        'I want to engage more but don\'t know what to look at'
      ],
      emotionalAnchor: 'relationship_with_numbers',
      required: true
    },
    {
      id: 'ma_reports_insight_frequency',
      section: 'Current State',
      question: 'When was the last time your financial reports told you something you didn\'t already know?',
      type: 'single',
      options: [
        'Last week - they\'re genuinely useful',
        'Last month - occasionally insightful',
        'Last quarter - rare "aha" moments',
        'Can\'t remember - they just confirm what I suspected',
        'Never - I don\'t understand them anyway'
      ],
      emotionalAnchor: 'reports_insight_frequency',
      required: true
    },
    {
      id: 'ma_tuesday_financial_question',
      section: 'Current State',
      question: 'What\'s your "Tuesday morning" financial question? The thing you wish you could instantly answer when you sit down?',
      type: 'text',
      placeholder: 'E.g., "How much cash will we have in 30 days?" / "Which client is most profitable?"',
      charLimit: 200,
      emotionalAnchor: 'tuesday_financial_question',
      required: true
    },
    {
      id: 'ma_magic_away_financial',
      section: 'Current State',
      question: 'If you could magic away ONE financial uncertainty, what would it be?',
      type: 'text',
      placeholder: 'Describe the financial worry that keeps you up at night...',
      charLimit: 300,
      emotionalAnchor: 'magic_away_financial',
      required: true
    },

    // Section 2: Pain Points
    {
      id: 'ma_pain_points',
      section: 'Pain Points',
      question: 'Which of these keep you awake at night? (Select all that apply)',
      type: 'multi',
      options: [
        'Not knowing if we\'re actually profitable month-to-month',
        'Cash flow surprises - bills I forgot were coming',
        'Can\'t tell which services/products make money',
        'Year-end tax bills are always a shock',
        'Don\'t know if we can afford to hire',
        'No idea what our breakeven point is',
        'Bank balance looks healthy but profits feel thin',
        'Staff costs feel high but can\'t prove it'
      ],
      emotionalAnchor: 'kpi_priorities',
      required: true
    },
    {
      id: 'ma_reporting_lag',
      section: 'Pain Points',
      question: 'How long does it take you to answer "How did we do last month?"',
      type: 'single',
      options: [
        'Under a minute - I have it at my fingertips',
        'About 30 minutes - need to pull some reports',
        'A few hours - involves spreadsheets and reconciliations',
        'A few days - need to wait for bookkeeper',
        'No idea until year-end accounts'
      ],
      technicalField: 'current_reporting_lag',
      required: true
    },
    {
      id: 'ma_decision_making_story',
      section: 'Pain Points',
      question: 'Last time you had a big business decision to make, how did financials inform it?',
      type: 'text',
      placeholder: 'E.g., hiring, pricing, investment, taking on a big client...',
      charLimit: 300,
      emotionalAnchor: 'decision_making_story',
      required: true
    },

    // Section 3: System Context
    {
      id: 'ma_accounting_platform',
      section: 'System Context',
      question: 'What accounting software are you using?',
      type: 'single',
      options: [
        'Xero',
        'QuickBooks Online',
        'Sage (any version)',
        'FreeAgent',
        'Kashflow',
        'Spreadsheets',
        'Other'
      ],
      technicalField: 'accounting_platform',
      required: true
    },
    {
      id: 'ma_bookkeeping_currency',
      section: 'System Context',
      question: 'How up-to-date is your bookkeeping typically?',
      type: 'single',
      options: [
        'Real-time - everything\'s entered within days',
        'Weekly - usually caught up by Friday',
        'Monthly - we batch it up',
        'Quarterly - we do it for VAT',
        'Whenever someone has time'
      ],
      technicalField: 'bookkeeping_currency',
      required: true
    },
    {
      id: 'ma_bookkeeping_owner',
      section: 'System Context',
      question: 'Who currently does your bookkeeping?',
      type: 'single',
      options: [
        'I do it myself',
        'An internal team member',
        'An external bookkeeper/accountant',
        'A mix - different people for different things',
        'Nobody consistently'
      ],
      technicalField: 'bookkeeping_owner',
      required: true
    },

    // Section 4: Desired Outcomes
    {
      id: 'ma_transformation_desires',
      section: 'Desired Outcomes',
      question: 'If we delivered management accounts that actually worked for you, what would change?',
      type: 'multi',
      maxSelections: 3,
      options: [
        'I\'d make faster decisions',
        'I\'d sleep better at night',
        'I\'d have confident conversations with investors/banks',
        'I\'d know when to push growth vs pull back',
        'I\'d stop second-guessing my pricing',
        'I\'d catch problems before they became crises',
        'I\'d finally feel "in control" of the finances',
        'My spouse would stop worrying'
      ],
      emotionalAnchor: 'ma_transformation_desires',
      required: true
    },
    {
      id: 'ma_visibility_vision',
      section: 'Desired Outcomes',
      question: 'What does "financial visibility" look like to you? Paint the picture.',
      type: 'text',
      placeholder: 'Describe your ideal state - how it feels, what you can do, what questions you can answer...',
      charLimit: 400,
      emotionalAnchor: 'financial_visibility_vision',
      required: true
    },

    // Section 5: Frequency & Scope
    {
      id: 'ma_reporting_frequency',
      section: 'Frequency & Scope',
      question: 'How often do you realistically need to see your numbers to make good decisions?',
      type: 'single',
      options: [
        'Weekly - we move fast',
        'Monthly - that\'s the right rhythm',
        'Quarterly - we\'re stable enough',
        'I don\'t know what\'s appropriate for us'
      ],
      technicalField: 'reporting_frequency_preference',
      required: true
    },
    {
      id: 'ma_additional_reporting',
      section: 'Frequency & Scope',
      question: 'Beyond standard P&L and Balance Sheet, what would be genuinely useful?',
      type: 'multi',
      options: [
        'Cash flow forecasting (where will we be in 30/60/90 days?)',
        'Customer profitability analysis (who\'s actually making us money?)',
        'Staff cost ratio tracking (are wages sustainable?)',
        'Gross margin by service/product line',
        'Debtor ageing (who owes us and how old?)',
        'Budget vs actual comparison',
        'Rolling 12-month trend analysis',
        'I don\'t know - help me figure this out'
      ],
      technicalField: 'additional_reporting_needs',
      required: true
    }
  ]
};

// ============================================================================
// SYSTEMS AUDIT - Operations Health Check
// ============================================================================

export const SYSTEMS_AUDIT_ASSESSMENT: ServiceLineAssessment = {
  code: 'systems_audit',
  name: 'Systems Audit',
  title: 'Operations Health Check',
  subtitle: 'Let\'s understand where your operations are struggling',
  sections: [
    'Current Pain',
    'Impact Quantification',
    'Tech Stack',
    'Focus Areas',
    'Readiness'
  ],
  questions: [
    // Section 1: Current Pain
    {
      id: 'sa_breaking_point',
      section: 'Current Pain',
      question: 'What broke - or is about to break - that made you think about systems?',
      type: 'text',
      placeholder: 'Be specific - the incident, the near-miss, the frustration that tipped you over...',
      charLimit: 400,
      emotionalAnchor: 'systems_breaking_point',
      required: true
    },
    {
      id: 'sa_operations_diagnosis',
      section: 'Current Pain',
      question: 'How would you describe your current operations?',
      type: 'single',
      options: [
        'Controlled chaos - it works but I can\'t explain how',
        'Manual heroics - we survive on people\'s goodwill',
        'Death by spreadsheet - everything\'s tracked but nothing connects',
        'Tech Frankenstein - we\'ve bolted tools together over years',
        'Actually pretty good - we just need optimisation'
      ],
      emotionalAnchor: 'operations_self_diagnosis',
      required: true
    },
    {
      id: 'sa_month_end_shame',
      section: 'Current Pain',
      question: 'If I followed you through a typical month-end, what would embarrass you most?',
      type: 'text',
      placeholder: 'The workaround you\'re ashamed of, the process you\'d never show an investor...',
      charLimit: 300,
      emotionalAnchor: 'month_end_shame',
      required: true
    },

    // Section 2: Impact Quantification
    {
      id: 'sa_manual_hours',
      section: 'Impact Quantification',
      question: 'How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?',
      type: 'single',
      options: [
        'Under 10 hours',
        '10-20 hours',
        '20-40 hours',
        '40-80 hours',
        'More than 80 hours',
        'No idea - but it\'s significant'
      ],
      technicalField: 'manual_hours_monthly',
      required: true
    },
    {
      id: 'sa_month_end_duration',
      section: 'Impact Quantification',
      question: 'How long does your month-end close currently take?',
      type: 'single',
      options: [
        '1-2 days',
        '3-5 days',
        '1-2 weeks',
        '2-4 weeks',
        'We don\'t really "close" - it\'s ongoing'
      ],
      technicalField: 'month_end_duration',
      required: true
    },
    {
      id: 'sa_data_error_frequency',
      section: 'Impact Quantification',
      question: 'In the last year, how many times have you discovered data errors that affected a business decision?',
      type: 'single',
      options: [
        'Never - our data is solid',
        'Once or twice - minor issues',
        'Several times - some costly',
        'Regularly - I don\'t fully trust our numbers',
        'I don\'t know - which is the scary part'
      ],
      technicalField: 'data_error_frequency',
      required: true
    },
    {
      id: 'sa_expensive_mistake',
      section: 'Impact Quantification',
      question: 'What\'s the most expensive mistake caused by a systems/process gap in the last 2 years?',
      type: 'text',
      placeholder: 'Lost client, tax penalty, missed opportunity, overpayment...',
      charLimit: 300,
      emotionalAnchor: 'expensive_systems_mistake',
      required: true
    },

    // Section 3: Tech Stack
    {
      id: 'sa_tech_stack',
      section: 'Tech Stack',
      question: 'Which software tools does your business use? (Select all that apply)',
      type: 'multi',
      options: [
        'Xero / QuickBooks / Sage (Accounting)',
        'HubSpot / Salesforce / Pipedrive (CRM)',
        'Asana / Trello / Monday (Projects)',
        'Slack / Teams (Communication)',
        'Stripe / GoCardless (Payments)',
        'BrightPay / Gusto (Payroll)',
        'Shopify / WooCommerce (E-commerce)',
        'Google Workspace / Microsoft 365',
        'Custom/bespoke systems',
        'Lots of spreadsheets'
      ],
      technicalField: 'current_tech_stack',
      required: true
    },
    {
      id: 'sa_integration_health',
      section: 'Tech Stack',
      question: 'How would you rate the integration between these systems?',
      type: 'single',
      options: [
        'Seamless - data flows automatically',
        'Partial - some connected, some manual',
        'Minimal - mostly manual transfers',
        'Non-existent - each system is an island'
      ],
      technicalField: 'integration_health',
      required: true
    },
    {
      id: 'sa_spreadsheet_count',
      section: 'Tech Stack',
      question: 'How many spreadsheets are "critical" to running your business? (Be honest)',
      type: 'single',
      options: [
        'None - everything\'s in proper systems',
        '1-3 key spreadsheets',
        '4-10 spreadsheets',
        '10-20 spreadsheets',
        'I\'ve lost count'
      ],
      technicalField: 'spreadsheet_dependency',
      required: true
    },

    // Section 4: Focus Areas
    {
      id: 'sa_priority_areas',
      section: 'Focus Areas',
      question: 'Which areas feel most broken right now? (Select top 3)',
      type: 'multi',
      maxSelections: 3,
      options: [
        'Financial reporting / management accounts',
        'Accounts payable (paying suppliers)',
        'Accounts receivable (getting paid)',
        'Inventory / stock management',
        'Payroll and HR processes',
        'Sales / CRM / pipeline tracking',
        'Project management and delivery',
        'Client onboarding',
        'Compliance and documentation',
        'IT infrastructure / security'
      ],
      technicalField: 'priority_areas',
      required: true
    },
    {
      id: 'sa_magic_fix',
      section: 'Focus Areas',
      question: 'If you could fix ONE process by magic, which would have the biggest impact?',
      type: 'text',
      placeholder: 'Describe the process and why fixing it would matter...',
      charLimit: 300,
      emotionalAnchor: 'magic_process_fix',
      required: true
    },

    // Section 5: Readiness
    {
      id: 'sa_change_appetite',
      section: 'Readiness',
      question: 'What\'s your appetite for change right now?',
      type: 'single',
      options: [
        'Urgent - we need to fix this yesterday',
        'Ready - we\'ve budgeted time and money for this',
        'Cautious - we want to improve but can\'t afford disruption',
        'Exploring - just want to understand options'
      ],
      technicalField: 'change_appetite',
      required: true
    },
    {
      id: 'sa_fears',
      section: 'Readiness',
      question: 'What\'s your biggest fear about tackling systems?',
      type: 'multi',
      options: [
        'Cost will spiral out of control',
        'Implementation will disrupt operations',
        'We\'ll invest and it won\'t work',
        'Team won\'t adopt new processes',
        'We\'ll become dependent on consultants',
        'We\'ll discover how bad things really are',
        'We\'ll have to let people go'
      ],
      emotionalAnchor: 'systems_fears',
      required: true
    },
    {
      id: 'sa_champion',
      section: 'Readiness',
      question: 'Who internally would champion this project?',
      type: 'single',
      options: [
        'Me - the founder/owner',
        'Finance manager/FD',
        'Operations manager',
        'Office manager',
        'IT lead',
        'We don\'t have an obvious person'
      ],
      technicalField: 'internal_champion',
      required: true
    }
  ]
};

// ============================================================================
// FRACTIONAL EXECUTIVE - Executive Capacity Diagnostic
// ============================================================================

export const FRACTIONAL_EXECUTIVE_ASSESSMENT: ServiceLineAssessment = {
  code: 'fractional_executive',
  name: 'Fractional CFO/COO',
  title: 'Executive Capacity Diagnostic',
  subtitle: 'Let\'s understand where senior expertise would help most',
  sections: [
    'Why Now',
    'Capacity Gap',
    'Requirements',
    'Engagement',
    'Fit'
  ],
  questions: [
    // Section 1: Why Now
    {
      id: 'fe_trigger',
      section: 'Why Now',
      question: 'What\'s happening in your business that made you think "I need senior help"?',
      type: 'text',
      placeholder: 'The trigger - funding round, growth spike, feeling out of depth, board pressure...',
      charLimit: 400,
      emotionalAnchor: 'executive_trigger',
      required: true
    },
    {
      id: 'fe_situation',
      section: 'Why Now',
      question: 'Which statement best describes your current situation?',
      type: 'single',
      options: [
        'Growing fast - operations can\'t keep up with sales',
        'Raising capital - need credibility and expertise',
        'Plateau\'d - need strategic clarity to break through',
        'Struggling - need someone to help turn things around',
        'Acquiring/being acquired - need M&A experience',
        'Founder overwhelm - I\'m doing everything and burning out'
      ],
      emotionalAnchor: 'business_situation',
      required: true
    },
    {
      id: 'fe_first_fix',
      section: 'Why Now',
      question: 'If you hired a full-time CFO or COO tomorrow, what would you ask them to fix first?',
      type: 'text',
      placeholder: 'The most urgent problem you\'d hand over...',
      charLimit: 300,
      emotionalAnchor: 'first_fix_priority',
      required: true
    },

    // Section 2: Capacity Gap
    {
      id: 'fe_gap_areas',
      section: 'Capacity Gap',
      question: 'Which challenges are keeping you up at night? (Select all that apply)',
      type: 'multi',
      options: [
        // Financial (CFO)
        'Don\'t know if we\'re actually making money',
        'Cash flow is unpredictable',
        'Can\'t produce numbers investors would respect',
        'Don\'t understand our unit economics',
        'Pricing feels like guesswork',
        'Financial controls are weak or non-existent',
        'Board reporting is painful and time-consuming',
        'We need to raise capital but aren\'t ready',
        // Operational (COO)
        'Processes are chaos - nothing is documented',
        'We can\'t deliver consistently as we grow',
        'Team structure doesn\'t make sense anymore',
        'Too many fires to fight - no time for strategy',
        'We keep missing deadlines/targets',
        'Customer experience is inconsistent',
        'Tech systems don\'t talk to each other',
        'I\'m the bottleneck for everything'
      ],
      emotionalAnchor: 'executive_gap_areas',
      required: true
    },
    {
      id: 'fe_financial_leadership',
      section: 'Capacity Gap',
      question: 'Who currently handles strategic financial decisions in your business?',
      type: 'single',
      options: [
        'Me - I work it out myself',
        'My accountant - they give advice when asked',
        'A bookkeeper - they do numbers, not strategy',
        'A part-time FD - limited hours',
        'Nobody - we wing it',
        'We have someone but they\'re not senior enough'
      ],
      technicalField: 'financial_leadership_status',
      required: true
    },
    {
      id: 'fe_operational_leadership',
      section: 'Capacity Gap',
      question: 'Who currently handles operational strategy and execution?',
      type: 'single',
      options: [
        'Me - I manage everything day-to-day',
        'Department heads - but no overall coordination',
        'An office/ops manager - but they\'re not strategic',
        'Nobody - everyone just does their thing',
        'We have someone but they\'re overwhelmed'
      ],
      technicalField: 'operational_leadership_status',
      required: true
    },

    // Section 3: Requirements
    {
      id: 'fe_priorities',
      section: 'Requirements',
      question: 'In the next 12 months, what\'s most important to you? (Rank top 3)',
      type: 'multi',
      maxSelections: 3,
      options: [
        'Raise investment funding',
        'Improve profitability',
        'Fix cash flow problems',
        'Scale operations for growth',
        'Prepare for exit/sale',
        'Improve board/investor reporting',
        'Implement financial controls',
        'Reduce founder dependency',
        'Build management team',
        'Sort out the mess'
      ],
      technicalField: 'twelve_month_priorities',
      required: true
    },
    {
      id: 'fe_upcoming_events',
      section: 'Requirements',
      question: 'Do you have any of these coming up? (Select all that apply)',
      type: 'multi',
      options: [
        'Investment round in next 6 months',
        'Bank facility review/renewal',
        'Potential acquisition (us buying)',
        'Potential exit (us selling)',
        'Major contract negotiation',
        'System implementation',
        'Office move / expansion',
        'International expansion',
        'None of these'
      ],
      technicalField: 'upcoming_events',
      required: true
    },
    {
      id: 'fe_governance',
      section: 'Requirements',
      question: 'What does your board/investor reporting look like currently?',
      type: 'single',
      options: [
        'We have a board and report monthly - it\'s robust',
        'We have a board but reporting is basic',
        'We have investors but no formal board',
        'No external stakeholders yet',
        'What board?'
      ],
      technicalField: 'governance_maturity',
      required: true
    },

    // Section 4: Engagement
    {
      id: 'fe_engagement_level',
      section: 'Engagement',
      question: 'How much support do you think you need?',
      type: 'single',
      options: [
        'Light touch - 2 days per month for strategic guidance',
        'Regular - 1 day per week for consistent involvement',
        'Heavy - 2-3 days per week, hands-on leadership',
        'Intensive - full-time equivalent for a project period',
        'I don\'t know - help me figure this out'
      ],
      technicalField: 'engagement_level_preference',
      required: true
    },
    {
      id: 'fe_budget',
      section: 'Engagement',
      question: 'What\'s your budget expectation for this kind of support?',
      type: 'single',
      options: [
        'Under £5k/month',
        '£5k-£10k/month',
        '£10k-£15k/month',
        '£15k+/month',
        'I don\'t know what\'s reasonable'
      ],
      technicalField: 'budget_expectation',
      required: true
    },
    {
      id: 'fe_success_vision',
      section: 'Engagement',
      question: 'What would make this engagement a success in your eyes?',
      type: 'text',
      placeholder: 'Paint the picture - what\'s different 12 months from now?',
      charLimit: 400,
      emotionalAnchor: 'success_vision',
      required: true
    },

    // Section 5: Fit
    {
      id: 'fe_working_style',
      section: 'Fit',
      question: 'What\'s your working style preference for this person?',
      type: 'multi',
      options: [
        'Directive - tell me what to do and I\'ll execute',
        'Collaborative - work alongside me and my team',
        'Coaching - help me become better at this myself',
        'Hands-off - just fix things in the background',
        'Flexible - adapt to what\'s needed'
      ],
      technicalField: 'working_style_preference',
      required: true
    },
    {
      id: 'fe_concerns',
      section: 'Fit',
      question: 'What\'s your biggest concern about bringing in senior external help?',
      type: 'multi',
      options: [
        'Cost - is it worth it?',
        'Culture - will they understand us?',
        'Dependency - will we need them forever?',
        'Time - more of my time explaining things',
        'Authority - stepping on existing team members',
        'Exposure - they\'ll see how bad things are',
        'Commitment - are they really invested in us?'
      ],
      emotionalAnchor: 'external_help_concerns',
      required: true
    }
  ]
};

// ============================================================================
// EXPORT ALL ASSESSMENTS
// ============================================================================

// ============================================================================
// BENCHMARKING - Loads questions from database
// ============================================================================

export const BENCHMARKING_ASSESSMENT: ServiceLineAssessment = {
  code: 'benchmarking',
  name: 'Benchmarking',
  title: 'Industry Comparison Assessment',
  subtitle: 'Help us understand your business so we can find the right comparisons',
  sections: [
    'classification',
    'size_context',
    'self_assessment',
    'pain_priority',
    'magic_action'
  ],
  questions: [] // Will be loaded from database in ServiceAssessmentPage
};

export const SERVICE_LINE_ASSESSMENTS: Record<string, ServiceLineAssessment> = {
  management_accounts: MANAGEMENT_ACCOUNTS_ASSESSMENT,
  systems_audit: SYSTEMS_AUDIT_ASSESSMENT,
  fractional_executive: FRACTIONAL_EXECUTIVE_ASSESSMENT,
  benchmarking: BENCHMARKING_ASSESSMENT
};

export function getAssessmentByCode(code: string): ServiceLineAssessment | undefined {
  return SERVICE_LINE_ASSESSMENTS[code];
}

