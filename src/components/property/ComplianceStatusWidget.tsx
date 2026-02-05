"use client";

import { Building, Receipt, ShieldCheck } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface ComplianceStatusWidgetProps {
  property: PropertyRow;
}

export function ComplianceStatusWidget({ property }: ComplianceStatusWidgetProps) {
  // Helper function to format boolean status
  const formatStatus = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) {
      return "--";
    }
    return value ? "Sí" : "No";
  };

  // Helper function to get status color
  const getStatusColor = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) {
      return "text-gray-500 dark:text-gray-400";
    }
    return value
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
        {/* Metric 1: Comunidad al día */}
        <div className="py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              Comunidad al día
            </span>
          </div>
          <p className={`text-lg font-semibold ${getStatusColor(property.community_fees_paid)}`}>
            {formatStatus(property.community_fees_paid)}
          </p>
        </div>

        {/* Metric 2: Impuestos al día */}
        <div className="py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Receipt className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              Impuestos al día
            </span>
          </div>
          <p className={`text-lg font-semibold ${getStatusColor(property.taxes_paid)}`}>
            {formatStatus(property.taxes_paid)}
          </p>
        </div>

        {/* Metric 3: ITV al día */}
        <div className="py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              ITV al día
            </span>
          </div>
          <p className={`text-lg font-semibold ${getStatusColor(property.itv_passed)}`}>
            {formatStatus(property.itv_passed)}
          </p>
        </div>
      </div>
    </div>
  );
}
