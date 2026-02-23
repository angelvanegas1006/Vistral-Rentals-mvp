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

const EXIT_REASONS = [
  { value: "precio", label: "Precio no adecuado" },
  { value: "zona", label: "Zona no deseada" },
  { value: "caracteristicas", label: "Características no adecuadas" },
  { value: "otro", label: "Otro motivo" },
];

export interface MtpModalDescarteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  onConfirm: (exitReason: string, exitComments: string) => Promise<void>;
}

export function MtpModalDescarte({
  open,
  onOpenChange,
  propertyAddress,
  onConfirm,
}: MtpModalDescarteProps) {
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
      toast.error(e instanceof Error ? e.message : "Error al descartar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Descartar Propiedad</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Descartar <strong>{propertyAddress}</strong> de la gestión de este interesado.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {EXIT_REASONS.map((r) => (
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
          <Button variant="destructive" onClick={handleConfirm} disabled={loading || !reason}>
            Descartar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
