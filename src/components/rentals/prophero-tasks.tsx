"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { usePropertyForm } from "./property-form-context";
import { useProperty } from "@/hooks/use-property";
import { useUpdateProperty } from "@/hooks/use-update-property";
import { PropheroSectionWidget } from "./prophero-section-widget";
import { DOCUMENT_LABELS, getFieldLabel } from "@/lib/document-labels";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, User, Key, CreditCard, Building2, Shield, Briefcase } from "lucide-react";
import { DocumentUploadModal } from "./document-upload-modal";
import { DocumentPreviewModal } from "./document-preview-modal";
import { uploadDocument } from "@/lib/document-upload";
import { deleteDocument } from "@/lib/document-upload";
import type { PropheroSectionReviews, PropheroSectionReview, CommentSubmissionHistoryEntry } from "@/lib/supabase/types";
import { toast } from "sonner";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
}

interface PropheroTasksProps {
  property: Property;
  onSectionReviewsChange?: (reviews: PropheroSectionReviews) => void;
  onSubmitCommentsRef?: React.MutableRefObject<(() => void) | null>;
  onHasAnySectionWithNoRef?: React.MutableRefObject<boolean>;
  onCanSubmitCommentsRef?: React.MutableRefObject<boolean>;
  onHasAnySectionWithNoChange?: (hasNo: boolean) => void;
  onCanSubmitCommentsChange?: (canSubmit: boolean) => void;
}

