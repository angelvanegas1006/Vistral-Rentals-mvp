import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "./utils";

export type PropertyContactRole = 'seller' | 'tenant' | 'owner' | 'partner' | 'assigned_to' | 'created_by';

export interface ContactRow {
  id: string;
  name: string;
  email?: string;
  phone_country_code?: string;
  phone_number?: string;
  dni_nif_cif?: string;
  is_operator: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  changed_by_user_id?: string;
}

export interface PropertyContactRow {
  id: string;
  property_id: string;
  contact_id: string;
  role: PropertyContactRole;
  is_active: boolean;
  // Seller-specific fields
  dni_adjunto?: any[];
  // Tenant-specific fields
  fecha_finalizacion_contrato?: string;
  periodo_preaviso?: number;
  subrogacion_contrato?: string;
  importe_alquiler_transferir?: number;
  ultima_actualizacion_alquiler?: string;
  fecha_ultimo_recibo?: string;
  fecha_vencimiento_seguro_alquiler?: string;
  estado_seguro_alquiler?: string;
  proveedor_seguro_alquiler?: string;
  // Files
  dni_nie_files?: any[];
  contrato_arrendamiento_files?: any[];
  justificantes_pago_files?: any[];
  comprobante_transferencia_vendedor_files?: any[];
  justificante_deposito_files?: any[];
  created_at: string;
  updated_at: string;
  deactivated_at?: string;
}

/**
 * Create or find a contact by email or DNI
 */
export async function createOrFindContact(
  name: string,
  email?: string,
  phoneCountryCode?: string,
  phoneNumber?: string,
  dniNifCif?: string
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createOrFindContact] Demo mode: Skipping Supabase");
    return `contact_${Date.now()}`;
  }

  const supabase = createClient();

  // Try to find existing contact
  let query = supabase.from("contacts").select("id");
  
  if (email) {
    query = query.eq("email", email);
  } else if (dniNifCif) {
    query = query.eq("dni_nif_cif", dniNifCif);
  } else {
    // If no email or DNI, create new
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber,
        dni_nif_cif: dniNifCif,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear contacto: ${error.message}`);
    return data.id;
  }

  const { data: existing } = await query.limit(1).single();

  if (existing) {
    // Update existing contact with new data (phone, DNI, name, email)
    const updates: any = {};
    if (name) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phoneCountryCode !== undefined) updates.phone_country_code = phoneCountryCode;
    if (phoneNumber !== undefined) updates.phone_number = phoneNumber;
    if (dniNifCif !== undefined) updates.dni_nif_cif = dniNifCif;
    
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", existing.id);
      
      if (updateError) {
        console.warn("[createOrFindContact] Error updating contact:", updateError);
        // Continue anyway - return existing ID even if update fails
      }
    }
    
    return existing.id;
  }

  // Create new contact
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      name,
      email,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      dni_nif_cif: dniNifCif,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al crear contacto: ${error.message}`);
  return data.id;
}

/**
 * Get contact by ID
 */
export async function getContact(contactId: string): Promise<ContactRow | null> {
  if (isDemoMode()) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

/**
 * Create property-contact relationship
 */
export async function createPropertyContact(
  propertyId: string,
  contactId: string,
  role: PropertyContactRole,
  additionalData?: Partial<PropertyContactRow>
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createPropertyContact] Demo mode: Skipping Supabase");
    return `property_contact_${Date.now()}`;
  }

  const supabase = createClient();

  // Check if relationship already exists (active or inactive)
  const { data: existing } = await supabase
    .from("property_contact")
    .select("id, is_active")
    .eq("property_id", propertyId)
    .eq("contact_id", contactId)
    .eq("role", role)
    .maybeSingle();

  if (existing) {
    // Relationship exists, reactivate it and update additional data
    const updateData: any = {
      is_active: true,
      deactivated_at: null,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { data: updated, error: updateError } = await supabase
      .from("property_contact")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("[createPropertyContact] Error reactivating:", updateError);
      throw new Error(`Error al reactivar relación property-contact: ${updateError.message}`);
    }

    return updated.id;
  }

  // Deactivate previous active contacts with same role if needed
  if (role === 'seller' || role === 'tenant') {
    await supabase
      .from("property_contact")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("property_id", propertyId)
      .eq("role", role)
      .eq("is_active", true);
  }

  // Create new relationship
  const insertData: any = {
    property_id: propertyId,
    contact_id: contactId,
    role,
    is_active: true,
    ...additionalData,
  };

  const { data, error } = await supabase
    .from("property_contact")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[createPropertyContact] Error:", error);
    throw new Error(`Error al crear relación property-contact: ${error.message}`);
  }

  return data.id;
}

/**
 * Update property-contact relationship
 */
export async function updatePropertyContact(
  propertyContactId: string,
  updates: Partial<PropertyContactRow>
): Promise<void> {
  if (isDemoMode()) {
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("property_contact")
    .update(updates)
    .eq("id", propertyContactId);

  if (error) {
    throw new Error(`Error al actualizar relación: ${error.message}`);
  }
}

/**
 * Get all contacts for a property by role
 */
export async function getPropertyContactsByRole(
  propertyId: string,
  role: PropertyContactRole
): Promise<(PropertyContactRow & { contact: ContactRow })[]> {
  if (isDemoMode()) {
    return [];
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("property_contact")
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq("property_id", propertyId)
    .eq("role", role)
    .eq("is_active", true);

  if (error) {
    console.error("[getPropertyContactsByRole] Error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    contact: row.contact,
  }));
}

/**
 * Get all active contacts for a property (all roles)
 */
export async function getPropertyContacts(
  propertyId: string
): Promise<(PropertyContactRow & { contact: ContactRow })[]> {
  if (isDemoMode()) {
    return [];
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("property_contact")
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq("property_id", propertyId)
    .eq("is_active", true);

  if (error) {
    console.error("[getPropertyContacts] Error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    contact: row.contact,
  }));
}

/**
 * Deactivate property-contact relationship
 */
export async function deactivatePropertyContact(
  propertyContactId: string
): Promise<void> {
  if (isDemoMode()) {
    return;
  }

  const supabase = createClient();

  await supabase
    .from("property_contact")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq("id", propertyContactId);
}
