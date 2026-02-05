import { createClient } from "@/lib/supabase/client";
import { ChecklistData, ChecklistType } from "./supply-checklist-storage";
import { isDemoMode } from "./utils";
import { validatePropertyComplete } from "./supply-property-validation";
import { getPropertyBasicData, getPropertyFromSupabase, mapStageToSupplyPhase } from "./supply-property-supabase";

export interface PropertyChecklistRow {
  id: string;
  property_id: string;
  checklist_type: ChecklistType;
  version: number;
  sections: Record<string, any>;
  completed_at?: string;
  created_at: string;
  created_by?: string;
  is_current: boolean;
}

/**
 * Create a new checklist version (deactivates previous versions automatically via trigger)
 */
export async function createPropertyChecklist(
  propertyId: string,
  checklistType: ChecklistType,
  sections: Record<string, any>,
  completedAt?: string
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createPropertyChecklist] Demo mode: Skipping Supabase create");
    return `checklist_${Date.now()}`;
  }

  const supabase = createClient();

  // Get current user for created_by
  const { data: { user } } = await supabase.auth.getUser();

  // Get next version number
  const { data: existingChecklists } = await supabase
    .from("property_checklists")
    .select("version")
    .eq("property_id", propertyId)
    .eq("checklist_type", checklistType)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existingChecklists && existingChecklists.length > 0
    ? existingChecklists[0].version + 1
    : 1;

  const insertData = {
    property_id: propertyId,
    checklist_type: checklistType,
    version: nextVersion,
    sections: sections,
    completed_at: completedAt || null,
    created_by: user?.id || null,
    is_current: true, // Trigger will deactivate previous versions
  };

  try {
    const { data, error } = await supabase
      .from("property_checklists")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[createPropertyChecklist] Error creating checklist:", error);
      throw new Error(`Error al crear checklist: ${error.message}`);
    }

    console.log("[createPropertyChecklist] Checklist created successfully:", data?.id);
    return data?.id;
  } catch (error: any) {
    console.error("[createPropertyChecklist] Unexpected error:", error);
    throw error;
  }
}

/**
 * Update an existing checklist
 */
export async function updatePropertyChecklist(
  checklistId: string,
  updates: {
    sections?: Record<string, any>;
    completedAt?: string;
  },
  options?: {
    skipAutoValidation?: boolean; // Skip automatic validation and stage advancement
  }
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyChecklist] Demo mode: Skipping Supabase update");
    return;
  }

  const supabase = createClient();

  const updateData: any = {};

  if (updates.sections !== undefined) {
    updateData.sections = updates.sections;
  }

  if (updates.completedAt !== undefined) {
    updateData.completed_at = updates.completedAt || null;
  }

  try {
    // First, get the property_id from the checklist
    const { data: checklistData, error: fetchError } = await supabase
      .from("property_checklists")
      .select("property_id")
      .eq("id", checklistId)
      .single();

    if (fetchError) {
      console.error("[updatePropertyChecklist] Error fetching checklist:", fetchError);
      throw new Error(`Error al obtener checklist: ${fetchError.message}`);
    }

    const propertyId = checklistData?.property_id;
    if (!propertyId) {
      console.error("[updatePropertyChecklist] No property_id found for checklist");
      throw new Error("No se encontró la propiedad asociada al checklist");
    }

    // Update the checklist
    const { error } = await supabase
      .from("property_checklists")
      .update(updateData)
      .eq("id", checklistId);

    if (error) {
      console.error("[updatePropertyChecklist] Error updating checklist:", error);
      throw new Error(`Error al actualizar checklist: ${error.message}`);
    }
    
    // Skip auto-validation if requested (e.g., when explicitly submitting or during debounced saves)
    // Auto-validation is expensive and can cause timeouts, so we skip it for debounced saves
    // Validation will happen when user explicitly saves/submits
    if (options?.skipAutoValidation) {
      return;
    }
    
    // Auto-validation is now disabled by default to prevent timeouts
    // The validation logic has been moved to explicit save/submit actions
    // This prevents timeouts during frequent debounced updates
  } catch (error: any) {
    console.error("[updatePropertyChecklist] Unexpected error:", error);
    throw error;
  }
}

/**
 * Get all checklist versions for a property
 */
export async function getPropertyChecklists(
  propertyId: string,
  checklistType?: ChecklistType
): Promise<PropertyChecklistRow[]> {
  if (isDemoMode()) {
    console.warn("[getPropertyChecklists] Demo mode: Returning empty array");
    return [];
  }

  const supabase = createClient();

  let query = supabase
    .from("property_checklists")
    .select("*")
    .eq("property_id", propertyId);

  if (checklistType) {
    query = query.eq("checklist_type", checklistType);
  }

  query = query.order("version", { ascending: false });

  try {
    const { data, error } = await query;

    if (error) {
      console.error("[getPropertyChecklists] Error fetching checklists:", error);
      throw error;
    }

    return (data || []).map((row: PropertyChecklistRow) => ({
      ...row,
      sections: row.sections || {},
    }));
  } catch (error: any) {
    console.error("[getPropertyChecklists] Unexpected error:", error);
    return [];
  }
}

/**
 * Get only the current (most recent active) checklist version
 */
export async function getCurrentPropertyChecklist(
  propertyId: string,
  checklistType: ChecklistType = "supply_initial"
): Promise<PropertyChecklistRow | null> {
  if (isDemoMode()) {
    console.warn("[getCurrentPropertyChecklist] Demo mode: Returning null");
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("property_checklists")
      .select("*")
      .eq("property_id", propertyId)
      .eq("checklist_type", checklistType)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error 406 cuando no hay resultados

    if (error) {
      // Si la tabla no existe, retornar null silenciosamente
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn("[getCurrentPropertyChecklist] Table property_checklists does not exist. Please run migration 007_property_checklists.sql");
        return null;
      }
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("[getCurrentPropertyChecklist] Error fetching checklist:", error);
      // No lanzar error, solo retornar null para que la app continúe funcionando
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      sections: data.sections || {},
    };
  } catch (error: any) {
    // Manejar errores de tabla no encontrada
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[getCurrentPropertyChecklist] Table property_checklists does not exist. Please run migration 007_property_checklists.sql");
      return null;
    }
    console.error("[getCurrentPropertyChecklist] Unexpected error:", error);
    return null;
  }
}

/**
 * Convert PropertyChecklistRow to ChecklistData
 */
export function checklistRowToChecklistData(row: PropertyChecklistRow): ChecklistData {
  return {
    propertyId: row.property_id,
    checklistType: row.checklist_type as ChecklistType,
    sections: row.sections,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.created_at, // Use created_at as fallback
  };
}
