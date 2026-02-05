import { createClient } from "@/lib/supabase/client";
import { InquilinoData, FileUpload, SubrogacionContrato, EstadoSeguroAlquiler } from "./supply-property-storage";
import { isDemoMode } from "./utils";
import {
  createOrFindContact,
  createPropertyContact,
  updatePropertyContact,
  getPropertyContactsByRole,
  deactivatePropertyContact,
  PropertyContactRow,
  ContactRow,
} from "./supply-contacts-supabase";

export interface PropertyTenantRow {
  id: string;
  property_id: string;
  nombre_completo?: string;
  email?: string;
  telefono_pais?: string;
  telefono_numero?: string;
  dni_nie?: FileUpload[];
  contrato_arrendamiento?: FileUpload[];
  fecha_finalizacion_contrato?: string;
  periodo_preaviso?: number;
  subrogacion_contrato?: SubrogacionContrato;
  importe_alquiler_transferir?: number;
  ultima_actualizacion_alquiler?: string;
  justificantes_pago?: FileUpload[];
  fecha_ultimo_recibo?: string;
  comprobante_transferencia_vendedor?: FileUpload[];
  justificante_deposito?: FileUpload[];
  fecha_vencimiento_seguro_alquiler?: string;
  estado_seguro_alquiler?: EstadoSeguroAlquiler;
  proveedor_seguro_alquiler?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at?: string;
}

/**
 * Create a new property tenant (using new contacts architecture)
 * Deactivates previous active tenant if needed
 */
export async function createPropertyTenant(
  propertyId: string,
  tenantData: InquilinoData,
  deactivatePrevious: boolean = true
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createPropertyTenant] Demo mode: Skipping Supabase create");
    return `tenant_${Date.now()}`;
  }

  // Create or find contact
  const contactId = await createOrFindContact(
    tenantData.nombreCompleto || "",
    tenantData.email,
    tenantData.telefonoPais,
    tenantData.telefonoNumero
  );

  // Create property-contact relationship with role 'tenant'
  const propertyContactId = await createPropertyContact(
    propertyId,
    contactId,
    "tenant",
    {
      fecha_finalizacion_contrato: tenantData.fechaFinalizacionContrato ?? undefined,
      periodo_preaviso: tenantData.periodoPreaviso ?? undefined,
      subrogacion_contrato: tenantData.subrogacionContrato ?? undefined,
      importe_alquiler_transferir: tenantData.importeAlquilerTransferir ?? undefined,
      ultima_actualizacion_alquiler: tenantData.ultimaActualizacionAlquiler ?? undefined,
      fecha_ultimo_recibo: tenantData.fechaUltimoRecibo ?? undefined,
      fecha_vencimiento_seguro_alquiler: tenantData.fechaVencimientoSeguroAlquiler ?? undefined,
      estado_seguro_alquiler: tenantData.estadoSeguroAlquiler ?? undefined,
      proveedor_seguro_alquiler: tenantData.proveedorSeguroAlquiler ?? undefined,
      dni_nie_files: tenantData.dniNie || [],
      contrato_arrendamiento_files: tenantData.contratoArrendamiento || [],
      justificantes_pago_files: tenantData.justificantesPago || [],
      comprobante_transferencia_vendedor_files: tenantData.comprobanteTransferenciaVendedor || [],
      justificante_deposito_files: tenantData.justificanteDeposito || [],
    }
  );

  return propertyContactId;
}

/**
 * Save property tenant to Supabase (replaces current active tenant)
 */
export async function savePropertyTenant(
  propertyId: string,
  tenantData: InquilinoData
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[savePropertyTenant] Demo mode: Skipping Supabase save");
    return;
  }

  try {
    // Get current active tenant
    const currentTenant = await getCurrentPropertyTenant(propertyId);
    
    // Deactivate current tenant if exists
    if (currentTenant) {
      await deactivatePropertyContact(currentTenant.id);
    }
    
    // Create new tenant if tenantData has at least one field filled
    if (tenantData.nombreCompleto || tenantData.email || tenantData.telefonoNumero) {
      await createPropertyTenant(propertyId, tenantData, false);
    }
    
    console.log("[savePropertyTenant] Tenant saved successfully");
  } catch (error: any) {
    console.error("[savePropertyTenant] Error saving tenant:", error);
    throw error;
  }
}

/**
 * Update an existing property tenant (using new contacts architecture)
 */
