-- ============================================
-- Migración: Tabla address con geography_id
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla address (direcciones separadas con referencia a geographies)
CREATE TABLE IF NOT EXISTS address (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  geography_id UUID, -- FK a geographies-v2 (se creará cuando se implemente geographies)
  -- Campos de dirección (se mantienen en property también para compatibilidad)
  address_line TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  -- Campos adicionales para dirección detallada
  planta TEXT,
  puerta TEXT,
  bloque TEXT,
  escalera TEXT,
  -- Coordenadas geográficas
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Una propiedad tiene una dirección principal
  UNIQUE(property_id)
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_address_property_id ON address(property_id);
CREATE INDEX IF NOT EXISTS idx_address_geography_id ON address(geography_id);
CREATE INDEX IF NOT EXISTS idx_address_postal_code ON address(postal_code);
CREATE INDEX IF NOT EXISTS idx_address_city ON address(city);
CREATE INDEX IF NOT EXISTS idx_address_country ON address(country);

-- Habilitar RLS (Row Level Security)
ALTER TABLE address ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver direcciones
DROP POLICY IF EXISTS "Authenticated users can view addresses" ON address;
CREATE POLICY "Authenticated users can view addresses"
  ON address
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar direcciones
DROP POLICY IF EXISTS "Authenticated users can manage addresses" ON address;
CREATE POLICY "Authenticated users can manage addresses"
  ON address
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update addresses"
  ON address
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar direcciones
DROP POLICY IF EXISTS "Service role can manage addresses" ON address;
CREATE POLICY "Service role can manage addresses"
  ON address
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_address_updated_at ON address;
CREATE TRIGGER trigger_update_address_updated_at
  BEFORE UPDATE ON address
  FOR EACH ROW
  EXECUTE FUNCTION update_address_updated_at();

-- ============================================
-- ✅ Migración Completada
-- ============================================
