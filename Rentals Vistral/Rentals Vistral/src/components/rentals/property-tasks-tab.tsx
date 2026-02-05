"use client";

import { ReadyToRentTasks } from "./ready-to-rent-tasks";
import { TenantAcceptedTasks } from "./tenant-accepted-tasks";
import { PendingProceduresTasks } from "./pending-procedures-tasks";
import { RentedTasks } from "./rented-tasks";
import { IpcUpdateTasks } from "./ipc-update-tasks";
import { RenewalManagementTasks } from "./renewal-management-tasks";
import { FinalizationTasks } from "./finalization-tasks";
import { PublishedTasks } from "./published-tasks";
import { PropheroTasks } from "./prophero-tasks";
import { ProgressOverviewWidget } from "@/components/specs-card/ProgressOverviewWidget";
import { usePropertyForm } from "./property-form-context";
import { useProperty } from "@/hooks/use-property";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import type { PropheroSectionReviews } from "@/lib/supabase/types";

interface Section {
  id: string;
  title: string;
  required: boolean;
  fields: Array<{ id: string; required: boolean }>;
}

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface PropertyTasksTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
  onPropheroReviewsChange?: (reviews: PropheroSectionReviews | undefined) => void;
  onSubmitCommentsRef?: React.MutableRefObject<(() => void) | null>;
  onHasAnySectionWithNoRef?: React.MutableRefObject<boolean>;
  onCanSubmitCommentsRef?: React.MutableRefObject<boolean>;
  onHasAnySectionWithNoChange?: (hasNo: boolean) => void;
  onCanSubmitCommentsChange?: (canSubmit: boolean) => void;
  onPhase2ProgressChange?: (progress: number) => void; // Progress percentage (0-100)
}

