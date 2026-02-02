"use client";

import { useState } from "react";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { NavbarL1 } from "@/components/layout/navbar-l1";
import { RentalsLeadsKanbanBoard } from "@/components/rentals/rentals-leads-kanban-board";
import { useI18n } from "@/hooks/use-i18n";

export default function LeadsKanbanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex h-screen overflow-hidden">
      <RentalsSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <NavbarL1
          title={t("nav.leads")}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto bg-[var(--prophero-gray-50)] dark:bg-[#000000] px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-4 md:py-6">
          <RentalsLeadsKanbanBoard
            searchQuery={searchQuery}
            filters={filters}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
