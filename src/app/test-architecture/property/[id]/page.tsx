"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PhaseZeroView } from "@/components/specs-card/PhaseZeroView";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Mock property data - in production this would be fetched based on params.id
  const mockProperty: Property = {
    property_unique_id: params.id || "PROP-2024-001",
    address: "Calle Gran Vía, 123",
    city: "Madrid",
    daysInPhase: 3,
    currentPhase: "Phase 0: Component Test",
  };

  return (
    <div className="h-screen w-full bg-zinc-50 flex justify-center p-6 md:p-8 overflow-hidden">
      {/* Content Card with max-width and breathing room */}
      <div className="w-full max-w-[1600px] bg-white rounded-xl shadow-sm overflow-hidden flex flex-col relative h-full">
        {/* Header Bar - Dedicated space for Back Button to prevent overlap */}
        <div className="absolute top-0 right-0 z-[70] flex h-12 items-center justify-end pr-4 pointer-events-none">
          {/* Navigation Controls - Back Button (ONLY ONE) */}
          <button
            onClick={() => router.back()}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pointer-events-auto bg-white/80 backdrop-blur-sm p-2 hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
            <span className="sr-only">Back</span>
          </button>
        </div>

        {/* 3-Column Grid Container - Children will render inside */}
        <div className="flex flex-1 min-h-0 h-full">
          <PhaseZeroView property={mockProperty} />
        </div>
      </div>
    </div>
  );
}
