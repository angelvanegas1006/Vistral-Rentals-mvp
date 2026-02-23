"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkInteresadoPresentadoProps {
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
 * Interesado Presentado: ¿El propietario acepta? Sí -> Interesado Aceptado.
 */
export function LeadPropertyCardWorkInteresadoPresentado({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkInteresadoPresentadoProps) {
  const [saving, setSaving] = useState(false);

  const handleAcepta = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "interesado_aceptado",
          "advance",
          { owner_status: "approved" }
        );
        if (result?.completed) {
          toast.success("Interesado aceptado");
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
        ¿El propietario acepta al Interesado?
      </p>
      <Button size="sm" onClick={handleAcepta} disabled={saving}>
        Sí, Aceptar
      </Button>
    </div>
  );
}
