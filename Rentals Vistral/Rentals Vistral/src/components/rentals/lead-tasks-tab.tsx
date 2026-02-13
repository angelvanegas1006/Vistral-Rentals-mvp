"use client";

import { useState, useCallback } from "react";
import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";
import {
  LeadPersonalInfoSection,
  type LeadPersonalInfoLiveData,
} from "@/components/rentals/lead-personal-info-section";

const PHASE_RECOGIENDO = "Recogiendo Información";

const LEAD_PERSONAL_INFO_SECTIONS = [
  {
    id: "personal-info",
    title: "Información Personal del Interesado",
    required: true,
    fields: [
      { id: "nationality", required: true },
      { id: "identity_doc_type", required: true },
      { id: "identity_doc_number", required: true },
      { id: "identity_doc_url", required: true },
      { id: "date_of_birth", required: true },
      { id: "family_profile", required: true },
      { id: "has_pets", required: true },
    ],
  },
];

interface Lead {
  id: string;
  leadsUniqueId: string;
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

// ---------- Helpers ----------

/** Build the formData record that ProgressOverviewWidget expects, from live field values. */
function buildFormDataFromLive(d: LeadPersonalInfoLiveData): Record<string, unknown> {
  return {
    "personal-info.nationality": d.nationality || "",
    "personal-info.identity_doc_type": d.identityDocType ?? null,
    "personal-info.identity_doc_number": d.identityDocNumber || "",
    "personal-info.identity_doc_url": d.identityDocUrl ?? "",
    "personal-info.date_of_birth": d.dateOfBirth || "",
    "personal-info.family_profile": d.familyProfile ?? null,
    "personal-info.children_count": d.childrenCount ?? null,
    "personal-info.has_pets": d.hasPets,
    "personal-info.pet_details": d.petDetails || "",
  };
}

/** Build initial formData from the (stale) lead prop — used before the first onFieldsChange fires. */
function buildFormDataFromLead(lead: Lead): Record<string, unknown> {
  const petInfo = lead.petInfo as { has_pets?: boolean; details?: string; notes?: string } | null | undefined;
  const hasPets =
    petInfo?.has_pets === true || (petInfo?.notes && petInfo.notes.trim() !== "")
      ? "yes"
      : petInfo?.has_pets === false
        ? "no"
        : null;

  return {
    "personal-info.nationality": lead.nationality ?? "",
    "personal-info.identity_doc_type": lead.identityDocType ?? null,
    "personal-info.identity_doc_number": lead.identityDocNumber ?? "",
    "personal-info.identity_doc_url": lead.identityDocUrl ?? "",
    "personal-info.date_of_birth": lead.dateOfBirth ? lead.dateOfBirth.slice(0, 10) : "",
    "personal-info.family_profile": lead.familyProfile ?? null,
    "personal-info.children_count": lead.childrenCount ?? null,
    "personal-info.has_pets": hasPets,
    "personal-info.pet_details": petInfo?.details ?? petInfo?.notes ?? "",
  };
}

/** Check if the personal-info section is fully complete (same logic as ProgressOverviewWidget). */
function isSectionComplete(fd: Record<string, unknown>): boolean {
  const has = (v: unknown) =>
    v !== undefined && v !== null && v !== "" && String(v).trim() !== "";

  if (!has(fd["personal-info.nationality"])) return false;
  if (!has(fd["personal-info.identity_doc_type"])) return false;
  if (!has(fd["personal-info.identity_doc_number"])) return false;
  if (!has(fd["personal-info.identity_doc_url"])) return false;
  if (!has(fd["personal-info.date_of_birth"])) return false;
  if (!has(fd["personal-info.family_profile"])) return false;

  const hasPets = fd["personal-info.has_pets"];
  if (hasPets !== "yes" && hasPets !== "no") return false;

  // children_count required when family_profile === "Con hijos"
  if (fd["personal-info.family_profile"] === "Con hijos") {
    const cc = fd["personal-info.children_count"];
    if (cc === undefined || cc === null || String(cc).trim() === "") return false;
  }

  // pet_details required when has_pets === "yes"
  if (hasPets === "yes") {
    if (!has(fd["personal-info.pet_details"])) return false;
  }

  return true;
}

// ---------- Component ----------

/** Espacio de trabajo del interesado: progreso + secciones por fase (Fase 3: Información personal). */
export function LeadTasksTab({ lead }: LeadTasksTabProps) {
  const isRecogiendoInformacion = lead.currentPhase === PHASE_RECOGIENDO;

  // --- Live formData state for the progress widget ---
  const [liveFormData, setLiveFormData] = useState<Record<string, unknown>>(
    () => buildFormDataFromLead(lead)
  );

  const isComplete = isSectionComplete(liveFormData);

  // When the section fields change, rebuild the formData for the progress widget
  const handleFieldsChange = useCallback((data: LeadPersonalInfoLiveData) => {
    setLiveFormData(buildFormDataFromLive(data));
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ProgressOverviewWidget
        sections={isRecogiendoInformacion ? LEAD_PERSONAL_INFO_SECTIONS : []}
        formData={isRecogiendoInformacion ? liveFormData : {}}
      />

      {isRecogiendoInformacion && (
        <LeadPersonalInfoSection
          lead={{
            id: lead.id,
            leadsUniqueId: lead.leadsUniqueId,
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
          onFieldsChange={handleFieldsChange}
          isComplete={isComplete}
        />
      )}
    </div>
  );
}
