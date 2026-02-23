"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { transitionLeadsProperty } from "@/services/leads-sync";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkPerfilCualificadoProps {
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
 * Sección de trabajo para "Perfil Cualificado".
 * Date/Time picker + botón Agendar Visita -> transición a Visita Agendada.
 */
export function LeadPropertyCardWorkPerfilCualificado({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkPerfilCualificadoProps) {
  const visitDate = leadsProperty.visit_date ?? leadsProperty.scheduled_visit_date;
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
    const visitDateTime = `${dateInput}T${timeInput}:00.000Z`;
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "visita_agendada",
          "advance",
          { visit_date: visitDateTime }
        );
        if (result?.completed) {
          toast.success("Visita agendada");
          onUpdated?.();
        }
      } else {
        const result = await transitionLeadsProperty(
          leadsProperty.leads_unique_id,
          leadsProperty.id,
          {
            action: "advance",
            newStatus: "visita_agendada",
            updates: { visit_date: visitDateTime },
          }
        );
        if (result.requiresConfirmation) {
          toast.info("Confirma el cambio de fase en el modal");
        } else if (result.success) {
          toast.success("Visita agendada");
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
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`visit-date-${leadsProperty.id}`} className="text-sm font-medium">
          Fecha de visita
        </Label>
        <Input
          id={`visit-date-${leadsProperty.id}`}
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          disabled={saving}
          className="max-w-[200px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`visit-time-${leadsProperty.id}`} className="text-sm font-medium">
          Hora
        </Label>
        <Input
          id={`visit-time-${leadsProperty.id}`}
          type="time"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          disabled={saving}
          className="max-w-[120px]"
        />
      </div>
      <Button
        size="sm"
        onClick={handleAgendarVisita}
        disabled={saving || !dateInput}
      >
        Agendar Visita
      </Button>
    </div>
  );
}
