-- Create first rent payment file URL field
-- This script adds field for first rent payment transfer receipt in Phase 5: Pendiente de trámites
-- Used for "Transferencia del mes en curso" section

BEGIN;

-- Add first_rent_payment_file_url field
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS first_rent_payment_file_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN properties.first_rent_payment_file_url IS 'URL to the first rent payment transfer receipt document (Comprobante de transferencia del mes en curso). Stored in properties-restricted-docs/rental/contractual_financial/first_rent_payment/';

COMMIT;
