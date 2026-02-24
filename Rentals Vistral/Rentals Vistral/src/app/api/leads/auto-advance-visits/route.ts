import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLeadPhaseFromMtpStatuses } from "@/lib/leads/mtp-status";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/leads/auto-advance-visits
 * Scans ALL leads_properties in visita_agendada with visit_date <= now,
 * advances them to pendiente_de_evaluacion, and recalculates affected lead phases.
 */
export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[auto-advance] Missing SUPABASE_URL or SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const nowIso = new Date().toISOString();

    const { data: allVisitaAgendada, error: qErr } = await supabase
      .from("leads_properties")
      .select("id, leads_unique_id, visit_date")
      .eq("current_status", "visita_agendada");

    if (qErr) {
      console.error("[auto-advance] query error:", qErr);
      return NextResponse.json({ error: qErr.message }, { status: 500 });
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
        console.log(`[auto-advance] MTP ${lp.id} → pendiente_de_evaluacion (visit_date: ${lp.visit_date})`);
      }
    }

    for (const leadId of affectedLeadIds) {
      const { data: allMtps } = await supabase
        .from("leads_properties")
        .select("current_status")
        .eq("leads_unique_id", leadId);

      const statuses = (allMtps || []).map((m) => m.current_status as string).filter(Boolean);
      const newPhase = getLeadPhaseFromMtpStatuses(statuses);

      await supabase
        .from("leads")
        .update({ current_phase: newPhase })
        .eq("leads_unique_id", leadId);

      console.log(`[auto-advance] Lead ${leadId} phase → ${newPhase}`);
    }

    return NextResponse.json({
      advanced: advancedCount,
      leadsUpdated: affectedLeadIds.size,
    });
  } catch (error: unknown) {
    console.error("[auto-advance] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
