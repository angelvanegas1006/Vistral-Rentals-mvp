"use client";

import { useState, createContext, useContext } from "react";
import { ProgressOverviewWidget } from "./ProgressOverviewWidget";
import { WorkSection } from "./WorkSection";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface CentralColumnProps {
  property: Property;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  fieldErrors?: Record<string, string>;
  onFieldErrorChange?: (sectionId: string, fieldId: string, error: string | null) => void;
}

export function CentralColumn({
  property,
  formData,
  onFormDataChange,
  fieldErrors = {},
  onFieldErrorChange,
}: CentralColumnProps) {

  // Sections definition - shared with PhaseZeroView
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

  const updateField = (sectionId: string, fieldId: string, value: any) => {
    const updated = {
      ...formData,
      [`${sectionId}.${fieldId}`]: value,
    };
    onFormDataChange(updated);
  };

  const updateFieldErrors = (sectionId: string, fieldId: string, error: string | null) => {
    if (onFieldErrorChange) {
      onFieldErrorChange(sectionId, fieldId, error);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Progress Overview Widget */}
      <div className="sticky top-0 z-10 bg-white">
        <ProgressOverviewWidget 
          sections={sections} 
          formData={formData}
          visibleSections={sections.map(s => s.id)} // Pass all section IDs for now - can be made dynamic
          fieldErrors={fieldErrors}
        />
      </div>

      {/* Work Sections */}
      <div className="space-y-6 p-6">
        {sections.map((section, index) => (
          <WorkSection
            key={section.id}
            section={section}
            formData={formData}
            onFieldChange={updateField}
            onFieldErrorChange={updateFieldErrors}
            isAlternate={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}
