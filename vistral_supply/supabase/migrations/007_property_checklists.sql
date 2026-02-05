-- ============================================
-- Migración: Tabla property_checklists para versionado de checklist
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla property_checklists
CREATE TABLE IF NOT EXISTS property_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL DEFAULT 'supply_initial',
  version INTEGER NOT NULL DEFAULT 1,
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_current BOOLEAN DEFAULT true
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_property_checklists_property_id ON property_checklists(property_id);
CREATE INDEX IF NOT EXISTS idx_property_checklists_is_current ON property_checklists(is_current);
CREATE INDEX IF NOT EXISTS idx_property_checklists_property_type ON property_checklists(property_id, checklist_type);
CREATE INDEX IF NOT EXISTS idx_property_checklists_version ON property_checklists(property_id, checklist_type, version);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_property_checklists_property_current ON property_checklists(property_id, checklist_type, is_current);

-- Habilitar RLS (Row Level Security)
ALTER TABLE property_checklists ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver checklists de propiedades
DROP POLICY IF EXISTS "Authenticated users can view property checklists" ON property_checklists;
CREATE POLICY "Authenticated users can view property checklists"
  ON property_checklists
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar checklists
DROP POLICY IF EXISTS "Authenticated users can manage property checklists" ON property_checklists;
CREATE POLICY "Authenticated users can manage property checklists"
  ON property_checklists
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update property checklists"
  ON property_checklists
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar checklists (para sincronización)
DROP POLICY IF EXISTS "Service role can manage property checklists" ON property_checklists;
CREATE POLICY "Service role can manage property checklists"
  ON property_checklists
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para marcar versiones anteriores como no-activas cuando se crea una nueva
CREATE OR REPLACE FUNCTION deactivate_previous_checklist_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está creando una nueva versión activa, desactivar todas las anteriores del mismo tipo
  IF NEW.is_current = true THEN
    UPDATE property_checklists
    SET is_current = false
    WHERE property_id = NEW.property_id
      AND checklist_type = NEW.checklist_type
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para desactivar versiones anteriores automáticamente
DROP TRIGGER IF EXISTS trigger_deactivate_previous_checklist_versions ON property_checklists;
CREATE TRIGGER trigger_deactivate_previous_checklist_versions
  BEFORE INSERT OR UPDATE ON property_checklists
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION deactivate_previous_checklist_versions();

-- Función para obtener la siguiente versión automáticamente
CREATE OR REPLACE FUNCTION get_next_checklist_version(p_property_id TEXT, p_checklist_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM property_checklists
  WHERE property_id = p_property_id AND checklist_type = p_checklist_type;
  
  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ✅ Migración Completada
-- ============================================
