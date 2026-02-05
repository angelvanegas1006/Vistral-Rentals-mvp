-- ============================================
-- Migración: Tabla property_tenants para historial de inquilinos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla property_tenants
CREATE TABLE IF NOT EXISTS property_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  email TEXT,
  telefono_pais TEXT,
  telefono_numero TEXT,
  dni_nie JSONB DEFAULT '[]'::jsonb,
  contrato_arrendamiento JSONB DEFAULT '[]'::jsonb,
  fecha_finalizacion_contrato DATE,
  periodo_preaviso INTEGER,
  subrogacion_contrato TEXT,
  importe_alquiler_transferir NUMERIC(10, 2),
  ultima_actualizacion_alquiler DATE,
  justificantes_pago JSONB DEFAULT '[]'::jsonb,
  fecha_ultimo_recibo DATE,
  comprobante_transferencia_vendedor JSONB DEFAULT '[]'::jsonb,
  justificante_deposito JSONB DEFAULT '[]'::jsonb,
  fecha_vencimiento_seguro_alquiler DATE,
  estado_seguro_alquiler TEXT,
  proveedor_seguro_alquiler TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_property_tenants_property_id ON property_tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_property_tenants_is_active ON property_tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_property_tenants_email ON property_tenants(email);
CREATE INDEX IF NOT EXISTS idx_property_tenants_fecha_finalizacion ON property_tenants(fecha_finalizacion_contrato);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_property_tenants_property_active ON property_tenants(property_id, is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE property_tenants ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver inquilinos de propiedades
DROP POLICY IF EXISTS "Authenticated users can view property tenants" ON property_tenants;
CREATE POLICY "Authenticated users can view property tenants"
  ON property_tenants
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar inquilinos
DROP POLICY IF EXISTS "Authenticated users can manage property tenants" ON property_tenants;
CREATE POLICY "Authenticated users can manage property tenants"
  ON property_tenants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update property tenants"
  ON property_tenants
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar inquilinos (para sincronización)
DROP POLICY IF EXISTS "Service role can manage property tenants" ON property_tenants;
CREATE POLICY "Service role can manage property tenants"
  ON property_tenants
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_property_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_property_tenants_updated_at ON property_tenants;
CREATE TRIGGER trigger_update_property_tenants_updated_at
  BEFORE UPDATE ON property_tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_property_tenants_updated_at();

-- ============================================
-- ✅ Migración Completada
-- ============================================
