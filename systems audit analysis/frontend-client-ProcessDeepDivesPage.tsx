// ============================================================================
// SYSTEMS AUDIT - STAGE 3: PROCESS DEEP DIVES
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Workflow, CheckCircle, Clock, ChevronRight, Save,
  Loader2, AlertCircle, ChevronLeft, Target, Zap
} from 'lucide-react';

// Inline process chain configurations to avoid cross-app import issues
interface DeepDiveQuestion {
  id: string;
  field: string;
  question: string;
  type: 'text' | 'select' | 'multi_select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  aiAnchor?: boolean;
  required?: boolean;
}

interface ProcessChainConfig {
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
      ],
    },
  ],
};

// Hire-to-Retire Configuration (simplified)
const hireToRetireConfig: ProcessChainConfig = {
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
      ],
    },
  ],
};

// All process chain configs
const processChainConfigs: Record<string, ProcessChainConfig> = {
  quote_to_cash: quoteToCashConfig,
  procure_to_pay: procureToPayConfig,
  hire_to_retire: hireToRetireConfig,
  record_to_report: recordToReportConfig,
  lead_to_client: leadToClientConfig,
  comply_to_confirm: complyToConfirmConfig,
};

interface ProcessDeepDive {
  id: string;
  chain_code: string;
  completed_at: string | null;
  responses: Record<string, any>;
}

interface ProcessChain {
  id: string;
  chain_code: string;
  chain_name: string;
  description: string;
  estimated_duration_mins: number;
  display_order: number;
}

