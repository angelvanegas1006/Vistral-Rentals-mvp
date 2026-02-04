-- Migration: Create Marketing Photos Fields
-- Date: 2026-02-04
-- Description: Creates all marketing/commercial photo columns for Phase 2 "Listo para Alquilar"
--              These fields store URLs of marketing photos used for property listings and advertisements

-- ============================================================================
-- CREATE MARKETING PHOTOS COLUMNS
-- ============================================================================

-- Marketing Photos - Entorno y zonas comunes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_common_areas JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_common_areas IS 
'Array de URLs de fotos comerciales/marketing para entorno y zonas comunes. JSONB array de strings.';

-- Marketing Photos - Entrada y pasillos
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_entry_hallways JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_entry_hallways IS 
'Array de URLs de fotos comerciales/marketing para entrada y pasillos. JSONB array de strings.';

-- Marketing Photos - Habitaciones (array de arrays, una por habitación)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_bedrooms IS 
'Array de arrays de URLs de fotos comerciales/marketing para habitaciones. JSONB array de arrays de strings. Cada índice corresponde a una habitación.';

-- Marketing Photos - Salón
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_living_room JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_living_room IS 
'Array de URLs de fotos comerciales/marketing para salón. JSONB array de strings.';

-- Marketing Photos - Baños (array de arrays, uno por baño)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_bathrooms IS 
'Array de arrays de URLs de fotos comerciales/marketing para baños. JSONB array de arrays de strings. Cada índice corresponde a un baño.';

-- Marketing Photos - Cocina
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_kitchen JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_kitchen IS 
'Array de URLs de fotos comerciales/marketing para cocina. JSONB array de strings.';

-- Marketing Photos - Exteriores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_exterior JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_exterior IS 
'Array de URLs de fotos comerciales/marketing para exteriores. JSONB array de strings.';

-- Marketing Photos - Garaje (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_garage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_garage IS 
'Array de URLs de fotos comerciales/marketing para garaje. JSONB array de strings. Solo se usa si la propiedad tiene garaje.';

-- Marketing Photos - Terraza (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_terrace JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_terrace IS 
'Array de URLs de fotos comerciales/marketing para terraza. JSONB array de strings. Solo se usa si la propiedad tiene terraza.';

-- Marketing Photos - Trastero (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_storage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_storage IS 
'Array de URLs de fotos comerciales/marketing para trastero. JSONB array de strings. Solo se usa si la propiedad tiene trastero.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que todas las columnas fueron creadas correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN (
  'marketing_photos_common_areas',
  'marketing_photos_entry_hallways',
  'marketing_photos_bedrooms',
  'marketing_photos_living_room',
  'marketing_photos_bathrooms',
  'marketing_photos_kitchen',
  'marketing_photos_exterior',
  'marketing_photos_garage',
  'marketing_photos_terrace',
  'marketing_photos_storage'
)
ORDER BY column_name;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Estas fotos se guardan en:
--   Bucket: properties-public-docs
--   Folders: photos/marketing/{estancia}/ (ej: photos/marketing/common_areas/, photos/marketing/bedrooms/)
--
-- Son diferentes de las fotos de incidencias (incident_photos_*) que se guardan en:
--   Bucket: properties-public-docs
--   Folders: photos/incidents/{estancia}/ (ej: photos/incidents/common_areas/, photos/incidents/bedrooms/)
