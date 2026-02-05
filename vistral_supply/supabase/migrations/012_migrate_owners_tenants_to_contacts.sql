-- ============================================
-- Migración: Migrar datos de property_owners y property_tenants a contacts
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Función para migrar property_owners a contacts y property_contact
CREATE OR REPLACE FUNCTION migrate_property_owners_to_contacts()
RETURNS void AS $$
DECLARE
  owner_record RECORD;
  contact_id_val UUID;
BEGIN
  -- Migrar cada property_owner a contacts y crear relación en property_contact
  FOR owner_record IN 
    SELECT * FROM property_owners WHERE is_active = true
  LOOP
    -- Crear o encontrar contacto existente por email o DNI
    SELECT id INTO contact_id_val
    FROM contacts
    WHERE (email IS NOT NULL AND email = owner_record.email)
       OR (dni_nif_cif IS NOT NULL AND dni_nif_cif = owner_record.dni_nif_cif)
    LIMIT 1;

    -- Si no existe, crear nuevo contacto
    IF contact_id_val IS NULL THEN
      INSERT INTO contacts (
        name,
        email,
        phone_country_code,
        phone_number,
        dni_nif_cif
      ) VALUES (
        owner_record.nombre_completo,
        owner_record.email,
        owner_record.telefono_pais,
        owner_record.telefono_numero,
        owner_record.dni_nif_cif
      ) RETURNING id INTO contact_id_val;
    END IF;

    -- Crear relación en property_contact con rol 'seller'
    INSERT INTO property_contact (
      property_id,
      contact_id,
      role,
      is_active,
      dni_adjunto,
      created_at,
      updated_at
    ) VALUES (
      owner_record.property_id,
      contact_id_val,
      'seller',
      true,
      owner_record.dni_adjunto,
      owner_record.created_at,
      owner_record.updated_at
    ) ON CONFLICT (property_id, contact_id, role) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para migrar property_tenants a contacts y property_contact
CREATE OR REPLACE FUNCTION migrate_property_tenants_to_contacts()
RETURNS void AS $$
DECLARE
  tenant_record RECORD;
  contact_id_val UUID;
BEGIN
  -- Migrar cada property_tenant a contacts y crear relación en property_contact
  FOR tenant_record IN 
    SELECT * FROM property_tenants WHERE is_active = true
  LOOP
    -- Crear o encontrar contacto existente por email
    SELECT id INTO contact_id_val
    FROM contacts
    WHERE email IS NOT NULL AND email = tenant_record.email
    LIMIT 1;

    -- Si no existe, crear nuevo contacto
    IF contact_id_val IS NULL THEN
      INSERT INTO contacts (
        name,
        email,
        phone_country_code,
        phone_number
      ) VALUES (
        tenant_record.nombre_completo,
        tenant_record.email,
        tenant_record.telefono_pais,
        tenant_record.telefono_numero
      ) RETURNING id INTO contact_id_val;
    END IF;

    -- Crear relación en property_contact con rol 'tenant'
    INSERT INTO property_contact (
      property_id,
      contact_id,
      role,
      is_active,
      fecha_finalizacion_contrato,
      periodo_preaviso,
      subrogacion_contrato,
      importe_alquiler_transferir,
      ultima_actualizacion_alquiler,
      fecha_ultimo_recibo,
      fecha_vencimiento_seguro_alquiler,
      estado_seguro_alquiler,
      proveedor_seguro_alquiler,
      dni_nie_files,
      contrato_arrendamiento_files,
      justificantes_pago_files,
      comprobante_transferencia_vendedor_files,
      justificante_deposito_files,
      created_at,
      updated_at
    ) VALUES (
      tenant_record.property_id,
      contact_id_val,
      'tenant',
      true,
      tenant_record.fecha_finalizacion_contrato,
      tenant_record.periodo_preaviso,
      tenant_record.subrogacion_contrato,
      tenant_record.importe_alquiler_transferir,
      tenant_record.ultima_actualizacion_alquiler,
      tenant_record.fecha_ultimo_recibo,
      tenant_record.fecha_vencimiento_seguro_alquiler,
      tenant_record.estado_seguro_alquiler,
      tenant_record.proveedor_seguro_alquiler,
      tenant_record.dni_nie,
      tenant_record.contrato_arrendamiento,
      tenant_record.justificantes_pago,
      tenant_record.comprobante_transferencia_vendedor,
      tenant_record.justificante_deposito,
      tenant_record.created_at,
      tenant_record.updated_at
    ) ON CONFLICT (property_id, contact_id, role) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migraciones
-- SELECT migrate_property_owners_to_contacts();
-- SELECT migrate_property_tenants_to_contacts();

-- ============================================
-- ✅ Migración Completada
-- ============================================
-- Nota: Las funciones están creadas pero no ejecutadas automáticamente.
-- Ejecuta manualmente cuando estés listo:
-- SELECT migrate_property_owners_to_contacts();
-- SELECT migrate_property_tenants_to_contacts();
