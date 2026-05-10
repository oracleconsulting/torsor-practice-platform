BEGIN;

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS benchmark_appendix JSONB;

COMMENT ON COLUMN bm_reports.benchmark_appendix IS 'Methodology and comparables appendix. Populated by Pass 1 for all stages. Contains comparable transactions, methodology summary, data sources, and confidence notes.';

COMMIT;
