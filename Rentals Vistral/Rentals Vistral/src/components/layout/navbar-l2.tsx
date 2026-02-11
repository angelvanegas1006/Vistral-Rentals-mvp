"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarL2Props {
  backHref?: string;
  /** Título del header. Si no se pasa, se muestra "Detalle de propiedad". Para leads: "Detalles del interesado" */
  title?: string;
  className?: string;
  onSave?: () => void | Promise<void>;
  onNextPhase?: () => void | Promise<void>;
  isSaving?: boolean;
  canAdvancePhase?: boolean;
  nextPhaseLabel?: string;
  isBlocked?: boolean;
  blockedMessage?: string;
  onSubmitComments?: () => void | Promise<void>;
  canSubmitComments?: boolean;
}

export function NavbarL2({
  backHref,
  title,
  className,
  onSave,
  onNextPhase,
  isSaving = false,
  canAdvancePhase = true,
  nextPhaseLabel = "Avanzar a la siguiente fase",
  isBlocked = false,
  blockedMessage = "Avance bloqueado",
  onSubmitComments,
  canSubmitComments = true,
}: NavbarL2Props) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "bg-white dark:bg-[var(--vistral-gray-900)] border-b border-[#D4D4D8] dark:border-[var(--vistral-gray-700)]",
        "py-4 px-6 md:px-12",
        "sticky top-0 z-10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Back Button + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Atrás</span>
          </button>
          
          {/* Vertical divider */}
          <div className="h-6 w-px bg-[#E5E7EB] dark:bg-[#374151]" />
          
          {/* Title */}
          <span className="text-sm font-medium text-[#212121] dark:text-[#F9FAFB]">{title ?? "Detalle de propiedad"}</span>
        </div>

        {/* Right: Action Buttons */}
        {(onSave || onNextPhase || onSubmitComments) && (
          <div className="flex items-center gap-3">
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium",
                  "text-[#162EB7] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#2563EB] transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162EB7] focus-visible:ring-offset-2"
                )}
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Guardando..." : "Guardar"}</span>
              </button>
            )}
            {onSubmitComments && (
              <button
                onClick={() => {
                  // El handler mostrará el mensaje de error si no se cumplen las condiciones
                  // Permitimos el click para que el handler pueda validar y mostrar el mensaje apropiado
                  if (!isSaving) {
                    onSubmitComments();
                  }
                }}
                disabled={isSaving}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-full text-sm font-medium",
                  canSubmitComments
                    ? "bg-[#2050F6] hover:bg-[#1D4ED8] text-white"
                    : "bg-[#2050F6]/50 hover:bg-[#2050F6]/60 text-white/80",
                  "shadow-sm hover:shadow-md transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2050F6] focus-visible:ring-offset-2",
                  "whitespace-nowrap"
                )}
                title={!canSubmitComments ? "Completa la revisión de todas las secciones y comentarios requeridos" : undefined}
              >
                <span>Enviar comentarios</span>
              </button>
            )}
            {onNextPhase && canAdvancePhase && (
              <button
                onClick={onNextPhase}
                disabled={isSaving || isBlocked}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-full text-sm font-medium",
                  isBlocked
                    ? "bg-orange-50 border-2 border-orange-200 text-orange-800 hover:bg-orange-100 cursor-not-allowed"
                    : "bg-[#2050F6] hover:bg-[#1D4ED8] text-white",
                  "shadow-sm hover:shadow-md transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2050F6] focus-visible:ring-offset-2",
                  "whitespace-nowrap"
                )}
                title={isBlocked ? blockedMessage : undefined}
              >
                {isBlocked && <Lock className="h-4 w-4" />}
                <span>{isBlocked ? blockedMessage : nextPhaseLabel}</span>
                {!isBlocked && <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
