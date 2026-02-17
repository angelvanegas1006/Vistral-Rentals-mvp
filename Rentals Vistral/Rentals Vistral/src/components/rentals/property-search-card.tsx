"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertySummaryTab } from "@/components/rentals/property-summary-tab";
import { ExternalLink, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/96x96?text=Sin+imagen";

export interface PropertySearchCardProps {
  property: PropertyRow;
  onAdd: (propertyUniqueId: string) => Promise<void>;
  adding?: boolean;
  className?: string;
}

function getFirstImage(property: PropertyRow): string {
  const pics = property.pics_urls;
  if (!pics || !Array.isArray(pics)) return PLACEHOLDER_IMAGE;
  const first = pics.find(
    (url): url is string => typeof url === "string" && url.length > 0
  );
  return first || PLACEHOLDER_IMAGE;
}

export function PropertySearchCard({
  property,
  onAdd,
  adding = false,
  className,
}: PropertySearchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const imageUrl = getFirstImage(property);
  const address = property.address || "Dirección no disponible";
  const areaCluster = property.area_cluster || "";
  const price =
    property.announcement_price != null
      ? `${property.announcement_price} €/mes`
      : "";
  const bedrooms =
    property.bedrooms != null ? `${property.bedrooms} hab.` : "";
  const sqm =
    property.square_meters != null ? `${property.square_meters} m²` : "";
  const rentalType = property.rental_type || "";
  const infoLine = [areaCluster, price, bedrooms]
    .filter(Boolean)
    .join(" · ");
  const detailsLine = [sqm, rentalType].filter(Boolean).join(" · ");
  const currentPhase =
    property.current_stage || property.current_phase || "Publicado";

  return (
    <>
      <Card
        className={cn(
          "w-full max-w-full overflow-hidden",
          "rounded-[var(--vistral-radius-lg)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]",
          "bg-card shadow-[var(--vistral-shadow-sm)]",
          className
        )}
      >
        <div className="flex flex-row items-center gap-4 p-4 md:p-5">
          {/* Foto */}
          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-[var(--vistral-radius-lg)] overflow-hidden bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
            <img
              src={imageUrl}
              alt={`Propiedad ${address}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {address}
            </p>
            {infoLine && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {infoLine}
              </p>
            )}
            {detailsLine && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {detailsLine}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setModalOpen(true)}
              aria-label="Ver más detalles"
              title="Ver más detalles"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[var(--vistral-success)] hover:text-[var(--vistral-success-hover)] hover:bg-[var(--vistral-success)]/10"
              onClick={() => onAdd(property.property_unique_id)}
              disabled={adding}
              aria-label="Añadir propiedad"
              title="Añadir a Propiedades en gestión"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Property details modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
            <DialogTitle className="text-xl font-semibold">
              {address}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
            <PropertySummaryTab
              propertyId={property.property_unique_id}
              currentPhase={currentPhase}
              property={property}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
