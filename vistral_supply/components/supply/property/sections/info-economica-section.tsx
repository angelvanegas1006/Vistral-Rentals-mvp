"use client";

import { forwardRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PropertyData } from "@/lib/supply-property-storage";
import { useFormState } from "@/hooks/useFormState";
import { useI18n } from "@/lib/i18n";

interface InfoEconomicaSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
}

export const InfoEconomicaSection = forwardRef<HTMLDivElement, InfoEconomicaSectionProps>(
  ({ data, onUpdate, onContinue }, ref) => {
    const { t } = useI18n();
    // Use form state hook for controlled components
    const { formData, updateField } = useFormState({
      initialData: data,
      onUpdate,
    });

    // Memoized formatters for better performance
    const formatNumber = useCallback((value: string | number | undefined): string => {
      if (!value) return "";
      const numStr = typeof value === "number" ? value.toString() : value;
      // Remove all non-digit characters for storage
      const cleaned = numStr.replace(/[^\d]/g, "");
      return cleaned === "" ? "" : parseFloat(cleaned).toLocaleString("es-ES");
    }, []);

    const parseNumber = useCallback((value: string): number | undefined => {
      const cleaned = value.replace(/[^\d]/g, "");
      return cleaned === "" ? undefined : parseFloat(cleaned);
    }, []);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t.property.sections.economicInfo}</h1>

        <div className="space-y-6">
          {/* Precio de venta */}
          <div>
            <Label htmlFor="precioVenta" className="text-sm font-semibold block">
              {t.propertyFields.salePrice} <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <Input
                id="precioVenta"
                type="text"
                value={formatNumber(formData.precioVenta)}
                onChange={(e) => {
                  const parsed = parseNumber(e.target.value);
                  updateField("precioVenta", parsed);
                }}
                placeholder={`${t.formLabels.example} 400.000`}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>

          {/* Gastos de comunidad mensuales */}
          <div>
            <Label htmlFor="gastosComunidad" className="text-sm font-semibold block">
              {t.propertyFields.monthlyCommunityFees} <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <Input
                id="gastosComunidad"
                type="text"
                value={formatNumber(formData.gastosComunidad)}
                onChange={(e) => {
                  const parsed = parseNumber(e.target.value);
                  updateField("gastosComunidad", parsed);
                }}
                placeholder={`${t.formLabels.example} 350`}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €/mes
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                  checked={formData.confirmacionGastosComunidad || false}
                  onChange={(e) => updateField("confirmacionGastosComunidad", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
              />
              <span className="text-sm text-muted-foreground">
                {t.propertyFields.confirmCommunityFees}
              </span>
            </label>
          </div>

          {/* IBI Anual */}
          <div>
            <Label htmlFor="ibiAnual" className="text-sm font-semibold block">
              {t.propertyFields.annualIBI} <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <Input
                id="ibiAnual"
                type="text"
                value={formatNumber(formData.ibiAnual)}
                onChange={(e) => {
                  const parsed = parseNumber(e.target.value);
                  updateField("ibiAnual", parsed);
                }}
                placeholder={`${t.formLabels.example} 1.000`}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €/año
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                  checked={formData.confirmacionIBI || false}
                  onChange={(e) => updateField("confirmacionIBI", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
              />
              <span className="text-sm text-muted-foreground">
                {t.propertyFields.confirmIBI}
              </span>
            </label>
          </div>

          {/* Navigation */}
          {onContinue && (
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  window.history.back();
                }}
                className="flex items-center gap-2 text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="currentColor"/>
                </svg>
                {t.common.back || "Atrás"}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save current data before continuing
                  onUpdate(formData);
                  onContinue();
                }}
                className="px-6 py-2 h-9 bg-[#D9E7FF] dark:bg-[#1B36A3] text-[#162EB7] dark:text-[#5B8FFF] rounded-full font-medium text-sm hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] transition-colors"
              >
                {t.property.sections.nextSection || "Siguiente sección"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

InfoEconomicaSection.displayName = "InfoEconomicaSection";
