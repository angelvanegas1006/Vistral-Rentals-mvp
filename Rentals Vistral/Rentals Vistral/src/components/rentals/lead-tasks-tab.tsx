"use client";

import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";
import { LeadPersonalInfoSection } from "@/components/rentals/lead-personal-info-section";

const PHASE_RECOGIENDO = "Recogiendo Información";

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
  nationality?: string | null;
  identityDocType?: "DNI" | "NIE" | "Pasaporte" | null;
  identityDocNumber?: string | null;
  identityDocUrl?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  familyProfile?: "Soltero" | "Pareja" | "Con hijos" | null;
  childrenCount?: number | null;
  petInfo?: Record<string, unknown> | null;
}

interface LeadTasksTabProps {
  lead: Lead;
}

/** Espacio de trabajo del interesado: progreso + secciones por fase (Fase 3: Información personal). */
export function LeadTasksTab({ lead }: LeadTasksTabProps) {
  const isRecogiendoInformacion = lead.currentPhase === PHASE_RECOGIENDO;

  return (
    <div className="space-y-4 md:space-y-6">
      <ProgressOverviewWidget sections={[]} formData={{}} />

      {isRecogiendoInformacion && (
        <LeadPersonalInfoSection
          lead={{
            id: lead.id,
            nationality: lead.nationality,
            identityDocType: lead.identityDocType,
            identityDocNumber: lead.identityDocNumber,
            identityDocUrl: lead.identityDocUrl,
            dateOfBirth: lead.dateOfBirth,
            age: lead.age,
            familyProfile: lead.familyProfile,
            childrenCount: lead.childrenCount,
            petInfo: lead.petInfo,
          }}
        />
      )}
    </div>
  );
}
