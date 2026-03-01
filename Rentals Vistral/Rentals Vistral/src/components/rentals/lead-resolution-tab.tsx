"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Ban, TrendingDown, Calendar, MessageSquare } from "lucide-react";

interface LeadResolutionTabProps {
  currentPhase: string;
  exitReason: string | null;
  exitComments: string | null;
  exitedAt: string | null;
}

export function LeadResolutionTab({
  currentPhase,
  exitReason,
  exitComments,
  exitedAt,
}: LeadResolutionTabProps) {
  const isPerdido = currentPhase === "Interesado Perdido";
  const iconColor = isPerdido
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  const Icon = isPerdido ? TrendingDown : Ban;

  const formattedDate = exitedAt
    ? format(new Date(exitedAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
    : "Fecha no disponible";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-lg ${isPerdido ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F9FAFB]">
              Resolución del Interesado
            </h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Este interesado ha sido cerrado definitivamente.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Fecha de cierre */}
          <div className="flex items-start gap-3">
            <Calendar className={`h-4 w-4 mt-0.5 ${iconColor} flex-shrink-0`} />
            <div>
              <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                Fecha de cierre
              </p>
              <p className="text-sm text-[#111827] dark:text-[#F9FAFB]">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="flex items-start gap-3">
            <Ban className={`h-4 w-4 mt-0.5 ${iconColor} flex-shrink-0`} />
            <div>
              <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                Motivo
              </p>
              <p className="text-sm text-[#111827] dark:text-[#F9FAFB]">
                {exitReason || "No especificado"}
              </p>
            </div>
          </div>

          {/* Comentarios */}
          {exitComments && (
            <div className="flex items-start gap-3">
              <MessageSquare className={`h-4 w-4 mt-0.5 ${iconColor} flex-shrink-0`} />
              <div>
                <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Comentarios
                </p>
                <p className="text-sm text-[#111827] dark:text-[#F9FAFB] whitespace-pre-wrap">
                  {exitComments}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
