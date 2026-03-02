"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkCalificacionEnCursoProps {
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
 * Calificación en Curso: ¿Finaer acepta? Sí -> Interesado Presentado.
 * Rechazo: se maneja en modal separado (Descarte/Reciclaje).
 */
export function LeadPropertyCardWorkCalificacionEnCurso({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkCalificacionEnCursoProps) {
  const [saving, setSaving] = useState(false);

  const handleAcepta = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "interesado_presentado",
          "advance",
          { finaer_status: "approved" }
        );
        if (result?.completed) {
          toast.success("Finaer acepta. Presentar al propietario.");
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ¿Finaer acepta al Interesado?
      </p>
      <Button size="sm" onClick={handleAcepta} disabled={saving}>
        Sí, Presentar al Propietario
      </Button>
      <p className="text-xs text-muted-foreground">
        Para rechazo: usa el menú de acciones (Descartar / Pausar).
      </p>
    </div>
  );
}
