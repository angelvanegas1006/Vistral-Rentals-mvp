"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
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
  getFinancialEstimates,
  createFinancialEstimate,
  updateFinancialEstimate,
} from "@/lib/supply-financial-estimate-supabase";
import { calculateFinancialEstimate } from "@/lib/supply-financial-calculations";
import { updateAnalystStatus } from "@/lib/supply-property-supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const YIELD_THRESHOLD = 5.50;

interface FinancialTabProps {
  property: PropertyWithUsers;
}

function FinancialTabComponent({ property }: FinancialTabProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [financialEstimates, setFinancialEstimates] = useState<FinancialEstimateData[]>([]);
  const [currentEstimate, setCurrentEstimate] = useState<FinancialEstimateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  const loadFinancialEstimates = useCallback(async () => {
    try {
      setIsLoading(true);
      const estimates = await getFinancialEstimates(property.id);
      setFinancialEstimates(estimates);
      
      // Find current estimate
      const current = estimates.find(e => e.isCurrent) || estimates[0] || null;
      setCurrentEstimate(current);
      
      // If there's a current estimate, load its data into form
      if (current) {
        setBasicInfo(current.basicInfo);
        setFinancing(current.financing);
        setScenarioDrivers(current.scenarioDrivers);
        setHasResults(true);
      } else {
        // Autocomplete from property data
        const precioVenta = property.data?.precioVenta || 0;
        const monthlyRent = property.data?.inquilino?.importeAlquilerTransferir || 500; // Default 500€
        
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
      }
    } catch (error) {
      console.error("Error loading financial estimates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [property.id, property.data]);

  // Calculate real-time results when form values change
  const realTimeResults = useMemo(() => {
    if (!basicInfo.purchasePrice || basicInfo.purchasePrice <= 0) {
      return null;
    }

    const propertyData = {
      gastosComunidad: property.data?.gastosComunidad || 0,
      ibiAnual: property.data?.ibiAnual || 0,
      fullAddress: property.fullAddress,
      habitaciones: property.data?.habitaciones || null,
      renovationCost: property.totalInvestment || null,
    };

    try {
      const { results, meetsThreshold } = calculateFinancialEstimate(
        basicInfo,
        financing,
        scenarioDrivers,
        propertyData,
        YIELD_THRESHOLD
      );
      return { results, meetsThreshold };
    } catch (error) {
      console.error("Error calculating real-time results:", error);
      return null;
    }
  }, [basicInfo, financing, scenarioDrivers, property]);

  useEffect(() => {
    loadFinancialEstimates();
  }, [loadFinancialEstimates]);

  // Listen for make financial estimate event from sidebar/header
  useEffect(() => {
    const handleMakeFinancialEstimateEvent = () => {
      router.push(`/supply/property/${property.id}/financial-estimate`);
    };
    
    window.addEventListener('makeFinancialEstimate', handleMakeFinancialEstimateEvent);
    return () => {
      window.removeEventListener('makeFinancialEstimate', handleMakeFinancialEstimateEvent);
    };
  }, [property.id, router]);

  const handleMakeFinancialEstimate = () => {
    router.push(`/supply/property/${property.id}/financial-estimate`);
  };

  const handleGenerate = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const propertyData = {
        gastosComunidad: property.data?.gastosComunidad || 0,
        ibiAnual: property.data?.ibiAnual || 0,
        fullAddress: property.fullAddress,
        habitaciones: property.data?.habitaciones || null,
        renovationCost: property.totalInvestment || null, // Use totalInvestment as renovation cost if available
      };

      const { results, meetsThreshold } = calculateFinancialEstimate(
        basicInfo,
        financing,
        scenarioDrivers,
        propertyData,
        YIELD_THRESHOLD
      );

      if (currentEstimate) {
        // Update existing estimate
        await updateFinancialEstimate(currentEstimate.id, {
          basicInfo,
          financing,
          scenarioDrivers,
          results,
          yieldThreshold: YIELD_THRESHOLD,
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
        const newEstimate: FinancialEstimateData = {
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
          createdBy: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentEstimate(newEstimate);
      }

      setHasResults(true);
      // Reload estimates
      await loadFinancialEstimates();
      // Hide form after saving
      setShowForm(false);
    } catch (error) {
      console.error("Error generating financial estimate:", error);
    } finally {
      setIsSaving(false);
    }
  }, [property, basicInfo, financing, scenarioDrivers, currentEstimate, loadFinancialEstimates]);

  const handleDiscardProperty = useCallback(async () => {
    if (!confirm("¿Estás seguro de que deseas descartar esta propiedad? Esta acción moverá la propiedad al estado 'rejected'.")) {
      return;
    }

    try {
      setIsSaving(true);
      await updateAnalystStatus(property.id, "rejected");
      toast.success("Propiedad descartada correctamente");
      // Optionally refresh the page or navigate away
      window.location.reload();
    } catch (error) {
      console.error("Error discarding property:", error);
      toast.error("Error al descartar la propiedad");
    } finally {
      setIsSaving(false);
    }
  }, [property.id]);

  const handleSaveChanges = useCallback(async () => {
    if (!currentEstimate) return;

    try {
      setIsSaving(true);
      
      const propertyData = {
        gastosComunidad: property.data?.gastosComunidad || 0,
        ibiAnual: property.data?.ibiAnual || 0,
        fullAddress: property.fullAddress,
        habitaciones: property.data?.habitaciones || null,
        renovationCost: property.totalInvestment || null, // Use totalInvestment as renovation cost if available
      };

      const { results, meetsThreshold } = calculateFinancialEstimate(
        basicInfo,
        financing,
        scenarioDrivers,
        propertyData,
        YIELD_THRESHOLD
      );

      await updateFinancialEstimate(currentEstimate.id, {
        basicInfo,
        financing,
        scenarioDrivers,
        results,
        yieldThreshold: YIELD_THRESHOLD,
        meetsThreshold,
      });

      // Reload estimates
      await loadFinancialEstimates();
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentEstimate, property, basicInfo, financing, scenarioDrivers, loadFinancialEstimates]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#71717A]">{t.messages.loading}</div>
      </div>
    );
  }

  // Empty state - no estimates and form not shown
  if (financialEstimates.length === 0 && !showForm) {
    return (
      <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-12 text-center">
        <p className="text-lg font-medium text-[#212121] mb-2">
          {t.financialEstimate.noDetailsAvailable}
        </p>
        <p className="text-sm text-[#71717A] mb-6">
          {t.financialEstimate.continueUpload}
        </p>
        <Button
          onClick={handleMakeFinancialEstimate}
          className="inline-flex items-center justify-center text-sm font-medium h-8 px-4 bg-[#2050F6] hover:bg-[#1a40d0] text-white rounded-full transition-colors"
          style={{ borderRadius: '20px' }}
        >
          {t.propertyDetail.makeFinancialEstimate}
        </Button>
      </div>
    );
  }

  // Show form when creating new or editing
  if (showForm) {
    return (
      <div className="flex flex-col gap-6">
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

        {hasResults && realTimeResults && (
          <>
            <ProfitabilityTable
              results={realTimeResults.results}
              meetsThreshold={realTimeResults.meetsThreshold}
              yieldThreshold={YIELD_THRESHOLD}
              financing={financing}
            />
            
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleDiscardProperty}
                disabled={isSaving}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 rounded-full px-6 py-2 font-medium"
              >
                {t.financialEstimate.discardProperty || "Descartar propiedad"}
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-[#162EB7] text-white hover:bg-[#1B36A3] rounded-full px-6 py-2 font-medium"
              >
                {isSaving
                  ? t.financialEstimate.saving
                  : t.financialEstimate.saveFinancials || "Save financials"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Show saved estimates list
  return (
    <div className="flex flex-col gap-4">
      {financialEstimates.map((estimate) => {
        const isCurrent = estimate.id === currentEstimate?.id;
        const results = estimate.results;
        
        return (
          <div
            key={estimate.id}
            className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-[#212121]">
                    Financial estimation {estimate.version}
                  </h3>
                  {estimate.meetsThreshold ? (
                    <span className="px-2 py-1 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] text-xs font-medium rounded">
                      OK
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#FFF7ED] border border-[#FCD34D] text-[#92400E] text-xs font-medium rounded">
                      Not OK
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#71717A]">
                  {formatDate(estimate.createdAt)}
                </p>
              </div>
              {isCurrent && (
                <Button
                  onClick={() => {
                    router.push(`/supply/property/${property.id}/financial-estimate`);
                  }}
                  variant="outline"
                  className="text-sm"
                >
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  Net Yield (No Financing) · Conservative
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {formatPercentage(results.returnsAndYields.netYieldNoFinancingConservative)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  Net Yield (No Financing) · Favorable
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {formatPercentage(results.returnsAndYields.netYieldNoFinancingFavorable)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  Net Yield (Financing) · Conservative
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {formatPercentage(results.returnsAndYields.netYieldFinancingConservative)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  Net Yield (Financing) · Favorable
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {formatPercentage(results.returnsAndYields.netYieldFinancingFavorable)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {financialEstimates.length > 0 && (
        <Button
          onClick={handleMakeFinancialEstimate}
          className="w-full bg-[#2050F6] hover:bg-[#1a40d0] text-white rounded-full"
        >
          {t.propertyDetail.makeFinancialEstimate}
        </Button>
      )}
    </div>
  );
}

export const FinancialTab = memo(FinancialTabComponent);
