-- Renombrar estados MTP: perfil_cualificado -> interesado_cualificado, alquilada -> no_disponible
-- Afecta current_status, previous_status y el default de current_status

BEGIN;

-- 1. Renombrar perfil_cualificado -> interesado_cualificado
UPDATE leads_properties
SET current_status = 'interesado_cualificado'
WHERE current_status = 'perfil_cualificado';

UPDATE leads_properties
SET previous_status = 'interesado_cualificado'
WHERE previous_status = 'perfil_cualificado';

-- 2. Renombrar alquilada -> no_disponible
UPDATE leads_properties
SET current_status = 'no_disponible'
WHERE current_status = 'alquilada';

UPDATE leads_properties
SET previous_status = 'no_disponible'
WHERE previous_status = 'alquilada';

-- 3. Cambiar default de current_status
ALTER TABLE leads_properties
  ALTER COLUMN current_status SET DEFAULT 'interesado_cualificado';

COMMIT;
