-- Migration: Add comment submission history to existing records
-- Date: 2026-02-03
-- Description: Updates existing prophero_section_reviews to include commentSubmissionHistory
--              This script is safe to run multiple times (idempotent)

-- IMPORTANTE: Este script NO modifica los datos existentes, solo los prepara para la nueva estructura
-- La lógica de la aplicación se encargará de poblar el historial cuando se envíen nuevos comentarios

-- Verificar cuántas propiedades tienen prophero_section_reviews
SELECT 
  COUNT(*) as total_properties,
  COUNT(prophero_section_reviews) as properties_with_reviews
FROM properties
WHERE current_stage = 'Viviendas Prophero';

-- Verificar estructura actual de prophero_section_reviews
SELECT 
  property_unique_id,
  address,
  prophero_section_reviews
FROM properties
WHERE current_stage = 'Viviendas Prophero'
  AND prophero_section_reviews IS NOT NULL
LIMIT 5;

-- NOTA: No se requiere migración de datos existentes porque:
-- 1. El campo commentSubmissionHistory es opcional en _meta
-- 2. La aplicación lo creará automáticamente cuando se envíen comentarios
-- 3. Los datos existentes (submittedComments, snapshot) siguen siendo válidos

-- Si se desea verificar que la estructura es correcta después de actualizar:
-- SELECT 
--   property_unique_id,
--   address,
--   prophero_section_reviews->'_meta'->>'commentsSubmitted' as comments_submitted,
--   prophero_section_reviews->'_meta'->>'commentsSubmittedAt' as submitted_at,
--   jsonb_array_length(COALESCE(prophero_section_reviews->'_meta'->'commentSubmissionHistory', '[]'::jsonb)) as history_count
-- FROM properties
-- WHERE current_stage = 'Viviendas Prophero'
--   AND prophero_section_reviews IS NOT NULL;

-- Comentario final
COMMENT ON COLUMN properties.prophero_section_reviews IS 
'Stores review state for Prophero phase sections with complete submission history.
The commentSubmissionHistory field in _meta will be populated automatically by the application
when comments are submitted. No manual migration of existing data is required.';

-- Resultado esperado:
-- ✅ Estructura de datos actualizada en comentarios de la columna
-- ✅ Aplicación lista para guardar historial de comentarios
-- ✅ Datos existentes compatibles con nueva estructura
