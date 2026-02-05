-- Migration: Create Phase 2 "Listo para Alquilar" Fields
-- Date: 2026-02-03
-- Description: Creates all database fields needed for Phase 2 "Listo para Alquilar" implementation
--              Includes: Client Presentation, Pricing Strategy, Technical Inspection, Commercial Launch

-- ============================================================================
-- SECCIÓN 1: PRESENTACIÓN AL CLIENTE
-- ============================================================================

-- ¿Se ha realizado la presentación del servicio al cliente?
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS client_presentation_done BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.client_presentation_done IS 
'Indica si se ha realizado la presentación del servicio al cliente. NULL = no respondido, true = Sí, false = No';

-- Fecha de presentación (se autocompleta con fecha de hoy cuando se marca "Sí")
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS client_presentation_date DATE DEFAULT NULL;

COMMENT ON COLUMN properties.client_presentation_date IS 
'Fecha en que se realizó la presentación del servicio al cliente. Se autocompleta con la fecha actual cuando client_presentation_done = true';

-- Canal de comunicación utilizado
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS client_presentation_channel TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.client_presentation_channel IS 
'Canal de comunicación utilizado para la presentación. Valores: "Llamada telefónica", "Correo electrónico", "Ambos"';

-- ============================================================================
-- SECCIÓN 2: ESTRATEGIA DE PRECIO
-- ============================================================================

-- ¿Ha aprobado el cliente este precio de publicación?
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS price_approval BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.price_approval IS 
'Indica si el cliente ha aprobado el precio de publicación (announcement_price). NULL = no respondido, true = Sí, false = No';

-- Nota: Los campos announcement_price, target_rent_price, expected_yield ya existen en la tabla

-- ============================================================================
-- SECCIÓN 3: INSPECCIÓN TÉCNICA Y REPORTAJE
-- ============================================================================
-- Fotos de incidencias (fotos técnicas/feas del daño)
-- Estas son diferentes de las fotos comerciales (photos_*) que ya existen
-- 
-- NOTA: Las fotos comerciales ya están implementadas y se guardan en:
--   Bucket: properties-public-docs
--   Folders: photos/marketing/{estancia}/ (ej: photos/marketing/common_areas/, photos/marketing/bedrooms/)
--
-- Las fotos de incidencias se guardarán en:
--   Bucket: properties-public-docs  
--   Folders: photos/incidents/{estancia}/ (ej: photos/incidents/common_areas/, photos/incidents/bedrooms/)

-- Fotos de incidencias - Entorno y zonas comunes
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_common_areas JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_common_areas IS 
'Array de URLs de fotos de incidencias para entorno y zonas comunes. JSONB array de strings.';

-- Fotos de incidencias - Entrada y pasillos
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_entry_hallways JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_entry_hallways IS 
'Array de URLs de fotos de incidencias para entrada y pasillos. JSONB array de strings.';

-- Fotos de incidencias - Habitaciones (array de arrays, una por habitación)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_bedrooms IS 
'Array de arrays de URLs de fotos de incidencias para habitaciones. JSONB array de arrays de strings. Cada índice corresponde a una habitación.';

-- Fotos de incidencias - Salón
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_living_room JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_living_room IS 
'Array de URLs de fotos de incidencias para salón. JSONB array de strings.';

-- Fotos de incidencias - Baños (array de arrays, uno por baño)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_bathrooms IS 
'Array de arrays de URLs de fotos de incidencias para baños. JSONB array de arrays de strings. Cada índice corresponde a un baño.';

-- Fotos de incidencias - Cocina
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_kitchen JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_kitchen IS 
'Array de URLs de fotos de incidencias para cocina. JSONB array de strings.';

-- Fotos de incidencias - Exteriores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_exterior JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_exterior IS 
'Array de URLs de fotos de incidencias para exteriores. JSONB array de strings.';

