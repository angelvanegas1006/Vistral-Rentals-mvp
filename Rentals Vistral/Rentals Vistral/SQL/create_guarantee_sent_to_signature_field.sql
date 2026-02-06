-- Add field to confirm if guarantee has been sent to signature
-- Phase 4: Inquilino aceptado

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS guarantee_sent_to_signature BOOLEAN;

COMMENT ON COLUMN properties.guarantee_sent_to_signature IS 'Confirma si la garantía de renta ilimitada de Finaer ha sido enviada a firma. true = Sí (enviada), false = No (no enviada), null = No ha respondido';
