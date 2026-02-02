"use client";

import { Card } from "@/components/ui/card";

interface RentalKPIsWidgetProps {
  targetRentPrice?: number | null;
  expectedYield?: number | null;
  daysInPhase?: number | null;
}

export function RentalKPIsWidget({
  targetRentPrice,
  expectedYield,
  daysInPhase,
}: RentalKPIsWidgetProps = {}) {
  // Format values or use fallback
  const formatTargetPrice = () => {
    if (targetRentPrice !== null && targetRentPrice !== undefined) {
      return targetRentPrice.toLocaleString();
    }
    return "--";
  };

  const formatExpectedYield = () => {
    if (expectedYield !== null && expectedYield !== undefined) {
      return `${expectedYield}`;
    }
    return "--";
  };

  const formatDaysInPhase = () => {
    if (daysInPhase !== null && daysInPhase !== undefined) {
      return `${daysInPhase}`;
    }
    return "--";
  };

  const kpis = [
    { label: "Rentabilidad Esperada (Yield)", value: formatExpectedYield(), unit: expectedYield !== null && expectedYield !== undefined ? "%" : "" },
    { label: "Rentabilidad Real", value: "--", unit: "" },
    { label: "Target Price", value: formatTargetPrice(), unit: targetRentPrice !== null && targetRentPrice !== undefined ? "€/mes" : "" },
    { label: "Días en Mercado", value: formatDaysInPhase(), unit: daysInPhase !== null && daysInPhase !== undefined ? "días" : "" },
    { label: "Días desde Fin Reforma", value: "45", unit: "días" },
    { label: "Gap Vacancia", value: "0", unit: "días" },
  ];

  return (
    <Card className="border-gray-200 shadow-sm">
      <div className="border-b border-gray-100 bg-gray-100/50 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">KPIs de Alquiler</h3>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="rounded-md border border-gray-200 bg-white p-2"
            >
              <p className="text-[10px] text-gray-600 leading-tight">{kpi.label}</p>
              <p className="mt-0.5 text-sm font-bold text-gray-900">
                {kpi.value}
                {kpi.unit && (
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    {kpi.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
