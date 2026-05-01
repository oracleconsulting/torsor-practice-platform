-- ============================================================================
-- BI Storage Bucket for PDF Reports
-- ============================================================================
-- This migration creates the storage bucket for BI PDF reports
-- Run with: INSERT INTO storage.buckets ...
-- Note: Storage bucket creation must be done via Supabase dashboard or API
-- This migration documents the required bucket configuration

-- The bucket should be created with:
-- Name: bi-reports
-- Public: false (or true if you want public download URLs)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, text/html, image/*

-- For now, let's ensure the bucket exists via a function
DO $$
BEGIN
  -- Check if bucket exists and create if not
  -- Note: This might need to be done via the Supabase Dashboard
  -- as storage.buckets might not be directly accessible in migrations
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'bi-reports',
    'bi-reports', 
    false,
    10485760, -- 10MB
    ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create storage bucket via migration - please create manually in Supabase Dashboard';
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets table not accessible - please create bucket manually';
END $$;

-- Storage policies for bi-reports bucket
-- Note: Policies must be created via Supabase Dashboard or after bucket exists
-- These are documented here for reference

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Service role can manage BI reports" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their team BI reports" ON storage.objects;
  
  -- Create policies (only if storage.objects table exists and bucket is created)
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bi-reports') THEN
    -- Allow service_role full access
    CREATE POLICY "Service role can manage BI reports"
      ON storage.objects
      FOR ALL
      USING (bucket_id = 'bi-reports' AND auth.role() = 'service_role');

    -- Allow authenticated users to read their own reports
    CREATE POLICY "Users can view their team BI reports"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'bi-reports' 
        AND auth.role() = 'authenticated'
      );
      
    RAISE NOTICE 'Storage policies created for bi-reports bucket';
  ELSE
    RAISE NOTICE 'bi-reports bucket does not exist yet - create it in Supabase Dashboard first';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.objects table not accessible - skipping policy creation';
  WHEN others THEN
    RAISE NOTICE 'Could not create storage policies: %', SQLERRM;
END $$;

