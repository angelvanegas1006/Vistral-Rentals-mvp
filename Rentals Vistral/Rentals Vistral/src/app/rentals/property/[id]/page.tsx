"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { NavbarL2 } from "@/components/layout/navbar-l2";
import { PropertyTabs } from "@/components/layout/property-tabs";
import { PropertyFormProvider, usePropertyForm } from "@/components/rentals/property-form-context";
import { PropertySummaryTab } from "@/components/rentals/property-summary-tab";
import { RentalSummaryTab } from "@/components/rentals/rental-summary-tab";
import { PropertyTasksTab } from "@/components/rentals/property-tasks-tab";
import { PropertyStatusTab } from "@/components/rentals/property-status-tab";
import { PropertyDocumentsTab } from "@/components/rentals/property-documents-tab";
import { PropertyNotesTab } from "@/components/rentals/property-notes-tab";
import { TenantSummaryTab } from "@/components/rentals/tenant-summary-tab";
import { PropertyRightSidebar } from "@/components/rentals/property-right-sidebar";
import { RentalsHomeLoader } from "@/components/rentals/rentals-home-loader";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateProperty } from "@/hooks/use-update-property";

// Importar hook de Supabase y mapper
import { useProperty } from "@/hooks/use-property";
import { mapPropertyFromSupabase } from "@/lib/supabase/mappers";
// Importar datos mock del kanban como fallback
import { mockColumnsCaptacion, mockColumnsPortfolio } from "@/components/rentals/rentals-kanban-board";
import type { PropheroSectionReviews } from "@/lib/supabase/types";

// Global Phase Sequence (Order is critical - continuous lifecycle)
const GLOBAL_PHASE_SEQUENCE = [
  "Viviendas Prophero", // Index 0
  "Listo para Alquilar", // Index 1
  "Publicado", // Index 2
  "Inquilino aceptado", // Index 3
  "Pendiente de trámites", // Index 4 --- Transition to Kanban 2 ---
  "Alquilado", // Index 5
  "Actualización de Renta (IPC)", // Index 6
  "Gestión de Renovación", // Index 7
  "Finalización y Salida", // Index 8
] as const;

