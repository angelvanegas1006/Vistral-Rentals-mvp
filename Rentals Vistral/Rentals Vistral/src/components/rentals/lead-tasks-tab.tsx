"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, UserX } from "lucide-react";
import { toast } from "sonner";
import { useUpdateLead } from "@/hooks/use-update-lead";
import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";
import {
  LeadPersonalInfoSection,
  type LeadPersonalInfoLiveData,
} from "@/components/rentals/lead-personal-info-section";
import {
  LeadEmploymentFinancialSection,
  isEmploymentFinancialSectionComplete,
} from "@/components/rentals/lead-employment-financial-section";
import { LeadSelectedPropertySection } from "@/components/rentals/lead-selected-property-section";
import { LeadFinaerConfirmationSection } from "@/components/rentals/lead-finaer-confirmation-section";
import { MtpModalFinaerConfirmation } from "@/components/rentals/mtp-modal-finaer-confirmation";
import { LeadPropertyCard } from "@/components/rentals/lead-property-card";
import { LeadPropertyCardWorkSection } from "@/components/rentals/lead-property-card-work-section";
import { OtrasPropiedadesCartera } from "@/components/rentals/otras-propiedades-cartera";
import { useLeadProperties } from "@/hooks/use-lead-properties";
import { useMtpTransition } from "@/hooks/use-mtp-transition";
import { TransitionConfirmationModal } from "@/components/rentals/transition-confirmation-modal";
import { MtpModalDescarte } from "@/components/rentals/mtp-modal-descarte";
import { MtpModalReagendar } from "@/components/rentals/mtp-modal-reagendar";
import { MtpModalCancelarVisita } from "@/components/rentals/mtp-modal-cancelar-visita";
import { MtpModalRegistroActividad } from "@/components/rentals/mtp-modal-registro-actividad";
import { LeadPropertyCardWorkArchived } from "@/components/rentals/lead-property-card-work-archived";
import { updateLeadsProperty } from "@/services/leads-sync";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { MTP_EXIT_STATUS_IDS, MTP_STATUS_RANK } from "@/lib/leads/mtp-status";
import type { MtpStatusId } from "@/lib/leads/mtp-status";

const PHASES_1_2 = ["Interesado Cualificado", "Visita Agendada"];
const PHASE_RECOGIENDO = "Recogiendo Información";
const PHASES_RENTAL_IN_PROGRESS = [
  "Calificación en Curso",
  "Interesado Presentado",
  "Interesado Aceptado",
];

const LEAD_PHASE1_SECTIONS = [
  {
    id: "mtp-visit-scheduled",
    title: "Visita agendada para una propiedad",
    required: true,
    fields: [{ id: "has_visit_scheduled", required: true }],
  },
];

const LEAD_PHASE2_SECTIONS = [
  {
    id: "mtp-rental-process",
    title: "Iniciar proceso de alquiler",
    required: true,
    fields: [{ id: "has_rental_process_started", required: true }],
  },
];

const LEAD_PHASE3_SECTIONS = [
  {
    id: "selected-property",
    title: "Propiedad seleccionada para el estudio de solvencia",
    required: true,
    fields: [{ id: "has_selected_property", required: true }],
  },
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
  {
    id: "finaer-confirmation",
    title: "Confirmación de envío a Finaer",
    required: true,
    fields: [{ id: "finaer_sent", required: true }],
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
  qualificationPropertyId?: string | null;
}

interface LeadTasksTabProps {
  lead: Lead;
  onLeadRefetch?: () => void | Promise<void>;
  activeView?: "tasks" | "gestion" | "cartera" | "archivo";
  onTabChange?: (tab: string) => void;
  onOpenClosureModal?: (type: "perdido" | "rechazado") => void;
}

// ---------- Helpers ----------

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

function buildFormDataFromEmploymentLead(lead: Lead): Record<string, unknown> {
  const laboral = lead.laboral_financial_docs as { obligatory?: Record<string, string> } | null | undefined;
  const obligatory = laboral?.obligatory || {};
  return {
    "employment-financial.employment_status": lead.employment_status ?? "",
    "employment-financial.employment_contract_type": lead.employment_contract_type ?? "",
    "employment-financial.obligatory_docs": obligatory,
  };
}

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

  if (fd["personal-info.family_profile"] === "Con hijos") {
    const cc = fd["personal-info.children_count"];
    if (cc === undefined || cc === null || String(cc).trim() === "") return false;
  }

  if (hasPets === "yes") {
    if (!has(fd["personal-info.pet_details"])) return false;
  }

  return true;
}

