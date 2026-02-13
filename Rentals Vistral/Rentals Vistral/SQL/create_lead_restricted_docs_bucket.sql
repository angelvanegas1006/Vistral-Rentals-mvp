-- Create the leads-restricted-docs bucket for lead identity documents
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leads-restricted-docs',
  'leads-restricted-docs',
  false,  -- Private bucket (signed URLs required)
  10485760,  -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket (service role bypasses these, but good practice)

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read lead docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'leads-restricted-docs');

-- Allow service role to manage all files (upload, delete)
-- Note: service_role already bypasses RLS, but this is explicit
CREATE POLICY "Service role can manage lead docs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'leads-restricted-docs');
