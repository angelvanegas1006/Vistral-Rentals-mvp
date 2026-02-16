-- Add employment_contract_type to leads table
-- Tipo de contrato laboral (solo aplica cuando employment_status es Empleado o Funcionario)

BEGIN;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS employment_contract_type TEXT;

COMMENT ON COLUMN leads.employment_contract_type IS 'Tipo de contrato: Contrato indefinido, Contrato temporal, Contrato laboral reciente (solo para Empleado/Funcionario)';

COMMIT;
