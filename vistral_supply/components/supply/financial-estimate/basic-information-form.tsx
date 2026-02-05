"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BasicInfo,
  Financing,
  ScenarioDrivers,
  PropertyManagementPlan,
  FinancingType,
} from "@/lib/supply-financial-estimate-storage";
import { useI18n } from "@/lib/i18n";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";

interface BasicInformationFormProps {
  basicInfo: BasicInfo;
  financing: Financing;
  scenarioDrivers: ScenarioDrivers;
  onBasicInfoChange: (basicInfo: BasicInfo) => void;
  onFinancingChange: (financing: Financing) => void;
  onScenarioDriversChange: (drivers: ScenarioDrivers) => void;
  onGenerate: () => void;
  hasResults: boolean;
  property?: PropertyWithUsers | null;
}

export function BasicInformationForm({
  basicInfo,
  financing,
  scenarioDrivers,
  onBasicInfoChange,
  onFinancingChange,
  onScenarioDriversChange,
  onGenerate,
  hasResults,
  property,
}: BasicInformationFormProps) {
  const { t } = useI18n();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "investment",
    "recurring",
    "financing",
    "scenarios",
  ]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const formatNumber = useCallback((value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    return value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
  }, []);

  const parseNumber = useCallback((value: string): number => {
    // Remove all non-digit characters except dots and commas
    // Handle Spanish format: dots as thousands separator, comma as decimal separator
    let cleaned = value.replace(/[^\d.,]/g, "");
    
    // If there's a comma, treat it as decimal separator
    // Otherwise, treat dots as thousands separators and remove them
    if (cleaned.includes(",")) {
      // Has decimal separator (comma)
      // Remove all dots (thousands separators) and replace comma with dot for parseFloat
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // No decimal separator, dots are thousands separators - remove them all
      cleaned = cleaned.replace(/\./g, "");
    }
    
    // Parse as float, allowing very large numbers
    const parsed = cleaned === "" ? 0 : parseFloat(cleaned);
    
    // Return 0 if NaN, otherwise return the parsed value (no upper limit)
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const formatPercentage = useCallback((value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    // Show decimals only if they exist and are significant
    // For example: 95 -> "95", 95.5 -> "95.5", 95.50 -> "95.5"
    const rounded = Math.round(value * 100) / 100; // Round to 2 decimal places
    if (rounded % 1 === 0) {
      return rounded.toString(); // No decimals needed
    }
    // Show up to 2 decimal places, remove trailing zeros
    return rounded.toFixed(2).replace(/\.?0+$/, "");
  }, []);

  const parsePercentage = useCallback((value: string): number => {
    // Remove % sign if present, and clean the string
    let cleaned = value.replace(/%/g, "").trim();
    
    // Allow dots, commas, and digits - remove everything else
    cleaned = cleaned.replace(/[^\d.,]/g, "");
    
    // Handle decimal separator intelligently
    if (cleaned.includes(",") && cleaned.includes(".")) {
      // Both present - determine which is decimal separator based on position
      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");
      
      // Use the last occurrence as decimal separator
      if (lastComma > lastDot) {
        // Comma is decimal separator, remove all dots
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        // Dot is decimal separator, remove all commas
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      // Only comma - treat as decimal separator (European format)
      // Remove any dots that might be there, then replace comma with dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.includes(".")) {
      // Only dot - treat as decimal separator (US format)
      // Keep as is, dots are decimal separators for percentages
    }
    // If no separators, just digits - keep as is
    
    const parsed = cleaned === "" ? 0 : parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  return (
    <div className="bg-white rounded-lg border border-[#E4E4E7] p-6 shadow-sm flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-[#212121]">
        {t.financialEstimate?.basicInformation?.title || "Basic Information"}
      </h2>

      {/* Investment Amount Section */}
      <div className="border border-[#E4E4E7] rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection("investment")}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-t-lg"
        >
          <span className="text-base font-semibold text-[#212121]">
            {t.financialEstimate?.basicInformation?.investmentAmount}
          </span>
          {expandedSections.includes("investment") ? (
            <ChevronUp className="h-5 w-5 text-[#71717A]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#71717A]" />
          )}
        </button>
        {expandedSections.includes("investment") && (
          <div className="px-4 pb-4 space-y-4 pt-2">
            <div>
              <Label htmlFor="purchasePrice" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.purchasePrice}
              </Label>
              {property?.data?.precioVenta && (
                <p className="text-xs text-[#71717A] mt-1">
                  {t.financialEstimate?.basicInformation?.sellingPrice || "Selling price"}: {formatNumber(property.data.precioVenta)}€
                </p>
              )}
              <div className="relative mt-2">
                <Input
                  id="purchasePrice"
                  type="text"
                  value={formatNumber(basicInfo.purchasePrice)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    // Allow any positive number, no upper limit
                    if (value >= 0) {
                      onBasicInfoChange({ ...basicInfo, purchasePrice: value });
                    }
                  }}
                  placeholder="0"
                  className="pr-8"
                  maxLength={undefined} // Remove any maxLength restriction
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  €
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="closingCosts" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.closingCosts}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="closingCosts"
                  type="text"
                  value={formatNumber(basicInfo.closingCosts)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    // Allow any positive number, no upper limit
                    if (value >= 0) {
                      onBasicInfoChange({ ...basicInfo, closingCosts: value });
                    }
                  }}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  €
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recurring Costs Section */}
      <div className="border border-[#E4E4E7] rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection("recurring")}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-t-lg"
        >
          <span className="text-base font-semibold text-[#212121]">
            {t.financialEstimate?.basicInformation?.recurringCosts}
          </span>
          {expandedSections.includes("recurring") ? (
            <ChevronUp className="h-5 w-5 text-[#71717A]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#71717A]" />
          )}
        </button>
        {expandedSections.includes("recurring") && (
          <div className="px-4 pb-4 space-y-4 pt-2">
            <div>
              <Label htmlFor="monthlyRent" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.monthlyRent}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="monthlyRent"
                  type="text"
                  value={formatNumber(basicInfo.monthlyRent)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    // Allow any positive number, no upper limit
                    if (value >= 0) {
                      onBasicInfoChange({ ...basicInfo, monthlyRent: value });
                    }
                  }}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  €
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="propertyManagementPlan" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.propertyManagementPlan}
              </Label>
              <Select
                value={basicInfo.propertyManagementPlan}
                onValueChange={(value: PropertyManagementPlan) => {
                  onBasicInfoChange({ ...basicInfo, propertyManagementPlan: value });
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5% Basic">5% Basic</SelectItem>
                  <SelectItem value="7% Premium">7% Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Financing Section */}
      <div className="border border-[#E4E4E7] rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection("financing")}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-t-lg"
        >
          <span className="text-base font-semibold text-[#212121]">
            {t.financialEstimate?.basicInformation?.financing}
          </span>
          {expandedSections.includes("financing") ? (
            <ChevronUp className="h-5 w-5 text-[#71717A]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#71717A]" />
          )}
        </button>
        {expandedSections.includes("financing") && (
          <div className="px-4 pb-4 space-y-4 pt-2">
            <div>
              <Label htmlFor="financingType" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.financingType || "Financing"}
              </Label>
              <Select
                value={financing.financingType || "Inversión"}
                onValueChange={(value: FinancingType) => {
                  // Auto-configure LTV and Loan Term based on financing type
                  let newLtv = financing.ltv;
                  let newLoanTerm = financing.loanTerm;
                  
                  if (value === "Primera vivienda") {
                    newLtv = 95;
                    newLoanTerm = 30;
                  } else if (value === "Segunda vivienda") {
                    newLtv = 65;
                    newLoanTerm = 20;
                  } else if (value === "Inversión") {
                    newLtv = 55;
                    newLoanTerm = 15;
                  }
                  
                  onFinancingChange({ ...financing, financingType: value, ltv: newLtv, loanTerm: newLoanTerm });
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primera vivienda">
                    Primera vivienda {financing.financingType === "Primera vivienda" && `(${financing.loanTerm} ${t.financialEstimate?.basicInformation?.years || "years"})`}
                  </SelectItem>
                  <SelectItem value="Segunda vivienda">
                    Segunda vivienda {financing.financingType === "Segunda vivienda" && `(${financing.loanTerm} ${t.financialEstimate?.basicInformation?.years || "years"})`}
                  </SelectItem>
                  <SelectItem value="Inversión">
                    Inversión {financing.financingType === "Inversión" && `(${financing.loanTerm} ${t.financialEstimate?.basicInformation?.years || "years"})`}
                  </SelectItem>
                </SelectContent>
              </Select>
              {financing.financingType && (
                <p className="text-xs text-[#71717A] mt-1">
                  {t.financialEstimate?.basicInformation?.loanTerm || "Loan term"}: {financing.loanTerm} {t.financialEstimate?.basicInformation?.years || "years"}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ltv" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.ltv || "LTV (Loan to Value)"}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="ltv"
                  type="text"
                  inputMode="decimal"
                  value={formatPercentage(financing.ltv)}
                  onChange={(e) => {
                    const value = parsePercentage(e.target.value);
                    // Clamp between 0 and 100 for LTV
                    const clampedValue = Math.min(100, Math.max(0, value));
                    onFinancingChange({ ...financing, ltv: clampedValue });
                  }}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  %
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="loanTerm" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.loanTerm || "Loan Term"}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="loanTerm"
                  type="text"
                  value={formatNumber(financing.loanTerm)}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    // Allow any positive number, no upper limit
                    if (value >= 0) {
                      onFinancingChange({ ...financing, loanTerm: value });
                    }
                  }}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  {t.financialEstimate?.basicInformation?.years || "years"}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="interestRate" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.interestRate}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="interestRate"
                  type="text"
                  value={formatPercentage(financing.interestRate)}
                  onChange={(e) => {
                    const value = parsePercentage(e.target.value);
                    onFinancingChange({ ...financing, interestRate: value });
                  }}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71717A]">
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Drivers Section */}
      <div className="border border-[#E4E4E7] rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection("scenarios")}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-t-lg"
        >
          <span className="text-base font-semibold text-[#212121]">
            {t.financialEstimate?.basicInformation?.scenarioDrivers}
          </span>
          {expandedSections.includes("scenarios") ? (
            <ChevronUp className="h-5 w-5 text-[#71717A]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#71717A]" />
          )}
        </button>
        {expandedSections.includes("scenarios") && (
          <div className="px-4 pb-4 space-y-4 pt-2">
            <div>
              <Label htmlFor="rentalVariationConservative" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.rentalVariationConservative}
              </Label>
              <div className="mt-2 space-y-2">
                <input
                  id="rentalVariationConservative"
                  type="range"
                  min="-50"
                  max="50"
                  step="0.1"
                  value={scenarioDrivers.rentalVariationConservative}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onScenarioDriversChange({
                      ...scenarioDrivers,
                      rentalVariationConservative: value,
                    });
                  }}
                  className="w-full slider-thumb"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">-50%</span>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatPercentage(scenarioDrivers.rentalVariationConservative)}
                      onChange={(e) => {
                        const value = parsePercentage(e.target.value);
                        onScenarioDriversChange({
                          ...scenarioDrivers,
                          rentalVariationConservative: Math.min(50, Math.max(-50, value)),
                        });
                      }}
                      className="w-20 text-center pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-[#71717A]">50%</span>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="rentalVariationFavorable" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.rentalVariationFavorable}
              </Label>
              <div className="mt-2 space-y-2">
                <input
                  id="rentalVariationFavorable"
                  type="range"
                  min="-50"
                  max="50"
                  step="0.1"
                  value={scenarioDrivers.rentalVariationFavorable}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onScenarioDriversChange({
                      ...scenarioDrivers,
                      rentalVariationFavorable: value,
                    });
                  }}
                  className="w-full slider-thumb"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">-50%</span>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatPercentage(scenarioDrivers.rentalVariationFavorable)}
                      onChange={(e) => {
                        const value = parsePercentage(e.target.value);
                        onScenarioDriversChange({
                          ...scenarioDrivers,
                          rentalVariationFavorable: Math.min(50, Math.max(-50, value)),
                        });
                      }}
                      className="w-20 text-center pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-[#71717A]">50%</span>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="occupancyRateConservative" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.occupancyRateConservative}
              </Label>
              <div className="mt-2 space-y-2">
                <input
                  id="occupancyRateConservative"
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenarioDrivers.occupancyRateConservative}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onScenarioDriversChange({
                      ...scenarioDrivers,
                      occupancyRateConservative: value,
                    });
                  }}
                  className="w-full slider-thumb"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">0%</span>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatPercentage(scenarioDrivers.occupancyRateConservative)}
                      onChange={(e) => {
                        const value = parsePercentage(e.target.value);
                        onScenarioDriversChange({
                          ...scenarioDrivers,
                          occupancyRateConservative: Math.min(100, Math.max(0, value)),
                        });
                      }}
                      className="w-20 text-center pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-[#71717A]">100%</span>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="occupancyRateFavorable" className="text-sm font-medium text-[#212121]">
                {t.financialEstimate?.basicInformation?.occupancyRateFavorable}
              </Label>
              <div className="mt-2 space-y-2">
                <input
                  id="occupancyRateFavorable"
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenarioDrivers.occupancyRateFavorable}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onScenarioDriversChange({
                      ...scenarioDrivers,
                      occupancyRateFavorable: value,
                    });
                  }}
                  className="w-full slider-thumb"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">0%</span>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatPercentage(scenarioDrivers.occupancyRateFavorable)}
                      onChange={(e) => {
                        const value = parsePercentage(e.target.value);
                        onScenarioDriversChange({
                          ...scenarioDrivers,
                          occupancyRateFavorable: Math.min(100, Math.max(0, value)),
                        });
                      }}
                      className="w-20 text-center pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-[#71717A]">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        type="button"
        onClick={onGenerate}
        className="w-full bg-[#162EB7] text-white hover:bg-[#1B36A3] rounded-full py-2.5 font-medium"
      >
        {hasResults
          ? t.financialEstimate?.basicInformation?.regenerateFinancial
          : t.financialEstimate?.basicInformation?.generateFinancial}
      </Button>
    </div>
  );
}
