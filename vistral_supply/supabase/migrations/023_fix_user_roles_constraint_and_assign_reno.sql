-- ============================================
-- Migración: Corregir constraint de user_roles y asignar rol a usuario reno
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

-- Asignar rol renovator_analyst al usuario renouser@prophero.com si existe
INSERT INTO user_roles (user_id, role)
SELECT id, 'renovator_analyst'
FROM auth.users
WHERE email = 'renouser@prophero.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'renovator_analyst', updated_at = NOW();

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- 
-- El constraint ahora permite todos los roles incluyendo 'renovator_analyst'
-- El usuario renouser@prophero.com ahora tiene el rol 'renovator_analyst'
-- ============================================
