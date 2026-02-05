"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyData, InquilinoSituation } from "@/lib/supply-property-storage";
import { useFormState } from "@/hooks/useFormState";
import { useI18n } from "@/lib/i18n";

interface EstadoLegalSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
}

export const EstadoLegalSection = forwardRef<HTMLDivElement, EstadoLegalSectionProps>(
  ({ data, onUpdate, onContinue }, ref) => {
    const { t } = useI18n();
    // Use form state hook for controlled components
    const { formData, updateField } = useFormState({
      initialData: data,
      onUpdate,
    });

    // Memoized derived state
    const showInquilinoDropdown = useMemo(() => 
      formData.propiedadAlquilada === true, 
      [formData.propiedadAlquilada]
    );

    // Memoized handler with side effects
    const handlePropiedadAlquiladaChange = useCallback((value: string) => {
      const isAlquilada = value === t.common.yes;
      updateField("propiedadAlquilada", isAlquilada);
      
      // Clear situacionInquilinos if not rented
      if (!isAlquilada) {
        updateField("situacionInquilinos", undefined);
      }
    }, [updateField, t.common.yes]);

    // Map Spanish values (stored in DB) to display translations
    const INQUILINO_OPTIONS_MAP: Record<InquilinoSituation, string> = {
      "Los inquilinos permanecen": t.propertyFields.tenantSituationOptions.tenantsRemain,
      "El inmueble se entregará libre": t.propertyFields.tenantSituationOptions.propertyWillBeDeliveredFree,
      "Está ocupado ilegalmente": t.propertyFields.tenantSituationOptions.illegallyOccupied,
    };
    
    const INQUILINO_OPTIONS: InquilinoSituation[] = [
      "Los inquilinos permanecen",
      "El inmueble se entregará libre",
      "Está ocupado ilegalmente",
    ];

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t.property.sections.legalStatus}</h1>

        <div className="space-y-6">
          {/* Comunidad de propietarios constituida */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.communityConstituted} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              {t.propertyFields.communityConstitutedDescription}
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comunidad"
                  checked={formData.comunidadPropietariosConstituida === true}
                  onChange={() => updateField("comunidadPropietariosConstituida", true)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comunidad"
                  checked={formData.comunidadPropietariosConstituida === false}
                  onChange={() => updateField("comunidadPropietariosConstituida", false)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.no}</span>
              </label>
            </div>
          </div>

          {/* El edificio tiene seguro activo */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.buildingInsuranceActive} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              {t.propertyFields.buildingInsuranceActiveDescription}
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="seguro"
                  checked={formData.edificioSeguroActivo === true}
                  onChange={() => updateField("edificioSeguroActivo", true)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="seguro"
                  checked={formData.edificioSeguroActivo === false}
                  onChange={() => updateField("edificioSeguroActivo", false)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.no}</span>
              </label>
            </div>
          </div>

          {/* PropHero se comercializa en exclusiva */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.exclusiveMarketing} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              {t.propertyFields.exclusiveMarketingDescription}
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exclusiva"
                  checked={formData.comercializaExclusiva === true}
                  onChange={() => updateField("comercializaExclusiva", true)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exclusiva"
                  checked={formData.comercializaExclusiva === false}
                  onChange={() => updateField("comercializaExclusiva", false)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.no}</span>
              </label>
            </div>
          </div>

          {/* El edificio tiene una ITE favorable en vigor */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.favorableITE} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              {t.propertyFields.favorableITEDescription}
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ite"
                  checked={formData.edificioITEfavorable === true}
                  onChange={() => updateField("edificioITEfavorable", true)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ite"
                  checked={formData.edificioITEfavorable === false}
                  onChange={() => updateField("edificioITEfavorable", false)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.no}</span>
              </label>
            </div>
          </div>

          {/* La propiedad está actualmente alquilada */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.propertyRented} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-2 mb-2">
              {t.propertyFields.propertyRentedDescription}
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alquilada"
                  checked={formData.propiedadAlquilada === true}
                  onChange={() => handlePropiedadAlquiladaChange(t.common.yes)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.yes}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alquilada"
                  checked={formData.propiedadAlquilada === false}
                  onChange={() => handlePropiedadAlquiladaChange(t.common.no)}
                  className="h-4 w-4 text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.common.no}</span>
              </label>
            </div>

            {/* Conditional Dropdown - Situación de los inquilinos */}
            {showInquilinoDropdown && (
              <div className="mt-4">
                <Label htmlFor="situacionInquilinos" className="text-sm font-semibold block">
                  {t.propertyFields.tenantSituation} <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <Select
                  value={formData.situacionInquilinos || ""}
                  onValueChange={(value) => updateField("situacionInquilinos", value as InquilinoSituation)}
                >
                  <SelectTrigger id="situacionInquilinos">
                    <SelectValue placeholder={t.formLabels.selectOption}>
                      {formData.situacionInquilinos ? INQUILINO_OPTIONS_MAP[formData.situacionInquilinos] : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4}>
                    {INQUILINO_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {INQUILINO_OPTIONS_MAP[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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

EstadoLegalSection.displayName = "EstadoLegalSection";
