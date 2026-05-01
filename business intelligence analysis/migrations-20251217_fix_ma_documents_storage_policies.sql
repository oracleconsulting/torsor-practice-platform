-- ============================================================================
-- FIX STORAGE POLICIES FOR ma-documents BUCKET
-- ============================================================================
-- Ensures authenticated team members can upload/download/delete MA documents
-- ============================================================================

-- Ensure the ma-documents bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ma-documents',
  'ma-documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies for ma-documents bucket if they exist
DROP POLICY IF EXISTS "Team can upload MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Team can view MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Team can delete MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete MA documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update MA documents" ON storage.objects;

-- Create simple, permissive policies for authenticated users
-- Team members need to upload/download/delete MA documents
CREATE POLICY "Authenticated users can upload MA documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ma-documents');

CREATE POLICY "Authenticated users can view MA documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ma-documents');

CREATE POLICY "Authenticated users can update MA documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ma-documents');

CREATE POLICY "Authenticated users can delete MA documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ma-documents');

