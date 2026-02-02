"use client";

import { CentralColumn } from "@/components/specs-card/CentralColumn";
import { usePropertyForm } from "./property-form-context";
import { cn } from "@/lib/utils";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PropertyWorkTabProps {
  propertyId: string;
  currentPhase?: string;
}

export function PropertyWorkTab({ propertyId, currentPhase }: PropertyWorkTabProps) {
  const { formData, setFormData, fieldErrors, updateFieldError } = usePropertyForm();

  // Mock property data - reemplazar con datos reales de Supabase
  const property: Property = {
    property_unique_id: propertyId,
    address: "Calle Gran Vía 45, 3º B",
    city: "Madrid",
    daysInPhase: 2,
    currentPhase: currentPhase || "Viviendas Prophero",
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
        <CentralColumn
          property={property}
          formData={formData}
          onFormDataChange={setFormData}
          fieldErrors={fieldErrors}
          onFieldErrorChange={updateFieldError}
        />
      </div>
    </div>
  );
}
