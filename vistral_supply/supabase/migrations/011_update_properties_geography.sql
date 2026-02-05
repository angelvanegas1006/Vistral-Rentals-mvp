-- ============================================
-- Migración: Actualizar properties para incluir geography_id
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Agregar geography_id a properties (FK a geographies-v2)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS geography_id UUID;

-- Crear índice para geography_id
CREATE INDEX IF NOT EXISTS idx_properties_geography_id ON properties(geography_id);

-- Nota: La FK a geographies se agregará cuando se cree la tabla geographies-v2
-- ALTER TABLE properties ADD CONSTRAINT fk_properties_geography 
--   FOREIGN KEY (geography_id) REFERENCES geographies(id);

-- ============================================
-- ✅ Migración Completada
-- ============================================
