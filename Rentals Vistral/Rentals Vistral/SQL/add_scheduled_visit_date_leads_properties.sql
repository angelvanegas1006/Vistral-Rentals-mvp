-- Add scheduled_visit_date to leads_properties
-- Fecha de visita agendada para la relación lead-propiedad

ALTER TABLE leads_properties
ADD COLUMN IF NOT EXISTS scheduled_visit_date DATE;

COMMENT ON COLUMN leads_properties.scheduled_visit_date IS 'Fecha de visita agendada para este lead en esta propiedad';
