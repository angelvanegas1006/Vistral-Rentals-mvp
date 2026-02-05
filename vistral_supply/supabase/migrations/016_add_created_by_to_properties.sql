-- ============================================
-- Migración: Agregar campo created_by a properties
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Agregar columna created_by para rastrear quién creó la propiedad
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para búsquedas eficientes por creador
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);

-- ============================================
-- ✅ Migración Completada
-- ============================================
