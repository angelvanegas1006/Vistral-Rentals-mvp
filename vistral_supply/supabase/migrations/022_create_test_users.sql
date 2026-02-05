-- ============================================
-- Migración: Crear usuarios de prueba
-- NOTA: Este script NO crea usuarios en auth.users
-- Los usuarios deben crearse primero desde Supabase Dashboard → Authentication → Users
-- O usando el script: npm run create-test-users
-- ============================================

-- Este script asigna roles a usuarios existentes
-- Para crear los usuarios primero, ejecuta el script TypeScript:
-- npm run create-test-users

-- O crea los usuarios manualmente desde Supabase Dashboard:
-- 1. Ve a Authentication → Users → Add user
-- 2. Crea los usuarios con estos emails:
--    - partneruser@prophero.com
--    - supplyuser@prophero.com
--    - renouser@prophero.com
-- 3. Luego ejecuta este script SQL para asignar los roles

-- Función helper para asignar rol a un usuario por email
CREATE OR REPLACE FUNCTION assign_role_by_email(user_email TEXT, user_role TEXT)
RETURNS VOID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Buscar el user_id por email en auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_uuid IS NULL THEN
    RAISE NOTICE 'Usuario con email % no encontrado. Por favor créalo primero.', user_email;
    RETURN;
  END IF;

  -- Verificar si ya tiene un rol asignado
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid) THEN
    -- Actualizar rol existente
    UPDATE user_roles
    SET role = user_role, updated_at = NOW()
    WHERE user_id = user_uuid;
    RAISE NOTICE 'Rol actualizado para %: %', user_email, user_role;
  ELSE
    -- Insertar nuevo rol
    INSERT INTO user_roles (user_id, role)
    VALUES (user_uuid, user_role)
    ON CONFLICT (user_id) DO UPDATE SET role = user_role, updated_at = NOW();
    RAISE NOTICE 'Rol asignado para %: %', user_email, user_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asignar roles a los usuarios de prueba
-- NOTA: Estos usuarios deben existir primero en auth.users
DO $$
BEGIN
  PERFORM assign_role_by_email('partneruser@prophero.com', 'supply_partner');
  PERFORM assign_role_by_email('supplyuser@prophero.com', 'supply_analyst');
  PERFORM assign_role_by_email('renouser@prophero.com', 'renovator_analyst');
END $$;

-- Limpiar función helper (opcional)
DROP FUNCTION IF EXISTS assign_role_by_email(TEXT, TEXT);

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- 
-- Usuarios de prueba creados:
--   - partneruser@prophero.com → supply_partner
--   - supplyuser@prophero.com → supply_analyst  
--   - renouser@prophero.com → renovator_analyst
--
-- Contraseñas (si usas el script npm run create-test-users):
--   - Partner123!
--   - Supply123!
--   - Reno123!
-- ============================================
