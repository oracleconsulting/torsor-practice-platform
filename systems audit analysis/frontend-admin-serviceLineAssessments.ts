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
  code: 'business_intelligence',
  name: 'Business Intelligence',
  title: 'Financial Visibility Diagnostic',
  subtitle: 'Help us understand your relationship with your numbers',
  sections: [
    'Current State',
    'Pain Points',
    'System Context',
    'Business Model',
    'Known Commitments',
    'Reporting Requirements',
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
    {
      id: 'ma_chart_of_accounts_granularity',
      section: 'System Context',
      question: 'How granular is your chart of accounts?',
      type: 'single',
      options: [
        'Very detailed - we track by service line, department, and project',
        'Moderately detailed - main categories plus some breakdown',
        'Basic - standard P&L categories only',
        'I don\'t know'
      ],
      technicalField: 'chart_of_accounts_granularity',
      required: true
    },
    {
      id: 'ma_revenue_tracking',
      section: 'System Context',
      question: 'Do you track revenue by customer or service line in your accounting system?',
      type: 'single',
      options: [
        'Yes, both customer and service line',
        'Yes, by customer only',
        'Yes, by service line only',
        'No, but we could set it up',
        'No, and it would be difficult'
      ],
      technicalField: 'revenue_tracking',
      required: true
    },

    // Section 4: Business Model
    {
      id: 'ma_revenue_model',
      section: 'Business Model',
      question: 'How would you describe your revenue model?',
      type: 'single',
      options: [
        'Mostly recurring (retainers, subscriptions, maintenance contracts)',
        'Mostly project-based (fixed fee or time-based projects)',
        'Mostly product sales (physical or digital products)',
        'Mixed - roughly equal split',
        'Transactional (one-off sales, no ongoing relationship)'
      ],
      technicalField: 'revenue_model',
      required: true
    },
    {
      id: 'ma_payment_terms_given',
      section: 'Business Model',
      question: 'What payment terms do you typically give customers?',
      type: 'single',
      options: [
        'Payment upfront or on delivery',
        '7-14 days',
        '30 days',
        '30-60 days',
        '60+ days',
        'It varies widely'
      ],
      technicalField: 'payment_terms_given',
      required: true
    },
    {
      id: 'ma_seasonality',
      section: 'Business Model',
      question: 'How seasonal is your business?',
      type: 'single',
      options: [
        'Very seasonal - revenue can vary 50%+ between peak and trough months',
        'Somewhat seasonal - noticeable peaks but manageable',
        'Fairly stable - minor fluctuations month to month',
        'Counter-cyclical - busy when others are quiet'
      ],
      technicalField: 'seasonality',
      required: true
    },
    {
      id: 'ma_customer_concentration',
      section: 'Business Model',
      question: 'If your top 3 customers left tomorrow, what % of revenue would you lose?',
      type: 'single',
      options: [
        'Over 50% - we\'re heavily concentrated',
        '30-50% - concentrated but not critical',
        '15-30% - reasonably diversified',
        'Under 15% - very diversified',
        'I don\'t actually know'
      ],
      technicalField: 'customer_concentration',
      required: true
    },
    {
      id: 'ma_employee_count',
      section: 'Business Model',
      question: 'How many employees (or FTE equivalent) do you have?',
      type: 'single',
      options: [
        'Just me',
        '2-5',
        '6-10',
        '11-25',
        '26-50',
        '50+'
      ],
      technicalField: 'employee_count',
      required: true
    },
    {
      id: 'ma_annual_revenue',
      section: 'Business Model',
      question: 'What\'s your approximate annual revenue?',
      type: 'single',
      options: [
        'Under £250k',
        '£250k - £500k',
        '£500k - £1m',
        '£1m - £2m',
        '£2m - £5m',
        '£5m+'
      ],
      technicalField: 'annual_revenue',
      required: true
    },

    // Section 5: Known Commitments
    {
      id: 'ma_upcoming_expenses',
      section: 'Known Commitments',
      question: 'What significant expenses do you have coming up in the next 90 days?',
      type: 'multi',
      options: [
        'VAT payment',
        'Corporation tax payment',
        'Large supplier invoice',
        'Equipment or vehicle purchase',
        'Bonus or commission payments',
        'Loan repayment',
        'Dividend payment',
        'Nothing significant planned',
        'Other'
      ],
      technicalField: 'upcoming_expenses',
      required: true
    },
    {
      id: 'ma_planned_hires',
      section: 'Known Commitments',
      question: 'Are you planning to hire anyone in the next 6 months?',
      type: 'single',
      options: [
        'Yes, definitely',
        'Possibly, depends on circumstances',
        'No plans to hire',
        'Actually planning to reduce headcount'
      ],
      technicalField: 'planned_hires',
      required: true
    },
    {
      id: 'ma_debt_lease_payments',
      section: 'Known Commitments',
      question: 'Do you have any debt or lease payments?',
      type: 'single',
      options: [
        'Yes - loans with regular repayments',
        'Yes - asset finance / HP agreements',
        'Yes - both loans and asset finance',
        'No debt or lease commitments'
      ],
      technicalField: 'debt_lease_payments',
      required: true
    },
    {
      id: 'ma_year_end_month',
      section: 'Known Commitments',
      question: 'When is your financial year end?',
      type: 'single',
      options: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      technicalField: 'year_end_month',
      required: true
    },

    // Section 6: Reporting Requirements
    {
      id: 'ma_report_recipients',
      section: 'Reporting Requirements',
      question: 'Who needs to see your management accounts?',
      type: 'multi',
      options: [
        'Just me',
        'My business partner(s)',
        'Leadership team / department heads',
        'Board of directors',
        'Bank or lender',
        'Investors',
        'Other'
      ],
      technicalField: 'report_recipients',
      required: true
    },
    {
      id: 'ma_budget_forecast',
      section: 'Reporting Requirements',
      question: 'Do you have a budget or forecast to compare against?',
      type: 'single',
      options: [
        'Yes, detailed budget by month',
        'Yes, but high-level / annual only',
        'No, but I\'d like one',
        'No, and not a priority right now'
      ],
      technicalField: 'budget_forecast',
      required: true
    },
    {
      id: 'ma_report_format',
      section: 'Reporting Requirements',
      question: 'How do you want to receive your management accounts?',
      type: 'multi',
      options: [
        'PDF report I can read on my phone',
        'Interactive dashboard I can explore',
        'Board pack with commentary',
        'Excel file I can manipulate',
        'All of the above'
      ],
      technicalField: 'report_format',
      required: true
    },
    {
      id: 'ma_prior_year_comparison',
      section: 'Reporting Requirements',
      question: 'Do you need to compare to prior year?',
      type: 'single',
      options: [
        'Yes, and we have good prior year data',
        'Yes, but our prior year data is messy',
        'No, we\'re too new / prior year isn\'t relevant',
        'No, we don\'t need that'
      ],
      technicalField: 'prior_year_comparison',
      required: true
    },

    // Section 7: Desired Outcomes
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
      id: 'ma_additional_analysis',
      section: 'Frequency & Scope',
      question: 'What specific additional analysis would be valuable?',
      type: 'multi',
      options: [
        'Cash flow forecasting (30/60/90 day projections)',
        '"What if" scenario modeling (e.g., impact of hiring, price changes)',
        'Rolling trend analysis (6-12 month patterns)',
        'Debtor analysis (who owes what, how old)',
        'Profitability by service line or customer',
        'Staff cost and productivity analysis',
        'Working capital optimization',
        'None of these - just the basics please'
      ],
      technicalField: 'additional_analysis_needs',
      required: true
    },
    {
      id: 'ma_upcoming_decisions',
      section: 'Frequency & Scope',
      question: 'What decisions do you have coming up that better numbers would help with?',
      type: 'multi',
      options: [
        'Hiring decisions',
        'Pricing decisions',
        'Investment / capex decisions',
        'Acquisition opportunities',
        'Exit or sale preparation',
        'Funding / borrowing decisions',
        'Premises decisions',
        'None specific right now'
      ],
      technicalField: 'upcoming_decisions',
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
    'What Good Looks Like',
    "Where You're Going",
    'Your Business',
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
      charLimit: 800,
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
      charLimit: 800,
      emotionalAnchor: 'expensive_systems_mistake',
      required: true
    },
    {
      id: 'sa_information_access',
      section: 'Impact Quantification',
      question: "How many times last month did someone ask for information and you couldn't get it within 5 minutes?",
      type: 'single',
      options: [
        'Never',
        '1-2 times',
        'Weekly',
        'Daily',
        'Constantly'
      ],
      technicalField: 'information_access_frequency',
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
      charLimit: 800,
      emotionalAnchor: 'magic_process_fix',
      required: true
    },

    // Section 5: What Good Looks Like
    {
      id: 'sa_desired_outcomes',
      section: 'What Good Looks Like',
      question: 'What specific outcomes do you most want from fixing your systems?',
      type: 'multi',
      maxSelections: 3,
      options: [
        'Know which clients or jobs are actually profitable',
        'See our cash position and forecast without asking anyone',
        'Close month-end in under a week',
        'Get quotes and proposals out within 48 hours',
        'Track pipeline and forecast revenue with confidence',
        'Free key people from manual admin and data entry',
        'Get management information I actually use for decisions',
        'Onboard new team members without things falling apart',
        'Scale the team without scaling the admin',
        'Have proper controls so mistakes don\'t slip through'
      ],
      technicalField: 'desired_outcomes',
      required: true
    },
    {
      id: 'sa_monday_morning',
      section: 'What Good Looks Like',
      question: 'When your systems are working properly, what does your Monday morning look like?',
      type: 'text',
      placeholder: 'What do you see when you open your laptop? What questions can you answer instantly? What meetings do you no longer need?',
      charLimit: 800,
      emotionalAnchor: 'monday_morning_vision',
      required: true
    },
    {
      id: 'sa_time_freedom',
      section: 'What Good Looks Like',
      question: 'If you got 10+ hours a week back, what would you actually spend that time on?',
      type: 'single',
      options: [
        'Clients \u2014 the work I\'m actually good at',
        'Business development \u2014 growing revenue',
        'Strategy and planning \u2014 thinking about the future',
        'Managing my team properly \u2014 not firefighting',
        'My life outside work \u2014 family, health, headspace',
        'Building something new \u2014 products, services, ideas'
      ],
      emotionalAnchor: 'time_freedom_priority',
      required: true
    },

    // Section 6: Where You're Going (6 questions)
    {
      id: 'sa_growth_shape',
      section: "Where You're Going",
      question: "When you picture the business in 12\u201318 months, what's actually different? Not revenue targets \u2014 what does the team look like, what are you doing that you're not doing today?",
      type: 'text',
      placeholder: "e.g., We've hired a senior PM so I'm not managing every project. We've launched a retainer product. We've opened a second office...",
      charLimit: 800,
      emotionalAnchor: 'growth_vision',
      required: true
    },
    {
      id: 'sa_next_hires',
      section: "Where You're Going",
      question: "What are the next 2\u20133 roles you'll hire for \u2014 and what's stopping you hiring them now?",
      type: 'text',
      placeholder: "e.g., Senior developer (can't because project scoping is too messy), Office manager (because Maria is doing 3 jobs)...",
      charLimit: 800,
      emotionalAnchor: 'hiring_blockers',
      required: true
    },
    {
      id: 'sa_growth_type',
      section: "Where You're Going",
      question: 'Which best describes what growth looks like for you?',
      type: 'single',
      options: [
        'More of the same \u2014 same services, more clients, bigger team',
        'Higher value \u2014 same-ish team, better clients, higher prices',
        "New offerings \u2014 launching services or products we don't do yet",
        'Geographic \u2014 new locations, markets, or remote expansion',
        'Acquisition \u2014 buying or merging with another business',
        "Honestly not sure \u2014 we're just trying to stabilise first"
      ],
      technicalField: 'growth_type',
      required: true
    },
    {
      id: 'sa_capacity_ceiling',
      section: "Where You're Going",
      question: "What's the first thing that would break if you won 3 new clients next month?",
      type: 'text',
      placeholder: 'Be specific \u2014 who gets overwhelmed, which process buckles, what falls through the cracks...',
      charLimit: 800,
      emotionalAnchor: 'capacity_ceiling',
      required: true
    },
    {
      id: 'sa_tried_and_failed',
      section: "Where You're Going",
      question: "What systems or tools have you tried and abandoned in the last 2 years \u2014 and why did they fail?",
      type: 'text',
      placeholder: "e.g., We tried Monday.com as a CRM but nobody used it. We bought HubSpot but it was overkill...",
      charLimit: 800,
      emotionalAnchor: 'failed_tools',
      required: true
    },
    {
      id: 'sa_non_negotiables',
      section: "Where You're Going",
      question: "What must NOT change? Which tools, processes, or ways of working does your team love?",
      type: 'text',
      placeholder: "e.g., The team loves Slack \u2014 any solution needs to work with it. Maria's month-end checklist is sacred. The dev team will revolt if we change their IDE...",
      charLimit: 800,
      emotionalAnchor: 'non_negotiables',
      required: true
    },

    // Section 7: Your Business
    {
      id: 'sa_team_size',
      section: 'Your Business',
      question: 'How many people work in your business currently?',
      type: 'text',
      placeholder: 'Enter number',
      technicalField: 'team_size',
      required: true
    },
    {
      id: 'sa_expected_team_size',
      section: 'Your Business',
      question: 'How many people do you expect in 12 months?',
      type: 'text',
      placeholder: 'Enter number',
      technicalField: 'expected_team_size_12mo',
      required: true
    },
    {
      id: 'sa_industry',
      section: 'Your Business',
      question: 'What industry are you in?',
      type: 'text',
      placeholder: 'e.g., Professional services, Manufacturing, Retail, Tech...',
      charLimit: 100,
      technicalField: 'industry_sector',
      required: true
    },
    {
      id: 'sa_business_model',
      section: 'Your Business',
      question: 'How does your business make money? (Select the closest match)',
      type: 'single',
      options: [
        'Project-based \u2014 quoted work with defined scope',
        'Retainer/recurring \u2014 monthly fees for ongoing services',
        'Mixed \u2014 some project, some retainer',
        'Product sales \u2014 physical or digital goods',
        'Subscription \u2014 SaaS or membership model',
        'Hourly/day rate \u2014 time-based billing',
        'Commission-based \u2014 earn on transactions or referrals'
      ],
      technicalField: 'business_model',
      required: true
    },
    {
      id: 'sa_team_structure',
      section: 'Your Business',
      question: 'Roughly, how is your team structured?',
      type: 'text',
      placeholder: 'e.g., Sophie (founder) + Priya (ops) + Jake leads 6 devs + 4 designers + Maria (finance) + 3 account managers',
      charLimit: 800,
      technicalField: 'team_structure',
      required: true
    },
    {
      id: 'sa_locations',
      section: 'Your Business',
      question: 'Where does your team work?',
      type: 'single',
      options: [
        "Single office \u2014 everyone's in the same place",
        'Hybrid \u2014 mix of office and remote',
        'Fully remote \u2014 no shared office',
        'Multiple offices/sites',
        'Field-based \u2014 team is out at client sites or on the road'
      ],
      technicalField: 'work_location',
      required: true
    },
    {
      id: 'sa_key_people_dependencies',
      section: 'Your Business',
      question: "If one person went on holiday for 2 weeks with no phone, what would break? Who is that person and what would break?",
      type: 'text',
      placeholder: "e.g., If Maria's off, nobody can do invoicing, payroll, or month-end. If Sophie's off, no proposals go out...",
      charLimit: 800,
      emotionalAnchor: 'key_person_dependency',
      required: true
    },

    // Section 8: Readiness
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

export const SERVICE_LINE_ASSESSMENTS: Record<string, ServiceLineAssessment> = {
  management_accounts: MANAGEMENT_ACCOUNTS_ASSESSMENT,
  systems_audit: SYSTEMS_AUDIT_ASSESSMENT,
  fractional_executive: FRACTIONAL_EXECUTIVE_ASSESSMENT
};

export function getAssessmentByCode(code: string): ServiceLineAssessment | undefined {
  return SERVICE_LINE_ASSESSMENTS[code];
}

