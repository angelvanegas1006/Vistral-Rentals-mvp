-- ============================================
-- Migración: Agregar campos para Supply Analyst Kanban
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Agregar campo assigned_to para asignar propiedades a Supply Analysts
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Agregar campo tags (JSONB) para tags como "Unit", "Flip", "Fast Track", "Need addendum"
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Agregar campo corrections_count para número de correcciones pendientes
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS corrections_count INTEGER DEFAULT 0;

-- Agregar campo total_investment para inversión total
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS total_investment NUMERIC(12, 2);

-- Agregar campo rejection_reasons (JSONB) para razones de rechazo
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rejection_reasons JSONB DEFAULT '[]'::jsonb;

-- Agregar campo analyst_status para el estado específico del Supply Analyst
-- Valores posibles: backlog, under-review, needs-correction, renovation-estimation, 
-- financial-analysis, in-negotiation, arras, done, rejected
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS analyst_status TEXT;

-- Crear índice en assigned_to para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_properties_assigned_to ON properties(assigned_to);

-- Crear índice en analyst_status para filtrado rápido
CREATE INDEX IF NOT EXISTS idx_properties_analyst_status ON properties(analyst_status);

-- Crear índice GIN en tags para búsquedas eficientes en JSONB
CREATE INDEX IF NOT EXISTS idx_properties_tags ON properties USING GIN(tags);

-- Crear índice GIN en rejection_reasons para búsquedas eficientes en JSONB
CREATE INDEX IF NOT EXISTS idx_properties_rejection_reasons ON properties USING GIN(rejection_reasons);

-- ============================================
-- ✅ Migración Completada
-- ============================================
