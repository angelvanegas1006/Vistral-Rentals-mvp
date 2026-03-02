"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardCheck, CalendarClock, XCircle, CheckCircle2, XIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateLeadsProperty } from "@/services/leads-sync";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkPendienteEvaluacionProps {
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
}

export function LeadPropertyCardWorkPendienteEvaluacion({
  leadsProperty,
  onUpdated,
  onTransition,
  onReagendar,
  onCancelarVisita,
}: LeadPropertyCardWorkPendienteEvaluacionProps) {
  const initialAnswer =
    (leadsProperty as LeadsPropertyRow & { visit_completed?: boolean | null }).visit_completed === true
      ? true
      : (leadsProperty as LeadsPropertyRow & { visit_completed?: boolean | null }).visit_completed === false
        ? false
        : null;

  const [visitCompleted, setVisitCompleted] = useState<boolean | null>(initialAnswer);
  const [feedback, setFeedback] = useState(leadsProperty.visit_feedback ?? "");
  const [saving, setSaving] = useState(false);

  const handleVisitCompleted = useCallback(async (value: boolean) => {
    setVisitCompleted(value);
    try {
      await updateLeadsProperty(leadsProperty.id, { visit_completed: value } as Record<string, unknown>);
    } catch {
      // UI already reflects the selection; silent fail is acceptable
    }
  }, [leadsProperty.id]);

  const visitDate = leadsProperty.visit_date;
  const formatted = visitDate
    ? format(new Date(visitDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : "—";

  const handleConfirm = useCallback(async () => {
    if (!feedback.trim()) {
      toast.error("Escribe los comentarios de la visita");
      return;
    }
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "esperando_decision",
          "advance",
          { visit_feedback: feedback.trim(), visit_completed: true }
        );
        if (result?.completed) {
          toast.success("Confirmado");
          onUpdated?.();
        }
      } else {
        toast.error("Configura onTransition para avanzar");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [feedback, leadsProperty.id, onTransition, onUpdated]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
          <ClipboardCheck className="h-4 w-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Evaluación de la Visita
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {formatted}
          </p>
        </div>
      </div>

      {/* Radio: ¿Se ha realizado la visita? */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">¿Se ha realizado la visita?</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleVisitCompleted(true)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              visitCompleted === true
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Sí
          </button>
          <button
            type="button"
            onClick={() => handleVisitCompleted(false)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              visitCompleted === false
                ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <XIcon className="h-4 w-4" />
            No
          </button>
        </div>
      </div>

      {/* Si: Textarea + Confirmar y Avanzar */}
      {visitCompleted === true && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`feedback-${leadsProperty.id}`} className="text-sm font-medium">
              Comentarios sobre la visita
            </Label>
            <Textarea
              id={`feedback-${leadsProperty.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Valoración del candidato tras la visita..."
              rows={3}
              disabled={saving}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={saving || !feedback.trim()}
          >
            {saving ? "Confirmando…" : "Confirmar y Avanzar"}
          </Button>
        </div>
      )}

      {/* No: Reagendar / Cancelar Visita */}
      {visitCompleted === false && (
        <div className="rounded-[var(--vistral-radius-md)] border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-4 space-y-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            La visita no se realizó. Puedes reagendar una nueva fecha o cancelar la visita para esta propiedad.
          </p>
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
      )}
    </div>
  );
}
