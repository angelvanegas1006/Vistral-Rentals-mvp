-- ============================================
-- Migración: Corregir constraint de user_roles para incluir todos los roles
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Eliminar el constraint existente
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Agregar el constraint con todos los roles permitidos
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN (
  'supply_partner', 
  'supply_analyst', 
  'supply_admin',
  'supply_lead',
  'renovator_analyst',
  'reno_lead'
));

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- 
-- Ahora puedes asignar el rol 'renovator_analyst' al usuario renouser@prophero.com
-- ejecutando:
-- 
-- UPDATE user_roles 
-- SET role = 'renovator_analyst' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'renouser@prophero.com');
-- ============================================
