"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
}

/**
 * Pendiente de Evaluación: textarea feedback + botón Confirmar -> Esperando Decisión.
 */
export function LeadPropertyCardWorkPendienteEvaluacion({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkPendienteEvaluacionProps) {
  const [feedback, setFeedback] = useState(
    leadsProperty.visit_feedback ?? ""
  );
  const [saving, setSaving] = useState(false);

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
          { visit_feedback: feedback.trim() }
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
      <Button size="sm" onClick={handleConfirm} disabled={saving || !feedback.trim()}>
        Confirmar y Avanzar
      </Button>
    </div>
  );
}