export default function ProcessDeepDivesPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [processChains, setProcessChains] = useState<ProcessChain[]>([]);
  const [deepDives, setDeepDives] = useState<Record<string, ProcessDeepDive>>({});
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [engagementStatus, setEngagementStatus] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [clientSession?.clientId]);

  const loadData = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch engagement
      const { data: engagement, error: engError } = await supabase
        .from('sa_engagements')
        .select('id, status')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (engError || !engagement) {
        console.error('Error fetching engagement:', engError);
        setLoading(false);
        return;
      }

      setEngagementId(engagement.id);
      setEngagementStatus(engagement.status);

      // Check if Stage 3 is complete - if so, check report status
      if (engagement.status === 'stage_3_complete' || engagement.status === 'analysis_complete' || engagement.status === 'completed') {
        const { data: reportData, error: reportError } = await supabase
          .from('sa_audit_reports')
          .select('*')
          .eq('engagement_id', engagement.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('🔍 ProcessDeepDivesPage - Report check:', {
          reportData,
          reportError,
          engagementId: engagement.id,
          hasReport: !!reportData,
          reportStatus: reportData?.status
        });
        
        if (reportError) {
          console.error('❌ Error fetching report in ProcessDeepDivesPage:', reportError);
        }
        
        if (reportData) {
          setReport(reportData);
          setReportStatus(reportData.status);
          console.log('✅ Report loaded. Status:', reportData.status, 'Approved?', 
            reportData.status === 'approved' || reportData.status === 'published' || reportData.status === 'delivered');
        } else {
          console.log('⚠️ No report found for engagement');
          setReportStatus(null);
        }
      }

      // Fetch process chains from database
      const { data: chains, error: chainsError } = await supabase
        .from('sa_process_chains')
        .select('*')
        .order('display_order', { ascending: true });

      if (chainsError) {
        console.error('Error fetching process chains:', chainsError);
      } else {
        setProcessChains(chains || []);
      }

      // Fetch existing deep dives
      const { data: dives, error: divesError } = await supabase
        .from('sa_process_deep_dives')
        .select('*')
        .eq('engagement_id', engagement.id);

      if (divesError) {
        console.error('Error fetching deep dives:', divesError);
      } else {
        const divesMap: Record<string, ProcessDeepDive> = {};
        (dives || []).forEach(dive => {
          divesMap[dive.chain_code] = dive;
        });
        setDeepDives(divesMap);
      }

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChain = (chainCode: string) => {
    setSelectedChain(chainCode);
    setCurrentSection(0);
    
    // Load existing responses if available
    const existingDive = deepDives[chainCode];
    if (existingDive && existingDive.responses) {
      setResponses(existingDive.responses);
    } else {
      setResponses({});
    }
  };

  const handleResponseChange = (field: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChain = async () => {
    if (!engagementId || !selectedChain) return;

    setSaving(true);
    try {
      const config = processChainConfigs[selectedChain];
      if (!config) {
        throw new Error('Process chain config not found');
      }

      // Extract key pain points from AI anchor questions
      const painPoints: string[] = [];
      config.sections.forEach(section => {
        section.questions.forEach(q => {
          if (q.aiAnchor && responses[q.field]) {
            const answer = responses[q.field];
            if (typeof answer === 'string' && answer.trim()) {
              painPoints.push(answer.trim());
            }
          }
        });
      });

      const deepDiveData = {
        engagement_id: engagementId,
        chain_code: selectedChain,
        responses,
        key_pain_points: painPoints.length > 0 ? painPoints : null,
        completed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sa_process_deep_dives')
        .upsert(deepDiveData, { onConflict: 'engagement_id,chain_code' });

      if (error) throw error;

      await loadData();
      setSelectedChain(null);
      setResponses({});
    } catch (err: any) {
      console.error('Error saving deep dive:', err);
      alert(`Error saving: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteStage3 = async () => {
    if (!engagementId) return;

    // Check if all chains are completed
    const allChains = processChains.map(c => c.chain_code);
    const completedChains = Object.keys(deepDives).filter(code => deepDives[code].completed_at);
    
    if (completedChains.length < allChains.length) {
      alert(`Please complete all ${allChains.length} process chains before completing Stage 3. You have completed ${completedChains.length} of ${allChains.length}.`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sa_engagements')
        .update({
          status: 'stage_3_complete',
          stage_3_completed_at: new Date().toISOString()
        })
        .eq('id', engagementId);

      if (error) throw error;

      setEngagementStatus('stage_3_complete');
      // After completing Stage 3, check report status
      const { data: reportData } = await supabase
        .from('sa_audit_reports')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (reportData) {
        setReport(reportData);
        setReportStatus(reportData.status);
      }

      // Navigate to dashboard - they'll see "coming soon" if report not approved
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error completing stage 3:', err);
      alert(`Error completing stage: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!engagementId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Engagement Found</h2>
          <p className="text-gray-600 mb-6">Please complete Stage 1 and Stage 2 first.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show "coming soon" if Stage 3 is complete but report is not approved
  if ((engagementStatus === 'stage_3_complete' || engagementStatus === 'analysis_complete' || engagementStatus === 'completed') && 
      reportStatus && 
      reportStatus !== 'approved' && 
      reportStatus !== 'published' && 
      reportStatus !== 'delivered') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-2xl">
          <div className="mb-6">
            <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Systems Audit Report is Coming Soon</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing all three stages of the Systems Audit assessment. 
              Our team is currently reviewing your responses and generating your personalized report.
            </p>
            <p className="text-gray-500 text-sm">
              You'll be notified as soon as your report is ready for review.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show report if approved
  if ((engagementStatus === 'stage_3_complete' || engagementStatus === 'analysis_complete' || engagementStatus === 'completed') && 
      reportStatus && 
      (reportStatus === 'approved' || reportStatus === 'published' || reportStatus === 'delivered') &&
      report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Systems Audit Report</h1>
          </div>
          
          {/* Report View - matches SAClientReportView structure */}
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 md:p-12">
              <p className="text-amber-400 font-medium mb-2">Systems Audit Report</p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
                {report.headline || 'Systems Audit Report'}
              </h1>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-red-400">
                    £{Math.round((report.total_annual_cost_of_chaos || 0) / 10) * 10}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Annual Cost of Chaos</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-amber-400">
                    {report.total_hours_wasted_weekly || 0}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Hours Lost Weekly</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-green-400">
                    {report.hours_reclaimable_weekly || Math.round((report.total_hours_wasted_weekly || 0) * 0.5) || 'TBC'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Hours Recoverable</p>
                </div>
              </div>
            </div>

            {/* Executive Brief */}
            {report.client_executive_brief && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">In Brief</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {report.client_executive_brief}
                </p>
              </div>
            )}

            {/* The Story */}
            {report.executive_summary && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What We Found</h2>
                <div className="prose prose-slate max-w-none">
                  {report.executive_summary.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* The Cost */}
            {report.cost_of_chaos_narrative && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">The Cost of Staying Where You Are</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {report.cost_of_chaos_narrative}
                  </p>
                </div>
                
                {/* Visual Cost Breakdown */}
                <div className="mt-6 pt-6 border-t border-red-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-red-600">{report.total_hours_wasted_weekly || 0}</p>
                    <p className="text-sm text-gray-600">Hours Lost Weekly</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">£{Math.round((report.total_annual_cost_of_chaos || 0) / 10) * 10}</p>
                    <p className="text-sm text-gray-600">Annual Impact</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">£{Math.round((report.projected_cost_at_scale || 0) / 10) * 10}</p>
                    <p className="text-sm text-gray-600">At {report.growth_multiplier || 1.5}x Growth</p>
                  </div>
                </div>
              </div>
            )}

            {/* The Opportunity */}
            {report.time_freedom_narrative && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">What This Enables</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {report.time_freedom_narrative}
                  </p>
                </div>
                
                {/* Hours Reclaimable - only show if value exists */}
                {report.hours_reclaimable_weekly && report.hours_reclaimable_weekly > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-xs text-gray-500 uppercase mb-1">Hours Reclaimable Weekly</p>
                    <p className="text-2xl font-bold text-green-600">{report.hours_reclaimable_weekly}</p>
                  </div>
                )}
              </div>
            )}

            {/* ROI Summary */}
            {(report.total_recommended_investment || report.total_annual_benefit) && (
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold mb-6">Return on Investment</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-emerald-200 text-sm">Investment</p>
                    <p className="text-2xl font-bold">£{(report.total_recommended_investment || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Annual Return</p>
                    <p className="text-2xl font-bold">£{(report.total_annual_benefit || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Payback Period</p>
                    <p className="text-2xl font-bold">{report.overall_payback_months || '?'} months</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">ROI</p>
                    <p className="text-2xl font-bold">{report.roi_ratio || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {report.quick_wins && report.quick_wins.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Quick Wins</h2>
                    <p className="text-sm text-gray-500">Implementable within one week</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {report.quick_wins.slice(0, 4).map((qw: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-amber-700">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{qw.title}</p>
                        <p className="text-sm text-gray-500">{qw.impact}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-semibold">+{qw.hoursSavedWeekly || qw.hours_saved_weekly || 0}hrs/wk</p>
                        <p className="text-xs text-gray-500">{qw.timeToImplement || qw.time_to_implement || 'TBC'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Ready to Reclaim Your Time?</h2>
              <p className="text-slate-400 mb-6">
                Let's discuss how to implement these recommendations and start recovering those {report.hours_reclaimable_weekly || Math.round((report.total_hours_wasted_weekly || 0) * 0.5) || 'valuable'} hours every week.
              </p>
              <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors">
                Schedule a Call
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a chain is selected, show the form
  if (selectedChain) {
    const config = processChainConfigs[selectedChain];
    if (!config) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Process Chain Not Found</h2>
            <button
              onClick={() => setSelectedChain(null)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Chains
            </button>
          </div>
        </div>
      );
    }

    const currentSectionData = config.sections[currentSection];
    const isLastSection = currentSection === config.sections.length - 1;
    const isFirstSection = currentSection === 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedChain(null);
                setResponses({});
                setCurrentSection(0);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Process Chains
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
                <p className="text-gray-600">{config.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>~{config.estimatedMins} minutes</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {config.sections.map((section, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    idx < currentSection ? 'bg-emerald-500 text-white' :
                    idx === currentSection ? 'bg-indigo-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {idx < currentSection ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < config.sections.length - 1 && (
                    <div className={`w-12 h-1 ${
                      idx < currentSection ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Section {currentSection + 1} of {config.sections.length}: {currentSectionData.name}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentSectionData.name}</h2>
            
            <div className="space-y-6">
              {currentSectionData.questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                    {question.aiAnchor && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        Key Insight
                      </span>
                    )}
                  </label>
                  
                  {question.type === 'text' && (
                    <textarea
                      value={responses[question.field] ?? ''}
                      onChange={(e) => handleResponseChange(question.field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder={question.placeholder || 'Enter your answer...'}
                    />
                  )}
                  
                  {question.type === 'select' && (
                    <select
                      value={responses[question.field] || ''}
                      onChange={(e) => handleResponseChange(question.field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select an option...</option>
                      {question.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  
                  {question.type === 'multi_select' && (
                    <div className="space-y-2">
                      {question.options?.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(responses[question.field] || []).includes(opt.value)}
                            onChange={(e) => {
                              const current = responses[question.field] || [];
                              if (e.target.checked) {
                                handleResponseChange(question.field, [...current, opt.value]);
                              } else {
                                handleResponseChange(question.field, current.filter((v: string) => v !== opt.value));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={isFirstSection}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Section
            </button>
            
            {isLastSection ? (
              <button
                onClick={handleSaveChain}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save & Complete Chain
              </button>
            ) : (
              <button
                onClick={() => setCurrentSection(currentSection + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next Section
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show chain selection
  const allChainsCompleted = processChains.length > 0 && 
    processChains.every(chain => deepDives[chain.chain_code]?.completed_at);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Systems Audit - Stage 3</h1>
                <p className="text-gray-600">Process Deep Dives</p>
              </div>
            </div>
            {allChainsCompleted && (
              <button
                onClick={handleCompleteStage3}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Complete Stage 3
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-cyan-900 mb-2">About Process Deep Dives</h3>
          <p className="text-sm text-cyan-700">
            Complete detailed deep dives for each key business process. This helps us identify bottlenecks, 
            inefficiencies, and opportunities for improvement. You can complete them in any order, and your 
            progress is saved automatically.
          </p>
        </div>

        {/* Process Chains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processChains.map((chain) => {
            const config = processChainConfigs[chain.chain_code];
            const deepDive = deepDives[chain.chain_code];
            const isCompleted = !!deepDive?.completed_at;

            return (
              <div
                key={chain.id}
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
                }`}
                onClick={() => handleSelectChain(chain.chain_code)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{chain.chain_name}</h3>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{chain.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~{chain.estimated_duration_mins} mins</span>
                      </div>
                      {config && (
                        <span>{config.sections.length} sections</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                {isCompleted && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <span className="text-xs font-medium text-emerald-700">Completed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        {processChains.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Chains Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Object.values(deepDives).filter(d => d.completed_at).length} / {processChains.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(Object.values(deepDives).filter(d => d.completed_at).length / processChains.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
