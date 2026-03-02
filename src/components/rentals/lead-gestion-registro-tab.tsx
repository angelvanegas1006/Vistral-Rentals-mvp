"use client";

import { useMemo } from "react";
import { useLeadProperties } from "@/hooks/use-lead-properties";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { MTP_STATUS_TITLES } from "@/lib/leads/mtp-status";
import type { MtpStatusId } from "@/lib/leads/mtp-status";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, Pause, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  leadsUniqueId: string;
  name: string;
  currentPhase: string;
}

interface LeadGestionRegistroTabProps {
  lead: Lead;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  interesado_cualificado: Clock,
  visita_agendada: Clock,
  pendiente_de_evaluacion: Clock,
  esperando_decision: Clock,
  recogiendo_informacion: Clock,
  calificacion_en_curso: Clock,
  interesado_presentado: Clock,
  interesado_aceptado: CheckCircle2,
  en_espera: Pause,
  descartada: XCircle,
  no_disponible: Ban,
};

/**
 * Tab "Registro de Gestión" para la fase Interesado Aceptado.
 * Timeline de solo lectura con el historial de todas las MTPs.
 */
export function LeadGestionRegistroTab({ lead }: LeadGestionRegistroTabProps) {
  const { items, loading } = useLeadProperties(lead.leadsUniqueId);

  const timelineEntries = useMemo(() => {
    return items.map(({ leadsProperty: lp, property }) => {
      const address = property.address || "Propiedad";
      const status = lp.current_status ?? "interesado_cualificado";
      const statusLabel = MTP_STATUS_TITLES[status as MtpStatusId] ?? status;
      const isAccepted = status === "interesado_aceptado";

      const details: { label: string; value: string }[] = [];

      if (lp.visit_date) {
        details.push({
          label: "Visita",
          value: format(new Date(lp.visit_date), "d MMM yyyy, HH:mm", { locale: es }),
        });
      }
      if (lp.visit_feedback) {
        details.push({ label: "Feedback visita", value: lp.visit_feedback });
      }
      if (lp.tenant_confirmed_interest) {
        details.push({
          label: "Interés confirmado",
          value: format(new Date(lp.tenant_confirmed_interest), "d MMM yyyy", { locale: es }),
        });
      }
      if (lp.sent_to_finaer_at) {
        details.push({
          label: "Enviado a Finaer",
          value: format(new Date(lp.sent_to_finaer_at), "d MMM yyyy", { locale: es }),
        });
      }
      if (lp.finaer_status) {
        details.push({ label: "Finaer", value: lp.finaer_status === "approved" ? "Aprobado" : lp.finaer_status });
      }
      if (lp.owner_status) {
        details.push({ label: "Propietario", value: lp.owner_status === "approved" ? "Aprobado" : lp.owner_status });
      }
      if (lp.exit_reason) {
        details.push({ label: "Motivo salida", value: lp.exit_reason });
      }

      return {
        id: lp.id,
        address,
        status,
        statusLabel,
        isAccepted,
        updatedAt: lp.updated_at ?? lp.created_at,
        details,
      };
    });
  }, [items]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RentalsHomeLoader />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">
          Registro de Gestión
        </h3>

        {timelineEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay propiedades registradas.
          </p>
        ) : (
          <div className="space-y-0">
            {timelineEntries.map((entry, idx) => {
              const Icon = STATUS_ICONS[entry.status] ?? Clock;
              const isLast = idx === timelineEntries.length - 1;

              return (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                        entry.isAccepted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 min-h-[24px] bg-border mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{entry.address}</p>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-medium",
                          entry.isAccepted
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "border-border bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {entry.statusLabel}
                      </span>
                    </div>

                    {entry.updatedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.updatedAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    )}

                    {entry.details.length > 0 && (
                      <div className="mt-2 rounded-md bg-muted/50 p-3 space-y-1">
                        {entry.details.map((d) => (
                          <p key={d.label} className="text-sm text-muted-foreground">
                            <strong>{d.label}:</strong> {d.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
