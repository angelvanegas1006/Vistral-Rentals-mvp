"use client";

import { RightColumn } from "@/components/specs-card/RightColumn";
import { usePropertyForm } from "./property-form-context";
import { cn } from "@/lib/utils";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PropertyControlTabProps {
  propertyId: string;
}

export function PropertyControlTab({ propertyId }: PropertyControlTabProps) {
  const { formData, fieldErrors } = usePropertyForm();

  // Mock property data - reemplazar con datos reales de Supabase
  const property: Property = {
    property_unique_id: propertyId,
    address: "Calle Gran Vía 45, 3º B",
    city: "Madrid",
    daysInPhase: 2,
    currentPhase: "Phase 0: Viviendas Prophero",
  };

  // Sections definition - debe coincidir con CentralColumn
  const sections = [
    {
      id: "personal-info",
      title: "Datos de Contacto",
      instructions: "Verifica que el teléfono tenga prefijo internacional",
      required: true,
      fields: [
        { id: "fullName", type: "text", label: "Nombre completo", required: true },
        { id: "email", type: "email", label: "Correo electrónico", required: true },
        { id: "phone", type: "phone", label: "Teléfono", required: true },
        { id: "nif", type: "nif", label: "DNI/NIE", required: true },
      ],
    },
    {
      id: "documents",
      title: "Documentación",
      instructions: "Sube los documentos requeridos",
      required: true,
      fields: [
        { id: "contract", type: "document", label: "Contrato", required: true },
        { id: "notes", type: "textarea", label: "Notas adicionales", required: false },
      ],
    },
    {
      id: "checklist",
      title: "Checklist de Verificación",
      instructions: "Marca todos los elementos verificados",
      required: false,
      fields: [
        { id: "verified", type: "checklist", label: "Elementos verificados", required: false },
        { id: "type", type: "select", label: "Tipo de verificación", required: false },
        { id: "amount", type: "currency", label: "Monto", required: false },
        { id: "date", type: "date", label: "Fecha", required: false },
      ],
    },
  ];

  const requiredSections = sections.filter((s) => s.required);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards Container */}
      <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
        <RightColumn property={property} />
      </div>
    </div>
  );
}