export function PropertyTasksTab({ 
  propertyId, 
  currentPhase, 
  property: propFromParent, 
  onPropheroReviewsChange,
  onSubmitCommentsRef,
  onHasAnySectionWithNoRef,
  onCanSubmitCommentsRef,
  onHasAnySectionWithNoChange,
  onCanSubmitCommentsChange,
  onPhase2ProgressChange,
}: PropertyTasksTabProps) {
  const { formData } = usePropertyForm();
  const { property: supabaseProperty, loading: propertyLoading } = useProperty(propertyId);
  
  // Estado local para propheroSectionReviews que se actualiza en tiempo real
  const [propheroSectionReviews, setPropheroSectionReviews] = useState<PropheroSectionReviews | undefined>(undefined);
  
  // Cargar estado inicial de revisión para Prophero desde Supabase
  useEffect(() => {
    if (currentPhase === "Viviendas Prophero") {
      if (supabaseProperty?.prophero_section_reviews) {
        try {
          const reviews = typeof supabaseProperty.prophero_section_reviews === 'string'
            ? JSON.parse(supabaseProperty.prophero_section_reviews)
            : supabaseProperty.prophero_section_reviews;
          
          // Actualizar el ref con el estado inicial
          previousReviewsRef.current = reviews as PropheroSectionReviews;
          
          // Convertir a formato simplificado para el widget (solo necesitamos isCorrect)
          const simplified: Record<string, { isCorrect: boolean | null }> = {};
          Object.keys(reviews).forEach((sectionId) => {
            if (sectionId !== '_meta') {
              simplified[sectionId] = { 
                isCorrect: reviews[sectionId]?.isCorrect ?? null
              };
            }
          });
          console.log("📊 Prophero reviews loaded for widget:", simplified);
          setPropheroSectionReviews(simplified as PropheroSectionReviews);
          // Notificar al componente padre sobre el estado inicial
          onPropheroReviewsChange?.(reviews as PropheroSectionReviews);
        } catch (error) {
          console.warn("Error parsing prophero_section_reviews:", error);
          previousReviewsRef.current = undefined;
          setPropheroSectionReviews(undefined);
          onPropheroReviewsChange?.(undefined);
        }
      } else {
        // No hay reviews todavía, notificar con objeto vacío para que el padre sepa que estamos en Prophero
        console.log("📊 No prophero reviews found, initializing empty state");
        previousReviewsRef.current = undefined;
        setPropheroSectionReviews(undefined);
        onPropheroReviewsChange?.(undefined);
      }
    } else {
      previousReviewsRef.current = undefined;
      setPropheroSectionReviews(undefined);
      onPropheroReviewsChange?.(undefined);
    }
  }, [currentPhase, supabaseProperty?.prophero_section_reviews, onPropheroReviewsChange]);
  
  // Ref para rastrear el valor anterior y evitar actualizaciones innecesarias
  const previousReviewsRef = useRef<PropheroSectionReviews | undefined>(undefined);
  
  // Callback para actualizar el estado cuando PropheroTasks cambie las reviews
  const handlePropheroReviewsChange = useCallback((reviews: PropheroSectionReviews) => {
    // Comparar si los valores realmente cambiaron antes de actualizar
    const previous = previousReviewsRef.current;
    
    if (!previous) {
      // Primera vez, siempre actualizar
      previousReviewsRef.current = reviews;
      // Convertir a formato simplificado para el widget (solo necesitamos isCorrect)
      const simplified: Record<string, { isCorrect: boolean | null }> = {};
      Object.keys(reviews).forEach((sectionId) => {
        if (sectionId !== '_meta') {
          simplified[sectionId] = { 
            isCorrect: reviews[sectionId]?.isCorrect ?? null
          };
        }
      });
      setPropheroSectionReviews(simplified);
      onPropheroReviewsChange?.(reviews);
      return;
    }
    
    // Comparar valores de isCorrect para detectar cambios reales
    const requiredSectionIds = [
      "property-management-info",
      "technical-documents",
      "legal-documents",
      "client-financial-info",
      "supplies-contracts",
      "supplies-bills",
      "home-insurance",
      "property-management",
    ];
    
    const hasChanged = requiredSectionIds.some((sectionId) => {
      const prevReview = previous[sectionId];
      const newReview = reviews[sectionId];
      const prevIsCorrect = prevReview?.isCorrect ?? null;
      const newIsCorrect = newReview?.isCorrect ?? null;
      return prevIsCorrect !== newIsCorrect;
    });
    
    // Solo actualizar si realmente cambió algo
    if (hasChanged) {
      previousReviewsRef.current = reviews;
      // Convertir a formato simplificado para el widget (solo necesitamos isCorrect)
      const simplified: Record<string, { isCorrect: boolean | null }> = {};
      Object.keys(reviews).forEach((sectionId) => {
        if (sectionId !== '_meta') {
          simplified[sectionId] = { 
            isCorrect: reviews[sectionId]?.isCorrect ?? null
          };
        }
      });
      setPropheroSectionReviews(simplified);
      onPropheroReviewsChange?.(reviews);
    }
  }, [onPropheroReviewsChange]);
  
  // Usar la propiedad del padre si está disponible, sino crear una mínima
  const property: Property = propFromParent
    ? {
        property_unique_id: propFromParent.property_unique_id,
        address: propFromParent.address,
        city: propFromParent.city,
        daysInPhase: 0,
        currentPhase: currentPhase || "Viviendas Prophero",
      }
    : {
        property_unique_id: propertyId,
        address: "",
        city: "",
        daysInPhase: 0,
        currentPhase: currentPhase || "Viviendas Prophero",
      };

  // Define phase-specific sections for Progress Overview Widget
  const getProgressSections = () => {
    switch (currentPhase) {
      case "Listo para Alquilar":
        return [
          {
            id: "client-presentation",
            title: "Presentación al Cliente",
            required: true,
            fields: [
              { id: "clientPresentationDone", required: true },
              { id: "clientPresentationDate", required: true },
              { id: "clientPresentationChannel", required: true },
            ],
          },
          {
            id: "pricing-strategy",
            title: "Estrategia de Precio",
            required: true,
            fields: [
              { id: "announcementPrice", required: true },
              { id: "priceApproval", required: true },
            ],
          },
          {
            id: "technical-inspection",
            title: "Inspección Técnica y Reportaje",
            required: true,
            fields: [
              // Esta sección se valida mediante la lógica de completitud en ReadyToRentTasks
              // Los campos se guardan directamente en Supabase, no en formData
              // Se calculará el progreso basado en cuántas instancias están completas
              { id: "technicalInspectionComplete", required: true },
            ],
          },
          {
            id: "commercial-launch",
            title: "Lanzamiento Comercial",
            required: true,
            fields: [
              { id: "publishOnline", required: true },
              { id: "idealistaDescription", required: false },
            ],
          },
        ];

      case "Inquilino aceptado":
        return [
          {
            id: "bank-data",
            title: "Datos Bancarios",
            required: true,
            fields: [{ id: "bankDataConfirmed", required: true }],
          },
          {
            id: "contract",
            title: "Contrato",
            required: true,
            fields: [
              { id: "contractSigned", required: true },
              { id: "signatureDate", required: true },
              { id: "startDate", required: true },
              { id: "duration", required: true },
              { id: "finalRentPrice", required: true },
            ],
          },
          {
            id: "guarantee",
            title: "Garantía Finaer",
            required: false,
            fields: [
              { id: "guaranteeId", required: false },
              { id: "guaranteeSigned", required: false },
            ],
          },
        ];

      case "Pendiente de trámites":
        return [
          {
            id: "guarantee",
            title: "Garantía Finaer",
            required: true,
            fields: [{ id: "guaranteeSigned", required: true }],
          },
          {
            id: "utilities",
            title: "Suministros",
            required: true,
            fields: [
              { id: "utilitiesValidated", required: true },
              { id: "ownershipChanged", required: true },
            ],
          },
          {
            id: "deposit",
            title: "Fianza",
            required: true,
            fields: [{ id: "depositVerified", required: true }],
          },
          {
            id: "liquidation",
            title: "Liquidación",
            required: true,
            fields: [{ id: "liquidationCompleted", required: true }],
          },
          {
            id: "documentation",
            title: "Documentación",
            required: true,
            fields: [{ id: "documentsClosed", required: true }],
          },
        ];

      case "Publicado":
        return [
          {
            id: "leads",
            title: "Gestión de Leads",
            required: true,
            fields: [
              { id: "unguidedLeads", required: false },
              { id: "scheduledLeads", required: false },
              { id: "visitedLeads", required: false },
            ],
          },
        ];

      case "Viviendas Prophero":
        return [
          {
            id: "property-management-info",
            title: "Información de Gestión de la Propiedad",
            required: true,
            fields: [
              { id: "admin_name", required: true },
              { id: "keys_location", required: true },
            ],
          },
          {
            id: "technical-documents",
            title: "Documentos Técnicos de la Propiedad",
            required: true,
            fields: [
              { id: "doc_energy_cert", required: true },
              { id: "doc_renovation_files", required: true },
            ],
          },
          {
            id: "legal-documents",
            title: "Documentos Legales de la Propiedad",
            required: true,
            fields: [
              { id: "doc_purchase_contract", required: true },
              { id: "doc_land_registry_note", required: true },
            ],
          },
          {
            id: "client-financial-info",
            title: "Información Financiera del Cliente",
            required: true,
            fields: [
              { id: "client_iban", required: true },
              { id: "client_bank_certificate_url", required: true },
            ],
          },
          {
            id: "supplies-contracts",
            title: "Contratos de Suministros",
            required: true,
            fields: [
              { id: "doc_contract_electricity", required: true },
              { id: "doc_contract_water", required: true },
              { id: "doc_contract_gas", required: true },
            ],
          },
          {
            id: "supplies-bills",
            title: "Facturas de Suministros",
            required: true,
            fields: [
              { id: "doc_bill_electricity", required: true },
              { id: "doc_bill_water", required: true },
              { id: "doc_bill_gas", required: true },
            ],
          },
          {
            id: "home-insurance",
            title: "Seguro de Hogar",
            required: true,
            fields: [
              { id: "home_insurance_type", required: true },
              { id: "home_insurance_policy_url", required: true },
            ],
          },
          {
            id: "property-management",
            title: "Gestión de Propiedad (Property Management)",
            required: true,
            fields: [
              { id: "property_management_plan", required: true },
              { id: "property_management_plan_contract_url", required: true },
              { id: "property_manager", required: true },
            ],
          },
        ];

      default:
        return [
          {
            id: "general",
            title: "Tareas Generales",
            required: true,
            fields: [{ id: "task", required: false }],
          },
        ];
    }
  };

  const progressSections = getProgressSections();

  // Helper functions para inspección técnica (reutilizables)
  const getAllRooms = useCallback(() => {
    if (!supabaseProperty) return [];
    
    const rooms: Array<{ type: string; index?: number }> = [
      { type: "common_areas" },
      { type: "entry_hallways" },
      { type: "living_room" },
      { type: "kitchen" },
      { type: "exterior" },
    ];
    
    const bedrooms = supabaseProperty.bedrooms || 0;
    for (let i = 0; i < bedrooms; i++) {
      rooms.push({ type: "bedrooms", index: i });
    }
    
    const bathrooms = supabaseProperty.bathrooms || 0;
    for (let i = 0; i < bathrooms; i++) {
      rooms.push({ type: "bathrooms", index: i });
    }
    
    if (supabaseProperty.garage && supabaseProperty.garage !== "No tiene") {
      rooms.push({ type: "garage" });
    }
    if (supabaseProperty.has_terrace) {
      rooms.push({ type: "terrace" });
    }
    
    return rooms;
  }, [supabaseProperty]);

  const isRoomComplete = useCallback((room: { type: string; index?: number }): boolean => {
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

    const status = getRoomStatus(room);
    if (!status) return false;
    
    if (status === "good") {
      return getRoomCommercialPhotos(room).length > 0;
    } else if (status === "incident") {
      const comment = getRoomComment(room);
      const incidentPhotos = getRoomIncidentPhotos(room);
      const affects = getRoomAffectsCommercialization(room);
      
      if (!comment || incidentPhotos.length === 0 || affects === null) return false;
      
      // Si tiene incidencias bloqueantes, no está completa
      if (affects === true) return false;
      
      // Si tiene incidencias no bloqueantes, necesita fotos comerciales
      return getRoomCommercialPhotos(room).length > 0;
    }
    
    return false;
  }, [supabaseProperty]);

  // Calcular completitud de la sección de inspección técnica para fase 2
  const calculateTechnicalInspectionComplete = useCallback(() => {
    if (currentPhase !== "Listo para Alquilar" || !supabaseProperty) {
      return false;
    }

    const allRooms = getAllRooms();
    return allRooms.every(room => isRoomComplete(room));
  }, [currentPhase, supabaseProperty, getAllRooms, isRoomComplete]);

  // Preparar formData con datos adicionales para fase 2
  const enhancedFormData = useMemo(() => {
    const data = { ...formData };
    
    if (currentPhase === "Listo para Alquilar") {
      // Agregar completitud de inspección técnica
      data["readyToRent.technicalInspectionComplete"] = calculateTechnicalInspectionComplete();
    }
    
    return data;
  }, [formData, currentPhase, supabaseProperty]);

  // Calcular progreso de fase 2 y exponerlo al componente padre
  useEffect(() => {
    if (currentPhase === "Listo para Alquilar" && onPhase2ProgressChange) {
      if (progressSections.length === 0) {
        onPhase2ProgressChange(0);
        return;
      }

      // Helper para validar campos (similar a ProgressOverviewWidget)
      const isFieldValid = (sectionId: string, fieldId: string, value: any): boolean => {
        const phase2SectionIds = ["client-presentation", "pricing-strategy", "technical-inspection", "commercial-launch"];
        const isPhase2Section = phase2SectionIds.includes(sectionId);
        const sectionPrefix = isPhase2Section ? "readyToRent" : sectionId;
        const fieldKey = `${sectionPrefix}.${fieldId}`;
        
        // Handle composite phone field
        if (fieldId === "phone" && typeof value === 'object' && value !== null) {
          return !!(value.prefix && value.number);
        }
        
        // Handle JSONB arrays - must have at least one element
        if (Array.isArray(value)) {
          return value.length > 0 && value.some((item) => item !== null && item !== undefined && item !== "");
        }
        
        // Handle URL/document fields
        if (fieldId.includes("_url") || fieldId.includes("_cert") || fieldId.includes("doc_") || 
            fieldId.includes("Photos") || fieldId.includes("photos")) {
          return typeof value === 'string' && value.trim().length > 0 || 
                 (Array.isArray(value) && value.length > 0);
        }
        
        // Handle boolean fields (for Phase 2)
        if (typeof value === 'boolean') {
          return value === true;
        }
        
        // If field is empty, it's invalid (for required fields)
        if (value === undefined || value === null || value === "" || 
            (Array.isArray(value) && value.length === 0)) {
          return false;
        }
        
        return true;
      };

      // Helper para calcular progreso de una sección
      const calculateSectionProgress = (section: Section) => {
        // Special handling for technical inspection section
        if (section.id === "technical-inspection" && supabaseProperty) {
          const allRooms = getAllRooms();
          const completedRooms = allRooms.filter(room => isRoomComplete(room)).length;
          const totalRooms = allRooms.length;
          return { completed: completedRooms, total: totalRooms };
        }

        // Special handling for commercial-launch section
        if (section.id === "commercial-launch") {
          const publishOnline = enhancedFormData["readyToRent.publishOnline"];
          const idealistaDescription = enhancedFormData["readyToRent.idealistaDescription"] || "";
          
          if (publishOnline === false) {
            return { completed: 1, total: 1 };
          }
          
          if (publishOnline === true) {
            const hasDescription = idealistaDescription && typeof idealistaDescription === 'string' && idealistaDescription.trim() !== "";
            return { completed: hasDescription ? 1 : 0, total: 1 };
          }
          
          return { completed: 0, total: 1 };
        }
        
        // Check if this is a Phase 2 section
        const phase2SectionIds = ["client-presentation", "pricing-strategy", "technical-inspection", "commercial-launch"];
        const isPhase2Section = phase2SectionIds.includes(section.id);
        const sectionPrefix = isPhase2Section ? "readyToRent" : section.id;
        
        let totalFields = 0;
        let completedFields = 0;

        section.fields.forEach((field: any) => {
          if (field.id.includes("checklist") || field.id.includes("verified")) {
            const checklistItems = ["Verificación de documentos", "Validación de datos", "Revisión de contactos"];
            checklistItems.forEach((_, idx) => {
              totalFields++;
              const itemKey = isPhase2Section 
                ? `${sectionPrefix}.${field.id}_${idx}`
                : `${section.id}.${field.id}_${idx}`;
              const value = enhancedFormData[itemKey];
              if (value === true) completedFields++;
            });
          } else {
            totalFields++;
            const fieldKey = isPhase2Section 
              ? `${sectionPrefix}.${field.id}`
              : `${section.id}.${field.id}`;
            const value = enhancedFormData[fieldKey];
            
            if (field.required) {
              if (isFieldValid(section.id, field.id, value)) {
                completedFields++;
              }
            } else {
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

      // Calcular progreso global
      const requiredSections = progressSections.filter((s) => s.required);
      const completedSections = requiredSections.filter((section) => {
        const { completed, total } = calculateSectionProgress(section);
        return completed === total;
      }).length;
      
      const percentage = requiredSections.length > 0
        ? Math.round((completedSections / requiredSections.length) * 100)
        : 100;
      
      onPhase2ProgressChange(percentage);
    } else if (currentPhase !== "Listo para Alquilar" && onPhase2ProgressChange) {
      // Reset progress when not in phase 2
      onPhase2ProgressChange(100);
    }
  }, [currentPhase, enhancedFormData, supabaseProperty, onPhase2ProgressChange, progressSections, getAllRooms, isRoomComplete]);

  // Determinar qué tareas mostrar según la fase
  const isProphero = currentPhase === "Viviendas Prophero";
  const isReadyToRent = currentPhase === "Listo para Alquilar";
  const isTenantAccepted = currentPhase === "Inquilino aceptado";
  const isPendingProcedures = currentPhase === "Pendiente de trámites";
  const isRented = currentPhase === "Alquilado";
  const isIpcUpdate = currentPhase === "Actualización de Renta (IPC)";
  const isRenewalManagement = currentPhase === "Gestión de Renovación";
  const isFinalization = currentPhase === "Finalización y Salida";
  const isPublished = currentPhase === "Publicado";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Progress Overview Widget - Visible in ALL phases */}
      <ProgressOverviewWidget
        sections={progressSections}
        formData={enhancedFormData}
        visibleSections={progressSections.map(s => s.id)}
        fieldErrors={{}}
        propheroSectionReviews={propheroSectionReviews}
        supabaseProperty={supabaseProperty}
      />

      {/* Texto descriptivo para fase "Listo para Alquilar" */}
      {isReadyToRent && (
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold">Listo para Alquilar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Presenta el servicio al cliente, define la estrategia de precio, realiza la inspección técnica y prepara el lanzamiento comercial de la propiedad.
          </p>
        </div>
      )}

      {isProphero ? (
        <PropheroTasks 
          property={property} 
          onSectionReviewsChange={handlePropheroReviewsChange}
          onSubmitCommentsRef={onSubmitCommentsRef}
          onHasAnySectionWithNoRef={onHasAnySectionWithNoRef}
          onCanSubmitCommentsRef={onCanSubmitCommentsRef}
          onHasAnySectionWithNoChange={onHasAnySectionWithNoChange}
          onCanSubmitCommentsChange={onCanSubmitCommentsChange}
        />
      ) : isReadyToRent ? (
        <ReadyToRentTasks property={property} />
      ) : isTenantAccepted ? (
        <TenantAcceptedTasks propertyId={propertyId} property={property} />
      ) : isPendingProcedures ? (
        <PendingProceduresTasks property={property} />
      ) : isRented ? (
        <RentedTasks property={property} />
      ) : isIpcUpdate ? (
        <IpcUpdateTasks property={property} />
      ) : isRenewalManagement ? (
        <RenewalManagementTasks property={property} />
      ) : isFinalization ? (
        <FinalizationTasks property={property} />
      ) : isPublished ? (
        <PublishedTasks property={property} />
      ) : (
        <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            No hay tareas específicas para esta fase.
          </p>
        </div>
      )}
    </div>
  );
}
