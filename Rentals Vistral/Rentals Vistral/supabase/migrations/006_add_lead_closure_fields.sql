-- Add closure fields to leads table for global lead exit (Perdido/Rechazado)
-- The closure type (perdido vs rechazado) is derived from current_phase.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS exit_reason TEXT,
  ADD COLUMN IF NOT EXISTS exit_comments TEXT,
  ADD COLUMN IF NOT EXISTS exited_at TIMESTAMPTZ;
