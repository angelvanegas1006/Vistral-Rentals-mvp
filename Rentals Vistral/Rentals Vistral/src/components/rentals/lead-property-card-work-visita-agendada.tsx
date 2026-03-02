"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, CalendarClock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkVisitaAgendadaProps {
  leadsProperty: LeadsPropertyRow;
  onReagendar?: () => void;
  onCancelarVisita?: () => void;
}

export function LeadPropertyCardWorkVisitaAgendada({
  leadsProperty,
  onReagendar,
  onCancelarVisita,
}: LeadPropertyCardWorkVisitaAgendadaProps) {
  const visitDate = leadsProperty.visit_date;
  const formatted = visitDate
    ? format(new Date(visitDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : "—";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
          <CalendarCheck className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Visita Agendada
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {formatted}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        {onReagendar && (
          <Button variant="outline" size="sm" className="w-full" onClick={onReagendar}>
            <CalendarClock className="h-4 w-4" />
            Reagendar Visita
          </Button>
        )}
        {onCancelarVisita && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelarVisita}
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Cancelar Visita
          </Button>
        )}
      </div>
    </div>
  );
}
