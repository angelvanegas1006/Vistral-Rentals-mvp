"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkVisitaAgendadaProps {
  leadsProperty: LeadsPropertyRow;
}

/**
 * Visita Agendada: solo muestra la fecha. El avance a Pendiente de Evaluación es automático (visit_date <= now).
 */
export function LeadPropertyCardWorkVisitaAgendada({
  leadsProperty,
}: LeadPropertyCardWorkVisitaAgendadaProps) {
  const visitDate = leadsProperty.visit_date ?? leadsProperty.scheduled_visit_date;
  const formatted = visitDate
    ? format(new Date(visitDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : "—";

  return (
    <p className="text-sm text-muted-foreground">
      Visita programada: <strong className="text-foreground">{formatted}</strong>
    </p>
  );
}
