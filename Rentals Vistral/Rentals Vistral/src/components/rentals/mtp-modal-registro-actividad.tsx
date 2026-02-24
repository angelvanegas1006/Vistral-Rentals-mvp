"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MTP_STATUS_TITLES } from "@/lib/leads/mtp-status";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

export interface MtpModalRegistroActividadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadsProperty: LeadsPropertyRow;
  propertyAddress: string;
}

interface TimelineItem {
  id: string;
  label: string;
  timestamp: string | null;
  data: Record<string, unknown>;
}

/**
 * Timeline derivado de los datos actuales de leads_properties.
 * Muestra los estados por los que ha pasado la MTP según los campos rellenados.
 */
export function MtpModalRegistroActividad({
  open,
  onOpenChange,
  leadsProperty,
  propertyAddress,
}: MtpModalRegistroActividadProps) {
  const items = useMemo(() => {
    const list: TimelineItem[] = [];
    const lp = leadsProperty;

    list.push({
      id: "perfil",
      label: MTP_STATUS_TITLES.interesado_cualificado,
      timestamp: lp.created_at ?? null,
      data: {},
    });

    if (lp.visit_date) {
      list.push({
        id: "visita",
        label: MTP_STATUS_TITLES.visita_agendada,
        timestamp: lp.visit_date,
        data: { visit_date: lp.visit_date },
      });
    }

    if (lp.visit_feedback) {
      list.push({
        id: "pendiente",
        label: MTP_STATUS_TITLES.pendiente_de_evaluacion,
        timestamp: lp.updated_at ?? null,
        data: { visit_feedback: lp.visit_feedback },
      });
    }

    if (lp.tenant_confirmed_interest) {
      list.push({
        id: "esperando",
        label: MTP_STATUS_TITLES.esperando_decision,
        timestamp: lp.tenant_confirmed_interest,
        data: { tenant_confirmed_interest: lp.tenant_confirmed_interest },
      });
    }

    if (lp.sent_to_finaer_at) {
      list.push({
        id: "recogiendo",
        label: MTP_STATUS_TITLES.recogiendo_informacion,
        timestamp: lp.sent_to_finaer_at,
        data: { sent_to_finaer_at: lp.sent_to_finaer_at },
      });
    }

    if (lp.finaer_status) {
      list.push({
        id: "calificacion",
        label: MTP_STATUS_TITLES.calificacion_en_curso,
        timestamp: lp.updated_at ?? null,
        data: {
          finaer_status: lp.finaer_status,
          finaer_rejection_reason: lp.finaer_rejection_reason,
        },
      });
    }

    if (lp.owner_status) {
      list.push({
        id: "presentado",
        label: MTP_STATUS_TITLES.interesado_presentado,
        timestamp: lp.updated_at ?? null,
        data: {
          owner_status: lp.owner_status,
          owner_rejection_reason: lp.owner_rejection_reason,
        },
      });
    }

    if (lp.current_status === "interesado_aceptado") {
      list.push({
        id: "aceptado",
        label: MTP_STATUS_TITLES.interesado_aceptado,
        timestamp: lp.updated_at ?? null,
        data: {},
      });
    }

    const exitStatuses = ["en_espera", "descartada", "no_disponible"];
    if (lp.current_status && exitStatuses.includes(lp.current_status)) {
      list.push({
        id: "exit",
        label: MTP_STATUS_TITLES[lp.current_status as keyof typeof MTP_STATUS_TITLES] ?? lp.current_status,
        timestamp: lp.updated_at ?? null,
        data: {
          exit_reason: lp.exit_reason,
          exit_comments: lp.exit_comments,
        },
      });
    }

    return list.reverse();
  }, [leadsProperty]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Registro de Actividad - {propertyAddress}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1.5" />
                {idx < items.length - 1 && (
                  <div className="w-px flex-1 min-h-[24px] bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <p className="font-medium text-foreground">{item.label}</p>
                {item.timestamp && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                )}
                {Object.keys(item.data).length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground space-y-1 rounded-md bg-muted/50 p-3">
                    {item.data.visit_feedback && (
                      <p><strong>Feedback:</strong> {String(item.data.visit_feedback)}</p>
                    )}
                    {item.data.finaer_status && (
                      <p><strong>Finaer:</strong> {String(item.data.finaer_status)}</p>
                    )}
                    {item.data.finaer_rejection_reason && (
                      <p><strong>Motivo rechazo Finaer:</strong> {String(item.data.finaer_rejection_reason)}</p>
                    )}
                    {item.data.owner_status && (
                      <p><strong>Propietario:</strong> {String(item.data.owner_status)}</p>
                    )}
                    {item.data.owner_rejection_reason && (
                      <p><strong>Motivo rechazo propietario:</strong> {String(item.data.owner_rejection_reason)}</p>
                    )}
                    {item.data.exit_reason && (
                      <p><strong>Motivo salida:</strong> {String(item.data.exit_reason)}</p>
                    )}
                    {item.data.exit_comments && (
                      <p><strong>Comentarios:</strong> {String(item.data.exit_comments)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
