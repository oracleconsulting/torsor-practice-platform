-- Migration: Add balance sheet and trend analysis columns to bm_reports
-- Date: 2026-01-29
-- Purpose: Support multi-year trend analysis and balance sheet context

-- Add balance sheet and financial context columns
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS balance_sheet JSONB DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS financial_trends JSONB DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS investment_signals JSONB DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS historical_financials JSONB DEFAULT NULL;

-- Liquidity ratios
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS current_ratio NUMERIC(10,2) DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS quick_ratio NUMERIC(10,2) DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS cash_months NUMERIC(10,1) DEFAULT NULL;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS creditor_days INTEGER DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bm_reports.balance_sheet IS 'Balance sheet data: cash, net_assets, debtors, creditors, property, investments';
COMMENT ON COLUMN bm_reports.financial_trends IS 'Array of trend analysis: direction, recovery status, narratives';
COMMENT ON COLUMN bm_reports.investment_signals IS 'Investment pattern detection: indicators, confidence, recovery patterns';
COMMENT ON COLUMN bm_reports.historical_financials IS 'Array of prior year financials for trend context';
COMMENT ON COLUMN bm_reports.current_ratio IS 'Current assets / current liabilities';
COMMENT ON COLUMN bm_reports.quick_ratio IS '(Current assets - stock) / current liabilities';
COMMENT ON COLUMN bm_reports.cash_months IS 'Cash position as months of revenue';
COMMENT ON COLUMN bm_reports.creditor_days IS 'Average days to pay creditors';

-- Update client_financial_data to support balance sheet extraction
ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS cash NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS net_assets NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS current_assets NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS current_liabilities NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS debtors NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS creditors NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS stock NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS fixed_assets NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS investments NUMERIC(15,2) DEFAULT NULL;

ALTER TABLE client_financial_data 
ADD COLUMN IF NOT EXISTS freehold_property NUMERIC(15,2) DEFAULT NULL;

COMMENT ON COLUMN client_financial_data.cash IS 'Cash and cash equivalents from balance sheet';
COMMENT ON COLUMN client_financial_data.net_assets IS 'Total equity / net assets';
COMMENT ON COLUMN client_financial_data.debtors IS 'Trade debtors / accounts receivable';
COMMENT ON COLUMN client_financial_data.creditors IS 'Trade creditors / accounts payable';
COMMENT ON COLUMN client_financial_data.freehold_property IS 'Freehold land and buildings';

