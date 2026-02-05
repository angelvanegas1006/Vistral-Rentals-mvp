-- ============================================
-- Migración: Tabla property_corrections para sistema de correcciones
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla property_corrections
CREATE TABLE IF NOT EXISTS property_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('overview', 'condition', 'documents', 'contacts', 'rental')),
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'approved')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_property_corrections_property_id ON property_corrections(property_id);
CREATE INDEX IF NOT EXISTS idx_property_corrections_status ON property_corrections(status);
CREATE INDEX IF NOT EXISTS idx_property_corrections_created_by ON property_corrections(created_by);
CREATE INDEX IF NOT EXISTS idx_property_corrections_category ON property_corrections(category);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_property_corrections_property_status ON property_corrections(property_id, status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_property_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_property_corrections_updated_at
  BEFORE UPDATE ON property_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_property_corrections_updated_at();

-- Función para actualizar corrections_count en properties
CREATE OR REPLACE FUNCTION update_property_corrections_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar corrections_count con el número de correcciones pending o resolved
  UPDATE properties
  SET corrections_count = (
    SELECT COUNT(*)
    FROM property_corrections
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
      AND status IN ('pending', 'resolved')
  )
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar corrections_count automáticamente
CREATE TRIGGER trigger_update_corrections_count_on_insert
  AFTER INSERT ON property_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_property_corrections_count();

CREATE TRIGGER trigger_update_corrections_count_on_update
  AFTER UPDATE ON property_corrections
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_property_corrections_count();

CREATE TRIGGER trigger_update_corrections_count_on_delete
  AFTER DELETE ON property_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_property_corrections_count();

-- Habilitar RLS (Row Level Security)
ALTER TABLE property_corrections ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver correcciones de propiedades que pueden ver
DROP POLICY IF EXISTS "Authenticated users can view property corrections" ON property_corrections;
CREATE POLICY "Authenticated users can view property corrections"
  ON property_corrections
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_corrections.property_id
    )
  );

-- Política: Analistas y leads pueden crear correcciones
DROP POLICY IF EXISTS "Analysts can create corrections" ON property_corrections;
CREATE POLICY "Analysts can create corrections"
  ON property_corrections
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('supply_analyst', 'supply_lead', 'supply_admin')
    )
  );

-- Política: Partners pueden actualizar correcciones de sus propiedades (marcar como resolved)
DROP POLICY IF EXISTS "Partners can resolve corrections" ON property_corrections;
CREATE POLICY "Partners can resolve corrections"
  ON property_corrections
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_corrections.property_id
        AND properties.created_by = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'resolved' AND
    resolved_by = auth.uid() AND
    resolved_at IS NOT NULL
  );

-- Política: Analistas pueden aprobar correcciones
DROP POLICY IF EXISTS "Analysts can approve corrections" ON property_corrections;
CREATE POLICY "Analysts can approve corrections"
  ON property_corrections
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('supply_analyst', 'supply_lead', 'supply_admin')
    )
    AND status = 'resolved'
  )
  WITH CHECK (
    status = 'approved' AND
    approved_by = auth.uid() AND
    approved_at IS NOT NULL
  );

-- Política: Analistas pueden actualizar sus propias correcciones (solo descripción)
DROP POLICY IF EXISTS "Analysts can update own corrections" ON property_corrections;
CREATE POLICY "Analysts can update own corrections"
  ON property_corrections
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    status = 'pending'
  )
  WITH CHECK (
    created_by = auth.uid() AND
    status = 'pending'
  );

-- Política: Analistas pueden eliminar correcciones pendientes que crearon
DROP POLICY IF EXISTS "Analysts can delete own pending corrections" ON property_corrections;
CREATE POLICY "Analysts can delete own pending corrections"
  ON property_corrections
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    status = 'pending'
  );

-- ============================================
-- ✅ Migración Completada
-- ============================================
