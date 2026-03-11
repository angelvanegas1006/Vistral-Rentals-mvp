import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLeadPhaseFromMtpStatuses } from "@/lib/leads/mtp-status";
import { insertLeadEvent, getPropertyAddress } from "@/lib/leads/lead-events";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads/[leadId]/properties
 * Obtiene leads_properties con properties unidos para un lead.
 * leadId = leads_unique_id (ej: LEAD-001)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { success: false, error: "leadId (leads_unique_id) is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Auto-advance: Visita Agendada -> Pendiente de Evaluación cuando visit_date <= now
    const { data: allVisitaAgendada, error: advanceQueryError } = await supabase
      .from("leads_properties")
      .select("id, visit_date, properties_unique_id")
      .eq("leads_unique_id", leadId)
      .eq("current_status", "visita_agendada");

    if (advanceQueryError) {
      console.error(`[auto-advance lead=${leadId}] query error:`, advanceQueryError);
    }

    const nowMs = Date.now();
    const toAdvance = (allVisitaAgendada ?? []).filter((lp) => {
      const raw = lp.visit_date as string | null;
      if (!raw) return false;
      const ms = new Date(raw).getTime();
      return !Number.isNaN(ms) && ms <= nowMs;
    });

    let didAutoAdvance = false;
    const autoAdvancedPropIds: string[] = [];
    if (toAdvance.length) {
      console.log(`[auto-advance lead=${leadId}] Found ${toAdvance.length} MTPs to advance (total visita_agendada: ${allVisitaAgendada?.length ?? 0})`);
      for (const lp of toAdvance) {
        const { error: updateErr } = await supabase
          .from("leads_properties")
          .update({
            current_status: "pendiente_de_evaluacion",
            previous_status: "visita_agendada",
          })
          .eq("id", lp.id);

        if (updateErr) {
          console.error(`[auto-advance] MTP ${lp.id} update failed:`, updateErr);
        } else {
          didAutoAdvance = true;
          autoAdvancedPropIds.push(lp.properties_unique_id);
          console.log(`[auto-advance] MTP ${lp.id} → pendiente_de_evaluacion`);
        }
      }
    }

    if (didAutoAdvance) {
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

      for (const propId of autoAdvancedPropIds) {
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

      console.log(`[auto-advance lead=${leadId}] phase → ${newPhase}`);
    }

    const { data: leadProps, error: lpError } = await supabase
      .from("leads_properties")
      .select("*")
      .eq("leads_unique_id", leadId);

    if (lpError) throw lpError;

    if (!leadProps || leadProps.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const propertyIds = leadProps.map((lp) => lp.properties_unique_id);

    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .in("property_unique_id", propertyIds);

    if (propError) throw propError;

    const propertyMap = new Map(
      (properties || []).map((p) => [p.property_unique_id, p])
    );

    const items = leadProps
      .map((lp) => {
        const property = propertyMap.get(lp.properties_unique_id);
        if (!property) return null;
        return { leadsProperty: lp, property };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ items, didAutoAdvance });
  } catch (error: unknown) {
    console.error("[Fetch Lead Properties Error]:", error);
    const message = error instanceof Error ? error.message : "Error al cargar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/leads/[leadId]/properties
 * Adds a property to the lead (creates a leads_properties record).
 * Body: { properties_unique_id: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { success: false, error: "leadId (leads_unique_id) is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { properties_unique_id } = body;

    if (!properties_unique_id?.trim()) {
      return NextResponse.json(
        { success: false, error: "properties_unique_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check for duplicate
    const { data: existing } = await supabase
      .from("leads_properties")
      .select("id")
      .eq("leads_unique_id", leadId)
      .eq("properties_unique_id", properties_unique_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Esta propiedad ya está asignada a este interesado" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("leads_properties")
      .insert({
        leads_unique_id: leadId,
        properties_unique_id: properties_unique_id,
        current_status: "interesado_cualificado",
      })
      .select()
      .single();

    if (error) throw error;

    const address = await getPropertyAddress(supabase, properties_unique_id);
    await insertLeadEvent(supabase, {
      leads_unique_id: leadId,
      properties_unique_id: properties_unique_id,
      event_type: "PROPERTY_ADDED",
      title: "Nueva propiedad en gestión",
      description: `Se ha vinculado la propiedad ${address} a este interesado.`,
      new_status: "interesado_cualificado",
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Add Property To Lead Error]:", error);
    const message = error instanceof Error ? error.message : "Error al asignar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
