"use client";

import { Card } from "@/components/ui/card";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface SummaryCardProps {
  property: Property;
}

export function SummaryCard({ property }: SummaryCardProps) {
  // Mock image URL - in real app would use photos_urls[0]
  const imageUrl =
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=200&fit=crop";

  return (
    <Card className="m-4 overflow-hidden border-gray-200 shadow-sm">
      {/* Cover Image */}
      <div className="relative h-32 w-full bg-gray-200">
        <img
          src={imageUrl}
          alt={property.address}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="bg-slate-50 px-4 py-3">
        <h3 className="mb-2 text-sm font-bold text-gray-900 line-clamp-2">
          {property.address}
        </h3>
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            <span className="font-mono">{property.property_unique_id}</span>
          </p>
          <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            {property.currentPhase}
          </span>
        </div>
      </div>
    </Card>
  );
}
