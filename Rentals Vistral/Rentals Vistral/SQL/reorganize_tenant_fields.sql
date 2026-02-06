-- Reorganize tenant fields in properties table
-- This script:
-- 1. Moves tenant_full_name, tenant_email, and tenant_phone to the end
-- 2. Renames tenant_nif to tenant_identity_doc_number and moves it to the end
-- 3. Creates tenant_identity_doc_url column
-- 4. Creates tenant_custom_identity_documents JSONB column

BEGIN;

-- Step 1: Rename tenant_nif to tenant_identity_doc_number
ALTER TABLE properties
  RENAME COLUMN tenant_nif TO tenant_identity_doc_number;

-- Step 2: Create tenant_identity_doc_url column
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_identity_doc_url TEXT;

-- Step 2b: Create tenant_custom_identity_documents JSONB column
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_custom_identity_documents JSONB DEFAULT '[]'::jsonb;

-- Step 3: Move tenant_full_name, tenant_email, and tenant_phone to the end
-- In PostgreSQL, we need to recreate these columns at the end
-- First, create temporary columns with unique names to avoid conflicts
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS _temp_tenant_full_name TEXT,
  ADD COLUMN IF NOT EXISTS _temp_tenant_email TEXT,
  ADD COLUMN IF NOT EXISTS _temp_tenant_phone TEXT;

-- Copy data from old columns to new columns (copy all rows, including NULLs)
UPDATE properties
SET 
  _temp_tenant_full_name = tenant_full_name,
  _temp_tenant_email = tenant_email,
  _temp_tenant_phone = tenant_phone;

-- Drop old columns
ALTER TABLE properties
  DROP COLUMN IF EXISTS tenant_full_name,
  DROP COLUMN IF EXISTS tenant_email,
  DROP COLUMN IF EXISTS tenant_phone;

-- Rename new columns to original names (now at the end)
ALTER TABLE properties
  RENAME COLUMN _temp_tenant_full_name TO tenant_full_name;
ALTER TABLE properties
  RENAME COLUMN _temp_tenant_email TO tenant_email;
ALTER TABLE properties
  RENAME COLUMN _temp_tenant_phone TO tenant_phone;

-- Step 4: Move tenant_identity_doc_number to the end
-- Create temporary column with unique name
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS _temp_tenant_identity_doc_number TEXT;

-- Copy data (copy all rows, including NULLs)
UPDATE properties
SET _temp_tenant_identity_doc_number = tenant_identity_doc_number;

-- Drop old column
ALTER TABLE properties
  DROP COLUMN IF EXISTS tenant_identity_doc_number;

-- Rename new column
ALTER TABLE properties
  RENAME COLUMN _temp_tenant_identity_doc_number TO tenant_identity_doc_number;

-- Add comments for documentation
COMMENT ON COLUMN properties.tenant_full_name IS 'Full name of the tenant';
COMMENT ON COLUMN properties.tenant_email IS 'Email address of the tenant';
COMMENT ON COLUMN properties.tenant_phone IS 'Phone number of the tenant';
COMMENT ON COLUMN properties.tenant_identity_doc_number IS 'Identity document number of the tenant (previously tenant_nif)';
COMMENT ON COLUMN properties.tenant_identity_doc_url IS 'URL to the tenant identity document';
COMMENT ON COLUMN properties.tenant_custom_identity_documents IS 'Array of custom tenant identity documents: [{title: string, url: string, createdAt: string}]';

COMMIT;
