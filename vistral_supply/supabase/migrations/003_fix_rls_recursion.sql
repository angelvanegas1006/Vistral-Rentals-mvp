-- ============================================
-- Migración: Corregir recursión infinita en políticas RLS
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Solución 1: Permitir que todos los usuarios autenticados puedan crear propiedades
-- (Más simple y práctico para el flujo de trabajo)

-- Eliminar la política problemática de properties
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;

-- Nueva política: Todos los usuarios autenticados pueden crear/actualizar propiedades
CREATE POLICY "Authenticated users can manage properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update properties"
  ON properties
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Mantener la política de SELECT existente
-- (Ya existe: "Authenticated users can view properties")

-- ============================================
-- Solución Alternativa (si necesitas restringir a admins):
-- Usar una función security definer para evitar recursión
-- ============================================

-- Crear función helper para verificar si el usuario es admin
-- Esta función se ejecuta con permisos de seguridad definer, evitando recursión
CREATE OR REPLACE FUNCTION is_supply_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'supply_admin'
  );
END;
$$;

-- Si prefieres la solución alternativa, descomenta estas líneas y comenta las políticas anteriores:

-- DROP POLICY IF EXISTS "Authenticated users can manage properties" ON properties;
-- DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;

-- CREATE POLICY "Admins can manage properties"
--   ON properties
--   FOR ALL
--   USING (is_supply_admin(auth.uid()));

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- 
-- Nota: La solución implementada permite que todos los usuarios autenticados
-- puedan crear y actualizar propiedades. Si necesitas restringir esto solo a admins,
-- descomenta las líneas de la "Solución Alternativa" arriba.
