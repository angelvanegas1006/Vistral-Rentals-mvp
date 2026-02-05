-- Migration: Create Check, Comment, and Commercialization Impact Fields
-- Date: 2026-02-04
-- Description: Creates all fields for Phase 2 "Listo para Alquilar" inspection:
--              - Check fields (check_*): Status of each room/area
--              - Comment fields (comment_*): Comments when status is "incident"
--              - Commercialization impact fields (affects_commercialization_*): Whether incident affects marketing

-- ============================================================================
-- CHECK FIELDS (Estado de Estancias)
-- ============================================================================
-- Valores posibles: 'good' = Buen estado, 'incident' = Con incidencias, NULL = No evaluado

-- Check - Entorno y zonas comunes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_common_areas TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_common_areas IS 
'Estado de entorno y zonas comunes. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado';

-- Check - Entrada y pasillos
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_entry_hallways TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_entry_hallways IS 
'Estado de entrada y pasillos. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado';

-- Check - Habitaciones (array de textos, una por habitación)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.check_bedrooms IS 
'Estado de habitaciones. JSONB array de textos: "good" o "incident". Cada índice corresponde a una habitación.';

-- Check - Salón
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_living_room TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_living_room IS 
'Estado del salón. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado';

-- Check - Baños (array de textos, uno por baño)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.check_bathrooms IS 
'Estado de baños. JSONB array de textos: "good" o "incident". Cada índice corresponde a un baño.';

-- Check - Cocina
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_kitchen TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_kitchen IS 
'Estado de la cocina. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado';

-- Check - Exteriores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_exterior TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_exterior IS 
'Estado de exteriores. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado';

-- Check - Garaje
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_garage TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_garage IS 
'Estado del garaje. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado. Solo se usa si la propiedad tiene garaje.';

-- Check - Terraza
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_terrace TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_terrace IS 
'Estado de la terraza. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado. Solo se usa si la propiedad tiene terraza.';

-- Check - Trastero
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS check_storage TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.check_storage IS 
'Estado del trastero. Valores: "good" = Buen estado, "incident" = Con incidencias, NULL = No evaluado. Solo se usa si la propiedad tiene trastero.';

-- ============================================================================
-- COMMENT FIELDS (Comentarios de Incidencias)
-- ============================================================================
-- Se usan cuando el estado es "incident"

-- Comment - Entorno y zonas comunes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_common_areas TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_common_areas IS 
'Comentario sobre incidencias en entorno y zonas comunes. Se usa cuando check_common_areas = "incident".';

-- Comment - Entrada y pasillos
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_entry_hallways TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_entry_hallways IS 
'Comentario sobre incidencias en entrada y pasillos. Se usa cuando check_entry_hallways = "incident".';

-- Comment - Habitaciones (array de textos, uno por habitación)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.comment_bedrooms IS 
'Comentarios sobre incidencias en habitaciones. JSONB array de textos. Cada índice corresponde a una habitación. Se usa cuando check_bedrooms contiene "incident".';

-- Comment - Salón
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_living_room TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_living_room IS 
'Comentario sobre incidencias en el salón. Se usa cuando check_living_room = "incident".';

-- Comment - Baños (array de textos, uno por baño)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.comment_bathrooms IS 
'Comentarios sobre incidencias en baños. JSONB array de textos. Cada índice corresponde a un baño. Se usa cuando check_bathrooms contiene "incident".';

-- Comment - Cocina
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_kitchen TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_kitchen IS 
'Comentario sobre incidencias en la cocina. Se usa cuando check_kitchen = "incident".';

-- Comment - Exteriores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_exterior TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_exterior IS 
'Comentario sobre incidencias en exteriores. Se usa cuando check_exterior = "incident".';

-- Comment - Garaje
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_garage TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_garage IS 
'Comentario sobre incidencias en el garaje. Se usa cuando check_garage = "incident". Solo se usa si la propiedad tiene garaje.';

-- Comment - Terraza
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_terrace TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_terrace IS 
'Comentario sobre incidencias en la terraza. Se usa cuando check_terrace = "incident". Solo se usa si la propiedad tiene terraza.';

-- Comment - Trastero
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS comment_storage TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.comment_storage IS 
'Comentario sobre incidencias en el trastero. Se usa cuando check_storage = "incident". Solo se usa si la propiedad tiene trastero.';

-- ============================================================================
-- COMMERCIALIZATION IMPACT FIELDS (Impacto en Comercialización)
-- ============================================================================
-- Se usan cuando hay incidencias (check_* = "incident")
-- Valores: true = Sí afecta la comercialización, false = No afecta, NULL = No aplica

