"use client";

import { cn } from "@/lib/utils";
import { SupplyPropertyCard } from "./supply-property-card";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Property } from "@/lib/supply-property-storage";
import { SupplyKanbanPhase } from "@/lib/supply-kanban-config";

interface SupplyKanbanColumnProps {
  title: string;
  count: number;
  stage: SupplyKanbanPhase;
  properties: Property[];
  onCardClick?: (id: string, stage: SupplyKanbanPhase, isReal?: boolean) => void;
  highlightedPropertyId?: string | null;
  onColumnRef?: (element: HTMLDivElement | null) => void;
  isLoading?: boolean;
}

export function SupplyKanbanColumn({ 
  title, 
  count, 
  stage, 
  properties, 
  onCardClick, 
  highlightedPropertyId, 
  onColumnRef,
  isLoading = false 
}: SupplyKanbanColumnProps) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const hasHighlightedProperty = highlightedPropertyId && properties.some(p => p.id === highlightedPropertyId);
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
      className="flex h-full md:h-auto flex-col min-w-[320px] md:min-w-[320px] w-full md:w-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header */}
      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:pointer-events-none flex w-full md:w-auto items-center justify-between md:justify-start gap-2 hover:bg-[var(--prophero-gray-100)] dark:hover:bg-[var(--prophero-gray-800)] rounded-md px-2 py-1 -mx-2 md:mx-0 md:hover:bg-transparent transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {count}
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
                  className="rounded-lg border border-border bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)] p-4 shadow-sm w-full animate-pulse"
                >
                  <div className="h-3 w-16 bg-[var(--prophero-gray-300)] dark:bg-[var(--prophero-gray-700)] rounded mb-2" />
                  <div className="h-4 w-full bg-[var(--prophero-gray-300)] dark:bg-[var(--prophero-gray-700)] rounded mb-3" />
                  <div className="h-3 w-24 bg-[var(--prophero-gray-300)] dark:bg-[var(--prophero-gray-700)] rounded" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            // Empty state - card style like in the image
            <div className="rounded-lg border border-border bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-900)] p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t.kanban.noPropertiesFound}
              </p>
            </div>
          ) : (
            properties.map((property) => (
              <SupplyPropertyCard
                key={property.id}
                id={property.id}
                address={property.fullAddress || property.address || "Sin dirección"}
                stage={stage}
                price={property.price}
                analyst={property.analyst}
                completion={property.completion}
                correctionsCount={property.correctionsCount}
                timeInStage={property.timeInStage || "0 días"}
                timeCreated={property.timeCreated || "0 días"}
                onClick={() => onCardClick?.(property.id, stage, true)}
                disabled={false}
                isHighlighted={highlightedPropertyId === property.id}
                tags={property.tags}
                totalInvestment={property.totalInvestment}
                rejectionReasons={property.rejectionReasons}
                assignedTo={property.assignedTo}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
