-- Migration: Change client_presentation_channel from TEXT to ENUM
-- Date: 2026-02-05
-- Description: Migrates client_presentation_channel column from TEXT to ENUM type
--              with values: "Llamada telefónica", "Correo electrónico", "Ambos"

-- ============================================================================
-- STEP 1: Create the ENUM type
-- ============================================================================

DO $$ 
BEGIN
    -- Create the enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_presentation_channel_enum') THEN
        CREATE TYPE client_presentation_channel_enum AS ENUM (
            'Llamada telefónica',
            'Correo electrónico',
            'Ambos'
        );
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Migrate existing data and change column type
-- ============================================================================

-- First, ensure all existing values are valid enum values or NULL
-- Update any invalid values to NULL (optional - adjust based on your needs)
UPDATE properties 
SET client_presentation_channel = NULL 
WHERE client_presentation_channel IS NOT NULL 
  AND client_presentation_channel NOT IN ('Llamada telefónica', 'Correo electrónico', 'Ambos');

-- Change the column type from TEXT to ENUM
ALTER TABLE properties 
ALTER COLUMN client_presentation_channel 
TYPE client_presentation_channel_enum 
USING client_presentation_channel::client_presentation_channel_enum;

-- ============================================================================
-- STEP 3: Update column comment
-- ============================================================================

COMMENT ON COLUMN properties.client_presentation_channel IS 
'Canal de comunicación utilizado para la presentación. Tipo ENUM con valores: "Llamada telefónica", "Correo electrónico", "Ambos"';

-- ============================================================================
-- Verification (optional - run manually to verify)
-- ============================================================================

-- Verify the column type has changed
-- SELECT column_name, data_type, udt_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' 
--   AND column_name = 'client_presentation_channel';

-- Verify enum values
-- SELECT unnest(enum_range(NULL::client_presentation_channel_enum)) AS enum_value;
