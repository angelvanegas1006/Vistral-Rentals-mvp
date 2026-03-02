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

const PAUSE_REASONS = [
  { value: "pendiente_documentacion", label: "Pendiente documentación" },
  { value: "pendiente_respuesta", label: "Pendiente respuesta del interesado" },
  { value: "otro", label: "Otro motivo" },
];

export interface MtpModalPausaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  onConfirm: (exitReason: string, exitComments: string) => Promise<void>;
}

export function MtpModalPausa({
  open,
  onOpenChange,
  propertyAddress,
  onConfirm,
}: MtpModalPausaProps) {
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
      toast.error(e instanceof Error ? e.message : "Error al pausar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pausar (Poner en Espera)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Pausar <strong>{propertyAddress}</strong>. La propiedad quedará en espera y podrá recuperarse después.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_REASONS.map((r) => (
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
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !reason}>
            Pausar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
