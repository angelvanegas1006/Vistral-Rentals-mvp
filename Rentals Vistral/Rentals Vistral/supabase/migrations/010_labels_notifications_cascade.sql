-- Migration 010: Labels, Notifications, Cascade Negative support
-- Adds label column to leads, max_status_reached to leads_properties,
-- creates lead_notifications table.

-- 1. Add label column to leads (nuevo / recuperado / NULL)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS label TEXT;

-- 2. Add max_status_reached to leads_properties
ALTER TABLE leads_properties ADD COLUMN IF NOT EXISTS max_status_reached TEXT;

-- 3. Create lead_notifications table
CREATE TABLE IF NOT EXISTS lead_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leads_unique_id TEXT NOT NULL,
  properties_unique_id TEXT,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by lead
CREATE INDEX IF NOT EXISTS idx_lead_notifications_lead
  ON lead_notifications (leads_unique_id, is_read);
