"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
}

/**
 * Esperando Decisión: ¿Quiere el Interesado comenzar el proceso? Botón Sí -> Recogiendo Información.
 */
export function LeadPropertyCardWorkEsperandoDecision({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkEsperandoDecisionProps) {
  const [saving, setSaving] = useState(false);

  const handleSi = useCallback(async () => {
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ¿Quiere el Interesado comenzar el proceso de Alquiler de esta propiedad?
      </p>
      <Button size="sm" onClick={handleSi} disabled={saving}>
        Sí
      </Button>
    </div>
  );
}
