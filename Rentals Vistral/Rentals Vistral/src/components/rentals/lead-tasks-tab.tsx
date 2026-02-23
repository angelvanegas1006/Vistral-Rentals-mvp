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
import { LeadPropertyCardWorkSection } from "@/components/rentals/lead-property-card-work-section";
import { OtrasPropiedadesCartera } from "@/components/rentals/otras-propiedades-cartera";
import { useLeadProperties } from "@/hooks/use-lead-properties";
import { useMtpTransition } from "@/hooks/use-mtp-transition";
import { TransitionConfirmationModal } from "@/components/rentals/transition-confirmation-modal";
import { MtpModalDescarte } from "@/components/rentals/mtp-modal-descarte";
import { MtpModalPausa } from "@/components/rentals/mtp-modal-pausa";
import { MtpModalReagendar } from "@/components/rentals/mtp-modal-reagendar";
import { MtpModalRegistroActividad } from "@/components/rentals/mtp-modal-registro-actividad";
import { updateLeadsProperty, transitionLeadsProperty } from "@/services/leads-sync";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { MTP_EXIT_STATUS_IDS } from "@/lib/leads/mtp-status";

const PHASE_RECOGIENDO = "Recogiendo Información";
const PHASE_INTERESADO_CUALIFICADO = "Interesado Cualificado";

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

function ArchivedPropertyItem({
  leadsProperty,
  propertyAddress,
  onRevive,
}: {
  leadsProperty: { id: string; current_status?: string | null };
  propertyAddress: string;
  onRevive: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const status = leadsProperty.current_status ?? "";
  const statusLabel =
    status === "en_espera"
      ? "En Espera"
      : status === "descartada"
        ? "Descartada"
        : status === "alquilada"
          ? "Alquilada"
          : status;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium text-sm">{propertyAddress}</p>
        <p className="text-xs text-muted-foreground">{statusLabel}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          setLoading(true);
          await onRevive();
          setLoading(false);
        }}
        disabled={loading}
      >
        Recuperar
      </Button>
    </div>
  );
}

// ---------- Component ----------

