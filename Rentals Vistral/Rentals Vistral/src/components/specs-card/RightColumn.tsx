"use client";

import { RentalKPIsWidget } from "./RentalKPIsWidget";
import { NotesManager } from "./NotesManager";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface RightColumnProps {
  property: Property;
}

export function RightColumn({
  property,
}: RightColumnProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Bottom (Scrollable): KPIs + NotesManager - Native mouse-wheel scrolling */}
      <div className="flex-1 overflow-y-auto bg-[var(--vistral-gray-50)] dark:bg-[#1a1a1a]">
        <div className="p-4 pb-0">
          <RentalKPIsWidget />
        </div>
        <div className="p-4 pt-4">
          <NotesManager property={property} />
        </div>
      </div>
    </div>
  );
}
