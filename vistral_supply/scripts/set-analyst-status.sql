-- ============================================
-- Establecer analyst_status para propiedades asignadas sin status
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Establecer analyst_status a 'backlog' para propiedades asignadas que no tienen status
UPDATE properties
SET 
  analyst_status = 'backlog',
  updated_at = NOW()
WHERE 
  assigned_to IS NOT NULL 
  AND analyst_status IS NULL
  AND status != 'draft'; -- No cambiar draft properties

-- Verificar propiedades asignadas y sus status
SELECT 
  p.id,
  p.assigned_to,
  u.email as assigned_analyst_email,
  p.analyst_status,
  p.status,
  p.created_at
FROM properties p
LEFT JOIN auth.users u ON p.assigned_to = u.id
WHERE p.assigned_to IS NOT NULL
ORDER BY p.created_at DESC;
