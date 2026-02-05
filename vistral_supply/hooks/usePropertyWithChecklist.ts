"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useParams } from "next/navigation";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
  submitPropertyToReview,
  Property,
  PropertyData,
} from "@/lib/supply-property-storage";
import { getPropertyFromSupabase } from "@/lib/supply-property-supabase";
import { getCurrentPropertyChecklist, checklistRowToChecklistData } from "@/lib/supply-checklist-supabase";
import { ChecklistData, getChecklist, createChecklist, ChecklistType } from "@/lib/supply-checklist-storage";
import { calculateOverallProgress, getAllSectionsProgress, validateForSubmission } from "@/lib/supply-property-validation";
import { isDemoMode } from "@/lib/utils";

interface UsePropertyWithChecklistReturn {
  property: Property | null;
  checklist: ChecklistData | null;
  checklistId: string | null; // Cached checklist ID for faster updates
  isLoading: boolean;
  error: string | null;
  overallProgress: number;
  sectionsProgress: ReturnType<typeof getAllSectionsProgress>;
  canSubmit: boolean;
  updatePropertyData: (data: Partial<PropertyData>) => Promise<void>;
  saveProperty: () => Promise<void>;
  submitToReview: () => Promise<void>;
  deletePropertyById: () => Promise<void>;
}

/**
 * Hook combinado que carga property y checklist en paralelo para mejor rendimiento
 */
