import { createClient } from "@/lib/supabase/client";
import { VendedorData, FileUpload } from "./supply-property-storage";
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

export interface PropertyOwnerRow {
  id: string;
  property_id: string;
  nombre_completo?: string;
  dni_nif_cif?: string;
  email?: string;
  telefono_pais?: string;
  telefono_numero?: string;
  dni_adjunto?: FileUpload[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at?: string;
}

/**
 * Create a new property owner (using new contacts architecture)
 * Deactivates previous active owners if needed
 */
export async function createPropertyOwner(
  propertyId: string,
  ownerData: VendedorData,
  deactivatePrevious: boolean = true
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createPropertyOwner] Demo mode: Skipping Supabase create");
    return `owner_${Date.now()}`;
  }

  // Create or find contact
  const contactId = await createOrFindContact(
    ownerData.nombreCompleto || "",
    ownerData.email,
    ownerData.telefonoPais,
    ownerData.telefonoNumero,
    ownerData.dniNifCif
  );

  // Create property-contact relationship with role 'seller'
  const propertyContactId = await createPropertyContact(
    propertyId,
    contactId,
    "seller",
    {
      dni_adjunto: ownerData.dniAdjunto || [],
    }
  );

  return propertyContactId;
}

/**
 * Update an existing property owner (using new contacts architecture)
 */
export async function updatePropertyOwner(
  propertyContactId: string,
  updates: Partial<VendedorData>
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyOwner] Demo mode: Skipping Supabase update");
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
  if (updates.nombreCompleto !== undefined) contactUpdates.name = updates.nombreCompleto;
  if (updates.email !== undefined) contactUpdates.email = updates.email;
  if (updates.telefonoPais !== undefined) contactUpdates.phone_country_code = updates.telefonoPais;
  if (updates.telefonoNumero !== undefined) contactUpdates.phone_number = updates.telefonoNumero;
  if (updates.dniNifCif !== undefined) contactUpdates.dni_nif_cif = updates.dniNifCif;

  if (Object.keys(contactUpdates).length > 0) {
    await supabase
      .from("contacts")
      .update(contactUpdates)
      .eq("id", propertyContact.contact_id);
  }

  // Update property-contact relationship
  const propertyContactUpdates: any = {};
  if (updates.dniAdjunto) propertyContactUpdates.dni_adjunto = updates.dniAdjunto;

  if (Object.keys(propertyContactUpdates).length > 0) {
    await updatePropertyContact(propertyContactId, propertyContactUpdates);
  }
}

/**
 * Deactivate a specific property owner (using new contacts architecture)
 */
export async function deactivatePropertyOwner(propertyContactId: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deactivatePropertyOwner] Demo mode: Skipping Supabase update");
    return;
  }

  await deactivatePropertyContact(propertyContactId);
}

/**
 * Deactivate all active owners for a property (using new contacts architecture)
 */
export async function deactivatePropertyOwners(propertyId: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deactivatePropertyOwners] Demo mode: Skipping Supabase update");
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
      .eq("role", "seller")
      .eq("is_active", true);

    if (error) {
      console.error("[deactivatePropertyOwners] Error deactivating owners:", error);
      throw new Error(`Error al desactivar dueños: ${error.message}`);
    }

    console.log("[deactivatePropertyOwners] Owners deactivated successfully");
  } catch (error: any) {
    console.error("[deactivatePropertyOwners] Unexpected error:", error);
    throw error;
  }
}

/**
 * Get all owners for a property (with history, using new contacts architecture)
 */
export async function getPropertyOwners(propertyId: string): Promise<PropertyOwnerRow[]> {
  if (isDemoMode()) {
    console.warn("[getPropertyOwners] Demo mode: Returning empty array");
    return [];
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("property_contact")
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq("property_id", propertyId)
      .eq("role", "seller")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPropertyOwners] Error fetching owners:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      property_id: row.property_id,
      nombre_completo: row.contact.name,
      dni_nif_cif: row.contact.dni_nif_cif,
      email: row.contact.email,
      telefono_pais: row.contact.phone_country_code,
      telefono_numero: row.contact.phone_number,
      dni_adjunto: row.dni_adjunto || [],
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deactivated_at: row.deactivated_at,
    }));
  } catch (error: any) {
    console.error("[getPropertyOwners] Unexpected error:", error);
    return [];
  }
}

/**
 * Save property owners to Supabase (replaces all active owners)
 */
export async function savePropertyOwners(
  propertyId: string,
  owners: VendedorData[]
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[savePropertyOwners] Demo mode: Skipping Supabase save");
    return;
  }

  try {
    // Get current active owners
    const currentOwners = await getCurrentPropertyOwners(propertyId);
    
    // Deactivate all current owners first
    for (const owner of currentOwners) {
      if (owner.is_active) {
        await deactivatePropertyOwner(owner.id);
      }
    }
    
    // Create new owners for each vendedor that has data
    for (const vendedor of owners) {
      if (vendedor.nombreCompleto || vendedor.email || vendedor.dniNifCif || vendedor.telefonoNumero) {
        await createPropertyOwner(propertyId, vendedor, false);
      }
    }
    
    console.log("[savePropertyOwners] Owners saved successfully");
  } catch (error: any) {
    console.error("[savePropertyOwners] Error saving owners:", error);
    throw error;
  }
}

/**
 * Get only active owners for a property (using new contacts architecture)
 */
export async function getCurrentPropertyOwners(propertyId: string): Promise<PropertyOwnerRow[]> {
  if (isDemoMode()) {
    console.warn("[getCurrentPropertyOwners] Demo mode: Returning empty array");
    return [];
  }

  try {
    const propertyContacts = await getPropertyContactsByRole(propertyId, "seller");
    
    // Map to PropertyOwnerRow format for backward compatibility
    return propertyContacts.map((pc) => ({
      id: pc.id,
      property_id: pc.property_id,
      nombre_completo: pc.contact.name,
      dni_nif_cif: pc.contact.dni_nif_cif,
      email: pc.contact.email,
      telefono_pais: pc.contact.phone_country_code,
      telefono_numero: pc.contact.phone_number,
      dni_adjunto: pc.dni_adjunto || [],
      is_active: pc.is_active,
      created_at: pc.created_at,
      updated_at: pc.updated_at,
      deactivated_at: pc.deactivated_at,
    }));
  } catch (error: any) {
    console.error("[getCurrentPropertyOwners] Unexpected error:", error);
    return [];
  }
}

/**
 * Convert PropertyOwnerRow to VendedorData
 */
export function ownerRowToVendedorData(row: PropertyOwnerRow): VendedorData {
  return {
    nombreCompleto: row.nombre_completo,
    dniNifCif: row.dni_nif_cif,
    email: row.email,
    telefonoPais: row.telefono_pais,
    telefonoNumero: row.telefono_numero,
    dniAdjunto: row.dni_adjunto || [],
  };
}
