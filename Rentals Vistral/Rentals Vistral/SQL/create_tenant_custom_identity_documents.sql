-- Create tenant_custom_identity_documents column
-- This script adds the tenant_custom_identity_documents JSONB field to the properties table
-- Following the same pattern as client_custom_identity_documents

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_custom_identity_documents JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN properties.tenant_custom_identity_documents IS 'Array of custom tenant identity documents: [{title: string, url: string, createdAt: string}]';

COMMIT;
