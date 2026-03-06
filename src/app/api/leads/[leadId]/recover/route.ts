import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { insertLeadEvent, getPropertyAddress } from "@/lib/leads/lead-events";

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

const RECOVERY_PHASE = "Interesado Cualificado";

/**
 * POST /api/leads/[leadId]/recover
 * Recovers a lead after Finaer/Owner rejection:
 *  - Sets lead phase to "Interesado Cualificado"
 *  - Sets label to "recuperado"
 *  - Generates a recovery notification
 *  - Archived MTPs are NOT revived — they stay as-is
 *
 * Body: { rejectedMtpId?: string, rejectionType?: string, reason?: string }
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

    const supabase = createServiceClient();
    const now = new Date();

    // 1. Update lead: phase to Interesado Cualificado, label recuperado, reset timer
    await supabase
      .from("leads")
      .update({
        current_phase: RECOVERY_PHASE,
        label: "recuperado",
        days_in_phase: 0,
        phase_entered_at: now.toISOString(),
      })
      .eq("leads_unique_id", leadId);

    // 2. Log phase change event
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
      description: `El PM ha recuperado al interesado${rejectedAddress ? ` tras el rechazo en ${rejectedAddress}` : ""}. Fase actual: ${RECOVERY_PHASE}.${reason ? ` Motivo: ${reason}.` : ""}`,
      new_status: null,
    });

    // 3. Create recovery notification with rejection details
    const reasonLabel = reason ? (REJECTION_REASON_LABELS[reason] ?? reason) : null;
    let notificationMessage: string;

    const rejectionPhaseLabel = rejectionType === "finaer" ? "Finaer" : rejectionType === "propietario" ? "Propietario" : null;

    if (rejectionPhaseLabel) {
      notificationMessage = `ℹ️ **Lead Recuperado:** Has reactivado a este interesado tras ser rechazado en ${rejectionPhaseLabel}.${reasonLabel ? ` Motivo: ${reasonLabel}.` : ""} Preséntale nuevas opciones o recupera propiedades archivadas.`;
    } else {
      notificationMessage = `ℹ️ **Lead Recuperado:** Has reactivado a este interesado. Preséntale nuevas opciones o recupera propiedades archivadas.`;
    }

    await supabase.from("lead_notifications").insert({
      leads_unique_id: leadId,
      properties_unique_id: null,
      notification_type: "recovery",
      title: "Interesado recuperado",
      message: notificationMessage,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      newPhase: RECOVERY_PHASE,
    });
  } catch (error: unknown) {
    console.error("Error recovering lead:", error);
    const message = error instanceof Error ? error.message : "Error recovering lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
