-- Actualizar descripción del campo pet_info
-- Estructura JSONB: { has_pets: boolean, details?: string }

COMMENT ON COLUMN leads.pet_info IS 'Información de mascotas. JSONB: { has_pets: boolean (¿tiene mascotas?), details?: string (detalles si has_pets=true, ej. "3 perros (pequeños) y 1 gato") }';
