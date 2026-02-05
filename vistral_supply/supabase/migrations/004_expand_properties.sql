-- ============================================
-- Migración: Expandir tabla properties con datos básicos completos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Agregar columnas para datos físicos de la propiedad
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS superficie_construida NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS superficie_util NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS ano_construccion INTEGER,
  ADD COLUMN IF NOT EXISTS referencia_catastral TEXT,
  ADD COLUMN IF NOT EXISTS habitaciones INTEGER,
  ADD COLUMN IF NOT EXISTS banos INTEGER,
  ADD COLUMN IF NOT EXISTS plazas_aparcamiento INTEGER,
  ADD COLUMN IF NOT EXISTS ascensor BOOLEAN,
  ADD COLUMN IF NOT EXISTS balcon_terraza BOOLEAN,
  ADD COLUMN IF NOT EXISTS trastero BOOLEAN,
  ADD COLUMN IF NOT EXISTS orientacion JSONB DEFAULT '[]'::jsonb;

-- Agregar columnas para información económica
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS gastos_comunidad NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS confirmacion_gastos_comunidad BOOLEAN,
  ADD COLUMN IF NOT EXISTS ibi_anual NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS confirmacion_ibi BOOLEAN;

-- Agregar columnas para estado legal y comunidad
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS comunidad_propietarios_constituida BOOLEAN,
  ADD COLUMN IF NOT EXISTS edificio_seguro_activo BOOLEAN,
  ADD COLUMN IF NOT EXISTS comercializa_exclusiva BOOLEAN,
  ADD COLUMN IF NOT EXISTS edificio_ite_favorable BOOLEAN,
  ADD COLUMN IF NOT EXISTS propiedad_alquilada BOOLEAN,
  ADD COLUMN IF NOT EXISTS situacion_inquilinos TEXT;

-- Agregar columna para documentación mínima (JSONB)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS documentacion_minima JSONB DEFAULT '{}'::jsonb;

-- Agregar columnas adicionales para dirección detallada
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS planta TEXT,
  ADD COLUMN IF NOT EXISTS puerta TEXT,
  ADD COLUMN IF NOT EXISTS bloque TEXT,
  ADD COLUMN IF NOT EXISTS escalera TEXT;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_properties_habitaciones ON properties(habitaciones);
CREATE INDEX IF NOT EXISTS idx_properties_banos ON properties(banos);
CREATE INDEX IF NOT EXISTS idx_properties_precio_venta ON properties(precio_venta);
CREATE INDEX IF NOT EXISTS idx_properties_propiedad_alquilada ON properties(propiedad_alquilada);
CREATE INDEX IF NOT EXISTS idx_properties_situacion_inquilinos ON properties(situacion_inquilinos);

-- ============================================
-- ✅ Migración Completada
-- ============================================
