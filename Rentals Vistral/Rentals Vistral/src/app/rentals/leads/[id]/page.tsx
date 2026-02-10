"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarL2 } from "@/components/layout/navbar-l2";
import { PropertyTabs } from "@/components/layout/property-tabs";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { LeadTasksTab } from "@/components/rentals/lead-tasks-tab";
import { LeadSummaryTab } from "@/components/rentals/lead-summary-tab";
import { LeadPropertiesTab } from "@/components/rentals/lead-properties-tab";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockLeadsColumns } from "@/components/rentals/rentals-leads-kanban-board";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [activeTab, setActiveTab] = useState("tasks");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Función helper para obtener el lead de los datos mock
  const getLeadFromMock = (id: string) => {
    const allLeads = mockLeadsColumns.flatMap((col) => col.leads);
    return allLeads.find((l) => l.id === id);
  };

  // Obtener datos del lead desde mock
  const mockLead = getLeadFromMock(leadId);

  // Mock lead data
  const lead = {
    id: leadId,
    name: mockLead?.name || "Lead Desconocido",
    phone: mockLead?.phone || "",
    email: mockLead?.email || "",
    zone: mockLead?.zone || "",
    currentPhase: mockLead?.currentPhase || "Sin Contactar",
    interestedProperties: mockLead?.interestedProperty
      ? [mockLead.interestedProperty]
      : [],
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: "tasks", label: "Tareas", badge: undefined },
    { id: "summary", label: "Resumen Lead", badge: undefined },
    { id: "properties", label: "Propiedades interesado", badge: undefined },
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
        <RentalsSidebar />
        <div className="flex flex-1 items-center justify-center">
          <RentalsHomeLoader />
        </div>
      </div>
    );
  }

  // Solo mostrar error si hay un error real, no si el lead no está en mock (usaremos valores por defecto)
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <RentalsSidebar />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Error al cargar el lead
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
      <RentalsSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <NavbarL2
          title={lead.name}
          subtitle={`ID: ${lead.id} · Fase: ${lead.currentPhase}`}
          onBack={() => router.push("/rentals/leads")}
        />

        {/* Tabs */}
        <PropertyTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content + Sidebar */}
        <div className="flex flex-1 overflow-hidden pt-2">
          {/* Main Content */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 bg-[var(--vistral-gray-50)] dark:bg-[#000000] pb-24"
            onScroll={handleScroll}
          >
            <div className="max-w-4xl mx-auto">
              {activeTab === "tasks" && <LeadTasksTab lead={lead} />}
              {activeTab === "summary" && <LeadSummaryTab lead={lead} />}
              {activeTab === "properties" && (
                <LeadPropertiesTab lead={lead} />
              )}
            </div>
          </div>
        </div>

        {/* Footer Sticky Mobile */}
        {hasUnsavedChanges && (
          <div
            className={cn(
              "fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[var(--vistral-gray-900)] px-4 py-4 md:hidden border-t border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out",
              showFooter ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
              <Button
                className="w-full flex items-center justify-center rounded-lg bg-[var(--vistral-blue-600)] hover:bg-[var(--vistral-blue-700)] text-white h-12 text-base font-medium"
                onClick={() => setHasUnsavedChanges(false)}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center rounded-lg h-12 text-base font-medium"
                onClick={() => setHasUnsavedChanges(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
