// ============================================================================
// SYSTEMS AUDIT - STAGE 1 DISCOVERY ASSESSMENT CONFIGURATION
// ============================================================================

import { AssessmentConfig, Question, Section } from '@/types/assessments';

export const systemsAuditDiscoveryConfig: AssessmentConfig = {
  id: 'sa_discovery',
  name: 'Systems Audit - Discovery',
  description: 'Help us understand your current operational state',
  estimatedMinutes: 15,
  totalQuestions: 22,
  aiAnchors: 8,
  
  sections: [
    // =========================================================================
    // SECTION 1: CURRENT PAIN
    // =========================================================================
    {
      id: 'current_pain',
      title: 'Current Pain',
      description: 'Understanding what brought you here',
      questions: [
        {
          id: 'q1_1',
          field: 'systems_breaking_point',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'What broke – or is about to break – that made you think about systems?',
          placeholder: 'Be specific – the incident, the near-miss, the frustration that tipped you over...',
          maxLength: 400,
        },
        {
          id: 'q1_2',
          field: 'operations_self_diagnosis',
          type: 'single_choice',
          required: true,
          label: 'How would you describe your current operations?',
          options: [
            { value: 'controlled_chaos', label: 'Controlled chaos – it works but I can\'t explain how' },
            { value: 'manual_heroics', label: 'Manual heroics – we survive on people\'s goodwill' },
            { value: 'death_by_spreadsheet', label: 'Death by spreadsheet – everything\'s tracked but nothing connects' },
            { value: 'tech_frankenstein', label: 'Tech Frankenstein – we\'ve bolted tools together over years' },
            { value: 'actually_good', label: 'Actually pretty good – we just need optimisation' },
          ],
        },
        {
          id: 'q1_3',
          field: 'month_end_shame',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'If I followed you through a typical month-end, what would embarrass you most?',
          placeholder: 'The workaround you\'re ashamed of, the process you\'d never show an investor...',
          maxLength: 800,
        },
      ],
    },
    
    // =========================================================================
    // SECTION 2: IMPACT QUANTIFICATION
    // =========================================================================
    {
      id: 'impact_quantification',
      title: 'Impact Quantification',
      description: 'Understanding the cost of current state',
      questions: [
        {
          id: 'q2_1',
          field: 'manual_hours_monthly',
          type: 'single_choice',
          required: true,
          label: 'How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?',
          options: [
            { value: 'under_10', label: 'Under 10 hours' },
            { value: '10_20', label: '10-20 hours' },
            { value: '20_40', label: '20-40 hours' },
            { value: '40_80', label: '40-80 hours' },
            { value: 'over_80', label: 'More than 80 hours' },
          ],
        },
        {
          id: 'q2_2',
          field: 'month_end_close_duration',
          type: 'single_choice',
          required: true,
          label: 'How long does your month-end close currently take?',
          options: [
            { value: '1_2_days', label: '1-2 days' },
            { value: '3_5_days', label: '3-5 days' },
            { value: '1_2_weeks', label: '1-2 weeks' },
            { value: '2_4_weeks', label: '2-4 weeks' },
            { value: 'ongoing', label: 'We don\'t really "close" – it\'s ongoing' },
          ],
        },
        {
          id: 'q2_3',
          field: 'data_error_frequency',
          type: 'single_choice',
          required: true,
          label: 'In the last year, how many times have you discovered data errors that affected a business decision?',
          options: [
            { value: 'never', label: 'Never – our data is solid' },
            { value: 'once_twice', label: 'Once or twice – minor issues' },
            { value: 'several', label: 'Several times – some costly' },
            { value: 'regularly', label: 'Regularly – I don\'t fully trust our numbers' },
            { value: 'dont_know', label: 'I don\'t know – which is the scary part' },
          ],
        },
        {
          id: 'q2_4',
          field: 'expensive_systems_mistake',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'What\'s the most expensive mistake caused by a systems/process gap in the last 2 years?',
          placeholder: 'Lost client, tax penalty, missed opportunity, overpayment...',
          maxLength: 800,
        },
        {
          id: 'q2_5',
          field: 'information_access_frequency',
          type: 'single_choice',
          required: true,
          label: 'How many times last month did someone ask for information and you couldn\'t get it within 5 minutes?',
          options: [
            { value: 'never', label: 'Never' },
            { value: '1_2_times', label: '1-2 times' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'daily', label: 'Daily' },
            { value: 'constantly', label: 'Constantly' },
          ],
        },
      ],
    },
    
    // =========================================================================
    // SECTION 3: TECH STACK
    // =========================================================================
    {
      id: 'tech_stack',
      title: 'Tech Stack',
      description: 'Quick overview of your tools (we\'ll go deeper in Stage 2)',
      questions: [
        {
          id: 'q3_1',
          field: 'software_tools_used',
          type: 'multiple_choice',
          required: true,
          label: 'Which software tools does your business use? (Select all that apply)',
          options: [
            { value: 'xero_qb_sage', label: 'Xero / QuickBooks / Sage (Accounting)' },
            { value: 'hubspot_sf_pipedrive', label: 'HubSpot / Salesforce / Pipedrive (CRM)' },
            { value: 'asana_trello_monday', label: 'Asana / Trello / Monday (Projects)' },
            { value: 'slack_teams', label: 'Slack / Teams (Communication)' },
            { value: 'stripe_gocardless', label: 'Stripe / GoCardless (Payments)' },
            { value: 'google_workspace', label: 'Google Workspace (Email, Docs)' },
            { value: 'microsoft_365', label: 'Microsoft 365' },
            { value: 'breathehr_charliehr', label: 'BreatheHR / CharlieHR (HR)' },
            { value: 'dext_receipt_bank', label: 'Dext / Receipt Bank (Expenses)' },
            { value: 'other', label: 'Other (we\'ll capture in Stage 2)' },
          ],
        },
        {
          id: 'q3_2',
          field: 'integration_rating',
          type: 'single_choice',
          required: true,
          label: 'How would you rate the integration between these systems?',
          options: [
            { value: 'seamless', label: 'Seamless – data flows automatically' },
            { value: 'partial', label: 'Partial – some connected, some manual' },
            { value: 'minimal', label: 'Minimal – mostly manual transfers' },
            { value: 'none', label: 'Non-existent – each system is an island' },
          ],
        },
        {
          id: 'q3_3',
          field: 'critical_spreadsheets',
          type: 'single_choice',
          required: true,
          label: 'How many spreadsheets are "critical" to running your business? (Be honest)',
          options: [
            { value: 'none', label: 'None – everything\'s in proper systems' },
            { value: '1_3', label: '1-3 key spreadsheets' },
            { value: '4_10', label: '4-10 spreadsheets' },
            { value: '10_20', label: '10-20 spreadsheets' },
            { value: 'lost_count', label: 'I\'ve lost count' },
          ],
        },
      ],
    },
    
    // =========================================================================
    // SECTION 4: FOCUS AREAS
    // =========================================================================
    {
      id: 'focus_areas',
      title: 'Focus Areas',
      description: 'Where should we dig deeper?',
      questions: [
        {
          id: 'q4_1',
          field: 'broken_areas',
          type: 'multiple_choice',
          required: true,
          maxSelections: 3,
          label: 'Which areas feel most broken right now? (Select top 3)',
          options: [
            // Finance & Reporting
            { value: 'financial_reporting', label: 'Financial reporting / management accounts', group: 'Finance & Reporting' },
            { value: 'month_end_close', label: 'Month-end close process', group: 'Finance & Reporting' },
            { value: 'cash_flow_visibility', label: 'Cash flow visibility', group: 'Finance & Reporting' },
            { value: 'budgeting_forecasting', label: 'Budgeting & forecasting', group: 'Finance & Reporting' },
            
            // Revenue & Cash Collection
            { value: 'invoicing_billing', label: 'Invoicing & billing', group: 'Revenue & Cash' },
            { value: 'payment_collection', label: 'Payment collection / debtor chasing', group: 'Revenue & Cash' },
            { value: 'quoting_proposals', label: 'Quoting & proposals', group: 'Revenue & Cash' },
            { value: 'contract_management', label: 'Contract management', group: 'Revenue & Cash' },
            
            // Spending & Suppliers
            { value: 'accounts_payable', label: 'Accounts payable (paying suppliers)', group: 'Spending' },
            { value: 'expense_management', label: 'Expense management', group: 'Spending' },
            { value: 'purchase_approvals', label: 'Purchase approvals', group: 'Spending' },
            { value: 'supplier_management', label: 'Supplier management', group: 'Spending' },
            
            // People & Payroll
            { value: 'payroll_processing', label: 'Payroll processing', group: 'People' },
            { value: 'holiday_absence', label: 'Holiday & absence management', group: 'People' },
            { value: 'time_tracking', label: 'Time tracking', group: 'People' },
            { value: 'onboarding_offboarding', label: 'Onboarding & offboarding', group: 'People' },
            { value: 'expense_claims', label: 'Expense claims', group: 'People' },
            
            // Operations & Delivery
            { value: 'project_management', label: 'Project management', group: 'Operations' },
            { value: 'resource_planning', label: 'Resource planning & capacity', group: 'Operations' },
            { value: 'client_communication', label: 'Client communication', group: 'Operations' },
            { value: 'inventory_stock', label: 'Inventory / stock management', group: 'Operations' },
            
            // Sales & Marketing
            { value: 'lead_management', label: 'Lead management', group: 'Sales & Marketing' },
            { value: 'crm_pipeline', label: 'CRM & pipeline', group: 'Sales & Marketing' },
            { value: 'marketing_tracking', label: 'Marketing tracking', group: 'Sales & Marketing' },
            { value: 'client_onboarding', label: 'Client onboarding', group: 'Sales & Marketing' },
            
            // Compliance & Admin
            { value: 'vat_tax_filings', label: 'VAT / tax filings', group: 'Compliance' },
            { value: 'statutory_compliance', label: 'Statutory compliance', group: 'Compliance' },
            { value: 'document_management', label: 'Document management', group: 'Compliance' },
            { value: 'general_admin', label: 'General admin burden', group: 'Compliance' },
          ],
        },
        {
          id: 'q4_2',
          field: 'magic_process_fix',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'If you could fix ONE process by magic, which would have the biggest impact?',
          placeholder: 'Describe the process and why fixing it would matter...',
          maxLength: 800,
        },
      ],
    },
    
    // =========================================================================
    // SECTION 5: YOUR VISION
    // =========================================================================
    {
      id: 'your_vision',
      title: 'Your Vision',
      description: 'What does "fixed" look like for your business?',
      questions: [
        {
          id: 'q5_1',
          field: 'desired_outcomes',
          type: 'multiple_choice',
          required: true,
          maxSelections: 3,
          label: 'What specific outcomes do you most want from fixing your systems?',
          options: [
            { value: 'client_profitability', label: 'Know which clients or jobs are actually profitable' },
            { value: 'cash_visibility', label: 'See our cash position and forecast without asking anyone' },
            { value: 'fast_month_end', label: 'Close month-end in under a week' },
            { value: 'fast_quoting', label: 'Get quotes and proposals out within 48 hours' },
            { value: 'pipeline_confidence', label: 'Track pipeline and forecast revenue with confidence' },
            { value: 'free_key_people', label: 'Free key people from manual admin and data entry' },
            { value: 'useful_mi', label: 'Get management information I actually use for decisions' },
            { value: 'smooth_onboarding', label: 'Onboard new team members without things falling apart' },
            { value: 'scale_without_admin', label: 'Scale the team without scaling the admin' },
            { value: 'proper_controls', label: 'Have proper controls so mistakes don\'t slip through' },
          ],
        },
        {
          id: 'q5_2',
          field: 'monday_morning_vision',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'When your systems are working properly, what does your Monday morning look like?',
          placeholder: 'What do you see when you open your laptop? What questions can you answer instantly? What meetings do you no longer need?',
          maxLength: 800,
        },
        {
          id: 'q5_3',
          field: 'time_freedom_priority',
          type: 'single_choice',
          required: true,
          aiAnchor: true,
          label: 'If you got 10+ hours a week back, what would you actually spend that time on?',
          options: [
            { value: 'client_work', label: 'Clients \u2014 the work I\'m actually good at' },
            { value: 'business_development', label: 'Business development \u2014 growing revenue' },
            { value: 'strategy', label: 'Strategy and planning \u2014 thinking about the future' },
            { value: 'team_management', label: 'Managing my team properly \u2014 not firefighting' },
            { value: 'life_outside', label: 'My life outside work \u2014 family, health, headspace' },
            { value: 'build_new', label: 'Building something new \u2014 products, services, ideas' },
          ],
        },
      ],
    },
    
    // =========================================================================
    // SECTION 6: READINESS
    // =========================================================================
    {
      id: 'readiness',
      title: 'Readiness',
      description: 'Understanding your capacity for change',
      questions: [
        {
          id: 'q6_1',
          field: 'change_appetite',
          type: 'single_choice',
          required: true,
          label: "What's your appetite for change right now?",
          options: [
            { value: 'urgent', label: 'Urgent – we need to fix this yesterday' },
            { value: 'ready', label: 'Ready – we\'ve budgeted time and money for this' },
            { value: 'cautious', label: 'Cautious – we want to improve but can\'t afford disruption' },
            { value: 'exploring', label: 'Exploring – just want to understand options' },
          ],
        },
        {
          id: 'q6_2',
          field: 'systems_fears',
          type: 'multiple_choice',
          required: true,
          aiAnchor: true,
          label: 'What\'s your biggest fear about tackling systems?',
          options: [
            { value: 'cost_spiral', label: 'Cost will spiral out of control' },
            { value: 'disruption', label: 'Implementation will disrupt operations' },
            { value: 'wont_work', label: 'We\'ll invest and it won\'t work' },
            { value: 'team_adoption', label: 'Team won\'t adopt new processes' },
            { value: 'consultant_dependency', label: 'We\'ll become dependent on consultants' },
            { value: 'complexity', label: 'It\'s too complex to know where to start' },
            { value: 'none', label: 'No major fears – just want to get on with it' },
          ],
        },
        {
          id: 'q6_3',
          field: 'internal_champion',
          type: 'single_choice',
          required: true,
          label: 'Who internally would champion this project?',
          options: [
            { value: 'founder', label: 'Me – the founder/owner' },
            { value: 'finance_manager', label: 'Finance manager/FD' },
            { value: 'operations_manager', label: 'Operations manager' },
            { value: 'office_manager', label: 'Office manager' },
            { value: 'it_lead', label: 'IT lead' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    
    // =========================================================================
    // SECTION 7: CONTEXT
    // =========================================================================
    {
      id: 'context',
      title: 'Context',
      description: 'Help us understand your scale and growth',
      questions: [
        {
          id: 'q7_1',
          field: 'team_size',
          type: 'number',
          required: true,
          label: 'How many people work in your business currently?',
          min: 1,
          max: 1000,
        },
        {
          id: 'q7_2',
          field: 'expected_team_size_12mo',
          type: 'number',
          required: true,
          label: 'How many people do you expect in 12 months?',
          min: 1,
          max: 2000,
        },
        {
          id: 'q7_3',
          field: 'revenue_band',
          type: 'single_choice',
          required: true,
          label: 'What\'s your annual revenue band?',
          options: [
            { value: 'under_250k', label: 'Under £250k' },
            { value: '250k_500k', label: '£250k - £500k' },
            { value: '500k_1m', label: '£500k - £1m' },
            { value: '1m_2m', label: '£1m - £2m' },
            { value: '2m_5m', label: '£2m - £5m' },
            { value: '5m_10m', label: '£5m - £10m' },
            { value: 'over_10m', label: '£10m+' },
          ],
        },
        {
          id: 'q7_4',
          field: 'industry_sector',
          type: 'free_text',
          required: true,
          label: 'What industry are you in?',
          placeholder: 'e.g., Professional services, Manufacturing, Retail, Tech...',
          maxLength: 100,
        },
      ],
    },
  ],
};

