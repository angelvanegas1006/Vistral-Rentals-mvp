-- ============================================
-- Migración: Crear bucket de Supabase Storage para archivos multimedia
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear bucket para archivos multimedia de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-files',
  'property-files',
  true, -- Bucket público para acceso directo
  104857600, -- 100MB límite por archivo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Política RLS: Usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-files' AND
  auth.role() = 'authenticated'
);

-- Política RLS: Usuarios autenticados pueden leer archivos
CREATE POLICY "Authenticated users can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-files' AND
  auth.role() = 'authenticated'
);

-- Política RLS: Usuarios autenticados pueden actualizar sus propios archivos
CREATE POLICY "Authenticated users can update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-files' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'property-files' AND
  auth.role() = 'authenticated'
);

-- Política RLS: Usuarios autenticados pueden eliminar sus propios archivos
CREATE POLICY "Authenticated users can delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-files' AND
  auth.role() = 'authenticated'
);
