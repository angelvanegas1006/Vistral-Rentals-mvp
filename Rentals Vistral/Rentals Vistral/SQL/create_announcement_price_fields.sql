-- Migration: Create announcement_price field
-- Date: 2026-02-05
-- Description: Creates announcement_price field for Phase 2 "Listo para Alquilar" pricing strategy
--              This field is used in the pricing strategy section

-- ============================================================================
-- SECCIÓN 2: ESTRATEGIA DE PRECIO - Precio de Publicación
-- ============================================================================

-- Precio de publicación del anuncio
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS announcement_price NUMERIC DEFAULT NULL;

COMMENT ON COLUMN properties.announcement_price IS 
'Precio de publicación del anuncio. Valor numérico que representa el precio al que se publicará la propiedad. Usado en la Sección 2: Estrategia de Precio';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que la columna fue creada correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'announcement_price';

-- ============================================================================
-- NOTAS
-- ============================================================================

-- Este campo es parte de la Sección 2: Estrategia de Precio
-- La sección está completa cuando:
--   - announcement_price > 0 
--   - price_approval = true
--
-- Nota: Los campos target_rent_price y expected_yield ya existen en la tabla
