"use client";

import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  zone?: string;
  currentPhase: string;
  interestedProperties?: Array<{
    id: string;
    address: string;
    city?: string;
  }>;
}

interface LeadTasksTabProps {
  lead: Lead;
}

/** Espacio de trabajo del interesado: mismo esquema que propiedad (progreso + secciones). De momento sin secciones definidas. */
export function LeadTasksTab({ lead }: LeadTasksTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Widget de progreso general - vacío hasta que se definan secciones por fase */}
      <ProgressOverviewWidget
        sections={[]}
        formData={{}}
      />
      {/* Reservado para futuras secciones de trabajo por fase */}
    </div>
  );
}
