"use client";

import { SearchInput } from "@vistral/design-system";
import { FilterIcon } from "@/components/icons/filter-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { useI18n } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KanbanView = "partner" | "analyst" | "reno";

interface SupplyKanbanHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddProperty?: () => void;
  selectedKanbanView?: KanbanView;
  onKanbanViewChange?: (view: KanbanView) => void;
}

export function SupplyKanbanHeader({ 
  searchQuery, 
  setSearchQuery, 
  onAddProperty,
  selectedKanbanView,
  onKanbanViewChange 
}: SupplyKanbanHeaderProps) {
  const { t } = useI18n();

  const kanbanViewLabels: Record<KanbanView, string> = {
    partner: "Partner Kanban",
    analyst: "Analyst Kanban",
    reno: "Reno Kanban",
  };

  return (
    <header className="border-b bg-card dark:bg-[var(--prophero-gray-900)] px-3 md:px-6 py-3 md:py-4">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Top row: Title, Kanban selector (for admins), Filter */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground flex-1 truncate">{t.nav.kanban}</h1>
          {selectedKanbanView !== undefined && onKanbanViewChange && (
            <Select value={selectedKanbanView} onValueChange={(value) => onKanbanViewChange(value as KanbanView)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">{kanbanViewLabels.partner}</SelectItem>
                <SelectItem value="analyst">{kanbanViewLabels.analyst}</SelectItem>
                <SelectItem value="reno">{kanbanViewLabels.reno}</SelectItem>
              </SelectContent>
            </Select>
          )}

          <button
            onClick={() => {
              console.log("Filter - Coming soon");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9E7FF] hover:bg-[#C5D9FF] transition-colors flex-shrink-0"
            aria-label={t.kanban.filterProperties}
          >
            <FilterIcon className="h-6 w-6 text-[#162EB7]" />
          </button>
        </div>

        {/* Search Bar - Using Design System SearchInput */}
        <div className="w-full">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t.kanban.searchPlaceholder}
            size="md"
            rounded={true}
            clearable={true}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Left section: Title and Kanban selector (for admins) */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">Gestión de la propiedad</h1>
          {selectedKanbanView !== undefined && onKanbanViewChange && (
            <Select value={selectedKanbanView} onValueChange={(value) => onKanbanViewChange(value as KanbanView)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">{kanbanViewLabels.partner}</SelectItem>
                <SelectItem value="analyst">{kanbanViewLabels.analyst}</SelectItem>
                <SelectItem value="reno">{kanbanViewLabels.reno}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Right section: Search, Filter, Add */}
        <div className="flex items-center gap-4" style={{ gap: '16px' }}>
          {/* Search Bar - Using Design System SearchInput */}
          <div className="w-[320px]">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t.kanban.searchPlaceholder}
              size="md"
              rounded={true}
              clearable={true}
            />
          </div>

          {/* Separator */}
          <div className="w-0 h-10 flex items-center">
            <div className="w-[1px] h-10 border-l border-[#E4E4E7]" />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => {
              console.log("Filter - Coming soon");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9E7FF] hover:bg-[#C5D9FF] transition-colors"
            aria-label={t.kanban.filterProperties}
          >
            <FilterIcon className="h-6 w-6 text-[#162EB7]" />
          </button>

          {/* Add Property Button */}
          <button
            onClick={onAddProperty}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#2050F6] hover:bg-[#1a40cc] text-white font-medium text-sm transition-colors whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4 text-white flex-shrink-0" />
            <span>{t.kanban.addProperty}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
