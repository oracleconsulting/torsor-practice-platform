-- ============================================================================
-- Migration: 20260121_add_payroll_costs_column.sql
-- Purpose: Add payroll_costs column to ma_financial_data table
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_financial_data' AND column_name = 'payroll_costs'
  ) THEN
    ALTER TABLE ma_financial_data ADD COLUMN payroll_costs DECIMAL(15,2);
    COMMENT ON COLUMN ma_financial_data.payroll_costs IS 'Monthly payroll costs including salaries, NI, pension';
  END IF;
END $$;

