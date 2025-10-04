-- Fix RLS policies for oracle_client_mapping to allow demo/anon access
-- This allows the TORSOR platform to read client mappings even with demo auth

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their practice client mappings" ON oracle_client_mapping;
DROP POLICY IF EXISTS "Users can insert client mappings" ON oracle_client_mapping;

-- Create more permissive policies that allow anon access
CREATE POLICY "Allow public read access to client mappings"
    ON oracle_client_mapping FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to client mappings"
    ON oracle_client_mapping FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update to client mappings"
    ON oracle_client_mapping FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete to client mappings"
    ON oracle_client_mapping FOR DELETE
    USING (true);

-- Also update the other alignment tables for consistency
DROP POLICY IF EXISTS "Users can view their notifications" ON alignment_notifications;
CREATE POLICY "Allow public read notifications" ON alignment_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view analytics" ON alignment_analytics;
CREATE POLICY "Allow public read analytics" ON alignment_analytics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their call transcripts" ON alignment_call_transcripts;
DROP POLICY IF EXISTS "Users can insert call transcripts" ON alignment_call_transcripts;
CREATE POLICY "Allow public access to transcripts" ON alignment_call_transcripts FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view their Calendly config" ON alignment_calendly_config;
DROP POLICY IF EXISTS "Users can manage their Calendly config" ON alignment_calendly_config;
CREATE POLICY "Allow public access to Calendly config" ON alignment_calendly_config FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view bulk actions" ON alignment_bulk_actions;
CREATE POLICY "Allow public read bulk actions" ON alignment_bulk_actions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view export history" ON alignment_export_history;
CREATE POLICY "Allow public read export history" ON alignment_export_history FOR SELECT USING (true);

-- Also allow public access to client_intake and client_config (needed for Oracle Method integration)
ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read client_intake" ON client_intake;
CREATE POLICY "Allow public read client_intake" ON client_intake FOR SELECT USING (true);

ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read client_config" ON client_config;
CREATE POLICY "Allow public read client_config" ON client_config FOR SELECT USING (true);

-- Verify the oracle_client_mapping data is there
DO $$
DECLARE
  mapping_count INTEGER;
  intake_count INTEGER;
  config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM oracle_client_mapping;
  SELECT COUNT(*) INTO intake_count FROM client_intake;
  SELECT COUNT(*) INTO config_count FROM client_config;
  
  RAISE NOTICE 'Total client mappings: %', mapping_count;
  RAISE NOTICE 'Total client intakes: %', intake_count;
  RAISE NOTICE 'Total client configs: %', config_count;
  
  IF mapping_count > 0 AND intake_count > 0 AND config_count > 0 THEN
    RAISE NOTICE '✅ All data exists! Tom & Zaneta should be visible.';
  ELSE
    RAISE NOTICE '⚠️ Some data missing. Run COMPLETE_WITH_TABLES.sql if needed.';
  END IF;
END $$;

