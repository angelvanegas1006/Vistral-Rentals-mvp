import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getLeadPhaseFromMtpStatuses,
  isMtpActive,
  MTP_STATUS_RANK,
  type MtpStatusId,
} from "@/lib/leads/mtp-status";
import {
  insertLeadEvent,
  getMtpStatusTitle,
  isMtpExitStatus,
  isPhaseBackward,
  getPropertyAddress,
} from "@/lib/leads/lead-events";

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
 * Body: { newStatus, action: 'advance'|'undo'|'revive'|'revert', confirmed?: boolean, updates?: Record }
 * Si confirmed=true o no requiere confirmación, ejecuta el cambio.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; lpId: string }> }
) {
  try {
    const { leadId, lpId } = await params;
    if (!leadId?.trim() || !lpId?.trim()) {
      return NextResponse.json(
        { success: false, error: "leadId and lpId are required" },
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
      action: "advance" | "undo" | "revive" | "revert";
      confirmed?: boolean;
      updates?: Record<string, unknown>;
    } = body;

    const supabase = createServiceClient();

    // 1. Obtener MTP actual
    const { data: mtp, error: mtpError } = await supabase
      .from("leads_properties")
      .select("*")
      .eq("id", lpId)
      .eq("leads_unique_id", leadId)
      .single();

    if (mtpError || !mtp) {
      return NextResponse.json(
        { success: false, error: "Mini tarjeta propiedad no encontrada" },
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
      if (newStatus) {
        simulatedStatus = newStatus;
      } else {
        const prev = currentMtp.previous_status ?? "interesado_cualificado";
        const visitDate = currentMtp.visit_date as string | null | undefined;
        const now = new Date();
        if (prev === "visita_agendada" && visitDate && new Date(visitDate) < now) {
          simulatedStatus = "interesado_cualificado";
        } else {
          simulatedStatus = prev;
        }
      }
    } else if (action === "revert") {
      simulatedStatus = newStatus;
      if (!simulatedStatus) {
        return NextResponse.json(
          { success: false, error: "newStatus is required for revert action" },
          { status: 400 }
        );
      }
    }

    if (!simulatedStatus) {
      return NextResponse.json(
        { success: false, error: "newStatus is required for advance action" },
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
        { success: false, error: "Lead no encontrado" },
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
      updatePayload.exit_reason = null;
      updatePayload.exit_comments = null;
      if (simulatedStatus === "interesado_cualificado") {
        updatePayload.visit_date = null;
      }
    } else if (action === "revert") {
      updatePayload.previous_status = currentMtp.current_status;
      updatePayload.current_status = simulatedStatus;
    }

    // Track max_status_reached for the recovery modal's dropdown limitation
    const newStatusRank = MTP_STATUS_RANK[(updatePayload.current_status as MtpStatusId) ?? ""] ?? 0;
    const currentMax = (currentMtp as any).max_status_reached as string | null;
    const currentMaxRank = MTP_STATUS_RANK[(currentMax ?? "") as MtpStatusId] ?? 0;
    if (newStatusRank > 0 && newStatusRank > currentMaxRank) {
      updatePayload.max_status_reached = updatePayload.current_status;
    }

    const { data: updatedMtp, error: updateError } = await supabase
      .from("leads_properties")
      .update(updatePayload)
      .eq("id", lpId)
      .select()
      .single();

    if (updateError) throw updateError;

    // --- Emit lead event ---
    const finalStatus = (updatePayload.current_status as string) ?? simulatedStatus;
    const address = await getPropertyAddress(supabase, currentMtp.properties_unique_id);
    const statusTitle = getMtpStatusTitle(finalStatus);

    if (action === "revive" && !isMtpExitStatus(finalStatus)) {
      const newVisitDate = updates.visit_date as string | undefined;
      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: currentMtp.properties_unique_id,
        event_type: "MTP_RECOVERED",
        title: `Propiedad recuperada: ${address}`,
        description: `El PM recuperó la propiedad ${address} devolviéndola al estado ${statusTitle}.${newVisitDate ? ` Nueva fecha agendada: ${new Date(newVisitDate).toLocaleDateString("es-ES")}.` : ""}`,
        new_status: finalStatus,
      });
    } else if (isMtpExitStatus(finalStatus)) {
      const exitReason = (updates.exit_reason as string) || "";
      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: currentMtp.properties_unique_id,
        event_type: "MTP_ARCHIVED",
        title: `Propiedad Archivada: ${address}`,
        description: `Estado: ${statusTitle}.${exitReason ? ` Motivo: ${exitReason}.` : ""}`,
        new_status: finalStatus,
      });
    }

    if (phaseChanged) {
      const backward = isPhaseBackward(normalizedLeadPhase, calculatedPhase);
      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: currentMtp.properties_unique_id,
        event_type: backward ? "PHASE_CHANGE_BACKWARD" : "PHASE_CHANGE",
        title: backward
          ? `Retroceso a: ${calculatedPhase}`
          : `Movimiento a: ${calculatedPhase}`,
        description: backward
          ? `El interesado retrocede a ${calculatedPhase} porque la propiedad ${address} ha pasado al estado ${statusTitle}.`
          : `El interesado ha cambiado de fase porque la propiedad ${address} ha pasado al estado ${statusTitle}.`,
        new_status: finalStatus,
      });
    }

    if (!isMtpExitStatus(finalStatus) && !phaseChanged) {
      await insertLeadEvent(supabase, {
        leads_unique_id: leadId,
        properties_unique_id: currentMtp.properties_unique_id,
        event_type: "MTP_UPDATE",
        title: `Actualización en ${address}`,
        description: `El estado de la propiedad ha cambiado a: ${statusTitle}.`,
        new_status: finalStatus,
      });
    }

    // Cascada: al pasar a calificacion_en_curso, el resto de MTPs de este lead pasan a en_espera
    const targetStatus = (updatePayload.current_status as string) ?? newStatus;
    if (targetStatus === "calificacion_en_curso") {
      const { data: others } = await supabase
        .from("leads_properties")
        .select("id, current_status, properties_unique_id")
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

        const cascadedAddress = await getPropertyAddress(supabase, m.properties_unique_id);
        await insertLeadEvent(supabase, {
          leads_unique_id: leadId,
          properties_unique_id: m.properties_unique_id,
          event_type: "MTP_ARCHIVED",
          title: `Propiedad Archivada: ${cascadedAddress}`,
          description: `Estado: En Espera. Causa: otra propiedad entró en Calificación en Curso.`,
          new_status: "en_espera",
        });
      }
    }

    // TODO: Cascada Positiva (4.3 Sub-B): cuando una propiedad vuelve de "Alquilada" a "Disponible",
    // buscar MTPs en no_disponible → pasarlas a en_espera y notificar (property_resurrection).
    // Ver docs/leads/notificacuiones.md

    // Cascada Negativa: al llegar a interesado_aceptado, las MTPs de OTROS leads
    // para la misma propiedad cambian a no_disponible
    if (targetStatus === "interesado_aceptado") {
      const propertyId = currentMtp.properties_unique_id;
      const propertyAddress = await getPropertyAddress(supabase, propertyId);

      const { data: otherLeadMtps } = await supabase
        .from("leads_properties")
        .select("id, leads_unique_id, current_status, previous_status, properties_unique_id, visit_date")
        .eq("properties_unique_id", propertyId)
        .neq("leads_unique_id", leadId);

      console.log(`[cascade-neg] property=${propertyId} otherMtps=${(otherLeadMtps || []).length}`);

      const affectedLeadIds = new Set<string>();

      for (const m of otherLeadMtps || []) {
        const st = m.current_status ?? "";

        if (st === "rechazado_por_finaer" || st === "rechazado_por_propietario") {
          console.log(`[cascade-neg] skip lead=${m.leads_unique_id} status=${st}`);
          continue;
        }

        const wasActive = !["descartada", "no_disponible", "interesado_perdido", "interesado_rechazado"].includes(st);
        console.log(`[cascade-neg] mtp=${m.id} lead=${m.leads_unique_id} status=${st} wasActive=${wasActive}`);

        await supabase
          .from("leads_properties")
          .update({
            current_status: "no_disponible",
            previous_status: st || null,
            exit_reason: "propiedad_no_disponible",
            exit_comments: `La propiedad ha sido alquilada a otro candidato.`,
          })
          .eq("id", m.id);

        await insertLeadEvent(supabase, {
          leads_unique_id: m.leads_unique_id,
          properties_unique_id: m.properties_unique_id,
          event_type: "MTP_ARCHIVED",
          title: `Propiedad Archivada: ${propertyAddress}`,
          description: `Estado: No Disponible. Motivo: Otro interesado ha sido aceptado.`,
          new_status: "no_disponible",
        });

        if (wasActive) {
          affectedLeadIds.add(m.leads_unique_id);

          const notificationType = st === "visita_agendada" ? "urgent_visit_cancel" : "info_property_unavailable";
          const notificationTitle = st === "visita_agendada"
            ? "ACCIÓN REQUERIDA: Cancelar visita"
            : "Aviso del Sistema: Propiedad no disponible";
          const notificationMessage = st === "visita_agendada"
            ? `🚨 **ACCIÓN REQUERIDA:** La propiedad ${propertyAddress} ya no está disponible. Contacta urgentemente al interesado para CANCELAR la visita.`
            : `⚠️ **Aviso del Sistema:** La propiedad ${propertyAddress} ya no está disponible (alquilada a otro cliente). La oportunidad ha sido archivada automáticamente.`;

          const { error: notifError } = await supabase.from("lead_notifications").insert({
            leads_unique_id: m.leads_unique_id,
            properties_unique_id: m.properties_unique_id,
            notification_type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            is_read: false,
          });
          if (notifError) {
            console.error(`[cascade-neg] ${notificationType} insert failed for lead=${m.leads_unique_id}:`, notifError);
          } else {
            console.log(`[cascade-neg] ${notificationType} inserted for lead=${m.leads_unique_id}`);
          }
        }
      }

      for (const affectedLeadId of affectedLeadIds) {
        const { data: affectedLead } = await supabase
          .from("leads")
          .select("current_phase")
          .eq("leads_unique_id", affectedLeadId)
          .single();
        const previousPhase = (affectedLead?.current_phase as string) || "Interesado Cualificado";
        const normalizedPreviousPhase = phaseMap[previousPhase] ?? previousPhase;

        const { data: remainingMtps } = await supabase
          .from("leads_properties")
          .select("current_status")
          .eq("leads_unique_id", affectedLeadId);

        const remainingStatuses = (remainingMtps || []).map((m) => m.current_status as string).filter(Boolean);
        const newPhase = getLeadPhaseFromMtpStatuses(remainingStatuses);

        const hasActiveLeft = remainingStatuses.some((s) =>
          !["en_espera", "descartada", "no_disponible", "rechazado_por_finaer", "rechazado_por_propietario", "interesado_perdido", "interesado_rechazado"].includes(s)
        );

        const cascadePhaseChanged = newPhase !== normalizedPreviousPhase;

        console.log(`[cascade-neg] lead=${affectedLeadId} prevPhase=${previousPhase} normalized=${normalizedPreviousPhase} newPhase=${newPhase} hasActiveLeft=${hasActiveLeft} phaseChanged=${cascadePhaseChanged}`);

        const leadUpdate: Record<string, unknown> = {
          current_phase: newPhase,
        };

        if (cascadePhaseChanged) {
          leadUpdate.days_in_phase = 0;
          leadUpdate.phase_entered_at = new Date().toISOString();
        }

        if (!hasActiveLeft && cascadePhaseChanged) {
          leadUpdate.label = "recuperado";
        }

        await supabase
          .from("leads")
          .update(leadUpdate)
          .eq("leads_unique_id", affectedLeadId);

        if (!hasActiveLeft && cascadePhaseChanged) {
          const { error: recoveryNotifError } = await supabase.from("lead_notifications").insert({
            leads_unique_id: affectedLeadId,
            properties_unique_id: propertyId,
            notification_type: "auto_recovery",
            title: "Recuperación Automática",
            message: `⚠️ **Recuperación Automática:** El interesado ha vuelto a la casilla de salida porque su única opción activa (${propertyAddress}) fue asignada a otro perfil. Presenta nuevas opciones o descártalo.`,
            is_read: false,
          });
          if (recoveryNotifError) {
            console.error(`[cascade-neg] auto_recovery insert failed for lead=${affectedLeadId}:`, recoveryNotifError);
          } else {
            console.log(`[cascade-neg] auto_recovery inserted for lead=${affectedLeadId}`);
          }

          await insertLeadEvent(supabase, {
            leads_unique_id: affectedLeadId,
            properties_unique_id: propertyId,
            event_type: "PHASE_CHANGE_BACKWARD",
            title: `Recuperación automática`,
            description: `El interesado ha vuelto a ${newPhase} porque su única opción activa (${propertyAddress}) fue asignada a otro perfil.`,
            new_status: "no_disponible",
          });
        } else if (cascadePhaseChanged) {
          const { error: moveNotifError } = await supabase.from("lead_notifications").insert({
            leads_unique_id: affectedLeadId,
            properties_unique_id: propertyId,
            notification_type: "phase_auto_move",
            title: "Movimiento Automático de Fase",
            message: `⚠️ **Aviso del Sistema:** Esta tarjeta se ha movido automáticamente de la fase ${normalizedPreviousPhase} a ${newPhase} porque la propiedad ${propertyAddress} ya no está disponible.`,
            is_read: false,
          });
          if (moveNotifError) {
            console.error(`[cascade-neg] phase_auto_move insert failed for lead=${affectedLeadId}:`, moveNotifError);
          } else {
            console.log(`[cascade-neg] phase_auto_move inserted for lead=${affectedLeadId}`);
          }

          await insertLeadEvent(supabase, {
            leads_unique_id: affectedLeadId,
            properties_unique_id: propertyId,
            event_type: "PHASE_CHANGE_BACKWARD",
            title: `Retroceso a: ${newPhase}`,
            description: `El interesado retrocede de ${normalizedPreviousPhase} a ${newPhase} porque la propiedad ${propertyAddress} ya no está disponible.`,
            new_status: "no_disponible",
          });
        }
      }

      // Cascada de Éxito: las demás MTPs del mismo lead pasan a descartada
      // (ya aseguró vivienda, el resto de opciones quedan invalidadas)
      const { data: sameLeadMtps } = await supabase
        .from("leads_properties")
        .select("id, current_status, properties_unique_id")
        .eq("leads_unique_id", leadId)
        .neq("id", lpId);

      for (const m of sameLeadMtps || []) {
        const st = m.current_status ?? "";
        if (st !== "en_espera" && !isMtpActive(st)) continue;

        await supabase
          .from("leads_properties")
          .update({
            current_status: "descartada",
            previous_status: st || null,
            exit_reason: "cierre_automatico_aceptado",
            exit_comments: "Cierre automático: El interesado ha sido aceptado para otra propiedad.",
          })
          .eq("id", m.id);

        const cascadedAddr = await getPropertyAddress(supabase, m.properties_unique_id);
        await insertLeadEvent(supabase, {
          leads_unique_id: leadId,
          properties_unique_id: m.properties_unique_id,
          event_type: "MTP_ARCHIVED",
          title: `Propiedad Descartada: ${cascadedAddr}`,
          description: `Estado: Descartada. Causa: El interesado ha sido aceptado para la propiedad ${propertyAddress}.`,
          new_status: "descartada",
        });
      }
    }

    if (phaseChanged) {
      await supabase
        .from("leads")
        .update({
          current_phase: calculatedPhase,
          days_in_phase: 0,
          phase_entered_at: new Date().toISOString(),
        })
        .eq("leads_unique_id", leadId);
    }

    return NextResponse.json({
      success: true,
      data: updatedMtp,
      leadPhase: phaseChanged ? calculatedPhase : undefined,
    });
  } catch (error: unknown) {
    console.error("[Transition Error]:", error);
    const message = error instanceof Error ? error.message : "Error en transición";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
