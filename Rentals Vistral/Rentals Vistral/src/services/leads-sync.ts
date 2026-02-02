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
    // Obtener los IDs de leads asociados a esta propiedad
    // propertyId es property_unique_id
    const { data: leadProperties, error: leadPropsError } = await supabase
      .from("lead_properties")
      .select("lead_id")
      .eq("property_id", propertyId);

    if (leadPropsError) throw leadPropsError;

    if (!leadProperties || leadProperties.length === 0) {
      return [];
    }

    const leadIds = leadProperties.map((lp) => lp.lead_id);

    // Obtener los leads completos
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .in("id", leadIds);

    if (leadsError) throw leadsError;

    return leads || [];
  } catch (error) {
    console.error("Error fetching leads for property:", error);
    return [];
  }
}

/**
 * Asignar un lead a una propiedad
 * @param propertyId - property_unique_id de la propiedad
 */
export async function assignLeadToProperty(
  leadId: string,
  propertyId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("lead_properties").insert({
      lead_id: leadId,
      property_id: propertyId, // property_unique_id
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
 * @param propertyId - property_unique_id de la propiedad
 */
export async function unassignLeadFromProperty(
  leadId: string,
  propertyId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("lead_properties")
      .delete()
      .eq("lead_id", leadId)
      .eq("property_id", propertyId); // property_unique_id

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error unassigning lead from property:", error);
    return false;
  }
}

/**
 * Obtener todas las propiedades asignadas a un lead
 */
export async function getPropertiesForLead(leadId: string): Promise<string[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("lead_properties")
      .select("property_id")
      .eq("lead_id", leadId);

    if (error) throw error;

    return data?.map((item) => item.property_id) || [];
  } catch (error) {
    console.error("Error fetching properties for lead:", error);
    return [];
  }
}
