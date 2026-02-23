-- Máquina de estados: nuevos campos en leads_properties
-- Documentación: docs/Maquina_estados_leads_properties

BEGIN;

ALTER TABLE leads_properties
  ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'perfil_cualificado',
  ADD COLUMN IF NOT EXISTS previous_status TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS visit_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_feedback TEXT,
  ADD COLUMN IF NOT EXISTS tenant_confirmed_interest TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_to_finaer_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finaer_status TEXT,
  ADD COLUMN IF NOT EXISTS finaer_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS owner_status TEXT,
  ADD COLUMN IF NOT EXISTS owner_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS exit_reason TEXT,
  ADD COLUMN IF NOT EXISTS exit_comments TEXT;

-- Migrar scheduled_visit_date -> visit_date solo si la columna existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_properties' AND column_name = 'scheduled_visit_date'
  ) THEN
    UPDATE leads_properties
    SET visit_date = (scheduled_visit_date::text || ' 00:00:00')::timestamptz
    WHERE scheduled_visit_date IS NOT NULL AND visit_date IS NULL;
  END IF;
END $$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_leads_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_properties_updated_at ON leads_properties;
CREATE TRIGGER trg_leads_properties_updated_at
  BEFORE UPDATE ON leads_properties
  FOR EACH ROW EXECUTE PROCEDURE update_leads_properties_updated_at();

COMMIT;
