/**
 * Types and interfaces for Financial Estimate data
 */

export type PropertyManagementPlan = "5% Basic" | "7% Premium";

export type FinancingType = "Primera vivienda" | "Segunda vivienda" | "Inversión";

export interface BasicInfo {
  purchasePrice: number;
  closingCosts: number;
  monthlyRent: number;
  propertyManagementPlan: PropertyManagementPlan;
}

export interface Financing {
  financingType: FinancingType; // Type of financing investment
  ltv: number; // Loan to Value percentage (can be auto-set based on financingType or manually edited)
  loanTerm: number; // in years (can be auto-set based on financingType or manually edited)
  interestRate: number; // percentage
}

export interface ScenarioDrivers {
  rentalVariationConservative: number; // percentage
  rentalVariationFavorable: number; // percentage
  occupancyRateConservative: number; // percentage
  occupancyRateFavorable: number; // percentage
}

export interface AcquisitionCosts {
  salePriceConservative: number;
  salePriceFavorable: number;
  purchasePrice: number;
  deposit: number;
  taxes: number;
  closingCosts: number;
}

export interface FeesAndCapes {
  renovationCost: number;
  furnishingCost: number;
  tenantSearchingFee: number;
  reAgentFee: number;
  propHeroFee: number;
}

export interface InvestmentTotals {
  totalInvestmentNonFinanced: number;
  totalInvestmentFinanced: number;
}

export interface Income {
  grossMonthlyRentConservative: number;
  grossMonthlyRentFavorable: number;
  grossAnnualRentConservative: number;
  grossAnnualRentFavorable: number;
  grossYieldConservative: number; // percentage
  grossYieldFavorable: number; // percentage
}

export interface OperatingExpenses {
  communityFeesMonthly: number;
  homeInsuranceMonthly: number;
  ibiMonthly: number;
  propertyManagementMonthlyConservative: number;
  propertyManagementMonthlyFavorable: number;
  loanInterestConservative: number;
  loanInterestFavorable: number;
}

export interface ReturnsAndYields {
  netMonthlyRentNoFinancingConservative: number;
  netMonthlyRentNoFinancingFavorable: number;
  netAnnualRentNoFinancingConservative: number;
  netAnnualRentNoFinancingFavorable: number;
  netYieldNoFinancingConservative: number; // percentage
  netYieldNoFinancingFavorable: number; // percentage
  netMonthlyRentFinancingConservative: number;
  netMonthlyRentFinancingFavorable: number;
  netAnnualRentFinancingConservative: number;
  netAnnualRentFinancingFavorable: number;
  netYieldFinancingConservative: number; // percentage (ROCE)
  netYieldFinancingFavorable: number; // percentage (ROCE)
}

export interface FinancialResults {
  acquisitionCosts: AcquisitionCosts;
  feesAndCapes: FeesAndCapes;
  investmentTotals: InvestmentTotals;
  income: Income;
  operatingExpenses: OperatingExpenses;
  returnsAndYields: ReturnsAndYields;
}

export interface FinancialEstimateData {
  id: string;
  propertyId: string;
  version: number;
  isCurrent: boolean;
  basicInfo: BasicInfo;
  financing: Financing;
  scenarioDrivers: ScenarioDrivers;
  results: FinancialResults;
  yieldThreshold: number;
  meetsThreshold: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
