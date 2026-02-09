-- Drop deposit_receipt_file_url field
-- This script removes the deposit_receipt_file_url column from the properties table

BEGIN;

-- Drop deposit_receipt_file_url if it exists
ALTER TABLE properties
  DROP COLUMN IF EXISTS deposit_receipt_file_url;

COMMIT;
