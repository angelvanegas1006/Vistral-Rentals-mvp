"use client";

import { forwardRef, useCallback } from "react";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyData, PropertyType } from "@/lib/supply-property-storage";
import { PROPERTY_TYPES } from "@/lib/constants";
import { useFormState } from "@/hooks/useFormState";
import { useI18n } from "@/lib/i18n";

interface InfoPropiedadSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
}

export const InfoPropiedadSection = forwardRef<HTMLDivElement, InfoPropiedadSectionProps>(
  ({ data, onUpdate, onContinue }, ref) => {
    const { t } = useI18n();
    const router = useRouter();
    // Use form state hook for controlled components
    const { formData, updateField } = useFormState({
      initialData: data,
      onUpdate,
    });

    // Memoized handlers for number inputs
    const handleNumberChange = useCallback((
      field: "habitaciones" | "banos" | "plazasAparcamiento",
      delta: number
    ) => {
      const current = formData[field] || 0;
      const newValue = Math.max(0, Math.min(99, current + delta));
      updateField(field, newValue);
    }, [formData, updateField]);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t.property.sections.basicInfo}</h1>

        <div className="space-y-6">
          {/* Tipo de propiedad */}
          <div>
            <Label htmlFor="tipoPropiedad" className="text-sm font-semibold block">
              {t.propertyFields.propertyType} <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <Select
                value={formData.tipoPropiedad || ""}
                onValueChange={(value) => updateField("tipoPropiedad", value as PropertyType)}
              >
              <SelectTrigger id="tipoPropiedad">
                <SelectValue placeholder={t.formLabels.selectOption} />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[200px] overflow-y-auto">
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
          </div>

          {/* Superficie construida y útil en la misma fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Superficie construida */}
            <div>
              <Label htmlFor="superficieConstruida" className="text-sm font-semibold block">
                {t.propertyFields.builtArea} <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="superficieConstruida"
                  type="number"
                  value={formData.superficieConstruida || ""}
                  onChange={(e) =>
                    updateField("superficieConstruida", parseFloat(e.target.value) || undefined)
                  }
                  placeholder={`${t.formLabels.example} 80`}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.propertyFields.squareMeters}
                </span>
              </div>
            </div>

            {/* Superficie útil */}
            <div>
              <Label htmlFor="superficieUtil" className="text-sm font-semibold block">
                {t.propertyFields.usefulArea} <span className="text-xs text-muted-foreground font-normal">({t.formLabels.optional})</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="superficieUtil"
                  type="number"
                  value={formData.superficieUtil || ""}
                  onChange={(e) =>
                    updateField("superficieUtil", parseFloat(e.target.value) || undefined)
                  }
                  placeholder={`${t.formLabels.example} 70`}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.propertyFields.squareMeters}
                </span>
              </div>
            </div>
          </div>

          {/* Año de construcción */}
          <div>
            <Label htmlFor="anoConstruccion" className="text-sm font-semibold block">
              {t.propertyFields.constructionYear} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anoConstruccion"
              type="number"
              className="mt-2"
              value={formData.anoConstruccion || ""}
              onChange={(e) =>
                updateField("anoConstruccion", parseInt(e.target.value) || undefined)
              }
              placeholder={`${t.formLabels.example} 2005`}
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Referencia Catastral */}
          <div>
            <Label htmlFor="referenciaCatastral" className="text-sm font-semibold block">
              {t.propertyFields.cadastralReference} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="referenciaCatastral"
              className="mt-2"
              value={formData.referenciaCatastral || ""}
              onChange={(e) => updateField("referenciaCatastral", e.target.value)}
              placeholder={`${t.formLabels.example} 9872023 VH5797S 0001 WX`}
            />
          </div>

          {/* Orientación */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.propertyFields.orientation} <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3 mt-2">
              {(["Norte", "Sur", "Este", "Oeste"] as const).map((orientacion) => {
                const currentOrientaciones = formData.orientacion || [];
                const isChecked = currentOrientaciones.includes(orientacion);
                
                // Get translation key for orientation
                const orientationKey = orientacion.toLowerCase() as "norte" | "sur" | "este" | "oeste";
                const orientationLabel = t.propertyFields.orientationOptions?.[orientationKey] || orientacion;
                
                return (
                  <label key={orientacion} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updatedOrientaciones = e.target.checked
                          ? [...currentOrientaciones, orientacion]
                          : currentOrientaciones.filter(o => o !== orientacion);
                        // At least one selection is required for 100% completion
                        updateField("orientacion", updatedOrientaciones.length > 0 ? updatedOrientaciones : undefined);
                      }}
                      className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                    />
                    <span className="text-sm">{orientationLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Number inputs */}
          <div className="space-y-6">
            {/* Habitaciones */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-semibold">{t.propertyFields.bedrooms}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.formLabels.onlyRequiredForPublishing}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNumberChange("habitaciones", -1)}
                  disabled={(formData.habitaciones || 0) === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E5E5] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#4D4D4D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrementar habitaciones"
                >
                  <Minus className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
                </button>
                <div className="flex h-8 w-[34px] items-center justify-center rounded border border-[#D4D4D8] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                  <span className="text-sm font-medium text-[#A1A1AA] dark:text-[#737373] text-center">
                    {formData.habitaciones || 0}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNumberChange("habitaciones", 1)}
                  disabled={(formData.habitaciones || 0) === 99}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9E7FF] dark:bg-[#1B36A3] hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Incrementar habitaciones"
                >
                  <Plus className="h-4 w-4 text-[#162EB7] dark:text-[#5B8FFF]" />
                </button>
              </div>
            </div>

            {/* Baños */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-semibold">{t.propertyFields.bathrooms}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.formLabels.onlyRequiredForPublishing}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNumberChange("banos", -1)}
                  disabled={(formData.banos || 0) === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E5E5] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#4D4D4D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrementar baños"
                >
                  <Minus className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
                </button>
                <div className="flex h-8 w-[34px] items-center justify-center rounded border border-[#D4D4D8] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                  <span className="text-sm font-medium text-[#A1A1AA] dark:text-[#737373] text-center">
                    {formData.banos || 0}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNumberChange("banos", 1)}
                  disabled={(formData.banos || 0) === 99}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9E7FF] dark:bg-[#1B36A3] hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Incrementar baños"
                >
                  <Plus className="h-4 w-4 text-[#162EB7] dark:text-[#5B8FFF]" />
                </button>
              </div>
            </div>

            {/* Plazas de aparcamiento */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-semibold">{t.propertyFields.parkingSpots}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.formLabels.onlyRequiredForPublishing}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNumberChange("plazasAparcamiento", -1)}
                  disabled={(formData.plazasAparcamiento || 0) === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E5E5] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#4D4D4D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrementar plazas de aparcamiento"
                >
                  <Minus className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
                </button>
                <div className="flex h-8 w-[34px] items-center justify-center rounded border border-[#D4D4D8] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                  <span className="text-sm font-medium text-[#A1A1AA] dark:text-[#737373] text-center">
                    {formData.plazasAparcamiento || 0}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNumberChange("plazasAparcamiento", 1)}
                  disabled={(formData.plazasAparcamiento || 0) === 99}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9E7FF] dark:bg-[#1B36A3] hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Incrementar plazas de aparcamiento"
                >
                  <Plus className="h-4 w-4 text-[#162EB7] dark:text-[#5B8FFF]" />
                </button>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-semibold">
              {t.formLabels.indicateIfPropertyHas}
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ascensor || false}
                  onChange={(e) => updateField("ascensor", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.propertyFields.elevator}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.balconTerraza || false}
                  onChange={(e) => updateField("balconTerraza", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.propertyFields.balconyTerrace}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.trastero || false}
                  onChange={(e) => updateField("trastero", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--prophero-gray-300)] text-[var(--prophero-blue-600)] focus:ring-[var(--prophero-blue-500)]"
                />
                <span className="text-sm">{t.propertyFields.storage}</span>
              </label>
            </div>
          </div>

          {/* Navigation */}
          {onContinue && (
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  router.push("/supply/kanban");
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

InfoPropiedadSection.displayName = "InfoPropiedadSection";
