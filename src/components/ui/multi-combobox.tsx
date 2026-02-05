"use client";

import * as React from "react";
import { Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MultiComboboxProps {
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiCombobox({
  options,
  selected,
  onSelectionChange,
  placeholder = "Buscar y seleccionar...",
  emptyMessage = "No hay opciones disponibles",
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filtrar opciones según búsqueda
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Manejar selección/deselección
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((s) => s !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Manejar teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          toggleOption(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Reset highlighted index cuando cambian las opciones filtradas
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchQuery]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input con icono de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-3"
        />
      </div>

      {/* Badges de selección */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1.5 px-2 py-1 text-xs"
            >
              <span>{value}</span>
              <button
                type="button"
                onClick={() => toggleOption(value)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    toggleOption(value);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-md max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs md:text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option, index) => {
                const isSelected = selected.includes(option);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={cn(
                      "px-3 py-2 text-xs md:text-sm cursor-pointer rounded-sm flex items-center justify-between transition-colors",
                      isHighlighted && "bg-muted",
                      isSelected && "bg-muted/50"
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
