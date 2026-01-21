-- ============================================
-- BUSINESS INTELLIGENCE KPI DEFINITIONS
-- 23 KPIs across 5 categories
-- ============================================

-- Clear existing (if re-running)
DELETE FROM bi_kpi_definitions WHERE true;

-- CASH & WORKING CAPITAL (7 KPIs)
INSERT INTO bi_kpi_definitions (
  code, name, category, description, calculation_formula, unit, decimal_places,
  is_core, min_tier, display_order,
  default_green_threshold, default_green_operator,
  default_amber_min, default_amber_max,
  default_red_threshold, default_red_operator
) VALUES

-- 1. True Cash Position (CORE)
('true_cash', 'True Cash Position', 'cash_working_capital',
 'Cash available after all known commitments',
 'cash_at_bank - vat_liability - paye_liability - corporation_tax_liability - committed_payments + confirmed_receivables',
 'currency', 0, TRUE, 'clarity', 1,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- 2. Cash Runway (CORE)
('cash_runway', 'Cash Runway', 'cash_working_capital',
 'Months of operating costs covered by True Cash',
 'true_cash / monthly_operating_costs',
 'months', 1, TRUE, 'clarity', 2,
 3, '>=', 1, 3, 1, '<'),

-- 3. Monthly Burn Rate
('monthly_burn', 'Monthly Burn Rate', 'cash_working_capital',
 'Net cash consumed per month',
 'monthly_operating_costs + monthly_payroll_costs - average_monthly_collections',
 'currency', 0, FALSE, 'clarity', 3,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- 4. Debtor Days (CORE)
('debtor_days', 'Debtor Days', 'cash_working_capital',
 'Average days to collect payment',
 '(trade_debtors / revenue) * 30',
 'days', 0, TRUE, 'clarity', 4,
 30, '<=', 31, 45, 45, '>'),

-- 5. Creditor Days
('creditor_days', 'Creditor Days', 'cash_working_capital',
 'Average days to pay suppliers',
 '(trade_creditors / cost_of_sales) * 30',
 'days', 0, FALSE, 'clarity', 5,
 30, '>=', 20, 30, 20, '<'),

-- 6. Working Capital Ratio
('working_capital_ratio', 'Working Capital Ratio', 'cash_working_capital',
 'Current assets divided by current liabilities',
 '(cash_at_bank + trade_debtors + stock) / (trade_creditors + vat_liability + paye_liability)',
 'ratio', 2, FALSE, 'foresight', 6,
 1.5, '>=', 1.0, 1.5, 1.0, '<'),

-- 7. Cash Conversion Cycle
('cash_conversion_cycle', 'Cash Conversion Cycle', 'cash_working_capital',
 'Days to convert inventory/services to cash',
 'debtor_days + inventory_days - creditor_days',
 'days', 0, FALSE, 'foresight', 7,
 45, '<=', 45, 75, 75, '>'),

-- REVENUE & GROWTH (5 KPIs)

-- 8. Monthly Revenue (CORE)
('monthly_revenue', 'Monthly Revenue', 'revenue_growth',
 'Total revenue for the period',
 'revenue',
 'currency', 0, TRUE, 'clarity', 8,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- 9. YoY Revenue Growth
('yoy_growth', 'YoY Revenue Growth', 'revenue_growth',
 'Revenue growth compared to same period last year',
 '((revenue - yoy_revenue) / yoy_revenue) * 100',
 'percentage', 1, FALSE, 'foresight', 9,
 10, '>=', 0, 10, 0, '<'),

-- 10. Average Project Value
('avg_project_value', 'Average Project Value', 'revenue_growth',
 'Average revenue per project or client',
 'revenue / active_project_count',
 'currency', 0, FALSE, 'foresight', 10,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- 11. Revenue per Employee (CORE)
('revenue_per_employee', 'Revenue per Employee', 'revenue_growth',
 'Revenue generated per FTE',
 '(revenue * 12) / fte_count',
 'currency', 0, TRUE, 'clarity', 11,
 100000, '>=', 75000, 100000, 75000, '<'),

-- 12. Recurring Revenue %
('recurring_revenue_pct', 'Recurring Revenue %', 'revenue_growth',
 'Percentage of revenue that is recurring/contracted',
 '(recurring_revenue / revenue) * 100',
 'percentage', 0, FALSE, 'foresight', 12,
 50, '>=', 25, 50, 25, '<'),

-- PROFITABILITY (5 KPIs)

-- 13. Gross Margin % (CORE)
('gross_margin', 'Gross Margin %', 'profitability',
 'Profit after direct costs as percentage of revenue',
 '(gross_profit / revenue) * 100',
 'percentage', 1, TRUE, 'clarity', 13,
 40, '>=', 25, 40, 25, '<'),

-- 14. Operating Margin % (CORE)
('operating_margin', 'Operating Margin %', 'profitability',
 'Operating profit as percentage of revenue',
 '(operating_profit / revenue) * 100',
 'percentage', 1, TRUE, 'clarity', 14,
 15, '>=', 8, 15, 8, '<'),

-- 15. Net Margin %
('net_margin', 'Net Margin %', 'profitability',
 'Net profit as percentage of revenue',
 '(net_profit / revenue) * 100',
 'percentage', 1, FALSE, 'clarity', 15,
 10, '>=', 5, 10, 5, '<'),

-- 16. Overhead Ratio
('overhead_ratio', 'Overhead as % of Revenue', 'profitability',
 'Fixed costs as percentage of revenue',
 '(overheads / revenue) * 100',
 'percentage', 1, FALSE, 'foresight', 16,
 30, '<=', 30, 45, 45, '>'),

-- 17. Revenue per £1 Salary
('revenue_per_salary', 'Revenue per £1 Salary', 'profitability',
 'Revenue generated per pound of salary cost',
 'revenue / monthly_payroll_costs',
 'ratio', 2, FALSE, 'foresight', 17,
 3, '>=', 2, 3, 2, '<'),

-- EFFICIENCY (3 KPIs)

-- 18. Billable Utilisation %
('billable_utilisation', 'Billable Utilisation %', 'efficiency',
 'Percentage of available hours that are billable',
 '(billable_hours / available_hours) * 100',
 'percentage', 0, FALSE, 'foresight', 18,
 70, '>=', 55, 70, 55, '<'),

-- 19. Effective Hourly Rate
('effective_hourly_rate', 'Effective Hourly Rate', 'efficiency',
 'Revenue divided by total hours worked',
 'revenue / total_hours_worked',
 'currency', 0, FALSE, 'foresight', 19,
 NULL, NULL, NULL, NULL, NULL, NULL),

-- 20. Project Margin by Client
('project_margin_by_client', 'Project Margin by Client', 'efficiency',
 'Profitability analysis per client',
 'See client_profitability table',
 'percentage', 1, FALSE, 'foresight', 20,
 20, '>=', 10, 20, 10, '<'),

-- CLIENT HEALTH (3 KPIs)

-- 21. Client Concentration %
('client_concentration', 'Client Concentration %', 'client_health',
 'Revenue from largest client as % of total',
 '(largest_client_revenue / revenue) * 100',
 'percentage', 0, FALSE, 'foresight', 21,
 20, '<=', 20, 35, 35, '>'),

-- 22. Client Retention %
('client_retention', 'Client Retention %', 'client_health',
 'Percentage of clients retained year-over-year',
 '(retained_clients / prior_year_clients) * 100',
 'percentage', 0, FALSE, 'strategic', 22,
 85, '>=', 70, 85, 70, '<'),

-- 23. New Client Revenue %
('new_client_revenue', 'New Client Revenue %', 'client_health',
 'Revenue from clients acquired this year',
 '(new_client_revenue / revenue) * 100',
 'percentage', 0, FALSE, 'strategic', 23,
 20, '>=', 10, 20, 10, '<');

