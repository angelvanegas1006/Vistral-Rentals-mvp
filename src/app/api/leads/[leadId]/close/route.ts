import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MTP_EXIT_STATUS_IDS } from "@/lib/leads/mtp-status";
import { insertLeadEvent } from "@/lib/leads/lead-events";

const CLOSURE_TYPE_TO_PHASE: Record<string, string> = {
  perdido: "Interesado Perdido",
  rechazado: "Interesado Rechazado",
};

const CLOSURE_TYPE_TO_MTP_STATUS: Record<string, string> = {
  perdido: "interesado_perdido",
  rechazado: "interesado_rechazado",
};

/**
 * POST /api/leads/[leadId]/close
 * Cierre global del lead: marca como Perdido o Rechazado,
 * actualiza todas las MTPs activas en cascada, e inserta evento.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      closure_type,
      exit_reason,
      exit_comments,
    }: {
      closure_type: "perdido" | "rechazado";
      exit_reason: string;
      exit_comments?: string;
    } = body;

    if (!closure_type || !CLOSURE_TYPE_TO_PHASE[closure_type]) {
      return NextResponse.json(
        { error: "closure_type must be 'perdido' or 'rechazado'" },
        { status: 400 }
      );
    }

    if (!exit_reason?.trim()) {
      return NextResponse.json(
        { error: "exit_reason is required" },
        { status: 400 }
      );
    }

    const newPhase = CLOSURE_TYPE_TO_PHASE[closure_type];
    const newMtpStatus = CLOSURE_TYPE_TO_MTP_STATUS[closure_type];

    const supabase = createServiceClient();

    // 1. Update the lead: phase, exit fields, exited_at
    const { data: updatedLead, error: leadError } = await supabase
      .from("leads")
      .update({
        current_phase: newPhase,
        exit_reason: exit_reason.trim(),
        exit_comments: exit_comments?.trim() || null,
        exited_at: new Date().toISOString(),
        days_in_phase: 0,
        phase_entered_at: new Date().toISOString(),
      })
      .eq("leads_unique_id", leadId)
      .select("leads_unique_id")
      .single();

    if (leadError || !updatedLead) {
      return NextResponse.json(
        { error: leadError?.message ?? "Lead no encontrado" },
        { status: 404 }
      );
    }

    // 2. Find all active MTPs for this lead (not already in exit status)
    const exitStatuses = MTP_EXIT_STATUS_IDS as readonly string[];
    const { data: activeMtps } = await supabase
      .from("leads_properties")
      .select("id, current_status, properties_unique_id")
      .eq("leads_unique_id", leadId);

    const mtpsToClose = (activeMtps || []).filter(
      (m) => !exitStatuses.includes(m.current_status ?? "")
    );

    // 3. Cascade: update each active MTP to the terminal status
    for (const mtp of mtpsToClose) {
      await supabase
        .from("leads_properties")
        .update({
          previous_status: mtp.current_status ?? "interesado_cualificado",
          current_status: newMtpStatus,
          exit_reason: exit_reason.trim(),
          exit_comments: exit_comments?.trim() || null,
        })
        .eq("id", mtp.id);

      // Get property address for event description
      const { data: prop } = await supabase
        .from("properties")
        .select("address")
        .eq("property_unique_id", mtp.properties_unique_id)
        .single();

      const address = prop?.address ?? "Propiedad";

      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: mtp.properties_unique_id,
        event_type: "MTP_ARCHIVED",
        title: `Propiedad Archivada: ${address}`,
        description: `Estado: ${newPhase}. Motivo: ${exit_reason.trim()}.`,
        new_status: newMtpStatus,
      });
    }

    // 4. Insert global phase change event
    await insertLeadEvent(supabase, {
      leads_unique_id: leadId,
      properties_unique_id: null,
      event_type: "PHASE_CHANGE",
      title: `Cierre Global: ${newPhase}`,
      description: `El interesado ha sido marcado como ${newPhase}. Motivo: ${exit_reason.trim()}.${exit_comments?.trim() ? ` Comentarios: ${exit_comments.trim()}.` : ""}`,
    });

    return NextResponse.json({
      success: true,
      leadPhase: newPhase,
      closedMtps: mtpsToClose.length,
    });
  } catch (error: unknown) {
    console.error("Error in lead close:", error);
    const message = error instanceof Error ? error.message : "Error al cerrar el lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
