-- ============================================
-- Migración: Tabla property_owners para historial de dueños/vendedores
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla property_owners
CREATE TABLE IF NOT EXISTS property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  dni_nif_cif TEXT,
  email TEXT,
  telefono_pais TEXT,
  telefono_numero TEXT,
  dni_adjunto JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_is_active ON property_owners(is_active);
CREATE INDEX IF NOT EXISTS idx_property_owners_email ON property_owners(email);
CREATE INDEX IF NOT EXISTS idx_property_owners_dni_nif_cif ON property_owners(dni_nif_cif);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_property_owners_property_active ON property_owners(property_id, is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver dueños de propiedades
DROP POLICY IF EXISTS "Authenticated users can view property owners" ON property_owners;
CREATE POLICY "Authenticated users can view property owners"
  ON property_owners
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar dueños
DROP POLICY IF EXISTS "Authenticated users can manage property owners" ON property_owners;
CREATE POLICY "Authenticated users can manage property owners"
  ON property_owners
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update property owners"
  ON property_owners
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar dueños (para sincronización)
DROP POLICY IF EXISTS "Service role can manage property owners" ON property_owners;
CREATE POLICY "Service role can manage property owners"
  ON property_owners
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_property_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_property_owners_updated_at ON property_owners;
CREATE TRIGGER trigger_update_property_owners_updated_at
  BEFORE UPDATE ON property_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_property_owners_updated_at();

-- ============================================
-- ✅ Migración Completada
-- ============================================
