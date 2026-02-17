"use client";

import { useState, useCallback } from "react";
import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";
import {
  LeadPersonalInfoSection,
  type LeadPersonalInfoLiveData,
} from "@/components/rentals/lead-personal-info-section";
import {
  LeadEmploymentFinancialSection,
  isEmploymentFinancialSectionComplete,
} from "@/components/rentals/lead-employment-financial-section";
import { LeadPropertyCard } from "@/components/rentals/lead-property-card";
import { LeadPropertyCardWorkPerfilCualificado } from "@/components/rentals/lead-property-card-work-perfil-cualificado";
import { useLeadProperties } from "@/hooks/use-lead-properties";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";

const PHASE_RECOGIENDO = "Recogiendo Información";
const PHASE_PERFIL_CUALIFICADO = "Perfil cualificado";

const LEAD_PHASE3_SECTIONS = [
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
  {
    id: "employment-financial",
    title: "Información Laboral y Financiera del Interesado",
    required: true,
    fields: [
      { id: "employment_status", required: true },
      { id: "employment_contract_type", required: false },
      { id: "obligatory_docs", required: true },
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
  employment_status?: string | null;
  job_title?: string | null;
  employment_contract_type?: string | null;
  laboral_financial_docs?: Record<string, unknown> | null;
}

interface LeadTasksTabProps {
  lead: Lead;
  onLeadRefetch?: () => void | Promise<void>;
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

/** Build formData for employment-financial section from lead. */
function buildFormDataFromEmploymentLead(lead: Lead): Record<string, unknown> {
  const laboral = lead.laboral_financial_docs as { obligatory?: Record<string, string> } | null | undefined;
  const obligatory = laboral?.obligatory || {};
  return {
    "employment-financial.employment_status": lead.employment_status ?? "",
    "employment-financial.employment_contract_type": lead.employment_contract_type ?? "",
    "employment-financial.obligatory_docs": obligatory,
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
    ...buildFormDataFromEmploymentLead(lead),
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

/** Check if employment-financial section is complete. */
function isEmploymentFinancialComplete(fd: Record<string, unknown>): boolean {
  return isEmploymentFinancialSectionComplete({
    employment_status: fd["employment-financial.employment_status"] as string | null | undefined,
    employment_contract_type: fd["employment-financial.employment_contract_type"] as string | null | undefined,
    laboral_financial_docs: {
      obligatory: fd["employment-financial.obligatory_docs"] as Record<string, string> | undefined,
    },
  });
}

// ---------- Component ----------

/** Espacio de trabajo del interesado: progreso + secciones por fase (Fase 3: Información personal). */
export function LeadTasksTab({ lead, onLeadRefetch }: LeadTasksTabProps) {
  const isRecogiendoInformacion = lead.currentPhase === PHASE_RECOGIENDO;
  const isPerfilCualificado = lead.currentPhase === PHASE_PERFIL_CUALIFICADO;

  const { items: leadPropertyItems, loading: leadPropertiesLoading, refetch: refetchLeadProperties } = useLeadProperties(
    isPerfilCualificado ? lead.leadsUniqueId : undefined
  );

  // --- Live formData state for the progress widget ---
  const [liveFormData, setLiveFormData] = useState<Record<string, unknown>>(
    () => buildFormDataFromLead(lead)
  );

  // Merge employment data when lead refetches (employment section triggers onRefetch)
  const mergedFormData = {
    ...liveFormData,
    ...buildFormDataFromEmploymentLead(lead),
  };

  const isPersonalComplete = isSectionComplete(liveFormData);
  // Use mergedFormData so employment completion reflects latest lead data after refetch
  const isEmploymentComplete = isEmploymentFinancialComplete(mergedFormData);

  // When the section fields change, rebuild the formData for the progress widget
  const handleFieldsChange = useCallback((data: LeadPersonalInfoLiveData) => {
    setLiveFormData((prev) => ({
      ...prev,
      ...buildFormDataFromLive(data),
    }));
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ProgressOverviewWidget
        sections={isRecogiendoInformacion ? LEAD_PHASE3_SECTIONS : []}
        formData={isRecogiendoInformacion ? mergedFormData : {}}
      />

      {isPerfilCualificado && (
        <div className="space-y-4">
          {leadPropertiesLoading ? (
            <div className="flex justify-center py-8">
              <RentalsHomeLoader />
            </div>
          ) : leadPropertyItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] dark:border-[#374151] bg-[#FAFAFA] dark:bg-[#111827] p-8 text-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                No hay propiedades asignadas. Añade propiedades desde la pestaña{" "}
                <strong>Propiedades de interés</strong>.
              </p>
            </div>
          ) : (
            leadPropertyItems.map(({ leadsProperty, property }) => (
              <LeadPropertyCard
                key={leadsProperty.id}
                leadsProperty={leadsProperty}
                property={property}
                workSection={
                  <LeadPropertyCardWorkPerfilCualificado
                    leadsProperty={leadsProperty}
                    onUpdated={refetchLeadProperties}
                  />
                }
              />
            ))
          )}
        </div>
      )}

      {isRecogiendoInformacion && (
        <>
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
            isComplete={isPersonalComplete}
          />
          <LeadEmploymentFinancialSection
            lead={{
              id: lead.id,
              leadsUniqueId: lead.leadsUniqueId,
              employment_status: lead.employment_status,
              job_title: lead.job_title,
              employment_contract_type: lead.employment_contract_type,
              laboral_financial_docs: lead.laboral_financial_docs,
            }}
            isComplete={isEmploymentComplete}
            onRefetch={onLeadRefetch}
          />
        </>
      )}
    </div>
  );
}
