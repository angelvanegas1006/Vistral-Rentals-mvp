"use client";

import { useState } from "react";
import { LeftColumn } from "./LeftColumn";
import { CentralColumn } from "./CentralColumn";
import { RightColumn } from "./RightColumn";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PhaseZeroViewProps {
  property: Property;
}

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
      { id: "amount", type: "currency", label: "Monto", required: false },
      { id: "date", type: "date", label: "Fecha", required: false },
    ],
  },
];

export function PhaseZeroView({ property }: PhaseZeroViewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requiredSections = sections.filter((s) => s.required);

  const updateFieldErrors = (sectionId: string, fieldId: string, error: string | null) => {
    const fieldKey = `${sectionId}.${fieldId}`;
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[fieldKey] = error;
      } else {
        delete updated[fieldKey];
      }
      return updated;
    });
  };

  return (
    <>
      {/* Left Column: 25% - Context & Navigation */}
      <div className="w-[25%] border-r border-gray-200 bg-gray-50 overflow-y-auto h-full">
        <LeftColumn property={property} />
      </div>

      {/* Central Column: 50% - Execution Zone */}
      <div className="w-[50%] overflow-y-auto bg-white h-full">
        <CentralColumn
          property={property}
          formData={formData}
          onFormDataChange={setFormData}
          fieldErrors={fieldErrors}
          onFieldErrorChange={updateFieldErrors}
        />
      </div>

      {/* Right Column: 25% - Control & Activity */}
      <div className="w-[25%] border-l border-gray-200 bg-gray-50 overflow-y-auto h-full">
        <RightColumn property={property} />
      </div>
    </>
  );
}
