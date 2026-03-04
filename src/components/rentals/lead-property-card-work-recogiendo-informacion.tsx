"use client";

import { FileText, ArrowUpCircle } from "lucide-react";
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
  isSelectedForQualification?: boolean;
}

/**
 * Recogiendo Información work section.
 *
 * - If the MTP is the selected property for qualification: shows a confirmation message.
 * - If not selected (visible in Gestión de Propiedades): prompts the user to select it
 *   in the "Propiedad Seleccionada" section above.
 */
export function LeadPropertyCardWorkRecogiendoInformacion({
  isSelectedForQualification = false,
}: LeadPropertyCardWorkRecogiendoInformacionProps) {
  if (isSelectedForQualification) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
          <FileText className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-foreground leading-tight">
          Esta propiedad está seleccionada para el estudio de solvencia.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Estudio de solvencia
        </p>
        <p className="text-xs text-muted-foreground">
          Para iniciar el estudio de solvencia con esta propiedad, márcala en la
          sección superior &lsquo;Propiedad Seleccionada&rsquo;.
        </p>
      </div>
    </div>
  );
}
