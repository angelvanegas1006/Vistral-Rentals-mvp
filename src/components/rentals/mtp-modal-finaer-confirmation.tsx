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
import { CheckCircle2, PauseCircle } from "lucide-react";

export interface MtpModalFinaerConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  otherActiveCount: number;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function MtpModalFinaerConfirmation({
  open,
  onOpenChange,
  propertyAddress,
  otherActiveCount,
  onConfirm,
  onCancel,
}: MtpModalFinaerConfirmationProps) {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-describedby="finaer-confirmation-description"
      >
        <DialogHeader>
          <DialogTitle>Confirmar inicio de calificación</DialogTitle>
          <DialogDescription id="finaer-confirmation-description">
            Vas a iniciar el estudio de solvencia para la propiedad{" "}
            <strong>{propertyAddress}</strong>. Al confirmar, ocurrirá lo
            siguiente:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-[var(--vistral-radius-md)] bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              El Interesado avanzará a la fase{" "}
              <strong>Calificación en Curso</strong>.
            </p>
          </div>

          {otherActiveCount > 0 && (
            <div className="flex items-start gap-3 rounded-[var(--vistral-radius-md)] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <PauseCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Las otras <strong>{otherActiveCount}</strong>{" "}
                {otherActiveCount === 1 ? "propiedad" : "propiedades"} en las
                que estaba interesado{" "}
                {otherActiveCount === 1 ? "pasará" : "pasarán"} al estado{" "}
                <strong>En Espera</strong> de forma automática.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Checkbox
            id="confirm-finaer-start"
            checked={confirmed}
            onCheckedChange={(c) => setConfirmed(c === true)}
          />
          <Label
            htmlFor="confirm-finaer-start"
            className="cursor-pointer text-sm leading-tight"
          >
            Confirmar inicio de calificación para{" "}
            <strong>{propertyAddress}</strong>
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
          <Button onClick={handleConfirm} disabled={!confirmed || loading}>
            {loading ? "Procesando…" : "Confirmar y Avanzar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
