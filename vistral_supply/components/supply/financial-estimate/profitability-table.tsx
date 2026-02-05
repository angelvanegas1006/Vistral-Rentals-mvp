"use client";

import { FinancialResults, Financing } from "@/lib/supply-financial-estimate-storage";
import { useI18n } from "@/lib/i18n";

interface ProfitabilityTableProps {
  results: FinancialResults;
  meetsThreshold: boolean;
  yieldThreshold: number;
  financing?: Financing | null;
}

export function ProfitabilityTable({
  results,
  meetsThreshold,
  yieldThreshold,
  financing,
}: ProfitabilityTableProps) {
  const { t } = useI18n();

  // Format currency in Spanish format: dots for thousands, commas for decimals, € without space
  const formatCurrency = (value: number): string => {
    if (value === 0) return "0€";
    
    // Split into integer and decimal parts
    const integerPart = Math.floor(Math.abs(value));
    const decimalPart = Math.abs(value) - integerPart;
    
    // Format integer part with dots for thousands
    const formattedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Format decimal part (2 decimals) with comma
    const formattedDecimal = decimalPart > 0 ? `,${decimalPart.toFixed(2).split(".")[1]}` : ",00";
    
    // Combine with € symbol (no space)
    const sign = value < 0 ? "-" : "";
    return `${sign}${formattedInteger}${formattedDecimal}€`;
  };

  const formatPercentage = (value: number | null | undefined): string => {
    // Handle null or undefined values
    if (value === null || value === undefined || isNaN(value)) {
      return "0,00%";
    }
    // Format percentage with comma for decimals
    return `${value.toFixed(2).replace(".", ",")}%`;
  };

  // Check if financing is disabled (LTV = 0 or no financing)
  const hasNoFinancing = !financing || financing.ltv === 0;

  return (
    <div className="bg-white rounded-lg border border-[#E4E4E7] p-6 shadow-sm flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-[#212121]">
        {t.financialEstimate.profitabilityTable.title}
      </h2>

      {/* Viability Indicator - At the top */}
      <div className="flex items-center gap-3">
        {meetsThreshold ? (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#10B981] text-white font-semibold">
              ✓
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#166534]">
                {t.financialEstimate.profitabilityTable.feasibilityConfirmed?.replace(
                  "{threshold}",
                  yieldThreshold.toString()
                ) || `OK - The property reaches a profitability threshold of ${yieldThreshold}%`}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EF4444] text-white font-semibold">
              ✗
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#92400E]">
                {t.financialEstimate.profitabilityTable.thresholdNotReached?.replace(
                  "{threshold}",
                  yieldThreshold.toString()
                ) || `Not OK - The property does not reach the profitability threshold of ${yieldThreshold}%`}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Outcome Alerts */}
      {meetsThreshold ? (
        <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-4">
          <p className="text-sm font-medium text-[#166534]">
            {t.financialEstimate.profitabilityTable.successAlert || "At least one scenario is viable. The financial indicators validate the feasibility of the operation under the current terms."}
          </p>
        </div>
      ) : (
        <div className="bg-[#FFF7ED] border border-[#FCD34D] rounded-lg p-4">
          <p className="text-sm font-medium text-[#92400E]">
            {t.financialEstimate.profitabilityTable.warningAlert || "Both scenarios are not viable. Consider reviewing the financial parameters or discarding the property."}
          </p>
        </div>
      )}

      {/* Profitability Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#212121]">
                {t.financialEstimate.profitabilityTable.metric}
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#212121]">
                {t.financialEstimate.profitabilityTable.conservativeScenario}
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[#212121]">
                {t.financialEstimate.profitabilityTable.favorableScenario}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Acquisition Costs */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.acquisitionCosts}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.salePrice}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.acquisitionCosts.salePriceConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.acquisitionCosts.salePriceFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.purchasePrice}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.acquisitionCosts.purchasePrice)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.deposit}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  formatCurrency(results.acquisitionCosts.deposit)
                )}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.taxes}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.acquisitionCosts.taxes)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.closingCosts}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.acquisitionCosts.closingCosts)}
              </td>
            </tr>

            {/* Fees & Capes */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.feesAndCapes}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.renovationCost}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.feesAndCapes.renovationCost)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.furnishingCost}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.feesAndCapes.furnishingCost)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.tenantSearchingFee}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.feesAndCapes.tenantSearchingFee)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.reAgentFee}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.feesAndCapes.reAgentFee)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.propHeroFee}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.feesAndCapes.propHeroFee)}
              </td>
            </tr>

            {/* Investment Totals */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.investmentTotals}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.totalInvestmentNonFinanced}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right font-semibold" colSpan={2}>
                {formatCurrency(results.investmentTotals.totalInvestmentNonFinanced)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.totalInvestmentFinanced}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right font-semibold" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  formatCurrency(results.investmentTotals.totalInvestmentFinanced)
                )}
              </td>
            </tr>

            {/* Income */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.income}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.grossMonthlyRent}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.income.grossMonthlyRentConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.income.grossMonthlyRentFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.grossAnnualRent}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.income.grossAnnualRentConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.income.grossAnnualRentFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.grossYield}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatPercentage(results.income.grossYieldConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatPercentage(results.income.grossYieldFavorable)}
              </td>
            </tr>

            {/* Operating Expenses */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.operatingExpenses}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.communityFeesMonthly}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.operatingExpenses.communityFeesMonthly)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.homeInsuranceMonthly}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.operatingExpenses.homeInsuranceMonthly)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.ibiMonthly}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {formatCurrency(results.operatingExpenses.ibiMonthly)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.propertyManagementMonthly}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.operatingExpenses.propertyManagementMonthlyConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.operatingExpenses.propertyManagementMonthlyFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.loanInterest}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  <>
                    <span className="mr-4">{formatCurrency(results.operatingExpenses.loanInterestConservative)}</span>
                    <span>{formatCurrency(results.operatingExpenses.loanInterestFavorable)}</span>
                  </>
                )}
              </td>
            </tr>

            {/* Returns & Yields */}
            <tr className="border-b border-[#E4E4E7]">
              <td colSpan={3} className="py-2 px-4 text-sm font-semibold text-[#212121] bg-[#FAFAFA]">
                {t.financialEstimate.profitabilityTable.returnsAndYields}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.netMonthlyRentNoFinancing}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.returnsAndYields.netMonthlyRentNoFinancingConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.returnsAndYields.netMonthlyRentNoFinancingFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.netAnnualRentNoFinancing}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.returnsAndYields.netAnnualRentNoFinancingConservative)}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right">
                {formatCurrency(results.returnsAndYields.netAnnualRentNoFinancingFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7] bg-[#F0F4FF]">
              <td className="py-2 px-4 text-sm font-semibold text-[#212121] pl-8">
                {t.financialEstimate.profitabilityTable.netYieldNoFinancing}
              </td>
              <td className="py-2 px-4 text-sm font-semibold text-[#212121] text-right">
                {formatPercentage(results.returnsAndYields.netYieldNoFinancingConservative)}
              </td>
              <td className="py-2 px-4 text-sm font-semibold text-[#212121] text-right">
                {formatPercentage(results.returnsAndYields.netYieldNoFinancingFavorable)}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.netMonthlyRentFinancing}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  <>
                    <span className="mr-4">{formatCurrency(results.returnsAndYields.netMonthlyRentFinancingConservative)}</span>
                    <span>{formatCurrency(results.returnsAndYields.netMonthlyRentFinancingFavorable)}</span>
                  </>
                )}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7]">
              <td className="py-2 px-4 text-sm text-[#71717A] pl-8">
                {t.financialEstimate.profitabilityTable.netAnnualRentFinancing}
              </td>
              <td className="py-2 px-4 text-sm text-[#212121] text-right" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  <>
                    <span className="mr-4">{formatCurrency(results.returnsAndYields.netAnnualRentFinancingConservative)}</span>
                    <span>{formatCurrency(results.returnsAndYields.netAnnualRentFinancingFavorable)}</span>
                  </>
                )}
              </td>
            </tr>
            <tr className="border-b border-[#E4E4E7] bg-[#F0F4FF]">
              <td className="py-2 px-4 text-sm font-semibold text-[#212121] pl-8">
                {t.financialEstimate.profitabilityTable.netYieldFinancing}
              </td>
              <td className="py-2 px-4 text-sm font-semibold text-[#212121] text-right" colSpan={2}>
                {hasNoFinancing ? (
                  <span className="text-[#71717A]">Sin financiación</span>
                ) : (
                  <>
                    <span className="mr-4">{formatPercentage(results.returnsAndYields.netYieldFinancingConservative)}</span>
                    <span>{formatPercentage(results.returnsAndYields.netYieldFinancingFavorable)}</span>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
