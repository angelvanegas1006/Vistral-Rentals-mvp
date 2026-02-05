"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, use } from "react";
import { PropertyStatusSidebar } from "@/components/supply/property/property-status-sidebar";
import { getPropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { BasicInformationForm } from "@/components/supply/financial-estimate/basic-information-form";
import { ProfitabilityTable } from "@/components/supply/financial-estimate/profitability-table";
import {
  BasicInfo,
  Financing,
  ScenarioDrivers,
  FinancialEstimateData,
} from "@/lib/supply-financial-estimate-storage";
import {
  getCurrentFinancialEstimate,
  createFinancialEstimate,
  updateFinancialEstimate,
} from "@/lib/supply-financial-estimate-supabase";
import { calculateFinancialEstimate } from "@/lib/supply-financial-calculations";
import { Button } from "@/components/ui/button";

const YIELD_THRESHOLD = 5.50;

export default function FinancialEstimatePage() {
  const paramsPromise = useParams();
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  const router = useRouter();
  const { t } = useI18n();
  const [property, setProperty] = useState<PropertyWithUsers | null>(null);
  const [financialEstimate, setFinancialEstimate] = useState<FinancialEstimateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tRef = useRef(t);
  
  // Form state
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    purchasePrice: 0,
    closingCosts: 1500, // Default 1.500€
    monthlyRent: 500, // Default 500€
    propertyManagementPlan: "5% Basic",
  });
  const [financing, setFinancing] = useState<Financing>({
    financingType: "Inversión", // Default to "Inversión"
    ltv: 55, // Auto-set based on "Inversión"
    loanTerm: 15, // Auto-set based on "Inversión"
    interestRate: 3.5,
  });
  const [scenarioDrivers, setScenarioDrivers] = useState<ScenarioDrivers>({
    rentalVariationConservative: 0,
    rentalVariationFavorable: 5,
    occupancyRateConservative: 90,
    occupancyRateFavorable: 95,
  });
  const [hasResults, setHasResults] = useState(false);
  
  // Keep t reference up to date
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const propertyId = params.id as string;
      if (!propertyId) {
        setError("Property ID is required");
        return;
      }

      // Load property and financial estimate in parallel
      const [propertyData, estimateData] = await Promise.allSettled([
        getPropertyWithUsers(propertyId).catch((err) => {
          console.error("Error loading property:", err);
          throw err;
        }),
        getCurrentFinancialEstimate(propertyId).catch((err) => {
          // Silently handle errors - financial estimate is optional and table might not exist yet
          console.debug("Error loading financial estimate (this is OK if table doesn't exist yet):", err);
          return null;
        }),
      ]);

      if (propertyData.status === "fulfilled" && propertyData.value) {
        setProperty(propertyData.value);
        
        // Autocomplete form fields from property data
        const property = propertyData.value;
        const precioVenta = property.data?.precioVenta || 0;
        const monthlyRent = property.data?.inquilino?.importeAlquilerTransferir || 0;
        
        // Calculate closing costs as percentage (default 17.24% based on example)
        const closingCosts = precioVenta * 0.1724;
        
        setBasicInfo({
          purchasePrice: precioVenta,
          closingCosts: 1500, // Default 1.500€
          monthlyRent: monthlyRent || 500, // Use property data or default to 500€
          propertyManagementPlan: "5% Basic",
        });
        
        // Set default financing to "Inversión"
        setFinancing({
          financingType: "Inversión",
          ltv: 55,
          loanTerm: 15,
          interestRate: 3.5,
        });
      } else {
        setError(tRef.current.messages.notFound);
        return;
      }

      if (estimateData.status === "fulfilled" && estimateData.value) {
        setFinancialEstimate(estimateData.value);
        setBasicInfo(estimateData.value.basicInfo);
        setFinancing(estimateData.value.financing);
        setScenarioDrivers(estimateData.value.scenarioDrivers);
        setHasResults(true);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : tRef.current.messages.error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = useCallback(async () => {
    if (!property) return;

    try {
      setIsSaving(true);
      
      const propertyData = {
        gastosComunidad: property.data?.gastosComunidad || 0,
        ibiAnual: property.data?.ibiAnual || 0,
        fullAddress: property.fullAddress,
        habitaciones: property.data?.habitaciones || null,
        renovationCost: property.totalInvestment || null,
      };

      const { results, meetsThreshold } = calculateFinancialEstimate(
        basicInfo,
        financing,
        scenarioDrivers,
        propertyData,
        YIELD_THRESHOLD
      );

      if (financialEstimate) {
        // Update existing estimate
        await updateFinancialEstimate(financialEstimate.id, {
          basicInfo,
          financing,
          scenarioDrivers,
          results,
          yieldThreshold: YIELD_THRESHOLD,
          meetsThreshold,
        });
        setFinancialEstimate({
          ...financialEstimate,
          basicInfo,
          financing,
          scenarioDrivers,
          results,
          meetsThreshold,
        });
      } else {
        // Create new estimate
        const estimateId = await createFinancialEstimate(
          property.id,
          basicInfo,
          financing,
          scenarioDrivers,
          results,
          YIELD_THRESHOLD,
          meetsThreshold
        );
        setFinancialEstimate({
          id: estimateId,
          propertyId: property.id,
          version: 1,
          isCurrent: true,
          basicInfo,
          financing,
          scenarioDrivers,
          results,
          yieldThreshold: YIELD_THRESHOLD,
          meetsThreshold,
          createdBy: "", // Will be set by Supabase
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setHasResults(true);
    } catch (err) {
      console.error("Error generating financial estimate:", err);
      setError(err instanceof Error ? err.message : "Error al generar estimación financiera");
    } finally {
      setIsSaving(false);
    }
  }, [property, basicInfo, financing, scenarioDrivers, financialEstimate]);

  const handleSaveChanges = useCallback(async () => {
    if (!financialEstimate || !property) return;

    try {
      setIsSaving(true);
      
      const propertyData = {
        gastosComunidad: property.data?.gastosComunidad || 0,
        ibiAnual: property.data?.ibiAnual || 0,
        fullAddress: property.fullAddress,
        habitaciones: property.data?.habitaciones || null,
        renovationCost: property.totalInvestment || null,
      };

      const { results, meetsThreshold } = calculateFinancialEstimate(
        basicInfo,
        financing,
        scenarioDrivers,
        propertyData,
        YIELD_THRESHOLD
      );

      await updateFinancialEstimate(financialEstimate.id, {
        basicInfo,
        financing,
        scenarioDrivers,
        results,
        yieldThreshold: YIELD_THRESHOLD,
        meetsThreshold,
      });

      setFinancialEstimate({
        ...financialEstimate,
        basicInfo,
        financing,
        scenarioDrivers,
        results,
        meetsThreshold,
      });
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  }, [financialEstimate, property, basicInfo, financing, scenarioDrivers]);

  const handleBack = () => {
    router.push(`/supply/property/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-[#2050F6] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg font-medium text-[#212121] dark:text-white">{t.messages.loading}</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium mb-2 text-destructive">{error || t.messages.notFound}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-[56px] lg:h-[72px] bg-white border-b border-[#D4D4D8] flex-shrink-0 w-full">
        <div className="container-margin h-full flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[#162EB7] hover:opacity-80 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="#162EB7"/>
                </svg>
                <span className="text-sm font-medium">{t.common.back}</span>
              </button>
              
              {/* Vertical divider */}
              <div className="h-6 w-px bg-[#E4E4E7]" />
              
              {/* Title */}
              <h1 className="text-base font-medium text-[#212121]">
                {t.financialEstimate?.pageTitle || "Add financial"}
              </h1>
            </div>
            
            {/* Right: Action buttons */}
            <div className="flex items-center gap-3">
              {hasResults && financialEstimate && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center justify-center text-sm font-medium h-8 px-4 bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#162EB7] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '20px' }}
                >
                  {isSaving ? t.financialEstimate?.saving : t.financialEstimate?.saveFinancials || "Save financials"}
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isSaving}
                className="flex items-center justify-center text-sm font-medium h-8 px-4 bg-[#2050F6] hover:bg-[#1a40d0] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '20px' }}
              >
                {t.financialEstimate?.addFinancial || t.propertyDetail.makeFinancialEstimate}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="container-margin py-6 lg:py-8">
          {/* Title and Description */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-[#212121] mb-2">
              {t.financialEstimate?.simulationTitle || "Financial Simulation"}
            </h1>
            <p className="text-base text-[#71717A]">
              {t.financialEstimate?.simulationDescription || "Here you can simulate the financing to assess whether to add the project or not."}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: Basic Information Form */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[600px]">
              <BasicInformationForm
                basicInfo={basicInfo}
                financing={financing}
                scenarioDrivers={scenarioDrivers}
                onBasicInfoChange={setBasicInfo}
                onFinancingChange={setFinancing}
                onScenarioDriversChange={setScenarioDrivers}
                onGenerate={handleGenerate}
                hasResults={hasResults}
                property={property}
              />
            </div>

            {/* Right: Estimation Table */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[600px]">
              {hasResults && financialEstimate ? (
                <ProfitabilityTable
                  results={financialEstimate.results}
                  meetsThreshold={financialEstimate.meetsThreshold}
                  yieldThreshold={financialEstimate.yieldThreshold}
                  financing={financing}
                />
              ) : (
                <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-12 text-center">
                  <h2 className="text-lg font-semibold text-[#212121] mb-2">
                    {t.financialEstimate?.profitabilityTable?.title || "Estimation Table"}
                  </h2>
                  <p className="text-base font-medium text-[#212121] mb-2">
                    {t.financialEstimate?.noDataToDisplay || "No data to display"}
                  </p>
                  <p className="text-sm text-[#71717A]">
                    {t.financialEstimate?.addBasicInformation || "Please add the basic information so we can set up the table"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
