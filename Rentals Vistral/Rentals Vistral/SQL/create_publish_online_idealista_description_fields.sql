-- Migration: Create publish_online and idealista_description Fields
-- Date: 2026-02-04
-- Description: Creates fields for Phase 2 "Listo para Alquilar" Section 4 "Lanzamiento Comercial"

-- ============================================================================
-- CREATE COLUMNS
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

-- Verificar que las columnas fueron creadas correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN (
  'publish_online',
  'idealista_description'
)
ORDER BY column_name;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Criterios de Completitud de la Sección 4:
--   La sección está bloqueada hasta que las Secciones 1, 2 y 3 estén completas.
--   La sección está completa cuando:
--     - publish_online = false O
--     - (publish_online = true AND idealista_description IS NOT NULL)
