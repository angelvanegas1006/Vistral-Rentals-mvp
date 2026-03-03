"use client";

import { useState } from "react";
import { Phase2SectionWidget } from "@/components/rentals/phase2-section-widget";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeadFinaerConfirmationSectionProps {
  leadName: string;
  propertyAddress: string;
  isBlocked: boolean;
  isComplete: boolean;
  onConfirmYes: () => void;
}

export function LeadFinaerConfirmationSection({
  leadName,
  propertyAddress,
  isBlocked,
  isComplete,
  onConfirmYes,
}: LeadFinaerConfirmationSectionProps) {
  const [answer, setAnswer] = useState<boolean | null>(null);

  return (
    <Phase2SectionWidget
      id="finaer-confirmation"
      title="Confirmación de Envío a Finaer"
      instructions="Confirma que se ha iniciado el estudio de solvencia con Finaer para continuar."
      required
      isComplete={isComplete}
      isBlocked={isBlocked}
    >
      <div className="space-y-4">
        <Label className="text-sm font-medium leading-relaxed">
          ¿Se ha iniciado el estudio de solvencia de{" "}
          <strong>{leadName}</strong> para{" "}
          <strong>{propertyAddress}</strong> con Finaer?
        </Label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setAnswer(true);
              onConfirmYes();
            }}
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
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              answer === false
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <XIcon className="h-4 w-4" />
            No
          </button>
        </div>

        {answer === false && (
          <div className="flex items-start gap-3 rounded-[var(--vistral-radius-md)] border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              La calificación con Finaer es obligatoria para continuar con el
              proceso de alquiler. Cuando esté lista, vuelve a esta sección y
              confirma.
            </p>
          </div>
        )}
      </div>
    </Phase2SectionWidget>
  );
}
