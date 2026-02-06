-- Add fields for rent receiving bank account confirmation (Phase 4: Inquilino aceptado)
-- This script adds fields to track the bank account where the investor wants to receive rent payments

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS client_rent_receiving_iban TEXT,
  ADD COLUMN IF NOT EXISTS client_rent_receiving_bank_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS client_wants_to_change_bank_account BOOLEAN;

-- Add comments to document the structure
COMMENT ON COLUMN properties.client_rent_receiving_iban IS 'IBAN account number where the investor wants to receive rent payments. If client_wants_to_change_bank_account is false/null, this should be initialized with client_iban';
COMMENT ON COLUMN properties.client_rent_receiving_bank_certificate_url IS 'URL of the bank account ownership certificate for the account used to receive rent payments. Stored in client/financial folder. If client_wants_to_change_bank_account is false/null, this should be initialized with client_bank_certificate_url';
COMMENT ON COLUMN properties.client_wants_to_change_bank_account IS 'Response to radio button: Does the investor want to change the bank account for receiving rent? true = Yes (wants to change), false = No (use existing account), null = Not answered yet';

-- Function to initialize rent receiving bank fields when client_wants_to_change_bank_account is false or null
-- This function will be called automatically via trigger or manually when needed
CREATE OR REPLACE FUNCTION initialize_rent_receiving_bank_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If client doesn't want to change account (false) or hasn't answered (null)
  -- and the rent receiving fields are null, initialize them with existing values
  IF (NEW.client_wants_to_change_bank_account IS FALSE OR NEW.client_wants_to_change_bank_account IS NULL) THEN
    -- Initialize IBAN if it's null and client_iban exists
    IF NEW.client_rent_receiving_iban IS NULL AND NEW.client_iban IS NOT NULL THEN
      NEW.client_rent_receiving_iban := NEW.client_iban;
    END IF;
    
    -- Initialize certificate URL if it's null and client_bank_certificate_url exists
    IF NEW.client_rent_receiving_bank_certificate_url IS NULL AND NEW.client_bank_certificate_url IS NOT NULL THEN
      NEW.client_rent_receiving_bank_certificate_url := NEW.client_bank_certificate_url;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically initialize fields when client_wants_to_change_bank_account is set to false
-- This trigger fires BEFORE INSERT or UPDATE
CREATE TRIGGER trigger_initialize_rent_receiving_bank_fields
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  WHEN (
    (NEW.client_wants_to_change_bank_account IS FALSE OR NEW.client_wants_to_change_bank_account IS NULL)
    AND (
      (NEW.client_rent_receiving_iban IS NULL AND NEW.client_iban IS NOT NULL)
      OR
      (NEW.client_rent_receiving_bank_certificate_url IS NULL AND NEW.client_bank_certificate_url IS NOT NULL)
    )
  )
  EXECUTE FUNCTION initialize_rent_receiving_bank_fields();

-- Also initialize existing records that might need initialization
-- This updates records where client_wants_to_change_bank_account is false/null
-- and the rent receiving fields are null but the source fields exist
UPDATE properties
SET 
  client_rent_receiving_iban = client_iban,
  client_rent_receiving_bank_certificate_url = client_bank_certificate_url
WHERE 
  (client_wants_to_change_bank_account IS FALSE OR client_wants_to_change_bank_account IS NULL)
  AND client_iban IS NOT NULL
  AND client_rent_receiving_iban IS NULL;

UPDATE properties
SET 
  client_rent_receiving_bank_certificate_url = client_bank_certificate_url
WHERE 
  (client_wants_to_change_bank_account IS FALSE OR client_wants_to_change_bank_account IS NULL)
  AND client_bank_certificate_url IS NOT NULL
  AND client_rent_receiving_bank_certificate_url IS NULL;
