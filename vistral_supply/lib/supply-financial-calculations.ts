/**
 * Financial calculation functions for Property Profitability Simulation
 */

import {
  BasicInfo,
  Financing,
  ScenarioDrivers,
  FinancialResults,
  AcquisitionCosts,
  FeesAndCapes,
  InvestmentTotals,
  Income,
  OperatingExpenses,
  ReturnsAndYields,
} from "./supply-financial-estimate-storage";
import { getITPRate } from "./config/itp-rates";
import { extractProvinceFromAddress } from "./utils";

/**
 * Calculate acquisition costs for both scenarios
 */
function calculateAcquisitionCosts(
  basicInfo: BasicInfo,
  scenarioDrivers: ScenarioDrivers,
  propertyAddress?: string | null
): AcquisitionCosts {
  const purchasePrice = basicInfo.purchasePrice;
  const closingCosts = basicInfo.closingCosts;
  
  // Sale Price = Purchase Price × (1 + Rental Variation %)
  const salePriceConservative = purchasePrice * (1 + scenarioDrivers.rentalVariationConservative / 100);
  const salePriceFavorable = purchasePrice * (1 + scenarioDrivers.rentalVariationFavorable / 100);
  
  // Deposit = Purchase Price × (LTV / 100) - will be calculated later with financing
  // For now, we'll use a default calculation
  const deposit = purchasePrice * 0.2; // Default 20% deposit, will be recalculated with LTV
  
  // Taxes: Calculate ITP based on province
  // Extract province from address and get ITP rate
  const province = propertyAddress ? extractProvinceFromAddress(propertyAddress) : null;
  const itpRate = getITPRate(province);
  const taxes = purchasePrice * itpRate;
  
  return {
    salePriceConservative,
    salePriceFavorable,
    purchasePrice,
    deposit,
    taxes,
    closingCosts,
  };
}

/**
 * Calculate fees and CAPEX costs
 * These are typically fixed costs regardless of scenario
 */
function calculateFeesAndCapes(
  basicInfo: BasicInfo,
  purchasePrice: number,
  habitaciones?: number | null,
  renovationCost?: number | null
): FeesAndCapes {
  // Renovation Cost: Should come from renovation budget (automated)
  const renovationCostValue = renovationCost || 0;
  
  // Furnishing Cost: Based on number of rooms
  // If 1 room = 3738.17€
  // If > 1 room = 3738.17 * (420.2) * num_habitaciones
  let furnishingCost = 0;
  if (habitaciones === 1) {
    furnishingCost = 3738.17;
  } else if (habitaciones && habitaciones > 1) {
    furnishingCost = 3738.17 * 420.2 * habitaciones;
  } else {
    // Default if no habitaciones data
    furnishingCost = 3738.17;
  }
  
  // Tenant Searching Fee: monthly_rent * 1.21
  const tenantSearchingFee = basicInfo.monthlyRent * 1.21;
  
  // RE Agent Fee: Typically 2-3% of purchase price
  const reAgentFee = purchasePrice * 0.025; // 2.5%
  
  // PropHero Fee: Based on property management plan percentage
  const propHeroFeePercentage = basicInfo.propertyManagementPlan === "5% Basic" ? 0.05 : 0.07;
  const propHeroFee = purchasePrice * propHeroFeePercentage;
  
  return {
    renovationCost: renovationCostValue,
    furnishingCost,
    tenantSearchingFee,
    reAgentFee,
    propHeroFee,
  };
}

/**
 * Calculate investment totals
 */
function calculateInvestmentTotals(
  acquisitionCosts: AcquisitionCosts,
  feesAndCapes: FeesAndCapes,
  financing: Financing
): InvestmentTotals {
  // Total Investment (Non Financed) = Purchase Price + Closing Costs + Taxes + Fees & CAPEX
  const totalInvestmentNonFinanced =
    acquisitionCosts.purchasePrice +
    acquisitionCosts.closingCosts +
    acquisitionCosts.taxes +
    feesAndCapes.renovationCost +
    feesAndCapes.furnishingCost +
    feesAndCapes.tenantSearchingFee +
    feesAndCapes.reAgentFee +
    feesAndCapes.propHeroFee;
  
  // Total Investment (Financed) = Non Financed + Loan Amount
  // Loan Amount = Purchase Price × (LTV / 100)
  const loanAmount = acquisitionCosts.purchasePrice * (financing.ltv / 100);
  const totalInvestmentFinanced = totalInvestmentNonFinanced + loanAmount;
  
  return {
    totalInvestmentNonFinanced,
    totalInvestmentFinanced,
  };
}

/**
 * Calculate income for both scenarios
 */
