"use client";

import { useState, useCallback } from "react";
import { CalendarPlus, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { transitionLeadsProperty } from "@/services/leads-sync";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkInteresadoCualificadoProps {
  leadsProperty: LeadsPropertyRow;
  onUpdated?: () => void;
  onTransition?: (
    lpId: string,
    newStatus: string,
    action: "advance" | "undo" | "revive",
    updates: Record<string, unknown>
  ) => Promise<{ completed: boolean } | void>;
}

/**
 * Sección de trabajo para "Interesado Cualificado".
 * Date/Time picker + botón Agendar Visita -> transición a Visita Agendada.
 */
export function LeadPropertyCardWorkInteresadoCualificado({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkInteresadoCualificadoProps) {
  const visitDate = leadsProperty.visit_date;
  const dateValue = visitDate
    ? (typeof visitDate === "string" ? visitDate : visitDate).slice(0, 16)
    : "";

  const [dateInput, setDateInput] = useState(dateValue.slice(0, 10));
  const [timeInput, setTimeInput] = useState(
    dateValue.length > 10 ? dateValue.slice(11, 16) : "10:00"
  );
  const [saving, setSaving] = useState(false);

  const handleAgendarVisita = useCallback(async () => {
    if (!dateInput) {
      toast.error("Selecciona una fecha de visita");
      return;
    }

    const localDate = new Date(`${dateInput}T${timeInput}:00`);
    const visitDateTime = localDate.toISOString();

    const isPast = localDate.getTime() <= Date.now();
    const targetStatus = isPast ? "pendiente_de_evaluacion" : "visita_agendada";

    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          targetStatus,
          "advance",
          { visit_date: visitDateTime }
        );
        if (result?.completed) {
          toast.success(isPast ? "Visita registrada (ya pasada)" : "Visita agendada");
          onUpdated?.();
        }
      } else {
        const result = await transitionLeadsProperty(
          leadsProperty.leads_unique_id,
          leadsProperty.id,
          {
            action: "advance",
            newStatus: targetStatus,
            updates: { visit_date: visitDateTime },
          }
        );
        if (result.requiresConfirmation) {
          toast.info("Confirma el cambio de fase en el modal");
        } else if (result.success) {
          toast.success(isPast ? "Visita registrada (ya pasada)" : "Visita agendada");
          onUpdated?.();
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agendar");
    } finally {
      setSaving(false);
    }
  }, [
    dateInput,
    timeInput,
    leadsProperty.leads_unique_id,
    leadsProperty.id,
    onUpdated,
    onTransition,
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--vistral-blue-50)] dark:bg-[var(--vistral-blue-950)]">
          <CalendarPlus className="h-4 w-4 text-[var(--vistral-blue-500)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            Programar visita
          </p>
          <p className="text-xs text-muted-foreground">
            Selecciona fecha y hora para la visita del interesado
          </p>
        </div>
      </div>

      {/* Date / Time inputs + CTA */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-[180px] space-y-1.5">
          <Label
            htmlFor={`visit-date-${leadsProperty.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Fecha
          </Label>
          <Input
            id={`visit-date-${leadsProperty.id}`}
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="w-[130px] space-y-1.5">
          <Label
            htmlFor={`visit-time-${leadsProperty.id}`}
            className="text-xs font-medium text-muted-foreground flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Hora
          </Label>
          <Input
            id={`visit-time-${leadsProperty.id}`}
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="ml-auto">
          <Button
            onClick={handleAgendarVisita}
            disabled={saving || !dateInput}
          >
            <CalendarPlus className="h-4 w-4" />
            {saving ? "Agendando…" : "Agendar Visita"}
          </Button>
        </div>
      </div>
    </div>
  );
}