// Valid tab IDs for URL synchronization
const VALID_TABS = ["tasks", "property-summary", "status", "documents", "notes", "tenant-summary", "rental-summary"] as const;

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  
  // Get initial tab from URL query parameter, default to "tasks"
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get("tab");
      return tabFromUrl && VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) ? tabFromUrl : "tasks";
    }
    return "tasks";
  };
  
  // Todos los hooks deben estar al principio, antes de cualquier return condicional
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado local para propheroSectionReviews que se actualiza en tiempo real
  const [propheroSectionReviews, setPropheroSectionReviews] = useState<PropheroSectionReviews | undefined>(undefined);
  const previousPropheroReviewsRef = useRef<PropheroSectionReviews | undefined>(undefined);
  
  // Estado para progreso de fase 2
  const [phase2Progress, setPhase2Progress] = useState<number>(0);
  
  // Estado para progreso de fase 4 (Inquilino aceptado)
  const [phase4Progress, setPhase4Progress] = useState<number>(0);
  
  // Función estabilizada para actualizar propheroSectionReviews
  // Solo actualiza si los valores realmente cambiaron para evitar re-renderizados innecesarios
  const handlePropheroReviewsChange = useCallback((reviews: PropheroSectionReviews | undefined) => {
    // Comparar valores relevantes antes de actualizar
    const previous = previousPropheroReviewsRef.current;
    
    // Si ambos son undefined, no hacer nada
    if (!reviews && !previous) return;
    
    // Si uno es undefined y el otro no, actualizar
    if (!reviews || !previous) {
      previousPropheroReviewsRef.current = reviews;
      setPropheroSectionReviews(reviews);
      return;
    }
    
    // Comparar los valores de isCorrect de todas las secciones
    const requiredSectionIds = [
      "property-management-info",
      "technical-documents",
      "legal-documents",
      "client-financial-info",
      "supplies-contracts",
      "supplies-bills",
      "home-insurance",
      "property-management",
    ];
    
    const hasChanged = requiredSectionIds.some((sectionId) => {
      const prevReview = previous[sectionId];
      const newReview = reviews[sectionId];
      const prevIsCorrect = prevReview?.isCorrect ?? null;
      const newIsCorrect = newReview?.isCorrect ?? null;
      return prevIsCorrect !== newIsCorrect;
    });
    
    // Solo actualizar si realmente cambió algo
    if (hasChanged) {
      previousPropheroReviewsRef.current = reviews;
      setPropheroSectionReviews(reviews);
    }
  }, []);
  
  // Refs para comunicación con PropheroTasks
  const submitCommentsRef = useRef<(() => void) | null>(null);
  const hasAnySectionWithNoRef = useRef<boolean>(false);
  const canSubmitCommentsRef = useRef<boolean>(false);
  
  // Estados locales para controlar visibilidad del botón en header
  const [hasAnySectionWithNo, setHasAnySectionWithNo] = useState(false);
  const [canSubmitComments, setCanSubmitComments] = useState(false);
  
  // Obtener datos de la propiedad desde Supabase
  const { property: supabaseProperty, loading: supabaseLoading, error: supabaseError } = useProperty(propertyId);
  
  // Hook para actualizar propiedad (debe estar antes de cualquier return condicional)
  const { updateProperty: updatePropertyHook } = useUpdateProperty();
  
  // Sync tab with URL query parameter on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Funciรณn helper para obtener la propiedad de los datos mock (fallback)
  const getPropertyFromMock = (id: string) => {
    const allProperties = [
      ...mockColumnsCaptacion.flatMap((col) => col.properties),
      ...mockColumnsPortfolio.flatMap((col) => col.properties),
    ];
    return allProperties.find((p) => p.property_unique_id === id);
  };

  const mockProperty = getPropertyFromMock(propertyId);

  // Mapear propiedad de Supabase o usar mock como fallback
  const property = supabaseProperty
    ? {
        ...mapPropertyFromSupabase(supabaseProperty),
        // Include economic properties for sidebar
        target_rent_price: supabaseProperty.target_rent_price ?? null,
        expected_yield: supabaseProperty.expected_yield ?? null,
        days_in_phase: supabaseProperty.days_in_phase ?? supabaseProperty.days_in_stage ?? null,
      }
    : mockProperty
    ? {
        property_unique_id: mockProperty.property_unique_id,
        address: mockProperty.address,
        city: mockProperty.city,
        daysInPhase: mockProperty.daysInPhase,
        currentPhase: mockProperty.currentPhase,
        target_rent_price: null,
        expected_yield: null,
        days_in_phase: mockProperty.daysInPhase,
      }
    : {
        property_unique_id: propertyId,
        address: "Calle Gran Vรญa 45, 3ยบ B",
        city: "Madrid",
        daysInPhase: 2,
        currentPhase: "Viviendas Prophero",
        target_rent_price: null,
        expected_yield: null,
        days_in_phase: 2,
      };

  const isLoading = supabaseLoading;
  const error = supabaseError ? supabaseError.message : null;

  // Helper function to determine the correct Kanban board URL based on current phase
  const getKanbanBackUrl = (currentPhase: string): string => {
    // Phases belonging to "Gestión De Cartera" Kanban
    const portfolioPhases = [
      "Alquilado",
      "Actualización de Renta (IPC)",
      "Gestión de Renovación",
      "Finalización y Salida",
    ];
    
    // If the property is in a portfolio phase, return portfolio Kanban URL
    if (portfolioPhases.includes(currentPhase)) {
      return "/rentals/kanban/portfolio";
    }
    
    // Default to "Captación y Cierre" Kanban for all other phases
    return "/rentals/kanban";
  };

  // Helper function to get phase index from phase name
  const getPhaseIndex = (phaseName: string): number => {
    return GLOBAL_PHASE_SEQUENCE.indexOf(phaseName as typeof GLOBAL_PHASE_SEQUENCE[number]);
  };

  // Get current phase index
  const currentPhaseIndex = getPhaseIndex(property.currentPhase);

  // Determinar si mostrar "Resumen Inquilino" (a partir de Phase Index 3 - "Inquilino aceptado")
  // Tab appears starting at Index 3 and remains visible for all subsequent phases
  const showTenantSummary = currentPhaseIndex >= 3;

  // Determinar si mostrar "Alquiler" (a partir de Phase Index 4 - "Pendiente de trámites")
  // Tab appears starting at Index 4 and remains visible for all subsequent phases
  const showRentalSummary = currentPhaseIndex >= 4;

  const tabs = [
    { id: "tasks", label: "Espacio de trabajo", badge: undefined },
    { id: "property-summary", label: "Resumen", badge: undefined },
    { id: "status", label: "Inversor", badge: undefined },
    ...(showTenantSummary ? [{ id: "tenant-summary", label: "Inquilino", badge: undefined }] : []),
    ...(showRentalSummary ? [{ id: "rental-summary", label: "Alquiler", badge: undefined }] : []),
    { id: "documents", label: "Documentos", badge: undefined },
    { id: "notes", label: "Notas", badge: undefined },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL with query parameter without causing a full page reload
    // This enables deep linking and browser back/forward button support
    router.push(`/rentals/property/${propertyId}?tab=${tabId}`, { scroll: false });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setShowFooter(false); // Ocultar al bajar
    } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
      setShowFooter(true); // Mostrar al subir
    }
    setLastScrollY(currentScrollY);
  };

  // Helper function to check if all sections are complete for Prophero phase
  // SOLO verifica que todas las secciones estén marcadas como correctas (isCorrect === true)
  // No verifica si falta información en los campos
  const checkPropheroSectionsComplete = useMemo(() => {
    if (property.currentPhase !== "Viviendas Prophero") return true;
    
    // Check if all sections have been reviewed and marked as correct
    const requiredSectionIds = [
      "property-management-info",
      "technical-documents",
      "legal-documents",
      "client-financial-info",
      "supplies-contracts",
      "supplies-bills",
      "home-insurance",
      "property-management",
    ];
    
    // Use propheroSectionReviews from state (updated in real-time) if available,
    // otherwise fall back to supabaseProperty.prophero_section_reviews
    let reviews: Record<string, { isCorrect?: boolean | null; reviewed?: boolean; completed?: boolean }> = {};
    
    // Prioritize real-time state if it exists and has data
    if (propheroSectionReviews && Object.keys(propheroSectionReviews).length > 0) {
      reviews = propheroSectionReviews;
      console.log("🔍 Using real-time propheroSectionReviews:", reviews);
    } else if (supabaseProperty?.prophero_section_reviews) {
      // Fall back to Supabase data
      try {
        const parsed = typeof supabaseProperty.prophero_section_reviews === 'string'
          ? JSON.parse(supabaseProperty.prophero_section_reviews)
          : supabaseProperty.prophero_section_reviews;
        reviews = parsed || {};
        console.log("🔍 Using Supabase prophero_section_reviews:", parsed);
      } catch (error) {
        console.warn("Error parsing prophero_section_reviews:", error);
        return false;
      }
    } else {
      console.log("🔍 No prophero reviews found - will block advancement");
      return false; // If no reviews at all, block advancement
    }
    
    // Check that all sections have isCorrect === true
    const allSectionsReviewed = requiredSectionIds.every((sectionId) => {
      const review = reviews[sectionId];
      // Check if review exists and isCorrect is explicitly true
      const isComplete = review && (review.isCorrect === true);
      if (!isComplete) {
        console.log(`❌ Section ${sectionId} not reviewed as correct. Review:`, review, `isCorrect:`, review?.isCorrect);
      }
      return isComplete;
    });
    
    console.log(`🔍 Review status for all sections:`, requiredSectionIds.map(sectionId => ({
      sectionId,
      review: reviews[sectionId],
      isCorrect: reviews[sectionId]?.isCorrect,
      isComplete: reviews[sectionId] && reviews[sectionId].isCorrect === true
    })));
    
    // SOLO verificar que todas las secciones estén marcadas como correctas
    // No importa si falta información en los campos, solo que estén marcadas como correctas
    console.log(`🔍 Prophero completion check - allSectionsReviewed: ${allSectionsReviewed} (solo verificamos que estén marcadas como correctas)`);
    
    // Solo verificar que todas las secciones estén marcadas como correctas
    return allSectionsReviewed;
  }, [property.currentPhase, supabaseProperty, propheroSectionReviews]);

  // Check if phase advancement is blocked
  const isPhaseBlocked = useMemo(() => {
    // Block phase 1 (Viviendas Prophero) if sections are not complete
    if (property.currentPhase === "Viviendas Prophero") {
      const blocked = !checkPropheroSectionsComplete;
      console.log(`🔒 Phase blocked check - currentPhase: ${property.currentPhase}, checkComplete: ${checkPropheroSectionsComplete}, blocked: ${blocked}`);
      console.log(`🔒 propheroSectionReviews state:`, propheroSectionReviews);
      console.log(`🔒 supabaseProperty.prophero_section_reviews:`, supabaseProperty?.prophero_section_reviews);
      return blocked;
    }
    
    // Block phase 2 (Listo para Alquilar) if progress is not 100%
    if (property.currentPhase === "Listo para Alquilar") {
      const blocked = phase2Progress < 100;
      console.log(`🔒 Phase 2 blocked check - currentPhase: ${property.currentPhase}, progress: ${phase2Progress}%, blocked: ${blocked}`);
      return blocked;
    }
    
    // Block phase 4 (Inquilino aceptado) if progress is not 100%
    if (property.currentPhase === "Inquilino aceptado") {
      const blocked = phase4Progress < 100;
      console.log(`🔒 Phase 4 blocked check - currentPhase: ${property.currentPhase}, progress: ${phase4Progress}%, blocked: ${blocked}`);
      return blocked;
    }
    
    return false;
  }, [property.currentPhase, checkPropheroSectionsComplete, propheroSectionReviews, supabaseProperty?.prophero_section_reviews, phase2Progress, phase4Progress]);
  const blockedMessage = property.currentPhase === "Listo para Alquilar" || property.currentPhase === "Inquilino aceptado"
    ? "Avance bloqueado - Completa el Progreso General de la fase"
    : "Avance bloqueado - Completa todas las secciones requeridas";

  // Función para avanzar a la siguiente fase
  const handleNextPhase = async () => {
    if (currentPhaseIndex >= GLOBAL_PHASE_SEQUENCE.length - 1) {
      toast.error("Ya estás en la última fase");
      return;
    }

    // Check if blocked
    if (isPhaseBlocked) {
      toast.error("No se puede avanzar. Completa todas las secciones requeridas primero.");
      return;
    }

    const nextPhaseIndex = currentPhaseIndex + 1;
    const nextPhase = GLOBAL_PHASE_SEQUENCE[nextPhaseIndex];

    try {
      setIsSaving(true);
      const success = await updatePropertyHook(propertyId, {
        current_stage: nextPhase,
        days_in_stage: 0, // Resetear días en la nueva fase
      });

      if (success) {
        toast.success(`Propiedad avanzada a: ${nextPhase}`);
        // Recargar la página para reflejar los cambios
        router.refresh();
      } else {
        toast.error("Error al avanzar a la siguiente fase");
      }
    } catch (error) {
      console.error("Error al avanzar fase:", error);
      toast.error("Error al avanzar a la siguiente fase");
    } finally {
      setIsSaving(false);
    }
  };

  const canAdvancePhase = currentPhaseIndex < GLOBAL_PHASE_SEQUENCE.length - 1;
  const nextPhaseLabel = canAdvancePhase
    ? `Avanzar a ${GLOBAL_PHASE_SEQUENCE[currentPhaseIndex + 1]}`
    : undefined;

  const renderTabContent = () => {
    switch (activeTab) {
      case "tasks":
        return (
          <PropertyTasksTab
            propertyId={propertyId}
            currentPhase={property.currentPhase}
            property={{
              property_unique_id: property.property_unique_id,
              address: property.address,
              city: property.city,
            }}
            onPropheroReviewsChange={handlePropheroReviewsChange}
            onSubmitCommentsRef={submitCommentsRef}
            onHasAnySectionWithNoRef={hasAnySectionWithNoRef}
            onCanSubmitCommentsRef={canSubmitCommentsRef}
            onHasAnySectionWithNoChange={setHasAnySectionWithNo}
            onCanSubmitCommentsChange={setCanSubmitComments}
            onPhase2ProgressChange={setPhase2Progress}
            onPhase4ProgressChange={setPhase4Progress}
          />
        );
      case "property-summary":
        return <PropertySummaryTab propertyId={propertyId} currentPhase={property.currentPhase} property={supabaseProperty} />;
      case "status":
        return <PropertyStatusTab propertyId={propertyId} currentPhase={property.currentPhase} property={supabaseProperty} />;
      case "documents":
        return <PropertyDocumentsTab propertyId={propertyId} currentPhase={property.currentPhase} property={supabaseProperty} />;
      case "notes":
        return <PropertyNotesTab propertyId={propertyId} currentPhase={property.currentPhase} />;
      case "tenant-summary":
        return <TenantSummaryTab propertyId={propertyId} currentPhase={property.currentPhase} property={supabaseProperty} />;
      case "rental-summary":
        return <RentalSummaryTab propertyId={propertyId} currentPhase={property.currentPhase} />;
      default:
        return (
          <PropertyTasksTab
            propertyId={propertyId}
            currentPhase={property.currentPhase}
            property={{
              property_unique_id: property.property_unique_id,
              address: property.address,
              city: property.city,
            }}
            onPropheroReviewsChange={handlePropheroReviewsChange}
            onSubmitCommentsRef={submitCommentsRef}
            onHasAnySectionWithNoRef={hasAnySectionWithNoRef}
            onCanSubmitCommentsRef={canSubmitCommentsRef}
            onHasAnySectionWithNoChange={setHasAnySectionWithNo}
            onCanSubmitCommentsChange={setCanSubmitComments}
            onPhase2ProgressChange={setPhase2Progress}
            onPhase4ProgressChange={setPhase4Progress}
          />
        );
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 items-center justify-center">
          <RentalsHomeLoader />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Propiedad no encontrada
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/rentals/kanban")}
            className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent"
          >
            Volver al Kanban
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PropertyFormProvider propertyId={propertyId}>
      <div className="flex h-screen overflow-hidden">
        {/* Main Content - No sidebar izquierdo en L2 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <NavbarL2
            backHref={getKanbanBackUrl(property.currentPhase)}
            onNextPhase={handleNextPhase}
            isSaving={isSaving}
            canAdvancePhase={canAdvancePhase}
            nextPhaseLabel={nextPhaseLabel}
            isBlocked={isPhaseBlocked}
            blockedMessage={blockedMessage}
            onSubmitComments={
              property.currentPhase === "Viviendas Prophero" && hasAnySectionWithNo
                ? () => submitCommentsRef.current?.()
                : undefined
            }
            canSubmitComments={
              property.currentPhase === "Viviendas Prophero"
                ? canSubmitComments
                : true
            }
          />

          {/* Main Content - Matching HTML design */}
          <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#111827] scrollbar-stable">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
              {/* Address and Property Info Section */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-2">
                  {property.address}{property.city ? `, ${property.city}` : ""}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                  <span>ID Propiedad: {property.property_unique_id}</span>
                  <span className="text-[#E5E7EB] dark:text-[#374151]">|</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold uppercase">
                    {property.currentPhase}
                  </span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="mb-8">
                <PropertyTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                {/* Left Content - 2 columns */}
                <div className="lg:col-span-2 space-y-8 relative z-20">
                  {/* Tab Content */}
                  <div 
                    ref={scrollContainerRef}
                    className="pb-24"
                    onScroll={handleScroll}
                  >
                    {renderTabContent()}
                  </div>
                </div>

                {/* Right Sidebar - 1 column */}
                <div className="lg:col-span-1 space-y-8 relative">
                  <PropertyRightSidebar
                    property={property}
                    slaTargetDays={30}
                    supabaseProperty={supabaseProperty}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sticky Mobile */}
          {hasUnsavedChanges && (
            <div
              className={cn(
                "fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[var(--vistral-gray-900)] px-margin-xs sm:px-margin-sm py-4 md:hidden border-t border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-700)] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out",
                showFooter ? "translate-y-0" : "translate-y-full"
              )}
            >
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                <Button className="w-full flex items-center justify-center rounded-lg bg-[var(--vistral-blue-600)] hover:bg-[var(--vistral-blue-700)] text-white h-12 text-base font-medium">
                  Guardar Cambios
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center rounded-lg h-12 text-base font-medium"
                  onClick={() => setHasUnsavedChanges(false)}
                >
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[85vw] max-w-sm bg-card dark:bg-[var(--vistral-gray-900)] border-l z-50 lg:hidden shadow-xl overflow-y-auto">
              {/* Header del drawer */}
              <div className="sticky top-0 bg-card dark:bg-[var(--vistral-gray-900)] border-b p-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold">Informaciรณn</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {/* Contenido del sidebar */}
              <div className="p-4">
                <PropertyRightSidebar
                  property={property}
                  slaTargetDays={30}
                  supabaseProperty={supabaseProperty}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </PropertyFormProvider>
  );
}
