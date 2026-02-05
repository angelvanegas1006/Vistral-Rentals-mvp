-- Add tenant fields to match investor fields structure
-- This script adds the missing tenant fields to the properties table

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS tenant_iban TEXT,
  ADD COLUMN IF NOT EXISTS tenant_custom_identity_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tenant_custom_financial_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tenant_custom_other_documents JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the structure
COMMENT ON COLUMN properties.tenant_iban IS 'IBAN account number for the tenant';
COMMENT ON COLUMN properties.tenant_custom_identity_documents IS 'Array of custom tenant identity documents: [{title: string, url: string, createdAt: string}]';
COMMENT ON COLUMN properties.tenant_custom_financial_documents IS 'Array of custom tenant financial documents: [{title: string, url: string, createdAt: string}]';
COMMENT ON COLUMN properties.tenant_custom_other_documents IS 'Array of custom tenant other documents: [{title: string, url: string, createdAt: string}]';
