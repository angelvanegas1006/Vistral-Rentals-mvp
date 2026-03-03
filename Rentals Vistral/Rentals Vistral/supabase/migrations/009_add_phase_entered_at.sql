-- Add phase_entered_at to leads table
-- Tracks the exact moment a lead entered its current phase.
-- Used for sorting kanban cards (newest first) and displaying "Días en fase".

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS phase_entered_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill for existing leads: use the latest PHASE_CHANGE event timestamp,
-- falling back to updated_at, then created_at.
UPDATE leads l
SET phase_entered_at = COALESCE(
  (SELECT MAX(le.created_at)
   FROM lead_events le
   WHERE le.leads_unique_id = l.leads_unique_id
     AND le.event_type IN ('PHASE_CHANGE', 'PHASE_CHANGE_BACKWARD')),
  l.updated_at,
  l.created_at
);

ALTER TABLE leads
  ALTER COLUMN phase_entered_at SET NOT NULL;

COMMENT ON COLUMN leads.phase_entered_at IS
  'Timestamp when the lead entered its current phase — used for sorting and "Días en fase" display';
