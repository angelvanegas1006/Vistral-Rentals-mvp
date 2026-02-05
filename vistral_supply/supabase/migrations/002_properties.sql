-- ============================================
-- Migración: Tabla properties para Supply app
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla properties si no existe
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY, -- ID from Airtable
  airtable_property_id TEXT,
  name TEXT,
  address TEXT,
  supply_phase TEXT CHECK (supply_phase IN ('pending', 'in-progress', 'review', 'completed', 'orphaned')),
  status TEXT,
  property_unique_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_update TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  -- Campos básicos de propiedad
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_meters NUMERIC(10, 2),
  type TEXT,
  -- Campos de sincronización con Airtable
  stage TEXT,
  responsible_owner TEXT,
  keys_location TEXT,
  pics_urls TEXT[] DEFAULT '{}',
  -- Campos adicionales que pueden venir de Airtable
  "Client Name" TEXT,
  "Client email" TEXT,
  "Hubspot ID" INTEGER
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_properties_supply_phase ON properties(supply_phase);
CREATE INDEX IF NOT EXISTS idx_properties_airtable_property_id ON properties(airtable_property_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_unique_id ON properties(property_unique_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_pics_urls ON properties USING GIN (pics_urls);

-- Habilitar RLS (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver propiedades
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
CREATE POLICY "Authenticated users can view properties"
  ON properties
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Solo admins pueden insertar/actualizar propiedades
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;
CREATE POLICY "Admins can manage properties"
  ON properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'supply_admin'
    )
  );

-- Política: Service role puede gestionar propiedades (para sincronización con Airtable)
DROP POLICY IF EXISTS "Service role can manage properties" ON properties;
CREATE POLICY "Service role can manage properties"
  ON properties
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ✅ Migración Completada
-- ============================================
