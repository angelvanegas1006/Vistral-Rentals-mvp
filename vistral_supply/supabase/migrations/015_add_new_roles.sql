-- ============================================
-- Migración: Agregar nuevos roles al sistema
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Agregar nuevos roles al CHECK constraint
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN (
  'supply_partner', 
  'supply_analyst', 
  'supply_admin',
  'renovator_analyst',
  'supply_lead',
  'reno_lead'
));

-- ============================================
-- ✅ Migración Completada
-- ============================================
