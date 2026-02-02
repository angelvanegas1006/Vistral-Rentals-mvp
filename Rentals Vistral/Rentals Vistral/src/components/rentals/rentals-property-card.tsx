"use client";

import { Badge } from "@/components/ui/badge";
import { cn, generateInitials } from "@/lib/utils";
import { Calendar } from "lucide-react";

// Función helper para calcular días hasta una fecha
function calculateDaysUntil(dateString: string | undefined): number | null {
  if (!dateString) return null;
  
  try {
    let targetDate: Date;
    
    // Intentar parsear como fecha ISO (formato de Supabase: YYYY-MM-DD)
    if (dateString.includes('-') && dateString.length === 10) {
      targetDate = new Date(dateString);
    } 
    // Intentar parsear como formato DD/MM/YYYY
    else if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/').map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      targetDate = new Date(year, month - 1, day);
    } 
    // Intentar parsear directamente
    else {
      targetDate = new Date(dateString);
    }
    
    // Validar que la fecha sea válida
    if (isNaN(targetDate.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return null;
  }
}

// Función helper para formatear fecha a DD/MM/YYYY
function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  
  try {
    let date: Date;
    
    // Intentar parsear como fecha ISO (formato de Supabase: YYYY-MM-DD)
    if (dateString.includes('-') && dateString.length === 10) {
      date = new Date(dateString);
    } 
    // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
    else if (dateString.includes('/') && dateString.length === 10) {
      return dateString;
    }
    // Intentar parsear directamente
    else {
      date = new Date(dateString);
    }
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) return null;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return null;
  }
}

interface Property {
  property_unique_id: string;
  id?: string;
  address: string;
  city?: string;
  region?: string;
  daysInPhase: number;
  currentPhase: string;
  isExpired?: boolean;
  needsUpdate?: boolean;
  isHighlighted?: boolean;
  propertyType?: "Project" | "New Build" | "Building" | "Unit" | "WIP"; // Para tags de color
  managerName?: string; // Manager/Administrador de la propiedad
  rentalType?: "Larga estancia" | "Corta estancia" | "Vacacional"; // Tipo de alquiler
  propertyManager?: string; // Property Manager asignado
  rentalsAnalyst?: string; // Analista de rentals asignado
  writingDate?: string; // Fecha de escrituración
  visitDate?: string; // Fecha de visita estimada
  daysToVisit?: number; // Días para visitar
  daysToStart?: number; // Días para empezar desde firma
  renoEndDate?: string; // Fecha de fin de renovación
  propertyReadyDate?: string; // Fecha en que la propiedad está lista
  daysToPublishRent?: number; // Días para publicar el alquiler
}

interface RentalsPropertyCardProps {
  property: Property;
  onClick?: () => void;
  className?: string;
  searchQuery?: string;
  disabled?: boolean;
}

