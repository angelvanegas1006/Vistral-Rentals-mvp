import { SupabaseClient } from "@supabase/supabase-js";
import { MTP_STATUS_TITLES, MTP_EXIT_STATUS_IDS, type MtpStatusId } from "./mtp-status";

export type LeadEventType = "PROPERTY_ADDED" | "MTP_UPDATE" | "PHASE_CHANGE" | "PHASE_CHANGE_BACKWARD" | "MTP_ARCHIVED";

export interface LeadEventPayload {
  leads_unique_id: string;
  properties_unique_id?: string | null;
  event_type: LeadEventType;
  title: string;
  description: string;
  new_status?: string | null;
}

export async function insertLeadEvent(
  supabase: SupabaseClient,
  payload: LeadEventPayload
): Promise<void> {
  try {
    const { error } = await supabase.from("lead_events").insert({
      leads_unique_id: payload.leads_unique_id,
      properties_unique_id: payload.properties_unique_id ?? null,
      event_type: payload.event_type,
      title: payload.title,
      description: payload.description,
      new_status: payload.new_status ?? null,
    });
    if (error) {
      console.error("[lead-events] insert failed:", error);
    }
  } catch (err) {
    console.error("[lead-events] unexpected error:", err);
  }
}

export function getMtpStatusTitle(status: string): string {
  return MTP_STATUS_TITLES[status as MtpStatusId] ?? status;
}

export function isMtpExitStatus(status: string): boolean {
  return MTP_EXIT_STATUS_IDS.includes(status as MtpStatusId);
}

const PHASE_RANK: Record<string, number> = {
  "Interesado Cualificado": 1,
  "Visita Agendada": 2,
  "Recogiendo Información": 3,
  "Calificación en Curso": 4,
  "Interesado Presentado": 5,
  "Interesado Aceptado": 6,
  "Interesado Perdido": 7,
  "Interesado Rechazado": 7,
};

export function isPhaseBackward(fromPhase: string, toPhase: string): boolean {
  return (PHASE_RANK[toPhase] ?? 0) < (PHASE_RANK[fromPhase] ?? 0);
}

export async function getPropertyAddress(
  supabase: SupabaseClient,
  propertiesUniqueId: string
): Promise<string> {
  const { data } = await supabase
    .from("properties")
    .select("address")
    .eq("property_unique_id", propertiesUniqueId)
    .single();
  return (data?.address as string) || "Propiedad";
}
