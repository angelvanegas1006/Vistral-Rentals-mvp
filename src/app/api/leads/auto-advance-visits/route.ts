import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLeadPhaseFromMtpStatuses } from "@/lib/leads/mtp-status";
import { insertLeadEvent, getPropertyAddress } from "@/lib/leads/lead-events";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads/auto-advance-visits
 * Scans ALL leads_properties in visita_agendada with visit_date <= now,
 * advances them to pendiente_de_evaluacion, and recalculates affected lead phases.
 */
export async function POST() {
  try {
    const supabase = createServiceClient();

    const nowIso = new Date().toISOString();

    const { data: allVisitaAgendada, error: qErr } = await supabase
      .from("leads_properties")
      .select("id, leads_unique_id, visit_date, properties_unique_id")
      .eq("current_status", "visita_agendada");

    if (qErr) {
      console.error("[auto-advance] query error:", qErr);
      return NextResponse.json({ success: false, error: qErr.message }, { status: 500 });
    }

    const nowMs = Date.now();
    const toAdvance = (allVisitaAgendada ?? []).filter((lp) => {
      const raw = lp.visit_date as string | null;
      if (!raw) return false;
      const ms = new Date(raw).getTime();
      return !Number.isNaN(ms) && ms <= nowMs;
    });

    console.log(`[auto-advance] visita_agendada total: ${allVisitaAgendada?.length ?? 0}, past: ${toAdvance.length} (now=${nowIso})`);

    const affectedLeadIds = new Set<string>();
    const advancedByLead = new Map<string, string[]>();
    let advancedCount = 0;

    for (const lp of toAdvance ?? []) {
      const { error: uErr } = await supabase
        .from("leads_properties")
        .update({
          current_status: "pendiente_de_evaluacion",
          previous_status: "visita_agendada",
        })
        .eq("id", lp.id);

      if (uErr) {
        console.error(`[auto-advance] update failed for MTP ${lp.id}:`, uErr);
      } else {
        advancedCount++;
        affectedLeadIds.add(lp.leads_unique_id);
        const list = advancedByLead.get(lp.leads_unique_id) ?? [];
        list.push(lp.properties_unique_id);
        advancedByLead.set(lp.leads_unique_id, list);
        console.log(`[auto-advance] MTP ${lp.id} → pendiente_de_evaluacion (visit_date: ${lp.visit_date})`);
      }
    }

    for (const leadId of affectedLeadIds) {
      const { data: leadRow } = await supabase
        .from("leads")
        .select("current_phase")
        .eq("leads_unique_id", leadId)
        .single();
      const oldPhase = (leadRow?.current_phase as string) || "";

      const { data: allMtps } = await supabase
        .from("leads_properties")
        .select("current_status")
        .eq("leads_unique_id", leadId);

      const statuses = (allMtps || []).map((m) => m.current_status as string).filter(Boolean);
      const newPhase = getLeadPhaseFromMtpStatuses(statuses);
      const phaseChanged = newPhase !== oldPhase;

      await supabase
        .from("leads")
        .update({ current_phase: newPhase })
        .eq("leads_unique_id", leadId);

      const propIds = advancedByLead.get(leadId) ?? [];
      for (const propId of propIds) {
        const addr = await getPropertyAddress(supabase, propId);
        if (phaseChanged) {
          await insertLeadEvent(supabase, {
            leads_unique_id: leadId,
            properties_unique_id: propId,
            event_type: "PHASE_CHANGE",
            title: `Movimiento a: ${newPhase}`,
            description: `El interesado ha cambiado de fase porque la propiedad ${addr} ha pasado al estado Pendiente de Evaluación.`,
            new_status: "pendiente_de_evaluacion",
          });
        } else {
          await insertLeadEvent(supabase, {
            leads_unique_id: leadId,
            properties_unique_id: propId,
            event_type: "MTP_UPDATE",
            title: `Actualización en ${addr}`,
            description: `El estado de la propiedad ha cambiado a: Pendiente de Evaluación.`,
            new_status: "pendiente_de_evaluacion",
          });
        }
      }

      console.log(`[auto-advance] Lead ${leadId} phase → ${newPhase}`);
    }

    return NextResponse.json({
      advanced: advancedCount,
      leadsUpdated: affectedLeadIds.size,
    });
  } catch (error: unknown) {
    console.error("[auto-advance] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
