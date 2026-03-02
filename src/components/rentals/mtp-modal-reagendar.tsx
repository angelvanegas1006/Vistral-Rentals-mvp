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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const REAGENDAR_REASONS = [
  { value: "imprevisto_interesado", label: "Imprevisto del interesado" },
  { value: "imprevisto_propiedad", label: "Imprevisto en la propiedad" },
  { value: "otro", label: "Otro motivo" },
];

export interface MtpModalReagendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  currentVisitDate?: string | null;
  onConfirm: (newVisitDate: string, justification: string) => Promise<void>;
}

export function MtpModalReagendar({
  open,
  onOpenChange,
  propertyAddress,
  currentVisitDate,
  onConfirm,
}: MtpModalReagendarProps) {
  const [justification, setJustification] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!dateInput) {
      toast.error("Selecciona una nueva fecha");
      return;
    }
    if (!justification.trim()) {
      toast.error("Indica la justificación");
      return;
    }
    const visitDateTime = `${dateInput}T${timeInput}:00.000Z`;
    setLoading(true);
    try {
      await onConfirm(visitDateTime, justification.trim());
      setJustification("");
      setDateInput("");
      setTimeInput("10:00");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al reagendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Visita</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Reagendar la visita a <strong>{propertyAddress}</strong>.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Justificación</Label>
            <Select value={justification} onValueChange={setJustification}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona motivo" />
              </SelectTrigger>
              <SelectContent>
                {REAGENDAR_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nueva fecha</Label>
            <Input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nueva hora</Label>
            <Input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !dateInput || !justification}>
            Reagendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
