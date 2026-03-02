"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { RentalsPropertyCard } from "./rentals-property-card";
import type { PropheroSectionReviews } from "@/lib/supabase/types";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  region?: string;
  daysInPhase: number;
  currentPhase: string;
  isExpired?: boolean;
  needsUpdate?: boolean;
  isHighlighted?: boolean;
  propertyType?: "Project" | "New Build" | "Building" | "Unit" | "WIP";
  writingDate?: string;
  visitDate?: string;
  daysToVisit?: number;
  daysToStart?: number;
  renoEndDate?: string; // Fecha de fin de renovación
  propertyReadyDate?: string; // Fecha en que la propiedad está lista
  daysToPublishRent?: number; // Días para publicar el alquiler
  propheroSectionReviews?: PropheroSectionReviews | null; // Estado de revisión de Prophero
}

interface RentalsKanbanColumnProps {
  id: string;
  title: string;
  properties: Property[];
  onCardClick: (propertyId: string) => void;
  index?: number;
  className?: string;
  searchQuery?: string;
  highlightedPropertyId?: string | null;
  onColumnRef?: (element: HTMLDivElement | null) => void;
  isLoading?: boolean;
}

export function RentalsKanbanColumn({
  id,
  title,
  properties,
  onCardClick,
  index,
  className,
  searchQuery = "",
  highlightedPropertyId,
  onColumnRef,
  isLoading = false,
}: RentalsKanbanColumnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const hasHighlightedProperty = highlightedPropertyId && properties.some(p => p.property_unique_id === highlightedPropertyId);
  const [isCollapsed, setIsCollapsed] = useState(!hasHighlightedProperty);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const hasScroll = scrollContainerRef.current.scrollHeight > scrollContainerRef.current.clientHeight;
        setNeedsScroll(hasScroll);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [properties]);

  useEffect(() => {
    if (hasHighlightedProperty && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [hasHighlightedProperty, isCollapsed]);

  return (
    <div
      ref={onColumnRef}
      className={cn(
        "flex h-full md:h-auto flex-col min-w-[320px] md:min-w-[320px] w-full md:w-auto pt-[7px] pb-[7px]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header */}
      <div className="mb-[7px] flex-shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:pointer-events-none flex w-full md:w-auto items-center justify-between md:justify-start gap-2 hover:bg-[var(--vistral-gray-100)] dark:hover:bg-[var(--vistral-gray-800)] rounded-md px-2 py-1 -mx-2 md:mx-0 md:hover:bg-transparent transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {properties.length}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground md:hidden" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground md:hidden" />
          )}
        </button>
      </div>

      {/* Column Content */}
      <div className={cn(
        "flex-1 min-h-0",
        "md:block",
        isCollapsed ? "hidden md:block" : "block"
      )}>
        <div
          ref={scrollContainerRef}
          className={cn(
            "md:h-full max-h-[600px] md:max-h-none overflow-y-auto space-y-3 w-full",
            isHovered && needsScroll ? "scrollbar-overlay" : "scrollbar-hidden"
          )}
        >
          {isLoading ? (
            // Loading skeleton - gray boxes
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] p-5 md:p-6 shadow-sm w-full animate-pulse"
                >
                  <div className="h-3 w-16 bg-[var(--vistral-gray-300)] dark:bg-[var(--vistral-gray-700)] rounded mb-2" />
                  <div className="h-4 w-full bg-[var(--vistral-gray-300)] dark:bg-[var(--vistral-gray-700)] rounded mb-3" />
                  <div className="h-3 w-24 bg-[var(--vistral-gray-300)] dark:bg-[var(--vistral-gray-700)] rounded" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            // Empty state - card style like in the image
            <div className="rounded-lg border border-border bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-5 md:p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay propiedades en este estado
              </p>
            </div>
          ) : (
            properties.map((property) => (
              <RentalsPropertyCard
                key={property.property_unique_id}
                property={property}
                onClick={() => onCardClick(property.property_unique_id)}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
