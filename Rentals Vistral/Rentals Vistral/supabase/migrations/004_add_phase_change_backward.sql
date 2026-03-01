-- Add PHASE_CHANGE_BACKWARD to event_type CHECK constraint
ALTER TABLE lead_events DROP CONSTRAINT IF EXISTS lead_events_event_type_check;
ALTER TABLE lead_events ADD CONSTRAINT lead_events_event_type_check
  CHECK (event_type IN ('PROPERTY_ADDED', 'MTP_UPDATE', 'PHASE_CHANGE', 'PHASE_CHANGE_BACKWARD', 'MTP_ARCHIVED'));
