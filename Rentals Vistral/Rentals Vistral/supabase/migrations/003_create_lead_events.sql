-- Migration: Create lead_events table for audit trail / activity log
-- This table stores an immutable log of all significant events for a lead.

CREATE TABLE IF NOT EXISTS lead_events (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leads_unique_id      TEXT NOT NULL,
  properties_unique_id TEXT,
  event_type           TEXT NOT NULL CHECK (event_type IN ('PROPERTY_ADDED', 'MTP_UPDATE', 'PHASE_CHANGE', 'MTP_ARCHIVED')),
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_lead_events_lead ON lead_events(leads_unique_id);
CREATE INDEX idx_lead_events_lead_created ON lead_events(leads_unique_id, created_at DESC);
