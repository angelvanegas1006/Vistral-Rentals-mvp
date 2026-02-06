-- Migration: Refactor Technical Inspection to JSON
-- Date: 2026-02-05
-- Description: Elimina todas las columnas individuales de inspección técnica y las consolida
--              en un único campo JSONB technical_inspection_report que agrupa la información por estancia.
--              NO migra datos existentes - empezamos limpio con la nueva estructura.

-- ============================================================================
-- ELIMINAR COLUMNAS ANTIGUAS
-- ============================================================================

-- Eliminar columnas check_* (Estado de Estancias)
ALTER TABLE properties DROP COLUMN IF EXISTS check_common_areas;
ALTER TABLE properties DROP COLUMN IF EXISTS check_entry_hallways;
ALTER TABLE properties DROP COLUMN IF EXISTS check_bedrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS check_living_room;
ALTER TABLE properties DROP COLUMN IF EXISTS check_bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS check_kitchen;
ALTER TABLE properties DROP COLUMN IF EXISTS check_exterior;
ALTER TABLE properties DROP COLUMN IF EXISTS check_garage;
ALTER TABLE properties DROP COLUMN IF EXISTS check_terrace;
ALTER TABLE properties DROP COLUMN IF EXISTS check_storage;

-- Eliminar columnas comment_* (Comentarios)
ALTER TABLE properties DROP COLUMN IF EXISTS comment_common_areas;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_entry_hallways;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_bedrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_living_room;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_kitchen;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_exterior;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_garage;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_terrace;
ALTER TABLE properties DROP COLUMN IF EXISTS comment_storage;

-- Eliminar columnas affects_commercialization_* (Impacto en Comercialización)
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_common_areas;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_entry_hallways;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_bedrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_living_room;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_kitchen;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_exterior;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_garage;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_terrace;
ALTER TABLE properties DROP COLUMN IF EXISTS affects_commercialization_storage;

-- Eliminar columnas incident_photos_* (Fotos de Incidencias)
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_common_areas;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_entry_hallways;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_bedrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_living_room;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_kitchen;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_exterior;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_garage;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_terrace;
ALTER TABLE properties DROP COLUMN IF EXISTS incident_photos_storage;

-- Eliminar columnas marketing_photos_* (Fotos Comerciales/Marketing)
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_common_areas;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_entry_hallways;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_bedrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_living_room;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_kitchen;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_exterior;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_garage;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_terrace;
ALTER TABLE properties DROP COLUMN IF EXISTS marketing_photos_storage;

-- ============================================================================
-- CREAR NUEVA COLUMNA JSONB
-- ============================================================================

-- Crear columna technical_inspection_report
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS technical_inspection_report JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.technical_inspection_report IS 
'Reporte completo de inspección técnica agrupado por estancia. Estructura JSONB:
{
  "common_areas": {
    "status": "good" | "incident" | null,
    "comment": string | null,
    "affects_commercialization": boolean | null,
    "incident_photos": string[],
    "marketing_photos": string[]
  },
  "bedrooms": [
    { "status": ..., "comment": ..., "affects_commercialization": ..., "incident_photos": [...], "marketing_photos": [...] },
    ...
  ],
  ...
}
Estancias simples: common_areas, entry_hallways, living_room, kitchen, exterior, garage, terrace, storage
Estancias múltiples: bedrooms (array), bathrooms (array)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las columnas antiguas fueron eliminadas
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND (
  column_name LIKE 'check_%' OR
  column_name LIKE 'comment_%' OR
  column_name LIKE 'affects_commercialization_%' OR
  column_name LIKE 'incident_photos_%' OR
  column_name LIKE 'marketing_photos_%'
)
ORDER BY column_name;

-- Verificar que la nueva columna fue creada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'technical_inspection_report';

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Estructura del JSON:
-- - Estancias simples: Cada estancia tiene un objeto con sus datos
-- - Estancias múltiples (bedrooms, bathrooms): Array de objetos, uno por habitación/baño
-- - Campos condicionales: garage, terrace, storage solo se usan si la propiedad tiene estas características
--
-- Rutas de almacenamiento (NO cambian):
-- - Marketing photos: {property_unique_id}/photos/marketing/{estancia}/
-- - Incident photos: {property_unique_id}/photos/incidents/{estancia}/
--
-- Criterios de completitud (mismos que antes, pero ahora desde JSON):
-- - Buen Estado: status = "good" AND marketing_photos.length > 0
-- - Con Incidencias Bloqueantes: status = "incident" AND comment IS NOT NULL 
--                                AND incident_photos.length > 0 AND affects_commercialization = true
-- - Con Incidencias No Bloqueantes: status = "incident" AND comment IS NOT NULL 
--                                  AND incident_photos.length > 0 AND affects_commercialization = false
--                                  AND marketing_photos.length > 0
