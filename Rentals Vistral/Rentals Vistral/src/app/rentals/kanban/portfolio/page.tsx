"use client";

import { useState, useMemo } from "react";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { NavbarL1 } from "@/components/layout/navbar-l1";
import { RentalsKanbanBoard } from "@/components/rentals/rentals-kanban-board";
import { KanbanFiltersDialog } from "@/components/rentals/kanban-filters-dialog";
import { useProperties } from "@/hooks/use-properties";
import { useI18n } from "@/hooks/use-i18n";

export default function PortfolioKanbanPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const { t } = useI18n();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
    kanbanType: "portfolio",
    // No pasar searchQuery ni filters para obtener todas las opciones
  });

  // Obtener valores únicos para cada filtro - asegurar que no hay duplicados ni nulls
  const propertyTypes = useMemo(() => {
    const types = allProperties
      .map((p) => p.property_asset_type)
      .filter((type): type is string => Boolean(type) && typeof type === "string");
    return Array.from(new Set(types)).sort();
  }, [allProperties]);


  const areaClusters = useMemo(() => {
    const clusters = allProperties
      .map((p) => (p as any).area_cluster)
      .filter((cluster): cluster is string => Boolean(cluster) && typeof cluster === "string");
    return Array.from(new Set(clusters)).sort();
  }, [allProperties]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <RentalsSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <NavbarL1
          title="Gestión De Cartera"
          searchPlaceholder="Buscar por ID, Calle o Precio"
          filterCount={filterCount}
          showViewToggle={true}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSearch={handleSearch}
          onFilterClick={handleFilterClick}
        />

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
          {viewMode === "kanban" ? (
            <RentalsKanbanBoard 
              searchQuery={searchQuery} 
              filters={filters} 
              loading={false}
              kanbanType="portfolio"
            />
          ) : (
            <div className="px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-4 md:py-6">
              <p className="text-muted-foreground">
                Vista de lista - Próximamente
              </p>
            </div>
          )}
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
      />
    </div>
  );
}
