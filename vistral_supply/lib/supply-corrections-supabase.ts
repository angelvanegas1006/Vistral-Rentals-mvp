import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "./utils";

export type CorrectionCategory = "overview" | "condition" | "documents" | "contacts" | "rental";
export type CorrectionStatus = "pending" | "resolved" | "approved";

export interface PropertyCorrection {
  id: string;
  property_id: string;
  category: CorrectionCategory;
  subcategory: string;
  description: string;
  status: CorrectionStatus;
  created_by: string;
  resolved_by?: string | null;
  approved_by?: string | null;
  created_at: string;
  resolved_at?: string | null;
  approved_at?: string | null;
  updated_at: string;
  // Joined user data
  created_by_name?: string;
  resolved_by_name?: string;
  approved_by_name?: string;
}

export interface CreateCorrectionInput {
  propertyId: string;
  category: CorrectionCategory;
  subcategory: string;
  description: string;
}

export interface UpdateCorrectionInput {
  description?: string;
  status?: CorrectionStatus;
}

/**
 * Get all corrections for a property
 */
export async function getPropertyCorrections(propertyId: string): Promise<PropertyCorrection[]> {
  if (isDemoMode()) {
    console.warn("[getPropertyCorrections] Demo mode: Returning empty array");
    return [];
  }

  const supabase = createClient();

  // Get corrections without user joins (Supabase can't join with auth.users)
  const { data, error } = await supabase
    .from("property_corrections")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPropertyCorrections] Error fetching corrections:", error);
    throw new Error(`Error al obtener correcciones: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = new Set<string>();
  data.forEach((correction: any) => {
    if (correction.created_by) userIds.add(correction.created_by);
    if (correction.resolved_by) userIds.add(correction.resolved_by);
    if (correction.approved_by) userIds.add(correction.approved_by);
  });

  // Get user emails using the get_users_with_roles function
  let usersMap: Map<string, string> = new Map();
  if (userIds.size > 0) {
    try {
      const { data: usersData } = await supabase.rpc("get_users_with_roles");
      if (usersData) {
        usersData.forEach((user: any) => {
          if (userIds.has(user.id)) {
            // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
            const emailParts = user.email?.split("@")[0] || "";
            const name = emailParts
              .split(".")
              .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ") || user.email || "Unknown";
            usersMap.set(user.id, name);
          }
        });
      }
    } catch (err) {
      console.warn("[getPropertyCorrections] Could not fetch user names:", err);
    }
  }

  // Transform the data to include user names
  return data.map((row: any) => ({
    id: row.id,
    property_id: row.property_id,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    status: row.status,
    created_by: row.created_by,
    resolved_by: row.resolved_by,
    approved_by: row.approved_by,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    approved_at: row.approved_at,
    updated_at: row.updated_at,
    created_by_name: row.created_by ? usersMap.get(row.created_by) || null : null,
    resolved_by_name: row.resolved_by ? usersMap.get(row.resolved_by) || null : null,
    approved_by_name: row.approved_by ? usersMap.get(row.approved_by) || null : null,
  }));
}

/**
 * Get corrections count for a property (pending + resolved)
 */
export async function getPropertyCorrectionsCount(propertyId: string): Promise<number> {
  if (isDemoMode()) {
    return 0;
  }

  const supabase = createClient();

  const { count, error } = await supabase
    .from("property_corrections")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .in("status", ["pending", "resolved"]);

  if (error) {
    console.error("[getPropertyCorrectionsCount] Error counting corrections:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Create a new correction
 */
export async function createPropertyCorrection(
  input: CreateCorrectionInput,
  userId: string
): Promise<PropertyCorrection> {
  if (isDemoMode()) {
    console.warn("[createPropertyCorrection] Demo mode: Skipping creation");
      return {
        id: `demo-${Date.now()}`,
        property_id: input.propertyId,
        category: input.category,
        subcategory: input.subcategory,
        description: input.description,
        status: "pending",
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("property_corrections")
    .insert({
      property_id: input.propertyId,
      category: input.category,
      subcategory: input.subcategory,
      description: input.description,
      status: "pending",
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createPropertyCorrection] Error creating correction:", error);
    throw new Error(`Error al crear corrección: ${error.message}`);
  }

  return {
    id: data.id,
    property_id: data.property_id,
    category: data.category,
    subcategory: data.subcategory,
    description: data.description,
    status: data.status,
    created_by: data.created_by,
    resolved_by: data.resolved_by,
    approved_by: data.approved_by,
    created_at: data.created_at,
    resolved_at: data.resolved_at,
    approved_at: data.approved_at,
    updated_at: data.updated_at,
    created_by_name: undefined, // Will be populated when fetching all corrections
  };
}

/**
 * Update a correction
 */
export async function updatePropertyCorrection(
  correctionId: string,
  updates: UpdateCorrectionInput,
  userId: string
): Promise<PropertyCorrection> {
  if (isDemoMode()) {
    console.warn("[updatePropertyCorrection] Demo mode: Skipping update");
    throw new Error("Demo mode: Cannot update corrections");
  }

  const supabase = createClient();

  const updateData: any = {};
  
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    
    // Set resolved_by and resolved_at when status changes to resolved
    if (updates.status === "resolved") {
      updateData.resolved_by = userId;
      updateData.resolved_at = new Date().toISOString();
    }
    
    // Set approved_by and approved_at when status changes to approved
    if (updates.status === "approved") {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("property_corrections")
    .update(updateData)
    .eq("id", correctionId)
    .select("*")
    .single();

  if (error) {
    console.error("[updatePropertyCorrection] Error updating correction:", error);
    throw new Error(`Error al actualizar corrección: ${error.message}`);
  }

  return {
    id: data.id,
    property_id: data.property_id,
    category: data.category,
    subcategory: data.subcategory,
    description: data.description,
    status: data.status,
    created_by: data.created_by,
    resolved_by: data.resolved_by,
    approved_by: data.approved_by,
    created_at: data.created_at,
    resolved_at: data.resolved_at,
    approved_at: data.approved_at,
    updated_at: data.updated_at,
    created_by_name: undefined, // Will be populated when fetching all corrections
    resolved_by_name: undefined, // Will be populated when fetching all corrections
    approved_by_name: undefined, // Will be populated when fetching all corrections
  };
}

/**
 * Delete a correction
 */
export async function deletePropertyCorrection(correctionId: string): Promise<void> {
  if (isDemoMode()) {
    console.warn("[deletePropertyCorrection] Demo mode: Skipping deletion");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("property_corrections")
    .delete()
    .eq("id", correctionId);

  if (error) {
    console.error("[deletePropertyCorrection] Error deleting correction:", error);
    throw new Error(`Error al eliminar corrección: ${error.message}`);
  }
}

/**
 * Resolve a correction (partner marks as resolved)
 */
export async function resolveCorrection(
  correctionId: string,
  userId: string
): Promise<PropertyCorrection> {
  return updatePropertyCorrection(correctionId, { status: "resolved" }, userId);
}

/**
 * Approve a correction (analyst approves resolved correction)
 */
export async function approveCorrection(
  correctionId: string,
  userId: string
): Promise<PropertyCorrection> {
  return updatePropertyCorrection(correctionId, { status: "approved" }, userId);
}

/**
 * Check if property has pending corrections
 */
export async function hasPendingCorrections(propertyId: string): Promise<boolean> {
  if (isDemoMode()) {
    return false;
  }

  const supabase = createClient();

  const { count, error } = await supabase
    .from("property_corrections")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("status", "pending");

  if (error) {
    console.error("[hasPendingCorrections] Error checking corrections:", error);
    return false;
  }

  return (count || 0) > 0;
}
