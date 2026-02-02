"use client";

import React from "react";
import { ThumbsUp, ThumbsDown, Wrench, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusValue = "good" | "repair" | "replace" | "not_applicable" | "incident";
export type FinalCheckValue = "good" | "incident";

interface StatusOption {
  value: StatusValue | FinalCheckValue;
  label: string;
  icon: React.ReactNode;
}

const statusOptions: StatusOption[] = [
  {
    value: "good",
    label: "Buen estado",
    icon: <ThumbsUp className="h-5 w-5" />,
  },
  {
    value: "repair",
    label: "Necesita reparación",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    value: "replace",
    label: "Necesita reemplazo",
    icon: <ThumbsDown className="h-5 w-5" />,
  },
  {
    value: "not_applicable",
    label: "No aplica",
    icon: <XCircle className="h-5 w-5" />,
  },
  {
    value: "incident",
    label: "Incidencia",
    icon: <ThumbsDown className="h-5 w-5" />,
  },
];

interface StatusSelectorProps {
  value?: StatusValue | FinalCheckValue | null;
  onChange: (value: StatusValue | FinalCheckValue) => void;
  className?: string;
  disabled?: boolean;
  description?: string; // Descripción opcional que aparece debajo del título
  variant?: "full" | "final-check"; // Variante: completo (4 opciones) o final-check (2 opciones)
}

export function StatusSelector({
  value,
  onChange,
  className,
  disabled = false,
  description,
  variant = "full",
}: StatusSelectorProps) {
  // No usar valor por defecto, permitir null para que el usuario seleccione manualmente
  const currentValue = value ?? null;
  
  // Filtrar opciones según la variante
  const getFilteredOptions = () => {
    if (variant === "final-check") {
      return statusOptions.filter(
        (opt) => opt.value === "good" || opt.value === "incident"
      );
    }
    return statusOptions.filter((opt) => opt.value !== "incident");
  };

  const filteredOptions = getFilteredOptions();
  
  return (
    <div className={cn("space-y-2", className)}>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-2">
      {filteredOptions.map((option) => {
        const isSelected = currentValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
              "hover:bg-[var(--prophero-gray-50)] dark:hover:bg-[var(--prophero-gray-800)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSelected
                ? "border-[var(--prophero-blue-500)] bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-900)]/20"
                : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-700)] bg-background",
              "flex-1 min-w-0"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center",
                isSelected
                  ? "text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)]"
                  : "text-[var(--prophero-gray-600)] dark:text-[var(--prophero-gray-400)]"
              )}
            >
              {option.icon}
            </div>
            <span
              className={cn(
                "text-xs font-medium text-center",
                isSelected
                  ? "text-[var(--prophero-blue-700)] dark:text-[var(--prophero-blue-300)]"
                  : "text-[var(--prophero-gray-700)] dark:text-[var(--prophero-gray-300)]"
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
