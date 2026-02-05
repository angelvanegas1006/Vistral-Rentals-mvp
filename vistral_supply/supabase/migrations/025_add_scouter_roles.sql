-- ============================================
-- Migración: Agregar roles Scouter / Proyecto
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Eliminar el constraint existente
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Agregar el constraint con roles de proyecto (scouter, supply_project_analyst, supply_project_lead)
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN (
  'supply_partner', 
  'supply_analyst', 
  'supply_admin',
  'supply_lead',
  'renovator_analyst',
  'reno_lead',
  'scouter',
  'supply_project_analyst',
  'supply_project_lead'
));

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- Roles añadidos:
--   scouter               - Scouter (formularios de proyecto)
--   supply_project_analyst - Analista de proyectos
--   supply_project_lead    - Lead de proyectos
-- ============================================
