"use client";

import { forwardRef, useCallback, useMemo, useEffect, useState } from "react";
import { Info } from "lucide-react";
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
import { PropertyData, InquilinoData, SubrogacionContrato, EstadoSeguroAlquiler } from "@/lib/supply-property-storage";
import { useFormState } from "@/hooks/useFormState";
import { useI18n } from "@/lib/i18n";
import { CountryPhoneSelector } from "@/components/supply/property/country-phone-selector";
import { DatePicker } from "@/components/supply/property/date-picker";
import { FileUploadZone } from "@/components/supply/property/file-upload-zone";
import {
  getCurrentPropertyTenant,
  createPropertyTenant,
  updatePropertyTenant,
  deactivatePropertyTenant,
  tenantRowToInquilinoData
} from "@/lib/supply-tenants-supabase";
import { toast } from "sonner";

interface DatosInquilinoSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
  propertyId?: string;
}

// These will be mapped to translations in the component
const SUBROGACION_OPTIONS: SubrogacionContrato[] = [
  "Con subrogación",
  "Sin subrogación",
];

const ESTADO_SEGURO_OPTIONS: EstadoSeguroAlquiler[] = [
  "En vigor",
  "Caducado",
];

export const DatosInquilinoSection = forwardRef<HTMLDivElement, DatosInquilinoSectionProps>(
  ({ data, onUpdate, onContinue, propertyId }, ref) => {
    const { t } = useI18n();
    const [isLoadingTenant, setIsLoadingTenant] = useState(false);
    const [tenantId, setTenantId] = useState<string | null>(null);
    
    // Load tenant from Supabase on mount
    useEffect(() => {
      if (!propertyId) return;
      
      const loadTenant = async () => {
        setIsLoadingTenant(true);
        try {
          const tenant = await getCurrentPropertyTenant(propertyId);
          if (tenant) {
            const inquilinoData = tenantRowToInquilinoData(tenant);
            setTenantId(tenant.id);
            onUpdate({ inquilino: inquilinoData });
          }
        } catch (error) {
          console.error("Error loading tenant:", error);
        } finally {
          setIsLoadingTenant(false);
        }
      };
      
      loadTenant();
    }, [propertyId, onUpdate]);
    
    // Initialize inquilino data
    const initialInquilino = useMemo(() => {
      return data.inquilino || ({} as InquilinoData);
    }, [data.inquilino]);

    const { formData, updateField } = useFormState({
      initialData: { ...data, inquilino: initialInquilino },
      onUpdate,
    });

    const inquilino = formData.inquilino || ({} as InquilinoData);

    // Handler for updating inquilino fields
    const updateInquilinoField = useCallback(async (
      field: keyof InquilinoData,
      value: any
    ) => {
      const updatedInquilino = {
        ...inquilino,
        [field]: value,
      };
      updateField("inquilino", updatedInquilino);
      
      // Save to Supabase if propertyId is available
      if (propertyId) {
        try {
          if (tenantId) {
            await updatePropertyTenant(tenantId, updatedInquilino);
          } else if (updatedInquilino.nombreCompleto || updatedInquilino.email) {
            // Create new tenant if doesn't exist and has required fields
            const newTenantId = await createPropertyTenant(propertyId, updatedInquilino, true);
            setTenantId(newTenantId);
          }
        } catch (error: any) {
          console.error("Error updating tenant in Supabase:", error);
          toast.error("Error al guardar cambios del inquilino");
        }
      }
    }, [inquilino, updateField, propertyId, tenantId]);
    
    // Handler for saving tenant to Supabase
    const saveTenantToSupabase = useCallback(async () => {
      if (!propertyId) return;
      
      try {
        if (tenantId) {
          // Update existing tenant
          await updatePropertyTenant(tenantId, inquilino);
        } else if (inquilino.nombreCompleto || inquilino.email) {
          // Create new tenant
          const newTenantId = await createPropertyTenant(propertyId, inquilino, true);
          setTenantId(newTenantId);
        }
        toast.success("Inquilino guardado exitosamente");
      } catch (error: any) {
        console.error("Error saving tenant to Supabase:", error);
        toast.error("Error al guardar inquilino");
      }
    }, [propertyId, inquilino, tenantId]);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t.property.sections.tenantData || "Datos del inquilino"}
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

        <div className="space-y-6">
          {/* Nombre completo inquilino */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.fullName}
            </Label>
            <Input
              className="mt-2"
              value={inquilino.nombreCompleto || ""}
              onChange={(e) => updateInquilinoField("nombreCompleto", e.target.value)}
              placeholder={t.tenantFields.fullName}
            />
          </div>

          {/* Email inquilino */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.email}
            </Label>
            <Input
              type="email"
              className="mt-2"
              value={inquilino.email || ""}
              onChange={(e) => updateInquilinoField("email", e.target.value)}
              placeholder="inquilino@casa.com"
            />
          </div>

          {/* Número de teléfono */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.phoneNumber}
            </Label>
            <div className="mt-2">
              <CountryPhoneSelector
              countryCode={inquilino.telefonoPais || "+34"}
              phoneNumber={inquilino.telefonoNumero || ""}
              onCountryChange={(code) => updateInquilinoField("telefonoPais", code)}
              onPhoneChange={(number) => updateInquilinoField("telefonoNumero", number)}
              placeholder="666 666 666"
            />
            </div>
          </div>

          {/* DNI/NIE */}
          <FileUploadZone
            title={t.tenantFields.dniNie}
            description={t.tenantFields.dniNieDescription}
            files={inquilino.dniNie || []}
            onFilesChange={(files) => updateInquilinoField("dniNie", files)}
            isRequired={false}
            maxFiles={10}
            maxSizeMB={5}
            propertyId={propertyId}
            folder="tenants"
          />

          {/* Contrato de arrendamiento */}
          <FileUploadZone
            title={t.tenantFields.rentalContract}
            description={t.tenantFields.rentalContractDescription}
            files={inquilino.contratoArrendamiento || []}
            onFilesChange={(files) => updateInquilinoField("contratoArrendamiento", files)}
            isRequired={false}
            maxFiles={10}
            maxSizeMB={5}
            propertyId={propertyId}
            folder="tenants"
          />

          {/* Fecha de finalización del contrato */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.contractEndDate}
            </Label>
            <div className="mt-2">
              <DatePicker
              value={inquilino.fechaFinalizacionContrato}
              onChange={(date) => updateInquilinoField("fechaFinalizacionContrato", date)}
              placeholder="DD/MM/YYYY"
            />
            </div>
          </div>

          {/* Periodo de preaviso */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.noticePeriod}
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={inquilino.periodoPreaviso || ""}
                onChange={(e) => updateInquilinoField("periodoPreaviso", parseInt(e.target.value) || undefined)}
                placeholder="30"
                className="max-w-[100px]"
              />
              <span className="text-sm text-muted-foreground">{t.tenantFields.days}</span>
            </div>
          </div>

          {/* Subrogación del contrato */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.contractSubrogation}
            </Label>
            <div className="mt-2">
              <Select
              value={inquilino.subrogacionContrato || ""}
              onValueChange={(value) => updateInquilinoField("subrogacionContrato", value as SubrogacionContrato)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.formLabels.selectOption} />
              </SelectTrigger>
              <SelectContent>
                {SUBROGACION_OPTIONS.map((option) => {
                  const displayText = option === "Con subrogación" 
                    ? t.tenantFields.subrogationOptions.withSubrogation
                    : t.tenantFields.subrogationOptions.withoutSubrogation;
                  return (
                    <SelectItem key={option} value={option}>
                      {displayText}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Importe del alquiler a transferir */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.rentalAmountToTransfer}
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={inquilino.importeAlquilerTransferir || ""}
                onChange={(e) => updateInquilinoField("importeAlquilerTransferir", parseFloat(e.target.value) || undefined)}
                placeholder="1.000"
                className="max-w-[150px]"
              />
              <span className="text-sm text-muted-foreground">{t.tenantFields.perMonth}</span>
            </div>
          </div>

          {/* Última actualización del alquiler */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.lastRentalUpdate}
            </Label>
            <div className="mt-2">
              <DatePicker
              value={inquilino.ultimaActualizacionAlquiler}
              onChange={(date) => updateInquilinoField("ultimaActualizacionAlquiler", date)}
              placeholder="DD/MM/YYYY"
            />
            </div>
          </div>

          {/* Justificantes de pago */}
          <FileUploadZone
            title={t.tenantFields.paymentProofs}
            description={t.tenantFields.paymentProofsDescription}
            files={inquilino.justificantesPago || []}
            onFilesChange={(files) => updateInquilinoField("justificantesPago", files)}
            isRequired={false}
            maxFiles={10}
            maxSizeMB={5}
            propertyId={propertyId}
            folder="tenants"
          />

          {/* Fecha del último recibo */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.lastReceiptDate}
            </Label>
            <div className="mt-2">
              <DatePicker
              value={inquilino.fechaUltimoRecibo}
              onChange={(date) => updateInquilinoField("fechaUltimoRecibo", date)}
              placeholder="DD/MM/YYYY"
            />
            </div>
          </div>

          {/* Comprobante de transferencia del alquiler (del vendedor) */}
          <FileUploadZone
            title={t.tenantFields.rentalTransferProof}
            description={t.tenantFields.rentalTransferProofDescription}
            files={inquilino.comprobanteTransferenciaVendedor || []}
            onFilesChange={(files) => updateInquilinoField("comprobanteTransferenciaVendedor", files)}
            isRequired={false}
            maxFiles={1}
            maxSizeMB={5}
            acceptedTypes={["application/pdf", "image/jpeg", "image/png"]}
            propertyId={propertyId}
            folder="tenants"
          />

          {/* Justificante del depósito */}
          <FileUploadZone
            title={t.tenantFields.depositProof}
            description={t.tenantFields.depositProofDescription}
            files={inquilino.justificanteDeposito || []}
            onFilesChange={(files) => updateInquilinoField("justificanteDeposito", files)}
            isRequired={false}
            maxFiles={10}
            maxSizeMB={5}
            propertyId={propertyId}
            folder="tenants"
          />

          {/* Fecha de vencimiento del seguro de alquiler */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.rentalInsuranceExpiryDate}
            </Label>
            <div className="mt-2">
              <DatePicker
              value={inquilino.fechaVencimientoSeguroAlquiler}
              onChange={(date) => updateInquilinoField("fechaVencimientoSeguroAlquiler", date)}
              placeholder="DD/MM/YYYY"
            />
            </div>
          </div>

          {/* Estado del seguro de alquiler */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.rentalInsuranceStatus}
            </Label>
            <div className="mt-2">
              <Select
              value={inquilino.estadoSeguroAlquiler || ""}
              onValueChange={(value) => updateInquilinoField("estadoSeguroAlquiler", value as EstadoSeguroAlquiler)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.formLabels.selectOption} />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_SEGURO_OPTIONS.map((option) => {
                  const displayText = option === "En vigor"
                    ? t.tenantFields.insuranceStatusOptions.inForce
                    : t.tenantFields.insuranceStatusOptions.expired;
                  return (
                    <SelectItem key={option} value={option}>
                      {displayText}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Proveedor del seguro de alquiler */}
          <div>
            <Label className="text-sm font-semibold block">
              {t.tenantFields.rentalInsuranceProvider}
            </Label>
            <Input
              className="mt-2"
              value={inquilino.proveedorSeguroAlquiler || ""}
              onChange={(e) => updateInquilinoField("proveedorSeguroAlquiler", e.target.value)}
              placeholder={t.tenantFields.rentalInsuranceProviderPlaceholder}
            />
          </div>
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
              onClick={async () => {
                await saveTenantToSupabase();
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

DatosInquilinoSection.displayName = "DatosInquilinoSection";
