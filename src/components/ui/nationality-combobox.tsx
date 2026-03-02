"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NATIONALITIES } from "@/lib/constants/nationalities";

interface NationalityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function NationalityCombobox({
  value,
  onChange,
  placeholder = "Buscar nacionalidad...",
  disabled = false,
  className,
  id,
}: NationalityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return NATIONALITIES;
    const query = searchQuery.toLowerCase();
    return NATIONALITIES.filter((n) => n.toLowerCase().includes(query));
  }, [searchQuery]);

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
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
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

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

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchQuery]);

  const displayValue = open ? searchQuery : value || "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-3"
        />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-[#E5E7EB] dark:border-[#374151] rounded-md shadow-md max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No hay resultados
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option, index) => {
                const isSelected = value === option;
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option)}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer rounded-sm flex items-center justify-between transition-colors",
                      isHighlighted && "bg-muted",
                      isSelected && "bg-muted/50"
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span>{option}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
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
