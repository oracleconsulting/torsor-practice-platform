/**
 * Idempotent seed for bi_ratio_definitions and bi_variance_definitions (upsert by code).
 * Invoke with service role: POST {} 
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATIOS: Array<Record<string, unknown>> = [
  // Liquidity
  { code: 'current_ratio', name: 'Current ratio', category: 'liquidity', description: 'Current assets / current liabilities proxy', calculation_formula: '(cash_at_bank+trade_debtors+stock)/(trade_creditors+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'gauge', min_tier: 'clarity', display_order: 10, rag_thresholds: {}, is_active: true },
  { code: 'quick_ratio', name: 'Quick ratio', category: 'liquidity', description: 'Liquid assets / creditors proxy', calculation_formula: '(cash_at_bank+trade_debtors)/(trade_creditors+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'gauge', min_tier: 'clarity', display_order: 11, rag_thresholds: {}, is_active: true },
  { code: 'cash_ratio', name: 'Cash ratio', category: 'liquidity', description: 'Cash / creditors', calculation_formula: 'cash_at_bank/(trade_creditors+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'sparkline', min_tier: 'clarity', display_order: 12, rag_thresholds: {}, is_active: true },
  { code: 'working_capital_ratio', name: 'Working capital / revenue', category: 'liquidity', description: 'Net working capital intensity', calculation_formula: '(cash_at_bank+trade_debtors+stock-trade_creditors)/(revenue+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'trend_line', min_tier: 'foresight', display_order: 13, rag_thresholds: {}, is_active: true },
  { code: 'defensive_interval_days', name: 'Defensive interval (days)', category: 'liquidity', description: 'Cash / daily spend proxy', calculation_formula: 'cash_at_bank/((monthly_operating_costs+0.01)/30)', unit: 'days', decimal_places: 0, higher_is_better: true, default_visual: 'bullet', min_tier: 'strategic', display_order: 14, rag_thresholds: {}, is_active: true },
  // Profitability
  { code: 'gross_margin_pct', name: 'Gross margin %', category: 'profitability', description: 'Gross profit / revenue', calculation_formula: '(gross_profit/(revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'bar_compare', min_tier: 'clarity', display_order: 20, rag_thresholds: {}, is_active: true },
  { code: 'operating_margin_pct', name: 'Operating margin %', category: 'profitability', description: 'Operating profit / revenue', calculation_formula: '(operating_profit/(revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'trend_line', min_tier: 'clarity', display_order: 21, rag_thresholds: {}, is_active: true },
  { code: 'net_margin_pct', name: 'Net margin %', category: 'profitability', description: 'Net profit / revenue', calculation_formula: '(net_profit/(revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'trend_line', min_tier: 'clarity', display_order: 22, rag_thresholds: {}, is_active: true },
  { code: 'ebitda_margin_pct', name: 'EBITDA margin % (proxy)', category: 'profitability', description: 'Operating profit as EBITDA proxy', calculation_formula: '(operating_profit/(revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'radial', min_tier: 'foresight', display_order: 23, rag_thresholds: {}, is_active: true },
  { code: 'roa_pct', name: 'Return on assets (proxy)', category: 'profitability', description: 'Net profit / fixed assets proxy', calculation_formula: '(net_profit/(fixed_assets+cash_at_bank+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'gauge', min_tier: 'foresight', display_order: 24, rag_thresholds: {}, is_active: true },
  { code: 'roe_pct', name: 'Return on equity (proxy)', category: 'profitability', description: 'NP / equity proxy (retained not modelled)', calculation_formula: '(net_profit/(trade_creditors+cash_at_bank+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'gauge', min_tier: 'strategic', display_order: 25, rag_thresholds: {}, is_active: true },
  { code: 'roce_pct', name: 'Return on capital employed (proxy)', category: 'profitability', description: 'Operating profit / capital proxy', calculation_formula: '(operating_profit/(trade_creditors+bank_loans+fixed_assets+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'radial', min_tier: 'strategic', display_order: 26, rag_thresholds: {}, is_active: true },
  // Efficiency
  { code: 'asset_turnover', name: 'Asset turnover', category: 'efficiency', description: 'Revenue / assets proxy', calculation_formula: 'revenue/(fixed_assets+cash_at_bank+trade_debtors+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'trend_line', min_tier: 'foresight', display_order: 30, rag_thresholds: {}, is_active: true },
  { code: 'debtor_days', name: 'Debtor days', category: 'efficiency', description: 'Trade debtors / daily revenue', calculation_formula: 'trade_debtors/((revenue+0.01)/365)', unit: 'days', decimal_places: 0, higher_is_better: false, default_visual: 'bar_compare', min_tier: 'clarity', display_order: 31, rag_thresholds: {}, is_active: true },
  { code: 'creditor_days', name: 'Creditor days', category: 'efficiency', description: 'Trade creditors / daily cogs proxy', calculation_formula: 'trade_creditors/((cost_of_sales+0.01)/365)', unit: 'days', decimal_places: 0, higher_is_better: true, default_visual: 'trend_line', min_tier: 'clarity', display_order: 32, rag_thresholds: {}, is_active: true },
  { code: 'stock_days', name: 'Stock days', category: 'efficiency', description: 'Stock / daily cogs', calculation_formula: 'stock/((cost_of_sales+0.01)/365)', unit: 'days', decimal_places: 0, higher_is_better: false, default_visual: 'sparkline', min_tier: 'foresight', display_order: 33, rag_thresholds: {}, is_active: true },
  { code: 'ccc_days', name: 'Cash conversion cycle', category: 'efficiency', description: 'Stock days + debtor days - creditor days', calculation_formula: '(stock/((cost_of_sales+0.01)/365))+(trade_debtors/((revenue+0.01)/365))-(trade_creditors/((cost_of_sales+0.01)/365))', unit: 'days', decimal_places: 0, higher_is_better: false, default_visual: 'trend_line', min_tier: 'strategic', display_order: 34, rag_thresholds: {}, is_active: true },
  { code: 'revenue_per_employee', name: 'Revenue per employee', category: 'efficiency', description: 'Revenue / FTE', calculation_formula: 'revenue/(fte_count+0.01)', unit: 'currency', decimal_places: 0, higher_is_better: true, default_visual: 'bar_compare', min_tier: 'clarity', display_order: 35, rag_thresholds: {}, is_active: true },
  { code: 'revenue_per_payroll_gbp', name: 'Revenue per £ payroll', category: 'efficiency', description: 'Annualised revenue / monthly payroll', calculation_formula: '(revenue*12)/(monthly_payroll_costs+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'bullet', min_tier: 'foresight', display_order: 36, rag_thresholds: {}, is_active: true },
  // Leverage
  { code: 'debt_to_equity', name: 'Debt to equity (proxy)', category: 'leverage', description: 'Loans / equity proxy', calculation_formula: '(bank_loans+director_loans)/(cash_at_bank+net_profit+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: false, default_visual: 'gauge', min_tier: 'foresight', display_order: 40, rag_thresholds: {}, is_active: true },
  { code: 'debt_to_assets', name: 'Debt to assets', category: 'leverage', description: 'Loans / assets proxy', calculation_formula: '(bank_loans+director_loans)/(fixed_assets+cash_at_bank+trade_debtors+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: false, default_visual: 'sparkline', min_tier: 'foresight', display_order: 41, rag_thresholds: {}, is_active: true },
  { code: 'interest_coverage', name: 'Interest coverage (proxy)', category: 'leverage', description: 'Operating profit / interest proxy — uses operating profit only', calculation_formula: 'operating_profit/(bank_loans*0.01+0.01)', unit: 'ratio', decimal_places: 2, higher_is_better: true, default_visual: 'bullet', min_tier: 'strategic', display_order: 42, rag_thresholds: {}, is_active: true },
  { code: 'gearing_pct', name: 'Gearing %', category: 'leverage', description: 'Debt / (debt+equity proxy)', calculation_formula: '((bank_loans+director_loans)/((bank_loans+director_loans)+cash_at_bank+net_profit+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: false, default_visual: 'radial', min_tier: 'strategic', display_order: 43, rag_thresholds: {}, is_active: true },
  // Growth (requires prior series — simplified MoM from prior_revenue column)
  { code: 'revenue_growth_mom_pct', name: 'Revenue growth vs prior period %', category: 'growth', description: '(Revenue - prior_revenue)/prior', calculation_formula: '((revenue-(prior_revenue+0))/(prior_revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'trend_line', min_tier: 'clarity', display_order: 50, rag_thresholds: {}, is_active: true },
  { code: 'revenue_growth_yoy_pct', name: 'Revenue growth YoY %', category: 'growth', description: '(Revenue - YoY)/YoY', calculation_formula: '((revenue-(yoy_revenue+0))/(yoy_revenue+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'trend_line', min_tier: 'clarity', display_order: 51, rag_thresholds: {}, is_active: true },
  { code: 'gp_growth_yoy_pct', name: 'Gross profit growth YoY %', category: 'growth', description: 'GP vs YoY revenue-derived GP proxy skipped — uses operating leverage proxy', calculation_formula: '((gross_profit-(prior_revenue*0.3))/(prior_revenue*0.3+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'bar_compare', min_tier: 'foresight', display_order: 52, rag_thresholds: {}, is_active: true },
  { code: 'op_growth_yoy_pct', name: 'Operating profit growth YoY %', category: 'growth', description: 'Op profit momentum proxy', calculation_formula: '((operating_profit-(prior_revenue*0.1))/(prior_revenue*0.1+0.01))*100', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'trend_line', min_tier: 'foresight', display_order: 53, rag_thresholds: {}, is_active: true },
  { code: 'headcount_growth_yoy_pct', name: 'Headcount growth YoY %', category: 'growth', description: 'Placeholder — requires prior headcount', calculation_formula: '0', unit: 'percentage', decimal_places: 1, higher_is_better: true, default_visual: 'sparkline', min_tier: 'strategic', display_order: 54, rag_thresholds: {}, is_active: true },
];

const VARIANCES: Array<Record<string, unknown>> = [
  { code: 'rev_vs_prior_period', name: 'Revenue vs prior period', category: 'pl', numerator_field: 'revenue', comparator_type: 'prior_period', comparator_field: 'revenue', direction_good: 'neutral', default_visual: 'bar_delta', min_tier: 'clarity', display_order: 1, is_active: true },
  { code: 'gp_vs_prior_period', name: 'Gross profit vs prior period', category: 'pl', numerator_field: 'gross_profit', comparator_type: 'prior_period', comparator_field: 'gross_profit', direction_good: 'up', default_visual: 'waterfall', min_tier: 'clarity', display_order: 2, is_active: true },
  { code: 'np_vs_prior_period', name: 'Net profit vs prior period', category: 'pl', numerator_field: 'net_profit', comparator_type: 'prior_period', comparator_field: 'net_profit', direction_good: 'up', default_visual: 'arrow_card', min_tier: 'clarity', display_order: 3, is_active: true },
  { code: 'cash_vs_prior_period', name: 'Cash vs prior period', category: 'cash', numerator_field: 'cash_at_bank', comparator_type: 'prior_period', comparator_field: 'cash_at_bank', direction_good: 'up', default_visual: 'bridge', min_tier: 'foresight', display_order: 4, is_active: true },
  { code: 'gm_pct_vs_prior', name: 'Gross margin % vs prior', category: 'margin', numerator_field: 'gross_profit', comparator_type: 'prior_period', comparator_field: 'gross_profit', direction_good: 'up', default_visual: 'traffic_light', min_tier: 'foresight', display_order: 5, is_active: true },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let ratioUpserts = 0;
    for (const row of RATIOS) {
      const { error } = await supabase.from('bi_ratio_definitions').upsert(row, { onConflict: 'code' });
      if (error) console.error('[seed-bi-ratio-catalogue] ratio', row.code, error.message);
      else ratioUpserts++;
    }

    let varUpserts = 0;
    for (const row of VARIANCES) {
      const { error } = await supabase.from('bi_variance_definitions').upsert(row, { onConflict: 'code' });
      if (error) console.error('[seed-bi-ratio-catalogue] variance', row.code, error.message);
      else varUpserts++;
    }

    return new Response(
      JSON.stringify({ success: true, ratios: ratioUpserts, variances: varUpserts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
