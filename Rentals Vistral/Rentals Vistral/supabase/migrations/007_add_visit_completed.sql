-- Pendiente de Evaluación: guardar respuesta a "¿Se ha realizado la visita?"
-- NULL = sin responder, true = visita realizada, false (no se usa, se resetea a NULL al reagendar)

BEGIN;

ALTER TABLE leads_properties
  ADD COLUMN IF NOT EXISTS visit_completed BOOLEAN;

COMMIT;
