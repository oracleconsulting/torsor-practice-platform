-- Migration: Add enhanced admin guidance columns to bm_reports
-- These columns store the detailed conversation scripts for practitioners

-- Opening statement for the conversation
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS admin_opening_statement TEXT;

-- Data collection scripts for gathering missing metrics
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS admin_data_collection_script JSONB;

-- Closing script for wrapping up the conversation
ALTER TABLE bm_reports ADD COLUMN IF NOT EXISTS admin_closing_script TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bm_reports.admin_opening_statement IS 'Opening statement script for practitioner to begin the benchmarking conversation';
COMMENT ON COLUMN bm_reports.admin_data_collection_script IS 'JSON array of scripts for collecting specific missing metrics from clients';
COMMENT ON COLUMN bm_reports.admin_closing_script IS 'Closing script for practitioner to wrap up the conversation and confirm next steps';


