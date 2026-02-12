-- Add personal and family profile fields to leads table
-- Información personal: nationality, identity_doc_*, date_of_birth, age
-- Perfil familiar: family_profile, children_count, pet_info

BEGIN;

-- ============================================================================
-- STEP 1: Create ENUM types
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'identity_doc_type_enum') THEN
        CREATE TYPE identity_doc_type_enum AS ENUM ('DNI', 'NIE', 'Pasaporte');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'family_profile_enum') THEN
        CREATE TYPE family_profile_enum AS ENUM ('Soltero', 'Pareja', 'Con hijos');
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add columns to leads
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS identity_doc_type identity_doc_type_enum,
  ADD COLUMN IF NOT EXISTS identity_doc_number TEXT,
  ADD COLUMN IF NOT EXISTS identity_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS family_profile family_profile_enum,
  ADD COLUMN IF NOT EXISTS children_count INT,
  ADD COLUMN IF NOT EXISTS pet_info JSONB;

-- ============================================================================
-- STEP 3: Column comments
-- ============================================================================

COMMENT ON COLUMN leads.nationality IS 'Nacionalidad';
COMMENT ON COLUMN leads.identity_doc_type IS 'Tipo de documento de identidad: DNI, NIE, Pasaporte';
COMMENT ON COLUMN leads.identity_doc_number IS 'Número de documento de identidad';
COMMENT ON COLUMN leads.identity_doc_url IS 'URL del documento de identidad';
COMMENT ON COLUMN leads.date_of_birth IS 'Fecha de nacimiento';
COMMENT ON COLUMN leads.age IS 'Edad';
COMMENT ON COLUMN leads.family_profile IS 'Perfil familiar: Soltero, Pareja, Con hijos';
COMMENT ON COLUMN leads.children_count IS 'Número de hijos';
COMMENT ON COLUMN leads.pet_info IS 'Información de mascotas (JSON flexible)';

COMMIT;
