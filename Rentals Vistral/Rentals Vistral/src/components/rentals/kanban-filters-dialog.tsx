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
import { Checkbox } from "@/components/ui/checkbox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { cn } from "@/lib/utils";

interface KanbanFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  propertyTypes?: string[];
  areaClusters?: string[];
  managers?: string[];
}

export function KanbanFiltersDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  propertyTypes = [],
  areaClusters = [],
  managers = [],
}: KanbanFiltersDialogProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({
    property_type: filters.property_type || [],
    area_cluster: filters.area_cluster || [],
    admin_name: filters.admin_name || [],
  });

  // Sincronizar filtros locales con los props
  useEffect(() => {
    setLocalFilters({
      property_type: Array.isArray(filters.property_type)
        ? filters.property_type
        : filters.property_type
        ? [filters.property_type]
        : [],
      area_cluster: Array.isArray(filters.area_cluster)
        ? filters.area_cluster
        : filters.area_cluster
        ? [filters.area_cluster]
        : [],
      admin_name: Array.isArray(filters.admin_name)
        ? filters.admin_name
        : filters.admin_name
        ? [filters.admin_name]
        : [],
    });
  }, [filters]);

  const handleFilterChange = (key: string, selected: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: selected,
    }));
  };

  const handleApply = () => {
    // Convertir arrays a formato que Supabase pueda usar
    const appliedFilters: Record<string, any> = {};
    
    if (localFilters.property_type.length > 0) {
      appliedFilters.property_type = localFilters.property_type;
    }
    if (localFilters.area_cluster.length > 0) {
      appliedFilters.area_cluster = localFilters.area_cluster;
    }
    if (localFilters.admin_name.length > 0) {
      appliedFilters.admin_name = localFilters.admin_name;
    }

    onFiltersChange(appliedFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const clearedFilters = {
      property_type: [],
      area_cluster: [],
      admin_name: [],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange({});
  };

  const activeFiltersCount =
    localFilters.property_type.length +
    localFilters.area_cluster.length +
    localFilters.admin_name.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto px-margin-xs sm:px-margin-sm md:px-margin-md py-4 sm:py-6"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-semibold text-center sm:text-left">
            Filtrar Propiedades
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 py-4">
          {/* Tipo de Propiedad - Checkbox List Horizontal */}
          <div className="space-y-3 md:space-y-4">
            <Label
              htmlFor="property-type"
              className="text-sm md:text-base font-semibold"
            >
              Tipo de propiedad
            </Label>
            {/* Opciones fijas: siempre mostrar todas las opciones posibles */}
            {(() => {
              const allPropertyTypes = ["Project", "New Build", "Building", "Unit", "WIP"];
              return (
                <div className="flex flex-wrap gap-3 border rounded-md p-3 bg-card">
                  {allPropertyTypes.map((type) => {
                    const isChecked = localFilters.property_type.includes(type);
                    return (
                      <div
                        key={type}
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => {
                          const newSelection = isChecked
                            ? localFilters.property_type.filter((t) => t !== type)
                            : [...localFilters.property_type, type];
                          handleFilterChange("property_type", newSelection);
                        }}
                      >
                        <Checkbox
                          id={`property-type-${type}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newSelection = checked
                              ? [...localFilters.property_type, type]
                              : localFilters.property_type.filter((t) => t !== type);
                            handleFilterChange("property_type", newSelection);
                          }}
                        />
                        <label
                          htmlFor={`property-type-${type}`}
                          className="text-xs md:text-sm font-medium cursor-pointer whitespace-nowrap"
                        >
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Area Cluster - MultiCombobox */}
          <div className="space-y-3 md:space-y-4">
            <Label
              htmlFor="area-cluster"
              className="text-sm md:text-base font-semibold"
            >
              Area Cluster
            </Label>
            {areaClusters.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground">
                No hay áreas disponibles
              </p>
            ) : (
              <MultiCombobox
                options={areaClusters}
                selected={localFilters.area_cluster}
                onSelectionChange={(selected) =>
                  handleFilterChange("area_cluster", selected)
                }
                placeholder="Buscar área..."
                emptyMessage="No se encontraron áreas"
              />
            )}
          </div>

          {/* Manager - MultiCombobox */}
          <div className="space-y-3 md:space-y-4">
            <Label
              htmlFor="manager"
              className="text-sm md:text-base font-semibold"
            >
              Property Manager
            </Label>
            {managers.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground">
                No hay managers disponibles
              </p>
            ) : (
              <MultiCombobox
                options={managers}
                selected={localFilters.admin_name}
                onSelectionChange={(selected) =>
                  handleFilterChange("admin_name", selected)
                }
                placeholder="Buscar manager..."
                emptyMessage="No se encontraron managers"
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full sm:w-auto"
            disabled={activeFiltersCount === 0}
          >
            Limpiar todos
          </Button>
          <Button onClick={handleApply} className="w-full sm:w-auto">
            Aplicar filtros ({activeFiltersCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
