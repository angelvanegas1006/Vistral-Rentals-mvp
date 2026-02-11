"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FilterIcon } from "@/components/icons/filter-icon";
import { SearchIcon } from "@/components/icons/search-icon";

interface NavbarL1Props {
  title: string;
  searchPlaceholder?: string;
  filterCount?: number;
  showViewToggle?: boolean;
  viewMode?: "kanban" | "list";
  onViewModeChange?: (mode: "kanban" | "list") => void;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  /** Controlled search (used by leads page) */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filters?: Record<string, unknown>;
  onFiltersChange?: (filters: Record<string, unknown>) => void;
}

const searchInputClassName =
  "h-10 pl-12 pr-3 rounded-full border border-[#E4E4E7] bg-white text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] focus-visible:ring-2 focus-visible:ring-[#2050F6] focus-visible:ring-offset-2 py-[10px]";

export function NavbarL1({
  title,
  searchPlaceholder = "Buscar por ID, Calle o Precio",
  filterCount = 0,
  onSearch,
  onFilterClick,
  searchQuery: controlledSearchQuery,
  onSearchChange,
}: NavbarL1Props) {
  const [internalQuery, setInternalQuery] = useState("");
  const isControlled =
    controlledSearchQuery !== undefined && onSearchChange !== undefined;
  const searchQuery = isControlled ? controlledSearchQuery : internalQuery;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isControlled) {
      onSearchChange?.(value);
    } else {
      setInternalQuery(value);
      onSearch?.(value);
    }
  };

  return (
    <nav className="border-b bg-white px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-3 md:py-4">
      {/* Mobile Layout - same as RentalsKanbanHeader */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground flex-1 truncate">{title}</h1>
          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4E7] bg-white hover:bg-[#F5F5F5] transition-colors flex-shrink-0"
            aria-label="Filtrar propiedades"
          >
            <FilterIcon className="h-6 w-6 text-[#2050F6]" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vistral-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative w-full h-10">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-[#212121]" />
          </div>
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className={searchInputClassName}
          />
        </div>
      </div>

      {/* Desktop Layout - same as RentalsKanbanHeader (title | search | separator | filter), no view toggle */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground whitespace-nowrap">{title}</h1>
        </div>
        <div className="flex items-center gap-4" style={{ gap: "16px" }}>
          <div className="relative w-[320px] h-10">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-[#212121]" />
            </div>
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className={searchInputClassName}
            />
          </div>
          <div className="w-0 h-10 flex items-center">
            <div className="w-[1px] h-10 border-l border-[#E4E4E7]" />
          </div>
          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4E7] bg-white hover:bg-[#F5F5F5] transition-colors"
            aria-label="Filtrar propiedades"
          >
            <FilterIcon className="h-6 w-6 text-[#2050F6]" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vistral-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
