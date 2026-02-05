"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

interface NavbarL1Props {
  title: string;
  searchPlaceholder?: string;
  filterCount?: number;
  showViewToggle?: boolean;
  viewMode?: "kanban" | "list";
  onViewModeChange?: (mode: "kanban" | "list") => void;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
}

export function NavbarL1({
  title,
  searchPlaceholder = "Buscar...",
  filterCount = 0,
  showViewToggle = true,
  viewMode = "kanban",
  onViewModeChange,
  onSearch,
  onFilterClick,
}: NavbarL1Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useI18n();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <nav className="border-b bg-card px-margin-xs sm:px-margin-sm md:px-margin-md lg:px-margin-lg xl:px-margin-xl 2xl:px-margin-xxl py-3 md:py-3 relative">
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden gap-3">
        {/* Título */}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        
        {/* Fila de búsqueda y filtros */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-background border-input rounded-full w-full min-w-0"
            />
          </div>

          {/* Filters */}
          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vistral-gray-100)] dark:bg-[#1a1a1a] hover:bg-[var(--vistral-gray-200)] dark:hover:bg-[#262626] transition-colors flex-shrink-0"
            aria-label="Filtrar propiedades"
          >
            <Filter className="h-4 w-4 text-foreground" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vistral-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-1 bg-accent dark:bg-[var(--vistral-gray-800)] rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => onViewModeChange?.("kanban")}
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                  viewMode === "kanban"
                    ? "bg-[var(--vistral-blue-500)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-3 w-3" />
                <span className="hidden sm:inline">{t("viewKanban")}</span>
              </button>
              <button
                onClick={() => onViewModeChange?.("list")}
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                  viewMode === "list"
                    ? "bg-[var(--vistral-blue-500)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <List className="h-3 w-3" />
                <span className="hidden sm:inline">{t("viewList")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Título */}
        <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">{title}</h1>
        
        {/* Controles */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl ml-auto min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-0 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-background border-input rounded-full w-full min-w-0"
            />
          </div>

          {/* Filters */}
          <button
            onClick={onFilterClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vistral-gray-100)] dark:bg-[#1a1a1a] hover:bg-[var(--vistral-gray-200)] dark:hover:bg-[#262626] transition-colors flex-shrink-0"
            aria-label="Filtrar propiedades"
          >
            <Filter className="h-4 w-4 text-foreground" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vistral-blue-600)] text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-1 bg-accent dark:bg-[var(--vistral-gray-800)] rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => onViewModeChange?.("kanban")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  viewMode === "kanban"
                    ? "bg-[var(--vistral-blue-500)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>{t("viewKanban")}</span>
              </button>
              <button
                onClick={() => onViewModeChange?.("list")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  viewMode === "list"
                    ? "bg-[var(--vistral-blue-500)] text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
                <span>{t("viewList")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