export function RentalsPropertyCard({
  property,
  onClick,
  className,
  searchQuery = "",
  disabled = false,
}: RentalsPropertyCardProps) {
  const isHighlighted = property.isHighlighted;

  const getRentalTypeColor = (type?: string) => {
    switch (type) {
      case "Larga estancia":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
      case "Corta estancia":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
      case "Vacacional":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200";
      default:
        return "";
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;
    
    e.stopPropagation();
    
    // TODO: Tracking de analytics
    // track("Property Card Clicked", { propertyId: property.id || property.property_unique_id });
    
    onClick();
  };

  // Detectar si hay borde izquierdo de color por daysToPublishRent
  const hasDaysToPublishRentBorder = 
    !isHighlighted &&
    !property.needsUpdate &&
    !property.isExpired &&
    property.currentPhase === "Listo para Alquilar" &&
    property.daysToPublishRent !== undefined &&
    property.daysToPublishRent !== null &&
    typeof property.daysToPublishRent === "number" &&
    ((property.daysToPublishRent > 5) || (property.daysToPublishRent >= 3 && property.daysToPublishRent <= 5));


  return (
    <div
      data-property-id={property.id || property.property_unique_id}
      onClick={handleClick}
      className={cn(
        "rounded-lg border border-border bg-card dark:bg-[var(--prophero-gray-900)] p-4 md:p-5 shadow-sm w-full overflow-hidden",
        "transition-all duration-500 ease-out",
        disabled 
          ? "cursor-not-allowed opacity-60" 
          : "cursor-pointer hover:border-2 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]",
        isHighlighted 
          ? "ring-2 ring-[var(--prophero-blue-500)] shadow-lg border-[var(--prophero-blue-500)] bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/30" 
          : "",
        // Estado retrasado (borde izquierdo rojo intenso) - puede coexistir con highlighted
        property.needsUpdate && "border-l-4 border-l-red-500",
        // Estado expired (borde izquierdo rojo medio) - solo si no está highlighted ni retrasada
        !isHighlighted &&
          !property.needsUpdate &&
          property.isExpired &&
          "border-l-4 border-l-red-400 dark:border-l-red-500",
        // Estado para "Listo para Alquilar" según daysToPublishRent
        // Borde rojo si daysToPublishRent > 5
        !isHighlighted &&
          !property.needsUpdate &&
          !property.isExpired &&
          property.currentPhase === "Listo para Alquilar" &&
          property.daysToPublishRent !== undefined &&
          property.daysToPublishRent !== null &&
          typeof property.daysToPublishRent === "number" &&
          property.daysToPublishRent > 5 &&
          "border-l-4 border-l-red-500",
        // Estado naranja-amarillo para daysToPublishRent entre 3-5 (inclusive)
        !isHighlighted &&
          !property.needsUpdate &&
          !property.isExpired &&
          property.currentPhase === "Listo para Alquilar" &&
          property.daysToPublishRent !== undefined &&
          property.daysToPublishRent !== null &&
          typeof property.daysToPublishRent === "number" &&
          property.daysToPublishRent >= 3 &&
          property.daysToPublishRent <= 5 &&
          "border-l-4 border-l-amber-500 dark:border-l-amber-400",
        className
      )}
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      {/* ID */}
      <div className="text-xs font-semibold text-muted-foreground mb-2">ID {property.property_unique_id}</div>
      
      {/* Address */}
      <div className="text-sm font-medium text-foreground mb-[5px]">{property.address}</div>

      {/* Tags and Info */}
      <div className="space-y-2">
          {/* Todos los elementos en la misma fila: Pills y círculos */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pills de colores: Tipo de alquiler y Tipo de activo */}
            {property.rentalType && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full text-xs font-medium px-2 py-1",
                  getRentalTypeColor(property.rentalType)
                )}
              >
                {property.rentalType}
              </span>
            )}
            
            {/* Círculos de iniciales: Property Manager y Analista de Rentals */}
            {property.propertyManager && (() => {
              const initials = generateInitials(property.propertyManager);
              return (
                <div
                  className="relative group"
                  title={`Property Manager: ${property.propertyManager}`}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "bg-blue-500 dark:bg-blue-600 text-white",
                      "text-xs font-semibold cursor-default",
                      "border-2 border-white dark:border-[var(--prophero-gray-800)]",
                      "shadow-sm hover:shadow-md transition-shadow"
                    )}
                  >
                    {initials || "?"}
                  </div>
                  {/* Tooltip */}
                  <div
                    className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                      "px-2 py-1 rounded-md text-xs font-medium",
                      "bg-[var(--prophero-gray-900)] dark:bg-[var(--prophero-gray-100)]",
                      "text-white dark:text-[var(--prophero-gray-900)]",
                      "opacity-0 group-hover:opacity-100 pointer-events-none",
                      "transition-opacity duration-200 z-10",
                      "whitespace-nowrap shadow-lg"
                    )}
                  >
                    Property Manager: {property.propertyManager}
                    <div
                      className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2",
                        "border-4 border-transparent border-t-[var(--prophero-gray-900)]",
                        "dark:border-t-[var(--prophero-gray-100)]"
                      )}
                    />
                  </div>
                </div>
              );
            })()}
            {property.rentalsAnalyst && (() => {
              const initials = generateInitials(property.rentalsAnalyst);
              return (
                <div
                  className="relative group"
                  title={`Analista de Rentals: ${property.rentalsAnalyst}`}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "bg-purple-500 dark:bg-purple-600 text-white",
                      "text-xs font-semibold cursor-default",
                      "border-2 border-white dark:border-[var(--prophero-gray-800)]",
                      "shadow-sm hover:shadow-md transition-shadow"
                    )}
                  >
                    {initials || "?"}
                  </div>
                  {/* Tooltip */}
                  <div
                    className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
                      "px-2 py-1 rounded-md text-xs font-medium",
                      "bg-[var(--prophero-gray-900)] dark:bg-[var(--prophero-gray-100)]",
                      "text-white dark:text-[var(--prophero-gray-900)]",
                      "opacity-0 group-hover:opacity-100 pointer-events-none",
                      "transition-opacity duration-200 z-10",
                      "whitespace-nowrap shadow-lg"
                    )}
                  >
                    Analista de Rentals: {property.rentalsAnalyst}
                    <div
                      className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2",
                        "border-4 border-transparent border-t-[var(--prophero-gray-900)]",
                        "dark:border-t-[var(--prophero-gray-100)]"
                      )}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

        {/* Dates and Days - Mostrar según la fase */}
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {/* Fase 1: Viviendas Prophero - Mostrar renoEndDate y propertyReadyDate */}
          {property.currentPhase === "Viviendas Prophero" && (
            <>
              {property.renoEndDate && (() => {
                const formattedDate = formatDate(property.renoEndDate);
                return formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>Fecha fin de Obra: {formattedDate}</span>
                  </div>
                );
              })()}
              {property.propertyReadyDate && (() => {
                const formattedDate = formatDate(property.propertyReadyDate);
                return formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>Fecha de vivienda lista: {formattedDate}</span>
                  </div>
                );
              })()}
            </>
          )}

          {/* Fase 2: Listo para Alquilar - Mostrar propertyReadyDate y daysToPublishRent */}
          {property.currentPhase === "Listo para Alquilar" && (
            <>
              {property.propertyReadyDate && (() => {
                const formattedDate = formatDate(property.propertyReadyDate);
                return formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>Fecha de vivienda lista: {formattedDate}</span>
                  </div>
                );
              })()}
              {property.daysToPublishRent !== undefined && (
                <p>
                  <span className="font-medium">Días para publicar:</span> {property.daysToPublishRent} días
                </p>
              )}
            </>
          )}


          {/* Otras fases - Mostrar campos originales (ocultos para Viviendas Prophero y Listo para Alquilar) */}
          {property.currentPhase !== "Viviendas Prophero" && 
           property.currentPhase !== "Listo para Alquilar" && (
            <>
              {property.writingDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>Fecha de escrituración: {formatDate(property.writingDate)}</span>
                </div>
              )}
              {property.visitDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>Visita est.: {formatDate(property.visitDate)}</span>
                </div>
              )}
              {property.daysToVisit !== undefined && (
                <p>
                  <span className="font-medium">Días para visitar:</span> {property.daysToVisit} días
                </p>
              )}
              {property.daysToStart !== undefined && (
                <p>
                  <span className="font-medium">Días Para empezar desde firma:</span> {property.daysToStart} días
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