-- Affects Commercialization - Entorno y zonas comunes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_common_areas BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_common_areas IS 
'¿Afecta la comercialización? - Entorno y zonas comunes. true = Sí, false = No, NULL = No aplica. Se usa cuando check_common_areas = "incident".';

-- Affects Commercialization - Entrada y pasillos
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_entry_hallways BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_entry_hallways IS 
'¿Afecta la comercialización? - Entrada y pasillos. true = Sí, false = No, NULL = No aplica. Se usa cuando check_entry_hallways = "incident".';

-- Affects Commercialization - Habitaciones (array de booleanos, uno por habitación)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_bedrooms IS 
'¿Afecta la comercialización? - Habitaciones. JSONB array de booleanos. Cada índice corresponde a una habitación. Se usa cuando check_bedrooms contiene "incident".';

-- Affects Commercialization - Salón
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_living_room BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_living_room IS 
'¿Afecta la comercialización? - Salón. true = Sí, false = No, NULL = No aplica. Se usa cuando check_living_room = "incident".';

-- Affects Commercialization - Baños (array de booleanos, uno por baño)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_bathrooms IS 
'¿Afecta la comercialización? - Baños. JSONB array de booleanos. Cada índice corresponde a un baño. Se usa cuando check_bathrooms contiene "incident".';

-- Affects Commercialization - Cocina
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_kitchen BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_kitchen IS 
'¿Afecta la comercialización? - Cocina. true = Sí, false = No, NULL = No aplica. Se usa cuando check_kitchen = "incident".';

-- Affects Commercialization - Exteriores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_exterior BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_exterior IS 
'¿Afecta la comercialización? - Exteriores. true = Sí, false = No, NULL = No aplica. Se usa cuando check_exterior = "incident".';

-- Affects Commercialization - Garaje
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_garage BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_garage IS 
'¿Afecta la comercialización? - Garaje. true = Sí, false = No, NULL = No aplica. Se usa cuando check_garage = "incident". Solo se usa si la propiedad tiene garaje.';

-- Affects Commercialization - Terraza
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_terrace BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_terrace IS 
'¿Afecta la comercialización? - Terraza. true = Sí, false = No, NULL = No aplica. Se usa cuando check_terrace = "incident". Solo se usa si la propiedad tiene terraza.';

-- Affects Commercialization - Trastero
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS affects_commercialization_storage BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.affects_commercialization_storage IS 
'¿Afecta la comercialización? - Trastero. true = Sí, false = No, NULL = No aplica. Se usa cuando check_storage = "incident". Solo se usa si la propiedad tiene trastero.';

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
  -- Check fields
  'check_common_areas',
  'check_entry_hallways',
  'check_bedrooms',
  'check_living_room',
  'check_bathrooms',
  'check_kitchen',
  'check_exterior',
  'check_garage',
  'check_terrace',
  'check_storage',
  -- Comment fields
  'comment_common_areas',
  'comment_entry_hallways',
  'comment_bedrooms',
  'comment_living_room',
  'comment_bathrooms',
  'comment_kitchen',
  'comment_exterior',
  'comment_garage',
  'comment_terrace',
  'comment_storage',
  -- Commercialization impact fields
  'affects_commercialization_common_areas',
  'affects_commercialization_entry_hallways',
  'affects_commercialization_bedrooms',
  'affects_commercialization_living_room',
  'affects_commercialization_bathrooms',
  'affects_commercialization_kitchen',
  'affects_commercialization_exterior',
  'affects_commercialization_garage',
  'affects_commercialization_terrace',
  'affects_commercialization_storage'
)
ORDER BY column_name;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Estructura de datos:
-- - Campos TEXT: Para estancias simples (common_areas, entry_hallways, living_room, kitchen, exterior)
-- - Campos JSONB: Para estancias múltiples (bedrooms, bathrooms) - arrays dinámicos
-- - Campos condicionales: garage, terrace, storage - solo se usan si la propiedad tiene estas características
--
-- Flujo de uso:
-- 1. Se establece el estado (check_*) como "good" o "incident"
-- 2. Si es "incident", se requiere:
--    - comment_* con descripción de la incidencia
--    - incident_photos_* con fotos de la incidencia
--    - affects_commercialization_* indicando si bloquea la comercialización
-- 3. Si affects_commercialization_* = false, también se requieren marketing_photos_* para comercializar
