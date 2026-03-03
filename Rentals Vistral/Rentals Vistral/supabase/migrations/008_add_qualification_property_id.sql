-- Add qualification_property_id to leads table
-- Stores the ID of the leads_properties row selected for Finaer qualification
-- during the "Recogiendo Información" phase.
-- NULL when no property is selected or in other phases.

ALTER TABLE leads
ADD COLUMN qualification_property_id UUID DEFAULT NULL;

COMMENT ON COLUMN leads.qualification_property_id IS
  'FK to leads_properties.id — the MTP selected for Finaer qualification in the Recogiendo Información phase';
