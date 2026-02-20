-- Add staff_costs to client_financial_data for payroll / discovery report extraction
ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS staff_costs DECIMAL(15,2);

COMMENT ON COLUMN client_financial_data.staff_costs IS 'Total staff costs (salaries, NI, pension, directors) used for payroll efficiency and discovery reports';
