"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

/**
 * Servicio para sincronizar leads entre el Kanban de Leads y PublishedTasks
 * Los leads que están asignados a una propiedad en fase "Publicado" deben aparecer
 * en las listas de PublishedTasks de esa propiedad
 */

export async function getLeadsForProperty(propertyId: string): Promise<Lead[]> {
  const supabase = createClient();

  try {
    // propertyId es property_unique_id (properties_unique_id)
    const { data: leadProperties, error: leadPropsError } = await supabase
      .from("leads_properties")
      .select("leads_unique_id")
      .eq("properties_unique_id", propertyId);

    if (leadPropsError) throw leadPropsError;

    if (!leadProperties || leadProperties.length === 0) {
      return [];
    }

    const leadsUniqueIds = leadProperties.map((lp) => lp.leads_unique_id);

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .in("leads_unique_id", leadsUniqueIds);

    if (leadsError) throw leadsError;

    return leads || [];
  } catch (error) {
    console.error("Error fetching leads for property:", error);
    return [];
  }
}

/**
 * Asignar un lead a una propiedad
 * @param leadUniqueId - leads_unique_id del lead (ej: LEAD-001)
 * @param propertyUniqueId - property_unique_id de la propiedad (ej: PROP-001)
 */
export async function assignLeadToProperty(
  leadUniqueId: string,
  propertyUniqueId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("leads_properties").insert({
      leads_unique_id: leadUniqueId,
      properties_unique_id: propertyUniqueId,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error assigning lead to property:", error);
    return false;
  }
}

/**
 * Desasignar un lead de una propiedad
 * @param leadUniqueId - leads_unique_id del lead
 * @param propertyUniqueId - property_unique_id de la propiedad
 */
export async function unassignLeadFromProperty(
  leadUniqueId: string,
  propertyUniqueId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("leads_properties")
      .delete()
      .eq("leads_unique_id", leadUniqueId)
      .eq("properties_unique_id", propertyUniqueId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error unassigning lead from property:", error);
    return false;
  }
}

/**
 * Actualizar un registro de leads_properties
 * @param leadsPropertyId - id (UUID) del registro en leads_properties
 * @param data - campos a actualizar (ej. scheduled_visit_date)
 */
export async function updateLeadsProperty(
  leadsPropertyId: string,
  data: { scheduled_visit_date?: string | null }
): Promise<boolean> {
  try {
    const response = await fetch(`/api/leads-properties/${encodeURIComponent(leadsPropertyId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("Error updating leads_properties:", error);
    return false;
  }
}

/**
 * Obtener todas las propiedades asignadas a un lead
 * @param leadUniqueId - leads_unique_id del lead (ej: LEAD-001)
 */
export async function getPropertiesForLead(leadUniqueId: string): Promise<string[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("leads_properties")
      .select("properties_unique_id")
      .eq("leads_unique_id", leadUniqueId);

    if (error) throw error;

    return data?.map((item) => item.properties_unique_id) || [];
  } catch (error) {
    console.error("Error fetching properties for lead:", error);
    return [];
  }
}
