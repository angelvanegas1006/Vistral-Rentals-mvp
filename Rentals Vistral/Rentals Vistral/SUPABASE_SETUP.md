# Configuración de Supabase

## Paso 1: Crear archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# ============================================
# SUPABASE CONFIGURATION - VISTRAL DEV (RENTALS)
# ============================================

# URL del proyecto Supabase
# IMPORTANTE: Reemplaza con la URL real de tu proyecto (debe ser https://xufcueftpqfysilhauks.supabase.co)
NEXT_PUBLIC_SUPABASE_URL=https://xufcueftpqfysilhauks.supabase.co

# Clave pública (anon key) - Segura para usar en el cliente
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZmN1ZWZ0cHFmeXNpbGhhdWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTAyMjgsImV4cCI6MjA4Mzg2NjIyOH0.hfSz-02tcoLVQTGSB0X9tKBvzBKDTLLVxfto_wzS7QY

# Clave de servicio (service role key) - SOLO para server-side
# ⚠️ NUNCA exponer en el cliente, es secreta
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZmN1ZWZ0cHFmeXNpbGhhdWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI5MDIyOCwiZXhwIjoyMDgzODY2MjI4fQ.jtG1z_kWwqvibTkNeuFbRuXueyRQpuYtYCeWsyrAKzk
```

**NOTA IMPORTANTE**: Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` sea la URL correcta de tu proyecto. Debe ser algo como `https://xufcueftpqfysilhauks.supabase.co` (no la URL del dashboard).

## Paso 2: Instalar dependencias

Ejecuta en la terminal:

```bash
cd "/Users/manuelgomezvega/Desktop/Vistral-Rentals/Rentals Vistral"
npm install
```

## Paso 3: Crear tablas en Supabase

Ejecuta las siguientes queries SQL en el editor SQL de Supabase:

### 3.1 Tabla `leads`

```sql
-- Crear tabla leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  zone TEXT,
  current_phase TEXT NOT NULL,
  days_in_phase INTEGER DEFAULT 0,
  called TEXT CHECK (called IN ('Si', 'No')),
  discarded TEXT CHECK (discarded IN ('Si', 'No')),
  scheduled_date DATE,
  visit_date DATE,
  qualified TEXT CHECK (qualified IN ('Si', 'No')),
  average_income NUMERIC,
  finaer_status TEXT,
  number_of_occupants INTEGER,
  needs_update BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_leads_current_phase ON leads(current_phase);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(id);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Tabla `lead_properties`

```sql
-- Crear tabla lead_properties (relación muchos-a-muchos)
CREATE TABLE IF NOT EXISTS lead_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lead_id, property_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_lead_properties_lead_id ON lead_properties(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_properties_property_id ON lead_properties(property_id);

-- Nota: property_id hace referencia a properties.property_ref_id
-- Asegúrate de que la tabla properties tenga una columna property_ref_id
```

### 3.3 Verificar estructura de tabla `properties`

Antes de continuar, verifica que la tabla `properties` tenga los siguientes campos (o similares):

- `property_ref_id` (TEXT o VARCHAR) - ID único de la propiedad
- `address` (TEXT)
- `city` (TEXT, nullable)
- `region` (TEXT, nullable)
- `current_phase` (TEXT)
- `days_in_phase` (INTEGER)
- `is_expired` (BOOLEAN, nullable)
- `needs_update` (BOOLEAN, nullable)
- `property_type` (TEXT, nullable) - valores: 'light', 'medium', 'major'
- `manager_initials` (TEXT, nullable)
- `manager_name` (TEXT, nullable)
- `writing_date` (DATE, nullable)
- `visit_date` (DATE, nullable)
- `days_to_visit` (INTEGER, nullable)
- `days_to_start` (INTEGER, nullable)

Si faltan campos, puedes añadirlos con:

```sql
-- Ejemplo: Añadir columna si no existe
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_ref_id TEXT UNIQUE;

-- Añadir más columnas según sea necesario
```

## Paso 4: Políticas RLS (Row Level Security)

Por ahora, puedes deshabilitar RLS para desarrollo o crear políticas básicas:

```sql
-- Deshabilitar RLS temporalmente para desarrollo (NO recomendado para producción)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_properties DISABLE ROW LEVEL SECURITY;

-- O crear políticas básicas (recomendado)
-- Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow read access to leads" ON leads
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to leads" ON leads
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to leads" ON leads
  FOR DELETE USING (true);

-- Políticas similares para lead_properties
CREATE POLICY "Allow read access to lead_properties" ON lead_properties
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to lead_properties" ON lead_properties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete access to lead_properties" ON lead_properties
  FOR DELETE USING (true);
```

## Siguiente paso

Una vez creadas las tablas, el código de la aplicación podrá conectarse a Supabase y empezar a usar los datos reales.
