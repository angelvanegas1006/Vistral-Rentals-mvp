-- ============================================
-- Migración: Tabla contacts centralizada
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear tabla contacts (tabla centralizada para todos los contactos)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone_country_code TEXT,
  phone_number TEXT,
  dni_nif_cif TEXT,
  is_operator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES auth.users(id),
  changed_by_user_id UUID REFERENCES auth.users(id)
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_dni_nif_cif ON contacts(dni_nif_cif);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_is_operator ON contacts(is_operator);

-- Habilitar RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver contactos
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;
CREATE POLICY "Authenticated users can view contacts"
  ON contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuarios autenticados pueden crear/actualizar contactos
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON contacts;
CREATE POLICY "Authenticated users can manage contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contacts"
  ON contacts
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Service role puede gestionar contactos
DROP POLICY IF EXISTS "Service role can manage contacts" ON contacts;
CREATE POLICY "Service role can manage contacts"
  ON contacts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- ============================================
-- ✅ Migración Completada
-- ============================================
