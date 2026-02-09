-- Recreate tenant_supplies_toggles field
-- This script drops and recreates the tenant_supplies_toggles JSONB field
-- Use this if the field is not working correctly or needs to be reset

BEGIN;

-- Step 1: Drop the column if it exists
ALTER TABLE properties
  DROP COLUMN IF EXISTS tenant_supplies_toggles;

-- Step 2: Recreate the column with proper type and default
ALTER TABLE properties
  ADD COLUMN tenant_supplies_toggles JSONB DEFAULT '{}'::jsonb;

-- Step 3: Add comment to document the structure
COMMENT ON COLUMN properties.tenant_supplies_toggles IS 
'Toggle states for tenant supply contracts: {electricity: boolean, water: boolean, gas: boolean, other: boolean}';

COMMIT;

-- Verification query (optional - run separately to verify)
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' 
-- AND column_name = 'tenant_supplies_toggles';
