"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransitionConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromPhase: string;
  toPhase: string;
  propertyAddress: string;
  direction: "forward" | "backward";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function TransitionConfirmationModal({
  open,
  onOpenChange,
  fromPhase,
  toPhase,
  propertyAddress,
  direction,
  onConfirm,
  onCancel,
}: TransitionConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmed(false);
      onCancel();
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await onConfirm();
      setConfirmed(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = direction === "forward" ? ArrowRight : ArrowLeft;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-describedby="transition-description"
      >
        <DialogHeader>
          <DialogTitle>Actualización de Fase del Interesado</DialogTitle>
          <DialogDescription id="transition-description">
            La acción realizada sobre la propiedad{" "}
            <strong>{propertyAddress}</strong> requiere mover la tarjeta del
            Interesado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-4">
          <span
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium",
              direction === "backward" &&
                "border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-600/50 dark:bg-amber-950/30 dark:text-amber-200"
            )}
          >
            {fromPhase}
          </span>
          <ArrowIcon
            className={cn(
              "h-6 w-6 flex-shrink-0",
              direction === "backward" && "text-amber-600 dark:text-amber-400"
            )}
          />
          <span className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium">
            {toPhase}
          </span>
        </div>

        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Checkbox
            id="confirm-phase-change"
            checked={confirmed}
            onCheckedChange={(c) => setConfirmed(c === true)}
          />
          <Label
            htmlFor="confirm-phase-change"
            className="cursor-pointer text-sm leading-tight"
          >
            Confirmar cambio de fase a <strong>{toPhase}</strong>
          </Label>
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
            onClick={handleConfirm}
            disabled={!confirmed || loading}
          >
            {loading ? "Guardando…" : "Confirmar y Mover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
