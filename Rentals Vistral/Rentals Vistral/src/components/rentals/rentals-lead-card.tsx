"use client";

import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";
import type { NotificationColor } from "@/hooks/use-lead-notifications-summary";

interface Lead {
  id: string;
  leadsUniqueId?: string;
  name: string;
  phone: string;
  email?: string;
  interestedProperty?: {
    id: string;
    address: string;
    city?: string;
  };
  zone?: string;
  currentPhase: string;
  daysInPhase?: number;
  phaseEnteredAt?: string;
  isHighlighted?: boolean;
  needsUpdate?: boolean;
  label?: string;
}

interface RentalsLeadCardProps {
  lead: Lead;
  onClick?: () => void;
  className?: string;
  searchQuery?: string;
  disabled?: boolean;
  notificationColor?: NotificationColor;
}

export function RentalsLeadCard({
  lead,
  onClick,
  className,
  searchQuery = "",
  disabled = false,
  notificationColor,
}: RentalsLeadCardProps) {
  const isHighlighted = lead.isHighlighted;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;
    
    // Prevenir el click si se está arrastrando
    const isDragging = (e.target as HTMLElement).closest('[data-sortable-handle]');
    if (isDragging) return;
    
    e.stopPropagation();
    onClick();
  };

  const notificationStyles = notificationColor && !isHighlighted
    ? {
        red: "border-l-4 border-l-red-500 dark:border-l-red-400",
        yellow: "border-l-4 border-l-amber-500 dark:border-l-amber-400",
        blue: "border-l-4 border-l-blue-500 dark:border-l-blue-400",
      }[notificationColor]
    : null;

  return (
    <div
      data-lead-id={lead.id}
      onClick={handleClick}
      className={cn(
        // Estilos base - mismo tamaño que tarjetas de Captación/Cierre
        "rounded-lg border border-border bg-card p-5 md:p-6 shadow-sm w-full relative max-w-full",
        // Transiciones
        "transition-all duration-200 ease-out",
        // Estados de cursor
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        // Hover Light mode
        !disabled && [
          "hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]",
          (lead.needsUpdate || notificationStyles)
            ? "hover:border-t-[var(--vistral-gray-300)] hover:border-r-[var(--vistral-gray-300)] hover:border-b-[var(--vistral-gray-300)]"
            : "hover:border-[var(--vistral-gray-300)]",
        ],
        // Hover Dark mode
        !disabled && [
          "dark:hover:bg-[#1a1a1a]",
          "dark:hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.6)]",
          (lead.needsUpdate || notificationStyles)
            ? "dark:hover:border-t-[var(--vistral-gray-700)] dark:hover:border-r-[var(--vistral-gray-700)] dark:hover:border-b-[var(--vistral-gray-700)]"
            : "dark:hover:border-[var(--vistral-gray-700)]",
        ],
        // Estado highlighted
        isHighlighted &&
          "ring-2 ring-[var(--vistral-blue-500)] shadow-lg border-[var(--vistral-blue-500)] bg-[var(--vistral-blue-50)] dark:bg-[var(--vistral-blue-950)]/30",
        // Notification color (priority-based ring/border)
        notificationStyles,
        // Estado retrasado (borde izquierdo rojo intenso)
        lead.needsUpdate && !notificationStyles && "border-l-4 border-l-red-500",
        className
      )}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      {/* Header con ID y Label */}
      {lead.leadsUniqueId && (
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs font-semibold text-muted-foreground">ID {lead.leadsUniqueId}</div>
          {lead.label && lead.currentPhase === "Interesado Cualificado" && (
            <span
              className={cn(
                "inline-flex items-center rounded-full text-xs font-medium px-2 py-1 whitespace-nowrap",
                lead.label === "nuevo"
                  ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
              )}
            >
              {lead.label === "nuevo" ? "Nuevo" : "Recuperado"}
            </span>
          )}
        </div>
      )}

      {/* Nombre del Lead */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {lead.name}
        </h3>
      </div>

      {/* Teléfono */}
      <div className="mb-2 flex items-center gap-1.5">
        <Phone className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{lead.phone}</span>
      </div>

      {/* Propiedad interesado */}
      {lead.interestedProperty && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-0.5">Propiedad:</p>
          <p className="text-xs font-medium text-foreground line-clamp-1">
            {lead.interestedProperty.address}
            {lead.interestedProperty.city && (
              <span className="text-muted-foreground ml-1">
                • {lead.interestedProperty.city}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Zona */}
      {lead.zone && (
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">Zona: </span>
          <span className="text-xs font-medium text-foreground">{lead.zone}</span>
        </div>
      )}

      {/* Días en fase */}
      {lead.phaseEnteredAt && (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>
            <span className="font-medium">Días en fase:</span>{" "}
            {Math.max(0, Math.floor((Date.now() - new Date(lead.phaseEnteredAt).getTime()) / 86400000))} días
          </p>
        </div>
      )}
    </div>
  );
}
