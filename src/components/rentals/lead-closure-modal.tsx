"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const REASONS_PERDIDO = [
  { value: "Encontró otra opción", label: "Encontró otra opción" },
  { value: "No responde", label: "No responde" },
  { value: "Presupuesto insuficiente", label: "Presupuesto insuficiente" },
  { value: "Cambio de planes", label: "Cambio de planes" },
];

const REASONS_RECHAZADO = [
  { value: "Rechazado por Finaer", label: "Rechazado por Finaer" },
  { value: "Rechazado por Propietario", label: "Rechazado por Propietario" },
  { value: "Documentación falsa/incompleta", label: "Documentación falsa/incompleta" },
  { value: "Perfil conflictivo", label: "Perfil conflictivo" },
];

export type LeadClosureType = "perdido" | "rechazado";

export interface LeadClosureModalProps {
  type: LeadClosureType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (exitReason: string, exitComments: string) => Promise<void>;
}

export function LeadClosureModal({
  type,
  open,
  onOpenChange,
  onConfirm,
}: LeadClosureModalProps) {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = type === "perdido" ? REASONS_PERDIDO : REASONS_RECHAZADO;
  const title =
    type === "perdido"
      ? "Marcar como Interesado Perdido"
      : "Marcar como Interesado Rechazado";
  const description =
    type === "perdido"
      ? "El cliente ya no busca o encontró otra opción. Todas las propiedades activas serán archivadas."
      : "La agencia, Finaer o el propietario descartan este perfil. Todas las propiedades activas serán archivadas.";

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Selecciona un motivo");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason, comments.trim());
      setReason("");
      setComments("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cerrar el interesado");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
      setComments("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={type === "rechazado" ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Comentarios (opcional)</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Notas adicionales sobre el cierre..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant={type === "rechazado" ? "destructive" : "default"}
            className={type === "perdido" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
            onClick={handleConfirm}
            disabled={loading || !reason}
          >
            Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