function calculateIncome(
  basicInfo: BasicInfo,
  scenarioDrivers: ScenarioDrivers,
  acquisitionCosts: AcquisitionCosts
): Income {
  // Gross Monthly Rent = Monthly Rent × (1 + Rental Variation %) × (Occupancy Rate % / 100)
  const grossMonthlyRentConservative =
    basicInfo.monthlyRent *
    (1 + scenarioDrivers.rentalVariationConservative / 100) *
    (scenarioDrivers.occupancyRateConservative / 100);
  
  const grossMonthlyRentFavorable =
    basicInfo.monthlyRent *
    (1 + scenarioDrivers.rentalVariationFavorable / 100) *
    (scenarioDrivers.occupancyRateFavorable / 100);
  
  // Gross Annual Rent = Gross Monthly Rent × 12
  const grossAnnualRentConservative = grossMonthlyRentConservative * 12;
  const grossAnnualRentFavorable = grossMonthlyRentFavorable * 12;
  
  // Gross Yield = (Gross Annual Rent / Sale Price) × 100
  const grossYieldConservative = (grossAnnualRentConservative / acquisitionCosts.salePriceConservative) * 100;
  const grossYieldFavorable = (grossAnnualRentFavorable / acquisitionCosts.salePriceFavorable) * 100;
  
  return {
    grossMonthlyRentConservative,
    grossMonthlyRentFavorable,
    grossAnnualRentConservative,
    grossAnnualRentFavorable,
    grossYieldConservative,
    grossYieldFavorable,
  };
}

/**
 * Calculate operating expenses
 */
function calculateOperatingExpenses(
  basicInfo: BasicInfo,
  propertyData: {
    gastosComunidad?: number;
    ibiAnual?: number;
  },
  income: Income,
  financing: Financing,
  acquisitionCosts: AcquisitionCosts
): OperatingExpenses {
  // Community Fees (Monthly) = gastosComunidad from property data
  const communityFeesMonthly = propertyData.gastosComunidad || 0;
  
  // Home Insurance (Monthly): Typically 0.1% of purchase price annually, divided by 12
  const homeInsuranceMonthly = (acquisitionCosts.purchasePrice * 0.001) / 12;
  
  // IBI (Monthly) = ibiAnual / 12
  const ibiMonthly = (propertyData.ibiAnual || 0) / 12;
  
  // Property Management (Monthly) = Gross Monthly Rent × Management Plan %
  const managementPercentage = basicInfo.propertyManagementPlan === "5% Basic" ? 0.05 : 0.07;
  const propertyManagementMonthlyConservative = income.grossMonthlyRentConservative * managementPercentage;
  const propertyManagementMonthlyFavorable = income.grossMonthlyRentFavorable * managementPercentage;
  
  // Loan Interest (Annual) = Loan Amount × Interest Rate
  const loanAmount = acquisitionCosts.purchasePrice * (financing.ltv / 100);
  const loanInterestConservative = loanAmount * (financing.interestRate / 100);
  const loanInterestFavorable = loanAmount * (financing.interestRate / 100);
  
  return {
    communityFeesMonthly,
    homeInsuranceMonthly,
    ibiMonthly,
    propertyManagementMonthlyConservative,
    propertyManagementMonthlyFavorable,
    loanInterestConservative,
    loanInterestFavorable,
  };
}

/**
 * Calculate returns and yields
 */
