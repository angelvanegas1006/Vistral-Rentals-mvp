"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarL2 } from "@/components/layout/navbar-l2";
import { PropertyTabs } from "@/components/layout/property-tabs";
import { LeadTasksTab } from "@/components/rentals/lead-tasks-tab";
import { LeadSummaryTab } from "@/components/rentals/lead-summary-tab";
import { LeadGestionRegistroTab } from "@/components/rentals/lead-gestion-registro-tab";
import { LeadRightSidebar } from "@/components/rentals/lead-right-sidebar";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { Button } from "@/components/ui/button";
import { useLead } from "@/hooks/use-lead";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { lead: leadRow, loading: isLoading, error: loadError, refetch: refetchLead } = useLead(leadId);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rawPhase = leadRow?.current_phase ?? "Interesado Cualificado";
  const phaseMap: Record<string, string> = {
    "Calificación aprobada": "Interesado Presentado",
    "Inquilino presentado": "Interesado Presentado",
    "Inquilino aceptado": "Interesado Aceptado",
    "Perfil cualificado": "Interesado Cualificado",
    "Interesado cualificado": "Interesado Cualificado",
    "Visita agendada": "Visita Agendada",
    "Recogiendo información": "Recogiendo Información",
    "Calificación en curso": "Calificación en Curso",
    "Interesado presentado": "Interesado Presentado",
    "Interesado aceptado": "Interesado Aceptado",
    "Interesado perdido": "Interesado Perdido",
    "Interesado rechazado": "Interesado Rechazado",
  };
  const currentPhase = phaseMap[rawPhase] ?? rawPhase;

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
        employment_contract_type: leadRow.employment_contract_type ?? undefined,
        laboral_financial_docs: leadRow.laboral_financial_docs ?? undefined,
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

  const PHASES_1_2 = ["Interesado Cualificado", "Visita Agendada"];
  const PHASE_ACEPTADO = "Interesado Aceptado";

  const tabs = (() => {
    if (currentPhase === PHASE_ACEPTADO) {
      return [
        { id: "registro", label: "Registro de Gestión", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    if (PHASES_1_2.includes(currentPhase)) {
      return [
        { id: "tasks", label: "Espacio de trabajo", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    return [
      { id: "tasks", label: "Espacio de trabajo", badge: undefined },
      { id: "management", label: "Gestión de Propiedades", badge: undefined },
      { id: "summary", label: "Interesado", badge: undefined },
    ];
  })();

  const validTabIds = tabs.map((t) => t.id);
  const effectiveTab = validTabIds.includes(activeTab) ? activeTab : validTabIds[0];

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
                activeTab={effectiveTab}
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
                  {(effectiveTab === "tasks" || effectiveTab === "management") && (
                    <LeadTasksTab lead={lead} onLeadRefetch={refetchLead} activeView={effectiveTab as "tasks" | "management"} />
                  )}
                  {effectiveTab === "registro" && <LeadGestionRegistroTab lead={lead} />}
                  {effectiveTab === "summary" && <LeadSummaryTab lead={lead} />}
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
