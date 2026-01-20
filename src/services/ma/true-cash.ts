// ============================================================================
// TRUE CASH CALCULATION SERVICE
// ============================================================================
// Core service for calculating "True Cash" - what you can actually spend
// vs what the bank balance shows.
// ============================================================================

import { supabase } from '../../lib/supabase';
import type { TrueCashCalculation, RAGStatus } from '../../types/ma';

export interface TrueCashInputs {
  bankBalance: number;
  vatLiability?: number;
  payeLiability?: number;
  corporationTaxLiability?: number;
  // Additional known commitments
  committedPayments?: number;
  committedPaymentsBreakdown?: Array<{ name: string; amount: number; dueDate?: string }>;
  // Receivables due within 14 days with high confidence
  confirmedReceivables?: number;
  confirmedReceivablesBreakdown?: Array<{ name: string; amount: number; expectedDate?: string }>;
  // For runway calculation
  monthlyOperatingCosts: number;
}

export interface TrueCashResult {
  trueCash: number;
  bankBalance: number;
  calculation: TrueCashCalculation;
  difference: number; // Bank balance - True Cash (committed funds)
  runwayMonths: number;
  ragStatus: RAGStatus;
  commentary: string;
  warnings: string[];
}

/**
 * Calculate True Cash position
 * True Cash = Bank Balance - Known Commitments + Confirmed Receivables
 */
export function calculateTrueCash(inputs: TrueCashInputs): TrueCashResult {
  const {
    bankBalance,
    vatLiability = 0,
    payeLiability = 0,
    corporationTaxLiability = 0,
    committedPayments = 0,
    confirmedReceivables = 0,
    monthlyOperatingCosts,
  } = inputs;

  // Calculate True Cash
  const trueCash = 
    bankBalance
    - vatLiability
    - payeLiability
    - corporationTaxLiability
    - committedPayments
    + confirmedReceivables;

  const difference = bankBalance - trueCash;

  // Calculate runway (months of operating costs covered)
  const runwayMonths = monthlyOperatingCosts > 0 
    ? trueCash / monthlyOperatingCosts 
    : trueCash > 0 ? 99 : 0;

  // Determine RAG status based on runway
  let ragStatus: RAGStatus;
  if (trueCash < 0) {
    ragStatus = 'red';
  } else if (runwayMonths >= 3) {
    ragStatus = 'green';
  } else if (runwayMonths >= 1.5) {
    ragStatus = 'amber';
  } else {
    ragStatus = 'red';
  }

  // Generate warnings
  const warnings: string[] = [];
  
  if (trueCash < 0) {
    warnings.push(`True Cash is negative. Your commitments exceed available funds by £${Math.abs(trueCash).toLocaleString()}.`);
  }
  
  if (runwayMonths < 2 && runwayMonths >= 0) {
    warnings.push(`Less than 2 months of operating costs covered. Consider cash preservation measures.`);
  }
  
  if (difference > bankBalance * 0.5) {
    warnings.push(`Over 50% of your bank balance is already committed. Monitor cash flow closely.`);
  }

  if (vatLiability > bankBalance * 0.2) {
    warnings.push(`VAT liability represents more than 20% of bank balance. Ensure funds are reserved.`);
  }

  // Generate commentary
  const commentary = generateTrueCashCommentary(trueCash, bankBalance, difference, runwayMonths, ragStatus);

  return {
    trueCash,
    bankBalance,
    calculation: {
      bank_balance: bankBalance,
      vat_provision: vatLiability,
      paye_ni: payeLiability,
      corporation_tax: corporationTaxLiability,
      committed_payments: committedPayments,
      confirmed_receivables: confirmedReceivables,
      true_cash: trueCash,
    },
    difference,
    runwayMonths: Math.round(runwayMonths * 10) / 10, // Round to 1 decimal
    ragStatus,
    commentary,
    warnings,
  };
}

/**
 * Generate human-readable commentary for True Cash position
 */
function generateTrueCashCommentary(
  trueCash: number,
  bankBalance: number,
  difference: number,
  runwayMonths: number,
  ragStatus: RAGStatus
): string {
  const formatCurrency = (n: number) => `£${Math.abs(n).toLocaleString()}`;

  if (ragStatus === 'red' && trueCash < 0) {
    return `Your True Cash position is ${formatCurrency(trueCash)} in the red. While your bank shows ${formatCurrency(bankBalance)}, you have ${formatCurrency(difference)} in known commitments that exceed available funds. Immediate action required.`;
  }
  
  if (ragStatus === 'red') {
    return `True Cash of ${formatCurrency(trueCash)} provides only ${runwayMonths.toFixed(1)} months of operating costs. ${formatCurrency(difference)} of your ${formatCurrency(bankBalance)} bank balance is already committed. This needs immediate attention.`;
  }
  
  if (ragStatus === 'amber') {
    return `True Cash of ${formatCurrency(trueCash)} provides ${runwayMonths.toFixed(1)} months runway. While manageable, ${formatCurrency(difference)} of your bank balance is committed to known obligations. Worth monitoring closely.`;
  }
  
  return `True Cash of ${formatCurrency(trueCash)} provides comfortable runway of ${runwayMonths.toFixed(1)} months. ${formatCurrency(difference)} is committed to known obligations, leaving healthy reserves for operations and opportunities.`;
}