export async function updatePropertyTenant(
  propertyContactId: string,
  updates: Partial<InquilinoData>
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyTenant] Demo mode: Skipping Supabase update");
    return;
  }

  // Get property-contact to find contact_id
  const supabase = createClient();
  const { data: propertyContact } = await supabase
    .from("property_contact")
    .select("contact_id")
    .eq("id", propertyContactId)
    .single();

  if (!propertyContact) {
    throw new Error("Relación property-contact no encontrada");
  }

  // Update contact if name/email/phone changed
  const contactUpdates: any = {};
  if (updates.nombreCompleto) contactUpdates.name = updates.nombreCompleto;
  if (updates.email) contactUpdates.email = updates.email;
  if (updates.telefonoPais) contactUpdates.phone_country_code = updates.telefonoPais;
  if (updates.telefonoNumero) contactUpdates.phone_number = updates.telefonoNumero;

  if (Object.keys(contactUpdates).length > 0) {
    await supabase
      .from("contacts")
      .update(contactUpdates)
      .eq("id", propertyContact.contact_id);
  }

  // Update property-contact relationship
  const propertyContactUpdates: any = {};
  if (updates.fechaFinalizacionContrato !== undefined) propertyContactUpdates.fecha_finalizacion_contrato = updates.fechaFinalizacionContrato || null;
  if (updates.periodoPreaviso !== undefined) propertyContactUpdates.periodo_preaviso = updates.periodoPreaviso || null;
  if (updates.subrogacionContrato !== undefined) propertyContactUpdates.subrogacion_contrato = updates.subrogacionContrato || null;
  if (updates.importeAlquilerTransferir !== undefined) propertyContactUpdates.importe_alquiler_transferir = updates.importeAlquilerTransferir || null;
  if (updates.ultimaActualizacionAlquiler !== undefined) propertyContactUpdates.ultima_actualizacion_alquiler = updates.ultimaActualizacionAlquiler || null;
  if (updates.fechaUltimoRecibo !== undefined) propertyContactUpdates.fecha_ultimo_recibo = updates.fechaUltimoRecibo || null;
  if (updates.fechaVencimientoSeguroAlquiler !== undefined) propertyContactUpdates.fecha_vencimiento_seguro_alquiler = updates.fechaVencimientoSeguroAlquiler || null;
  if (updates.estadoSeguroAlquiler !== undefined) propertyContactUpdates.estado_seguro_alquiler = updates.estadoSeguroAlquiler || null;
  if (updates.proveedorSeguroAlquiler !== undefined) propertyContactUpdates.proveedor_seguro_alquiler = updates.proveedorSeguroAlquiler || null;
  if (updates.dniNie) propertyContactUpdates.dni_nie_files = updates.dniNie;
  if (updates.contratoArrendamiento) propertyContactUpdates.contrato_arrendamiento_files = updates.contratoArrendamiento;
  if (updates.justificantesPago) propertyContactUpdates.justificantes_pago_files = updates.justificantesPago;
  if (updates.comprobanteTransferenciaVendedor) propertyContactUpdates.comprobante_transferencia_vendedor_files = updates.comprobanteTransferenciaVendedor;
  if (updates.justificanteDeposito) propertyContactUpdates.justificante_deposito_files = updates.justificanteDeposito;

  if (Object.keys(propertyContactUpdates).length > 0) {
    await updatePropertyContact(propertyContactId, propertyContactUpdates);
  }
}

/**
 * Deactivate a specific property tenant (using new contacts architecture)
 */
export async function deactivatePropertyTenant(propertyContactId: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deactivatePropertyTenant] Demo mode: Skipping Supabase update");
    return;
  }

  await deactivatePropertyContact(propertyContactId);
}

/**
 * Deactivate all active tenants for a property (using new contacts architecture)
 */
export async function deactivatePropertyTenants(propertyId: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deactivatePropertyTenants] Demo mode: Skipping Supabase update");
    return;
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("property_contact")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq("property_id", propertyId)
      .eq("role", "tenant")
      .eq("is_active", true);

    if (error) {
      console.error("[deactivatePropertyTenants] Error deactivating tenants:", error);
      throw new Error(`Error al desactivar inquilinos: ${error.message}`);
    }

    console.log("[deactivatePropertyTenants] Tenants deactivated successfully");
  } catch (error: any) {
    console.error("[deactivatePropertyTenants] Unexpected error:", error);
    throw error;
  }
}

/**
 * Get all tenants for a property (with history)
 */
