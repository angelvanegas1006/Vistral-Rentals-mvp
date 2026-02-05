"use client";

import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

interface Lead {
  id: string;
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
  isHighlighted?: boolean;
  needsUpdate?: boolean;
}

interface RentalsLeadCardProps {
  lead: Lead;
  onClick?: () => void;
  className?: string;
  searchQuery?: string;
  disabled?: boolean;
}

export function RentalsLeadCard({
  lead,
  onClick,
  className,
  searchQuery = "",
  disabled = false,
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

  return (
    <div
      data-lead-id={lead.id}
      onClick={handleClick}
      className={cn(
        // Estilos base
        "rounded-lg border-2 border-border bg-card p-5 md:p-6 shadow-sm w-full relative max-w-full",
        // Transiciones
        "transition-all duration-200 ease-out",
        // Estados de cursor
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        // Hover Light mode
        !disabled && [
          "hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]",
          // Solo cambiar bordes superior, derecho e inferior en hover, mantener izquierdo si está retrasada
          lead.needsUpdate
            ? "hover:border-t-[var(--vistral-gray-300)] hover:border-r-[var(--vistral-gray-300)] hover:border-b-[var(--vistral-gray-300)]"
            : "hover:border-[var(--vistral-gray-300)]",
        ],
        // Hover Dark mode
        !disabled && [
          "dark:hover:bg-[#1a1a1a]",
          "dark:hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.6)]",
          lead.needsUpdate
            ? "dark:hover:border-t-[var(--vistral-gray-700)] dark:hover:border-r-[var(--vistral-gray-700)] dark:hover:border-b-[var(--vistral-gray-700)]"
            : "dark:hover:border-[var(--vistral-gray-700)]",
        ],
        // Estado highlighted
        isHighlighted &&
          "ring-2 ring-[var(--vistral-blue-500)] shadow-lg border-[var(--vistral-blue-500)] bg-[var(--vistral-blue-50)] dark:bg-[var(--vistral-blue-950)]/30",
        // Estado retrasado (borde izquierdo rojo intenso)
        lead.needsUpdate && "border-l-4 border-l-red-500",
        className
      )}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
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
      {lead.daysInPhase !== undefined && (
        <div>
          <span className="text-xs text-muted-foreground">
            {lead.daysInPhase === 0
              ? "Hoy"
              : lead.daysInPhase === 1
              ? "1 día"
              : `${lead.daysInPhase} días`}{" "}
            en esta fase
          </span>
        </div>
      )}
    </div>
  );
}
