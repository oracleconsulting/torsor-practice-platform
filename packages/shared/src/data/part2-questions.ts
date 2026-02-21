// ============================================================================
// PART 2: BUSINESS DEEP DIVE ASSESSMENT (72 Questions)
// ============================================================================
// Comprehensive business analysis across 12 sections

export interface Part2Question {
  id: number;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'slider' | 'number' | 'conditional' | 'matrix';
  fieldName: string;
  required?: boolean;
  options?: string[];
  hasOther?: boolean;
  helperText?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  matrixItems?: Array<{ label: string; fieldName: string }>;
  conditionalQuestions?: Array<{
    id: string;
    question: string;
    type: string;
    fieldName: string;
    options?: string[];
    hasOther?: boolean;
    min?: number;
    max?: number;
    showWhen: string;
  }>;
}

export interface Part2Section {
  title: string;
  shortTitle: string;
  description: string;
  questions: Part2Question[];
}

/** Section 0: Life–Business Bridge — appears before all business sections. Connects Part 1 to Part 2. */
export const lifeBusinessBridgeSection: Part2Section = {
  title: 'Life–Business Bridge',
  shortTitle: 'Life Bridge',
  description: 'Connect your life vision from Part 1 to the practical steps we\'ll take in your business.',
  questions: [
    {
      id: 1001,
      question: "You described your ideal Tuesday in Part 1. What's the single biggest thing in your business preventing that from happening this week?",
      type: 'text',
      fieldName: 'lb_biggest_blocker',
      placeholder: 'The one thing standing between you and that Tuesday...',
      required: true,
      helperText: 'Dynamic: uses your Part 1 Tuesday Test if available.'
    },
    {
      id: 1002,
      question: "If your business could run without you for a month, what would you do with that month? Be specific.",
      type: 'textarea',
      fieldName: 'lb_month_off',
      placeholder: "Not \"relax\" — where would you go, who would you be with, what would you do?",
      required: true
    },
    {
      id: 1003,
      question: "What's the minimum your business needs to earn — per month — for you to live the life you described in Part 1?",
      type: 'slider',
      fieldName: 'lb_enough_number',
      min: 2000,
      max: 50000,
      required: true,
      helperText: '£/month — your "enough" number.'
    },
    {
      id: 1004,
      question: "Think about what needs to change for you to live the life you described. What needs to change in the business vs. what needs to change in you?",
      type: 'textarea',
      fieldName: 'lb_change_source',
      placeholder: "Some changes are about systems and processes. Some are about you letting go...",
      required: true
    },
    {
      id: 1005,
      question: "If you could only achieve ONE life change in the next 12 weeks — not a business goal, a LIFE change — what would matter most?",
      type: 'text',
      fieldName: 'lb_quarter_priority',
      placeholder: "The one thing that would make your life measurably better...",
      required: true
    },
    {
      id: 1006,
      question: "What would the person closest to you say is the most important change you could make in the next 3 months?",
      type: 'text',
      fieldName: 'lb_external_perspective',
      placeholder: "What would your partner, best friend, or family member say if you asked them honestly?",
      required: true
    }
  ]
};

export const SECTION_FRAMINGS: Record<string, string> = {
  'Money Truth': 'Understanding your numbers so you can hit your "enough" target and stop worrying.',
  'The Money Truth': 'Understanding your numbers so you can hit your "enough" target and stop worrying.',
  'Customer & Market Reality': 'Making sure the right clients are paying enough that you don\'t have to overwork.',
  'Execution Engine': 'Finding what you can stop doing, so you get hours back.',
  'People & Culture': 'Building a team that means you don\'t have to be there every day.',
  'Tech & Data': 'Automating the things that steal your evenings.',
  'Product & Customer Value': 'Making sure what you sell is worth your time — and theirs.',
  'Risk & Compliance': 'Removing the things that keep you up at night.',
  'Supply Chain & Partnerships': 'Relationships that make the business easier, not harder.',
  'Market Position & Growth': 'Growing in a way that gives you more life, not less.',
  'Integration & Bottlenecks': 'Finding the things that force you to be the bottleneck.',
  'Leadership & Vision Reality': 'Where you\'re trying to go — and what\'s actually in the way.',
  'External Support & Advisory': 'What help looks like, so you\'re not doing this alone.',
  "What's Behind the Scenes?": 'The reality behind the numbers.'
};

