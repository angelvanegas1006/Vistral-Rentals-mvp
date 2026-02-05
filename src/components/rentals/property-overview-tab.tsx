"use client";

import { LeftColumn } from "@/components/specs-card/LeftColumn";
import { cn } from "@/lib/utils";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PropertyOverviewTabProps {
  propertyId: string;
}

export function PropertyOverviewTab({ propertyId }: PropertyOverviewTabProps) {
  // Mock property data - reemplazar con datos reales de Supabase
  const property: Property = {
    property_unique_id: propertyId,
    address: "Calle Gran Vía 45, 3º B",
    city: "Madrid",
    daysInPhase: 2,
    currentPhase: "Phase 0: Viviendas Prophero",
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards Container */}
      <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
        <LeftColumn property={property} />
      </div>
    </div>
  );
}