function isEmploymentFinancialComplete(fd: Record<string, unknown>): boolean {
  return isEmploymentFinancialSectionComplete({
    employment_status: fd["employment-financial.employment_status"] as string | null | undefined,
    employment_contract_type: fd["employment-financial.employment_contract_type"] as string | null | undefined,
    laboral_financial_docs: {
      obligatory: fd["employment-financial.obligatory_docs"] as Record<string, string> | undefined,
    },
  });
}

function getMtpRank(status: string): number {
  return MTP_STATUS_RANK[status as MtpStatusId] ?? 0;
}

// ---------- Component ----------

export function LeadTasksTab({ lead, onLeadRefetch, activeView = "tasks", onTabChange, onOpenClosureModal }: LeadTasksTabProps) {
  const isPhase1or2 = PHASES_1_2.includes(lead.currentPhase);
  const isRecogiendoInformacion = lead.currentPhase === PHASE_RECOGIENDO;

  const { items: leadPropertyItems, loading: leadPropertiesLoading, refetch: refetchLeadProperties } = useLeadProperties(
    lead.leadsUniqueId,
    onLeadRefetch
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
  const [modalReagendar, setModalReagendar] = useState<{ lpId: string; address: string; visitDate?: string | null; fromStatus?: string } | null>(null);
  const [modalCancelarVisita, setModalCancelarVisita] = useState<{ lpId: string; address: string } | null>(null);
  const [modalRegistro, setModalRegistro] = useState<{ leadsProperty: typeof leadPropertyItems[0]["leadsProperty"]; address: string } | null>(null);
  const [modalFinaer, setModalFinaer] = useState(false);

  const { updateLead } = useUpdateLead();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    () => lead.qualificationPropertyId ?? null
  );

  const handleSelectProperty = useCallback(
    async (lpId: string) => {
      setSelectedPropertyId(lpId);
      updateLead(lead.id, { qualification_property_id: lpId } as any);

      const match = leadPropertyItems.find((i) => i.leadsProperty.id === lpId);
      const address = match?.property?.address ?? "Propiedad";
      const propUniqueId = match?.leadsProperty?.properties_unique_id ?? null;

      try {
        await fetch(`/api/leads/${encodeURIComponent(lead.leadsUniqueId)}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "MTP_UPDATE",
            properties_unique_id: propUniqueId,
            title: `Actualización en ${address}`,
            description: `La propiedad seleccionada para el estudio de solvencia ha cambiado a: ${address}.`,
          }),
        });
      } catch {
        /* best-effort logging */
      }

      await onLeadRefetch?.();
    },
    [lead.id, lead.leadsUniqueId, leadPropertyItems, updateLead, onLeadRefetch]
  );

  const activeItems = leadPropertyItems
    .filter(
      (i) => !MTP_EXIT_STATUS_IDS.includes((i.leadsProperty.current_status ?? "interesado_cualificado") as MtpStatusId)
    )
    .sort((a, b) =>
      getMtpRank(b.leadsProperty.current_status ?? "") - getMtpRank(a.leadsProperty.current_status ?? "")
    );
  const archivedItems = leadPropertyItems
    .filter((i) =>
      MTP_EXIT_STATUS_IDS.includes((i.leadsProperty.current_status ?? "") as MtpStatusId)
    )
    .sort((a, b) => {
      const dateA = a.leadsProperty.updated_at ?? a.leadsProperty.created_at;
      const dateB = b.leadsProperty.updated_at ?? b.leadsProperty.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  // For phases 3+: identify the primary (highest-ranked) MTP
  const { primaryItem, secondaryActiveItems } = useMemo(() => {
    if (isPhase1or2 || activeItems.length === 0) {
      return { primaryItem: null, secondaryActiveItems: activeItems };
    }

    let best = activeItems[0];
    let bestRank = getMtpRank(best.leadsProperty.current_status ?? "");

    for (let i = 1; i < activeItems.length; i++) {
      const rank = getMtpRank(activeItems[i].leadsProperty.current_status ?? "");
      if (rank > bestRank) {
        bestRank = rank;
        best = activeItems[i];
      }
    }

    const others = activeItems.filter((item) => item.leadsProperty.id !== best.leadsProperty.id);
    return { primaryItem: best, secondaryActiveItems: others };
  }, [isPhase1or2, activeItems]);

  // MTPs in recogiendo_informacion for the property selection section
  const recogiendoItems = useMemo(
    () => activeItems.filter((i) => i.leadsProperty.current_status === "recogiendo_informacion"),
    [activeItems]
  );

  // Auto-set qualification_property_id when there's exactly one recogiendo item and no saved selection
  const autoSetDone = useRef(false);
  if (
    isRecogiendoInformacion &&
    !autoSetDone.current &&
    !selectedPropertyId &&
    recogiendoItems.length > 0
  ) {
    autoSetDone.current = true;
    const defaultId = recogiendoItems[0].leadsProperty.id;
    setSelectedPropertyId(defaultId);
    updateLead(lead.id, { qualification_property_id: defaultId } as any);
  }

  // Resolve the selected property: explicit DB/state selection > first recogiendo item > primaryItem
  const selectedItem = useMemo(() => {
    if (selectedPropertyId) {
      const found = recogiendoItems.find((i) => i.leadsProperty.id === selectedPropertyId);
      if (found) return found;
    }
    return recogiendoItems[0] ?? primaryItem;
  }, [selectedPropertyId, recogiendoItems, primaryItem]);

  // --- Live formData state for the progress widget ---
  const [liveFormData, setLiveFormData] = useState<Record<string, unknown>>(
    () => buildFormDataFromLead(lead)
  );

  const mergedFormData = {
    ...liveFormData,
    ...buildFormDataFromEmploymentLead(lead),
    "selected-property.has_selected_property": selectedItem ? "yes" : undefined,
  };

  const hasVisitScheduled = useMemo(() => {
    const VISIT_MIN_RANK = MTP_STATUS_RANK.visita_agendada;
    return activeItems.some(
      (i) => getMtpRank(i.leadsProperty.current_status ?? "") >= VISIT_MIN_RANK
    );
  }, [activeItems]);

  const hasRentalProcessStarted = useMemo(() => {
    const RECOGIENDO_MIN_RANK = MTP_STATUS_RANK.recogiendo_informacion;
    return activeItems.some(
      (i) => getMtpRank(i.leadsProperty.current_status ?? "") >= RECOGIENDO_MIN_RANK
    );
  }, [activeItems]);

  const phase1FormData = useMemo<Record<string, unknown>>(() => ({
    "mtp-visit-scheduled.has_visit_scheduled": hasVisitScheduled ? "yes" : undefined,
    "mtp-rental-process.has_rental_process_started": hasRentalProcessStarted ? "yes" : undefined,
  }), [hasVisitScheduled, hasRentalProcessStarted]);

  const isPersonalComplete = isSectionComplete(liveFormData);
  const isEmploymentComplete = isEmploymentFinancialComplete(mergedFormData);

  const handleFieldsChange = useCallback((data: LeadPersonalInfoLiveData) => {
    setLiveFormData((prev) => ({
      ...prev,
      ...buildFormDataFromLive(data),
    }));
  }, []);

  // ---------- Shared renders ----------

  const renderPropertyCard = useCallback(
    (item: typeof leadPropertyItems[0]) => (
      <LeadPropertyCard
        key={item.leadsProperty.id}
        leadsProperty={item.leadsProperty}
        property={item.property}
        workSection={
          <LeadPropertyCardWorkSection
            leadsProperty={item.leadsProperty}
            onUpdated={refetchLeadProperties}
            onTransition={handleTransition}
            onReagendar={() =>
              setModalReagendar({
                lpId: item.leadsProperty.id,
                address: item.property.address || "Propiedad",
                visitDate: item.leadsProperty.visit_date,
                fromStatus: item.leadsProperty.current_status ?? undefined,
              })
            }
            onCancelarVisita={() =>
              setModalCancelarVisita({
                lpId: item.leadsProperty.id,
                address: item.property.address || "Propiedad",
              })
            }
            onDescartar={() =>
              setModalDescarte({
                lpId: item.leadsProperty.id,
                address: item.property.address || "Propiedad",
              })
            }
          />
        }
        onDescartar={() =>
          setModalDescarte({
            lpId: item.leadsProperty.id,
            address: item.property.address || "Propiedad",
          })
        }
        onRegistroActividad={() =>
          setModalRegistro({
            leadsProperty: item.leadsProperty,
            address: item.property.address || "Propiedad",
          })
        }
      />
    ),
    [refetchLeadProperties, handleTransition]
  );

  const renderEmptyStateIC = useCallback(
    () => (
      <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Search className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Interesado cualificado sin propiedades activas
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Este interesado está cualificado pero no tiene viviendas en gestión.
            Explora la Cartera de Propiedades para presentarle nuevas opciones que
            se ajusten a sus necesidades.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          {onTabChange && (
            <Button size="sm" onClick={() => onTabChange("cartera")}>
              <Search className="h-4 w-4" />
              Explorar Cartera
            </Button>
          )}
          {onOpenClosureModal && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
              onClick={() => onOpenClosureModal("perdido")}
            >
              <UserX className="h-4 w-4" />
              Marcar como Perdido
            </Button>
          )}
        </div>
      </div>
    ),
    [onTabChange, onOpenClosureModal]
  );

  const renderPropertiesSection = useCallback(
    (items: typeof activeItems, title: string) => (
      <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {!leadPropertiesLoading && (
            <span className="text-xs text-muted-foreground bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-700)] px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {leadPropertiesLoading ? (
          <div className="flex justify-center py-8">
            <RentalsHomeLoader />
          </div>
        ) : items.length === 0 ? (
          lead.currentPhase === "Interesado Cualificado"
            ? renderEmptyStateIC()
            : (
              <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay propiedades en gestión activa.
                </p>
              </div>
            )
        ) : (
          items.map(renderPropertyCard)
        )}
      </div>
    ),
    [leadPropertiesLoading, renderPropertyCard, lead.currentPhase, renderEmptyStateIC]
  );

  const renderArchive = useCallback(
    () =>
      archivedItems.length > 0 ? (
        <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Archivo de Propiedades (Descartadas / En Espera / No Disponibles)
          </h3>
          <div className="space-y-3">
            {archivedItems.map(({ leadsProperty, property }) => {
              const st = leadsProperty.current_status ?? "";
              const canRecover = st !== "no_disponible" && st !== "interesado_perdido" && st !== "interesado_rechazado" && !PHASES_RENTAL_IN_PROGRESS.includes(lead.currentPhase);
              return (
              <LeadPropertyCard
                key={leadsProperty.id}
                leadsProperty={leadsProperty}
                property={property}
                workSection={
                  <LeadPropertyCardWorkArchived
                    currentStatus={st}
                    exitReason={leadsProperty.exit_reason}
                    exitComments={leadsProperty.exit_comments}
                  />
                }
                onRegistroActividad={() =>
                  setModalRegistro({
                    leadsProperty,
                    address: property.address || "Propiedad",
                  })
                }
                onRecuperar={
                  canRecover
                    ? async () => {
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
                      }
                    : undefined
                }
              />
              );
            })}
          </div>
        </div>
      ) : null,
    [archivedItems, transition, refetchLeadProperties, onLeadRefetch]
  );

  const renderCartera = useCallback(
    () => (
      <OtrasPropiedadesCartera
        leadsUniqueId={lead.leadsUniqueId}
        leadPropertyItems={leadPropertyItems}
        onPropertyAdded={refetchLeadProperties}
      />
    ),
    [lead.leadsUniqueId, leadPropertyItems, refetchLeadProperties]
  );

  // ---------- View: Cartera de Propiedades tab ----------

  const renderCarteraView = useCallback(
    () => (
      <div className="space-y-4 md:space-y-6">
        {renderCartera()}
      </div>
    ),
    [renderCartera]
  );

  // ---------- View: Archivo de Propiedades tab ----------

  const renderArchivoView = useCallback(
    () => (
      <div className="space-y-4 md:space-y-6">
        <div className="rounded-[var(--vistral-radius-xl)] border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Archivo de Propiedades
            </h3>
            {!leadPropertiesLoading && (
              <span className="text-xs text-muted-foreground bg-[var(--vistral-gray-100)] dark:bg-[var(--vistral-gray-700)] px-2 py-0.5 rounded-full">
                {archivedItems.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Las viviendas descartadas, en espera o que ya no estén disponibles para este cliente aparecerán aquí.
          </p>
          {leadPropertiesLoading ? (
            <div className="flex justify-center py-8">
              <RentalsHomeLoader />
            </div>
          ) : archivedItems.length === 0 ? (
            <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay propiedades archivadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedItems.map(({ leadsProperty, property }) => {
                const st = leadsProperty.current_status ?? "";
                const canRecover = st !== "no_disponible" && st !== "interesado_perdido" && st !== "interesado_rechazado" && !PHASES_RENTAL_IN_PROGRESS.includes(lead.currentPhase);
                return (
                <LeadPropertyCard
                  key={leadsProperty.id}
                  leadsProperty={leadsProperty}
                  property={property}
                  workSection={
                    <LeadPropertyCardWorkArchived
                      currentStatus={st}
                      exitReason={leadsProperty.exit_reason}
                      exitComments={leadsProperty.exit_comments}
                    />
                  }
                  onRegistroActividad={() =>
                    setModalRegistro({
                      leadsProperty,
                      address: property.address || "Propiedad",
                    })
                  }
                  onRecuperar={
                    canRecover
                      ? async () => {
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
                        }
                      : undefined
                  }
                />
                );
              })}
            </div>
          )}
        </div>
      </div>
    ),
    [archivedItems, leadPropertiesLoading, transition, refetchLeadProperties, onLeadRefetch]
  );

  // ---------- View: Gestión de Propiedades tab (Recogiendo Información) ----------

  const renderGestionView = useCallback(
    () => (
      <div className="space-y-4 md:space-y-6">
        {renderPropertiesSection(activeItems, "Gestión de Propiedades")}
      </div>
    ),
    [renderPropertiesSection, activeItems]
  );

  // ---------- View: Phases 1-2 workspace ----------

  const phase1Sections = lead.currentPhase === "Interesado Cualificado"
    ? LEAD_PHASE1_SECTIONS
    : lead.currentPhase === "Visita Agendada"
      ? LEAD_PHASE2_SECTIONS
      : [];

  const renderPropertyManagementView = useCallback(
    (items: typeof activeItems, showProgress: boolean) => (
      <div className="space-y-4 md:space-y-6">
        {showProgress && (
          <ProgressOverviewWidget
            sections={phase1Sections}
            formData={phase1FormData}
          />
        )}
        <div className="space-y-8">
          {renderPropertiesSection(items, "Gestión de Propiedades")}
        </div>
      </div>
    ),
    [renderPropertiesSection, phase1Sections, phase1FormData]
  );

  // ---------- View: Phases 3+ workspace ----------

  const isPropertySelected = !!selectedItem;
  const isFinaerBlocked = !isPropertySelected || !isPersonalComplete || !isEmploymentComplete;

  const handleFinaerConfirm = useCallback(async () => {
    if (!selectedItem) return;
    try {
      const result = await transition(
        selectedItem.leadsProperty.id,
        "calificacion_en_curso",
        "advance",
        { sent_to_finaer_at: new Date().toISOString() },
        true
      );
      if (result?.completed) {
        toast.success("Enviado a Finaer — Calificación en Curso");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar a Finaer");
    }
  }, [selectedItem, transition]);

  const otherActiveCountForCascade = useMemo(() => {
    if (!selectedItem) return 0;
    return activeItems.filter(
      (i) =>
        i.leadsProperty.id !== selectedItem.leadsProperty.id &&
        ["interesado_cualificado", "visita_agendada", "pendiente_de_evaluacion", "esperando_decision", "recogiendo_informacion"].includes(
          i.leadsProperty.current_status ?? ""
        )
    ).length;
  }, [activeItems, selectedItem]);

  const renderPhase3PlusWorkspace = useCallback(() => (
    <div className="space-y-4 md:space-y-6">
      <ProgressOverviewWidget
        sections={isRecogiendoInformacion ? LEAD_PHASE3_SECTIONS : []}
        formData={isRecogiendoInformacion ? mergedFormData : {}}
      />

      {isRecogiendoInformacion ? (
        <>
          {/* 1. Propiedad Seleccionada */}
          <LeadSelectedPropertySection
            selectedItem={selectedItem}
            recogiendoItems={recogiendoItems}
            loading={leadPropertiesLoading}
            onSelectProperty={handleSelectProperty}
            onTransition={handleTransition}
            onRefetch={refetchLeadProperties}
            onDescartar={(lpId, address) => setModalDescarte({ lpId, address })}
            onRegistroActividad={(lp, address) => setModalRegistro({ leadsProperty: lp, address })}
          />

          {/* 2. Información Personal */}
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

          {/* 3. Información Laboral y Financiera */}
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

          {/* 4. Confirmación de Envío a Finaer */}
          <LeadFinaerConfirmationSection
            leadName={lead.name}
            propertyAddress={selectedItem?.property.address || "Propiedad"}
            isBlocked={isFinaerBlocked}
            isComplete={false}
            onConfirmYes={() => setModalFinaer(true)}
          />
        </>
      ) : (
        <>
          {primaryItem && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                Propiedad Seleccionada
              </h3>
              {renderPropertyCard(primaryItem)}
            </div>
          )}

          {!primaryItem && !leadPropertiesLoading && (
            <div className="rounded-[var(--vistral-radius-lg)] border border-dashed border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] bg-[var(--vistral-gray-50)] dark:bg-[var(--vistral-gray-900)] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay propiedad seleccionada.
              </p>
            </div>
          )}

          {leadPropertiesLoading && (
            <div className="flex justify-center py-8">
              <RentalsHomeLoader />
            </div>
          )}
        </>
      )}
    </div>
  ), [
    isRecogiendoInformacion, mergedFormData, primaryItem, selectedItem, recogiendoItems,
    leadPropertiesLoading, renderPropertyCard, lead, isFinaerBlocked,
    handleFieldsChange, isPersonalComplete, isEmploymentComplete, onLeadRefetch,
    handleTransition, refetchLeadProperties,
  ]);

  // ---------- Main render ----------

  const mainContent = (() => {
    if (activeView === "cartera") {
      return renderCarteraView();
    }

    if (activeView === "archivo") {
      return renderArchivoView();
    }

    if (activeView === "gestion") {
      return renderGestionView();
    }

    if (isPhase1or2) {
      return renderPropertyManagementView(activeItems, true);
    }

    return renderPhase3PlusWorkspace();
  })();

  return (
    <>
      {mainContent}

      {/* Modals — always rendered regardless of active view */}
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
      {modalReagendar && (
        <MtpModalReagendar
          open={!!modalReagendar}
          onOpenChange={(open) => !open && setModalReagendar(null)}
          propertyAddress={modalReagendar.address}
          currentVisitDate={modalReagendar.visitDate}
          onConfirm={async (newVisitDate) => {
            if (modalReagendar.fromStatus === "pendiente_de_evaluacion") {
              await transition(modalReagendar.lpId, "visita_agendada", "revert", {
                visit_date: newVisitDate,
                visit_completed: null,
              });
            } else {
              await updateLeadsProperty(modalReagendar.lpId, {
                visit_date: newVisitDate,
                current_status: "visita_agendada",
              });
            }
            setModalReagendar(null);
            await refetchLeadProperties();
            if (modalReagendar.fromStatus === "pendiente_de_evaluacion") {
              await onLeadRefetch?.();
            }
          }}
        />
      )}
      {modalCancelarVisita && (
        <MtpModalCancelarVisita
          open={!!modalCancelarVisita}
          onOpenChange={(open) => !open && setModalCancelarVisita(null)}
          propertyAddress={modalCancelarVisita.address}
          onConfirm={async (exitReason, exitComments) => {
            await transition(modalCancelarVisita.lpId, "descartada", "advance", {
              exit_reason: exitReason,
              exit_comments: exitComments,
            });
            setModalCancelarVisita(null);
            await refetchLeadProperties();
            await onLeadRefetch?.();
          }}
        />
      )}
      {modalRegistro && (
        <MtpModalRegistroActividad
          open={!!modalRegistro}
          onOpenChange={(open) => !open && setModalRegistro(null)}
          leadsProperty={modalRegistro.leadsProperty}
          propertyAddress={modalRegistro.address}
          onRevert={async (targetStatus) => {
            await handleTransition(modalRegistro.leadsProperty.id, targetStatus, "revert", {});
            setModalRegistro(null);
          }}
        />
      )}
      <MtpModalFinaerConfirmation
        open={modalFinaer}
        onOpenChange={setModalFinaer}
        propertyAddress={selectedItem?.property.address || "Propiedad"}
        otherActiveCount={otherActiveCountForCascade}
        onConfirm={handleFinaerConfirm}
        onCancel={() => setModalFinaer(false)}
      />
    </>
  );
}
