"use client";

import { forwardRef, useCallback, useMemo, useEffect, useState, useRef } from "react";
import { Info, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PropertyData, VendedorData } from "@/lib/supply-property-storage";
import { useFormState } from "@/hooks/useFormState";
import { useI18n } from "@/lib/i18n";
import { CountryPhoneSelector } from "@/components/supply/property/country-phone-selector";
import { DniUploadZone } from "@/components/supply/property/dni-upload-zone";
import { 
  getCurrentPropertyOwners, 
  deactivatePropertyOwner,
  ownerRowToVendedorData 
} from "@/lib/supply-owners-supabase";

interface DatosVendedorSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
  propertyId?: string;
}


export const DatosVendedorSection = forwardRef<HTMLDivElement, DatosVendedorSectionProps>(
  ({ data, onUpdate, onContinue, propertyId }, ref) => {
    const { t } = useI18n();
    const [isLoadingOwners, setIsLoadingOwners] = useState(false);
    const [ownerIds, setOwnerIds] = useState<string[]>([]); // Track Supabase IDs for each owner
    const hasLoadedOwnersRef = useRef(false); // Track if owners have been loaded
    
    // Initialize vendedores array with at least one entry
    const initialVendedores = useMemo(() => {
      if (data.vendedores && data.vendedores.length > 0) {
        return data.vendedores;
      }
      return [{} as VendedorData];
    }, [data.vendedores]);
    
    const { formData, updateField } = useFormState({
      initialData: { ...data, vendedores: initialVendedores },
      onUpdate,
    });

    const vendedores = formData.vendedores || [{} as VendedorData];
    
    // Use ref to store updateField to avoid dependency issues
    const updateFieldRef = useRef(updateField);
    useEffect(() => {
      updateFieldRef.current = updateField;
    }, [updateField]);
    
    // Load owners from Supabase on mount and when propertyId changes
    useEffect(() => {
      if (!propertyId || hasLoadedOwnersRef.current) return;
      
      const loadOwners = async () => {
        setIsLoadingOwners(true);
        try {
          const owners = await getCurrentPropertyOwners(propertyId);
          const ids = owners.map(o => o.id);
          
          if (ids.length > 0) {
            setOwnerIds(ids);
            // Always update with data from Supabase to ensure we have the latest saved data
            const vendedoresData = owners.map(ownerRowToVendedorData);
            updateFieldRef.current("vendedores", vendedoresData as any);
          } else if (!data.vendedores || data.vendedores.length === 0) {
            // Only initialize empty if we don't have any data
            updateFieldRef.current("vendedores", [{} as VendedorData]);
          }
          hasLoadedOwnersRef.current = true;
        } catch (error) {
          console.error("Error loading owners:", error);
        } finally {
          setIsLoadingOwners(false);
        }
      };
      
      loadOwners();
    }, [propertyId, data.vendedores]); // Include data.vendedores to reload when it changes externally

    // Handler for quantity selector
    const handleQuantityChange = useCallback(async (delta: number) => {
      const currentCount = vendedores.length;
      const newCount = Math.max(1, Math.min(10, currentCount + delta));
      
      if (newCount > currentCount) {
        // Add new vendedor
        const newVendedores = [...vendedores, ...Array(newCount - currentCount).fill({}).map(() => ({} as VendedorData))];
        const newOwnerIds = [...ownerIds, ...Array(newCount - currentCount).fill("")];
        setOwnerIds(newOwnerIds);
        updateField("vendedores", newVendedores);
      } else if (newCount < currentCount) {
        // Remove last vendedor(s) - deactivate in Supabase if they exist
        const removedIds = ownerIds.slice(newCount);
        for (const ownerId of removedIds) {
          if (ownerId && propertyId) {
            try {
              await deactivatePropertyOwner(ownerId);
            } catch (error) {
              console.error("Error deactivating owner:", error);
            }
          }
        }
        const newVendedores = vendedores.slice(0, newCount);
        const newOwnerIds = ownerIds.slice(0, newCount);
        setOwnerIds(newOwnerIds);
        updateField("vendedores", newVendedores);
      }
    }, [vendedores, updateField, ownerIds, propertyId]);

    // Handler for updating a specific vendedor field
    // Only updates local state, no Supabase save until "Save Changes" is clicked
    const updateVendedorField = useCallback((
      index: number,
      field: keyof VendedorData,
      value: any
    ) => {
      const newVendedores = [...vendedores];
      newVendedores[index] = {
        ...newVendedores[index],
        [field]: value,
      };
      updateField("vendedores", newVendedores);
    }, [vendedores, updateField]);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t.property.sections.sellerData || "Datos del vendedor"}
        </h1>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/20 border border-[var(--prophero-blue-200)] dark:border-[var(--prophero-blue-800)] rounded-lg">
          <Info className="h-5 w-5 text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--prophero-blue-900)] dark:text-[var(--prophero-blue-200)]">
              {t.sectionInfo.optionalFields}
            </p>
            <p className="text-sm text-[var(--prophero-blue-800)] dark:text-[var(--prophero-blue-300)] mt-1">
              {t.sectionInfo.optionalFieldsDescription}
            </p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">
              {t.sellerFields.numberOfOwners}
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={vendedores.length <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E5E5] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#4D4D4D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t.sellerFields.decrementQuantity}
              >
                <Minus className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
              </button>
              <div className="flex h-8 w-[34px] items-center justify-center rounded border border-[#D4D4D8] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                <span className="text-sm font-medium text-[#A1A1AA] dark:text-[#737373] text-center">
                  {vendedores.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={vendedores.length >= 10}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9E7FF] dark:bg-[#1B36A3] hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t.sellerFields.incrementQuantity}
              >
                <Plus className="h-4 w-4 text-[#162EB7] dark:text-[#5B8FFF]" />
              </button>
            </div>
          </div>
        </div>

        {/* Vendedores Forms */}
        <div className="space-y-8">
          {vendedores.map((vendedor, index) => (
            <div key={index} className="space-y-6 p-6 border rounded-lg bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-800)]/50">
              <h2 className="text-lg font-semibold text-foreground">
                {t.sellerFields.owner} {index + 1}
              </h2>

              <div className="space-y-6">
                {/* Nombre completo */}
                <div>
                  <Label className="text-sm font-semibold block">
                    {t.sellerFields.fullNameOrLegalName}
                  </Label>
                  <Input
                    className="mt-2"
                    value={vendedor.nombreCompleto || ""}
                    onChange={(e) => updateVendedorField(index, "nombreCompleto", e.target.value)}
                    placeholder={t.sellerFields.fullNameOrLegalNamePlaceholder}
                  />
                </div>

                {/* DNI/NIF/CIF */}
                <div>
                  <Label className="text-sm font-semibold block">
                    {t.sellerFields.identityDocumentNumber}
                  </Label>
                  <Input
                    className="mt-2"
                    value={vendedor.dniNifCif || ""}
                    onChange={(e) => updateVendedorField(index, "dniNifCif", e.target.value)}
                    placeholder={t.sellerFields.identityDocumentNumberPlaceholder}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.sellerFields.identityDocumentNumberDescription}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-semibold block">
                    {t.sellerFields.email}
                  </Label>
                  <Input
                    type="email"
                    className="mt-2"
                    value={vendedor.email || ""}
                    onChange={(e) => updateVendedorField(index, "email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="text-sm font-semibold block">
                    {t.sellerFields.phoneNumber}
                  </Label>
                  <div className="mt-2">
                    <CountryPhoneSelector
                    countryCode={vendedor.telefonoPais || "+34"}
                    phoneNumber={vendedor.telefonoNumero || ""}
                    onCountryChange={(code) => updateVendedorField(index, "telefonoPais", code)}
                    onPhoneChange={(number) => updateVendedorField(index, "telefonoNumero", number)}
                    placeholder="666 666 666"
                  />
                  </div>
                </div>

                {/* DNI Upload */}
                <DniUploadZone
                  files={vendedor.dniAdjunto || []}
                  onFilesChange={(files) => updateVendedorField(index, "dniAdjunto", files)}
                  maxFiles={10}
                  maxSizeMB={5}
                  propertyId={propertyId}
                  folder="owners"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        {onContinue && (
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                // Navigate back logic would go here
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
              onClick={async () => {
                // Owners are saved via "Save Changes" button in the main page, not here
                onUpdate(formData);
                onContinue?.();
              }}
              className="px-6 py-2 h-9 bg-[#D9E7FF] dark:bg-[#1B36A3] text-[#162EB7] dark:text-[#5B8FFF] rounded-full font-medium text-sm hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] transition-colors"
            >
              {t.property.sections.nextSection || "Siguiente sección"}
            </button>
          </div>
        )}
      </div>
    );
  }
);

DatosVendedorSection.displayName = "DatosVendedorSection";
