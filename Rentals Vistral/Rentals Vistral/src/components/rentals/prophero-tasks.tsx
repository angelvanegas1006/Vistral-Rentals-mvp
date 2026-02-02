"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { usePropertyForm } from "./property-form-context";
import { useProperty } from "@/hooks/use-property";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { PropheroSectionWidget } from "./prophero-section-widget";
import { DOCUMENT_LABELS } from "@/lib/document-labels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2 } from "lucide-react";
import { DocumentUploadModal } from "./document-upload-modal";
import { DocumentPreviewModal } from "./document-preview-modal";
import { uploadDocument } from "@/lib/document-upload";
import { deleteDocument } from "@/lib/document-upload";
import type { PropheroSectionReviews, PropheroSectionReview } from "@/lib/supabase/types";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
}

interface PropheroTasksProps {
  property: Property;
  onSectionReviewsChange?: (reviews: PropheroSectionReviews) => void;
}

export function PropheroTasks({ property, onSectionReviewsChange }: PropheroTasksProps) {
  const { formData, initializeFormData } = usePropertyForm();
  const { property: supabaseProperty, loading } = useProperty(property.property_unique_id);
  const { updateProperty } = useUpdateProperty();
  const hasInitializedRef = useRef(false);
  const [localProperty, setLocalProperty] = useState(supabaseProperty);
  const [sectionReviews, setSectionReviews] = useState<PropheroSectionReviews>({});
  const reviewSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState<{
    open: boolean;
    fieldName: string | null;
    label: string;
  }>({ open: false, fieldName: null, label: "" });
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });

  // Update local property when supabase property changes
  useEffect(() => {
    if (supabaseProperty) {
      setLocalProperty(supabaseProperty);
      
      // Cargar estado de revisión desde prophero_section_reviews
      if (supabaseProperty.prophero_section_reviews) {
        try {
          const reviews = typeof supabaseProperty.prophero_section_reviews === 'string'
            ? JSON.parse(supabaseProperty.prophero_section_reviews)
            : supabaseProperty.prophero_section_reviews;
          
          // Migrar datos antiguos: convertir completed a hasIssue si es necesario
          const migratedReviews: PropheroSectionReviews = {};
          Object.keys(reviews).forEach((sectionId) => {
            const review = reviews[sectionId];
            // Si tiene completed (datos antiguos), migrar a hasIssue
            if ('completed' in review && !('hasIssue' in review)) {
              migratedReviews[sectionId] = {
                reviewed: review.reviewed ?? false,
                isCorrect: review.isCorrect ?? null,
                comments: review.comments ?? null,
                hasIssue: review.isCorrect === false || false, // hasIssue basado en isCorrect
              };
            } else {
              // Ya tiene hasIssue o es nuevo, usar tal cual
              migratedReviews[sectionId] = {
                reviewed: review.reviewed ?? false,
                isCorrect: review.isCorrect ?? null,
                comments: review.comments ?? null,
                hasIssue: review.hasIssue ?? false,
              };
            }
          });
          
          setSectionReviews(migratedReviews);
          // Notificar al componente padre cuando se carga el estado inicial
          onSectionReviewsChange?.(migratedReviews);
        } catch (error) {
          console.warn("Error parsing prophero_section_reviews:", error);
          setSectionReviews({});
          onSectionReviewsChange?.({});
        }
      } else {
        setSectionReviews({});
        onSectionReviewsChange?.({});
      }
    }
  }, [supabaseProperty, onSectionReviewsChange]);
  
  // Función para guardar el estado de revisión en Supabase con debounce
  const saveReviewState = useCallback(async (reviews: PropheroSectionReviews) => {
    if (!localProperty?.property_unique_id) return;
    
    if (reviewSaveTimeoutRef.current) {
      clearTimeout(reviewSaveTimeoutRef.current);
    }
    
    reviewSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await updateProperty(localProperty.property_unique_id, {
          prophero_section_reviews: reviews,
        });
        // NO disparar evento property-updated para evitar recargar la página y perder la posición del scroll
        // El estado local ya está actualizado, no necesitamos recargar desde el servidor
        if (!success) {
          console.error("Failed to save review state");
        }
      } catch (error) {
        console.error("Failed to save review state:", error);
      }
    }, 1000);
  }, [localProperty?.property_unique_id, updateProperty]);
  
  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (reviewSaveTimeoutRef.current) {
        clearTimeout(reviewSaveTimeoutRef.current);
      }
    };
  }, []);

  // Initialize formData
  useEffect(() => {
    if (supabaseProperty && !loading && !hasInitializedRef.current) {
      const initialData: Record<string, any> = {};
      
      if (supabaseProperty.admin_name) {
        initialData["property-management-info.admin_name"] = supabaseProperty.admin_name;
      }
      if (supabaseProperty.keys_location) {
        initialData["property-management-info.keys_location"] = supabaseProperty.keys_location;
      }
      if (supabaseProperty.doc_energy_cert) {
        initialData["technical-documents.doc_energy_cert"] = supabaseProperty.doc_energy_cert;
      }
      if (supabaseProperty.doc_renovation_files) {
        let renovationFiles: string[] = [];
        try {
          if (Array.isArray(supabaseProperty.doc_renovation_files)) {
            renovationFiles = supabaseProperty.doc_renovation_files;
          } else if (typeof supabaseProperty.doc_renovation_files === 'string') {
            renovationFiles = JSON.parse(supabaseProperty.doc_renovation_files);
          }
        } catch (error) {
          console.warn("Error parsing doc_renovation_files:", error);
        }
        if (renovationFiles.length > 0) {
          initialData["technical-documents.doc_renovation_files"] = renovationFiles;
        }
      }
      if (supabaseProperty.doc_purchase_contract) {
        initialData["legal-documents.doc_purchase_contract"] = supabaseProperty.doc_purchase_contract;
      }
      if (supabaseProperty.doc_land_registry_note) {
        initialData["legal-documents.doc_land_registry_note"] = supabaseProperty.doc_land_registry_note;
      }
      if (supabaseProperty.client_iban) {
        initialData["client-financial-info.client_iban"] = supabaseProperty.client_iban;
      }
      if (supabaseProperty.client_bank_certificate_url) {
        initialData["client-financial-info.client_bank_certificate_url"] = supabaseProperty.client_bank_certificate_url;
      }
      if (supabaseProperty.doc_contract_electricity) {
        initialData["supplies-contracts.doc_contract_electricity"] = supabaseProperty.doc_contract_electricity;
      }
      if (supabaseProperty.doc_contract_water) {
        initialData["supplies-contracts.doc_contract_water"] = supabaseProperty.doc_contract_water;
      }
      if (supabaseProperty.doc_contract_gas) {
        initialData["supplies-contracts.doc_contract_gas"] = supabaseProperty.doc_contract_gas;
      }
      if (supabaseProperty.doc_bill_electricity) {
        initialData["supplies-bills.doc_bill_electricity"] = supabaseProperty.doc_bill_electricity;
      }
      if (supabaseProperty.doc_bill_water) {
        initialData["supplies-bills.doc_bill_water"] = supabaseProperty.doc_bill_water;
      }
      if (supabaseProperty.doc_bill_gas) {
        initialData["supplies-bills.doc_bill_gas"] = supabaseProperty.doc_bill_gas;
      }
      if (supabaseProperty.home_insurance_type) {
        initialData["home-insurance.home_insurance_type"] = supabaseProperty.home_insurance_type;
      }
      if (supabaseProperty.home_insurance_policy_url) {
        initialData["home-insurance.home_insurance_policy_url"] = supabaseProperty.home_insurance_policy_url;
      }
      if (supabaseProperty.property_management_plan) {
        initialData["property-management.property_management_plan"] = supabaseProperty.property_management_plan;
      }
      if (supabaseProperty.property_management_plan_contract_url) {
        initialData["property-management.property_management_plan_contract_url"] = supabaseProperty.property_management_plan_contract_url;
      }
      if (supabaseProperty.property_manager) {
        initialData["property-management.property_manager"] = supabaseProperty.property_manager;
      }

      if (Object.keys(initialData).length > 0) {
        initializeFormData(initialData);
        hasInitializedRef.current = true;
      }
    }
  }, [supabaseProperty, loading, initializeFormData, property.property_unique_id]);

  // Reset hasInitializedRef when property changes
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [property.property_unique_id]);

  // Helper to check if a section has data
  // La pregunta "¿Es correcta esta información?" debe aparecer siempre que haya AL MENOS UN campo con datos
  const sectionHasData = useCallback((sectionId: string, fields: string[]): boolean => {
    if (!localProperty) return false;
    // Verificar si hay al menos un campo con datos (no todos)
    return fields.some((field) => {
      const value = localProperty[field as keyof typeof localProperty];
      if (field === "doc_renovation_files") {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== null && value !== undefined && value !== "";
    });
  }, [localProperty]);
  
  // Helper to check if a section is complete (considering review state)
  // Una sección solo estará completa cuando la respuesta a "¿Es correcta esta información?" sea Sí
  const isSectionComplete = useCallback((sectionId: string, fields: string[]): boolean => {
    if (!localProperty) return false;
    
    // Verificar que tenga datos
    const hasData = sectionHasData(sectionId, fields);
    if (!hasData) return false;
    
    // Verificar estado de revisión - SOLO está completa si isCorrect === true
    // Si está en blanco (null) o la respuesta es No (false), la sección se considera incompleta
    const review = sectionReviews[sectionId];
    if (review?.isCorrect === true) {
      return true;
    }
    
    // Si no hay estado de revisión, isCorrect es null, o isCorrect es false, NO está completa
    return false;
  }, [localProperty, sectionReviews, sectionHasData]);

  // Helper to check if fields should be disabled for a section
  const isSectionFieldsDisabled = useCallback((sectionId: string): boolean => {
    const review = sectionReviews[sectionId];
    // Si no hay reviewState, los campos están deshabilitados (no se puede editar hasta responder)
    if (!review) return true;
    // Si respondió "Sí", los campos están deshabilitados (la información es correcta)
    // Incluso si está completada, si respondió "Sí" no se puede editar
    if (review.isCorrect === true) return true;
    // Si respondió "No", los campos están habilitados (se puede editar para corregir)
    // Incluso después de marcar como completado, si respondió "No" se puede seguir editando
    return false;
  }, [sectionReviews]);
  
  // Handler para cambiar el estado de revisión
  const handleReviewChange = useCallback((sectionId: string, isCorrect: boolean | null) => {
    setSectionReviews((prev) => {
      const prevReview = prev[sectionId];
      // hasIssue es histórico: se establece a true cuando isCorrect === false y nunca vuelve a false
      const currentHasIssue = prevReview?.hasIssue ?? false;
      const newHasIssue = currentHasIssue || isCorrect === false;
      
      const updated = {
        ...prev,
        [sectionId]: {
          reviewed: true,
          isCorrect,
          comments: prevReview?.comments ?? null,
          hasIssue: newHasIssue,
        },
      };
      saveReviewState(updated);
      // Notificar al componente padre para actualizar el widget en tiempo real
      onSectionReviewsChange?.(updated);
      return updated;
    });
  }, [saveReviewState, onSectionReviewsChange]);
  
  // Handler para cambiar comentarios
  const handleCommentsChange = useCallback((sectionId: string, comments: string) => {
    setSectionReviews((prev) => {
      const prevReview = prev[sectionId];
      const updated = {
        ...prev,
        [sectionId]: {
          ...prevReview,
          reviewed: prevReview?.reviewed ?? true,
          isCorrect: prevReview?.isCorrect ?? false,
          comments: comments || null,
          hasIssue: prevReview?.hasIssue ?? false, // Mantener hasIssue existente (histórico)
        },
      };
      saveReviewState(updated);
      return updated;
    });
  }, [saveReviewState]);
  
  // Handler para guardar correcciones y validar
  // Cuando la respuesta es No y se pulsa el botón, debe cambiar la respuesta a Sí
  const handleMarkComplete = useCallback((sectionId: string) => {
    setSectionReviews((prev) => {
      const prevReview = prev[sectionId];
      const currentIsCorrect = prevReview?.isCorrect ?? null;
      
      // Si la respuesta actual es No, cambiar a Sí automáticamente
      const newIsCorrect = currentIsCorrect === false ? true : currentIsCorrect;
      
      const updated = {
        ...prev,
        [sectionId]: {
          ...prevReview,
          reviewed: true,
          isCorrect: newIsCorrect,
          comments: prevReview?.comments ?? null,
          hasIssue: prevReview?.hasIssue ?? false, // Mantener hasIssue existente (histórico, no cambia)
        },
      };
      saveReviewState(updated);
      // Notificar al componente padre para actualizar el widget en tiempo real
      onSectionReviewsChange?.(updated);
      return updated;
    });
  }, [saveReviewState, onSectionReviewsChange]);

  // Check if all required sections are complete
  const allSectionsComplete = useMemo(() => {
    if (!localProperty) return false;
    
    return (
      isSectionComplete("property-management-info", ["admin_name", "keys_location"]) &&
      isSectionComplete("technical-documents", ["doc_energy_cert", "doc_renovation_files"]) &&
      isSectionComplete("legal-documents", ["doc_purchase_contract", "doc_land_registry_note"]) &&
      isSectionComplete("client-financial-info", ["client_iban", "client_bank_certificate_url"]) &&
      isSectionComplete("supplies-contracts", ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"]) &&
      isSectionComplete("supplies-bills", ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"]) &&
      isSectionComplete("home-insurance", ["home_insurance_type", "home_insurance_policy_url"]) &&
      isSectionComplete("property-management", ["property_management_plan", "property_management_plan_contract_url", "property_manager"])
    );
  }, [isSectionComplete]);

  // Handle text field updates
  const handleTextUpdate = async (fieldName: string, value: string) => {
    if (!localProperty) return;
    
    try {
      await updateProperty(localProperty.property_unique_id, { [fieldName]: value || null });
      setLocalProperty((prev) => (prev ? { ...prev, [fieldName]: value || null } : null));
    } catch (error) {
      console.error("Failed to update field:", error);
      alert(`Error al actualizar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (fieldName: string, file: File, isArray = false) => {
    if (!localProperty?.property_unique_id) return;

    try {
      const currentValue = localProperty[fieldName as keyof typeof localProperty] as string | string[] | null | undefined;
      const oldValue = isArray ? null : (typeof currentValue === 'string' ? currentValue : null);
      
      const newUrl = await uploadDocument(fieldName, localProperty.property_unique_id, file, oldValue);
      
      if (isArray) {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const updatedArray = [...currentArray, newUrl];
        await updateProperty(localProperty.property_unique_id, { [fieldName]: updatedArray });
        setLocalProperty((prev) => (prev ? { ...prev, [fieldName]: updatedArray } : null));
      } else {
        await updateProperty(localProperty.property_unique_id, { [fieldName]: newUrl });
        setLocalProperty((prev) => (prev ? { ...prev, [fieldName]: newUrl } : null));
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle document delete
  const handleDocumentDelete = async (fieldName: string, fileUrl?: string) => {
    if (!localProperty?.property_unique_id) return;

    try {
      if (fieldName === "doc_renovation_files" && fileUrl) {
        const currentArray = Array.isArray(localProperty.doc_renovation_files) 
          ? localProperty.doc_renovation_files 
          : [];
        const updatedArray = currentArray.filter((url) => url !== fileUrl);
        await deleteDocument(fieldName, localProperty.property_unique_id, fileUrl);
        await updateProperty(localProperty.property_unique_id, { [fieldName]: updatedArray });
        setLocalProperty((prev) => (prev ? { ...prev, [fieldName]: updatedArray } : null));
      } else {
        await deleteDocument(fieldName, localProperty.property_unique_id, fileUrl || localProperty[fieldName as keyof typeof localProperty] as string);
        await updateProperty(localProperty.property_unique_id, { [fieldName]: null });
        setLocalProperty((prev) => (prev ? { ...prev, [fieldName]: null } : null));
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Render document pill/row (same style as DocumentSection)
  const renderDocumentPill = (
    label: string,
    url: string | null,
    fieldName: string,
    sectionId: string,
    fileUrl?: string
  ) => {
    const hasDocument = url && url.trim().length > 0;
    const fieldsDisabled = isSectionFieldsDisabled(sectionId);

    return (
      <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => {
            if (hasDocument) {
              setPreviewModal({ open: true, url: url!, label });
            }
          }}
        >
          <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              {hasDocument ? "PDF" : "No disponible"}
            </p>
          </div>
        </div>
        {!fieldsDisabled && (
          <div className="flex items-center gap-2">
            {hasDocument ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentDelete(fieldName, fileUrl || url || undefined);
                }}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadModalOpen({ open: true, fieldName, label });
                }}
                className="h-8 w-8 border-2 border-dashed"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading || !localProperty) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Título e introducción */}
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold">Viviendas Prophero</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y completa toda la información de la propiedad. Verifica que cada sección esté correcta antes de continuar.
          </p>
        </div>

        <div className="space-y-6">
        {/* 1. Información de Gestión de la Propiedad */}
        <PropheroSectionWidget
          id="property-management-info"
          title="Información de Gestión de la Propiedad"
          required
          isComplete={isSectionComplete("property-management-info", ["admin_name", "keys_location"])}
          hasData={sectionHasData("property-management-info", ["admin_name", "keys_location"])}
          reviewState={sectionReviews["property-management-info"]}
          onReviewChange={(isCorrect) => handleReviewChange("property-management-info", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("property-management-info", comments)}
          onMarkComplete={() => handleMarkComplete("property-management-info")}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin_name">Administrador de la propiedad</Label>
              <Input
                id="admin_name"
                value={localProperty.admin_name || ""}
                onChange={(e) => handleTextUpdate("admin_name", e.target.value)}
                placeholder="Nombre del administrador"
                disabled={isSectionFieldsDisabled("property-management-info")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keys_location">Localización de las llaves</Label>
              <Input
                id="keys_location"
                value={localProperty.keys_location || ""}
                onChange={(e) => handleTextUpdate("keys_location", e.target.value)}
                placeholder="Ubicación de las llaves"
                disabled={isSectionFieldsDisabled("property-management-info")}
              />
            </div>
          </div>
        </PropheroSectionWidget>

        {/* 2. Documentos Técnicos */}
        <PropheroSectionWidget
          id="technical-documents"
          title="Documentos Técnicos de la Propiedad"
          required
          isComplete={isSectionComplete("technical-documents", ["doc_energy_cert", "doc_renovation_files"])}
          hasData={sectionHasData("technical-documents", ["doc_energy_cert", "doc_renovation_files"])}
          reviewState={sectionReviews["technical-documents"]}
          onReviewChange={(isCorrect) => handleReviewChange("technical-documents", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("technical-documents", comments)}
          onMarkComplete={() => handleMarkComplete("technical-documents")}
        >
          <div className="space-y-2">
            {renderDocumentPill(
              DOCUMENT_LABELS.ENERGY_CERTIFICATE,
              localProperty.doc_energy_cert,
              "doc_energy_cert",
              "technical-documents"
            )}
            {Array.isArray(localProperty.doc_renovation_files) && localProperty.doc_renovation_files.length > 0 ? (
              <>
                {localProperty.doc_renovation_files.map((url: string, idx: number) => (
                  <div key={idx}>
                    {renderDocumentPill(
                      `${DOCUMENT_LABELS.RENOVATION_FILES} ${idx + 1}`,
                      url,
                      "doc_renovation_files",
                      "technical-documents",
                      url
                    )}
                  </div>
                ))}
                {!isSectionFieldsDisabled("technical-documents") && (
                  <button
                    onClick={() => setUploadModalOpen({ open: true, fieldName: "doc_renovation_files", label: DOCUMENT_LABELS.RENOVATION_FILES })}
                    className="w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Añadir otro documento de reforma</span>
                  </button>
                )}
              </>
            ) : (
              renderDocumentPill(
                DOCUMENT_LABELS.RENOVATION_FILES,
                null,
                "doc_renovation_files",
                "technical-documents"
              )
            )}
          </div>
        </PropheroSectionWidget>

        {/* 3. Documentos Legales */}
        <PropheroSectionWidget
          id="legal-documents"
          title="Documentos Legales de la Propiedad"
          required
          isComplete={isSectionComplete("legal-documents", ["doc_purchase_contract", "doc_land_registry_note"])}
          hasData={sectionHasData("legal-documents", ["doc_purchase_contract", "doc_land_registry_note"])}
          reviewState={sectionReviews["legal-documents"]}
          onReviewChange={(isCorrect) => handleReviewChange("legal-documents", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("legal-documents", comments)}
          onMarkComplete={() => handleMarkComplete("legal-documents")}
        >
          <div className="space-y-2">
            {renderDocumentPill(
              DOCUMENT_LABELS.PURCHASE_CONTRACT,
              localProperty.doc_purchase_contract,
              "doc_purchase_contract",
              "legal-documents"
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.LAND_REGISTRY_NOTE,
              localProperty.doc_land_registry_note,
              "doc_land_registry_note",
              "legal-documents"
            )}
          </div>
        </PropheroSectionWidget>

        {/* 4. Información Financiera del Cliente */}
        <PropheroSectionWidget
          id="client-financial-info"
          title="Información Financiera del Cliente"
          required
          isComplete={isSectionComplete("client-financial-info", ["client_iban", "client_bank_certificate_url"])}
          hasData={sectionHasData("client-financial-info", ["client_iban", "client_bank_certificate_url"])}
          reviewState={sectionReviews["client-financial-info"]}
          onReviewChange={(isCorrect) => handleReviewChange("client-financial-info", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("client-financial-info", comments)}
          onMarkComplete={() => handleMarkComplete("client-financial-info")}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_iban">Cuenta bancaria del propietario (IBAN)</Label>
              <Input
                id="client_iban"
                value={localProperty.client_iban || ""}
                onChange={(e) => handleTextUpdate("client_iban", e.target.value)}
                placeholder="ESXX XXXX XXXX XXXX XXXX XXXX"
                disabled={isSectionFieldsDisabled("client-financial-info")}
              />
            </div>
            {renderDocumentPill(
              DOCUMENT_LABELS.BANK_CERTIFICATE,
              localProperty.client_bank_certificate_url,
              "client_bank_certificate_url",
              "client-financial-info"
            )}
          </div>
        </PropheroSectionWidget>

        {/* 5. Contratos de Suministros */}
        <PropheroSectionWidget
          id="supplies-contracts"
          title="Contratos de Suministros"
          required
          isComplete={isSectionComplete("supplies-contracts", ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"])}
          hasData={sectionHasData("supplies-contracts", ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"])}
          reviewState={sectionReviews["supplies-contracts"]}
          onReviewChange={(isCorrect) => handleReviewChange("supplies-contracts", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("supplies-contracts", comments)}
          onMarkComplete={() => handleMarkComplete("supplies-contracts")}
        >
          <div className="space-y-2">
            {renderDocumentPill(
              DOCUMENT_LABELS.CONTRACT_ELECTRICITY,
              localProperty.doc_contract_electricity,
              "doc_contract_electricity",
              "supplies-contracts"
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.CONTRACT_WATER,
              localProperty.doc_contract_water,
              "doc_contract_water",
              "supplies-contracts"
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.CONTRACT_GAS,
              localProperty.doc_contract_gas,
              "doc_contract_gas",
              "supplies-contracts"
            )}
          </div>
        </PropheroSectionWidget>

        {/* 6. Facturas de Suministros */}
        <PropheroSectionWidget
          id="supplies-bills"
          title="Facturas de Suministros"
          required
          isComplete={isSectionComplete("supplies-bills", ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"])}
          hasData={sectionHasData("supplies-bills", ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"])}
          reviewState={sectionReviews["supplies-bills"]}
          onReviewChange={(isCorrect) => handleReviewChange("supplies-bills", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("supplies-bills", comments)}
          onMarkComplete={() => handleMarkComplete("supplies-bills")}
        >
          <div className="space-y-2">
            {renderDocumentPill(
              DOCUMENT_LABELS.BILL_ELECTRICITY,
              localProperty.doc_bill_electricity,
              "doc_bill_electricity",
              "supplies-bills"
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.BILL_WATER,
              localProperty.doc_bill_water,
              "doc_bill_water",
              "supplies-bills"
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.BILL_GAS,
              localProperty.doc_bill_gas,
              "doc_bill_gas",
              "supplies-bills"
            )}
          </div>
        </PropheroSectionWidget>

        {/* 7. Seguro de Hogar */}
        <PropheroSectionWidget
          id="home-insurance"
          title="Seguro de Hogar"
          required
          isComplete={isSectionComplete("home-insurance", ["home_insurance_type", "home_insurance_policy_url"])}
          hasData={sectionHasData("home-insurance", ["home_insurance_type", "home_insurance_policy_url"])}
          reviewState={sectionReviews["home-insurance"]}
          onReviewChange={(isCorrect) => handleReviewChange("home-insurance", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("home-insurance", comments)}
          onMarkComplete={() => handleMarkComplete("home-insurance")}
        >
          <div className="space-y-4">
            <div className="mb-6">
              <div className="flex flex-col w-full rounded-md border border-[var(--prophero-gray-300)] bg-background px-3 py-2 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--prophero-blue-500)] focus-within:border-[var(--prophero-blue-500)] focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--prophero-gray-700)] transition-colors">
                <Label className="text-sm font-medium mb-2">Tipo de Seguro de Hogar</Label>
                <RadioGroup
                  value={localProperty.home_insurance_type || ""}
                  onValueChange={(value) => handleTextUpdate("home_insurance_type", value)}
                  disabled={isSectionFieldsDisabled("home-insurance")}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Básico" id="home_insurance_type_basico" />
                    <Label htmlFor="home_insurance_type_basico" className="font-normal cursor-pointer text-sm">
                      Básico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Completo" id="home_insurance_type_completo" />
                    <Label htmlFor="home_insurance_type_completo" className="font-normal cursor-pointer text-sm">
                      Completo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Premium" id="home_insurance_type_premium" />
                    <Label htmlFor="home_insurance_type_premium" className="font-normal cursor-pointer text-sm">
                      Premium
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            {renderDocumentPill(
              DOCUMENT_LABELS.HOME_INSURANCE_POLICY,
              localProperty.home_insurance_policy_url,
              "home_insurance_policy_url",
              "home-insurance"
            )}
          </div>
        </PropheroSectionWidget>

        {/* 8. Gestión de Propiedad */}
        <PropheroSectionWidget
          id="property-management"
          title="Gestión de Propiedad (Property Management)"
          required
          isComplete={isSectionComplete("property-management", ["property_management_plan", "property_management_plan_contract_url", "property_manager"])}
          hasData={sectionHasData("property-management", ["property_management_plan", "property_management_plan_contract_url", "property_manager"])}
          reviewState={sectionReviews["property-management"]}
          onReviewChange={(isCorrect) => handleReviewChange("property-management", isCorrect)}
          onCommentsChange={(comments) => handleCommentsChange("property-management", comments)}
          onMarkComplete={() => handleMarkComplete("property-management")}
        >
          <div className="space-y-4">
            <div className="mb-6">
              <div className="flex flex-col w-full rounded-md border border-[var(--prophero-gray-300)] bg-background px-3 py-2 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--prophero-blue-500)] focus-within:border-[var(--prophero-blue-500)] focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--prophero-gray-700)] transition-colors">
                <Label className="text-sm font-medium mb-2">Plan PM</Label>
                <RadioGroup
                  value={localProperty.property_management_plan || ""}
                  onValueChange={(value) => handleTextUpdate("property_management_plan", value)}
                  disabled={isSectionFieldsDisabled("property-management")}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Premium" id="property_management_plan_premium" />
                    <Label htmlFor="property_management_plan_premium" className="font-normal cursor-pointer text-sm">
                      Premium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Basic" id="property_management_plan_basic" />
                    <Label htmlFor="property_management_plan_basic" className="font-normal cursor-pointer text-sm">
                      Basic
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            {renderDocumentPill(
              DOCUMENT_LABELS.PROPERTY_MANAGEMENT_CONTRACT,
              localProperty.property_management_plan_contract_url,
              "property_management_plan_contract_url",
              "property-management"
            )}
            <div className="space-y-2">
              <Label htmlFor="property_manager">Property Manager asignado</Label>
              <Input
                id="property_manager"
                value={localProperty.property_manager || ""}
                onChange={(e) => handleTextUpdate("property_manager", e.target.value)}
                placeholder="Nombre del property manager"
                disabled={isSectionFieldsDisabled("property-management")}
              />
            </div>
          </div>
        </PropheroSectionWidget>
      </div>
    </div>

    {/* Upload Modal */}
    {uploadModalOpen.open && uploadModalOpen.fieldName && (
      <DocumentUploadModal
        open={uploadModalOpen.open}
        onOpenChange={(open) => {
          if (!open) {
            setUploadModalOpen({ open: false, fieldName: null, label: "" });
          }
        }}
        onUpload={async (file) => {
          const isArray = uploadModalOpen.fieldName === "doc_renovation_files";
          await handleDocumentUpload(uploadModalOpen.fieldName!, file, isArray);
          setUploadModalOpen({ open: false, fieldName: null, label: "" });
        }}
        label={uploadModalOpen.label || uploadModalOpen.fieldName || ""}
        isEdit={false}
      />
    )}

    {/* Preview Modal */}
    {previewModal.open && previewModal.url && (
      <DocumentPreviewModal
        open={previewModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewModal({ open: false, url: null, label: "" });
          }
        }}
        documentUrl={previewModal.url}
        documentName={previewModal.label}
      />
    )}
    </>
  );
}