-- Fotos de incidencias - Garaje (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_garage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_garage IS 
'Array de URLs de fotos de incidencias para garaje. JSONB array de strings. Solo se usa si la propiedad tiene garaje.';

-- Fotos de incidencias - Terraza (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_terrace JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_terrace IS 
'Array de URLs de fotos de incidencias para terraza. JSONB array de strings. Solo se usa si la propiedad tiene terraza.';

-- Fotos de incidencias - Trastero (condicional)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS incident_photos_storage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.incident_photos_storage IS 
'Array de URLs de fotos de incidencias para trastero. JSONB array de strings. Solo se usa si la propiedad tiene trastero.';

-- Marketing Photos (Fotos comerciales/marketing)
-- Estas fotos se guardan en: Bucket: properties-public-docs, Folders: photos/marketing/{estancia}/
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_common_areas JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_common_areas IS 
'Array de URLs de fotos comerciales/marketing para entorno y zonas comunes. JSONB array de strings.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_entry_hallways JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_entry_hallways IS 
'Array de URLs de fotos comerciales/marketing para entrada y pasillos. JSONB array de strings.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_bedrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_bedrooms IS 
'Array de arrays de URLs de fotos comerciales/marketing para habitaciones. JSONB array de arrays de strings. Cada índice corresponde a una habitación.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_living_room JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_living_room IS 
'Array de URLs de fotos comerciales/marketing para salón. JSONB array de strings.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_bathrooms JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_bathrooms IS 
'Array de arrays de URLs de fotos comerciales/marketing para baños. JSONB array de arrays de strings. Cada índice corresponde a un baño.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_kitchen JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_kitchen IS 
'Array de URLs de fotos comerciales/marketing para cocina. JSONB array de strings.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_exterior JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_exterior IS 
'Array de URLs de fotos comerciales/marketing para exteriores. JSONB array de strings.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_garage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_garage IS 
'Array de URLs de fotos comerciales/marketing para garaje. JSONB array de strings. Solo se usa si la propiedad tiene garaje.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_terrace JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_terrace IS 
'Array de URLs de fotos comerciales/marketing para terraza. JSONB array de strings. Solo se usa si la propiedad tiene terraza.';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS marketing_photos_storage JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.marketing_photos_storage IS 
'Array de URLs de fotos comerciales/marketing para trastero. JSONB array de strings. Solo se usa si la propiedad tiene trastero.';

-- Nota: Los campos para estado (check_*), comentarios (comment_*), 
-- y afecta comercialización (affects_commercialization_*) ya existen en la tabla properties

-- ============================================================================
-- SECCIÓN 4: LANZAMIENTO COMERCIAL
-- ============================================================================

-- Publish Online (¿Publicar online?)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS publish_online BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN properties.publish_online IS 
'¿Se publicará la propiedad en portales inmobiliarios? Valores: true = Sí, false = No, NULL = No respondido';

-- Idealista Description (Descripción del inmueble para el anuncio)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS idealista_description TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.idealista_description IS 
'Descripción del inmueble para el anuncio. Texto descriptivo. Se usa cuando publish_online = "yes".';

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
  'client_presentation_done',
  'client_presentation_date',
  'client_presentation_channel',
  'price_approval',
  'marketing_photos_common_areas',
  'marketing_photos_entry_hallways',
  'marketing_photos_bedrooms',
  'marketing_photos_living_room',
  'marketing_photos_bathrooms',
  'marketing_photos_kitchen',
  'marketing_photos_exterior',
  'marketing_photos_garage',
  'marketing_photos_terrace',
  'marketing_photos_storage',
  'incident_photos_common_areas',
  'incident_photos_entry_hallways',
  'incident_photos_bedrooms',
  'incident_photos_living_room',
  'incident_photos_bathrooms',
  'incident_photos_kitchen',
  'incident_photos_exterior',
  'incident_photos_garage',
  'incident_photos_terrace',
  'incident_photos_storage'
)
ORDER BY column_name;

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

-- Criterios de Completitud por Sección:
--
-- Sección 1 (Presentación al Cliente):
--   Completa cuando: client_presentation_done = true 
--                  AND client_presentation_date IS NOT NULL 
--                  AND client_presentation_channel IS NOT NULL
--
-- Sección 2 (Estrategia de Precio):
--   Completa cuando: announcement_price > 0 
--                  AND price_approval = true
--
-- Sección 3 (Inspección Técnica):
--   Por estancia:
--     - Buen Estado: check_* = 'good' AND marketing_photos_* tiene fotos
--     - Con Incidencias Bloqueantes: check_* = 'incident' 
--                                   AND comment_* IS NOT NULL 
--                                   AND incident_photos_* tiene fotos
--                                   AND affects_commercialization_* = true
--     - Con Incidencias No Bloqueantes: check_* = 'incident' 
--                                     AND comment_* IS NOT NULL 
--                                     AND incident_photos_* tiene fotos
--                                     AND affects_commercialization_* = false
--                                     AND marketing_photos_* tiene fotos comerciales
--   Sección completa cuando TODAS las estancias están en:
--     - Buen Estado, O
--     - Con Incidencias No Bloqueantes
--   La sección NO está completa si alguna estancia tiene Incidencias Bloqueantes
--
-- Sección 4 (Lanzamiento Comercial):
--   Bloqueada hasta que Secciones 1, 2 y 3 estén completas
--   Completa cuando: publish_online = false 
--                  OR (publish_online = true AND idealista_description IS NOT NULL)
