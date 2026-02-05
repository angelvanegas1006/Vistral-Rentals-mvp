"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface FinancialPerformanceWidgetProps {
  property: PropertyRow;
  currentPhase?: string;
}

export function FinancialPerformanceWidget({ property, currentPhase }: FinancialPerformanceWidgetProps) {
  // Determine phase status
  const phase = (currentPhase || property?.current_stage || property?.current_phase || "").toLowerCase();
  const isRented = 
    phase.includes("alquilado") || 
    phase === "actualización de renta (ipc)" || 
    phase === "gestión de renovación" || 
    phase === "finalización y salida" ||
    phase.includes("cartera");
  
  const isPreRent = 
    phase === "publicado" || 
    (!isRented && phase !== "" && (property?.announcement_price !== null && property?.announcement_price !== undefined));

  // Calculate if actual yield meets expected yield (for rented properties)
  const meetsTarget = 
    property?.actual_yield !== null && 
    property?.expected_yield !== null &&
    property.actual_yield >= property.expected_yield;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
        {/* Left Column: Plan de inversión (Objetivo) */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Plan de inversión (Objetivo)
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Precio</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {property?.target_rent_price 
                ? `${property.target_rent_price.toLocaleString("es-ES")} €/mes` 
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Rentabilidad</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {property?.expected_yield ? `${property.expected_yield}%` : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic - "Realidad" */}
      <div className={cn(
        "p-4",
        isRented && meetsTarget && "bg-green-50/50 dark:bg-green-900/20",
        isRented && !meetsTarget && "bg-orange-50/50 dark:bg-orange-900/20",
        !isRented && "bg-white dark:bg-gray-800"
      )}>
        {isRented ? (
          // Condition B: Rented - "Cierre real"
          <>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Cierre real
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Precio</p>
                <div className="flex items-center gap-1.5">
                  <p className={cn(
                    "text-lg font-semibold",
                    meetsTarget 
                      ? "text-green-600 dark:text-green-500" 
                      : "text-orange-600 dark:text-orange-500"
                  )}>
                    {property?.final_rent_price 
                      ? `${property.final_rent_price.toLocaleString("es-ES")} €/mes` 
                      : "--"}
                  </p>
                  {meetsTarget ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-500" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Rentabilidad</p>
                <div className="flex items-center gap-1.5">
                  <p className={cn(
                    "text-lg font-semibold",
                    meetsTarget 
                      ? "text-green-600 dark:text-green-500" 
                      : "text-orange-600 dark:text-orange-500"
                  )}>
                    {property?.actual_yield ? `${property.actual_yield}%` : "--"}
                  </p>
                  {meetsTarget ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-500" />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : isPreRent ? (
          // Condition A: Pre-Rented/Commercialization - "En publicación"
          <>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              En publicación
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Precio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {property?.announcement_price 
                    ? `${property.announcement_price.toLocaleString("es-ES")} €/mes` 
                    : "--"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Rentabilidad implícita</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {/* Calculate implied yield if we had total investment, otherwise show -- */}
                  {"--"}
                </p>
              </div>
            </div>
          </>
        ) : (
          // Default: No status yet
          <>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Estado actual
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Precio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">--</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Rentabilidad</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">--</p>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
