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

const CANCEL_REASONS = [
  { value: "interesado_no_disponible", label: "Interesado no disponible" },
  { value: "propiedad_no_accesible", label: "Propiedad no accesible" },
  { value: "cambio_interes", label: "Cambio de interés del interesado" },
  { value: "otro", label: "Otro motivo" },
];

export interface MtpModalCancelarVisitaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  onConfirm: (exitReason: string, exitComments: string) => Promise<void>;
}

export function MtpModalCancelarVisita({
  open,
  onOpenChange,
  propertyAddress,
  onConfirm,
}: MtpModalCancelarVisitaProps) {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.error(e instanceof Error ? e.message : "Error al cancelar la visita");
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
          <DialogTitle className="text-amber-600 dark:text-amber-400">
            Cancelar Visita
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cancelar la visita programada a <strong>{propertyAddress}</strong>. La
          propiedad será descartada de la gestión de este interesado.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
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
              placeholder="Detalles adicionales sobre la cancelación..."
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
            Volver
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleConfirm}
            disabled={loading || !reason}
          >
            {loading ? "Cancelando…" : "Cancelar Visita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
