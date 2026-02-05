"use client";

import { useState, useMemo } from "react";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { RentalsKanbanHeader } from "@/components/rentals/rentals-kanban-header";
import { RentalsKanbanBoard } from "@/components/rentals/rentals-kanban-board";
import { KanbanFiltersDialog } from "@/components/rentals/kanban-filters-dialog";
import { useProperties } from "@/hooks/use-properties";
import { useI18n } from "@/hooks/use-i18n";

export default function RentalsKanbanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const { t } = useI18n();

  const handleFilterClick = () => {
    setIsFilterDialogOpen(true);
  };

  // Calcular número de filtros activos
  const filterCount = useMemo(() => {
    return Object.keys(filters).filter(
      (key) => filters[key] !== undefined && filters[key] !== null
    ).length;
  }, [filters]);

  // Cargar TODAS las propiedades para obtener opciones de filtro (sin filtros aplicados)
  const { properties: allProperties } = useProperties({ 
    kanbanType: "captacion",
    // No pasar searchQuery ni filters para obtener todas las opciones
  });

  // Obtener valores únicos para cada filtro - asegurar que no hay duplicados ni nulls
  const propertyTypes = useMemo(() => {
    const types = allProperties
      .map((p) => p.property_asset_type)
      .filter((type): type is string => Boolean(type) && typeof type === "string");
    // Usar Set para eliminar duplicados y ordenar
    return Array.from(new Set(types)).sort();
  }, [allProperties]);


  const areaClusters = useMemo(() => {
    const clusters = allProperties
      .map((p) => (p as any).area_cluster)
      .filter((cluster): cluster is string => Boolean(cluster) && typeof cluster === "string");
    return Array.from(new Set(clusters)).sort();
  }, [allProperties]);

  const managers = useMemo(() => {
    const managerNames = allProperties
      .map((p) => (p as any).admin_name)
      .filter((manager): manager is string => Boolean(manager) && typeof manager === "string");
    return Array.from(new Set(managerNames)).sort();
  }, [allProperties]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <RentalsSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RentalsKanbanHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFilterClick={handleFilterClick}
          filterCount={filterCount}
          title="Captación y Cierre"
        />

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-950)]">
          <RentalsKanbanBoard searchQuery={searchQuery} filters={filters} loading={false} />
        </div>
      </div>

      {/* Filter Dialog */}
      <KanbanFiltersDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onFiltersChange={setFilters}
        propertyTypes={propertyTypes}
        areaClusters={areaClusters}
        managers={managers}
      />
    </div>
  );
}
