"use client";

import { useRouter } from "next/navigation";
import { KanbanCard } from "@/components/kanban/KanbanCard";

export default function TestArchitecturePage() {
  const router = useRouter();

  // Mock property data for the card
  const mockProperty = {
    property_unique_id: "PROP-2024-001",
    address: "Calle Gran Vía, 123",
    city: "Madrid",
    daysInPhase: 3,
    currentPhase: "Phase 0: Component Test",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Architecture Proof of Concept
        </h1>
        <p className="mb-8 text-center text-sm text-gray-600">
          Click the card below to navigate to the full-page property view
        </p>
        <KanbanCard
          property={mockProperty}
          onClick={() => {
            router.push(`/test-architecture/property/${mockProperty.property_unique_id}`);
          }}
        />
      </div>
    </div>
  );
}
