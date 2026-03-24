-- Migration paths between products (for Level 4 implementation roadmaps)
CREATE TABLE IF NOT EXISTS sa_tech_migration_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_product_slug TEXT NOT NULL REFERENCES sa_tech_products(slug),
  to_product_slug TEXT NOT NULL REFERENCES sa_tech_products(slug),

  migration_type TEXT NOT NULL CHECK (migration_type IN (
    'vendor_tool', 'third_party_tool', 'csv_export_import',
    'api_migration', 'manual_rebuild', 'partner_service'
  )),

  complexity TEXT NOT NULL CHECK (complexity IN (
    'trivial', 'moderate', 'complex', 'major'
  )),
  estimated_hours_min INT,
  estimated_hours_max INT,
  estimated_cost_min NUMERIC(10,2),
  estimated_cost_max NUMERIC(10,2),

  data_that_migrates JSONB DEFAULT '[]'::jsonb,
  data_that_doesnt JSONB DEFAULT '[]'::jsonb,
  data_loss_risk TEXT,

  source_export_formats JSONB DEFAULT '[]'::jsonb,
  source_export_notes TEXT,
  target_import_formats JSONB DEFAULT '[]'::jsonb,
  target_import_notes TEXT,

  timing_constraints TEXT,
  parallel_running_recommended BOOLEAN DEFAULT true,
  parallel_running_duration TEXT,

  gotchas TEXT,
  vendor_migration_url TEXT,

  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(from_product_slug, to_product_slug, migration_type)
);

CREATE INDEX idx_migration_paths_from ON sa_tech_migration_paths(from_product_slug);
CREATE INDEX idx_migration_paths_to ON sa_tech_migration_paths(to_product_slug);

-- RLS: same as other tech tables (practice team read/write)
ALTER TABLE sa_tech_migration_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view migration paths"
  ON sa_tech_migration_paths FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Practice team can manage migration paths"
  ON sa_tech_migration_paths FOR ALL
  USING (auth.role() = 'authenticated');

-- Add export/import capability columns to products
ALTER TABLE sa_tech_products
ADD COLUMN IF NOT EXISTS export_formats JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS import_formats JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_migration_wizard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS migration_notes TEXT;

COMMENT ON TABLE sa_tech_migration_paths IS
  'Known migration routes between products. Used by SA pipeline for Level 4 roadmaps.';
COMMENT ON COLUMN sa_tech_products.export_formats IS
  'Export formats: ["csv","excel","api","xml","sage_backup","pdf_only","none"]';
COMMENT ON COLUMN sa_tech_products.import_formats IS
  'Import formats: ["csv","api","conversion_wizard","manual_only"]';
