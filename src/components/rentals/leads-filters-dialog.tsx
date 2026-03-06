"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/components/icons/search-icon";

type MtpStatusType = "all" | "active" | "inactive";

interface LeadsFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const STATUS_OPTIONS: { value: MtpStatusType; label: string; description: string }[] = [
  { value: "all", label: "Todos", description: "Cualquier estado" },
  { value: "active", label: "Activos", description: "En proceso de gestión" },
  { value: "inactive", label: "Inactivos", description: "Descartada, En Espera, No Disponible o Rechazado" },
];

export function LeadsFiltersDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: LeadsFiltersDialogProps) {
  const [propertyQuery, setPropertyQuery] = useState(
    (filters.mtp_property_query as string) || ""
  );
  const [mtpStatusType, setMtpStatusType] = useState<MtpStatusType>(
    (filters.mtp_status_type as MtpStatusType) || "all"
  );

  useEffect(() => {
    setPropertyQuery((filters.mtp_property_query as string) || "");
    setMtpStatusType((filters.mtp_status_type as MtpStatusType) || "all");
  }, [filters]);

  const handleApply = () => {
    const appliedFilters: Record<string, any> = {};

    const trimmed = propertyQuery.trim();
    if (trimmed) {
      appliedFilters.mtp_property_query = trimmed;
    }
    if (trimmed && mtpStatusType !== "all") {
      appliedFilters.mtp_status_type = mtpStatusType;
    }

    onFiltersChange(appliedFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setPropertyQuery("");
    setMtpStatusType("all");
    onFiltersChange({});
  };

  const hasFilters = propertyQuery.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto px-margin-xs sm:px-margin-sm md:px-margin-md py-4 sm:py-6"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-semibold text-center sm:text-left">
            Filtrar Interesados por Propiedad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label className="text-sm md:text-base font-semibold">
              Propiedad
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Busca por dirección o ID para ver los candidatos asociados a una vivienda.
            </p>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Ej: Calle Alcalá 100 o PROP-006"
                value={propertyQuery}
                onChange={(e) => setPropertyQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm md:text-base font-semibold">
              Estado de la vinculación
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Filtra según la situación actual del interesado con esta vivienda.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = mtpStatusType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMtpStatusType(option.value)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                      isSelected
                        ? "border-[var(--vistral-primary-default-bg)] bg-[var(--vistral-primary-default-bg)]/5 ring-1 ring-[var(--vistral-primary-default-bg)]"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-[var(--vistral-primary-default-bg)]" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full"
            disabled={!hasFilters && mtpStatusType === "all"}
          >
            Limpiar filtros
          </Button>
          <Button onClick={handleApply} className="w-full">
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
