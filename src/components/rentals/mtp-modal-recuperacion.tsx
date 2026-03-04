"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertWithIcon } from "@/components/ui/alert";
import { toast } from "sonner";
import { MTP_STATUS_TITLES, MTP_STATUS_RANK, type MtpStatusId } from "@/lib/leads/mtp-status";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

const RECOVERABLE_TARGET_STATUSES: MtpStatusId[] = [
  "interesado_cualificado",
  "visita_agendada",
  "pendiente_de_evaluacion",
  "esperando_decision",
  "recogiendo_informacion",
  "calificacion_en_curso",
  "interesado_presentado",
];

export interface MtpModalRecuperacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadsProperty: LeadsPropertyRow;
  propertyAddress: string;
  onConfirm: (targetStatus: string, newVisitDate?: string) => Promise<void>;
}

export function MtpModalRecuperacion({
  open,
  onOpenChange,
  leadsProperty,
  propertyAddress,
  onConfirm,
}: MtpModalRecuperacionProps) {
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const maxRank = useMemo(() => {
    const stored = leadsProperty.max_status_reached;
    if (stored) {
      return MTP_STATUS_RANK[stored as MtpStatusId] ?? 1;
    }
    const prevRank = MTP_STATUS_RANK[(leadsProperty.previous_status ?? "interesado_cualificado") as MtpStatusId] ?? 1;
    const currRank = MTP_STATUS_RANK[(leadsProperty.current_status ?? "interesado_cualificado") as MtpStatusId] ?? 0;
    return Math.max(prevRank, currRank, 1);
  }, [leadsProperty]);

  const availableStatuses = useMemo(() => {
    return RECOVERABLE_TARGET_STATUSES.filter((s) => {
      const rank = MTP_STATUS_RANK[s];
      return rank <= maxRank;
    });
  }, [maxRank]);

  const needsVisitDate = targetStatus === "visita_agendada";
  const visitExpired = useMemo(() => {
    if (!needsVisitDate) return false;
    const vd = leadsProperty.visit_date;
    if (!vd) return true;
    return new Date(vd) < new Date();
  }, [needsVisitDate, leadsProperty.visit_date]);

  const canConfirm = useMemo(() => {
    if (!targetStatus) return false;
    if (needsVisitDate && visitExpired && !dateInput) return false;
    return true;
  }, [targetStatus, needsVisitDate, visitExpired, dateInput]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      let newVisitDate: string | undefined;
      if (needsVisitDate && visitExpired && dateInput) {
        newVisitDate = `${dateInput}T${timeInput}:00.000Z`;
      }
      await onConfirm(targetStatus, newVisitDate);
      setTargetStatus("");
      setDateInput("");
      setTimeInput("10:00");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al recuperar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Recuperar Oportunidad</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Devolver la propiedad <strong>{propertyAddress}</strong> a gestión activa.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Estado destino</Label>
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado destino..." />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {MTP_STATUS_TITLES[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsVisitDate && visitExpired && (
            <>
              <AlertWithIcon
                variant="warning"
                title="Fecha de visita expirada"
                description="La fecha de la visita anterior ya ha expirado. Selecciona una nueva fecha y hora para reactivarla en este estado."
              />
              <div className="space-y-2">
                <Label>Nueva fecha de visita</Label>
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !canConfirm}>
            Confirmar Recuperación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
