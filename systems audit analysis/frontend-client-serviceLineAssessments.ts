// ============================================================================
// SERVICE LINE ASSESSMENT DEFINITIONS
// ============================================================================
// Question definitions for each service line onboarding assessment
// ============================================================================

export interface AssessmentQuestion {
  id: string;
  section: string;
  question: string;
  type: 'single' | 'multi' | 'text' | 'rank' | 'slider';
  options?: string[];
  maxSelections?: number;
  placeholder?: string;
  charLimit?: number;
  emotionalAnchor?: string;  // For value proposition generation
  technicalField?: string;   // For technical/scope fields
  required?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderLabels?: { min: string; max: string };
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
// MANAGEMENT ACCOUNTS - Understanding Your Numbers
// ============================================================================
// 20 questions across 5 sections - redesigned for better MA qualification
// Duration: 8-10 minutes
// ============================================================================

export const MANAGEMENT_ACCOUNTS_ASSESSMENT: ServiceLineAssessment = {
  code: 'management_accounts',
  name: 'Management Accounts',
  title: 'Understanding Your Numbers',
  subtitle: 'Help us understand where better financial visibility would make the biggest difference',
  sections: [
    'Financial Blind Spots',
    'Decision Making',
    'Cash & Forecasting',
    'Current Reporting',
    'The Destination'
  ],
  questions: [
    // ========================================================================
    // Section 1: Financial Blind Spots (5 questions)
    // These dig into specific areas where they lack visibility
    // ========================================================================
    {
      id: 'ma_tuesday_question',
      section: 'Financial Blind Spots',
      question: 'It\'s Tuesday morning. You sit down with coffee. What\'s the ONE financial question you wish you could answer instantly - without logging into anything, pulling reports, or asking anyone?',
      type: 'text',
      placeholder: 'E.g., "Can we afford to hire?" / "Are we actually making money on the Smith contract?" / "What\'s our real cash position?"',
      charLimit: 200,
      emotionalAnchor: 'tuesday_question',
      required: true
    },
    {
      id: 'ma_avoided_calculation',
      section: 'Financial Blind Spots',
      question: 'What\'s the financial calculation you suspect you should do - but haven\'t, because you\'re not sure you want to know the answer?',
      type: 'text',
      placeholder: 'The thing you\'ve been putting off looking at...',
      charLimit: 250,
      emotionalAnchor: 'avoided_calculation',
      required: true
    },
    {
      id: 'ma_yearend_surprise',
      section: 'Financial Blind Spots',
      question: 'Think back to your last year-end accounts. Were you surprised by the result?',
      type: 'single',
      options: [
        'Yes, made more profit than expected',
        'Yes, made less profit than expected',
        'Yes, tax bill was a shock',
        'No, roughly what I expected',
        'I can\'t remember / didn\'t really look'
      ],
      emotionalAnchor: 'yearend_surprise',
      required: true
    },
    {
      id: 'ma_expensive_blindspot',
      section: 'Financial Blind Spots',
      question: 'Has a lack of financial visibility ever cost you money or caused a problem? Tell us what happened.',
      type: 'text',
      placeholder: 'A decision you got wrong, a surprise you weren\'t prepared for, an opportunity you missed...',
      charLimit: 350,
      emotionalAnchor: 'expensive_blindspot',
      required: true
    },
    {
      id: 'ma_numbers_relationship',
      section: 'Financial Blind Spots',
      question: 'How would you describe your current relationship with your business numbers?',
      type: 'single',
      options: [
        'I check key metrics weekly - genuinely useful',
        'I look at bank balance, that\'s about it',
        'I wait for my accountant to tell me how we did',
        'Numbers stress me out - I avoid them',
        'I want to engage more but don\'t know what to look at'
      ],
      emotionalAnchor: 'numbers_relationship',
      required: true
    },

    // ========================================================================
    // Section 2: Decision Making (4 questions)
    // Explores how financial information affects their decisions
    // ========================================================================
    {
      id: 'ma_decision_story',
      section: 'Decision Making',
      question: 'Tell us about the last significant business decision you made. How did financial information inform it?',
      type: 'text',
      placeholder: 'A hire, a pricing change, an investment, taking on a big client, letting someone go...',
      charLimit: 400,
      emotionalAnchor: 'decision_story',
      required: true
    },
    {
      id: 'ma_decision_speed',
      section: 'Decision Making',
      question: 'When you need to make a financial decision, how long does it typically take to get the information you need?',
      type: 'single',
      options: [
        'Minutes - I have dashboards/reports ready',
        'Hours - need to pull some things together',
        'Days - need to ask accountant/bookkeeper',
        'Weeks - requires proper investigation',
        'I usually just go with gut feel'
      ],
      technicalField: 'decision_speed',
      required: true
    },
    {
      id: 'ma_decision_confidence',
      section: 'Decision Making',
      question: 'When you make financial decisions, how confident are you in the underlying numbers?',
      type: 'slider',
      sliderMin: 1,
      sliderMax: 10,
      sliderLabels: { min: 'Flying blind', max: 'Complete confidence' },
      emotionalAnchor: 'decision_confidence',
      required: true
    },
    {
      id: 'ma_upcoming_decisions',
      section: 'Decision Making',
      question: 'What decisions are on your horizon in the next 6-12 months where better numbers would help?',
      type: 'multi',
      options: [
        'Hiring (who, when, can we afford it?)',
        'Pricing (are we charging enough?)',
        'Investment/capex (equipment, premises, systems)',
        'Taking on a big client or project',
        'Letting go of a client (are they worth it?)',
        'Exit planning or sale preparation',
        'Seeking funding or borrowing',
        'Partner/shareholder discussions',
        'Expansion into new services/markets',
        'None specific - just want general visibility'
      ],
      emotionalAnchor: 'upcoming_decisions',
      required: true
    },

    // ========================================================================
    // Section 3: Cash & Forecasting (4 questions)
    // Digs into cash visibility - the highest-value MA component
    // ========================================================================
    {
      id: 'ma_cash_visibility_30day',
      section: 'Cash & Forecasting',
      question: 'Right now, without looking anything up - do you know how much cash you\'ll have in 30 days?',
      type: 'single',
      options: [
        'Yes, within £5k',
        'Roughly, within £20k',
        'I could work it out if I had to',
        'No idea',
        'It varies too much to predict'
      ],
      technicalField: 'cash_visibility_30day',
      required: true
    },
    {
      id: 'ma_cash_surprises',
      section: 'Cash & Forecasting',
      question: 'In the last year, how many times has your cash position surprised you?',
      type: 'single',
      options: [
        'Never - I always know where we are',
        'Once or twice - minor surprises',
        'Several times - some were uncomfortable',
        'Regularly - cash is unpredictable',
        'I don\'t track it closely enough to be surprised'
      ],
      emotionalAnchor: 'cash_surprises',
      required: true
    },
    {
      id: 'ma_worst_cash_moment',
      section: 'Cash & Forecasting',
      question: 'Describe a time when you were caught off guard by your cash position. What happened?',
      type: 'text',
      placeholder: 'A payment you forgot, a shortfall you didn\'t see coming, a collision of expenses...',
      charLimit: 300,
      emotionalAnchor: 'worst_cash_moment',
      required: false  // Optional but valuable
    },
    {
      id: 'ma_tax_preparedness',
      section: 'Cash & Forecasting',
      question: 'How do you currently handle upcoming VAT and tax payments?',
      type: 'single',
      options: [
        'I set aside money each month - always prepared',
        'I know roughly when they\'re due, usually ready',
        'They always seem to sneak up on me',
        'I rely on my accountant to warn me',
        'I\'ve been caught short before'
      ],
      technicalField: 'tax_preparedness',
      required: true
    },

    // ========================================================================
    // Section 4: Current Reporting (3 questions)
    // Understanding what they currently receive and where it falls short
    // ========================================================================
    {
      id: 'ma_current_reports',
      section: 'Current Reporting',
      question: 'What financial reports do you currently receive?',
      type: 'multi',
      options: [
        'Monthly P&L',
        'Balance Sheet',
        'Cash flow statement',
        'Management accounts pack',
        'Budget vs actual comparison',
        'KPI dashboard',
        'Bank reconciliation',
        'Aged debtors/creditors',
        'Nothing regular - just year-end accounts'
      ],
      technicalField: 'current_reports',
      required: true
    },
    {
      id: 'ma_report_usefulness',
      section: 'Current Reporting',
      question: 'When you receive financial reports, how useful are they?',
      type: 'single',
      options: [
        'Very useful - I act on them regularly',
        'Somewhat useful - occasional insights',
        'Not very useful - I glance and file them',
        'Confusing - I don\'t understand them',
        'I don\'t receive regular reports'
      ],
      emotionalAnchor: 'report_usefulness',
      required: true
    },
    {
      id: 'ma_reports_missing',
      section: 'Current Reporting',
      question: 'What do your current reports NOT tell you that you wish they did?',
      type: 'text',
      placeholder: 'The question you still can\'t answer after looking at them...',
      charLimit: 300,
      emotionalAnchor: 'reports_missing',
      required: true
    },

    // ========================================================================
    // Section 5: The Destination (4 questions)
    // What would "good" look like? Painting the picture.
    // ========================================================================
    {
      id: 'ma_visibility_transformation',
      section: 'The Destination',
      question: 'If you had complete financial visibility, what would actually change in how you run the business?',
      type: 'text',
      placeholder: 'Think about decisions, stress levels, confidence, conversations with partners/bank/team...',
      charLimit: 400,
      emotionalAnchor: 'visibility_transformation',
      required: true
    },
    {
      id: 'ma_sleep_better',
      section: 'The Destination',
      question: 'What would need to be true for you to genuinely sleep better about your business finances?',
      type: 'text',
      placeholder: 'The knowledge or certainty that would give you peace of mind...',
      charLimit: 300,
      emotionalAnchor: 'sleep_better',
      required: true
    },
    {
      id: 'ma_scenario_interest',
      section: 'The Destination',
      question: 'Which "what if" questions would you most want to be able to answer?',
      type: 'multi',
      maxSelections: 3,
      options: [
        'What if we raised prices 10%?',
        'What if we hired another person?',
        'What if we lost our biggest client?',
        'What if we reduced debtor days?',
        'What if we cut overheads by 15%?',
        'What if revenue dropped 20%?',
        'What if we took on that big project?',
        'What if we invested in new equipment?'
      ],
      emotionalAnchor: 'scenario_interest',
      required: true
    },
    {
      id: 'ma_desired_frequency',
      section: 'The Destination',
      question: 'How often would you realistically want to see updated numbers?',
      type: 'single',
      options: [
        'Weekly - we move fast',
        'Monthly - the right rhythm for us',
        'Quarterly - we\'re stable enough',
        'I\'m not sure what\'s appropriate'
      ],
      technicalField: 'desired_frequency',
      required: true
    }
  ]
};

// ============================================================================
// SYSTEMS AUDIT - Operations Health Check (32 questions, 8 sections)
// ============================================================================
// Aligned with sa_discovery_responses DB columns and admin AssessmentPreviewPage.
// ============================================================================

export const SYSTEMS_AUDIT_ASSESSMENT: ServiceLineAssessment = {
  code: 'systems_audit',
  name: 'Systems Audit',
  title: 'Operations Health Check',
  subtitle: "Let's understand where your operations are struggling",
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
    {
      id: 'sa_breaking_point',
      section: 'Current Pain',
      question: 'What broke – or is about to break – that made you think about systems?',
      type: 'text',
      placeholder: 'Be specific – the incident, the near-miss, the frustration that tipped you over...',
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
        "Controlled chaos – it works but I can't explain how",
        "Manual heroics – we survive on people's goodwill",
        "Death by spreadsheet – everything's tracked but nothing connects",
        "Tech Frankenstein – we've bolted tools together over years",
        'Actually pretty good – we just need optimisation'
      ],
      emotionalAnchor: 'operations_self_diagnosis',
      required: true
    },
    {
      id: 'sa_month_end_shame',
      section: 'Current Pain',
      question: 'If I followed you through a typical month-end, what would embarrass you most?',
      type: 'text',
      placeholder: "The workaround you're ashamed of, the process you'd never show an investor...",
      charLimit: 800,
      emotionalAnchor: 'month_end_shame',
      required: true
    },
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
        'More than 80 hours'
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
        "We don't really \"close\" – it's ongoing"
      ],
      technicalField: 'month_end_close_duration',
      required: true
    },
    {
      id: 'sa_data_error_frequency',
      section: 'Impact Quantification',
      question: 'In the last year, how many times have you discovered data errors that affected a business decision?',
      type: 'single',
      options: [
        'Never – our data is solid',
        'Once or twice – minor issues',
        'Several times – some costly',
        "Regularly – I don't fully trust our numbers",
        "I don't know – which is the scary part"
      ],
      technicalField: 'data_error_frequency',
      required: true
    },
    {
      id: 'sa_expensive_mistake',
      section: 'Impact Quantification',
      question: "What's the most expensive mistake caused by a systems/process gap in the last 2 years?",
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
        'Google Workspace (Email, Docs)',
        'Microsoft 365',
        'BreatheHR / CharlieHR (HR)',
        'Dext / Receipt Bank (Expenses)',
        'Other (we\'ll capture in Stage 2)'
      ],
      technicalField: 'software_tools_used',
      required: true
    },
    {
      id: 'sa_integration_health',
      section: 'Tech Stack',
      question: 'How would you rate the integration between these systems?',
      type: 'single',
      options: [
        'Seamless – data flows automatically',
        'Partial – some connected, some manual',
        'Minimal – mostly manual transfers',
        'Non-existent – each system is an island'
      ],
      technicalField: 'integration_rating',
      required: true
    },
    {
      id: 'sa_spreadsheet_count',
      section: 'Tech Stack',
      question: 'How many spreadsheets are "critical" to running your business? (Be honest)',
      type: 'single',
      options: [
        "None – everything's in proper systems",
        '1-3 key spreadsheets',
        '4-10 spreadsheets',
        '10-20 spreadsheets',
        "I've lost count"
      ],
      technicalField: 'critical_spreadsheets',
      required: true
    },
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
      technicalField: 'broken_areas',
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
      charLimit: 100,
      placeholder: 'e.g., Professional services, Manufacturing, Retail, Tech...',
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
      question: "What's your appetite for change right now?",
      type: 'single',
      options: [
        'Urgent – we need to fix this yesterday',
        "Ready – we've budgeted time and money for this",
        "Cautious – we want to improve but can't afford disruption",
        'Exploring – just want to understand options'
      ],
      technicalField: 'change_appetite',
      required: true
    },
    {
      id: 'sa_fears',
      section: 'Readiness',
      question: "What's your biggest fear about tackling systems?",
      type: 'multi',
      options: [
        'Cost will spiral out of control',
        'Implementation will disrupt operations',
        "We'll invest and it won't work",
        "Team won't adopt new processes",
        "We'll become dependent on consultants",
        "We'll discover how bad things really are",
        "No major fears – just want to get on with it"
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
        'Me – the founder/owner',
        'Finance manager/FD',
        'Operations manager',
        'Office manager',
        'IT lead',
        'Other'
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

// ============================================================================
// EXPORT ALL ASSESSMENTS
// ============================================================================

export const SERVICE_LINE_ASSESSMENTS: Record<string, ServiceLineAssessment> = {
  management_accounts: MANAGEMENT_ACCOUNTS_ASSESSMENT,
  systems_audit: SYSTEMS_AUDIT_ASSESSMENT,
  fractional_executive: FRACTIONAL_EXECUTIVE_ASSESSMENT,
  benchmarking: BENCHMARKING_ASSESSMENT
};

export function getAssessmentByCode(code: string): ServiceLineAssessment | undefined {
  return SERVICE_LINE_ASSESSMENTS[code];
}
