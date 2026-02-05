"use client";

import { differenceInDays } from "date-fns";
import { Hammer, Megaphone, Hourglass } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface TimeMetricsWidgetProps {
  property: PropertyRow;
}

export function TimeMetricsWidget({ property }: TimeMetricsWidgetProps) {
  // Metric 1: "Desde fin reforma"
  const getDaysSinceRenoEnd = (): string => {
    if (!property.reno_end_date) {
      return "--";
    }
    try {
      const days = differenceInDays(new Date(), new Date(property.reno_end_date));
      return days >= 0 ? `${days}` : "--";
    } catch {
      return "--";
    }
  };

  // Metric 2: "Días en mercado"
  const getVacancyGapDays = (): string => {
    const days = property.vacancy_gap_days;
    return days !== null && days !== undefined ? `${days}` : "--";
  };

  // Metric 3: "Días en fase actual"
  const getDaysInStage = (): string => {
    const days = property.days_in_stage ?? property.days_in_phase;
    return days !== null && days !== undefined ? `${days}` : "--";
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
      {/* Metric 1: Desde fin reforma */}
      <div className="py-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <Hammer className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Desde fin reforma
          </span>
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getDaysSinceRenoEnd()}
        </p>
      </div>

      {/* Metric 2: Días en mercado */}
      <div className="py-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <Megaphone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Días en mercado
          </span>
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getVacancyGapDays()}
        </p>
      </div>

      {/* Metric 3: Días en fase actual */}
      <div className="py-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <Hourglass className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Días en fase actual
          </span>
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getDaysInStage()}
        </p>
      </div>
      </div>
    </div>
  );
}
