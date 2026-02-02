"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface Section {
  id: string;
  title: string;
  required: boolean;
  fields: Array<{ id: string; required: boolean }>;
}

interface ProgressOverviewWidgetProps {
  sections: Section[];
  formData: Record<string, any>;
  visibleSections?: string[]; // For conditional logic - sections that should be visible
  fieldErrors?: Record<string, string>; // Validation errors for each field
  propheroSectionReviews?: Record<string, { isCorrect: boolean | null }>; // Review state for Prophero sections
}

export function ProgressOverviewWidget({
  sections,
  formData,
  visibleSections,
  fieldErrors = {},
  propheroSectionReviews,
}: ProgressOverviewWidgetProps) {
  
  // Dynamic/Conditional Logic: Filter sections based on form state
  // If visibleSections is provided, only show those sections
  // Otherwise, apply conditional logic based on formData
  const getVisibleSections = (): Section[] => {
    if (visibleSections) {
      return sections.filter(s => visibleSections.includes(s.id));
    }
    
    // Example conditional logic: If 'Owner Accepts?' is 'No', hide 'Tenant Details'
    // This is a placeholder - implement actual conditional logic based on your requirements
    const ownerAccepts = formData['personal-info.ownerAccepts'];
    if (ownerAccepts === false || ownerAccepts === 'No') {
      return sections.filter(s => s.id !== 'tenant-details');
    }
    
    return sections;
  };
  
  const visibleSectionsList = getVisibleSections();
  
  // Validation helper - checks if a field is valid
  const isFieldValid = (sectionId: string, fieldId: string, value: any): boolean => {
    const fieldKey = `${sectionId}.${fieldId}`;
    const error = fieldErrors[fieldKey];
    
    // If there's an error, field is invalid
    if (error) return false;
    
    // Handle composite phone field
    if (fieldId === "phone" && typeof value === 'object' && value !== null) {
      return !!(value.prefix && value.number);
    }
    
    // Handle JSONB arrays (like doc_renovation_files) - must have at least one element
    if (Array.isArray(value)) {
      return value.length > 0 && value.some((item) => item !== null && item !== undefined && item !== "");
    }
    
    // Handle URL/document fields - check if it's a valid non-empty string
    if (fieldId.includes("_url") || fieldId.includes("_cert") || fieldId.includes("doc_")) {
      return typeof value === 'string' && value.trim().length > 0;
    }
    
    // If field is empty, it's invalid (for required fields)
    if (value === undefined || value === null || value === "" || 
        (Array.isArray(value) && value.length === 0)) {
      return false;
    }
    
    // Field has value and no error = valid
    return true;
  };

  // List of Prophero section IDs - these sections require review state to be complete
  const PROPHERO_SECTION_IDS = [
    "property-management-info",
    "technical-documents",
    "legal-documents",
    "client-financial-info",
    "supplies-contracts",
    "supplies-bills",
    "home-insurance",
    "property-management",
  ];

  const calculateSectionProgress = (section: Section) => {
    // For Prophero sections, check review state first
    // Prophero sections ONLY count as complete if isCorrect === true in review state
    const isPropheroSection = PROPHERO_SECTION_IDS.includes(section.id);
    
    if (isPropheroSection) {
      // For Prophero sections, ONLY count as complete if isCorrect === true
      // Una sección solo estará completa cuando la respuesta a "¿Es correcta esta información?" sea Sí
      // Si está en blanco (null) o la respuesta es No (false), la sección se considera incompleta
      if (propheroSectionReviews && propheroSectionReviews[section.id]) {
        const review = propheroSectionReviews[section.id];
        if (review.isCorrect === true) {
          const totalFields = section.fields.length;
          console.log(`✅ Section ${section.id} is completed (isCorrect = true)`);
          return { completed: totalFields, total: totalFields };
        }
        // If there's a review state but isCorrect is not true (null or false), return 0% progress
        console.log(`⏳ Section ${section.id} not completed yet (isCorrect = ${review.isCorrect})`);
        return { completed: 0, total: section.fields.length };
      } else {
        // If no review state exists for this Prophero section, return 0% progress
        // Sections are not complete until user answers "¿Es correcta esta información?" with Sí
        console.log(`⏳ Section ${section.id} has no review state yet - returning 0%`);
        return { completed: 0, total: section.fields.length };
      }
    }
    
    // Handle checklist fields specially - count checked items
    let totalFields = 0;
    let completedFields = 0;

    section.fields.forEach((field) => {
      if (field.id.includes("checklist") || field.id.includes("verified")) {
        // For checklist, count each item
        const checklistItems = ["Verificación de documentos", "Validación de datos", "Revisión de contactos"];
        checklistItems.forEach((_, idx) => {
          totalFields++;
          const itemKey = `${section.id}.${field.id}_${idx}`;
          const value = formData[itemKey];
          // Only count as completed if checked (true)
          if (value === true) completedFields++;
        });
      } else {
        totalFields++;
        const value = formData[`${section.id}.${field.id}`];
        // Progress based on VALIDATION STATUS, not just filled status
        if (field.required) {
          // For required fields, only count if valid
          if (isFieldValid(section.id, field.id, value)) {
            completedFields++;
          }
        } else {
          // For optional fields, count if has value and is valid
          if (value !== undefined && value !== null && value !== "" && 
              !(Array.isArray(value) && value.length === 0) &&
              isFieldValid(section.id, field.id, value)) {
            completedFields++;
          }
        }
      }
    });

    return { completed: completedFields, total: totalFields };
  };

  const calculateGlobalProgress = () => {
    // Use visible sections only for progress calculation
    const requiredSections = visibleSectionsList.filter((s) => s.required);
    const completedSections = requiredSections.filter((section) => {
      const { completed, total } = calculateSectionProgress(section);
      return completed === total;
    }).length;
    return {
      completed: completedSections,
      total: requiredSections.length,
      percentage: requiredSections.length > 0
        ? Math.round((completedSections / requiredSections.length) * 100)
        : 100,
    };
  };

  const globalProgress = calculateGlobalProgress();

  const scrollToSection = (sectionId: string) => {
    // Use proper element reference with correct ID format
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Visual Pop/Scale Animation on Section Container (scale-105 = 1.05)
      setTimeout(() => {
        element.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
          setTimeout(() => {
            element.style.transition = '';
          }, 200);
        }, 200);
      }, 100);
      
      // Highlight empty/invalid inputs with yellow flash
      setTimeout(() => {
        // Find all empty or invalid inputs and textareas in the section
        const inputs = element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea'
        );
        
        inputs.forEach((input) => {
          const value = input.value || '';
          const fieldKey = input.id;
          const hasError = fieldErrors[fieldKey];
          
          // Highlight if empty or has validation error
          if (!value || hasError) {
            input.style.transition = 'all 0.3s ease';
            input.classList.add("animate-pulse", "ring-2", "ring-yellow-400", "ring-offset-2");
            setTimeout(() => {
              input.classList.remove("animate-pulse", "ring-2", "ring-yellow-400", "ring-offset-2");
              input.style.transition = '';
            }, 2000);
          }
        });
      }, 300);
      
      // Focus first empty input
      setTimeout(() => {
        const inputs = element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea'
        );
        for (const input of Array.from(inputs)) {
          const value = input.value || '';
          const fieldKey = input.id;
          const hasError = fieldErrors[fieldKey];
          if (!value || hasError) {
            input.focus();
            break;
          }
        }
      }, 500);
    }
  };

  return (
    <Card className="mb-6 border-gray-200 shadow-sm">
      {/* Header con barra de progreso visual mejorada */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            Progreso General
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {globalProgress.percentage}%
            </span>
            <span className="text-xs text-gray-500">
              {globalProgress.completed}/{globalProgress.total}
            </span>
          </div>
        </div>
        {/* Barra de progreso visual */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${globalProgress.percentage}%` }}
          />
        </div>
      </div>
      
      {/* Lista de secciones más compacta */}
      <div className="p-3">
        <div className="space-y-1.5">
          {visibleSectionsList.map((section) => {
            const { completed, total } = calculateSectionProgress(section);
            const isComplete = completed === total;
            const isRequired = section.required;
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:shadow-sm ${
                  isComplete
                    ? "bg-green-50/50 hover:bg-green-50"
                    : "bg-blue-50/50 hover:bg-blue-50"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span
                  className={`flex-1 text-sm font-medium ${
                    isComplete ? "text-green-700" : "text-gray-900"
                  }`}
                >
                  {section.title}
                </span>
                {isRequired && !isComplete && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    <Info className="h-3 w-3" />
                    Obligatorio
                  </span>
                )}
                {!isComplete && (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 min-w-[2.5rem] text-right">
                      {completed}/{total}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
