"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertySummaryTab } from "@/components/rentals/property-summary-tab";
import { ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/96x96?text=Sin+imagen";

export interface LeadPropertyCardProps {
  leadsProperty: LeadsPropertyRow;
  property: PropertyRow;
  workSection: React.ReactNode;
  className?: string;
}

function getFirstImage(property: PropertyRow): string {
  const pics = property.pics_urls;
  if (!pics || !Array.isArray(pics)) return PLACEHOLDER_IMAGE;
  const first = pics.find((url): url is string => typeof url === "string" && url.length > 0);
  return first || PLACEHOLDER_IMAGE;
}

export function LeadPropertyCard({
  leadsProperty,
  property,
  workSection,
  className,
}: LeadPropertyCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(true);
  const imageUrl = getFirstImage(property);
  const address = property.address || "Dirección no disponible";
  const areaCluster = property.area_cluster || "";
  const price = property.announcement_price != null ? `${property.announcement_price} €/mes` : "";
  const bedrooms = property.bedrooms != null ? `${property.bedrooms} hab.` : "";
  const infoLine2 = [areaCluster, price, bedrooms].filter(Boolean).join(" · ");
  const currentPhase = property.current_stage || property.current_phase || "Publicado";

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
        {/* Header horizontal */}
        <div className="flex flex-row items-center gap-4 p-4 md:p-5 border-b border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
          {/* 1.1 Foto */}
          <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-[var(--vistral-radius-lg)] overflow-hidden bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
            <img
              src={imageUrl}
              alt={`Propiedad ${address}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
            />
          </div>

          {/* 1.2 Información */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {address}
            </p>
            {infoLine2 && (
              <p className="text-sm text-muted-foreground mt-1">
                {infoLine2}
              </p>
            )}
          </div>

          {/* 1.3 Botón Ver más detalles */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => setModalOpen(true)}
            aria-label="Ver más detalles"
            title="Ver más detalles"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>

        {/* Toggle de sección de trabajo */}
        <button
          type="button"
          onClick={() => setWorkOpen((prev) => !prev)}
          className="w-full flex items-center px-4 md:px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-[var(--vistral-gray-50)] dark:hover:bg-[var(--vistral-gray-900)] transition-colors cursor-pointer"
          aria-expanded={workOpen}
        >
          {!workOpen && <span className="flex-1 text-center">Ver campos</span>}
          {workOpen && <span className="flex-1" />}
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-transform duration-200",
              workOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Sección de trabajo colapsable */}
        {workOpen && (
          <CardContent className="p-4 md:p-5 pt-2">
            {workSection}
          </CardContent>
        )}
      </Card>

      {/* Modal con PropertySummaryTab */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)]">
            <DialogTitle className="text-xl font-semibold">{address}</DialogTitle>
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
