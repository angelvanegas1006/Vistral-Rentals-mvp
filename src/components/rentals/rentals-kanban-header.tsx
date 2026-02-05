"use client";

import { Input } from "@/components/ui/input";
import { FilterIcon } from "@/components/icons/filter-icon";
import { SearchIcon } from "@/components/icons/search-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { useI18n } from "@/hooks/use-i18n";

interface RentalsKanbanHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddProperty?: () => void;
  onFilterClick?: () => void;
  filterCount?: number;
  title?: string;
}

export function RentalsKanbanHeader({ 
  searchQuery, 
  setSearchQuery, 
  onAddProperty,
  onFilterClick,
  filterCount = 0,
  title = "Captación y Cierre",
}: RentalsKanbanHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="border-b bg-white px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-3 md:py-4">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Top row: Title, Filter */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#212121] flex-1 truncate">{title}</h1>

          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4E7] bg-white hover:bg-[#F5F5F5] transition-colors flex-shrink-0"
            aria-label="Filtrar propiedades"
          >
            <FilterIcon className="h-6 w-6 text-[#2050F6]" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--prophero-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full h-10">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-[#212121]" />
          </div>
          <Input
            type="text"
            placeholder="Buscar por ID, Calle o Precio"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-12 pr-3 rounded-full border border-[#E4E4E7] bg-white text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] focus-visible:ring-2 focus-visible:ring-[#2050F6] focus-visible:ring-offset-2 py-[10px]"
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Left section: Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#212121] whitespace-nowrap">{title}</h1>
        </div>

        {/* Right section: Search, Filter, Add */}
        <div className="flex items-center gap-4" style={{ gap: '16px' }}>
          {/* Search Bar */}
          <div className="relative w-[320px] h-10">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-[#212121]" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por ID, Calle o Precio"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-12 pr-3 rounded-full border border-[#E4E4E7] bg-white text-[16px] leading-[24px] tracking-[-0.7px] placeholder:text-[#A1A1AA] text-[#212121] focus-visible:ring-2 focus-visible:ring-[#2050F6] focus-visible:ring-offset-2 py-[10px]"
            />
          </div>

          {/* Separator */}
          <div className="w-0 h-10 flex items-center">
            <div className="w-[1px] h-10 border-l border-[#E4E4E7]" />
          </div>

          {/* Filter Button */}
          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4E7] bg-white hover:bg-[#F5F5F5] transition-colors"
            aria-label="Filtrar propiedades"
          >
            <FilterIcon className="h-6 w-6 text-[#2050F6]" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--prophero-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>

          {/* Add Property Button */}
          {onAddProperty && (
            <button
              onClick={onAddProperty}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#2050F6] hover:bg-[#1a40cc] text-white font-medium text-sm transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-4 w-4 text-white flex-shrink-0" />
              <span>Agregar Propiedad</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
