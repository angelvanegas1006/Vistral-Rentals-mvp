-- ============================================
-- Asignar propiedad supply_1768857579495_nixbyu4zd al usuario supplyuser@prophero.com
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

UPDATE properties
SET 
  assigned_to = (SELECT id FROM auth.users WHERE email = 'supplyuser@prophero.com' LIMIT 1),
  analyst_status = COALESCE(analyst_status, 'backlog'),
  updated_at = NOW()
WHERE id = 'supply_1768857579495_nixbyu4zd';

-- Verificar la asignación
SELECT 
  p.id,
  p.assigned_to,
  u.email as assigned_analyst_email,
  p.analyst_status,
  p.status
FROM properties p
LEFT JOIN auth.users u ON p.assigned_to = u.id
WHERE p.id = 'supply_1768857579495_nixbyu4zd';
