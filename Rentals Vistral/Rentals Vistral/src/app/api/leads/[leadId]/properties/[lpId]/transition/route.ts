import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getLeadPhaseFromMtpStatuses,
  isMtpActive,
} from "@/lib/leads/mtp-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type LeadsPropertyRow = {
  id: string;
  leads_unique_id: string;
  properties_unique_id: string;
  current_status?: string | null;
  previous_status?: string | null;
  [key: string]: unknown;
};

/**
 * POST /api/leads/[leadId]/properties/[lpId]/transition
 * Algoritmo Maestro: simula cambio de estado, calcula si cambia fase del Lead.
 * Body: { newStatus, action: 'advance'|'undo'|'revive', confirmed?: boolean, updates?: Record }
 * Si confirmed=true o no requiere confirmación, ejecuta el cambio.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; lpId: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const { leadId, lpId } = await params;
    if (!leadId?.trim() || !lpId?.trim()) {
      return NextResponse.json(
        { error: "leadId and lpId are required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      newStatus,
      action,
      confirmed = false,
      updates = {},
    }: {
      newStatus?: string;
      action: "advance" | "undo" | "revive";
      confirmed?: boolean;
      updates?: Record<string, unknown>;
    } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Obtener MTP actual
    const { data: mtp, error: mtpError } = await supabase
      .from("leads_properties")
      .select("*")
      .eq("id", lpId)
      .eq("leads_unique_id", leadId)
      .single();

    if (mtpError || !mtp) {
      return NextResponse.json(
        { error: "Mini tarjeta propiedad no encontrada" },
        { status: 404 }
      );
    }

    const currentMtp = mtp as LeadsPropertyRow;

    // 2. Calcular newStatus simulado
    let simulatedStatus = newStatus;
    if (action === "advance" && newStatus === "visita_agendada" && updates.visit_date) {
      // If the visit date is already in the past, skip to pendiente_de_evaluacion
      const visitMs = new Date(updates.visit_date as string).getTime();
      if (!Number.isNaN(visitMs) && visitMs <= Date.now()) {
        simulatedStatus = "pendiente_de_evaluacion";
      }
    } else if (action === "undo") {
      simulatedStatus = currentMtp.previous_status ?? currentMtp.current_status ?? "interesado_cualificado";
    } else if (action === "revive") {
      const prev = currentMtp.previous_status ?? "interesado_cualificado";
      const visitDate = currentMtp.visit_date as string | null | undefined;
      const now = new Date();
      if (prev === "visita_agendada" && visitDate && new Date(visitDate) < now) {
        simulatedStatus = "interesado_cualificado";
      } else {
        simulatedStatus = prev;
      }
    }

    if (!simulatedStatus) {
      return NextResponse.json(
        { error: "newStatus is required for advance action" },
        { status: 400 }
      );
    }

    // 3. Obtener todas las MTPs activas del lead (excluyendo esta si la "quitamos" en undo/revive)
    const { data: allMtps, error: allError } = await supabase
      .from("leads_properties")
      .select("id, current_status")
      .eq("leads_unique_id", leadId);

    if (allError) throw allError;

    const otherActiveStatuses = (allMtps || [])
      .filter((m) => m.id !== lpId)
      .map((m) => m.current_status as string)
      .filter((s): s is string => !!s && isMtpActive(s));

    const statusesWithSimulated = [...otherActiveStatuses];
    if (action === "undo" || action === "revive") {
      statusesWithSimulated.push(simulatedStatus);
    } else {
      statusesWithSimulated.push(simulatedStatus);
    }

    const calculatedPhase = getLeadPhaseFromMtpStatuses(statusesWithSimulated);

    // 4. Obtener fase actual del Lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("current_phase")
      .eq("leads_unique_id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    const leadCurrentPhase = (lead.current_phase as string) || "Interesado Cualificado";

    // 5. Comparar fases (normalizar nombres para comparación)
    const phaseMap: Record<string, string> = {
      "Perfil cualificado": "Interesado Cualificado",
      "Interesado cualificado": "Interesado Cualificado",
      "Visita agendada": "Visita Agendada",
      "Calificación en curso": "Calificación en Curso",
      "Calificación aprobada": "Interesado Presentado",
      "Inquilino presentado": "Interesado Presentado",
      "Inquilino aceptado": "Interesado Aceptado",
      "Interesado presentado": "Interesado Presentado",
      "Interesado aceptado": "Interesado Aceptado",
    };
    const normalizedLeadPhase = phaseMap[leadCurrentPhase] ?? leadCurrentPhase;
    const phaseChanged = calculatedPhase !== normalizedLeadPhase;

    if (phaseChanged && !confirmed) {
      const { data: prop } = await supabase
        .from("properties")
        .select("address")
        .eq("property_unique_id", currentMtp.properties_unique_id)
        .single();

      return NextResponse.json({
        requiresConfirmation: true,
        fromPhase: normalizedLeadPhase,
        toPhase: calculatedPhase,
        propertyAddress: (prop?.address as string) || "Propiedad",
      });
    }

    // 6. Ejecutar cambio
    const updatePayload: Record<string, unknown> = { ...updates };

    if (action === "advance" && newStatus) {
      updatePayload.previous_status = currentMtp.current_status;
      updatePayload.current_status = simulatedStatus;
    } else if (action === "undo") {
      updatePayload.current_status = simulatedStatus;
      updatePayload.previous_status = null;
    } else if (action === "revive") {
      updatePayload.current_status = simulatedStatus;
      updatePayload.previous_status = null;
      if (simulatedStatus === "interesado_cualificado") {
        updatePayload.visit_date = null;
      }
    }

    const { data: updatedMtp, error: updateError } = await supabase
      .from("leads_properties")
      .update(updatePayload)
      .eq("id", lpId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Cascada: al pasar a calificacion_en_curso, el resto de MTPs de este lead pasan a en_espera
    const targetStatus = (updatePayload.current_status as string) ?? newStatus;
    if (targetStatus === "calificacion_en_curso") {
      const { data: others } = await supabase
        .from("leads_properties")
        .select("id, current_status")
        .eq("leads_unique_id", leadId)
        .neq("id", lpId)
        .in("current_status", [
          "interesado_cualificado",
          "visita_agendada",
          "pendiente_de_evaluacion",
          "esperando_decision",
          "recogiendo_informacion",
        ]);

      for (const m of others || []) {
        await supabase
          .from("leads_properties")
          .update({
            current_status: "en_espera",
            previous_status: m.current_status ?? "interesado_cualificado",
          })
          .eq("id", m.id);
      }
    }

    if (phaseChanged) {
      await supabase
        .from("leads")
        .update({
          current_phase: calculatedPhase,
          days_in_phase: 0,
        })
        .eq("leads_unique_id", leadId);
    }

    return NextResponse.json({
      success: true,
      data: updatedMtp,
      leadPhase: phaseChanged ? calculatedPhase : undefined,
    });
  } catch (error: unknown) {
    console.error("Error in transition:", error);
    const message = error instanceof Error ? error.message : "Error en transición";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
