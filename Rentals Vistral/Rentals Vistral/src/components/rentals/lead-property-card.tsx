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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertySummaryTab } from "@/components/rentals/property-summary-tab";
import { ExternalLink, ChevronDown, MoreVertical, Eye, History, Calendar, Pause, Trash2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MTP_STATUS_TITLES, type MtpStatusId } from "@/lib/leads/mtp-status";
import type { Database } from "@/lib/supabase/types";

const MTP_STATUS_BADGE_CLASSES: Record<MtpStatusId, string> = {
  interesado_cualificado:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  visita_agendada:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  pendiente_de_evaluacion:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  esperando_decision:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
  recogiendo_informacion:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  calificacion_en_curso:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  interesado_presentado:
    "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300",
  interesado_aceptado:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  en_espera:
    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  descartada:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  no_disponible:
    "border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/96x96?text=Sin+imagen";

export interface LeadPropertyCardProps {
  leadsProperty: LeadsPropertyRow;
  property: PropertyRow;
  workSection: React.ReactNode;
  className?: string;
  onUndo?: () => void;
  onReagendar?: () => void;
  onPausar?: () => void;
  onDescartar?: () => void;
  onRegistroActividad?: () => void;
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
  onUndo,
  onReagendar,
  onPausar,
  onDescartar,
  onRegistroActividad,
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

  const status = leadsProperty.current_status ?? "interesado_cualificado";
  const statusLabel = MTP_STATUS_TITLES[status as keyof typeof MTP_STATUS_TITLES] ?? status;
  const showReagendar =
    (status === "visita_agendada" || status === "pendiente_de_evaluacion") &&
    onReagendar;

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

          {/* 1.3 Status Badge (centered between info and kebab) */}
          <div className="flex-1 flex items-center justify-center">
            <span
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium text-center whitespace-nowrap",
                MTP_STATUS_BADGE_CLASSES[status as MtpStatusId] ??
                  "border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] text-foreground"
              )}
            >
              {statusLabel}
            </span>
          </div>

          {/* 1.4 Kebab Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                aria-label="Menú de acciones"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setModalOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles de propiedad
              </DropdownMenuItem>
              {onRegistroActividad && (
                <DropdownMenuItem onClick={onRegistroActividad}>
                  <History className="mr-2 h-4 w-4" />
                  Registro de Actividad
                </DropdownMenuItem>
              )}
              {showReagendar && (
                <DropdownMenuItem onClick={onReagendar}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reagendar Visita
                </DropdownMenuItem>
              )}
              {onPausar && (
                <DropdownMenuItem onClick={onPausar}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar (Poner en Espera)
                </DropdownMenuItem>
              )}
              {onDescartar && (
                <DropdownMenuItem onClick={onDescartar} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Descartar Propiedad
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Banner Undo: Anterior: [Estado] */}
        {leadsProperty.previous_status && onUndo && (
          <div className="flex items-center justify-between gap-2 px-4 md:px-5 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/50">
            <span className="text-sm text-amber-800 dark:text-amber-200">
              Anterior:{" "}
              <strong>
                {MTP_STATUS_TITLES[leadsProperty.previous_status as keyof typeof MTP_STATUS_TITLES] ?? leadsProperty.previous_status}
              </strong>
            </span>
            <Button variant="ghost" size="sm" onClick={onUndo} className="text-amber-800 dark:text-amber-200">
              <Undo2 className="mr-1 h-4 w-4" />
              Deshacer
            </Button>
          </div>
        )}

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
