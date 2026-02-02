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
import { useMemo, useEffect, useState, useCallback } from "react";
import type { PropheroSectionReviews } from "@/lib/supabase/types";

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
}

export function PropertyTasksTab({ propertyId, currentPhase, property: propFromParent, onPropheroReviewsChange }: PropertyTasksTabProps) {
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
          // Convertir a formato simplificado para el widget (solo necesitamos isCorrect)
          const simplified: Record<string, { isCorrect: boolean | null }> = {};
          Object.keys(reviews).forEach((sectionId) => {
            simplified[sectionId] = { 
              isCorrect: reviews[sectionId].isCorrect ?? null
            };
          });
          console.log("📊 Prophero reviews loaded for widget:", simplified);
          setPropheroSectionReviews(simplified as PropheroSectionReviews);
          // Notificar al componente padre sobre el estado inicial
          onPropheroReviewsChange?.(reviews as PropheroSectionReviews);
        } catch (error) {
          console.warn("Error parsing prophero_section_reviews:", error);
          setPropheroSectionReviews(undefined);
          onPropheroReviewsChange?.(undefined);
        }
      } else {
        // No hay reviews todavía, notificar con objeto vacío para que el padre sepa que estamos en Prophero
        console.log("📊 No prophero reviews found, initializing empty state");
        setPropheroSectionReviews(undefined);
        onPropheroReviewsChange?.(undefined);
      }
    } else {
      setPropheroSectionReviews(undefined);
      onPropheroReviewsChange?.(undefined);
    }
  }, [currentPhase, supabaseProperty?.prophero_section_reviews, onPropheroReviewsChange]);
  
  // Callback para actualizar el estado cuando PropheroTasks cambie las reviews
  const handlePropheroReviewsChange = useCallback((reviews: PropheroSectionReviews) => {
    // Convertir a formato simplificado para el widget (solo necesitamos isCorrect)
    const simplified: Record<string, { isCorrect: boolean | null }> = {};
    Object.keys(reviews).forEach((sectionId) => {
      simplified[sectionId] = { 
        isCorrect: reviews[sectionId].isCorrect ?? null
      };
    });
    console.log("🔄 Prophero reviews updated in widget:", simplified);
    setPropheroSectionReviews(simplified);
    // Notificar al componente padre (page.tsx) sobre los cambios
    onPropheroReviewsChange?.(reviews);
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
            id: "validation",
            title: "Validación Técnica",
            required: true,
            fields: [{ id: "technicalValidation", required: true }],
          },
          {
            id: "pricing",
            title: "Precio",
            required: true,
            fields: [
              { id: "monthlyRent", required: true },
              { id: "announcementPrice", required: true },
              { id: "ownerNotified", required: true },
            ],
          },
          {
            id: "publication",
            title: "Publicación",
            required: true,
            fields: [
              { id: "publishOnline", required: true },
              { id: "idealistaPrice", required: false },
              { id: "idealistaDescription", required: false },
              { id: "idealistaAddress", required: false },
              { id: "idealistaCity", required: false },
              { id: "idealistaPhotos", required: false },
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
        formData={formData}
        visibleSections={progressSections.map(s => s.id)}
        fieldErrors={{}}
        propheroSectionReviews={propheroSectionReviews}
      />

      {isProphero ? (
        <PropheroTasks property={property} onSectionReviewsChange={handlePropheroReviewsChange} />
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
