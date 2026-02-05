-- ============================================
-- Migración: Asignar propiedad a usuario supply analyst
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Asignar la propiedad supply_1768857579495_nixbyu4zd al usuario supplyuser@prophero.com
-- También establecer analyst_status a 'backlog' si no está establecido
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
  p.analyst_status
FROM properties p
LEFT JOIN auth.users u ON p.assigned_to = u.id
WHERE p.id = 'supply_1768857579495_nixbyu4zd';

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- La propiedad supply_1768857579495_nixbyu4zd ahora está asignada a supplyuser@prophero.com
-- ============================================
