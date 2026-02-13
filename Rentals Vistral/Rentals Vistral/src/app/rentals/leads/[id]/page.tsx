"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarL2 } from "@/components/layout/navbar-l2";
import { PropertyTabs } from "@/components/layout/property-tabs";
import { LeadTasksTab } from "@/components/rentals/lead-tasks-tab";
import { LeadSummaryTab } from "@/components/rentals/lead-summary-tab";
import { LeadPropertiesTab } from "@/components/rentals/lead-properties-tab";
import { LeadRightSidebar } from "@/components/rentals/lead-right-sidebar";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { Button } from "@/components/ui/button";
import { LEAD_PHASE_IDS, LEAD_PHASE_TITLES } from "@/components/rentals/rentals-leads-kanban-board";
import { useLead } from "@/hooks/use-lead";
import { useUpdateLead } from "@/hooks/use-update-lead";
import { toast } from "sonner";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { lead: leadRow, loading: isLoading, error: loadError } = useLead(leadId);
  const { updateLead } = useUpdateLead();
  const [activeTab, setActiveTab] = useState("tasks");
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rawPhase = leadRow?.current_phase ?? "Perfil cualificado";
  const currentPhase =
    rawPhase === "Calificación aprobada" ? "Inquilino presentado" : rawPhase;

  const lead = leadRow
    ? {
        id: leadRow.id,
        leadsUniqueId: leadRow.leads_unique_id,
        name: leadRow.name ?? "",
        phone: leadRow.phone ?? "",
        email: leadRow.email ?? undefined,
        zone: leadRow.zone ?? undefined,
        currentPhase,
        interestedProperties: [],
        occupant_count: leadRow.number_of_occupants ?? undefined,
        move_in_timeframe: leadRow.move_in_timeframe ?? undefined,
        lease_duration_preference: leadRow.lease_duration_preference ?? undefined,
        employment_status: leadRow.employment_status ?? undefined,
        job_title: leadRow.job_title ?? undefined,
        monthly_net_income: leadRow.monthly_net_income ?? undefined,
        has_guarantor: leadRow.has_guarantor ?? undefined,
        nationality: leadRow.nationality ?? undefined,
        identityDocType: leadRow.identity_doc_type ?? undefined,
        identityDocNumber: leadRow.identity_doc_number ?? undefined,
        identityDocUrl: leadRow.identity_doc_url ?? undefined,
        dateOfBirth: leadRow.date_of_birth ?? undefined,
        age: leadRow.age ?? undefined,
        familyProfile: leadRow.family_profile ?? undefined,
        childrenCount: leadRow.children_count ?? undefined,
        petInfo: leadRow.pet_info ?? undefined,
      }
    : null;

  // Orden de fases para calcular "siguiente fase"
  const currentPhaseIndex = lead
    ? LEAD_PHASE_IDS.findIndex((id) => LEAD_PHASE_TITLES[id] === lead.currentPhase)
    : -1;
  const canAdvancePhase =
    lead != null && currentPhaseIndex >= 0 && currentPhaseIndex < LEAD_PHASE_IDS.length - 1;
  const nextPhaseLabel = canAdvancePhase
    ? `Avanzar a ${LEAD_PHASE_TITLES[LEAD_PHASE_IDS[currentPhaseIndex + 1]]}`
    : undefined;

  const handleNextPhase = async () => {
    if (!canAdvancePhase || !lead) return;
    const nextPhaseId = LEAD_PHASE_IDS[currentPhaseIndex + 1];
    const nextPhaseName = LEAD_PHASE_TITLES[nextPhaseId];
    try {
      setIsSaving(true);
      const success = await updateLead(leadId, {
        current_phase: nextPhaseName,
        days_in_phase: 0,
      });
      if (success) {
        toast.success(`Interesado avanzado a: ${nextPhaseName}`);
        router.refresh();
      } else {
        toast.error("Error al avanzar a la siguiente fase");
      }
    } catch {
      toast.error("Error al avanzar a la siguiente fase");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "tasks", label: "Espacio de trabajo", badge: undefined },
    { id: "summary", label: "Interesado", badge: undefined },
    { id: "properties", label: "Propiedades de interés", badge: undefined },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setShowFooter(false);
    } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
      setShowFooter(true);
    }
    setLastScrollY(currentScrollY);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <RentalsHomeLoader />
        </div>
      </div>
    );
  }

  if (loadError || !lead) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            {loadError ? "Error al cargar el interesado" : "Interesado no encontrado"}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/rentals/leads")}
          >
            Volver al Kanban de Interesados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - mismo estilo que detalle de propiedad */}
        <NavbarL2
          title="Detalles del interesado"
          backHref="/rentals/leads"
          onNextPhase={handleNextPhase}
          isSaving={isSaving}
          canAdvancePhase={canAdvancePhase}
          nextPhaseLabel={nextPhaseLabel}
        />

        {/* Contenido principal - misma estructura que propiedad */}
        <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#111827] scrollbar-stable">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
            {/* Nombre del interesado, ID y fase */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-2">
                {lead.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                <span>ID Interesado: {lead.leadsUniqueId}</span>
                <span className="text-[#E5E7EB] dark:text-[#374151]">|</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold uppercase">
                  {lead.currentPhase}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <PropertyTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Grid: contenido + sidebar derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
              <div className="lg:col-span-2 space-y-8 relative z-20">
                <div
                  ref={scrollContainerRef}
                  className="pb-24"
                  onScroll={handleScroll}
                >
                  {activeTab === "tasks" && <LeadTasksTab lead={lead} />}
                  {activeTab === "summary" && <LeadSummaryTab lead={lead} />}
                  {activeTab === "properties" && (
                    <LeadPropertiesTab lead={lead} />
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8 relative">
                <LeadRightSidebar />
              </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
