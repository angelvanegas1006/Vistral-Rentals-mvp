"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkRecogiendoInformacionProps {
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
 * Recogiendo Información: botón Enviar a Finaer -> Calificación en Curso.
 * Cascada: resto de MTPs pasan a En Espera.
 */
export function LeadPropertyCardWorkRecogiendoInformacion({
  leadsProperty,
  onUpdated,
  onTransition,
}: LeadPropertyCardWorkRecogiendoInformacionProps) {
  const [saving, setSaving] = useState(false);

  const handleEnviar = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "calificacion_en_curso",
          "advance",
          { sent_to_finaer_at: new Date().toISOString() }
        );
        if (result?.completed) {
          toast.success("Enviado a Finaer");
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
        Documentación recopilada. Envía a Finaer para calificación.
      </p>
      <Button size="sm" onClick={handleEnviar} disabled={saving}>
        Enviar a Finaer
      </Button>
    </div>
  );
}
