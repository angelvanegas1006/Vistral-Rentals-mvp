-- Create tenant supplies contract fields and toggles
-- This script adds fields for tenant supply contracts and toggle states
-- Used in Phase 5: Pendiente de trámites - Cambio de suministros section

BEGIN;

-- Add tenant supply contract fields (TEXT fields for contract URLs)
-- Note: "Otros" (other) supply documents use rental_custom_utilities_documents (JSONB), not a column here
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_contract_electricity TEXT,
  ADD COLUMN IF NOT EXISTS tenant_contract_water TEXT,
  ADD COLUMN IF NOT EXISTS tenant_contract_gas TEXT;

-- Add tenant supplies toggles field (JSONB to store toggle states)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_supplies_toggles JSONB DEFAULT '{}'::jsonb;

-- Add comments to document the structure
COMMENT ON COLUMN properties.tenant_contract_electricity IS 'URL to tenant electricity supply contract document';
COMMENT ON COLUMN properties.tenant_contract_water IS 'URL to tenant water supply contract document';
COMMENT ON COLUMN properties.tenant_contract_gas IS 'URL to tenant gas supply contract document';
COMMENT ON COLUMN properties.tenant_supplies_toggles IS 'Toggle states for tenant supply contracts: {electricity: boolean, water: boolean, gas: boolean, other: boolean}';

COMMIT;
