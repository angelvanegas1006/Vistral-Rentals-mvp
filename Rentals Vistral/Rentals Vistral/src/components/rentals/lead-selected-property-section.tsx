"use client";

import { useState } from "react";
import { Phase2SectionWidget } from "@/components/rentals/phase2-section-widget";
import { LeadPropertyCard } from "@/components/rentals/lead-property-card";
import { LeadPropertyCardWorkSection } from "@/components/rentals/lead-property-card-work-section";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyItem {
  leadsProperty: LeadsPropertyRow;
  property: PropertyRow;
}

export interface LeadSelectedPropertySectionProps {
  selectedItem: PropertyItem | null;
  recogiendoItems: PropertyItem[];
  loading?: boolean;
  onSelectProperty: (lpId: string) => void;
  onTransition?: (
    lpId: string,
    newStatus: string,
    action: "advance" | "undo" | "revive",
    updates: Record<string, unknown>
  ) => Promise<{ completed: boolean } | void>;
  onRefetch?: () => void;
  onDescartar?: (lpId: string, address: string) => void;
  onRegistroActividad?: (leadsProperty: LeadsPropertyRow, address: string) => void;
}

export function LeadSelectedPropertySection({
  selectedItem,
  recogiendoItems,
  loading = false,
  onSelectProperty,
  onTransition,
  onRefetch,
  onDescartar,
  onRegistroActividad,
}: LeadSelectedPropertySectionProps) {
  const [showGrid, setShowGrid] = useState(false);
  const hasMultiple = recogiendoItems.length > 1;
  const isComplete = !!selectedItem;

  return (
    <Phase2SectionWidget
      id="selected-property"
      title="Propiedad Seleccionada"
      instructions="Vivienda sobre la que se realizará el estudio de solvencia."
      required
      isComplete={isComplete}
      alwaysExpanded
    >
      {selectedItem ? (
        <div className="space-y-3">
          <LeadPropertyCard
            leadsProperty={selectedItem.leadsProperty}
            property={selectedItem.property}
            workSection={
              <div className="flex items-center gap-3 rounded-[var(--vistral-radius-md)] bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)] px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Esta propiedad está seleccionada para el estudio de solvencia.
                </p>
              </div>
            }
            onDescartar={
              onDescartar
                ? () =>
                    onDescartar(
                      selectedItem.leadsProperty.id,
                      selectedItem.property.address || "Propiedad"
                    )
                : undefined
            }
            onRegistroActividad={
              onRegistroActividad
                ? () =>
                    onRegistroActividad(
                      selectedItem.leadsProperty,
                      selectedItem.property.address || "Propiedad"
                    )
                : undefined
            }
          />

          {hasMultiple && !showGrid && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowGrid(true)}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Cambiar propiedad seleccionada
            </Button>
          )}

          {hasMultiple && showGrid && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Selecciona otra propiedad:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {recogiendoItems
                  .filter((i) => i.leadsProperty.id !== selectedItem.leadsProperty.id)
                  .map((item) => (
                    <button
                      key={item.leadsProperty.id}
                      type="button"
                      onClick={() => {
                        onSelectProperty(item.leadsProperty.id);
                        setShowGrid(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--vistral-radius-md)] border",
                        "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]",
                        "bg-card p-3 text-left transition-colors",
                        "hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)]">
                        <img
                          src={getFirstImage(item.property)}
                          alt={item.property.address || "Propiedad"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.property.address || "Dirección no disponible"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            item.property.area_cluster,
                            item.property.announcement_price != null
                              ? `${item.property.announcement_price} €/mes`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setShowGrid(false)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="animate-pulse space-y-3">
          <div className="rounded-[var(--vistral-radius-md)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-800)]" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--vistral-radius-md)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay propiedad en estado Recogiendo Información.
          </p>
        </div>
      )}
    </Phase2SectionWidget>
  );
}

function getFirstImage(property: PropertyRow): string {
  const pics = property.pics_urls;
  if (!pics || !Array.isArray(pics)) return "https://via.placeholder.com/96x96?text=Sin+imagen";
  const first = pics.find((url): url is string => typeof url === "string" && url.length > 0);
  return first || "https://via.placeholder.com/96x96?text=Sin+imagen";
}
