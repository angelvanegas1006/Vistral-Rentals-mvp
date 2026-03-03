"use client";

import { LeadPropertyCardWorkInteresadoCualificado } from "./lead-property-card-work-interesado-cualificado";
import { LeadPropertyCardWorkVisitaAgendada } from "./lead-property-card-work-visita-agendada";
import { LeadPropertyCardWorkPendienteEvaluacion } from "./lead-property-card-work-pendiente-evaluacion";
import { LeadPropertyCardWorkEsperandoDecision } from "./lead-property-card-work-esperando-decision";
import { LeadPropertyCardWorkRecogiendoInformacion } from "./lead-property-card-work-recogiendo-informacion";
import { LeadPropertyCardWorkCalificacionEnCurso } from "./lead-property-card-work-calificacion-en-curso";
import { LeadPropertyCardWorkInteresadoPresentado } from "./lead-property-card-work-interesado-presentado";
import { LeadPropertyCardWorkInteresadoAceptado } from "./lead-property-card-work-interesado-aceptado";
import { MTP_STATUS_TITLES } from "@/lib/leads/mtp-status";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkSectionProps {
  leadsProperty: LeadsPropertyRow;
  onUpdated?: () => void;
  onTransition?: (
    lpId: string,
    newStatus: string,
    action: "advance" | "undo" | "revive",
    updates: Record<string, unknown>
  ) => Promise<{ completed: boolean } | void>;
  onReagendar?: () => void;
  onCancelarVisita?: () => void;
  onDescartar?: () => void;
  isSelectedForQualification?: boolean;
}

/**
 * Renderiza la sección de trabajo según el current_status de la MTP.
 */
export function LeadPropertyCardWorkSection({
  leadsProperty,
  onUpdated,
  onTransition,
  onReagendar,
  onCancelarVisita,
  onDescartar,
  isSelectedForQualification,
}: LeadPropertyCardWorkSectionProps) {
  const status = leadsProperty.current_status ?? "interesado_cualificado";

  switch (status) {
    case "interesado_cualificado":
      return (
        <LeadPropertyCardWorkInteresadoCualificado
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
        />
      );
    case "visita_agendada":
      return (
        <LeadPropertyCardWorkVisitaAgendada
          leadsProperty={leadsProperty}
          onReagendar={onReagendar}
          onCancelarVisita={onCancelarVisita}
        />
      );
    case "pendiente_de_evaluacion":
      return (
        <LeadPropertyCardWorkPendienteEvaluacion
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
          onReagendar={onReagendar}
          onCancelarVisita={onCancelarVisita}
        />
      );
    case "esperando_decision":
      return (
        <LeadPropertyCardWorkEsperandoDecision
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
          onDescartar={onDescartar}
        />
      );
    case "recogiendo_informacion":
      return (
        <LeadPropertyCardWorkRecogiendoInformacion
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
          isSelectedForQualification={isSelectedForQualification}
        />
      );
    case "calificacion_en_curso":
      return (
        <LeadPropertyCardWorkCalificacionEnCurso
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
        />
      );
    case "interesado_presentado":
      return (
        <LeadPropertyCardWorkInteresadoPresentado
          leadsProperty={leadsProperty}
          onUpdated={onUpdated}
          onTransition={onTransition}
        />
      );
    case "interesado_aceptado":
      return (
        <LeadPropertyCardWorkInteresadoAceptado leadsProperty={leadsProperty} />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Estado: {MTP_STATUS_TITLES[status as keyof typeof MTP_STATUS_TITLES] ?? status}
        </p>
      );
  }
}
