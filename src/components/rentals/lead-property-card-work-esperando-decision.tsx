"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HelpCircle, CheckCircle2, XIcon, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkEsperandoDecisionProps {
  leadsProperty: LeadsPropertyRow;
  onUpdated?: () => void;
  onTransition?: (
    lpId: string,
    newStatus: string,
    action: "advance" | "undo" | "revive",
    updates: Record<string, unknown>
  ) => Promise<{ completed: boolean } | void>;
  onDescartar?: () => void;
}

export function LeadPropertyCardWorkEsperandoDecision({
  leadsProperty,
  onUpdated,
  onTransition,
  onDescartar,
}: LeadPropertyCardWorkEsperandoDecisionProps) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const visitDate = leadsProperty.visit_date;
  const formatted = visitDate
    ? format(new Date(visitDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : null;

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "recogiendo_informacion",
          "advance",
          { tenant_confirmed_interest: new Date().toISOString() }
        );
        if (result?.completed) {
          toast.success("Interés confirmado");
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
  }, [leadsProperty.id, onTransition, onUpdated]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
          <HelpCircle className="h-4 w-4 text-purple-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Decisión del Interesado
          </p>
          {formatted && (
            <p className="text-xs text-muted-foreground capitalize">
              Visita: {formatted}
            </p>
          )}
        </div>
      </div>

      {/* Question: ¿Quiere comenzar el proceso de Alquiler? */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          ¿Quiere el Interesado comenzar el proceso de Alquiler de esta propiedad?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAnswer(true)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              answer === true
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Sí
          </button>
          <button
            type="button"
            onClick={() => setAnswer(false)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              answer === false
                ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <XIcon className="h-4 w-4" />
            No
          </button>
        </div>
      </div>

      {/* Sí: Confirmar y Avanzar */}
      {answer === true && (
        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? "Confirmando…" : "Confirmar y Avanzar"}
        </Button>
      )}

      {/* No: Descartar Propiedad */}
      {answer === false && (
        <div className="rounded-[var(--vistral-radius-md)] border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30 p-4 space-y-3">
          <p className="text-sm text-red-800 dark:text-red-300">
            El interesado no desea alquilar esta propiedad. Puedes descartarla de su gestión.
          </p>
          {onDescartar && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={onDescartar}
            >
              <Trash2 className="h-4 w-4" />
              Descartar Propiedad
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
