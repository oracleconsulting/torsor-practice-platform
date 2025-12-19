// ============================================================================
// SYSTEMS AUDIT - STAGE 3 PROCESS DEEP DIVE CONFIGURATIONS
// ============================================================================

export interface DeepDiveQuestion {
  id: string;
  field: string;
  question: string;
  type: 'text' | 'select' | 'number' | 'multi_select';
  options?: { value: string; label: string }[];
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

// ============================================================================
// CHAIN 1: QUOTE-TO-CASH
// ============================================================================

export const quoteToCashConfig: ProcessChainConfig = {
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
          question: 'How long does it take to produce a typical quote? (minutes)',
          type: 'number',
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
          question: 'What\'s your quote-to-win conversion rate? (estimate %)',
          type: 'number',
        },
        {
          id: 'qtc_quote_pain',
          field: 'quote_pain',
          question: 'Biggest frustration with the quoting process?',
          type: 'text',
          aiAnchor: true,
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
          question: 'How long from work complete to invoice sent? (days)',
          type: 'number',
        },
        {
          id: 'qtc_invoice_volume',
          field: 'invoice_volume_monthly',
          question: 'How many invoices per month?',
          type: 'number',
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
          type: 'number',
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
          type: 'number',
        },
        {
          id: 'qtc_collection_pain',
          field: 'collection_pain',
          question: 'Biggest frustration with getting paid?',
          type: 'text',
          aiAnchor: true,
        },
      ],
    },
  ],
};

// ============================================================================
// CHAIN 2: PROCURE-TO-PAY
// ============================================================================

export const procureToPayConfig: ProcessChainConfig = {
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
          type: 'number',
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
      ],
    },
  ],
};

// ============================================================================
// CHAIN 3: HIRE-TO-RETIRE
// ============================================================================

export const hireToRetireConfig: ProcessChainConfig = {
  code: 'hire_to_retire',
  name: 'Hire-to-Retire (People)',
  description: 'Full employee lifecycle',
  estimatedMins: 20,
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
          type: 'number',
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
  ],
};

// ============================================================================
// CHAIN 4: RECORD-TO-REPORT
// ============================================================================

export const recordToReportConfig: ProcessChainConfig = {
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
          type: 'number',
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
          question: 'How long does month-end take currently? (working days)',
          type: 'number',
        },
        {
          id: 'rtr_close_target',
          field: 'close_target_days',
          question: 'What\'s the target? (working days)',
          type: 'number',
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
          type: 'number',
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
      ],
    },
  ],
};

// ============================================================================
// CHAIN 5: LEAD-TO-CLIENT
// ============================================================================

export const leadToClientConfig: ProcessChainConfig = {
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
          question: 'CRM data quality rating? (1-5)',
          type: 'number',
        },
        {
          id: 'ltc_crm_pain',
          field: 'crm_pain',
          question: 'Biggest frustration with CRM?',
          type: 'text',
          aiAnchor: true,
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
      ],
    },
  ],
};

// ============================================================================
// CHAIN 6: COMPLY-TO-CONFIRM
// ============================================================================

export const complyToConfirmConfig: ProcessChainConfig = {
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
      ],
    },
  ],
};

// Export all configs
export const processChainConfigs: Record<string, ProcessChainConfig> = {
  quote_to_cash: quoteToCashConfig,
  procure_to_pay: procureToPayConfig,
  hire_to_retire: hireToRetireConfig,
  record_to_report: recordToReportConfig,
  lead_to_client: leadToClientConfig,
  comply_to_confirm: complyToConfirmConfig,
};

// Map broken areas to process chains
export const brokenAreaToChainMap: Record<string, string[]> = {
  // Finance & Reporting
  financial_reporting: ['record_to_report'],
  month_end_close: ['record_to_report'],
  cash_flow_visibility: ['record_to_report', 'quote_to_cash'],
  budgeting_forecasting: ['record_to_report'],
  
  // Revenue & Cash
  invoicing_billing: ['quote_to_cash'],
  payment_collection: ['quote_to_cash'],
  quoting_proposals: ['quote_to_cash'],
  contract_management: ['quote_to_cash'],
  accounts_receivable: ['quote_to_cash'],
  
  // Spending
  accounts_payable: ['procure_to_pay'],
  expense_management: ['procure_to_pay', 'hire_to_retire'],
  purchase_approvals: ['procure_to_pay'],
  supplier_management: ['procure_to_pay'],
  
  // People
  payroll_processing: ['hire_to_retire'],
  holiday_absence: ['hire_to_retire'],
  time_tracking: ['hire_to_retire'],
  onboarding_offboarding: ['hire_to_retire'],
  expense_claims: ['hire_to_retire'],
  
  // Operations
  project_management: ['lead_to_client'],
  resource_planning: ['lead_to_client'],
  client_communication: ['lead_to_client'],
  inventory_stock: ['procure_to_pay'],
  
  // Sales & Marketing
  lead_management: ['lead_to_client'],
  crm_pipeline: ['lead_to_client'],
  marketing_tracking: ['lead_to_client'],
  client_onboarding: ['lead_to_client'],
  
  // Compliance
  vat_tax_filings: ['comply_to_confirm'],
  statutory_compliance: ['comply_to_confirm'],
  document_management: ['record_to_report'],
  general_admin: ['record_to_report'],
};

