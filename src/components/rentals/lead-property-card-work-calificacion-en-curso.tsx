"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  XIcon,
  User,
  Phone,
  Mail,
  RotateCcw,
  UserX,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];

const FINAER_REJECTION_REASONS: { value: string; label: string }[] = [
  { value: "ingresos_insuficientes", label: "Ingresos insuficientes" },
  { value: "documentacion_incompleta", label: "Documentación incompleta" },
  { value: "historial_crediticio", label: "Historial crediticio negativo" },
  { value: "situacion_laboral", label: "Situación laboral inestable" },
  { value: "otro", label: "Otro motivo" },
];

export interface LeadPropertyCardWorkCalificacionEnCursoProps {
  leadsProperty: LeadsPropertyRow;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  onUpdated?: () => void;
  onTransition?: (
    lpId: string,
    newStatus: string,
    action: "advance" | "undo" | "revive",
    updates: Record<string, unknown>
  ) => Promise<{ completed: boolean } | void>;
  onRecoverLead?: (context?: {
    rejectedMtpId: string;
    rejectionType: "finaer" | "propietario";
    reason: string;
  }) => void;
  onOpenClosureModal?: () => void;
}

export function LeadPropertyCardWorkCalificacionEnCurso({
  leadsProperty,
  ownerName,
  ownerPhone,
  ownerEmail,
  onUpdated,
  onTransition,
  onRecoverLead,
  onOpenClosureModal,
}: LeadPropertyCardWorkCalificacionEnCursoProps) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const [rejectionReason, setRejectionReason] = useState<string>(
    leadsProperty.finaer_rejection_reason ?? ""
  );
  const [rejectionComments, setRejectionComments] = useState<string>(
    leadsProperty.exit_comments ?? ""
  );

  const [resolution, setResolution] = useState<"descartar" | "recuperar" | null>(null);

  const isRejectionComplete = !!rejectionReason && !!rejectionComments.trim();

  const handleConfirmPresentation = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "interesado_presentado",
          "advance",
          { finaer_status: "approved" }
        );
        if (result?.completed) {
          toast.success("Interesado presentado al propietario.");
          onUpdated?.();
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [leadsProperty.id, onTransition, onUpdated]);

  const handleExecuteRejection = useCallback(async () => {
    setSaving(true);
    try {
      if (onTransition) {
        const result = await onTransition(
          leadsProperty.id,
          "rechazado_por_finaer",
          "advance",
          {
            finaer_status: "rejected",
            finaer_rejection_reason: rejectionReason,
            exit_reason: rejectionReason,
            exit_comments: rejectionComments || null,
          }
        );
        if (result?.completed) {
          onUpdated?.();
          if (resolution === "descartar") {
            onOpenClosureModal?.();
          } else if (resolution === "recuperar") {
            onRecoverLead?.({
              rejectedMtpId: leadsProperty.id,
              rejectionType: "finaer",
              reason: rejectionReason,
            });
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [
    leadsProperty.id,
    onTransition,
    onUpdated,
    rejectionReason,
    rejectionComments,
    resolution,
    onOpenClosureModal,
    onRecoverLead,
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
          <ShieldCheck className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            Resolución Finaer
          </p>
          <p className="text-xs text-muted-foreground">
            Registra el resultado del estudio de solvencia de Finaer
          </p>
        </div>
      </div>

      {/* Q1: ¿Aceptado por Finaer? */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          ¿Ha sido aceptado el Interesado por Finaer?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAnswer(true)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              answer === true
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Sí
          </button>
          <button
            type="button"
            onClick={() => setAnswer(false)}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
              answer === false
                ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300"
                : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
            )}
          >
            <XIcon className="h-4 w-4" />
            No
          </button>
        </div>
      </div>

      {/* === APPROVED PATH === */}
      {answer === true && (
        <div className="space-y-4">
          {(ownerName || ownerPhone || ownerEmail) && (
            <div className="rounded-[var(--vistral-radius-md)] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Información de Contacto del Propietario
              </p>
              {ownerName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{ownerName}</span>
                </div>
              )}
              {ownerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{ownerPhone}</span>
                </div>
              )}
              {ownerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{ownerEmail}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Contacta al propietario para presentarle el perfil del interesado. Cuando lo hayas hecho, confirma la presentación.
          </p>

          <Button
            className="w-full"
            onClick={handleConfirmPresentation}
            disabled={saving}
          >
            <Send className="h-4 w-4" />
            {saving ? "Confirmando…" : "Confirmar Presentación al Propietario"}
          </Button>
        </div>
      )}

      {/* === REJECTED PATH === */}
      {answer === false && (
        <div className="space-y-4">
          <div className="rounded-[var(--vistral-radius-md)] border border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30 p-4 space-y-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              Finaer ha rechazado al interesado. Completa los campos obligatorios para decidir qué hacer.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Motivo del Rechazo *
              </label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger className="w-full bg-white dark:bg-[var(--vistral-gray-900)]">
                  <SelectValue placeholder="Selecciona un motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {FINAER_REJECTION_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Comentarios *
              </label>
              <Textarea
                placeholder="Detalles adicionales sobre el rechazo..."
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                rows={3}
                className="bg-white dark:bg-[var(--vistral-gray-900)]"
              />
            </div>
          </div>

          {/* Resolution radio - only visible when rejection fields are complete */}
          {isRejectionComplete && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                ¿Qué quieres hacer con este Interesado?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution("recuperar")}
                  disabled={saving}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
                    resolution === "recuperar"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                      : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Recuperar Interesado
                </button>
                <button
                  type="button"
                  onClick={() => setResolution("descartar")}
                  disabled={saving}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[var(--vistral-radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
                    resolution === "descartar"
                      ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300"
                      : "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-800)]"
                  )}
                >
                  <UserX className="h-4 w-4" />
                  Descartar Interesado
                </button>
              </div>

              {resolution && (
                <Button
                  className="w-full mt-2"
                  variant={resolution === "descartar" ? "destructive" : "default"}
                  onClick={handleExecuteRejection}
                  disabled={saving}
                >
                  {saving
                    ? "Procesando…"
                    : resolution === "descartar"
                      ? "Confirmar Rechazo y Descartar"
                      : "Confirmar Rechazo y Recuperar"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
