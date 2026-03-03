"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarL2 } from "@/components/layout/navbar-l2";
import { PropertyTabs } from "@/components/layout/property-tabs";
import { LeadTasksTab } from "@/components/rentals/lead-tasks-tab";
import { LeadSummaryTab } from "@/components/rentals/lead-summary-tab";
import { LeadGestionRegistroTab } from "@/components/rentals/lead-gestion-registro-tab";
import { LeadResolutionTab } from "@/components/rentals/lead-resolution-tab";
import { LeadClosureModal, type LeadClosureType } from "@/components/rentals/lead-closure-modal";
import { LeadRightSidebar } from "@/components/rentals/lead-right-sidebar";
import { LeadContactCard } from "@/components/rentals/lead-contact-card";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { Button } from "@/components/ui/button";
import { useLead } from "@/hooks/use-lead";
import { TrendingDown, Ban } from "lucide-react";
import { toast } from "sonner";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { lead: leadRow, loading: isLoading, error: loadError, refetch: refetchLead } = useLead(leadId);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventsRefetchRef = useRef<(() => Promise<void> | void) | null>(null);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureType, setClosureType] = useState<LeadClosureType>("perdido");

  const handleLeadRefetch = useCallback(async () => {
    await refetchLead();
    await eventsRefetchRef.current?.();
  }, [refetchLead]);

  const handleOpenClosureModal = useCallback((type: LeadClosureType) => {
    setClosureType(type);
    setClosureModalOpen(true);
  }, []);

  const handleCloseLead = useCallback(async (exitReason: string, exitComments: string) => {
    const res = await fetch(`/api/leads/${leadRow?.leads_unique_id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        closure_type: closureType,
        exit_reason: exitReason,
        exit_comments: exitComments || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Error al cerrar el interesado");
    }
    toast.success(
      closureType === "perdido"
        ? "Interesado marcado como Perdido"
        : "Interesado marcado como Rechazado"
    );
    await handleLeadRefetch();
  }, [leadRow?.leads_unique_id, closureType, handleLeadRefetch]);

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
        exitReason: leadRow.exit_reason ?? null,
        exitComments: leadRow.exit_comments ?? null,
        exitedAt: leadRow.exited_at ?? null,
      }
    : null;

  const PHASES_1_2 = ["Interesado Cualificado", "Visita Agendada"];
  const PHASE_RECOGIENDO = "Recogiendo Información";
  const PHASE_ACEPTADO = "Interesado Aceptado";
  const TERMINAL_PHASES = ["Interesado Perdido", "Interesado Rechazado"];
  const isTerminal = TERMINAL_PHASES.includes(currentPhase);
  const canClose = !isTerminal && currentPhase !== PHASE_ACEPTADO;

  const tabs = (() => {
    if (isTerminal) {
      return [
        { id: "resolucion", label: "Resolución", badge: undefined },
        { id: "archivo", label: "Archivo de Propiedades", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    if (currentPhase === PHASE_ACEPTADO) {
      return [
        { id: "registro", label: "Registro de Gestión", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    if (currentPhase === PHASE_RECOGIENDO) {
      return [
        { id: "tasks", label: "Espacio de trabajo", badge: undefined },
        { id: "gestion", label: "Gestión de Propiedades", badge: undefined },
        { id: "cartera", label: "Cartera de Propiedades", badge: undefined },
        { id: "archivo", label: "Archivo de Propiedades", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    if (PHASES_1_2.includes(currentPhase)) {
      return [
        { id: "tasks", label: "Espacio de trabajo", badge: undefined },
        { id: "cartera", label: "Cartera de Propiedades", badge: undefined },
        { id: "archivo", label: "Archivo de Propiedades", badge: undefined },
        { id: "summary", label: "Interesado", badge: undefined },
      ];
    }
    return [
      { id: "tasks", label: "Espacio de trabajo", badge: undefined },
      { id: "archivo", label: "Archivo de Propiedades", badge: undefined },
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
          rightContent={canClose ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                onClick={() => handleOpenClosureModal("perdido")}
              >
                <TrendingDown className="h-4 w-4 mr-1.5" />
                Interesado Perdido
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                onClick={() => handleOpenClosureModal("rechazado")}
              >
                <Ban className="h-4 w-4 mr-1.5" />
                Interesado Rechazado
              </Button>
            </div>
          ) : undefined}
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
                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                  currentPhase === "Interesado Perdido"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    : currentPhase === "Interesado Rechazado"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                }`}>
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
                  {(effectiveTab === "tasks" || effectiveTab === "gestion" || effectiveTab === "cartera" || effectiveTab === "archivo") && (
                    <LeadTasksTab
                      lead={lead}
                      onLeadRefetch={handleLeadRefetch}
                      activeView={effectiveTab as "tasks" | "gestion" | "cartera" | "archivo"}
                      onTabChange={handleTabChange}
                      onOpenClosureModal={canClose ? handleOpenClosureModal : undefined}
                    />
                  )}
                  {effectiveTab === "resolucion" && (
                    <LeadResolutionTab
                      currentPhase={lead.currentPhase}
                      exitReason={lead.exitReason}
                      exitComments={lead.exitComments}
                      exitedAt={lead.exitedAt}
                    />
                  )}
                  {effectiveTab === "registro" && <LeadGestionRegistroTab lead={lead} />}
                  {effectiveTab === "summary" && <LeadSummaryTab lead={lead} />}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-4 relative">
                <LeadContactCard
                  name={lead.name}
                  phone={lead.phone}
                  email={lead.email}
                />
                <LeadRightSidebar leadId={lead.leadsUniqueId} refetchRef={eventsRefetchRef} />
              </div>
        </div>
        </div>
        </div>
      </div>

      <LeadClosureModal
        type={closureType}
        open={closureModalOpen}
        onOpenChange={setClosureModalOpen}
        onConfirm={handleCloseLead}
      />
    </div>
  );
}