/** Espacio de trabajo del interesado: progreso + secciones por fase. */
export function LeadTasksTab({ lead, onLeadRefetch }: LeadTasksTabProps) {
  const isRecogiendoInformacion = lead.currentPhase === PHASE_RECOGIENDO;
  const isInteresadoCualificado = lead.currentPhase === PHASE_INTERESADO_CUALIFICADO;

  const { items: leadPropertyItems, loading: leadPropertiesLoading, refetch: refetchLeadProperties } = useLeadProperties(
    lead.leadsUniqueId
  );

  const { transition, pendingConfirmation, confirmTransition, cancelTransition } = useMtpTransition({
    leadId: lead.leadsUniqueId,
    onSuccess: async () => {
      await refetchLeadProperties();
      await onLeadRefetch?.();
    },
  });

  const handleTransition = useCallback(
    async (lpId: string, newStatus: string, action: "advance" | "undo" | "revive", updates: Record<string, unknown>) => {
      const result = await transition(lpId, newStatus, action, updates);
      return result;
    },
    [transition]
  );

  const [modalDescarte, setModalDescarte] = useState<{ lpId: string; address: string } | null>(null);
  const [modalPausa, setModalPausa] = useState<{ lpId: string; address: string } | null>(null);
  const [modalReagendar, setModalReagendar] = useState<{ lpId: string; address: string; visitDate?: string | null } | null>(null);
  const [modalRegistro, setModalRegistro] = useState<{ leadsProperty: typeof leadPropertyItems[0]["leadsProperty"]; address: string } | null>(null);

  const activeItems = leadPropertyItems.filter(
    (i) => !MTP_EXIT_STATUS_IDS.includes((i.leadsProperty.current_status ?? "perfil_cualificado") as "en_espera" | "descartada" | "alquilada")
  );
  const archivedItems = leadPropertyItems.filter((i) =>
    MTP_EXIT_STATUS_IDS.includes((i.leadsProperty.current_status ?? "") as "en_espera" | "descartada" | "alquilada")
  );

  // --- Live formData state for the progress widget ---
  const [liveFormData, setLiveFormData] = useState<Record<string, unknown>>(
    () => buildFormDataFromLead(lead)
  );

  const mergedFormData = {
    ...liveFormData,
    ...buildFormDataFromEmploymentLead(lead),
  };

  const isPersonalComplete = isSectionComplete(liveFormData);
  const isEmploymentComplete = isEmploymentFinancialComplete(mergedFormData);

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

      {/* Propiedades en gestión (todas las fases) */}
      <div className="space-y-8">
        <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Propiedades en gestión
            </h3>
            {!leadPropertiesLoading && (
              <span className="text-xs text-muted-foreground bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-700)] px-2 py-0.5 rounded-full">
                {activeItems.length}
              </span>
            )}
          </div>

          {leadPropertiesLoading ? (
            <div className="flex justify-center py-8">
              <RentalsHomeLoader />
            </div>
          ) : activeItems.length === 0 ? (
            <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay propiedades en gestión. Añade propiedades desde la
                sección <strong>Otras Propiedades en Cartera</strong> de abajo.
              </p>
            </div>
          ) : (
            activeItems.map(({ leadsProperty, property }) => (
              <LeadPropertyCard
                key={leadsProperty.id}
                leadsProperty={leadsProperty}
                property={property}
                workSection={
                  <LeadPropertyCardWorkSection
                    leadsProperty={leadsProperty}
                    onUpdated={refetchLeadProperties}
                    onTransition={handleTransition}
                  />
                }
                onUndo={async () => {
                  await handleTransition(leadsProperty.id, "", "undo", {});
                }}
                onReagendar={() =>
                  setModalReagendar({
                    lpId: leadsProperty.id,
                    address: property.address || "Propiedad",
                    visitDate: leadsProperty.visit_date ?? leadsProperty.scheduled_visit_date,
                  })
                }
                onPausar={() =>
                  setModalPausa({
                    lpId: leadsProperty.id,
                    address: property.address || "Propiedad",
                  })
                }
                onDescartar={() =>
                  setModalDescarte({
                    lpId: leadsProperty.id,
                    address: property.address || "Propiedad",
                  })
                }
                onRegistroActividad={() =>
                  setModalRegistro({
                    leadsProperty,
                    address: property.address || "Propiedad",
                  })
                }
              />
            ))
          )}
        </div>

        {/* Archivo de Propiedades (En Espera / Descartadas / Alquiladas) */}
        {archivedItems.length > 0 && (
          <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Archivo de Propiedades (Descartadas / En Espera / Alquiladas)
            </h3>
            <div className="space-y-2">
              {archivedItems.map(({ leadsProperty, property }) => (
                <ArchivedPropertyItem
                  key={leadsProperty.id}
                  leadsProperty={leadsProperty}
                  propertyAddress={property.address || "Propiedad"}
                  onRevive={async () => {
                    const result = await transition(
                      leadsProperty.id,
                      "",
                      "revive",
                      {}
                    );
                    if (result?.completed) {
                      await refetchLeadProperties();
                      await onLeadRefetch?.();
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {isInteresadoCualificado && (
          <OtrasPropiedadesCartera
            leadsUniqueId={lead.leadsUniqueId}
            leadPropertyItems={leadPropertyItems}
            onPropertyAdded={refetchLeadProperties}
          />
        )}
      </div>

      {/* Modal de Confirmación de Transición */}
      {pendingConfirmation && (
        <TransitionConfirmationModal
          open={!!pendingConfirmation}
          onOpenChange={(open) => !open && cancelTransition()}
          fromPhase={pendingConfirmation.fromPhase}
          toPhase={pendingConfirmation.toPhase}
          propertyAddress={pendingConfirmation.propertyAddress}
          direction={pendingConfirmation.direction}
          onConfirm={confirmTransition}
          onCancel={cancelTransition}
        />
      )}

      {/* Modales de acciones */}
      {modalDescarte && (
        <MtpModalDescarte
          open={!!modalDescarte}
          onOpenChange={(open) => !open && setModalDescarte(null)}
          propertyAddress={modalDescarte.address}
          onConfirm={async (exitReason, exitComments) => {
            await transition(modalDescarte.lpId, "descartada", "advance", {
              exit_reason: exitReason,
              exit_comments: exitComments,
            });
            setModalDescarte(null);
            await refetchLeadProperties();
            await onLeadRefetch?.();
          }}
        />
      )}
      {modalPausa && (
        <MtpModalPausa
          open={!!modalPausa}
          onOpenChange={(open) => !open && setModalPausa(null)}
          propertyAddress={modalPausa.address}
          onConfirm={async (exitReason, exitComments) => {
            await transition(modalPausa.lpId, "en_espera", "advance", {
              exit_reason: exitReason,
              exit_comments: exitComments,
            });
            setModalPausa(null);
            await refetchLeadProperties();
            await onLeadRefetch?.();
          }}
        />
      )}
      {modalReagendar && (
        <MtpModalReagendar
          open={!!modalReagendar}
          onOpenChange={(open) => !open && setModalReagendar(null)}
          propertyAddress={modalReagendar.address}
          currentVisitDate={modalReagendar.visitDate}
          onConfirm={async (newVisitDate, justification) => {
            await updateLeadsProperty(modalReagendar.lpId, {
              visit_date: newVisitDate,
              current_status: "visita_agendada",
            });
            setModalReagendar(null);
            await refetchLeadProperties();
          }}
        />
      )}
      {modalRegistro && (
        <MtpModalRegistroActividad
          open={!!modalRegistro}
          onOpenChange={(open) => !open && setModalRegistro(null)}
          leadsProperty={modalRegistro.leadsProperty}
          propertyAddress={modalRegistro.address}
        />
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
