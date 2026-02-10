-- Recreate deposit_receipt_file_url field
-- This script drops and recreates the deposit_receipt_file_url field
-- Used for Phase 5: Pendiente de trámites - Depósito de la fianza section

BEGIN;

-- Drop deposit_receipt_file_url if it exists
ALTER TABLE properties
  DROP COLUMN IF EXISTS deposit_receipt_file_url;

-- Recreate deposit_receipt_file_url field
ALTER TABLE properties
  ADD COLUMN deposit_receipt_file_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN properties.deposit_receipt_file_url IS 'URL to the deposit receipt document (Resguardo del depósito de la fianza). Stored in properties-restricted-docs/rental/contractual_financial/deposit/';

COMMIT;
