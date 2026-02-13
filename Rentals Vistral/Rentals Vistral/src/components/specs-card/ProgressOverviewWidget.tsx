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
  supabaseProperty?: any; // Property data from Supabase for technical inspection validation
}

export function ProgressOverviewWidget({
  sections,
  formData,
  visibleSections,
  fieldErrors = {},
  propheroSectionReviews,
  supabaseProperty,
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
    // Check if this is a Phase 2 section
    const phase2SectionIds = ["client-presentation", "pricing-strategy", "technical-inspection", "commercial-launch"];
    const isPhase2Section = phase2SectionIds.includes(sectionId);
    const sectionPrefix = isPhase2Section ? "readyToRent" : sectionId;
    const fieldKey = `${sectionPrefix}.${fieldId}`;
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
    if (fieldId.includes("_url") || fieldId.includes("_cert") || fieldId.includes("doc_") || 
        fieldId.includes("Photos") || fieldId.includes("photos")) {
      return typeof value === 'string' && value.trim().length > 0 || 
             (Array.isArray(value) && value.length > 0);
    }
    
    // Handle boolean fields (for Phase 2)
    if (typeof value === 'boolean') {
      return value === true; // For Phase 2, boolean fields are valid when true
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

  // Helper para determinar el estado de una instancia
  const getRoomState = (room: { type: string; index?: number }): "incomplete" | "good" | "blocking" | "non-blocking" => {
    if (!supabaseProperty) return "incomplete";

    const getRoomData = (room: { type: string; index?: number }) => {
      const report = supabaseProperty.technical_inspection_report as any;
      if (!report) return null;
      
      if (room.type === "bedrooms" && room.index !== undefined) {
        return report.bedrooms?.[room.index] || null;
      }
      if (room.type === "bathrooms" && room.index !== undefined) {
        return report.bathrooms?.[room.index] || null;
      }
      return report[room.type] || null;
    };

    const getRoomStatus = (room: { type: string; index?: number }): "good" | "incident" | null => {
      const data = getRoomData(room);
      return data?.status || null;
    };

    const getRoomComment = (room: { type: string; index?: number }): string => {
      const data = getRoomData(room);
      return data?.comment || "";
    };

    const getRoomAffectsCommercialization = (room: { type: string; index?: number }): boolean | null => {
      const data = getRoomData(room);
      return data?.affects_commercialization ?? null;
    };

    const getRoomCommercialPhotos = (room: { type: string; index?: number }): string[] => {
      const data = getRoomData(room);
      return Array.isArray(data?.marketing_photos) ? data.marketing_photos : [];
    };

    const getRoomIncidentPhotos = (room: { type: string; index?: number }): string[] => {
      const data = getRoomData(room);
      return Array.isArray(data?.incident_photos) ? data.incident_photos : [];
    };

    const status = getRoomStatus(room);
    if (!status) return "incomplete";

    // Estado 1: Buen Estado
    // check_* = 'good' y marketing_photos_* tiene fotos comerciales
    if (status === "good") {
      const commercialPhotos = getRoomCommercialPhotos(room);
      return commercialPhotos.length > 0 ? "good" : "incomplete";
    }

    // Estado 2 y 3: Con Incidencias
    if (status === "incident") {
      const comment = getRoomComment(room);
      const incidentPhotos = getRoomIncidentPhotos(room);
      const affects = getRoomAffectsCommercialization(room);

      // Si no tiene los datos mínimos, está incompleto
      if (!comment.trim() || incidentPhotos.length === 0 || affects === null) {
        return "incomplete";
      }

      // Estado 2: Con Incidencias Bloqueantes
      // affects_commercialization_* = true
      if (affects === true) {
        return "blocking";
      }

      // Estado 3: Con Incidencias No Bloqueantes
      // affects_commercialization_* = false y marketing_photos_* tiene fotos comerciales
      const commercialPhotos = getRoomCommercialPhotos(room);
      return commercialPhotos.length > 0 ? "non-blocking" : "incomplete";
    }

    return "incomplete";
  };

  // Helper para validar si una instancia de inspección técnica está completa
  const isRoomComplete = (room: { type: string; index?: number }): boolean => {
    if (!supabaseProperty) return false;

    const getRoomData = (room: { type: string; index?: number }) => {
      const report = supabaseProperty.technical_inspection_report as any;
      if (!report) return null;
      
      if (room.type === "bedrooms" && room.index !== undefined) {
        return report.bedrooms?.[room.index] || null;
      }
      if (room.type === "bathrooms" && room.index !== undefined) {
        return report.bathrooms?.[room.index] || null;
      }
      return report[room.type] || null;
    };

    const getRoomStatus = (room: { type: string; index?: number }): "good" | "incident" | null => {
      const data = getRoomData(room);
      return data?.status || null;
    };

    const getRoomComment = (room: { type: string; index?: number }): string => {
      const data = getRoomData(room);
      return data?.comment || "";
    };

    const getRoomAffectsCommercialization = (room: { type: string; index?: number }): boolean | null => {
      const data = getRoomData(room);
      return data?.affects_commercialization ?? null;
    };

    const getRoomCommercialPhotos = (room: { type: string; index?: number }): string[] => {
      const data = getRoomData(room);
      return Array.isArray(data?.marketing_photos) ? data.marketing_photos : [];
    };

    const getRoomIncidentPhotos = (room: { type: string; index?: number }): string[] => {
      const data = getRoomData(room);
      return Array.isArray(data?.incident_photos) ? data.incident_photos : [];
    };

    const state = getRoomState(room);
    // Una instancia está completa si está en estado "good" o "non-blocking"
    return state === "good" || state === "non-blocking";
  };

  // Helper para obtener todas las estancias
  const getAllRooms = (): Array<{ type: string; index?: number; label: string }> => {
    if (!supabaseProperty) return [];
    
    const rooms: Array<{ type: string; index?: number; label: string }> = [
      { type: "common_areas", label: "Entorno y zonas comunes" },
      { type: "entry_hallways", label: "Entrada y pasillos" },
      { type: "living_room", label: "Salón" },
      { type: "kitchen", label: "Cocina" },
      { type: "exterior", label: "Exteriores" },
    ];

    const bedrooms = supabaseProperty.bedrooms || 0;
    for (let i = 0; i < bedrooms; i++) {
      rooms.push({ type: "bedrooms", index: i, label: `Habitación ${i + 1}` });
    }

    const bathrooms = supabaseProperty.bathrooms || 0;
    for (let i = 0; i < bathrooms; i++) {
      rooms.push({ type: "bathrooms", index: i, label: `Baño ${i + 1}` });
    }

    if (supabaseProperty.garage && supabaseProperty.garage !== "No tiene") {
      rooms.push({ type: "garage", label: "Garaje" });
    }
    if (supabaseProperty.has_terrace) {
      rooms.push({ type: "terrace", label: "Terraza" });
    }

    return rooms;
  };

  const calculateSectionProgress = (section: Section) => {
    // Special handling for client-presentation section
    // Cuando clientPresentationDone está en blanco o es "No": mostrar 0/1
    // Cuando clientPresentationDone es "Sí": mostrar 1/3 y calcular progreso de los otros campos
    if (section.id === "client-presentation") {
      const clientPresentationDone = formData["readyToRent.clientPresentationDone"];
      
      // Si está en blanco (null/undefined) o es false (No), mostrar 0/1
      if (clientPresentationDone === null || clientPresentationDone === undefined || clientPresentationDone === false) {
        return { completed: 0, total: 1 };
      }
      
      // Si es true (Sí), mostrar 1/3 y calcular progreso de los otros 2 campos
      if (clientPresentationDone === true) {
        const clientPresentationDate = formData["readyToRent.clientPresentationDate"];
        const clientPresentationChannel = formData["readyToRent.clientPresentationChannel"];
        
        let completedFields = 1; // Ya contamos clientPresentationDone como completado
        
        // Verificar si la fecha está completa
        if (clientPresentationDate && typeof clientPresentationDate === 'string' && clientPresentationDate.trim() !== "") {
          completedFields++;
        }
        
        // Verificar si el canal está completo
        if (clientPresentationChannel && typeof clientPresentationChannel === 'string' && clientPresentationChannel.trim() !== "") {
          completedFields++;
        }
        
        return { completed: completedFields, total: 3 };
      }
      
      // Fallback (no debería llegar aquí)
      return { completed: 0, total: 1 };
    }

    // Special handling for technical inspection section
    if (section.id === "technical-inspection" && supabaseProperty) {
      const allRooms = getAllRooms();
      const completedRooms = allRooms.filter(room => isRoomComplete(room)).length;
      const totalRooms = allRooms.length;

      return { completed: completedRooms, total: totalRooms };
    }

    // Special handling for commercial-launch section
    // La sección está completa cuando:
    // - publishOnline === false (no necesita idealistaDescription), O
    // - publishOnline === true && idealistaDescription tiene contenido
    if (section.id === "commercial-launch") {
      const publishOnline = formData["readyToRent.publishOnline"];
      const idealistaDescription = formData["readyToRent.idealistaDescription"] || "";
      
      // Si publishOnline es false, la sección está completa (1/1 campos requeridos)
      if (publishOnline === false) {
        return { completed: 1, total: 1 };
      }
      
      // Si publishOnline es true, necesita idealistaDescription
      if (publishOnline === true) {
        const hasDescription = idealistaDescription && typeof idealistaDescription === 'string' && idealistaDescription.trim() !== "";
        return { completed: hasDescription ? 1 : 0, total: 1 };
      }
      
      // Si publishOnline es null/undefined, la sección no está completa
      return { completed: 0, total: 1 };
    }

    // Special handling for lead "Información Personal del Interesado" section
    if (section.id === "personal-info") {
      const nationality = formData["personal-info.nationality"];
      const identityDocType = formData["personal-info.identity_doc_type"];
      const identityDocNumber = formData["personal-info.identity_doc_number"];
      const identityDocUrl = formData["personal-info.identity_doc_url"];
      const dateOfBirth = formData["personal-info.date_of_birth"];
      const familyProfile = formData["personal-info.family_profile"];
      const childrenCount = formData["personal-info.children_count"];
      const hasPets = formData["personal-info.has_pets"];
      const petDetails = formData["personal-info.pet_details"];

      const has = (v: unknown) =>
        v !== undefined && v !== null && v !== "" && String(v).trim() !== "";

      let completed = 0;
      let total = 7; // Base: nationality, identity_doc_type, identity_doc_number, identity_doc_url, date_of_birth, family_profile, has_pets

      if (has(nationality)) completed++;
      if (has(identityDocType)) completed++;
      if (has(identityDocNumber)) completed++;
      if (has(identityDocUrl)) completed++;
      if (has(dateOfBirth)) completed++;
      if (has(familyProfile)) completed++;
      if (hasPets === "yes" || hasPets === "no") completed++;

      // children_count: required when family_profile === "Con hijos"
      if (familyProfile === "Con hijos") {
        total++;
        if (childrenCount !== undefined && childrenCount !== null && String(childrenCount).trim() !== "") completed++;
      }

      // pet_details: required when has_pets === "yes"
      if (hasPets === "yes") {
        total++;
        if (has(petDetails)) completed++;
      }

      return { completed, total };
    }

    // Special handling for "Inquilino aceptado" phase sections
    // These sections read from supabaseProperty directly, not formData
    const tenantAcceptedSectionIds = ["bank-data", "contract", "guarantee"];
    const isTenantAcceptedSection = tenantAcceptedSectionIds.includes(section.id);
    
    if (isTenantAcceptedSection && supabaseProperty) {
      if (section.id === "bank-data") {
        // Bank data section: Complete if:
        // - client_wants_to_change_bank_account === false (uses existing account), OR
        // - client_wants_to_change_bank_account === true AND both IBAN and certificate are filled
        const wantsToChange = supabaseProperty.client_wants_to_change_bank_account;
        const iban = supabaseProperty.client_rent_receiving_iban;
        const certificate = supabaseProperty.client_rent_receiving_bank_certificate_url;
        
        let completed = 0;
        const total = 1; // 1 task: Confirm bank data
        
        // Only count as completed if there's a definitive answer
        if (wantsToChange === false) {
          // Uses existing account - section is complete
          completed = 1;
        } else if (wantsToChange === true) {
          // Wants to change - both fields must be filled and valid
          const hasValidIban = iban && typeof iban === 'string' && iban.trim() !== '';
          const hasValidCertificate = certificate && typeof certificate === 'string' && certificate.trim() !== '';
          if (hasValidIban && hasValidCertificate) {
            completed = 1;
          }
        }
        // If wantsToChange is null/undefined, completed remains 0
        
        return { completed, total };
      }
      
      if (section.id === "contract") {
        // Contract section: Check 5 required fields
        // 1. Contract file (signed_lease_contract_url)
        // 2. Signature date (contract_signature_date)
        // 3. Start date (lease_start_date)
        // 4. Duration (lease_duration + lease_duration_unit counted together)
        // 5. Rent amount (final_rent_amount)
        const contractUrl = supabaseProperty.signed_lease_contract_url;
        const signatureDate = supabaseProperty.contract_signature_date;
        const startDate = supabaseProperty.lease_start_date;
        const duration = supabaseProperty.lease_duration;
        const durationUnit = supabaseProperty.lease_duration_unit;
        const rentAmount = supabaseProperty.final_rent_amount;
        
        let completed = 0;
        const total = 5; // 5 fields as shown in widget
        
        // Check contract file
        if (contractUrl && typeof contractUrl === 'string' && contractUrl.trim() !== '') completed++;
        
        // Check signature date
        if (signatureDate && typeof signatureDate === 'string' && signatureDate.trim() !== '') completed++;
        
        // Check start date
        if (startDate && typeof startDate === 'string' && startDate.trim() !== '') completed++;
        
        // Duration and durationUnit counted together as 1 field
        // Both must be present and valid
        if (duration && durationUnit && 
            duration.toString().trim() !== '' && 
            (durationUnit === 'months' || durationUnit === 'years')) {
          completed++;
        }
        
        // Check rent amount
        if (rentAmount !== null && rentAmount !== undefined && 
            (typeof rentAmount === 'number' ? rentAmount > 0 : parseFloat(String(rentAmount)) > 0)) {
          completed++;
        }
        
        return { completed, total };
      }
      
      if (section.id === "guarantee") {
        // Guarantee section for Phase 4: Only the answer to the question matters
        // Only check guarantee_sent_to_signature (1 field)
        const guaranteeSent = supabaseProperty.guarantee_sent_to_signature;
        
        let completed = 0;
        const total = 1; // Only 1 field: the answer to the question
        
        // Count as completed only if guarantee_sent_to_signature === true
        if (guaranteeSent === true) {
          completed = 1;
        }
        
        return { completed, total };
      }
    }
    
    // Special handling for "Pendiente de trámites" phase sections
    // These sections read from supabaseProperty directly, not formData
    const pendingProceduresSectionIds = ["guarantee-signing", "deposit", "supplies-change", "first-rent-payment"];
    const isPendingProceduresSection = pendingProceduresSectionIds.includes(section.id);
    
    if (isPendingProceduresSection && supabaseProperty) {
      if (section.id === "guarantee-signing") {
        // Guarantee section for Phase 5: Check both guarantee_signed and guarantee_file_url
        // 1. guarantee_signed === true (confirmation that guarantee was signed)
        // 2. guarantee_file_url exists (signed document uploaded)
        const guaranteeSigned = supabaseProperty.guarantee_signed;
        const guaranteeFileUrl = supabaseProperty.guarantee_file_url;
        
        let completed = 0;
        const total = 2; // 2 fields: signed confirmation + file upload
        
        // Check if guarantee is signed
        if (guaranteeSigned === true) {
          completed++;
        }
        
        // Check if guarantee file is uploaded
        if (guaranteeFileUrl && typeof guaranteeFileUrl === 'string' && guaranteeFileUrl.trim() !== '') {
          completed++;
        }
        
        return { completed, total };
      }
      
      if (section.id === "deposit") {
        // Deposit section for Phase 5: Check deposit_responsible and deposit_receipt_file_url
        // Complete if:
        // - deposit_responsible === "Inversor" (no document needed), OR
        // - deposit_responsible === "Prophero" AND deposit_receipt_file_url exists
        const depositResponsible = supabaseProperty.deposit_responsible;
        const depositReceiptUrl = supabaseProperty.deposit_receipt_file_url;
        
        let completed = 0;
        const total = 1; // 1 field: responsible selection (document is conditional)
        
        // Check if responsible is selected
        if (depositResponsible === "Inversor") {
          // Inversor is responsible - section is complete
          completed = 1;
        } else if (depositResponsible === "Prophero") {
          // Prophero is responsible - need document
          if (depositReceiptUrl && typeof depositReceiptUrl === 'string' && depositReceiptUrl.trim() !== '') {
            completed = 1;
          }
        }
        
        return { completed, total };
      }
      
      if (section.id === "supplies-change") {
        // Supplies change section: Check if all required tenant contracts are uploaded
        // Based on toggle states and contract uploads
        const toggles = supabaseProperty.tenant_supplies_toggles || {};
        const tenantContractElectricity = supabaseProperty.tenant_contract_electricity;
        const tenantContractWater = supabaseProperty.tenant_contract_water;
        const tenantContractGas = supabaseProperty.tenant_contract_gas;
        const tenantContractOther = supabaseProperty.rental_custom_utilities_documents;
        
        // If no toggles are enabled, section is complete
        const hasAnyToggleEnabled = Object.values(toggles).some((v: any) => v === true);
        if (!hasAnyToggleEnabled) {
          return { completed: 1, total: 1 };
        }
        
        // Check if all required contracts are uploaded
        let completed = 0;
        let total = 0;
        
        if (toggles.electricity) {
          total++;
          if (tenantContractElectricity && typeof tenantContractElectricity === 'string' && tenantContractElectricity.trim() !== '') {
            completed++;
          }
        }
        
        if (toggles.water) {
          total++;
          if (tenantContractWater && typeof tenantContractWater === 'string' && tenantContractWater.trim() !== '') {
            completed++;
          }
        }
        
        if (toggles.gas) {
          total++;
          if (tenantContractGas && typeof tenantContractGas === 'string' && tenantContractGas.trim() !== '') {
            completed++;
          }
        }
        
        if (toggles.other) {
          total++;
          if (tenantContractOther && Array.isArray(tenantContractOther) && tenantContractOther.length > 0) {
            completed++;
          }
        }
        
        return { completed, total: total || 1 };
      }
      
      if (section.id === "first-rent-payment") {
        // First rent payment section: Check if first_rent_payment_file_url exists
        // Section is complete when the transfer receipt document is uploaded
        const firstRentPaymentUrl = supabaseProperty.first_rent_payment_file_url;
        
        let completed = 0;
        const total = 1; // 1 field: document upload
        
        // Check if document is uploaded
        if (firstRentPaymentUrl && typeof firstRentPaymentUrl === 'string' && firstRentPaymentUrl.trim() !== '') {
          completed = 1;
        }
        
        return { completed, total };
      }
    }
    
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
    
    // Check if this is a Phase 2 section (Listo para Alquilar)
    const phase2SectionIds = ["client-presentation", "pricing-strategy", "technical-inspection", "commercial-launch"];
    const isPhase2Section = phase2SectionIds.includes(section.id);
    const sectionPrefix = isPhase2Section ? "readyToRent" : section.id;
    
    // Handle checklist fields specially - count checked items
    let totalFields = 0;
    let completedFields = 0;

    section.fields.forEach((field) => {
      if (field.id.includes("checklist") || field.id.includes("verified")) {
        // For checklist, count each item
        const checklistItems = ["Verificación de documentos", "Validación de datos", "Revisión de contactos"];
        checklistItems.forEach((_, idx) => {
          totalFields++;
          const itemKey = isPhase2Section 
            ? `${sectionPrefix}.${field.id}_${idx}`
            : `${section.id}.${field.id}_${idx}`;
          const value = formData[itemKey];
          // Only count as completed if checked (true)
          if (value === true) completedFields++;
        });
      } else {
        totalFields++;
        const fieldKey = isPhase2Section 
          ? `${sectionPrefix}.${field.id}`
          : `${section.id}.${field.id}`;
        const value = formData[fieldKey];
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

            // Obtener estados de las estancias para la sección de inspección técnica
            const roomStates = section.id === "technical-inspection" && supabaseProperty
              ? getAllRooms().map(room => ({
                  ...room,
                  state: getRoomState(room),
                }))
              : [];

            return (
              <div key={section.id} className="space-y-1.5">
                <button
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
                    {section.id === "technical-inspection" && !isComplete
                      ? `${section.title} (${completed}/${total})`
                      : section.title}
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
                {/* Mostrar indicadores de color para las estancias de inspección técnica */}
                {section.id === "technical-inspection" && roomStates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {roomStates.map((room) => {
                      const getColorClass = () => {
                        switch (room.state) {
                          case "good":
                            return "bg-green-500";
                          case "blocking":
                            return "bg-red-500";
                          case "non-blocking":
                            return "bg-orange-500";
                          default:
                            return "bg-gray-300";
                        }
                      };
                      return (
                        <div
                          key={`${room.type}-${room.index ?? ""}`}
                          className={`h-2 w-2 rounded-full ${getColorClass()}`}
                          title={`${room.label}: ${
                            room.state === "good"
                              ? "Buen Estado"
                              : room.state === "blocking"
                              ? "Incidencias Bloqueantes"
                              : room.state === "non-blocking"
                              ? "Incidencias No Bloqueantes"
                              : "Sin completar"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