function calculateReturnsAndYields(
  income: Income,
  operatingExpenses: OperatingExpenses,
  investmentTotals: InvestmentTotals,
  financing: Financing,
  acquisitionCosts: AcquisitionCosts
): ReturnsAndYields {
  // Net Monthly Rent (No Financing) = Gross Monthly Rent - Operating Expenses (excluding loan interest)
  const netMonthlyRentNoFinancingConservative =
    income.grossMonthlyRentConservative -
    operatingExpenses.communityFeesMonthly -
    operatingExpenses.homeInsuranceMonthly -
    operatingExpenses.ibiMonthly -
    operatingExpenses.propertyManagementMonthlyConservative;
  
  const netMonthlyRentNoFinancingFavorable =
    income.grossMonthlyRentFavorable -
    operatingExpenses.communityFeesMonthly -
    operatingExpenses.homeInsuranceMonthly -
    operatingExpenses.ibiMonthly -
    operatingExpenses.propertyManagementMonthlyFavorable;
  
  // Net Annual Rent (No Financing) = Net Monthly Rent × 12
  const netAnnualRentNoFinancingConservative = netMonthlyRentNoFinancingConservative * 12;
  const netAnnualRentNoFinancingFavorable = netMonthlyRentNoFinancingFavorable * 12;
  
  // Net Yield (No Financing) = (Net Annual Rent / Total Investment Non Financed) × 100
  const netYieldNoFinancingConservative =
    (netAnnualRentNoFinancingConservative / investmentTotals.totalInvestmentNonFinanced) * 100;
  const netYieldNoFinancingFavorable =
    (netAnnualRentNoFinancingFavorable / investmentTotals.totalInvestmentNonFinanced) * 100;
  
  // Net Monthly Rent (Financing) = Net Monthly Rent (No Financing) - (Loan Interest / 12)
  const netMonthlyRentFinancingConservative =
    netMonthlyRentNoFinancingConservative - (operatingExpenses.loanInterestConservative / 12);
  const netMonthlyRentFinancingFavorable =
    netMonthlyRentNoFinancingFavorable - (operatingExpenses.loanInterestFavorable / 12);
  
  // Net Annual Rent (Financing) = Net Monthly Rent × 12
  const netAnnualRentFinancingConservative = netMonthlyRentFinancingConservative * 12;
  const netAnnualRentFinancingFavorable = netMonthlyRentFinancingFavorable * 12;
  
  // Net Yield (Financing) - ROCE = (Net Annual Rent (Financing) / Deposit) × 100
  // CRITICAL: ROCE uses deposit as denominator, not total_investment_financed
  const netYieldFinancingConservative =
    acquisitionCosts.deposit > 0
      ? (netAnnualRentFinancingConservative / acquisitionCosts.deposit) * 100
      : 0;
  const netYieldFinancingFavorable =
    acquisitionCosts.deposit > 0
      ? (netAnnualRentFinancingFavorable / acquisitionCosts.deposit) * 100
      : 0;
  
  return {
    netMonthlyRentNoFinancingConservative,
    netMonthlyRentNoFinancingFavorable,
    netAnnualRentNoFinancingConservative,
    netAnnualRentNoFinancingFavorable,
    netYieldNoFinancingConservative,
    netYieldNoFinancingFavorable,
    netMonthlyRentFinancingConservative,
    netMonthlyRentFinancingFavorable,
    netAnnualRentFinancingConservative,
    netAnnualRentFinancingFavorable,
    netYieldFinancingConservative,
    netYieldFinancingFavorable,
  };
}

/**
 * Check if the estimate meets the yield threshold
 */
export function checkMeetsThreshold(
  returnsAndYields: ReturnsAndYields,
  yieldThreshold: number
): boolean {
  // Check if at least one scenario (Conservative or Favorable) meets the threshold
  // for either Net Yield (No Financing) or Net Yield (Financing)
  return (
    returnsAndYields.netYieldNoFinancingConservative >= yieldThreshold ||
    returnsAndYields.netYieldNoFinancingFavorable >= yieldThreshold ||
    returnsAndYields.netYieldFinancingConservative >= yieldThreshold ||
    returnsAndYields.netYieldFinancingFavorable >= yieldThreshold
  );
}

/**
 * Main function to calculate complete financial estimate
 */
export function calculateFinancialEstimate(
  basicInfo: BasicInfo,
  financing: Financing,
  scenarioDrivers: ScenarioDrivers,
  propertyData: {
    gastosComunidad?: number;
    ibiAnual?: number;
    fullAddress?: string | null;
    habitaciones?: number | null;
    renovationCost?: number | null;
  },
  yieldThreshold: number = 5.50
): {
  results: FinancialResults;
  meetsThreshold: boolean;
} {
  // Calculate in order of dependencies
  const acquisitionCosts = calculateAcquisitionCosts(
    basicInfo,
    scenarioDrivers,
    propertyData.fullAddress
  );
  
  // Recalculate deposit based on LTV
  // Deposit = Purchase Price × (1 - LTV/100) since LTV is the loan percentage
  acquisitionCosts.deposit = acquisitionCosts.purchasePrice * (1 - financing.ltv / 100);
  
  const feesAndCapes = calculateFeesAndCapes(
    basicInfo,
    acquisitionCosts.purchasePrice,
    propertyData.habitaciones,
    propertyData.renovationCost
  );
  const investmentTotals = calculateInvestmentTotals(acquisitionCosts, feesAndCapes, financing);
  const income = calculateIncome(basicInfo, scenarioDrivers, acquisitionCosts);
  const operatingExpenses = calculateOperatingExpenses(
    basicInfo,
    propertyData,
    income,
    financing,
    acquisitionCosts
  );
  const returnsAndYields = calculateReturnsAndYields(
    income,
    operatingExpenses,
    investmentTotals,
    financing,
    acquisitionCosts
  );
  
  const results: FinancialResults = {
    acquisitionCosts,
    feesAndCapes,
    investmentTotals,
    income,
    operatingExpenses,
    returnsAndYields,
  };
  
  const meetsThreshold = checkMeetsThreshold(returnsAndYields, yieldThreshold);
  
  return {
    results,
    meetsThreshold,
  };
}
