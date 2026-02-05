-- ============================================
-- Migración: Crear tabla financial_estimates para simulaciones financieras
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla financial_estimates
CREATE TABLE IF NOT EXISTS financial_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  basic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  financing JSONB NOT NULL DEFAULT '{}'::jsonb,
  scenario_drivers JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  yield_threshold NUMERIC(5, 2) NOT NULL DEFAULT 5.50,
  meets_threshold BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_financial_estimates_property_id ON financial_estimates(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_estimates_is_current ON financial_estimates(is_current);
CREATE INDEX IF NOT EXISTS idx_financial_estimates_property_current ON financial_estimates(property_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_financial_estimates_version ON financial_estimates(property_id, version);

-- Crear función para desactivar versiones anteriores cuando se crea una nueva
CREATE OR REPLACE FUNCTION deactivate_previous_financial_estimates()
RETURNS TRIGGER AS $$
BEGIN
  -- Desactivar todas las versiones anteriores de estimates para esta propiedad
  UPDATE financial_estimates
  SET is_current = false, updated_at = NOW()
  WHERE property_id = NEW.property_id
    AND id != NEW.id
    AND is_current = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para desactivar versiones anteriores automáticamente
DROP TRIGGER IF EXISTS trigger_deactivate_previous_financial_estimates ON financial_estimates;
CREATE TRIGGER trigger_deactivate_previous_financial_estimates
  BEFORE INSERT ON financial_estimates
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION deactivate_previous_financial_estimates();

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_financial_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_financial_estimates_updated_at ON financial_estimates;
CREATE TRIGGER trigger_update_financial_estimates_updated_at
  BEFORE UPDATE ON financial_estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_estimates_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE financial_estimates ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver financial estimates
DROP POLICY IF EXISTS "Authenticated users can view financial estimates" ON financial_estimates;
CREATE POLICY "Authenticated users can view financial estimates"
  ON financial_estimates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Supply roles pueden crear/actualizar financial estimates
DROP POLICY IF EXISTS "Supply roles can manage financial estimates" ON financial_estimates;
CREATE POLICY "Supply roles can manage financial estimates"
  ON financial_estimates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_analyst', 'supply_lead', 'supply_admin', 'supply_project_analyst', 'supply_project_lead')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_analyst', 'supply_lead', 'supply_admin', 'supply_project_analyst', 'supply_project_lead')
    )
  );

-- Política: Service role puede gestionar financial estimates
DROP POLICY IF EXISTS "Service role can manage financial estimates" ON financial_estimates;
CREATE POLICY "Service role can manage financial estimates"
  ON financial_estimates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ✅ Migración Completada
-- ============================================