export function usePropertyWithChecklist(checklistType: ChecklistType = "supply_initial"): UsePropertyWithChecklistReturn {
  const paramsPromise = useParams();
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state - memoized for performance
  const propertyData = property?.data;
  const overallProgress = propertyData ? calculateOverallProgress(propertyData) : 0;
  const sectionsProgress = propertyData ? getAllSectionsProgress(propertyData) : [];
  const canSubmit = propertyData ? validateForSubmission(propertyData, false, checklist ?? undefined).isValid : false;

  // Data fetching - load property and checklist in parallel
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!params.id || typeof params.id !== "string") {
        throw new Error("Property ID is required");
      }

      const propertyId = params.id;

      // Load property and checklist in parallel for better performance
      if (!isDemoMode()) {
        try {
          const [propertyResult, checklistResult] = await Promise.allSettled([
            getPropertyFromSupabase(propertyId),
            getCurrentPropertyChecklist(propertyId, checklistType),
          ]);

          // Handle property result
          if (propertyResult.status === 'fulfilled' && propertyResult.value) {
            setProperty(propertyResult.value);
          } else {
            // Fallback to localStorage
            const localProperty = getPropertyById(propertyId);
            if (localProperty) {
              setProperty(localProperty);
            } else {
              throw new Error("Property not found");
            }
          }

          // Handle checklist result
          if (checklistResult.status === 'fulfilled' && checklistResult.value) {
            const supabaseChecklist = checklistResult.value;
            const checklistData = checklistRowToChecklistData(supabaseChecklist);
            
            // Cache the checklist ID for faster updates
            setChecklistId(supabaseChecklist.id);
            
            // Normalize checklist sections - ensure required questions exist
            if (checklistData.sections["exteriores"]) {
              const exterioresSection = checklistData.sections["exteriores"];
              const questions = exterioresSection.questions || [];
              
              if (!questions.find(q => q.id === "observaciones")) {
                questions.push({ id: "observaciones", notes: "" });
                checklistData.sections["exteriores"] = {
                  ...exterioresSection,
                  questions,
                };
              }
            }
            
            setChecklist(checklistData);
            // Also save to localStorage for offline support
            const { saveChecklist } = await import("@/lib/supply-checklist-storage");
            saveChecklist(checklistData);
          } else {
            // Fallback to localStorage
            const existing = getChecklist(propertyId, checklistType);
            if (existing) {
              setChecklist(existing);
            } else {
              // Create new checklist with initial structure
              const { createChecklist } = await import("@/lib/supply-checklist-storage");
              const newChecklist = createChecklist(propertyId, checklistType, {
                "entorno-zonas-comunes": {
                  id: "entorno-zonas-comunes",
                  uploadZones: [
                    { id: "portal", photos: [], videos: [] },
                    { id: "fachada", photos: [], videos: [] },
                    { id: "entorno", photos: [], videos: [] },
                  ],
                  questions: [
                    { id: "acceso-principal" },
                    { id: "acabados" },
                    { id: "comunicaciones" },
                    { id: "electricidad" },
                    { id: "carpinteria" },
                  ],
                },
                "estado-general": {
                  id: "estado-general",
                  uploadZones: [
                    { id: "perspectiva-general", photos: [], videos: [] },
                  ],
                  questions: [
                    { id: "acabados" },
                    { id: "electricidad" },
                  ],
                  climatizationItems: [
                    { id: "radiadores", cantidad: 0 },
                    { id: "split-ac", cantidad: 0 },
                    { id: "calentador-agua", cantidad: 0 },
                    { id: "calefaccion-conductos", cantidad: 0 },
                  ],
                },
                "entrada-pasillos": {
                  id: "entrada-pasillos",
                  uploadZones: [
                    { id: "cuadro-general-electrico", photos: [], videos: [] },
                    { id: "entrada-vivienda-pasillos", photos: [], videos: [] },
                  ],
                  questions: [
                    { id: "acabados" },
                    { id: "electricidad" },
                  ],
                  carpentryItems: [
                    { id: "ventanas", cantidad: 0 },
                    { id: "persianas", cantidad: 0 },
                    { id: "armarios", cantidad: 0 },
                  ],
                  climatizationItems: [
                    { id: "radiadores", cantidad: 0 },
                    { id: "split-ac", cantidad: 0 },
                  ],
                  mobiliario: {
                    existeMobiliario: false,
                  },
                },
                "habitaciones": {
                  id: "habitaciones",
                  dynamicItems: [],
                  dynamicCount: 0,
                },
                "salon": {
                  id: "salon",
                  questions: [],
                },
                "banos": {
                  id: "banos",
                  dynamicItems: [],
                  dynamicCount: 0,
                },
                "cocina": {
                  id: "cocina",
                  questions: [],
                },
                "exteriores": {
                  id: "exteriores",
                  questions: [
                    { id: "acabados-exteriores" },
                    { id: "observaciones", notes: "" },
                  ],
                },
              });
              setChecklist(newChecklist);
            }
          }
        } catch (supabaseError) {
          // Fallback to localStorage for both
          const localProperty = getPropertyById(propertyId);
          if (localProperty) {
            setProperty(localProperty);
          } else {
            throw new Error("Property not found");
          }
          
          const existing = getChecklist(propertyId, checklistType);
          if (existing) {
            setChecklist(existing);
          }
        }
      } else {
        // Demo mode: use localStorage only
        const localProperty = getPropertyById(propertyId);
        if (localProperty) {
          setProperty(localProperty);
        } else {
          throw new Error("Property not found");
        }
        
        const existing = getChecklist(propertyId, checklistType);
        if (existing) {
          setChecklist(existing);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load property";
      setError(errorMessage);
      console.error("[usePropertyWithChecklist] Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, checklistType]);

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const updatePropertyData = useCallback(async (data: Partial<PropertyData>) => {
    if (!property) return;

    try {
      const updatedProperty = {
        ...property,
        data: { ...property.data, ...data },
        lastSaved: new Date().toISOString(),
      };

      updateProperty(updatedProperty.id, updatedProperty);
      setProperty(updatedProperty);
    } catch (err) {
      console.error("Error updating property data:", err);
      throw err;
    }
  }, [property]);

  const saveProperty = useCallback(async () => {
    if (!property) return;

    try {
      const updatedProperty = {
        ...property,
        lastSaved: new Date().toISOString(),
      };

      updateProperty(updatedProperty.id, updatedProperty);
      setProperty(updatedProperty);
    } catch (err) {
      console.error("Error saving property:", err);
      throw err;
    }
  }, [property]);

  const submitToReview = useCallback(async () => {
    if (!property) return;

    try {
      // Update directly in Supabase for better performance
      if (!isDemoMode()) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { mapStageToSupplyPhase } = await import("@/lib/supply-property-supabase");
        
        const { error } = await supabase
          .from("properties")
          .update({
            status: "in-review",
            supply_phase: mapStageToSupplyPhase("in-review"),
            updated_at: new Date().toISOString(),
          })
          .eq("id", property.id);

        if (error) {
          console.error("[submitToReview] Error updating status:", error);
          throw new Error(`Error al actualizar estado: ${error.message}`);
        }
      }
      
      // Update local state
      submitPropertyToReview(property.id);
      const updatedProperty = getPropertyById(property.id);
      if (updatedProperty) {
        setProperty(updatedProperty);
      }
    } catch (err) {
      console.error("Error submitting property to review:", err);
      throw err;
    }
  }, [property]);

  const deletePropertyById = useCallback(async () => {
    if (!property) return;

    try {
      deleteProperty(property.id);
      setProperty(null);
    } catch (err) {
      console.error("Error deleting property:", err);
      throw err;
    }
  }, [property]);

  return {
    property,
    checklist,
    checklistId,
    isLoading,
    error,
    overallProgress,
    sectionsProgress,
    canSubmit,
    updatePropertyData,
    saveProperty,
    submitToReview,
    deletePropertyById,
  };
}
