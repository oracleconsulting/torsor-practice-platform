-- ============================================================================
-- SERVICE EXAMPLES STORAGE BUCKET
-- For tier example PDFs referenced in the canonical service registry
-- ============================================================================

-- Create storage bucket for service example PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-examples',
  'service-examples',
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
DROP POLICY IF EXISTS "Public read access for service examples" ON storage.objects;
CREATE POLICY "Public read access for service examples"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-examples');

-- Allow authenticated users (admin) to upload
DROP POLICY IF EXISTS "Admin upload for service examples" ON storage.objects;
CREATE POLICY "Admin upload for service examples"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-examples'
  AND auth.role() = 'authenticated'
);
