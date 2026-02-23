"use client";

import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface LeadPropertyCardWorkInteresadoAceptadoProps {
  leadsProperty: LeadsPropertyRow;
}

/**
 * Interesado Aceptado: estado final. Solo lectura.
 */
export function LeadPropertyCardWorkInteresadoAceptado({
  leadsProperty,
}: LeadPropertyCardWorkInteresadoAceptadoProps) {
  return (
    <p className="text-sm text-muted-foreground">
      Interesado validado al 100%. Fin del flujo.
    </p>
  );
}
