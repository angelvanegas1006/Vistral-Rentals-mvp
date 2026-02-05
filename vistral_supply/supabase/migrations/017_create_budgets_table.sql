-- ============================================
-- Migración: Crear tabla budgets para Renovator Analyst
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12, 2),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  notes TEXT
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_budgets_property_id ON budgets(property_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_budgets_is_current ON budgets(is_current);
CREATE INDEX IF NOT EXISTS idx_budgets_property_current ON budgets(property_id, is_current) WHERE is_current = true;

-- Crear función para desactivar versiones anteriores cuando se crea una nueva
CREATE OR REPLACE FUNCTION deactivate_previous_budgets()
RETURNS TRIGGER AS $$
BEGIN
  -- Desactivar todas las versiones anteriores de presupuestos para esta propiedad
  UPDATE budgets
  SET is_current = false, updated_at = NOW()
  WHERE property_id = NEW.property_id
    AND id != NEW.id
    AND is_current = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para desactivar versiones anteriores automáticamente
DROP TRIGGER IF EXISTS trigger_deactivate_previous_budgets ON budgets;
CREATE TRIGGER trigger_deactivate_previous_budgets
  BEFORE INSERT ON budgets
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION deactivate_previous_budgets();

-- Habilitar RLS (Row Level Security)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver presupuestos
DROP POLICY IF EXISTS "Authenticated users can view budgets" ON budgets;
CREATE POLICY "Authenticated users can view budgets"
  ON budgets
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Renovator Analyst y Reno Lead pueden crear/actualizar presupuestos
DROP POLICY IF EXISTS "Renovator roles can manage budgets" ON budgets;
CREATE POLICY "Renovator roles can manage budgets"
  ON budgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('renovator_analyst', 'reno_lead', 'supply_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('renovator_analyst', 'reno_lead', 'supply_admin')
    )
  );

-- Política: Service role puede gestionar presupuestos
DROP POLICY IF EXISTS "Service role can manage budgets" ON budgets;
CREATE POLICY "Service role can manage budgets"
  ON budgets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ✅ Migración Completada
-- ============================================
