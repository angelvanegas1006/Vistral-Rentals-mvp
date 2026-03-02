"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Undo2, Loader2, Clock, Pause, XCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MTP_STATUS_TITLES,
  MTP_STATUS_RANK,
  type MtpStatusId,
} from "@/lib/leads/mtp-status";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface MtpModalRegistroActividadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadsProperty: LeadsPropertyRow;
  propertyAddress: string;
  onRevert?: (targetStatus: string) => Promise<void>;
}

interface MtpEvent {
  id: string;
  event_type: string;
  new_status: string | null;
  created_at: string;
}

interface TimelineItem {
  id: string;
  statusId: MtpStatusId;
  label: string;
  timestamp: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  state: "past" | "current" | "future";
}

interface ExitInfo {
  statusId: MtpStatusId;
  label: string;
  timestamp: string | null;
  exitReason: string | null;
  exitComments: string | null;
}

const MAIN_STATES_ORDER: MtpStatusId[] = [
  "interesado_cualificado",
  "visita_agendada",
  "pendiente_de_evaluacion",
  "esperando_decision",
  "recogiendo_informacion",
  "calificacion_en_curso",
  "interesado_presentado",
  "interesado_aceptado",
];

const EXIT_STATUS_CONFIG: Record<string, { icon: typeof Pause; bg: string; border: string; text: string; badge: string }> = {
  en_espera: {
    icon: Pause,
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800/50",
    text: "text-yellow-800 dark:text-yellow-200",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  },
  descartada: {
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/50",
    text: "text-red-800 dark:text-red-200",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  no_disponible: {
    icon: Ban,
    bg: "bg-gray-50 dark:bg-gray-900/50",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-300",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

const EXIT_REASON_LABELS: Record<string, string> = {
  precio: "Precio no adecuado",
  zona: "Zona no deseada",
  caracteristicas: "Características no adecuadas",
  otro: "Otro motivo",
  interesado_aceptado_otra: "Interesado aceptado para otra propiedad",
  propiedad_en_calificacion: "Otra propiedad en calificación",
  propiedad_no_disponible: "Propiedad no disponible",
};

function buildTimestampMap(events: MtpEvent[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const ev of events) {
    if (ev.new_status) {
      map[ev.new_status] = ev.created_at;
    }
  }
  return map;
}

/**
 * Modal "Historial y Correcciones" — timeline de estados de la MTP
 * con posibilidad de revertir a cualquier estado pasado.
 */
export function MtpModalRegistroActividad({
  open,
  onOpenChange,
  leadsProperty,
  propertyAddress,
  onRevert,
}: MtpModalRegistroActividadProps) {
  const [reverting, setReverting] = useState(false);
  const [events, setEvents] = useState<MtpEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    const leadId = leadsProperty.leads_unique_id;
    const lpId = leadsProperty.id;
    if (!leadId || !lpId) return;

    setEventsLoading(true);
    try {
      const res = await fetch(
        `/api/leads/${encodeURIComponent(leadId)}/properties/${encodeURIComponent(lpId)}/events`
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // silent — fallback to leads_properties timestamps
    } finally {
      setEventsLoading(false);
    }
  }, [leadsProperty.leads_unique_id, leadsProperty.id]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [open, fetchEvents]);

  const timestampMap = useMemo(() => buildTimestampMap(events), [events]);

  const currentStatus = (leadsProperty.current_status ?? "interesado_cualificado") as MtpStatusId;
  const currentRank = MTP_STATUS_RANK[currentStatus] ?? 0;
  const isExit = currentRank === 0 && currentStatus !== "interesado_cualificado";

  const exitInfo: ExitInfo | null = useMemo(() => {
    if (!isExit) return null;
    return {
      statusId: currentStatus,
      label: MTP_STATUS_TITLES[currentStatus] ?? currentStatus,
      timestamp: timestampMap[currentStatus] ?? (leadsProperty.updated_at ?? null),
      exitReason: leadsProperty.exit_reason ?? null,
      exitComments: leadsProperty.exit_comments ?? null,
    };
  }, [isExit, currentStatus, timestampMap, leadsProperty]);

  const items = useMemo(() => {
    const lp = leadsProperty;

    const dataByStatus: Record<string, Record<string, unknown>> = {
      interesado_cualificado: {},
    };

    if (lp.visit_date) {
      dataByStatus.visita_agendada = { visit_date: lp.visit_date };
    }
    if (lp.visit_feedback) {
      dataByStatus.pendiente_de_evaluacion = { visit_feedback: lp.visit_feedback };
    }
    if (lp.tenant_confirmed_interest) {
      dataByStatus.esperando_decision = { tenant_confirmed_interest: lp.tenant_confirmed_interest };
    }
    if (lp.sent_to_finaer_at) {
      dataByStatus.recogiendo_informacion = { sent_to_finaer_at: lp.sent_to_finaer_at };
    }
    if (lp.finaer_status) {
      dataByStatus.calificacion_en_curso = {
        finaer_status: lp.finaer_status,
        finaer_rejection_reason: lp.finaer_rejection_reason,
      };
    }
    if (lp.owner_status) {
      dataByStatus.interesado_presentado = {
        owner_status: lp.owner_status,
        owner_rejection_reason: lp.owner_rejection_reason,
      };
    }
    if (lp.current_status === "interesado_aceptado") {
      dataByStatus.interesado_aceptado = {};
    }

    const list: TimelineItem[] = MAIN_STATES_ORDER.map((statusId) => {
      const rank = MTP_STATUS_RANK[statusId];
      const hasData = statusId in dataByStatus;

      let state: "past" | "current" | "future";
      if (isExit) {
        state = hasData ? "past" : "future";
      } else if (rank < currentRank) {
        state = "past";
      } else if (rank === currentRank) {
        state = "current";
      } else {
        state = "future";
      }

      const eventTimestamp = timestampMap[statusId] ?? null;
      const fallbackTimestamp = statusId === "interesado_cualificado" ? (lp.created_at ?? null) : null;

      return {
        id: statusId,
        statusId,
        label: MTP_STATUS_TITLES[statusId],
        timestamp: eventTimestamp ?? fallbackTimestamp,
        data: dataByStatus[statusId] ?? {},
        state,
      };
    });

    return list;
  }, [leadsProperty, timestampMap, isExit, currentRank]);

  const handleRevert = async (targetStatus: string) => {
    if (!onRevert || reverting) return;
    setReverting(true);
    try {
      await onRevert(targetStatus);
    } finally {
      setReverting(false);
    }
  };

  const statusLabel = MTP_STATUS_TITLES[currentStatus] ?? currentStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                {propertyAddress}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Historial y Correcciones
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {eventsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Exit state banner — shown above timeline when MTP is archived */}
              {exitInfo && (
                <ExitStateBanner info={exitInfo} />
              )}

              {/* Main timeline — chronological order (earliest first) */}
              <div className={cn(exitInfo && "mt-5")}>
                {items.map((item, idx) => {
                  const isCurrent = item.state === "current";
                  const isPast = item.state === "past";
                  const isFuture = item.state === "future";

                  return (
                    <div
                      key={item.id}
                      className={cn("flex gap-3.5", isFuture && "opacity-35")}
                    >
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center w-5">
                        <div
                          className={cn(
                            "shrink-0 mt-1.5 rounded-full",
                            isCurrent
                              ? "w-3.5 h-3.5 bg-primary ring-[3px] ring-primary/20"
                              : isPast
                                ? "w-2.5 h-2.5 bg-primary/70"
                                : "w-2.5 h-2.5 border-2 border-muted-foreground/25"
                          )}
                        />
                        {idx < items.length - 1 && (
                          <div className={cn(
                            "w-px flex-1 min-h-[20px] mt-1",
                            isPast || isCurrent ? "bg-primary/20" : "bg-border"
                          )} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm",
                                isCurrent
                                  ? "text-primary font-semibold"
                                  : isPast
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground font-medium"
                              )}
                            >
                              {item.label}
                              {isCurrent && (
                                <span className="ml-2 text-[11px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                                  Actual
                                </span>
                              )}
                            </p>
                            {item.timestamp && !isFuture && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                              </p>
                            )}
                          </div>

                          {isPast && onRevert && currentStatus !== "no_disponible" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 h-7 text-xs text-muted-foreground hover:text-primary px-2"
                              disabled={reverting}
                              onClick={() => handleRevert(item.statusId)}
                            >
                              {reverting ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Undo2 className="mr-1 h-3.5 w-3.5" />
                              )}
                              Revertir
                            </Button>
                          )}
                        </div>

                        {!isFuture && Object.keys(item.data).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-0.5 rounded-md bg-muted/40 px-3 py-2">
                            {item.data.visit_date && (
                              <p><span className="font-medium">Fecha visita:</span> {format(new Date(String(item.data.visit_date)), "d MMM yyyy, HH:mm", { locale: es })}</p>
                            )}
                            {item.data.visit_feedback && (
                              <p><span className="font-medium">Feedback:</span> {String(item.data.visit_feedback)}</p>
                            )}
                            {item.data.finaer_status && (
                              <p><span className="font-medium">Finaer:</span> {String(item.data.finaer_status)}</p>
                            )}
                            {item.data.finaer_rejection_reason && (
                              <p><span className="font-medium">Motivo rechazo Finaer:</span> {String(item.data.finaer_rejection_reason)}</p>
                            )}
                            {item.data.owner_status && (
                              <p><span className="font-medium">Propietario:</span> {String(item.data.owner_status)}</p>
                            )}
                            {item.data.owner_rejection_reason && (
                              <p><span className="font-medium">Motivo rechazo propietario:</span> {String(item.data.owner_rejection_reason)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer with current status */}
        <div className="px-6 py-3 border-t border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)]">
          <p className="text-xs text-muted-foreground text-center">
            Estado actual: <span className="font-medium text-foreground">{statusLabel}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExitStateBanner({ info }: { info: ExitInfo }) {
  const config = EXIT_STATUS_CONFIG[info.statusId] ?? EXIT_STATUS_CONFIG.no_disponible;
  const Icon = config.icon;
  const reasonLabel = info.exitReason ? (EXIT_REASON_LABELS[info.exitReason] ?? info.exitReason) : null;

  return (
    <div className={cn("rounded-lg border p-4", config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex items-center justify-center w-8 h-8 rounded-md shrink-0", config.badge)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", config.text)}>
            {info.label}
          </p>
          {info.timestamp && (
            <p className={cn("text-xs mt-0.5 opacity-70", config.text)}>
              {format(new Date(info.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          )}
          {reasonLabel && (
            <p className={cn("text-xs mt-2", config.text)}>
              <span className="font-medium">Motivo:</span> {reasonLabel}
            </p>
          )}
          {info.exitComments && (
            <p className={cn("text-xs mt-1 opacity-80", config.text)}>
              {info.exitComments}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