export async function getPropertyTenants(propertyId: string): Promise<PropertyTenantRow[]> {
  if (isDemoMode()) {
    console.warn("[getPropertyTenants] Demo mode: Returning empty array");
    return [];
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("property_tenants")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPropertyTenants] Error fetching tenants:", error);
      throw error;
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      dni_nie: (row.dni_nie as FileUpload[] | undefined) || [],
      contrato_arrendamiento: (row.contrato_arrendamiento as FileUpload[] | undefined) || [],
      justificantes_pago: (row.justificantes_pago as FileUpload[] | undefined) || [],
      comprobante_transferencia_vendedor: (row.comprobante_transferencia_vendedor as FileUpload[] | undefined) || [],
      justificante_deposito: (row.justificante_deposito as FileUpload[] | undefined) || [],
    }));
  } catch (error: any) {
    console.error("[getPropertyTenants] Unexpected error:", error);
    return [];
  }
}

/**
 * Get only active tenant for a property (using new contacts architecture)
 */
export async function getCurrentPropertyTenant(propertyId: string): Promise<PropertyTenantRow | null> {
  if (isDemoMode()) {
    console.warn("[getCurrentPropertyTenant] Demo mode: Returning null");
    return null;
  }

  try {
    const propertyContacts = await getPropertyContactsByRole(propertyId, "tenant");
    
    if (propertyContacts.length === 0) return null;

    const pc = propertyContacts[0]; // Get first active tenant
    
    // Map to PropertyTenantRow format for backward compatibility
    return {
      id: pc.id,
      property_id: pc.property_id,
      nombre_completo: pc.contact.name,
      email: pc.contact.email,
      telefono_pais: pc.contact.phone_country_code,
      telefono_numero: pc.contact.phone_number,
      dni_nie: pc.dni_nie_files || [],
      contrato_arrendamiento: pc.contrato_arrendamiento_files || [],
      fecha_finalizacion_contrato: pc.fecha_finalizacion_contrato,
      periodo_preaviso: pc.periodo_preaviso,
      subrogacion_contrato: pc.subrogacion_contrato as any,
      importe_alquiler_transferir: pc.importe_alquiler_transferir,
      ultima_actualizacion_alquiler: pc.ultima_actualizacion_alquiler,
      justificantes_pago: pc.justificantes_pago_files || [],
      fecha_ultimo_recibo: pc.fecha_ultimo_recibo,
      comprobante_transferencia_vendedor: pc.comprobante_transferencia_vendedor_files || [],
      justificante_deposito: pc.justificante_deposito_files || [],
      fecha_vencimiento_seguro_alquiler: pc.fecha_vencimiento_seguro_alquiler,
      estado_seguro_alquiler: pc.estado_seguro_alquiler as any,
      proveedor_seguro_alquiler: pc.proveedor_seguro_alquiler,
      is_active: pc.is_active,
      created_at: pc.created_at,
      updated_at: pc.updated_at,
      deactivated_at: pc.deactivated_at,
    };
  } catch (error: any) {
    console.error("[getCurrentPropertyTenant] Unexpected error:", error);
    return null;
  }
}

/**
 * Convert PropertyTenantRow to InquilinoData
 */
export function tenantRowToInquilinoData(row: PropertyTenantRow): InquilinoData {
  return {
    nombreCompleto: row.nombre_completo,
    email: row.email,
    telefonoPais: row.telefono_pais,
    telefonoNumero: row.telefono_numero,
    dniNie: row.dni_nie || [],
    contratoArrendamiento: row.contrato_arrendamiento || [],
    fechaFinalizacionContrato: row.fecha_finalizacion_contrato,
    periodoPreaviso: row.periodo_preaviso,
    subrogacionContrato: row.subrogacion_contrato,
    importeAlquilerTransferir: row.importe_alquiler_transferir,
    ultimaActualizacionAlquiler: row.ultima_actualizacion_alquiler,
    justificantesPago: row.justificantes_pago || [],
    fechaUltimoRecibo: row.fecha_ultimo_recibo,
    comprobanteTransferenciaVendedor: row.comprobante_transferencia_vendedor || [],
    justificanteDeposito: row.justificante_deposito || [],
    fechaVencimientoSeguroAlquiler: row.fecha_vencimiento_seguro_alquiler,
    estadoSeguroAlquiler: row.estado_seguro_alquiler,
    proveedorSeguroAlquiler: row.proveedor_seguro_alquiler,
  };
}
