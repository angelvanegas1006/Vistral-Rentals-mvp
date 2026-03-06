"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { NavbarL1 } from "@/components/layout/navbar-l1";
import { RentalsLeadsKanbanBoard } from "@/components/rentals/rentals-leads-kanban-board";
import { LeadsFiltersDialog } from "@/components/rentals/leads-filters-dialog";
import { useI18n } from "@/hooks/use-i18n";

const STORAGE_KEY = "leads_kanban_state";

function loadPersistedState(): { searchQuery: string; filters: Record<string, any> } {
  if (typeof window === "undefined") return { searchQuery: "", filters: {} };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { searchQuery: "", filters: {} };
}

export default function LeadsKanbanPage() {
  const [searchQuery, setSearchQuery] = useState(() => loadPersistedState().searchQuery);
  const [filters, setFilters] = useState<Record<string, any>>(() => loadPersistedState().filters);
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchQuery, filters }));
  }, [searchQuery, filters]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.mtp_property_query) count++;
    if (filters.mtp_status_type && filters.mtp_status_type !== "all") count++;
    return count;
  }, [filters]);

  return (
    <div className="flex h-screen overflow-hidden">
      <RentalsSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <NavbarL1
          title={t("nav.leads")}
          searchPlaceholder="Buscar por nombre o ID de interesado"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          filterCount={filterCount}
          onFilterClick={() => setFiltersDialogOpen(true)}
        />
        <div className="flex-1 overflow-y-auto bg-[var(--vistral-gray-50)] dark:bg-[#000000] px-4 sm:px-5 md:px-6 lg:px-8 py-4 md:py-6">
          <RentalsLeadsKanbanBoard
            searchQuery={searchQuery}
            filters={filters}
            loading={loading}
          />
        </div>
      </div>

      <LeadsFiltersDialog
        open={filtersDialogOpen}
        onOpenChange={setFiltersDialogOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
