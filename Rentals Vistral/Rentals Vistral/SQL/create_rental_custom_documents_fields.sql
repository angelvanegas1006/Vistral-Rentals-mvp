-- Create rental custom document columns (JSONB)
-- Adds rental_custom_contractual_financial_documents, rental_custom_utilities_documents, rental_custom_other_documents
-- Storage paths: rental/contractual_financial/other, rental/utilities, rental/other (see docs-architecture.md)

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rental_custom_contractual_financial_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rental_custom_utilities_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rental_custom_other_documents JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN properties.rental_custom_contractual_financial_documents IS 'Array of custom contractual/financial rental documents. Stored in properties-restricted-docs/rental/contractual_financial/other. Structure: [{title, url, createdAt}]';
COMMENT ON COLUMN properties.rental_custom_utilities_documents IS 'Array of custom utilities documents for the rental. Stored in properties-restricted-docs/rental/utilities. Structure: [{title, url, createdAt}]';
COMMENT ON COLUMN properties.rental_custom_other_documents IS 'Array of custom other rental documents. Stored in properties-restricted-docs/rental/other. Structure: [{title, url, createdAt}]';

COMMIT;
