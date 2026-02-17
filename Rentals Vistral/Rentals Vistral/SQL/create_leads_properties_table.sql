-- Create leads_properties table (relation leads <-> properties using unique IDs)
-- Replaces lead_properties: uses leads_unique_id and properties_unique_id instead of lead_id and property_id

BEGIN;

-- ============================================================================
-- STEP 1: Create leads_properties table
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leads_unique_id TEXT NOT NULL,
  properties_unique_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leads_unique_id, properties_unique_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_properties_leads_unique_id ON leads_properties(leads_unique_id);
CREATE INDEX IF NOT EXISTS idx_leads_properties_properties_unique_id ON leads_properties(properties_unique_id);

COMMENT ON TABLE leads_properties IS 'Relación muchos-a-muchos entre leads e propiedades usando unique IDs';
COMMENT ON COLUMN leads_properties.leads_unique_id IS 'FK lógica a leads.leads_unique_id (ej: LEAD-001)';
COMMENT ON COLUMN leads_properties.properties_unique_id IS 'FK lógica a properties.property_unique_id (ej: PROP-001)';

-- ============================================================================
-- STEP 2: Migrate data from lead_properties if it exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_properties') THEN
    INSERT INTO leads_properties (leads_unique_id, properties_unique_id)
    SELECT l.leads_unique_id, lp.property_id
    FROM lead_properties lp
    JOIN leads l ON l.id = lp.lead_id
    ON CONFLICT (leads_unique_id, properties_unique_id) DO NOTHING;

    -- Optional: drop old table (uncomment if desired)
    -- DROP TABLE IF EXISTS lead_properties;
  END IF;
END $$;

COMMIT;
