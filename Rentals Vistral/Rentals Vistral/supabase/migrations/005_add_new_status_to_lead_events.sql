-- Add new_status column to lead_events for structured MTP status tracking.
-- Stores the MTP status ID (e.g. 'visita_agendada') that resulted from the event.
-- Nullable for backward compatibility with existing rows.

ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS new_status TEXT;
CREATE INDEX IF NOT EXISTS idx_lead_events_property ON lead_events(leads_unique_id, properties_unique_id, created_at DESC);
