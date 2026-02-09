-- Create deposit responsible field and ensure deposit_receipt_file_url exists
-- This script adds fields for deposit management in Phase 5: Pendiente de trámites
-- Used for "Depósito de la fianza" section

BEGIN;

-- Create ENUM type for deposit responsible (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deposit_responsible_enum') THEN
        CREATE TYPE deposit_responsible_enum AS ENUM ('Prophero', 'Inversor');
    END IF;
END $$;

-- Add deposit_responsible field using the ENUM type
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deposit_responsible deposit_responsible_enum;

-- Note: deposit_receipt_file_url field is created separately in recreate_deposit_receipt_file_url.sql

-- Add comments to document the fields
COMMENT ON COLUMN properties.deposit_responsible IS 'Responsible party for the security deposit: Prophero or Inversor';
COMMENT ON COLUMN properties.deposit_receipt_file_url IS 'URL to the deposit receipt document (Resguardo del depósito de la fianza). Stored in properties-restricted-docs/rental/deposit/';

COMMIT;
