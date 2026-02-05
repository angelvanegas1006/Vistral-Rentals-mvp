"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PropertyWithUsers, updateAnalystStatus } from "@/lib/supply-property-supabase";
import { ChecklistData } from "@/lib/supply-checklist-storage";
import { useI18n } from "@/lib/i18n";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { PropertyStatusSidebar } from "./property-status-sidebar";
import { CorrectionsPanel } from "./corrections-panel";
import { CorrectionsViewDialog } from "./corrections-view-dialog";
import { OverviewTab } from "./tabs/overview-tab";
import { ConditionTab } from "./tabs/condition-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { ContactsTab } from "./tabs/contacts-tab";
import { RentalTab } from "./tabs/rental-tab";
import { FinancialTab } from "./tabs/financial-tab";
import { Button } from "@/components/ui/button";
import { hasPendingCorrections } from "@/lib/supply-corrections-supabase";

interface PropertyDetailPageProps {
  property: PropertyWithUsers;
  checklist?: ChecklistData | null;
}

export function PropertyDetailPage({ property, checklist }: PropertyDetailPageProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { hasAnyRole } = useAppAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [savingCorrections, setSavingCorrections] = useState(false);
  const [hasPendingCorrectionsState, setHasPendingCorrectionsState] = useState(false);
  const [isCorrectionsViewOpen, setIsCorrectionsViewOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { isPartner, role } = useAppAuth();
  const isAnalystOrLead = hasAnyRole(["supply_analyst", "supply_lead", "supply_admin"]);
  
  // Memoize computed values to prevent unnecessary re-renders
  const showCorrectionsButton = useMemo(
    () => isAnalystOrLead && (property.analystStatus === "backlog" || property.analystStatus === "under-review"),
    [isAnalystOrLead, property.analystStatus]
  );
  
  const showCorrectionsPanel = useMemo(
    () => isAnalystOrLead || (property.correctionsCount && property.correctionsCount > 0),
    [isAnalystOrLead, property.correctionsCount]
  );
  
  // Show analyst header actions when property is in analyst workflow
  const showAnalystActions = useMemo(
    () => Boolean(
      isAnalystOrLead && 
      property.analystStatus && 
      ["backlog", "under-review", "needs-correction", "renovation-estimation", "financial-analysis"].includes(property.analystStatus)
    ),
    [isAnalystOrLead, property.analystStatus]
  );
  
  // Show partner corrections view when there are corrections (regardless of status)
  const showPartnerCorrectionsView = useMemo(
    () => isPartner && (property.correctionsCount && property.correctionsCount > 0),
    [isPartner, property.correctionsCount]
  );
  
  // Debug logging - only in development and only log when values actually change
  const prevDebugValuesRef = useRef<string>("");
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentValues = JSON.stringify({
        role,
        isPartner,
        isAnalystOrLead,
        showAnalystActions,
        showPartnerCorrectionsView,
        propertyStatus: property.currentStage,
        analystStatus: property.analystStatus,
        correctionsCount: property.correctionsCount,
      });
      
      // Only log if values actually changed
      if (prevDebugValuesRef.current !== currentValues) {
        prevDebugValuesRef.current = currentValues;
        console.log("[PropertyDetailPage] Role check:", JSON.parse(currentValues));
      }
    }
  }, [role, isPartner, isAnalystOrLead, showAnalystActions, showPartnerCorrectionsView, property.currentStage, property.analystStatus, property.correctionsCount]);

  const handleEditProperty = useCallback(() => {
    router.push(`/supply/property/${property.id}/edit`);
  }, [router, property.id]);

  const handleBack = useCallback(() => {
    router.push("/supply/kanban");
  }, [router]);

  const handleSaveCorrections = useCallback(async () => {
    try {
      setSavingCorrections(true);
      
      // Check if there are pending corrections
      const hasPending = await hasPendingCorrections(property.id);
      
      // If there are pending corrections, change status to needs-correction
      if (hasPending && property.analystStatus !== "needs-correction") {
        await updateAnalystStatus(property.id, "needs-correction");
        // Reload the page to reflect the status change
        router.refresh();
      }
      
      setHasPendingCorrectionsState(hasPending);
    } catch (error) {
      console.error("[PropertyDetailPage] Error saving corrections:", error);
      alert(t.propertyDetail.corrections.errorSaving);
    } finally {
      setSavingCorrections(false);
    }
  }, [property.id, property.analystStatus, router, t.propertyDetail.corrections.errorSaving]);

  // Check for pending corrections on mount and when corrections change
  const checkPendingCorrections = useCallback(async () => {
    try {
      const hasPending = await hasPendingCorrections(property.id);
      setHasPendingCorrectionsState(hasPending);
    } catch (error) {
      console.error("[PropertyDetailPage] Error checking pending corrections:", error);
    }
  }, [property.id]);

  // Initial check on mount - only when showCorrectionsButton becomes true
  useEffect(() => {
    if (showCorrectionsButton) {
      checkPendingCorrections();
    }
    // Only depend on showCorrectionsButton, not checkPendingCorrections to avoid re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCorrectionsButton]);


  // Get next phase for analyst workflow
  const getNextAnalystPhase = useCallback((currentPhase: string | null | undefined): string | null => {
    if (!currentPhase) return "under-review";
    
    const phaseFlow: Record<string, string> = {
      "backlog": "under-review",
      "under-review": "renovation-estimation",
      "needs-correction": "under-review", // After corrections are resolved, go back to under-review
      "renovation-estimation": "financial-analysis",
      "financial-analysis": "in-negotiation",
      "in-negotiation": "arras",
      "arras": "done",
    };
    
    return phaseFlow[currentPhase] || null;
  }, []);

  // Handle make financial estimate - navigate to financial estimate page
  const handleMakeFinancialEstimate = useCallback(() => {
    router.push(`/supply/property/${property.id}/financial-estimate`);
  }, [router, property.id]);

  // Handle approve property
  const handleApproveProperty = useCallback(async () => {
    if (!property.analystStatus) return;
    
    // If property is in financial-analysis, switch to financial tab
    if (property.analystStatus === "financial-analysis") {
      setActiveTab("financial");
      return;
    }
    
    const nextPhase = getNextAnalystPhase(property.analystStatus);
    if (!nextPhase) {
      alert("No se puede avanzar más en el flujo");
      return;
    }

    try {
      setIsApproving(true);
      await updateAnalystStatus(property.id, nextPhase);
      router.refresh();
    } catch (error) {
      console.error("[PropertyDetailPage] Error approving property:", error);
      alert("Error al aprobar la propiedad");
    } finally {
      setIsApproving(false);
    }
  }, [property.analystStatus, property.id, getNextAnalystPhase, router]);

  // Check if we should show "Make Financial Estimate" button
  const isFinancialAnalysisPhase = useMemo(
    () => property.analystStatus === "financial-analysis",
    [property.analystStatus]
  );
  const showMakeFinancialEstimateButton = useMemo(
    () => isFinancialAnalysisPhase && getNextAnalystPhase(property.analystStatus),
    [isFinancialAnalysisPhase, property.analystStatus, getNextAnalystPhase]
  );

  // Memoize handlers for corrections dialog
  const handleOpenCorrectionsView = useCallback(() => {
    setIsCorrectionsViewOpen(true);
  }, []);

  const handleCloseCorrectionsView = useCallback(() => {
    setIsCorrectionsViewOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-[56px] lg:h-[72px] bg-white border-b border-[#D4D4D8] flex-shrink-0 w-full">
        <div className="container-margin h-full flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left: Back button */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[#162EB7] hover:opacity-80 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="#162EB7"/>
                </svg>
                <span className="hidden lg:inline text-sm font-medium">{t.common.back}</span>
              </button>
              
              {/* Vertical divider - hidden on mobile */}
              <div className="hidden lg:block h-6 w-px bg-[#E4E4E7]" />
              
              {/* Center: Title - hidden on mobile */}
              <h1 className="hidden lg:block text-base font-medium text-[#212121]">{t.propertyDetail.title}</h1>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {showAnalystActions && (
                <>
                  {/* Corrections View Link */}
                  <button
                    onClick={handleOpenCorrectionsView}
                    className="hidden lg:flex items-center gap-2 text-sm font-medium text-[#162EB7] hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src="/icons/corrections-view-icon.png" 
                      alt="Corrections view" 
                      width={16} 
                      height={16}
                      className="flex-shrink-0"
                    />
                    <span>{t.propertyDetail.corrections.viewCorrections}</span>
                  </button>
                  
                  {/* Approve Property / Make Financial Estimate Button */}
                  {getNextAnalystPhase(property.analystStatus) && (
                    <button
                      onClick={isFinancialAnalysisPhase ? handleMakeFinancialEstimate : handleApproveProperty}
                      disabled={isApproving}
                      className="hidden lg:flex items-center justify-center text-sm font-medium h-8 px-4 bg-[#2050F6] hover:bg-[#1a40d0] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ borderRadius: '20px' }}
                    >
                      {isApproving 
                        ? t.propertyDetail.approving 
                        : isFinancialAnalysisPhase 
                          ? t.propertyDetail.makeFinancialEstimate 
                          : t.propertyDetail.approveProperty}
                    </button>
                  )}
                </>
              )}
              {showPartnerCorrectionsView && (
                <>
                  {/* Partner Corrections View Link */}
                  <button
                    onClick={handleOpenCorrectionsView}
                    className="hidden lg:flex items-center gap-2 text-sm font-medium text-[#162EB7] hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src="/icons/corrections-view-icon.png" 
                      alt="Corrections view" 
                      width={16} 
                      height={16}
                      className="flex-shrink-0"
                    />
                    <span>{t.propertyDetail.corrections.viewCorrections}</span>
                  </button>
                </>
              )}
              {/* Don't show Edit Property for partners or analysts */}
              {!showAnalystActions && !showPartnerCorrectionsView && !isPartner && (
                <button
                  onClick={handleEditProperty}
                  className="hidden lg:block text-sm font-medium text-[#162EB7] hover:opacity-80 transition-opacity"
                >
                  {t.propertyDetail.editProperty}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-margin py-4 lg:py-2">
          {/* Address and Property Info Section */}
          <div className="mb-4 lg:mb-4">
            {/* Address */}
            <div className="text-lg lg:text-lg font-medium text-[#212121] mb-1 lg:mb-0 pt-0 lg:pt-[5px] pb-0 lg:pb-[5px]">{property.fullAddress}</div>
            
            {/* Property ID and Cadastral Reference */}
            <div className="text-sm text-[#71717A]">
              <span>
                {t.propertyDetail.propertyId}: {property.id}
              </span>
              {property.data?.referenciaCatastral && (
                <>
                  <span className="mx-2">|</span>
                  <span>
                    {t.propertyDetail.cadastralReference}: {property.data.referenciaCatastral}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Content */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[800px]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full">
                {/* Tabs Container - Rounded white background */}
                <div className="flex-shrink-0 overflow-x-auto -mx-[20px] px-[20px] sm:-mx-8 sm:px-8 md:-mx-10 md:px-10 lg:mx-0 lg:px-0 scrollbar-hidden pt-[3px] pb-[3px]">
                  <TabsList className="bg-[#FAFAFA] rounded-[18px] px-1 py-0 h-auto w-max lg:w-auto">
                    <TabsTrigger 
                      value="overview"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.overview}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="condition"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.condition}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.documents}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="contacts"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.contacts}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rental"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.rental}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="financial"
                      className="rounded-[18px] px-4 py-2 text-[#212121] bg-transparent data-[state=active]:bg-white data-[state=active]:text-[#212121] data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      {t.propertyDetail.tabs.financial}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content */}
                <div className="pt-4 lg:pt-[5px] pb-4 lg:pb-[5px]">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab property={property} checklist={checklist} />
                  </TabsContent>

                  <TabsContent value="condition" className="mt-0">
                    <ConditionTab property={property} checklist={checklist} />
                  </TabsContent>

                  <TabsContent value="documents" className="mt-0">
                    <DocumentsTab property={property} checklist={checklist} />
                  </TabsContent>

                  <TabsContent value="contacts" className="mt-0">
                    <ContactsTab property={property} />
                  </TabsContent>

                  <TabsContent value="rental" className="mt-0">
                    <RentalTab property={property} />
                  </TabsContent>

                  <TabsContent value="financial" className="mt-0">
                    <FinancialTab property={property} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Right Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex lg:flex-col lg:w-[384px] flex-shrink-0 lg:pt-[46px] gap-4">
              <PropertyStatusSidebar property={property} />
              {showCorrectionsPanel && (
                <CorrectionsPanel 
                  propertyId={property.id} 
                  onCorrectionsChanged={checkPendingCorrections}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Corrections View Dialog */}
      {(showAnalystActions || showPartnerCorrectionsView) && (
        <CorrectionsViewDialog
          propertyId={property.id}
          open={isCorrectionsViewOpen}
          onOpenChange={setIsCorrectionsViewOpen}
          onCorrectionsChanged={checkPendingCorrections}
        />
      )}
    </div>
  );
}
