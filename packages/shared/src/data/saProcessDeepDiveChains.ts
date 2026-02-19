// ============================================================================
// SA PROCESS DEEP DIVE CHAINS - Single source of truth for Stage 3 questions
// Used by: client-portal ProcessDeepDivesPage, platform AssessmentPreviewPage
// ============================================================================


// Types and configs below
export interface DeepDiveQuestion {
  id: string;
  field: string;
  question: string;
  type: 'text' | 'select' | 'multi_select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  aiAnchor?: boolean;
  required?: boolean;
}

export interface ProcessChainConfig {
  code: string;
  name: string;
  description: string;
  estimatedMins: number;
  sections: {
    name: string;
    questions: DeepDiveQuestion[];
  }[];
}

// Quote-to-Cash Configuration
const quoteToCashConfig: ProcessChainConfig = {
  code: 'quote_to_cash',
  name: 'Quote-to-Cash (Revenue)',
  description: 'From lead to cash collected',
  estimatedMins: 15,
  sections: [
    {
      name: 'Quoting & Proposals',
      questions: [
        {
          id: 'qtc_quote_creation',
          field: 'quote_creation_method',
          question: 'How do you currently create quotes/proposals?',
          type: 'select',
          options: [
            { value: 'dedicated_tool', label: 'Dedicated tool (PandaDoc, Qwilr, etc.)' },
            { value: 'word_template', label: 'Word/Google Doc template' },
            { value: 'pdf_template', label: 'PDF template' },
            { value: 'from_scratch', label: 'From scratch each time' },
            { value: 'accounting_software', label: 'Within accounting software' },
          ],
        },
        {
          id: 'qtc_quote_authority',
          field: 'quote_authority',
          question: 'Who is authorised to send quotes?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'qtc_quote_time',
          field: 'quote_time_mins',
          question: 'How long does it take to produce a typical quote?',
          type: 'text',
          placeholder: 'e.g., 180 minutes — or describe: 3 hours average, sometimes a full day for big ones',
        },
        {
          id: 'qtc_pricing',
          field: 'pricing_approach',
          question: 'Do you have standard pricing or is everything custom?',
          type: 'select',
          options: [
            { value: 'fixed_rate_card', label: 'Fixed rate card' },
            { value: 'mostly_standard', label: 'Mostly standard with some customisation' },
            { value: 'project_based', label: 'Project-based estimates each time' },
            { value: 'fully_custom', label: 'Fully custom every time' },
          ],
        },
        {
          id: 'qtc_quote_tracking',
          field: 'quote_tracking',
          question: 'How do you track quote status? (Sent, viewed, accepted, rejected)',
          type: 'text',
        },
        {
          id: 'qtc_conversion',
          field: 'quote_conversion',
          question: 'What\'s your quote-to-win conversion rate?',
          type: 'text',
          placeholder: 'e.g., ~40% — or describe how it varies and what affects it',
        },
        {
          id: 'qtc_quote_pain',
          field: 'quote_pain',
          question: 'Biggest frustration with the quoting process?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'qtc_lost_deals',
          field: 'lost_deal_tracking',
          question: 'What happens to leads that don\'t convert? Do you track why you lost them?',
          type: 'text',
          placeholder: 'e.g., We don\'t track it at all / We log reasons in CRM / Sophie reviews lost deals quarterly',
        },
        {
          id: 'qtc_pricing_process',
          field: 'pricing_decision_process',
          question: 'How do you decide pricing for a new project? Who\'s involved?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'qtc_quote_backup',
          field: 'quote_backup_capability',
          question: 'Can anyone other than the usual person generate a proposal in an emergency?',
          type: 'select',
          options: [
            { value: 'yes_multiple', label: 'Yes — several people can' },
            { value: 'yes_one_backup', label: 'Yes — one backup person' },
            { value: 'no_single_point', label: 'No — only one person can do it' },
            { value: 'templates_help', label: 'Templates exist but nobody else has done it' },
          ],
        },
      ],
    },
    {
      name: 'Invoicing',
      questions: [
        {
          id: 'qtc_invoice_raiser',
          field: 'invoice_raiser',
          question: 'Who raises invoices?',
          type: 'text',
        },
        {
          id: 'qtc_invoice_trigger',
          field: 'invoice_trigger',
          question: 'What triggers an invoice?',
          type: 'multi_select',
          options: [
            { value: 'time_based', label: 'Time-based (end of month)' },
            { value: 'milestone', label: 'Project milestone' },
            { value: 'completion', label: 'Work completion' },
            { value: 'recurring', label: 'Recurring schedule' },
            { value: 'manual', label: 'Manual decision' },
          ],
        },
        {
          id: 'qtc_invoice_creation',
          field: 'invoice_creation',
          question: 'How are invoices created?',
          type: 'select',
          options: [
            { value: 'accounting_software', label: 'In accounting software (Xero, QBO)' },
            { value: 'word_excel', label: 'Word/Excel template' },
            { value: 'crm_integration', label: 'Auto-generated from CRM' },
            { value: 'project_tool', label: 'From project management tool' },
          ],
        },
        {
          id: 'qtc_invoice_approval',
          field: 'invoice_approval',
          question: 'Who approves invoices before sending?',
          type: 'text',
        },
        {
          id: 'qtc_invoice_delivery',
          field: 'invoice_delivery',
          question: 'How are invoices sent?',
          type: 'multi_select',
          options: [
            { value: 'email_manual', label: 'Email - manually' },
            { value: 'email_auto', label: 'Email - automated from system' },
            { value: 'portal', label: 'Client portal' },
            { value: 'post', label: 'Post' },
          ],
        },
        {
          id: 'qtc_invoice_lag',
          field: 'invoice_lag_days',
          question: 'How long from work complete to invoice sent?',
          type: 'text',
          placeholder: 'e.g., 5–7 days — or describe the process and any bottlenecks',
        },
        {
          id: 'qtc_invoice_volume',
          field: 'invoice_volume_monthly',
          question: 'How many invoices per month?',
          type: 'text',
          placeholder: 'e.g., ~50 — or describe volume and peaks',
        },
        {
          id: 'qtc_invoice_pain',
          field: 'invoice_pain',
          question: 'Biggest frustration with invoicing?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Payment Collection',
      questions: [
        {
          id: 'qtc_payment_terms',
          field: 'payment_terms',
          question: 'Standard payment terms?',
          type: 'select',
          options: [
            { value: 'immediate', label: 'Due on receipt' },
            { value: '7_days', label: '7 days' },
            { value: '14_days', label: '14 days' },
            { value: '30_days', label: '30 days' },
            { value: '60_days', label: '60 days' },
            { value: 'varies', label: 'Varies by client' },
          ],
        },
        {
          id: 'qtc_payment_methods',
          field: 'payment_methods',
          question: 'What payment methods do you accept?',
          type: 'multi_select',
          options: [
            { value: 'bank_transfer', label: 'Bank transfer' },
            { value: 'direct_debit', label: 'Direct Debit (GoCardless)' },
            { value: 'card', label: 'Card payment' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'cash', label: 'Cash' },
          ],
        },
        {
          id: 'qtc_reminder_automation',
          field: 'reminder_automation',
          question: 'Do you use automated payment reminders?',
          type: 'select',
          options: [
            { value: 'fully_automated', label: 'Yes - fully automated' },
            { value: 'semi_automated', label: 'Semi-automated (triggered manually)' },
            { value: 'manual', label: 'No - all manual' },
            { value: 'none', label: 'We don\'t send reminders' },
          ],
        },
        {
          id: 'qtc_debt_chaser',
          field: 'debt_chaser',
          question: 'Who chases overdue invoices?',
          type: 'text',
        },
        {
          id: 'qtc_escalation',
          field: 'escalation_threshold_days',
          question: 'At what age (days overdue) do you escalate?',
          type: 'text',
          placeholder: 'e.g., 30 days — or describe your escalation steps',
        },
        {
          id: 'qtc_debt_collection',
          field: 'debt_collection_used',
          question: 'Do you use debt collection services?',
          type: 'select',
          options: [
            { value: 'yes_regularly', label: 'Yes - regularly' },
            { value: 'yes_rarely', label: 'Yes - rarely' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'qtc_bad_debt',
          field: 'bad_debt_policy',
          question: 'Bad debt write-off policy? (age/amount threshold)',
          type: 'text',
        },
        {
          id: 'qtc_debtor_days',
          field: 'current_debtor_days',
          question: 'Current debtor days? (if known)',
          type: 'text',
          placeholder: 'e.g., 45 — or describe how you track and what you see',
        },
        {
          id: 'qtc_collection_pain',
          field: 'collection_pain',
          question: 'Biggest frustration with getting paid?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'qtc_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run this entire quote-to-cash process, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Procure-to-Pay Configuration (simplified - full version would include all questions)
const procureToPayConfig: ProcessChainConfig = {
  code: 'procure_to_pay',
  name: 'Procure-to-Pay (Spending)',
  description: 'From need to payment',
  estimatedMins: 15,
  sections: [
    {
      name: 'Purchasing & Approval',
      questions: [
        {
          id: 'ptp_spend_authority',
          field: 'spend_authority',
          question: 'Who can commit business spend?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptp_approval_limits',
          field: 'approval_limits',
          question: 'Are there approval limits? (e.g., over £X needs sign-off)',
          type: 'text',
        },
        {
          id: 'ptp_po_used',
          field: 'po_used',
          question: 'Do you raise purchase orders?',
          type: 'select',
          options: [
            { value: 'always', label: 'Yes - always' },
            { value: 'over_threshold', label: 'Yes - over a certain value' },
            { value: 'rarely', label: 'Rarely' },
            { value: 'never', label: 'Never' },
          ],
        },
        {
          id: 'ptp_po_process',
          field: 'po_process',
          question: 'How are POs created and tracked?',
          type: 'text',
        },
        {
          id: 'ptp_goods_received',
          field: 'goods_received_tracking',
          question: 'How do you track what\'s been ordered vs received?',
          type: 'text',
        },
        {
          id: 'ptp_purchasing_pain',
          field: 'purchasing_pain',
          question: 'Biggest frustration with buying things?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Supplier Invoices',
      questions: [
        {
          id: 'ptp_ap_receipt',
          field: 'ap_invoice_receipt',
          question: 'How do supplier invoices arrive?',
          type: 'multi_select',
          options: [
            { value: 'email', label: 'Email' },
            { value: 'post', label: 'Post' },
            { value: 'portal', label: 'Supplier portal' },
            { value: 'app', label: 'Via app (Dext, etc.)' },
          ],
        },
        {
          id: 'ptp_ap_processor',
          field: 'ap_processor',
          question: 'Who processes supplier invoices?',
          type: 'text',
        },
        {
          id: 'ptp_three_way',
          field: 'three_way_match',
          question: 'Do you match invoices to POs/delivery notes?',
          type: 'select',
          options: [
            { value: 'always', label: 'Yes - always' },
            { value: 'sometimes', label: 'Sometimes' },
            { value: 'never', label: 'No' },
          ],
        },
        {
          id: 'ptp_ap_storage',
          field: 'ap_invoice_storage',
          question: 'Where are invoices stored/filed?',
          type: 'text',
        },
        {
          id: 'ptp_supplier_query',
          field: 'supplier_query_process',
          question: 'How do you handle queries with suppliers?',
          type: 'text',
        },
        {
          id: 'ptp_ap_volume',
          field: 'ap_volume_monthly',
          question: 'Invoices processed per month?',
          type: 'text',
          placeholder: 'e.g., ~120 — or describe volume and how it\'s handled',
        },
        {
          id: 'ptp_ap_pain',
          field: 'ap_pain',
          question: 'Biggest frustration with supplier invoices?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Payments',
      questions: [
        {
          id: 'ptp_payment_frequency',
          field: 'payment_run_frequency',
          question: 'How often do you run payment runs?',
          type: 'select',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'fortnightly', label: 'Fortnightly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'ad_hoc', label: 'Ad-hoc' },
          ],
        },
        {
          id: 'ptp_payment_auth',
          field: 'payment_authoriser',
          question: 'Who authorises payments?',
          type: 'text',
        },
        {
          id: 'ptp_payment_method',
          field: 'payment_method',
          question: 'How are payments made?',
          type: 'multi_select',
          options: [
            { value: 'bacs', label: 'BACS' },
            { value: 'faster_payments', label: 'Faster Payments' },
            { value: 'direct_debit', label: 'Direct Debit' },
            { value: 'card', label: 'Company card' },
            { value: 'cheque', label: 'Cheque' },
          ],
        },
        {
          id: 'ptp_early_payment',
          field: 'early_payment_discounts',
          question: 'Do you take advantage of early payment discounts?',
          type: 'select',
          options: [
            { value: 'yes_actively', label: 'Yes - actively managed' },
            { value: 'sometimes', label: 'Sometimes - if we notice' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'ptp_payment_pain',
          field: 'payment_pain',
          question: 'Biggest frustration with paying suppliers?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptp_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run this entire procure-to-pay process, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Hire-to-Retire Configuration (simplified)
const hireToRetireConfig: ProcessChainConfig = {
  code: 'hire_to_retire',
  name: 'Hire-to-Retire (People)',
  description: 'Full employee lifecycle',
  estimatedMins: 25,
  sections: [
    {
      name: 'Time & Attendance',
      questions: [
        {
          id: 'htr_time_method',
          field: 'time_tracking_method',
          question: 'How do staff record hours worked?',
          type: 'select',
          options: [
            { value: 'dedicated_tool', label: 'Dedicated time tracking tool' },
            { value: 'spreadsheet', label: 'Spreadsheet/timesheet' },
            { value: 'clock_in', label: 'Clock in/out system' },
            { value: 'honour', label: 'Honour system (contracted hours)' },
            { value: 'project_tool', label: 'Within project management tool' },
          ],
        },
        {
          id: 'htr_time_projects',
          field: 'time_to_projects',
          question: 'Is time tracked to projects/clients?',
          type: 'select',
          options: [
            { value: 'yes_required', label: 'Yes - required' },
            { value: 'yes_optional', label: 'Yes - optional' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'htr_timesheet_approver',
          field: 'timesheet_approver',
          question: 'Who reviews/approves timesheets?',
          type: 'text',
        },
        {
          id: 'htr_overtime',
          field: 'overtime_process',
          question: 'How is overtime calculated and approved?',
          type: 'text',
        },
        {
          id: 'htr_time_pain',
          field: 'time_tracking_pain',
          question: 'Biggest frustration with time tracking?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Holiday & Absence',
      questions: [
        {
          id: 'htr_holiday_method',
          field: 'holiday_request_method',
          question: 'How do staff request holiday?',
          type: 'select',
          options: [
            { value: 'hr_system', label: 'HR system (BreatheHR, etc.)' },
            { value: 'email', label: 'Email' },
            { value: 'form', label: 'Paper/digital form' },
            { value: 'slack_teams', label: 'Slack/Teams message' },
            { value: 'shared_calendar', label: 'Shared calendar' },
          ],
        },
        {
          id: 'htr_holiday_approver',
          field: 'holiday_approver',
          question: 'Who approves holiday?',
          type: 'text',
        },
        {
          id: 'htr_entitlement',
          field: 'entitlement_tracking',
          question: 'How do you track remaining entitlement?',
          type: 'text',
        },
        {
          id: 'htr_sickness',
          field: 'sickness_recording',
          question: 'How is sickness absence recorded?',
          type: 'text',
        },
        {
          id: 'htr_patterns',
          field: 'absence_pattern_tracking',
          question: 'Do you track absence patterns? (e.g., repeat Mondays)',
          type: 'select',
          options: [
            { value: 'yes_automated', label: 'Yes - system alerts us' },
            { value: 'yes_manual', label: 'Yes - manually reviewed' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'htr_leave_pain',
          field: 'leave_pain',
          question: 'Biggest frustration with leave management?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Expense Claims',
      questions: [
        {
          id: 'htr_expense_submission',
          field: 'expense_submission',
          question: 'How do staff submit expenses?',
          type: 'select',
          options: [
            { value: 'app', label: 'Expense app (Pleo, Expensify, Dext)' },
            { value: 'spreadsheet', label: 'Spreadsheet' },
            { value: 'paper', label: 'Paper form' },
            { value: 'email', label: 'Email receipts' },
          ],
        },
        {
          id: 'htr_receipt_capture',
          field: 'receipt_capture',
          question: 'How are receipts captured?',
          type: 'text',
        },
        {
          id: 'htr_expense_approver',
          field: 'expense_approver',
          question: 'Who approves expenses?',
          type: 'text',
        },
        {
          id: 'htr_reimbursement',
          field: 'reimbursement_time',
          question: 'How quickly are staff reimbursed?',
          type: 'select',
          options: [
            { value: 'same_week', label: 'Same week' },
            { value: 'next_payroll', label: 'Next payroll' },
            { value: 'month_end', label: 'End of month' },
            { value: 'variable', label: 'Variable' },
          ],
        },
        {
          id: 'htr_expense_policy',
          field: 'expense_policy_exists',
          question: 'Is there a documented expense policy?',
          type: 'select',
          options: [
            { value: 'yes_enforced', label: 'Yes - and it\'s enforced' },
            { value: 'yes_loosely', label: 'Yes - but loosely followed' },
            { value: 'no', label: 'No formal policy' },
          ],
        },
        {
          id: 'htr_expense_pain',
          field: 'expense_pain',
          question: 'Biggest frustration with expenses?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Payroll Processing',
      questions: [
        {
          id: 'htr_payroll_preparer',
          field: 'payroll_preparer',
          question: 'Who prepares payroll each month?',
          type: 'text',
        },
        {
          id: 'htr_payroll_inputs',
          field: 'payroll_inputs',
          question: 'What inputs are needed? (hours, overtime, expenses, adjustments)',
          type: 'text',
        },
        {
          id: 'htr_payroll_cutoff',
          field: 'payroll_cutoff',
          question: 'Payroll cut-off date?',
          type: 'text',
        },
        {
          id: 'htr_payroll_reviewer',
          field: 'payroll_reviewer',
          question: 'Who reviews before processing?',
          type: 'text',
        },
        {
          id: 'htr_payslip',
          field: 'payslip_distribution',
          question: 'How are payslips distributed?',
          type: 'select',
          options: [
            { value: 'portal', label: 'Online portal' },
            { value: 'email', label: 'Email' },
            { value: 'paper', label: 'Paper' },
          ],
        },
        {
          id: 'htr_staff_payment',
          field: 'staff_payment_method',
          question: 'How are staff paid?',
          type: 'select',
          options: [
            { value: 'bacs', label: 'BACS' },
            { value: 'faster_payments', label: 'Faster Payments' },
            { value: 'cheque', label: 'Cheque' },
          ],
        },
        {
          id: 'htr_hmrc',
          field: 'hmrc_payment_method',
          question: 'HMRC payment - manual or DD?',
          type: 'select',
          options: [
            { value: 'direct_debit', label: 'Direct Debit' },
            { value: 'manual', label: 'Manual payment' },
          ],
        },
        {
          id: 'htr_pension',
          field: 'pension_submission',
          question: 'Pension submissions - automated?',
          type: 'select',
          options: [
            { value: 'fully_automated', label: 'Fully automated' },
            { value: 'semi_automated', label: 'Semi-automated' },
            { value: 'manual', label: 'Manual' },
          ],
        },
        {
          id: 'htr_employee_count',
          field: 'employee_count',
          question: 'Number of employees on payroll?',
          type: 'text',
          placeholder: 'e.g., 25 — or describe (FTE, contractors, seasonal)',
        },
        {
          id: 'htr_payroll_pain',
          field: 'payroll_pain',
          question: 'Biggest frustration with payroll?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Onboarding & Offboarding',
      questions: [
        {
          id: 'htr_new_starter_systems',
          field: 'new_starter_system_setup',
          question: 'When a new person joins, what systems need to be set up for them?',
          type: 'text',
          placeholder: 'List the systems and who sets them up. e.g., Email (IT), Slack (manager), Harvest (Priya), Monday (self-serve)...',
        },
        {
          id: 'htr_time_to_productive',
          field: 'time_to_productive',
          question: 'How long until a new hire is fully productive? What slows them down?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'e.g., 2–3 months. Biggest blocker is nobody documents how we use Monday. They just shadow someone.',
        },
        {
          id: 'htr_onboarding_owner',
          field: 'onboarding_checklist_owner',
          question: 'Who owns the employee onboarding checklist (if one exists)?',
          type: 'text',
        },
        {
          id: 'htr_offboarding',
          field: 'offboarding_process',
          question: 'When someone leaves, how do you ensure data handover and access removal?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'e.g., Ad hoc — manager handles it / We have a checklist / IT removes access, manager handles handover / No formal process',
        },
        {
          id: 'htr_contractor_access',
          field: 'contractor_access_handling',
          question: 'How do you handle contractor/freelancer access differently from employees?',
          type: 'select',
          options: [
            { value: 'same_access', label: 'Same access as employees' },
            { value: 'limited_access', label: 'Limited access — specific systems only' },
            { value: 'no_system_access', label: 'No system access — they use their own tools' },
            { value: 'varies', label: 'Varies — no consistent approach' },
          ],
        },
        {
          id: 'htr_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run this entire people process, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Record-to-Report Configuration (simplified)
const recordToReportConfig: ProcessChainConfig = {
  code: 'record_to_report',
  name: 'Record-to-Report (Finance)',
  description: 'From transaction to insight',
  estimatedMins: 15,
  sections: [
    {
      name: 'Transaction Processing',
      questions: [
        {
          id: 'rtr_entry_who',
          field: 'transaction_entry_who',
          question: 'Who enters transactions into the accounting system?',
          type: 'text',
        },
        {
          id: 'rtr_coding',
          field: 'coding_method',
          question: 'How are transactions coded?',
          type: 'select',
          options: [
            { value: 'bank_rules', label: 'Bank rules (auto-categorisation)' },
            { value: 'preset_rules', label: 'Preset rules in accounting system' },
            { value: 'manual', label: 'Manual each time' },
            { value: 'mixed', label: 'Mix of automated and manual' },
          ],
        },
        {
          id: 'rtr_tracking',
          field: 'tracking_categories_used',
          question: 'Do you use tracking categories/classes?',
          type: 'select',
          options: [
            { value: 'yes_extensively', label: 'Yes - extensively' },
            { value: 'yes_basic', label: 'Yes - basic (department/location)' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'rtr_bank_rec_freq',
          field: 'bank_rec_frequency',
          question: 'How often is bank reconciliation done?',
          type: 'select',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'rarely', label: 'Rarely / when we remember' },
          ],
        },
        {
          id: 'rtr_bank_rec_who',
          field: 'bank_rec_who',
          question: 'Who does bank reconciliation?',
          type: 'text',
        },
        {
          id: 'rtr_transaction_volume',
          field: 'transaction_volume',
          question: 'Average transactions per month?',
          type: 'text',
          placeholder: 'e.g., 500 — or describe volume and mix',
        },
        {
          id: 'rtr_bookkeeping_pain',
          field: 'bookkeeping_pain',
          question: 'Biggest frustration with day-to-day bookkeeping?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Month-End',
      questions: [
        {
          id: 'rtr_checklist',
          field: 'month_end_checklist',
          question: 'Do you have a documented month-end checklist?',
          type: 'select',
          options: [
            { value: 'yes_followed', label: 'Yes - followed consistently' },
            { value: 'yes_loosely', label: 'Yes - but loosely followed' },
            { value: 'no', label: 'No formal checklist' },
          ],
        },
        {
          id: 'rtr_accruals',
          field: 'accruals_process',
          question: 'How do you handle accruals and prepayments?',
          type: 'text',
        },
        {
          id: 'rtr_journals',
          field: 'journal_templates',
          question: 'Standard journals - templated or recreated each month?',
          type: 'select',
          options: [
            { value: 'templated', label: 'Templated / recurring' },
            { value: 'recreated', label: 'Recreated each month' },
            { value: 'varies', label: 'Varies' },
          ],
        },
        {
          id: 'rtr_close_reviewer',
          field: 'close_reviewer',
          question: 'Who reviews before close?',
          type: 'text',
        },
        {
          id: 'rtr_close_duration',
          field: 'close_duration_days',
          question: 'How long does month-end take currently?',
          type: 'text',
          placeholder: 'e.g., 10 working days — or describe the process and bottlenecks',
        },
        {
          id: 'rtr_close_target',
          field: 'close_target_days',
          question: 'What\'s the target for month-end close?',
          type: 'text',
          placeholder: 'e.g., 5 working days — or describe target and blockers',
        },
        {
          id: 'rtr_month_end_pain',
          field: 'month_end_pain',
          question: 'Biggest frustration with month-end?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Reporting',
      questions: [
        {
          id: 'rtr_ma_preparer',
          field: 'ma_preparer',
          question: 'Who prepares management accounts?',
          type: 'text',
        },
        {
          id: 'rtr_reports',
          field: 'reports_produced',
          question: 'What reports are produced?',
          type: 'multi_select',
          options: [
            { value: 'pnl', label: 'P&L' },
            { value: 'balance_sheet', label: 'Balance Sheet' },
            { value: 'cash_flow', label: 'Cash Flow' },
            { value: 'kpis', label: 'KPI Dashboard' },
            { value: 'aged_debtors', label: 'Aged Debtors' },
            { value: 'aged_creditors', label: 'Aged Creditors' },
            { value: 'budget_vs_actual', label: 'Budget vs Actual' },
          ],
        },
        {
          id: 'rtr_recipients',
          field: 'report_recipients',
          question: 'Who receives management reports?',
          type: 'text',
        },
        {
          id: 'rtr_delivery',
          field: 'report_delivery',
          question: 'How are reports delivered?',
          type: 'select',
          options: [
            { value: 'email', label: 'Email' },
            { value: 'portal', label: 'Client/board portal' },
            { value: 'meeting', label: 'Presented in meeting' },
            { value: 'shared_drive', label: 'Shared drive' },
          ],
        },
        {
          id: 'rtr_board_pack',
          field: 'board_pack_contents',
          question: 'Do you have a board pack? What\'s in it?',
          type: 'text',
        },
        {
          id: 'rtr_reporting_lag',
          field: 'reporting_lag_days',
          question: 'How many working days from month-end to reports delivered?',
          type: 'text',
          placeholder: 'e.g., 15 days — or describe the lag and why',
        },
        {
          id: 'rtr_budget_comparison',
          field: 'budget_comparison',
          question: 'Do you compare to budget?',
          type: 'select',
          options: [
            { value: 'yes_monthly', label: 'Yes - monthly' },
            { value: 'yes_quarterly', label: 'Yes - quarterly' },
            { value: 'rarely', label: 'Rarely' },
            { value: 'no_budget', label: 'No budget exists' },
          ],
        },
        {
          id: 'rtr_reporting_pain',
          field: 'reporting_pain',
          question: 'Biggest frustration with reporting?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'rtr_ma_answers',
          field: 'ma_questions_answered',
          question: 'What questions can your management accounts answer today?',
          type: 'text',
          placeholder: 'e.g., Revenue by month, P&L by department, aged debtors...',
        },
        {
          id: 'rtr_ma_gaps',
          field: 'ma_questions_unanswered',
          question: 'What questions can they NOT answer that you wish they could?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'e.g., Profitability by client, project margin, cash forecast, utilisation rate...',
        },
        {
          id: 'rtr_report_readers',
          field: 'report_actual_readers',
          question: 'Who actually reads the management reports? What do they do with them?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'rtr_budget_status',
          field: 'budget_current_status',
          question: 'Do you have a budget? When was it last updated?',
          type: 'text',
          placeholder: 'e.g., Yes from Jan 2025 / No formal budget / We set one annually but never revisit it',
        },
        {
          id: 'rtr_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run this entire finance process, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Lead-to-Client Configuration (simplified)
const leadToClientConfig: ProcessChainConfig = {
  code: 'lead_to_client',
  name: 'Lead-to-Client (Sales & Marketing)',
  description: 'From stranger to customer',
  estimatedMins: 15,
  sections: [
    {
      name: 'Lead Management',
      questions: [
        {
          id: 'ltc_sources',
          field: 'lead_sources',
          question: 'Where do most leads come from?',
          type: 'multi_select',
          options: [
            { value: 'website', label: 'Website' },
            { value: 'referral', label: 'Referrals' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'events', label: 'Events/networking' },
            { value: 'paid_ads', label: 'Paid advertising' },
            { value: 'cold_outreach', label: 'Cold outreach' },
            { value: 'partnerships', label: 'Partnerships' },
          ],
        },
        {
          id: 'ltc_capture',
          field: 'lead_capture_method',
          question: 'How are leads captured?',
          type: 'text',
        },
        {
          id: 'ltc_destination',
          field: 'lead_destination',
          question: 'Where do leads go first?',
          type: 'select',
          options: [
            { value: 'crm', label: 'CRM' },
            { value: 'spreadsheet', label: 'Spreadsheet' },
            { value: 'email', label: 'Email inbox' },
            { value: 'slack_teams', label: 'Slack/Teams channel' },
            { value: 'none', label: 'No central location' },
          ],
        },
        {
          id: 'ltc_qualifier',
          field: 'lead_qualifier',
          question: 'Who qualifies leads?',
          type: 'text',
        },
        {
          id: 'ltc_criteria',
          field: 'qualification_criteria',
          question: 'What makes a lead "qualified"?',
          type: 'text',
        },
        {
          id: 'ltc_response_time',
          field: 'lead_response_time',
          question: 'How quickly are leads followed up?',
          type: 'select',
          options: [
            { value: 'same_day', label: 'Same day' },
            { value: '1_2_days', label: '1-2 days' },
            { value: 'within_week', label: 'Within a week' },
            { value: 'variable', label: 'Variable' },
            { value: 'often_missed', label: 'Often missed' },
          ],
        },
        {
          id: 'ltc_lead_pain',
          field: 'lead_pain',
          question: 'Biggest frustration with lead management?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Pipeline & CRM',
      questions: [
        {
          id: 'ltc_stages',
          field: 'sales_stages_defined',
          question: 'Do you have defined sales stages?',
          type: 'select',
          options: [
            { value: 'yes_clear', label: 'Yes - clear and followed' },
            { value: 'yes_loose', label: 'Yes - but loosely defined' },
            { value: 'no', label: 'No formal stages' },
          ],
        },
        {
          id: 'ltc_pipeline_tracking',
          field: 'pipeline_tracking',
          question: 'How is pipeline tracked?',
          type: 'text',
        },
        {
          id: 'ltc_forecasting',
          field: 'revenue_forecasting',
          question: 'Do you forecast revenue? How?',
          type: 'text',
        },
        {
          id: 'ltc_crm_quality',
          field: 'crm_data_quality',
          question: 'CRM data quality rating?',
          type: 'text',
          placeholder: 'e.g., 3/5 — or describe what\'s good, what\'s missing, what\'s wrong',
        },
        {
          id: 'ltc_crm_pain',
          field: 'crm_pain',
          question: 'Biggest frustration with CRM?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ltc_client_satisfaction',
          field: 'client_satisfaction_tracking',
          question: 'How do you track client satisfaction after onboarding?',
          type: 'select',
          options: [
            { value: 'formal_surveys', label: 'Formal surveys / NPS' },
            { value: 'regular_reviews', label: 'Regular account reviews' },
            { value: 'informal', label: 'Informal — we just ask in conversation' },
            { value: 'reactive', label: 'Only when there\'s a problem' },
            { value: 'none', label: 'We don\'t systematically track it' },
          ],
        },
        {
          id: 'ltc_referral_process',
          field: 'referral_process',
          question: 'Do you have a systematic way to ask for referrals?',
          type: 'select',
          options: [
            { value: 'yes_formal', label: 'Yes — formal referral programme' },
            { value: 'yes_informal', label: 'Yes — we ask happy clients informally' },
            { value: 'no_organic', label: 'No — referrals just happen organically' },
            { value: 'no', label: 'No — we don\'t ask' },
          ],
        },
        {
          id: 'ltc_churn_signals',
          field: 'churn_risk_identification',
          question: 'How do you know when a client is at risk of leaving?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'e.g., We don\'t until they tell us / Account manager flags it / We track engagement metrics',
        },
        {
          id: 'ltc_retention_rate',
          field: 'client_retention_rate',
          question: 'What\'s your client retention rate? (estimate)',
          type: 'text',
          placeholder: 'e.g., ~85% year-on-year / We don\'t track it / Most clients stay 2–3 years',
        },
      ],
    },
    {
      name: 'Client Onboarding',
      questions: [
        {
          id: 'ltc_won_process',
          field: 'won_deal_process',
          question: 'What happens when a deal is won?',
          type: 'text',
        },
        {
          id: 'ltc_setup',
          field: 'client_setup_process',
          question: 'How is the client set up? (systems, files, access)',
          type: 'text',
        },
        {
          id: 'ltc_onboarding_owner',
          field: 'onboarding_owner',
          question: 'Who owns client onboarding?',
          type: 'text',
        },
        {
          id: 'ltc_checklist',
          field: 'onboarding_checklist',
          question: 'Do you have a standard onboarding checklist?',
          type: 'select',
          options: [
            { value: 'yes_detailed', label: 'Yes - detailed' },
            { value: 'yes_basic', label: 'Yes - basic' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'ltc_onboarding_duration',
          field: 'onboarding_duration',
          question: 'How long does onboarding typically take?',
          type: 'text',
        },
        {
          id: 'ltc_handoff',
          field: 'sales_delivery_handoff',
          question: 'Handoff from sales to delivery - how does it work?',
          type: 'text',
        },
        {
          id: 'ltc_onboarding_pain',
          field: 'onboarding_pain',
          question: 'Biggest frustration with client onboarding?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ltc_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run this entire sales-to-onboarding process, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Comply-to-Confirm Configuration (simplified)
const complyToConfirmConfig: ProcessChainConfig = {
  code: 'comply_to_confirm',
  name: 'Comply-to-Confirm (Regulatory)',
  description: 'From requirement to filed',
  estimatedMins: 10,
  sections: [
    {
      name: 'Compliance Management',
      questions: [
        {
          id: 'ctc_filings',
          field: 'compliance_filings',
          question: 'What compliance filings do you handle?',
          type: 'multi_select',
          options: [
            { value: 'vat', label: 'VAT returns' },
            { value: 'ct', label: 'Corporation Tax' },
            { value: 'paye', label: 'PAYE/RTI' },
            { value: 'cis', label: 'CIS' },
            { value: 'pensions', label: 'Pension contributions' },
            { value: 'confirmation_statement', label: 'Confirmation Statement' },
            { value: 'annual_accounts', label: 'Annual Accounts' },
            { value: 'other', label: 'Other regulatory filings' },
          ],
        },
        {
          id: 'ctc_deadline_tracking',
          field: 'deadline_tracking',
          question: 'How do you track compliance deadlines?',
          type: 'select',
          options: [
            { value: 'system', label: 'Dedicated compliance system' },
            { value: 'calendar', label: 'Calendar reminders' },
            { value: 'spreadsheet', label: 'Spreadsheet' },
            { value: 'memory', label: 'Memory / manual tracking' },
            { value: 'accountant', label: 'Outsourced to accountant' },
          ],
        },
        {
          id: 'ctc_responsibility',
          field: 'filing_responsibility',
          question: 'Who is responsible for each filing?',
          type: 'text',
        },
        {
          id: 'ctc_data_sources',
          field: 'filing_data_sources',
          question: 'Where does the data come from for filings?',
          type: 'text',
        },
        {
          id: 'ctc_mtd',
          field: 'mtd_automated',
          question: 'Do you use automated MTD submissions?',
          type: 'select',
          options: [
            { value: 'yes', label: 'Yes - fully automated' },
            { value: 'semi', label: 'Semi-automated' },
            { value: 'manual', label: 'Manual' },
            { value: 'outsourced', label: 'Outsourced' },
          ],
        },
        {
          id: 'ctc_missed',
          field: 'missed_deadline_history',
          question: 'Have you ever missed a compliance deadline?',
          type: 'select',
          options: [
            { value: 'never', label: 'Never' },
            { value: 'once', label: 'Once' },
            { value: 'occasionally', label: 'Occasionally' },
            { value: 'yes', label: 'Yes - and it was costly' },
          ],
        },
        {
          id: 'ctc_compliance_pain',
          field: 'compliance_pain',
          question: 'Biggest frustration with compliance?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ctc_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to handle compliance filings, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// Project-to-Delivery Configuration
const projectToDeliveryConfig: ProcessChainConfig = {
  code: 'project_to_delivery',
  name: 'Project-to-Delivery (Operations)',
  description: 'From signed deal to completed work',
  estimatedMins: 15,
  sections: [
    {
      name: 'Project Setup',
      questions: [
        {
          id: 'ptd_kickoff_process',
          field: 'kickoff_process',
          question: 'When a deal is signed, what happens next? Who does what?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'Walk us through the first 48 hours after a deal is signed...',
        },
        {
          id: 'ptd_system_setup',
          field: 'project_system_setup',
          question: 'How is the project set up in your systems? (boards, folders, time codes, etc.)',
          type: 'text',
          placeholder: 'e.g., PM creates Monday board from template, admin sets up Harvest project, creates Google Drive folder...',
        },
        {
          id: 'ptd_brief_handoff',
          field: 'brief_handoff_method',
          question: 'How does the brief get from the person who sold it to the team delivering it?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptd_handoff_losses',
          field: 'handoff_information_loss',
          question: 'What information gets lost or distorted in that handoff?',
          type: 'text',
          placeholder: 'e.g., Client expectations, budget constraints, timeline promises, scope boundaries...',
        },
      ],
    },
    {
      name: 'Resource Planning',
      questions: [
        {
          id: 'ptd_assignment',
          field: 'work_assignment_method',
          question: 'How do you decide who works on what?',
          type: 'text',
        },
        {
          id: 'ptd_capacity_visibility',
          field: 'capacity_visibility',
          question: 'Can you see team capacity/workload before assigning work?',
          type: 'select',
          options: [
            { value: 'yes_dashboard', label: 'Yes — clear dashboard or resource view' },
            { value: 'roughly', label: 'Roughly — we check calendars and ask around' },
            { value: 'gut_feel', label: 'Not really — gut feel and who seems least busy' },
            { value: 'no', label: 'No — we just assign and hope' },
          ],
        },
        {
          id: 'ptd_capacity_clashes',
          field: 'capacity_clash_handling',
          question: 'How do you handle capacity clashes when multiple projects need the same person?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptd_resource_tools',
          field: 'resource_planning_tools',
          question: 'Do you use any resource planning or scheduling tools?',
          type: 'text',
          placeholder: 'e.g., Monday.com workload view, Float, Forecast, spreadsheet, nothing...',
        },
        {
          id: 'ptd_resourcing_pain',
          field: 'resourcing_pain',
          question: 'Biggest frustration with resourcing?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
    {
      name: 'Tracking & Visibility',
      questions: [
        {
          id: 'ptd_progress_tracking',
          field: 'progress_tracking_method',
          question: 'How do you track project progress? (status updates, % complete, milestones)',
          type: 'text',
        },
        {
          id: 'ptd_budget_visibility',
          field: 'budget_overrun_detection',
          question: 'How do you know if a project is over budget before it\'s too late?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptd_portfolio_view',
          field: 'portfolio_visibility_who',
          question: 'Who has visibility of all active projects at once?',
          type: 'text',
        },
        {
          id: 'ptd_scope_creep',
          field: 'scope_creep_handling',
          question: 'How do you handle scope creep?',
          type: 'select',
          options: [
            { value: 'formal_cr', label: 'Formal change request process' },
            { value: 'track_no_pushback', label: 'We track it but rarely push back' },
            { value: 'absorb', label: 'We absorb it and lose money' },
            { value: 'no_tracking', label: 'We don\'t really track it' },
          ],
        },
        {
          id: 'ptd_rework_rate',
          field: 'rework_rate',
          question: 'How often does work need to be redone due to brief gaps or miscommunication?',
          type: 'text',
          aiAnchor: true,
          placeholder: 'e.g., Most projects have at least one round of rework. Major rework maybe 20% of projects...',
        },
      ],
    },
    {
      name: 'Completion & Review',
      questions: [
        {
          id: 'ptd_closeout',
          field: 'project_closeout_process',
          question: 'How do you close out a completed project? Is there a formal process?',
          type: 'text',
        },
        {
          id: 'ptd_retrospectives',
          field: 'retrospective_frequency',
          question: 'Do you run project retrospectives or reviews?',
          type: 'select',
          options: [
            { value: 'every_project', label: 'Yes — every project' },
            { value: 'big_only', label: 'Sometimes — big projects only' },
            { value: 'rarely', label: 'Rarely' },
            { value: 'never', label: 'Never' },
          ],
        },
        {
          id: 'ptd_lessons_learned',
          field: 'lessons_learned_capture',
          question: 'How do you capture lessons learned for next time?',
          type: 'text',
          placeholder: 'e.g., Retro notes in Notion, discussed in team meetings, not captured anywhere...',
        },
        {
          id: 'ptd_delivery_pain',
          field: 'delivery_pain',
          question: 'Biggest frustration with project delivery overall?',
          type: 'text',
          aiAnchor: true,
        },
        {
          id: 'ptd_process_documented',
          field: 'process_documentation_status',
          question: 'If a new person joined tomorrow and had to run a project end-to-end, could they? Is it documented anywhere?',
          type: 'select',
          options: [
            { value: 'yes_documented', label: 'Yes — well documented and they could follow it' },
            { value: 'partially', label: 'Partially — some notes exist but gaps' },
            { value: 'tribal', label: 'No — it\'s all in people\'s heads' },
            { value: 'chaos', label: 'No — and honestly even we struggle with it' },
          ],
          aiAnchor: true,
        },
      ],
    },
  ],
};

// All process chain configs
export const processChainConfigs: Record<string, ProcessChainConfig> = {
  quote_to_cash: quoteToCashConfig,
  procure_to_pay: procureToPayConfig,
  hire_to_retire: hireToRetireConfig,
  record_to_report: recordToReportConfig,
  lead_to_client: leadToClientConfig,
  comply_to_confirm: complyToConfirmConfig,
  project_to_delivery: projectToDeliveryConfig,
};
