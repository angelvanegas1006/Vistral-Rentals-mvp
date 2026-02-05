-- ============================================
-- Migración: Tabla property_contact para relaciones con roles
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear enum para roles de contacto en propiedades
CREATE TYPE property_contact_role AS ENUM (
  'seller',
  'tenant',
  'owner',
  'partner',
  'assigned_to',
  'created_by'
);

-- Crear tabla property_contact (relación muchos-a-muchos con roles)
CREATE TABLE IF NOT EXISTS property_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role property_contact_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- Campos específicos para sellers (opcional, pueden estar en contacts también)
  dni_adjunto JSONB DEFAULT '[]'::jsonb,
  -- Campos específicos para tenants (opcional)
  fecha_finalizacion_contrato DATE,
  periodo_preaviso INTEGER,
  subrogacion_contrato TEXT,
  importe_alquiler_transferir NUMERIC(10, 2),
  ultima_actualizacion_alquiler DATE,
  fecha_ultimo_recibo DATE,
  fecha_vencimiento_seguro_alquiler DATE,
  estado_seguro_alquiler TEXT,
  proveedor_seguro_alquiler TEXT,
  -- Archivos específicos del rol (JSONB arrays)
  dni_nie_files JSONB DEFAULT '[]'::jsonb,
  contrato_arrendamiento_files JSONB DEFAULT '[]'::jsonb,
  justificantes_pago_files JSONB DEFAULT '[]'::jsonb,
  comprobante_transferencia_vendedor_files JSONB DEFAULT '[]'::jsonb,
  justificante_deposito_files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  -- Constraint: un contacto puede tener solo un rol activo por propiedad
  UNIQUE(property_id, contact_id, role)
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_property_contact_property_id ON property_contact(property_id);
CREATE INDEX IF NOT EXISTS idx_property_contact_contact_id ON property_contact(contact_id);
CREATE INDEX IF NOT EXISTS idx_property_contact_role ON property_contact(role);
CREATE INDEX IF NOT EXISTS idx_property_contact_is_active ON property_contact(is_active);
CREATE INDEX IF NOT EXISTS idx_property_contact_property_role_active ON property_contact(property_id, role, is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE property_contact ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver relaciones property-contact
DROP POLICY IF EXISTS "Authenticated users can view property contacts" ON property_contact;
CREATE POLICY "Authenticated users can view property contacts"
  ON property_contact
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar relaciones
DROP POLICY IF EXISTS "Authenticated users can manage property contacts" ON property_contact;
CREATE POLICY "Authenticated users can manage property contacts"
  ON property_contact
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update property contacts"
  ON property_contact
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar relaciones
DROP POLICY IF EXISTS "Service role can manage property contacts" ON property_contact;
CREATE POLICY "Service role can manage property contacts"
  ON property_contact
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_property_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_property_contact_updated_at ON property_contact;
CREATE TRIGGER trigger_update_property_contact_updated_at
  BEFORE UPDATE ON property_contact
  FOR EACH ROW
  EXECUTE FUNCTION update_property_contact_updated_at();

-- ============================================
-- ✅ Migración Completada
-- ============================================
