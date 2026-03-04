import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLeadPhaseFromMtpStatuses, isMtpActive } from "@/lib/leads/mtp-status";
import { insertLeadEvent, getPropertyAddress } from "@/lib/leads/lead-events";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const REJECTION_REASON_LABELS: Record<string, string> = {
  ingresos_insuficientes: "Ingresos insuficientes",
  documentacion_incompleta: "Documentación incompleta",
  historial_crediticio: "Historial crediticio negativo",
  situacion_laboral: "Situación laboral inestable",
  perfil_no_adecuado: "Perfil no adecuado",
  prefiere_sin_mascotas: "Prefiere inquilino sin mascotas",
  ingresos_justos: "Ingresos demasiado justos",
  preferencia_otro_candidato: "Prefiere otro candidato",
  otro: "Otro motivo",
};

/**
 * POST /api/leads/[leadId]/recover
 * Recovers a lead after Finaer/Owner rejection:
 *  - Sets lead phase back to "Interesado Cualificado"
 *  - Sets label to "recuperado"
 *  - Revives en_espera MTPs (from calificacion cascade) to their previous_status
 *  - Generates a recovery notification
 *  - Recalculates the global phase
 *
 * Body: { rejectedMtpId?: string, reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const body = await request.json();
    const { rejectedMtpId, rejectionType, reason } = body as {
      rejectedMtpId?: string;
      rejectionType?: "finaer" | "propietario";
      reason?: string;
    };

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Find en_espera MTPs caused by calificacion cascade
    const { data: enEsperaMtps } = await supabase
      .from("leads_properties")
      .select("id, current_status, previous_status, properties_unique_id, visit_date")
      .eq("leads_unique_id", leadId)
      .eq("current_status", "en_espera");

    const now = new Date();

    // 2. Revive each en_espera MTP
    for (const m of enEsperaMtps || []) {
      let targetStatus = m.previous_status ?? "interesado_cualificado";

      if (targetStatus === "visita_agendada" && m.visit_date && new Date(m.visit_date) < now) {
        targetStatus = "interesado_cualificado";
      }

      await supabase
        .from("leads_properties")
        .update({
          current_status: targetStatus,
          previous_status: null,
          exit_reason: null,
          exit_comments: null,
        })
        .eq("id", m.id);

      const addr = await getPropertyAddress(supabase, m.properties_unique_id);
      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: m.properties_unique_id,
        event_type: "MTP_RECOVERED",
        title: `Propiedad recuperada: ${addr}`,
        description: `El PM recuperó la propiedad ${addr} devolviéndola al estado ${targetStatus}.`,
        new_status: targetStatus,
      });
    }

    // 3. Recalculate lead phase from all MTPs
    const { data: allMtps } = await supabase
      .from("leads_properties")
      .select("current_status")
      .eq("leads_unique_id", leadId);

    const allStatuses = (allMtps || []).map((m) => m.current_status as string).filter(Boolean);
    const newPhase = getLeadPhaseFromMtpStatuses(allStatuses);

    // 4. Update lead: phase, label, reset phase timer
    await supabase
      .from("leads")
      .update({
        current_phase: newPhase,
        label: "recuperado",
        days_in_phase: 0,
        phase_entered_at: now.toISOString(),
      })
      .eq("leads_unique_id", leadId);

    // 5. Log phase change event
    let rejectedAddress = "";
    if (rejectedMtpId) {
      const { data: rejectedMtp } = await supabase
        .from("leads_properties")
        .select("properties_unique_id")
        .eq("id", rejectedMtpId)
        .single();
      if (rejectedMtp) {
        rejectedAddress = await getPropertyAddress(supabase, rejectedMtp.properties_unique_id);
      }
    }

    await insertLeadEvent(supabase, {
      leads_unique_id: leadId,
      event_type: "PHASE_CHANGE_BACKWARD",
      title: `Interesado recuperado`,
      description: `El PM ha recuperado al interesado${rejectedAddress ? ` tras el rechazo en ${rejectedAddress}` : ""}. Fase actual: ${newPhase}.${reason ? ` Motivo: ${reason}.` : ""}`,
      new_status: null,
    });

    // 6. Create recovery notification with rejection details
    const reasonLabel = reason ? (REJECTION_REASON_LABELS[reason] ?? reason) : null;
    let notificationMessage: string;

    if (rejectionType === "finaer") {
      notificationMessage = `Este interesado fue rechazado por Finaer.${reasonLabel ? ` Motivo: ${reasonLabel}.` : ""} Preséntale nuevas oportunidades o recupera sus propiedades archivadas/inactivas.`;
    } else if (rejectionType === "propietario") {
      notificationMessage = `Este interesado fue rechazado por el Propietario.${reasonLabel ? ` Motivo: ${reasonLabel}.` : ""} Preséntale nuevas oportunidades o recupera sus propiedades archivadas/inactivas.`;
    } else {
      notificationMessage = `Este interesado ha sido recuperado. Preséntale nuevas propiedades o recupera las propiedades archivadas.`;
    }

    await supabase.from("lead_notifications").insert({
      leads_unique_id: leadId,
      properties_unique_id: null,
      notification_type: "recovery",
      title: "Interesado recuperado",
      message: notificationMessage,
    });

    return NextResponse.json({
      success: true,
      newPhase,
      revivedCount: (enEsperaMtps || []).length,
    });
  } catch (error: unknown) {
    console.error("Error recovering lead:", error);
    const message = error instanceof Error ? error.message : "Error recovering lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