export const part2Sections: Part2Section[] = [
  {
    title: "Leadership & Vision Reality",
    shortTitle: "Vision",
    description: "Let's start with the fundamentals of your business and long-term vision.",
    questions: [
      {
        id: 1,
        question: "What's your trading name?",
        type: "text",
        fieldName: "trading_name",
        required: true
      },
      {
        id: 2,
        question: "Companies House number (if you have one)",
        type: "text",
        fieldName: "companies_house_number",
        required: false
      },
      {
        id: 3,
        question: "Years Trading",
        type: "radio",
        fieldName: "years_trading",
        required: true,
        options: ["Less than 1", "1-2", "3-5", "6-10", "10+"]
      },
      {
        id: 4,
        question: "In 10 years, we'll be known for...",
        type: "textarea",
        fieldName: "ten_year_vision",
        helperText: "What's your long-term vision?",
        required: true
      },
      {
        id: 5,
        question: "What external forces could derail your plans?",
        type: "checkbox",
        fieldName: "external_forces",
        options: ["New regulations", "Market shifts", "Tech disruptions", "Economic downturn", "Climate/sustainability", "Other"],
        hasOther: true
      },
      {
        id: 6,
        question: "Annual turnover band",
        type: "radio",
        fieldName: "annual_turnover",
        required: true,
        options: ["Under £100k", "£100k-£250k", "£250k-£500k", "£500k-£1m", "£1m-£5m", "Over £5m", "Prefer not to say"]
      },
      {
        id: 7,
        question: "Primary income stream (one sentence)",
        type: "text",
        fieldName: "primary_revenue_stream",
        helperText: "e.g. 'Sales of compostable packaging', 'Consulting projects', 'Licensing fees'",
        required: true
      },
      {
        id: 8,
        question: "Where are most customers based?",
        type: "checkbox",
        fieldName: "customer_locations",
        options: ["England", "Scotland", "Wales", "Republic of Ireland", "Northern Ireland", "EU", "US & Canada", "Asia", "Other"]
      },
      {
        id: 9,
        question: "Environmental/Social Impact",
        type: "radio",
        fieldName: "environmental_impact",
        options: ["We're carbon neutral", "Working on a plan", "Know we should care but don't", "Not relevant", "Becoming a customer demand"]
      }
    ]
  },
  {
    title: "The Money Truth",
    shortTitle: "Money",
    description: "Let's dive into your financial reality and what winning looks like.",
    questions: [
      {
        id: 10,
        question: "In one sentence, what does \"winning\" look like by 2030?",
        type: "textarea",
        fieldName: "winning_2030",
        required: true
      },
      {
        id: 11,
        question: "What three shifts must happen in the next 6 months to head that way?",
        type: "textarea",
        fieldName: "six_month_shifts",
        helperText: "List three key changes needed",
        required: true
      },
      {
        id: 12,
        question: "Financial Visibility",
        type: "radio",
        fieldName: "financial_visibility",
        options: ["Real-time dashboards", "Monthly reports", "Quarterly accounts", "Annual accounts only", "Flying blind"]
      },
      {
        id: 13,
        question: "What's Eating Profits?",
        type: "checkbox",
        fieldName: "profit_eaters",
        options: ["Don't know", "Supplier/material costs", "Staff costs", "Overheads", "CAC (customer acquisition costs)", "Everything's healthy"]
      },
      {
        id: 14,
        question: "How Data-Driven Are You?",
        type: "radio",
        fieldName: "data_driven_level",
        options: ["Gut feel", "Basic reports", "Some dashboards", "Advanced analytics", "Drowning in data"]
      },
      {
        id: 15,
        question: "Pick your top three priorities for the next 90 days",
        type: "checkbox",
        fieldName: "ninety_day_priorities",
        options: ["Fix cashflow or margins", "Increase revenue", "Reduce costs", "Improve team communication", "Improve delivery or fulfillment", "Implement new software", "Hire key roles", "Streamline Operations", "Launch a new product or service", "Get out of the day to day", "Improve marketing", "Other"],
        hasOther: true
      },
      {
        id: 16,
        question: "How confident are you that you'll hit those priorities?",
        type: "slider",
        fieldName: "priority_confidence",
        min: 0,
        max: 10
      }
    ]
  },
  {
    title: "Customer & Market Reality",
    shortTitle: "Market",
    description: "Understanding your customers and market position.",
    questions: [
      {
        id: 17,
        question: "Customer Experience Rating",
        type: "slider",
        fieldName: "customer_experience_rating",
        helperText: "How would customers rate their experience with you?",
        min: 0,
        max: 10
      },
      {
        id: 18,
        question: "How Do You Win Business?",
        type: "checkbox",
        fieldName: "win_business_methods",
        options: ["Word of mouth", "Digital marketing", "Sales Hustle", "Partner channels", "Inbound leads", "Struggling here"]
      },
      {
        id: 19,
        question: "Who usually has the final say on day-to-day calls?",
        type: "radio",
        fieldName: "decision_maker",
        options: ["Founder", "Senior Team", "Whoever shouts loudest", "Board/Advisors", "No one really", "Other"],
        hasOther: true
      },
      {
        id: 20,
        question: "What would you say is your single greatest growth bottleneck?",
        type: "textarea",
        fieldName: "growth_bottleneck",
        required: true
      },
      {
        id: 21,
        question: "Customer Profitability Insight",
        type: "radio",
        fieldName: "customer_profitability",
        options: ["Know Exactly", "Rough idea", "All rev is good rev", "Never analysed", "Other"]
      },
      {
        id: 22,
        question: "How quickly can key decisions be made when data is unclear?",
        type: "slider",
        fieldName: "decision_speed",
        helperText: "0 = paralyzed, 10 = instant",
        min: 0,
        max: 10
      }
    ]
  },
  {
    title: "Execution Engine",
    shortTitle: "Execution",
    description: "How well does your business execute on plans and processes?",
    questions: [
      {
        id: 23,
        question: "What is your operational maturity?",
        type: "radio",
        fieldName: "operational_maturity",
        options: ["Chaos - reinvent wheel daily", "Some processes, lots of exceptions", "Documented but not followed", "Smooth but not scalable", "Automated and efficient"]
      },
      {
        id: 24,
        question: "How's your tech infrastructure?",
        type: "radio",
        fieldName: "tech_infrastructure",
        options: ["Spreadsheets and prayers", "Mix of tools barely connected", "Decent systems, poor integration", "Modern stack, some legacy", "Cutting edge throughout"]
      },
      {
        id: 25,
        question: "We review cashflow and budgets at least monthly.",
        type: "slider",
        fieldName: "cashflow_review_frequency",
        helperText: "0 = never, 10 = religiously",
        min: 0,
        max: 10
      },
      {
        id: 26,
        question: "How do new ideas turn into things people can buy?",
        type: "radio",
        fieldName: "innovation_process",
        options: ["No bandwidth to innovate", "Ideas but no execution", "Small experiments running", "Active R&D program", "Innovation is our edge"]
      },
      {
        id: 27,
        question: "How up-to-date is your bookkeeping right now?",
        type: "radio",
        fieldName: "bookkeeping_status",
        options: ["This week", "Last Month", "Last Quarter", "Older than that"]
      },
      {
        id: 28,
        question: "How often do critical systems fail?",
        type: "radio",
        fieldName: "system_reliability",
        options: ["Daily fires", "Weekly issues", "Monthly hiccups", "Rare problems", "Rock solid"]
      },
      {
        id: 29,
        question: "How confident are you that your numbers are accurate?",
        type: "slider",
        fieldName: "numbers_confidence",
        min: 0,
        max: 10
      },
      {
        id: 30,
        question: "What's your biggest money worry right now?",
        type: "textarea",
        fieldName: "money_worry",
        required: true
      }
    ]
  },
  {
    title: "People & Culture",
    shortTitle: "People",
    description: "Understanding your team and company culture.",
    questions: [
      {
        id: 31,
        question: "What's your team reality?",
        type: "radio",
        fieldName: "team_size",
        options: ["Just me", "2-5 people", "6-25", "16-50", "50+"]
      },
      {
        id: 32,
        question: "Your company culture in one word?",
        type: "radio",
        fieldName: "culture_word",
        options: ["Chaotic", "Stressful", "Improving", "Collaborative", "Thriving", "Other..."],
        hasOther: true
      },
      {
        id: 33,
        question: "Biggest people challenge?",
        type: "radio",
        fieldName: "people_challenge",
        options: ["Finding talent", "Keeping talent", "Performance issues", "Leadership gaps", "Culture/morale"]
      }
    ]
  },
  {
    title: "Tech & Data",
    shortTitle: "Tech",
    description: "Your technology stack and data infrastructure.",
    questions: [
      {
        id: 34,
        question: "Core systems in play",
        type: "checkbox",
        fieldName: "core_systems",
        options: ["Accounting (e.g. Xero, Sage)", "CRM (e.g. HubSpot, Salesforce)", "Project / Job Management", "Inventory / Stock Control", "Helpdesk or Live Chat", "Website CMS (e.g. Webflow, Wordpress)", "Custom Software / Internal Tools", "AI Tools or Automation", "Other"],
        hasOther: true
      },
      {
        id: 35,
        question: "How often do systems 'talk' via live integrations?",
        type: "slider",
        fieldName: "system_integration_level",
        helperText: "0 = never, 10 = everything connected",
        min: 0,
        max: 10
      },
      {
        id: 36,
        question: "Are there any clunky systems or messy code that trip you up?",
        type: "textarea",
        fieldName: "clunky_systems",
        helperText: "Any risky dependencies, flaky tools or outdated systems?"
      },
      {
        id: 37,
        question: "Typical monthly downtime across customer-facing services",
        type: "radio",
        fieldName: "monthly_downtime_hours",
        options: ["All fine", "0-5 hours", "5-10 hours", "10-15 hours", "15-20 hours", "20+ hours"]
      }
    ]
  },
  {
    title: "Product & Customer Value",
    shortTitle: "Product",
    description: "How you create and deliver value to customers.",
    questions: [
      {
        id: 38,
        question: "How do you know what customers want?",
        type: "radio",
        fieldName: "customer_insight_method",
        options: ["They tell us when happy", "Feedback surveys", "Usage data", "Formal research program", "We guess"]
      },
      {
        id: 39,
        question: "Product development approach?",
        type: "radio",
        fieldName: "product_dev_approach",
        options: ["Build what we think is best", "Copy competitors", "Customer requests drive it", "Data-driven roadmap", "No bandwidth for new products"]
      },
      {
        id: 40,
        question: "Main customer segment",
        type: "textarea",
        fieldName: "main_customer_segment",
        helperText: "Describe who buys from you most (e.g. 'UK-based HR teams in 100-500-person firms')"
      },
      {
        id: 41,
        question: "Out of 10, how do you think customers would rate you today?",
        type: "slider",
        fieldName: "customer_rating",
        min: 0,
        max: 10
      },
      {
        id: 42,
        question: "Biggest shift you need from the market in the next year",
        type: "textarea",
        fieldName: "market_shift_needed",
        helperText: "E.g. better buyer education, stronger referrals, brand recognition, trust, pricing power..."
      },
      {
        id: 43,
        question: "What do customers praise you for most?",
        type: "textarea",
        fieldName: "customer_praise"
      }
    ]
  },
  {
    title: "Risk & Compliance",
    shortTitle: "Risk",
    description: "Legal, compliance and risk management.",
    questions: [
      {
        id: 44,
        question: "Legal/compliance confidence?",
        type: "radio",
        fieldName: "legal_compliance_confidence",
        options: ["😱 Probably non-compliant", "😰 Doing minimum", "😐 Think we're okay", "🙂 Well covered", "😎 Bulletproof"]
      },
      {
        id: 45,
        question: "Data protection (GDPR) status?",
        type: "radio",
        fieldName: "gdpr_status",
        options: ["What's GDPR", "Should probably look at this", "Basic measures in place", "Fully compliant", "Privacy by design"]
      },
      {
        id: 46,
        question: "Cybersecurity readiness?",
        type: "radio",
        fieldName: "cybersecurity_readiness",
        options: ["No idea", "Basic antivirus", "Some security measures", "Comprehensive program", "Bank level security"]
      },
      {
        id: 47,
        question: "How do you handle contracts?",
        type: "radio",
        fieldName: "contract_handling",
        options: ["Handshake deals", "Basic templates", "Lawyer reviews being done", "Proper review process", "Full contract management"]
      },
      {
        id: 48,
        question: "Ethics/compliance training",
        type: "radio",
        fieldName: "ethics_training",
        options: ["Never done it", "Ad-hoc when issues arise", "Annual tick-box", "Regular and engaging", "Embedded in culture"]
      }
    ]
  },
  {
    title: "Supply Chain & Partnerships",
    shortTitle: "Supply",
    description: "Supplier relationships and partnership management.",
    questions: [
      {
        id: 49,
        question: "Supplier relationship health?",
        type: "radio",
        fieldName: "supplier_relationships",
        options: ["Constantly fighting on price", "Transactional", "Decent partnerships", "Strategic collaboration", "They're true partners"]
      },
      {
        id: 50,
        question: "How do you manage procurement?",
        type: "radio",
        fieldName: "procurement_management",
        options: ["Whoever's cheapest", "Gut feel", "Some process/criteria", "Strategic sourcing", "Advanced category management"]
      }
    ]
  },
  {
    title: "Market Position & Growth",
    shortTitle: "Growth",
    description: "Your competitive position and growth strategy.",
    questions: [
      {
        id: 51,
        question: "Competitive position?",
        type: "radio",
        fieldName: "competitive_position",
        options: ["Getting crushed", "Holding our own", "Slowly gaining", "Clear leader", "Category creator"]
      },
      {
        id: 52,
        question: "M&A/Partnership thoughts?",
        type: "radio",
        fieldName: "ma_partnership_thoughts",
        options: ["Never considered", "Might sell someday", "Open to opportunities", "Actively exploring", "Part of growth strategy"]
      }
    ]
  },
  {
    title: "Integration & Bottlenecks",
    shortTitle: "Integration",
    description: "Rate these critical business areas and identify key needs.",
    questions: [
      {
        id: 53,
        question: "Rate these business areas 💀 → 🚀",
        type: "matrix",
        fieldName: "business_ratings",
        matrixItems: [
          { label: "Financial clarity", fieldName: "rating_financial_clarity" },
          { label: "Customer happiness", fieldName: "rating_customer_happiness" },
          { label: "Team performance", fieldName: "rating_team_performance" },
          { label: "Operational efficiency", fieldName: "rating_operational_efficiency" },
          { label: "Growth momentum", fieldName: "rating_growth_momentum" },
          { label: "Risk management", fieldName: "rating_risk_management" },
          { label: "Innovation pipeline", fieldName: "rating_innovation_pipeline" },
          { label: "Tech/systems", fieldName: "rating_tech_systems" }
        ],
        min: 0,
        max: 10
      },
      {
        id: 54,
        question: "If you could hire three experts tomorrow...",
        type: "textarea",
        fieldName: "three_experts_needed",
        helperText: "Which roles would make the biggest impact?"
      },
      {
        id: 55,
        question: "What's the ONE thing that would give you 10 hours back?",
        type: "textarea",
        fieldName: "ten_hours_back"
      }
    ]
  },
  {
    title: "External Support & Advisory Network",
    shortTitle: "Advisors",
    description: "Understanding your current advisory support structure.",
    questions: [
      {
        id: 56,
        question: "Which external advisers do you currently lean on?",
        type: "checkbox",
        fieldName: "external_advisers",
        options: ["Accountant", "Bookkeeper", "Independent Financial Adviser", "Solicitor", "HR Consultant", "Marketing Agency", "IT/Managed Service Provider", "Other"],
        hasOther: true
      },
      {
        id: 57,
        question: "Roughly how many hours per month do they spend with you in total?",
        type: "text",
        fieldName: "adviser_hours_per_month",
        helperText: "e.g 8-10 hours"
      },
      {
        id: 58,
        question: "On a scale of 1-10, how well do they 'get' your long-term goals?",
        type: "slider",
        fieldName: "adviser_understanding",
        min: 0,
        max: 10
      },
      {
        id: 59,
        question: "Do you have any Non-Executive Directors on the board?",
        type: "conditional",
        fieldName: "has_neds",
        options: ["Yes", "No"],
        conditionalQuestions: [
          {
            id: "59a",
            question: "How Many?",
            type: "number",
            fieldName: "ned_count",
            showWhen: "Yes"
          },
          {
            id: "59b",
            question: "Meeting Frequency?",
            type: "radio",
            fieldName: "ned_meeting_frequency",
            options: ["Monthly", "Quarterly", "Ad-hoc"],
            showWhen: "Yes"
          },
          {
            id: "59c",
            question: "How valuable are your NEDs in shaping strategy?",
            type: "slider",
            fieldName: "ned_value",
            min: 0,
            max: 10,
            showWhen: "Yes"
          }
        ]
      },
      {
        id: 60,
        question: "Do you currently employ any fractional/part-time C-suite execs?",
        type: "conditional",
        fieldName: "has_fractional_execs",
        options: ["Yes", "No"],
        conditionalQuestions: [
          {
            id: "60a",
            question: "Which Roles",
            type: "checkbox",
            fieldName: "fractional_roles",
            options: ["CEO", "COO", "CFO", "CTO/CIO", "CMO", "CHRO", "CRO", "Other"],
            hasOther: true,
            showWhen: "Yes"
          },
          {
            id: "60b",
            question: "Approx. days per month each fractional exec works?",
            type: "text",
            fieldName: "fractional_days_per_month",
            showWhen: "Yes"
          }
        ]
      },
      {
        id: 61,
        question: "Overall confidence your current adviser network can get you to your 5-year target",
        type: "slider",
        fieldName: "adviser_network_confidence",
        min: 0,
        max: 10
      },
      {
        id: 62,
        question: "What extra expertise would make the biggest difference right now?",
        type: "textarea",
        fieldName: "expertise_needed"
      }
    ]
  },
  {
    title: "What's Behind the Scenes?",
    shortTitle: "Behind Scenes",
    description: "The honest truth about what's really happening in your business.",
    questions: [
      {
        id: 63,
        question: "What scares you most about bringing in help?",
        type: "radio",
        fieldName: "help_fears",
        options: ["Loss of control", "Cost", "They won't understand us", "Bad past experiences", "Nothing - bring it on"]
      },
      {
        id: 64,
        question: "What's the most frustrating part of your typical Monday?",
        type: "textarea",
        fieldName: "monday_frustration"
      },
      {
        id: 65,
        question: "If you could magic away one task forever, what would it be?",
        type: "textarea",
        fieldName: "magic_away_task"
      },
      {
        id: 66,
        question: "What would your partner/family say needs to change?",
        type: "textarea",
        fieldName: "family_feedback"
      },
      {
        id: 67,
        question: "What's one part of your business you'd never tell a client?",
        type: "textarea",
        fieldName: "business_secret"
      },
      {
        id: 68,
        question: "What are you secretly proud of but never say out loud?",
        type: "textarea",
        fieldName: "secret_pride"
      },
      {
        id: 69,
        question: "What would fall apart if you took a two-week break?",
        type: "textarea",
        fieldName: "two_week_break_impact"
      },
      {
        id: 70,
        question: "What are you doing really well but overlook?",
        type: "textarea",
        fieldName: "overlooked_strength"
      },
      {
        id: 71,
        question: "Who could help you — but you haven't asked? Why not?",
        type: "textarea",
        fieldName: "unasked_help"
      },
      {
        id: 72,
        question: "When was the last time you felt properly excited about the work? What was happening?",
        type: "textarea",
        fieldName: "last_excitement"
      }
    ]
  }
];

// Computed totals
export const PART2_TOTAL_SECTIONS = part2Sections.length;
export const PART2_TOTAL_QUESTIONS = part2Sections.reduce(
  (total, section) => total + section.questions.length,
  0
);

/** Part 2 with Life–Business Bridge first (Section 0). Use for GA 365 flow. */
export const part2SectionsWithLifeBridge: Part2Section[] = [
  lifeBusinessBridgeSection,
  ...part2Sections
];