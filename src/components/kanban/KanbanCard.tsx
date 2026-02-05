"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface KanbanCardProps {
  property: Property;
  onClick: () => void;
  className?: string;
  layoutId?: string;
}

export function KanbanCard({
  property,
  onClick,
  className,
  layoutId,
}: KanbanCardProps) {
  const getDaysBadgeColor = (days: number) => {
    if (days < 5) return "bg-green-100 text-green-800 border-green-300";
    if (days <= 15) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <motion.div layoutId={layoutId}>
      <Card
        onClick={onClick}
        className={cn(
          "h-40 flex-shrink-0 cursor-pointer transition-all",
          "hover:shadow-md border-gray-200",
          "flex flex-col p-4",
          className
        )}
      >
      {/* Row 1: Property ID + Days Badge */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500">
          {property.property_unique_id}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            getDaysBadgeColor(property.daysInPhase)
          )}
        >
          {property.daysInPhase}d
        </span>
      </div>

      {/* Row 2: Address (Main Content) */}
      <div className="mb-auto flex-1">
        <p className="line-clamp-2 text-base font-bold text-gray-900">
          {property.address}
        </p>
      </div>

      {/* Row 3: Region/City Footer */}
      <div className="mt-2 flex items-center gap-1">
        <svg
          className="h-3 w-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-xs text-gray-400">
          {property.city || "Madrid"}
        </span>
      </div>
    </Card>
    </motion.div>
  );
}
