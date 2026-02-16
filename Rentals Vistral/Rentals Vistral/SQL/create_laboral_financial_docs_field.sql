-- Add laboral_financial_docs JSONB to leads table
-- Stores obligatory + complementary documents for "Información Laboral y Financiera del Interesado" section. Structure: { obligatory: { [field_key]: url }, complementary: [{ type, title, url, createdAt }] }

BEGIN;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS laboral_financial_docs JSONB DEFAULT '{}';

COMMENT ON COLUMN leads.laboral_financial_docs IS 'Documentos laborales y financieros. Estructura: { obligatory: { [field_key]: url }, complementary: [{ type, title, url, createdAt }] }';

COMMIT;
