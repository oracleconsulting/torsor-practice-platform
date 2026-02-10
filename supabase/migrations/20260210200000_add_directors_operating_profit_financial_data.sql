-- Add directors_remuneration and operating_profit to client_financial_data
-- staff_costs already added in 20260210180000
ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS directors_remuneration numeric,
  ADD COLUMN IF NOT EXISTS operating_profit numeric;

COMMENT ON COLUMN client_financial_data.directors_remuneration IS 'Directors'' pay/remuneration from accounts.';
COMMENT ON COLUMN client_financial_data.operating_profit IS 'Operating profit if directly stated (not derived from EBITDA).';
