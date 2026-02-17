"use client";

import { useState, useCallback, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateLeadsProperty } from "@/services/leads-sync";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkPerfilCualificadoProps {
  leadsProperty: LeadsPropertyRow;
  onUpdated?: () => void;
}

/**
 * Sección de trabajo para la fase "Perfil cualificado".
 * Muestra el campo de fecha de visita agendada.
 */
export function LeadPropertyCardWorkPerfilCualificado({
  leadsProperty,
  onUpdated,
}: LeadPropertyCardWorkPerfilCualificadoProps) {
  const rawDate = leadsProperty.scheduled_visit_date;
  const dateValue = rawDate
    ? (typeof rawDate === "string" ? rawDate : rawDate).slice(0, 10)
    : "";

  const [value, setValue] = useState(dateValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(dateValue);
  }, [dateValue]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setSaving(true);

      const success = await updateLeadsProperty(leadsProperty.id, {
        scheduled_visit_date: newValue || null,
      });

      setSaving(false);

      if (success) {
        toast.success("Fecha de visita actualizada");
        onUpdated?.();
      } else {
        toast.error("Error al guardar la fecha");
        setValue(dateValue);
      }
    },
    [leadsProperty.id, dateValue, onUpdated]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`scheduled-visit-${leadsProperty.id}`} className="text-sm font-medium">
        Fecha de visita agendada
      </Label>
      <Input
        id={`scheduled-visit-${leadsProperty.id}`}
        type="date"
        value={value}
        onChange={handleChange}
        disabled={saving}
        className="max-w-[200px]"
      />
    </div>
  );
}
