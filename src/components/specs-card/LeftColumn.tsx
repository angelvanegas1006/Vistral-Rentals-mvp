"use client";

import { SummaryCard } from "./SummaryCard";
import { DataTreeViewer } from "./DataTreeViewer";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface LeftColumnProps {
  property: Property;
}

export function LeftColumn({ property }: LeftColumnProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Summary Card - Fixed at top */}
      <div className="shrink-0">
        <SummaryCard property={property} />
      </div>

      {/* Data Tree Viewer - Scrollable below */}
      <div className="flex-1 overflow-hidden">
        <DataTreeViewer />
      </div>
    </div>
  );
}