export function PropheroTasks({ 
  property, 
  onSectionReviewsChange,
  onSubmitCommentsRef,
  onHasAnySectionWithNoRef,
  onCanSubmitCommentsRef,
  onHasAnySectionWithNoChange,
  onCanSubmitCommentsChange,
}: PropheroTasksProps) {
  const { formData, initializeFormData } = usePropertyForm();
  const { property: supabaseProperty, loading } = useProperty(property.property_unique_id);
  const { updateProperty } = useUpdateProperty();
  const hasInitializedRef = useRef(false);
  const [localProperty, setLocalProperty] = useState(supabaseProperty);
  const [sectionReviews, setSectionReviews] = useState<PropheroSectionReviews>({});
  const [isSubmittingComments, setIsSubmittingComments] = useState(false);
  const reviewSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedChangesOnLoadRef = useRef(false);
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
          // IMPORTANTE: Preservar todos los campos nuevos (submittedComments, snapshot, _meta)
          const migratedReviews: PropheroSectionReviews = {};
          
          // Preservar _meta si existe
          if (reviews._meta) {
            migratedReviews._meta = reviews._meta;
          }
          
          Object.keys(reviews).forEach((sectionId) => {
            // Saltar _meta, ya lo procesamos arriba
            if (sectionId === '_meta') return;
            
            const review = reviews[sectionId];
            // Si tiene completed (datos antiguos), migrar a hasIssue
            if ('completed' in review && !('hasIssue' in review)) {
              migratedReviews[sectionId] = {
                reviewed: review.reviewed ?? false,
                isCorrect: review.isCorrect ?? null,
                comments: review.comments ?? null,
                hasIssue: review.isCorrect === false || false, // hasIssue basado en isCorrect
                // Preservar campos nuevos si existen
                submittedComments: review.submittedComments ?? null,
                snapshot: review.snapshot ?? null,
              };
            } else {
              // Ya tiene hasIssue o es nuevo, usar tal cual pero preservar todos los campos
              migratedReviews[sectionId] = {
                reviewed: review.reviewed ?? false,
                isCorrect: review.isCorrect ?? null,
                comments: review.comments ?? null,
                hasIssue: review.hasIssue ?? false,
                // Preservar campos nuevos si existen
                submittedComments: review.submittedComments ?? null,
                snapshot: review.snapshot ?? null,
              };
            }
          });
          
          setSectionReviews(migratedReviews);
          // IMPORTANTE: NO guardar ni notificar cambios cuando se carga el estado inicial desde Supabase
          // El subestado debe calcularse solo cuando se carga el kanban desde Supabase, no cuando se entra a la tarjeta
          // onSectionReviewsChange?.(migratedReviews); // COMENTADO: No notificar al cargar inicialmente
        } catch (error) {
          console.warn("Error parsing prophero_section_reviews:", error);
          setSectionReviews({});
          // IMPORTANTE: NO guardar ni notificar cambios cuando se carga el estado inicial desde Supabase
          // onSectionReviewsChange?.({}); // COMENTADO: No notificar al cargar inicialmente
        }
      } else {
        setSectionReviews({});
        // IMPORTANTE: NO guardar ni notificar cambios cuando se carga el estado inicial desde Supabase
        // onSectionReviewsChange?.({}); // COMENTADO: No notificar al cargar inicialmente
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
        // Disparar evento para actualizar el kanban board y otros componentes que escuchan cambios
        // Incluir los reviews actualizados en el evento para que el kanban pueda recalcular el subestado inmediatamente
        if (success) {
          // Disparar evento inmediatamente con los datos actualizados
          window.dispatchEvent(new CustomEvent('property-updated', {
            detail: { 
              propertyId: localProperty.property_unique_id,
              propheroSectionReviews: reviews // Incluir los reviews actualizados
            }
          }));
          
          // También disparar un evento específico para actualización de reviews de Prophero
          // Esto asegura que el kanban se actualice incluso si hay algún problema con el evento general
          window.dispatchEvent(new CustomEvent('prophero-reviews-updated', {
            detail: { 
              propertyId: localProperty.property_unique_id,
              propheroSectionReviews: reviews
            }
          }));
        } else {
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

  // Mapeo de secciones a campos (para snapshot y detección de cambios)
  const SECTION_FIELDS_MAP: Record<string, string[]> = {
    "property-management-info": ["admin_name", "keys_location"],
    "technical-documents": ["doc_energy_cert", "doc_renovation_files"],
    "legal-documents": ["doc_purchase_contract", "doc_land_registry_note"],
    "client-financial-info": ["client_iban", "client_bank_certificate_url"],
    "supplies-contracts": ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"],
    "supplies-bills": ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"],
    "home-insurance": ["home_insurance_type", "home_insurance_policy_url"],
    "property-management": ["property_management_plan", "property_management_plan_contract_url", "property_manager"],
  };

  // Mapeo de IDs de sección a títulos
  const SECTION_TITLES: Record<string, string> = {
    "property-management-info": "Información de Gestión de la Propiedad",
    "technical-documents": "Documentos Técnicos de la Propiedad",
    "legal-documents": "Documentos Legales de la Propiedad",
    "client-financial-info": "Información Financiera del Cliente",
    "supplies-contracts": "Contratos de Suministros",
    "supplies-bills": "Facturas de Suministros",
    "home-insurance": "Seguro de Hogar",
    "property-management": "Gestión de Propiedad (Property Management)",
  };


  // Función para detectar cambios en campos comparando con snapshot
  const detectFieldChanges = useCallback((sectionId: string, snapshot: Record<string, any> | null | undefined): boolean => {
    if (!snapshot || !localProperty) return false;
    
    const fields = SECTION_FIELDS_MAP[sectionId] || [];
    
    for (const field of fields) {
      const currentValue = localProperty[field as keyof typeof localProperty];
      const snapshotValue = snapshot[field];
      
      // Comparar valores
      if (field === "doc_renovation_files") {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const snapshotArray = Array.isArray(snapshotValue) ? snapshotValue : [];
        if (JSON.stringify(currentArray.sort()) !== JSON.stringify(snapshotArray.sort())) {
          return true; // Hay cambio
        }
      } else {
        const current = currentValue !== null && currentValue !== undefined ? currentValue : null;
        const snapshotVal = snapshotValue !== null && snapshotValue !== undefined ? snapshotValue : null;
        if (current !== snapshotVal) {
          return true; // Hay cambio
        }
      }
    }
    
    return false; // No hay cambios
  }, [localProperty]);

  // Helper para generar comentarios automáticos sobre campos faltantes
  // Genera texto profesional, explicativo y sencillo: "Falta [nombre del campo/documento]"
  // Una línea por cada campo/documento faltante
  const generateMissingFieldsComments = useCallback((sectionId: string, fields: string[]): string => {
    if (!localProperty) return "";
    
    const missingFields: string[] = [];
    
    fields.forEach((field) => {
      const value = localProperty[field as keyof typeof localProperty];
      let isEmpty = false;
      
      // Verificar si el campo está vacío según su tipo
      if (field === "doc_renovation_files") {
        isEmpty = !Array.isArray(value) || value.length === 0;
      } else if (field === "home_insurance_type" || field === "property_management_plan") {
        isEmpty = !value || value === "";
      } else {
        isEmpty = value === null || value === undefined || value === "";
      }
      
      if (isEmpty) {
        // Usar getFieldLabel para obtener el nombre profesional del campo/documento
        const fieldLabel = getFieldLabel(field);
        // Formato profesional: "Falta [nombre del campo/documento]"
        missingFields.push(`Falta ${fieldLabel}`);
      }
    });
    
    // Unir con saltos de línea: una línea por cada campo/documento faltante
    return missingFields.join("\n");
  }, [localProperty]);

  // Helper para crear snapshot de valores de campos de una sección
  const createSnapshot = useCallback((sectionId: string): Record<string, any> | null => {
    if (!localProperty) return null;
    
    const fields = SECTION_FIELDS_MAP[sectionId] || [];
    const snapshot: Record<string, any> = {};
    
    fields.forEach((field) => {
      const value = localProperty[field as keyof typeof localProperty];
      if (field === "doc_renovation_files") {
        snapshot[field] = Array.isArray(value) ? [...value] : null;
      } else {
        snapshot[field] = value !== null && value !== undefined ? value : null;
      }
    });
    
    return snapshot;
  }, [localProperty]);
  
  // Handler para cambiar el estado de revisión
  const handleReviewChange = useCallback((sectionId: string, isCorrect: boolean | null) => {
    setSectionReviews((prev) => {
      const prevReview = prev[sectionId];
      // hasIssue es histórico: se establece a true cuando isCorrect === false y nunca vuelve a false
      const currentHasIssue = prevReview?.hasIssue ?? false;
      const newHasIssue = currentHasIssue || isCorrect === false;
      
      // Si la respuesta es "No", pre-rellenar comentarios con campos faltantes y guardar snapshot
      let comments = prevReview?.comments ?? null;
      let snapshot = prevReview?.snapshot ?? null;
      
      if (isCorrect === false) {
        const fields = SECTION_FIELDS_MAP[sectionId] || [];
        const missingComments = generateMissingFieldsComments(sectionId, fields);
        
        // Si la sección fue reseteada (tiene submittedComments pero isCorrect era null),
        // permitir editar comentarios nuevos - NO usar submittedComments
        // Si hay comentarios previos editables (comments), mantenerlos
        // Si no hay comentarios editables, usar los generados automáticamente
        const wasReset = prevReview?.isCorrect === null && prevReview?.reviewed === false;
        
        if (wasReset) {
          // Sección fue reseteada y ahora se marca como "No" de nuevo
          // Usar comments editables (no submittedComments)
          if (prevReview?.comments && prevReview.comments.trim() !== "") {
            comments = prevReview.comments;
          } else {
            comments = missingComments || null;
          }
        } else {
          // Sección normal marcada como "No"
          if (prevReview?.comments && prevReview.comments.trim() !== "") {
            comments = prevReview.comments;
          } else {
            comments = missingComments || null;
          }
        }
        
        // Guardar snapshot de valores actuales cuando se marca como "No"
        // Crear nuevo snapshot con valores actuales
        snapshot = createSnapshot(sectionId);
      } else if (isCorrect === true) {
        // Si se marca como "Sí", limpiar snapshot (ya no es necesario)
        snapshot = null;
        // Mantener comments por si acaso se vuelve a marcar como "No"
      } else if (isCorrect === null) {
        // Si se resetea explícitamente (aunque esto no debería pasar desde el UI)
        comments = null;
        // Mantener snapshot si existe para detectar cambios futuros
      }
      
      const updated = {
        ...prev,
        [sectionId]: {
          reviewed: isCorrect !== null, // Si isCorrect es null, reviewed debe ser false
          isCorrect,
          comments,
          hasIssue: newHasIssue,
          snapshot,
          submittedComments: prevReview?.submittedComments ?? null, // Mantener submittedComments si existe (histórico)
        },
      };
      saveReviewState(updated);
      // Notificar al componente padre para actualizar el widget en tiempo real
      onSectionReviewsChange?.(updated);
      return updated;
    });
  }, [saveReviewState, onSectionReviewsChange, generateMissingFieldsComments, createSnapshot]);
  
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

  // Detectar cambios y resetear secciones actualizadas
  // IMPORTANTE: Detectar cambios inmediatamente cuando se actualizan campos,
  // no solo después de enviar comentarios, para que el kanban se actualice en tiempo real
  // También se ejecuta cuando se carga la página para detectar cambios hechos desde otros lugares
  useEffect(() => {
    if (!localProperty || !sectionReviews || Object.keys(sectionReviews).length === 0) return;
    
    const updatedReviews: PropheroSectionReviews = { ...sectionReviews };
    let hasChanges = false;
    
    // Verificar cada sección que tiene snapshot (fue marcada como "No")
    Object.entries(sectionReviews).forEach(([sectionId, review]) => {
      if (sectionId === '_meta') return;
      
      const sectionReview = review as PropheroSectionReview;
      
      // Verificar secciones que tienen snapshot (fueron marcadas como "No")
      // y que actualmente tienen isCorrect === false (estado "No")
      if (sectionReview.snapshot && sectionReview.isCorrect === false) {
        const hasFieldChanges = detectFieldChanges(sectionId, sectionReview.snapshot);
        
        if (hasFieldChanges) {
          // Resetear esta sección específica
          // IMPORTANTE: Cuando se resetea, el estado global debe cambiar a "Pendiente de revisión"
          updatedReviews[sectionId] = {
            ...sectionReview,
            isCorrect: null,
            reviewed: false, // Esto hará que getGlobalState retorne "Pendiente de revisión"
            comments: null, // Limpiar comentarios editables
            // Mantener submittedComments si existe (histórico)
            // Mantener snapshot para poder detectar cambios futuros si se marca como "No" de nuevo
            snapshot: sectionReview.snapshot, // Mantener snapshot para futuras comparaciones
          };
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setSectionReviews(updatedReviews);
      saveReviewState(updatedReviews);
      onSectionReviewsChange?.(updatedReviews);
    }
  }, [localProperty, sectionReviews, detectFieldChanges, saveReviewState, onSectionReviewsChange]);
  
  // Detectar cambios cuando se carga la propiedad desde Supabase (al recargar la página)
  // Esto detecta cambios que pudieron haber sido hechos desde otros lugares o sesiones
  useEffect(() => {
    if (!supabaseProperty || loading || !sectionReviews || Object.keys(sectionReviews).length === 0) {
      // Resetear el ref cuando no hay datos para permitir verificación en la próxima carga
      if (!supabaseProperty || loading) {
        hasCheckedChangesOnLoadRef.current = false;
      }
      return;
    }
    
    // Solo ejecutar una vez cuando se carga la propiedad inicialmente
    if (hasCheckedChangesOnLoadRef.current) return;
    
    // Pequeño delay para asegurar que localProperty se haya actualizado
    const timeoutId = setTimeout(() => {
      if (!localProperty) return;
      
      const updatedReviews: PropheroSectionReviews = { ...sectionReviews };
      let hasChanges = false;
      
      // Verificar cada sección que tiene snapshot y estado "No"
      Object.entries(sectionReviews).forEach(([sectionId, review]) => {
        if (sectionId === '_meta') return;
        
        const sectionReview = review as PropheroSectionReview;
        
        // Solo verificar secciones con estado "No" y snapshot
        if (sectionReview.snapshot && sectionReview.isCorrect === false) {
          const hasFieldChanges = detectFieldChanges(sectionId, sectionReview.snapshot);
          
          if (hasFieldChanges) {
            updatedReviews[sectionId] = {
              ...sectionReview,
              isCorrect: null,
              reviewed: false,
              comments: null,
              snapshot: sectionReview.snapshot,
            };
            hasChanges = true;
          }
        }
      });
      
      // Marcar como verificado independientemente de si hubo cambios
      hasCheckedChangesOnLoadRef.current = true;
      
      if (hasChanges) {
        setSectionReviews(updatedReviews);
        saveReviewState(updatedReviews);
        onSectionReviewsChange?.(updatedReviews);
      }
    }, 500); // Delay de 500ms para asegurar que localProperty esté actualizado
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [supabaseProperty, loading, localProperty, sectionReviews, detectFieldChanges, saveReviewState, onSectionReviewsChange]);
  
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

  // Función para determinar el estado global según las normas de Fase 1: Viviendas Prophero
  // Norma 1: Si hay isCorrect === null → "Pendiente de revisión"
  // Norma 2: Si todos tienen respuesta y hay algún isCorrect === false → "Pendiente de información"
  // Norma 3: Si hay NULL y NO → "Pendiente de revisión" (NULL tiene prioridad)
  const getGlobalState = useCallback((reviews: PropheroSectionReviews | null | undefined): "Pendiente de revisión" | "Pendiente de información" | null => {
    // Lista de todas las secciones requeridas de Prophero
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
    
    // Si no hay reviews, todas las secciones están en NULL → Pendiente de revisión
    if (!reviews) {
      return "Pendiente de revisión";
    }
    
    // Verificar cada sección requerida
    let hasNullSections = false;
    let hasNoSections = false;
    let allCorrect = true;
    
    for (const sectionId of requiredSectionIds) {
      const review = reviews[sectionId] as PropheroSectionReview | undefined;
      
      // Si la sección no existe o isCorrect es null → NULL (Pendiente de revisión)
      if (!review || review.isCorrect === null || review.isCorrect === undefined) {
        hasNullSections = true;
        allCorrect = false;
      } else if (review.isCorrect === false) {
        hasNoSections = true;
        allCorrect = false;
      } else if (review.isCorrect === true) {
        // Sección en "Sí", continuar verificando
      }
    }
    
    // Norma 1 y Norma 3: Si hay algún campo isCorrect === null → "Pendiente de revisión" (PRIORIDAD MÁXIMA)
    if (hasNullSections) {
      return "Pendiente de revisión";
    }
    
    // Si todas las secciones están en "Sí" → null (puede avanzar, Progreso General = 100%)
    if (allCorrect) {
      return null;
    }
    
    // Norma 2: Si no hay NULL y hay algún isCorrect === false → "Pendiente de información"
    if (hasNoSections) {
      return "Pendiente de información";
    }
    
    // Por defecto → Pendiente de revisión
    return "Pendiente de revisión";
  }, []);

  // Función de validación para el botón "Enviar comentarios"
  // Retorna si se puede enviar y un mensaje de error específico si no se cumple alguna condición
  const validateCanSubmitComments = useCallback((): { canSubmit: boolean; errorMessage?: string } => {
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
    
    // Verificar que todos los campos isCorrect estén completos (no null)
    const hasNullSections = requiredSectionIds.some((sectionId) => {
      const review = sectionReviews[sectionId];
      return !review || review.isCorrect === null;
    });
    
    // Verificar que todos los comentarios de secciones con "No" estén completos
    const hasNoSectionsWithEmptyComments = requiredSectionIds.some((sectionId) => {
      const review = sectionReviews[sectionId];
      if (review && review.isCorrect === false) {
        // Si la sección está marcada como "No", debe tener comentarios
        return !review.comments || review.comments.trim() === "";
      }
      return false;
    });
    
    // Generar mensaje de error específico
    if (hasNullSections && hasNoSectionsWithEmptyComments) {
      return {
        canSubmit: false,
        errorMessage: "No se pueden enviar comentarios. Faltan secciones por revisar y comentarios por completar."
      };
    }
    
    if (hasNullSections) {
      return {
        canSubmit: false,
        errorMessage: "No se pueden enviar comentarios. Faltan secciones por revisar."
      };
    }
    
    if (hasNoSectionsWithEmptyComments) {
      return {
        canSubmit: false,
        errorMessage: "No se pueden enviar comentarios. Faltan comentarios en las secciones marcadas como incorrectas."
      };
    }
    
    return { canSubmit: true };
  }, [sectionReviews]);

  // Verificar si todas las secciones tienen respuesta (isCorrect !== null)
  const canSubmitComments = useMemo(() => {
    return validateCanSubmitComments().canSubmit;
  }, [validateCanSubmitComments]);

  // Verificar si al menos una sección tiene respuesta "No"
  const hasAnySectionWithNo = useMemo(() => {
    return Object.values(sectionReviews).some((review: any) => {
      if (typeof review === 'object' && review !== null && 'isCorrect' in review) {
        return review.isCorrect === false;
      }
      return false;
    });
  }, [sectionReviews]);

  // Verificar si hay secciones con "No" que fueron actualizadas (tienen isCorrect === null después de tener submittedComments)
  const hasUpdatedSectionWithNo = useMemo(() => {
    const meta = sectionReviews._meta;
    if (meta?.commentsSubmitted !== true) return false;
    
    return Object.entries(sectionReviews).some(([sectionId, review]) => {
      if (sectionId === '_meta') return false;
      const sectionReview = review as PropheroSectionReview;
      // Sección fue actualizada si tiene submittedComments pero isCorrect === null
      return sectionReview.submittedComments && sectionReview.isCorrect === null;
    });
  }, [sectionReviews]);

  // Ya no bloqueamos secciones - siempre retornar false
  const allNoSectionsLocked = useMemo(() => {
    return false;
  }, []);

  // Lógica del botón "Enviar comentarios"
  // El botón debe aparecer cuando se detecten nuevos comentarios en las secciones de comentarios
  const showSubmitButton = useMemo(() => {
    // Si está enviando, mantener el estado actual para evitar parpadeo
    if (isSubmittingComments) {
      return true; // Mantener visible durante el envío
    }
    
    // Verificar si hay secciones con "No" (nuevos comentarios detectados)
    if (!hasAnySectionWithNo) return false;
    
    const meta = sectionReviews._meta;
    
    // Si no se han enviado comentarios, mostrar el botón
    if (!meta?.commentsSubmitted) {
      return true;
    }
    
    // CRÍTICO: Si todas las secciones con "No" están bloqueadas, NO mostrar el botón
    // Esto significa que los comentarios fueron enviados y no hay cambios detectados
    if (allNoSectionsLocked) {
      return false;
    }
    
    // Si se enviaron comentarios pero hay secciones desbloqueadas, verificar:
    // 1. Hay secciones actualizadas (isCorrect === null con submittedComments) que ahora están marcadas como "No"
    // 2. O hay secciones con "No" que no tienen submittedComments (nuevas secciones con "No")
    // 3. O hay secciones con "No" que tienen comentarios editados (comments diferentes de submittedComments)
    const hasNewNoSections = Object.entries(sectionReviews).some(([sectionId, review]) => {
      if (sectionId === '_meta') return false;
      const sectionReview = review as PropheroSectionReview;
      // Sección nueva con "No" (no tiene submittedComments)
      if (sectionReview.isCorrect === false && !sectionReview.submittedComments) {
        return true;
      }
      // Sección con "No" que tiene comentarios editados (comments diferentes de submittedComments)
      if (sectionReview.isCorrect === false && 
          sectionReview.comments && 
          sectionReview.submittedComments &&
          sectionReview.comments.trim() !== sectionReview.submittedComments.trim()) {
        return true;
      }
      return false;
    });
    
    // Solo mostrar si hay secciones actualizadas O nuevas secciones con "No" O comentarios editados
    return hasUpdatedSectionWithNo || hasNewNoSections;
  }, [hasAnySectionWithNo, sectionReviews, hasUpdatedSectionWithNo, allNoSectionsLocked, isSubmittingComments]);

  // Handler para enviar comentarios
  const handleSubmitComments = useCallback(async () => {
    if (!localProperty?.property_unique_id) return;
    
    // Prevenir múltiples envíos simultáneos
    if (isSubmittingComments) return;
    
    // Validar antes de enviar - mostrar toast de error si no se cumplen las condiciones
    const validation = validateCanSubmitComments();
    if (!validation.canSubmit) {
      toast.error(validation.errorMessage || "No se pueden enviar comentarios. Completa todas las secciones y comentarios requeridos.");
      return;
    }
    
    setIsSubmittingComments(true);
    
    try {
      const meta = sectionReviews._meta || {};
      const currentTimestamp = new Date().toISOString();
      
      // Crear entradas de historial para las secciones con comentarios
      const newHistoryEntries: CommentSubmissionHistoryEntry[] = [];
      
      const updatedReviews: PropheroSectionReviews = {
        ...sectionReviews,
        _meta: {
          ...meta,
          commentsSubmitted: true,
          commentsSubmittedAt: meta.commentsSubmittedAt || currentTimestamp, // Mantener primera fecha
          commentSubmissionHistory: meta.commentSubmissionHistory || [], // Inicializar si no existe
        },
      };
      
      // Copiar comments a submittedComments para cada sección con "No"
      // IMPORTANTE: Crear o mantener el snapshot (valores actuales cuando se envían comentarios)
      // El snapshot es necesario para detectar cambios futuros
      Object.entries(sectionReviews).forEach(([sectionId, review]) => {
        if (sectionId === '_meta') return;
        const sectionReview = review as PropheroSectionReview;
        if (sectionReview.isCorrect === false && sectionReview.comments) {
          // Crear snapshot si no existe (valores actuales cuando se envían comentarios)
          // Si ya existe, mantenerlo (fue creado cuando se marcó como "No")
          const snapshot = sectionReview.snapshot || createSnapshot(sectionId);
          
          updatedReviews[sectionId] = {
            ...sectionReview,
            submittedComments: sectionReview.comments,
            snapshot: snapshot, // Guardar snapshot para detectar cambios futuros
          };
          
          // Agregar al historial de envíos
          newHistoryEntries.push({
            sectionId,
            sectionTitle: SECTION_TITLES[sectionId] || sectionId,
            comments: sectionReview.comments,
            submittedAt: currentTimestamp,
            fieldValues: snapshot || {},
          });
        }
      });
      
      // Agregar nuevas entradas al historial
      if (newHistoryEntries.length > 0 && updatedReviews._meta) {
        updatedReviews._meta.commentSubmissionHistory = [
          ...(updatedReviews._meta.commentSubmissionHistory || []),
          ...newHistoryEntries,
        ];
      }
      
      await saveReviewState(updatedReviews);
      setSectionReviews(updatedReviews);
      // Notificar al componente padre
      onSectionReviewsChange?.(updatedReviews);
      
      // Colapsar todas las secciones y hacer scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log("Comentarios enviados correctamente. Historial actualizado:", newHistoryEntries);
    } catch (error) {
      console.error("Error al enviar comentarios:", error);
      toast.error("Error al enviar comentarios. Por favor, inténtalo de nuevo.");
    } finally {
      // Resetear el estado de envío después de un pequeño delay para evitar parpadeo
      setTimeout(() => {
        setIsSubmittingComments(false);
      }, 100);
    }
  }, [localProperty?.property_unique_id, sectionReviews, saveReviewState, onSectionReviewsChange, createSnapshot, validateCanSubmitComments, isSubmittingComments]);

  // Estado global actual
  const globalState = useMemo(() => {
    return getGlobalState(sectionReviews);
  }, [sectionReviews, getGlobalState]);

  // Refs para rastrear valores anteriores y evitar actualizaciones innecesarias
  const previousShowSubmitButtonRef = useRef<boolean>(false);
  const previousCanSubmitCommentsRef = useRef<boolean>(false);
  const previousHandleSubmitCommentsRef = useRef<(() => void) | null>(null);

  // Exponer funciones y estados al componente padre mediante refs
  // Solo actualizar cuando realmente cambien para evitar re-renderizados innecesarios
  useEffect(() => {
    if (onSubmitCommentsRef && previousHandleSubmitCommentsRef.current !== handleSubmitComments) {
      previousHandleSubmitCommentsRef.current = handleSubmitComments;
      onSubmitCommentsRef.current = handleSubmitComments;
    }
  }, [handleSubmitComments, onSubmitCommentsRef]);

  useEffect(() => {
    // Solo actualizar si el valor realmente cambió
    if (previousShowSubmitButtonRef.current !== showSubmitButton) {
      previousShowSubmitButtonRef.current = showSubmitButton;
      if (onHasAnySectionWithNoRef) {
        onHasAnySectionWithNoRef.current = showSubmitButton;
      }
      onHasAnySectionWithNoChange?.(showSubmitButton);
    }
  }, [showSubmitButton, onHasAnySectionWithNoRef, onHasAnySectionWithNoChange]);

  useEffect(() => {
    // Solo actualizar si el valor realmente cambió
    if (previousCanSubmitCommentsRef.current !== canSubmitComments) {
      previousCanSubmitCommentsRef.current = canSubmitComments;
      if (onCanSubmitCommentsRef) {
        onCanSubmitCommentsRef.current = canSubmitComments;
      }
      onCanSubmitCommentsChange?.(canSubmitComments);
    }
  }, [canSubmitComments, onCanSubmitCommentsRef, onCanSubmitCommentsChange]);

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

  // Render text field as card (similar to document pill)
  const renderTextFieldCard = (
    label: string,
    value: string | null | undefined,
    icon: React.ReactNode
  ) => {
    const hasValue = value && value.trim().length > 0;

    return (
      <div className="flex items-center justify-between p-4 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors bg-white dark:bg-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className={`text-sm font-semibold text-[#6B7280] dark:text-[#9CA3AF] ${!hasValue ? 'text-[#9CA3AF] dark:text-[#6B7280]' : ''}`}>
              {hasValue ? value : "No disponible"}
            </p>
          </div>
        </div>
      </div>
    );
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
        >
          <div className="space-y-2">
            {renderTextFieldCard(
              "Administrador de la propiedad",
              localProperty.admin_name,
              <User className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
            {renderTextFieldCard(
              "Localización de las llaves",
              localProperty.keys_location,
              <Key className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
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
        >
          <div className="space-y-2">
            {renderTextFieldCard(
              "Cuenta bancaria del propietario (IBAN)",
              localProperty.client_iban,
              <CreditCard className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
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
        >
          <div className="space-y-4">
            {renderTextFieldCard(
              "Tipo de Seguro de Hogar",
              localProperty.home_insurance_type,
              <Shield className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
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
        >
          <div className="space-y-4">
            {renderTextFieldCard(
              "Plan PM",
              localProperty.property_management_plan,
              <Briefcase className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
            {renderDocumentPill(
              DOCUMENT_LABELS.PROPERTY_MANAGEMENT_CONTRACT,
              localProperty.property_management_plan_contract_url,
              "property_management_plan_contract_url",
              "property-management"
            )}
            {renderTextFieldCard(
              "Property Manager asignado",
              localProperty.property_manager,
              <User className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            )}
          </div>
        </PropheroSectionWidget>
      </div>

      {/* Botón de envío de comentarios - solo visible si hay al menos una sección con "No" y se cumplen las condiciones */}
      {showSubmitButton && (
        <div className="pt-6 border-t">
          <Button
            onClick={handleSubmitComments}
            disabled={!canSubmitComments}
            className="w-full"
            variant="default"
          >
            Enviar comentarios
          </Button>
          {!canSubmitComments && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Completa la revisión de todas las secciones para poder enviar los comentarios
            </p>
          )}
        </div>
      )}
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
