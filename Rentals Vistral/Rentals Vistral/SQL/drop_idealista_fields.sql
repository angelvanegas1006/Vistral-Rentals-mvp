-- Migration: Drop Idealista Fields
-- Date: 2026-02-04
-- Description: Removes Idealista-specific fields from properties table
--              These fields are no longer used in Phase 2 "Listo para Alquilar"

-- ============================================================================
-- DROP COLUMNS
-- ============================================================================

-- Drop idealista_price
ALTER TABLE properties 
DROP COLUMN IF EXISTS idealista_price;

-- Drop idealista_address
ALTER TABLE properties 
DROP COLUMN IF EXISTS idealista_address;

-- Drop idealista_city
ALTER TABLE properties 
DROP COLUMN IF EXISTS idealista_city;

-- Drop idealista_photos
ALTER TABLE properties 
DROP COLUMN IF EXISTS idealista_photos;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las columnas fueron eliminadas correctamente
-- Esta consulta debería retornar 0 filas si las columnas fueron eliminadas
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN (
  'idealista_price',
  'idealista_address',
  'idealista_city',
  'idealista_photos'
)
ORDER BY column_name;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Campos eliminados:
--   - idealista_price: Precio para Idealista
--   - idealista_address: Dirección para Idealista
--   - idealista_city: Ciudad para Idealista
--   - idealista_photos: Fotos para Idealista (array de URLs)
--
-- Nota: El campo idealista_description se mantiene ya que es parte de la Sección 4
--       "Lanzamiento Comercial" y se usa para la descripción del anuncio.
