-- ============================================
-- Migración: Corregir recursión infinita en políticas RLS de user_roles
-- Ejecutar en Supabase Dashboard → SQL Editor
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
  -- Esta función tiene permisos elevados, por lo que puede leer user_roles sin pasar por RLS
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'supply_admin'
  );
END;
$$;

-- Eliminar todas las políticas existentes de user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;

-- Política 1: Los usuarios pueden ver su propio rol (sin recursión)
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política 2: Solo admins pueden insertar/actualizar roles (usando función SECURITY DEFINER)
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (
    auth.role() = 'service_role' OR  -- Service role siempre puede
    is_supply_admin(auth.uid())      -- Usa función SECURITY DEFINER para evitar recursión
  )
  WITH CHECK (
    auth.role() = 'service_role' OR  -- Service role siempre puede
    is_supply_admin(auth.uid())      -- Usa función SECURITY DEFINER para evitar recursión
  );

-- Política 3: Permitir inserción durante creación de usuario (para service_role)
CREATE POLICY "Service role can manage roles"
  ON user_roles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- 
-- Esta migración corrige el error de recursión infinita usando una función
-- SECURITY DEFINER que puede leer user_roles sin pasar por las políticas RLS.
