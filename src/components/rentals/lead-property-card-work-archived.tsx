"use client";

import { AlertCircle, MessageSquareText } from "lucide-react";

const DESCARTE_REASON_LABELS: Record<string, string> = {
  precio: "Precio no adecuado",
  zona: "Zona no deseada",
  caracteristicas: "Características no adecuadas",
  otro: "Otro motivo",
  interesado_aceptado_otra: "Interesado aceptado para otra propiedad",
};

const EN_ESPERA_REASON_LABELS: Record<string, string> = {
  propiedad_en_calificacion: "Otra propiedad en calificación",
};

function getReasonLabel(status: string, exitReason: string): string {
  if (status === "descartada") {
    return DESCARTE_REASON_LABELS[exitReason] || exitReason;
  }
  if (status === "en_espera") {
    return EN_ESPERA_REASON_LABELS[exitReason] || exitReason;
  }
  if (status === "no_disponible") {
    return "Propiedad No Disponible";
  }
  if (status === "interesado_perdido" || status === "interesado_rechazado") {
    return exitReason;
  }
  return exitReason;
}

function getDefaultComments(status: string, exitReason: string | null | undefined): string | null {
  if (status === "no_disponible" && (!exitReason || exitReason === "propiedad_no_disponible")) {
    return "Esta propiedad ha sido archivada porque el propietario ha aceptado a otro candidato para esta vivienda.";
  }
  if (status === "en_espera" && (!exitReason || exitReason === "propiedad_en_calificacion")) {
    return "Esta propiedad ha sido puesta en espera automáticamente porque el interesado ha decidido alquilar otra vivienda.";
  }
  return null;
}

const STATUS_CONTAINER_STYLES: Record<string, string> = {
  descartada:
    "bg-red-50/60 border-red-200/60 dark:bg-red-950/20 dark:border-red-900/40",
  en_espera:
    "bg-yellow-50/60 border-yellow-200/60 dark:bg-yellow-950/20 dark:border-yellow-900/40",
  no_disponible:
    "bg-gray-50/60 border-gray-200/60 dark:bg-gray-800/30 dark:border-gray-700/40",
  interesado_perdido:
    "bg-amber-50/60 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40",
  interesado_rechazado:
    "bg-red-50/60 border-red-200/60 dark:bg-red-950/20 dark:border-red-900/40",
};

const STATUS_ICON_STYLES: Record<string, string> = {
  descartada: "text-red-500 dark:text-red-400",
  en_espera: "text-yellow-600 dark:text-yellow-400",
  no_disponible: "text-gray-500 dark:text-gray-400",
  interesado_perdido: "text-amber-600 dark:text-amber-400",
  interesado_rechazado: "text-red-500 dark:text-red-400",
};

export interface LeadPropertyCardWorkArchivedProps {
  currentStatus: string;
  exitReason?: string | null;
  exitComments?: string | null;
}

export function LeadPropertyCardWorkArchived({
  currentStatus,
  exitReason,
  exitComments,
}: LeadPropertyCardWorkArchivedProps) {
  const reasonLabel = exitReason ? getReasonLabel(currentStatus, exitReason) : null;
  const defaultComments = getDefaultComments(currentStatus, exitReason);
  const displayComments = exitComments || defaultComments;

  const containerStyle =
    STATUS_CONTAINER_STYLES[currentStatus] ??
    "bg-gray-50/60 border-gray-200/60 dark:bg-gray-800/30 dark:border-gray-700/40";
  const iconStyle =
    STATUS_ICON_STYLES[currentStatus] ?? "text-gray-500 dark:text-gray-400";

  if (!reasonLabel && !displayComments) {
    return (
      <div className={`rounded-lg border p-4 ${containerStyle}`}>
        <p className="text-sm text-muted-foreground italic">
          Sin motivo especificado.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${containerStyle}`}>
      {reasonLabel && (
        <div className="flex items-start gap-2.5">
          <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconStyle}`} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
              Motivo
            </p>
            <p className="text-sm font-medium text-foreground">{reasonLabel}</p>
          </div>
        </div>
      )}
      {displayComments && (
        <div className="flex items-start gap-2.5">
          <MessageSquareText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconStyle}`} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
              Comentarios
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayComments}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
