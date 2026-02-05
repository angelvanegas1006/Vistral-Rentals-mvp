-- ============================================
-- Verificar asignación de propiedad
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

SELECT 
  p.id as property_id,
  p.assigned_to,
  u.email as assigned_analyst_email,
  p.analyst_status,
  p.status,
  p.created_at,
  p.updated_at
FROM properties p
LEFT JOIN auth.users u ON p.assigned_to = u.id
WHERE p.id = 'supply_1768857579495_nixbyu4zd';

-- Verificar que el usuario supply existe
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'supplyuser@prophero.com';