/**
 * Save True Cash calculation to financial data and KPI tracking
 */
export async function saveTrueCash(
  periodId: string,
  engagementId: string,
  result: TrueCashResult
): Promise<void> {
  // Update financial data record
  const { error: finError } = await supabase
    .from('ma_financial_data')
    .update({
      true_cash: result.trueCash,
      true_cash_calculation: result.calculation,
      true_cash_runway_months: result.runwayMonths,
      updated_at: new Date().toISOString(),
    })
    .eq('period_id', periodId);

  if (finError) {
    console.error('[TrueCash] Error updating financial data:', finError);
  }

  // Get the period end date for KPI tracking
  const { data: period } = await supabase
    .from('ma_periods')
    .select('period_end')
    .eq('id', periodId)
    .single();

  if (period) {
    // Upsert to KPI tracking
    const { error: kpiError } = await supabase
      .from('ma_kpi_tracking')
      .upsert({
        engagement_id: engagementId,
        kpi_code: 'true_cash',
        period_start: period.period_end, // Same as period_end for point-in-time
        period_end: period.period_end,
        value: result.trueCash,
        rag_status: result.ragStatus,
        auto_commentary: result.commentary,
        supporting_data: {
          calculation: result.calculation,
          runway_months: result.runwayMonths,
          warnings: result.warnings,
        },
        data_source: 'calculated',
        data_quality: 'verified',
      }, {
        onConflict: 'engagement_id,kpi_code,period_end'
      });

    if (kpiError) {
      console.error('[TrueCash] Error updating KPI tracking:', kpiError);
    }
  }
}

/**
 * Calculate True Cash from existing financial data
 */
export async function calculateTrueCashFromFinancialData(
  periodId: string
): Promise<TrueCashResult | null> {
  const { data: finData, error } = await supabase
    .from('ma_financial_data')
    .select('*')
    .eq('period_id', periodId)
    .single();

  if (error || !finData) {
    console.error('[TrueCash] Error loading financial data:', error);
    return null;
  }

  // Check we have minimum required data
  if (finData.cash_at_bank === null || finData.cash_at_bank === undefined) {
    console.warn('[TrueCash] No cash at bank figure available');
    return null;
  }

  return calculateTrueCash({
    bankBalance: finData.cash_at_bank,
    vatLiability: finData.vat_liability || 0,
    payeLiability: finData.paye_liability || 0,
    corporationTaxLiability: finData.corporation_tax_liability || 0,
    committedPayments: 0, // Would come from aged creditors analysis
    confirmedReceivables: 0, // Would come from aged debtors analysis
    monthlyOperatingCosts: finData.monthly_operating_costs || finData.overheads || 0,
  });
}

/**
 * Get True Cash comparison data for display
 */
export interface TrueCashDisplay {
  bankBalance: number;
  trueCash: number;
  difference: number;
  runwayMonths: number;
  ragStatus: RAGStatus;
  deductions: Array<{ label: string; amount: number }>;
  additions: Array<{ label: string; amount: number }>;
  commentary: string;
  warnings: string[];
  // For visualisation
  percentageAvailable: number; // True Cash as % of bank balance
}

export function formatTrueCashForDisplay(result: TrueCashResult): TrueCashDisplay {
  const deductions: Array<{ label: string; amount: number }> = [];
  const additions: Array<{ label: string; amount: number }> = [];

  const calc = result.calculation;

  if (calc.vat_provision > 0) {
    deductions.push({ label: 'VAT owed', amount: -calc.vat_provision });
  }
  if (calc.paye_ni > 0) {
    deductions.push({ label: 'PAYE/NI due', amount: -calc.paye_ni });
  }
  if (calc.corporation_tax > 0) {
    deductions.push({ label: 'Corporation Tax provision', amount: -calc.corporation_tax });
  }
  if (calc.committed_payments > 0) {
    deductions.push({ label: 'Committed payments', amount: -calc.committed_payments });
  }
  if (calc.confirmed_receivables > 0) {
    additions.push({ label: 'Confirmed receivables', amount: calc.confirmed_receivables });
  }

  const percentageAvailable = result.bankBalance > 0 
    ? Math.max(0, (result.trueCash / result.bankBalance) * 100)
    : 0;

  return {
    bankBalance: result.bankBalance,
    trueCash: result.trueCash,
    difference: result.difference,
    runwayMonths: result.runwayMonths,
    ragStatus: result.ragStatus,
    deductions,
    additions,
    commentary: result.commentary,
    warnings: result.warnings,
    percentageAvailable: Math.round(percentageAvailable),
  };
}

