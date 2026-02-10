-- DEPRECATED: This migration is obsolete. The app now uses rental_custom_utilities_documents
-- for "Otros" (other) supply contracts instead of tenant_contract_other.
-- Do not run for new deployments. If you have existing data in tenant_contract_other,
-- migrate it to rental_custom_utilities_documents and then drop the column.
--
-- Migration: Create tenant_contract_other as JSONB (or convert from TEXT if exists)
-- Date: 2026-02-09
-- Description: (Deprecated) Previously created tenant_contract_other as JSONB.

BEGIN;

-- Check if column exists and its current type
DO $$
DECLARE
  column_exists BOOLEAN;
  column_type TEXT;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'tenant_contract_other'
  ) INTO column_exists;

  IF column_exists THEN
    -- Get current column type
    SELECT data_type 
    INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'tenant_contract_other';

    -- If column is TEXT, migrate to JSONB
    IF column_type = 'text' THEN
      -- Migrate existing TEXT data to JSONB format
      UPDATE properties
      SET tenant_contract_other = CASE
        WHEN tenant_contract_other IS NOT NULL AND tenant_contract_other != '' THEN
          jsonb_build_array(
            jsonb_build_object(
              'title', 'Contrato Otros Suministros',
              'url', tenant_contract_other,
              'createdAt', NOW()::text
            )
          )
        ELSE
          '[]'::jsonb
      END
      WHERE tenant_contract_other IS NOT NULL;

      -- Set default for NULL values
      UPDATE properties
      SET tenant_contract_other = '[]'::jsonb
      WHERE tenant_contract_other IS NULL;

      -- Change column type from TEXT to JSONB
      ALTER TABLE properties
        ALTER COLUMN tenant_contract_other TYPE JSONB USING tenant_contract_other::jsonb,
        ALTER COLUMN tenant_contract_other SET DEFAULT '[]'::jsonb;
    ELSIF column_type != 'jsonb' THEN
      -- If column exists but is not TEXT or JSONB, convert it
      ALTER TABLE properties
        ALTER COLUMN tenant_contract_other TYPE JSONB USING '[]'::jsonb,
        ALTER COLUMN tenant_contract_other SET DEFAULT '[]'::jsonb;
    END IF;
  ELSE
    -- Column doesn't exist, create it as JSONB
    ALTER TABLE properties
      ADD COLUMN tenant_contract_other JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update comment to reflect structure
COMMENT ON COLUMN properties.tenant_contract_other IS 
'Array of tenant other supply contract documents (internet, phone, etc.). Structure: [{title: string, url: string, createdAt: string}]';

COMMIT;

-- Verification query (optional - run separately to verify)
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' 
-- AND column_name = 'tenant_contract_other';
