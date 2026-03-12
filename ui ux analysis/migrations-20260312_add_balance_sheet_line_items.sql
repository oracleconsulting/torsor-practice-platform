ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS director_loan_account NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bad_debts NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_charges NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS connected_company_debtors NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dividends_paid NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trade_subscriptions NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trade_debtors NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS other_loans NUMERIC DEFAULT NULL;

COMMENT ON COLUMN client_financial_data.director_loan_account IS 'DLA balance at year end — S455 risk indicator';
COMMENT ON COLUMN client_financial_data.bad_debts IS 'Bad debt expense — credit quality indicator';
COMMENT ON COLUMN client_financial_data.bank_charges IS 'Bank charges — anomaly detection';
COMMENT ON COLUMN client_financial_data.connected_company_debtors IS 'Amounts owed by connected companies';
COMMENT ON COLUMN client_financial_data.dividends_paid IS 'Dividends paid in year';
COMMENT ON COLUMN client_financial_data.trade_subscriptions IS 'Platform and subscription costs';
COMMENT ON COLUMN client_financial_data.trade_debtors IS 'Trade receivables only (excl connected/DLA)';
COMMENT ON COLUMN client_financial_data.other_loans IS 'Total loan balances';
