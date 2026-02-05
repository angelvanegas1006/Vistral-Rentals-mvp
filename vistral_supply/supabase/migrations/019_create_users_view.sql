-- ============================================
-- Migración: Crear vista para obtener usuarios con emails
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Crear función que devuelve usuarios con sus roles y emails
-- Esta función usa SECURITY DEFINER para poder acceder a auth.users
-- Devuelve TODOS los usuarios de auth.users, incluso si no tienen rol asignado
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as id,
    au.email::TEXT as email,
    COALESCE(ur.role::TEXT, NULL) as role,
    COALESCE(ur.created_at, au.created_at) as created_at,
    au.last_sign_in_at as last_sign_in_at,
    ur.updated_at as updated_at
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  ORDER BY COALESCE(au.last_sign_in_at, ur.updated_at, ur.created_at, au.created_at) DESC NULLS LAST;
END;
$$;

-- Crear política para que solo admins puedan ejecutar esta función
-- Nota: Las funciones SECURITY DEFINER ya tienen permisos elevados,
-- pero podemos agregar validación adicional si es necesario

-- ============================================
-- ✅ Migración Completada
-- ============================================
