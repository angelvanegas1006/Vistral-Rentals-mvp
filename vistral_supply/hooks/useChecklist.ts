"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChecklistData,
  ChecklistSection,
  ChecklistType,
  getChecklist,
  createChecklist,
  updateChecklistSection,
  saveChecklist,
} from "@/lib/supply-checklist-storage";
import {
  getCurrentPropertyChecklist,
  createPropertyChecklist,
  updatePropertyChecklist,
  checklistRowToChecklistData,
} from "@/lib/supply-checklist-supabase";
import { toast } from "sonner";

interface UseChecklistProps {
  propertyId: string;
  checklistType: ChecklistType;
  initialChecklist?: ChecklistData | null; // Optional initial checklist to avoid duplicate loading
  initialChecklistId?: string | null; // Optional cached checklist ID to avoid redundant queries
}

interface UseChecklistReturn {
  checklist: ChecklistData | null;
  isLoading: boolean;
  updateSection: (sectionId: string, sectionData: Partial<ChecklistSection>) => void;
  save: (options?: { skipAutoValidation?: boolean }) => Promise<void>;
  saveImmediate: (options?: { skipAutoValidation?: boolean }) => Promise<void>;
}

export function useChecklist({
  propertyId,
  checklistType,
  initialChecklist,
  initialChecklistId,
}: UseChecklistProps): UseChecklistReturn {
  const [checklist, setChecklist] = useState<ChecklistData | null>(initialChecklist ?? null);
  const [isLoading, setIsLoading] = useState(initialChecklist === undefined);
  const [checklistId, setChecklistId] = useState<string | null>(initialChecklistId ?? null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSectionsRef = useRef<Record<string, ChecklistSection> | null>(null);

  // Update checklist and ID when initialChecklist changes (from combined hook)
  useEffect(() => {
    if (initialChecklist !== undefined) {
      setChecklist(initialChecklist);
      setIsLoading(false);
    }
  }, [initialChecklist]);
  
  useEffect(() => {
    if (initialChecklistId !== undefined) {
      setChecklistId(initialChecklistId);
    }
  }, [initialChecklistId]);

  useEffect(() => {
    // Skip loading if we already have an initial checklist
    if (initialChecklist !== undefined || !propertyId) {
      if (!propertyId) {
        setIsLoading(false);
      }
      return;
    }

    const loadChecklist = async () => {
      setIsLoading(true);
      try {
        // Try to load from Supabase first
        const supabaseChecklist = await getCurrentPropertyChecklist(propertyId, checklistType);
        if (supabaseChecklist) {
          const checklistData = checklistRowToChecklistData(supabaseChecklist);
          
          // Normalize checklist sections - ensure required questions exist
          if (checklistData.sections["exteriores"]) {
            const exterioresSection = checklistData.sections["exteriores"];
            const questions = exterioresSection.questions || [];
            
            // Ensure "observaciones" question exists
            if (!questions.find(q => q.id === "observaciones")) {
              questions.push({ id: "observaciones", notes: "" });
              checklistData.sections["exteriores"] = {
                ...exterioresSection,
                questions,
              };
            }
          }
          
          setChecklist(checklistData);
          // Cache the checklist ID to avoid redundant queries
          setChecklistId(supabaseChecklist.id);
          // Also save to localStorage for offline support
          saveChecklist(checklistData);
          setIsLoading(false);
          return;
        }

        // Fallback to localStorage
        const existing = getChecklist(propertyId, checklistType);
        if (existing) {
          setChecklist(existing);
        } else {
          // Create new checklist with initial structure for all sections
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
      } catch (error) {
        console.error("Error loading checklist:", error);
        // Fallback to localStorage on error
        const existing = getChecklist(propertyId, checklistType);
        if (existing) {
          setChecklist(existing);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChecklist();
  }, [propertyId, checklistType]);

  const updateSection = useCallback(
    (sectionId: string, sectionData: Partial<ChecklistSection>) => {
      setChecklist((prevChecklist) => {
        if (!prevChecklist) {
          return null;
        }

        const currentSection = prevChecklist.sections[sectionId] || {};
        
        // Create a new section object to ensure React detects the change
        const updatedSection: ChecklistSection = {
          ...currentSection,
          ...sectionData,
        };

        // Ensure uploadZones is a new array reference with deep copies if it's being updated
        if (sectionData.uploadZones !== undefined) {
          updatedSection.uploadZones = sectionData.uploadZones.map(zone => ({
            ...zone,
            photos: zone.photos ? [...zone.photos] : [],
            videos: zone.videos ? [...zone.videos] : [],
          }));
        } else if (currentSection.uploadZones) {
          // If uploadZones is not being updated, preserve existing ones but create new array reference
          updatedSection.uploadZones = currentSection.uploadZones.map(zone => ({
            ...zone,
            photos: zone.photos ? [...zone.photos] : [],
            videos: zone.videos ? [...zone.videos] : [],
          }));
        }

        // Ensure dynamicItems is a new array reference if it's being updated
        // Also create deep copies of the objects inside the array to ensure React detects changes
        if (sectionData.dynamicItems !== undefined) {
          // Create deep copies of all objects in the array
          updatedSection.dynamicItems = sectionData.dynamicItems.map(item => ({
            ...item,
            carpentryItems: item.carpentryItems ? item.carpentryItems.map(cItem => ({ ...cItem })) : undefined,
            climatizationItems: item.climatizationItems ? item.climatizationItems.map(cItem => ({ ...cItem })) : undefined,
            questions: item.questions ? item.questions.map(q => ({ ...q })) : undefined,
            uploadZone: item.uploadZone ? { 
              ...item.uploadZone,
              photos: item.uploadZone.photos ? [...item.uploadZone.photos] : [],
              videos: item.uploadZone.videos ? [...item.uploadZone.videos] : [],
            } : undefined,
            mobiliario: item.mobiliario ? { ...item.mobiliario } : undefined,
          }));
        }

        const updatedSections = {
          ...prevChecklist.sections,
          [sectionId]: updatedSection,
        };

        const updatedChecklist: ChecklistData = {
          ...prevChecklist,
          sections: updatedSections,
        };

        // Persist to localStorage immediately (always fast)
        updateChecklistSection(propertyId, checklistType, sectionId, sectionData);
        
        // Store pending sections for debounced save
        pendingSectionsRef.current = updatedSections;
        
        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        // Debounce Supabase save: wait 2 seconds after last change
        if (propertyId) {
          debounceTimeoutRef.current = setTimeout(() => {
            const sectionsToSave = pendingSectionsRef.current;
            if (!sectionsToSave) return;
            
            // Use cached checklistId if available, otherwise fetch it
            if (checklistId) {
              // Update existing checklist using cached ID
              // Skip auto-validation for debounced saves to prevent timeouts
              updatePropertyChecklist(checklistId, {
                sections: sectionsToSave,
              }, { skipAutoValidation: true }).catch((error) => {
                console.error("Error updating checklist in Supabase:", error);
                // If update fails (e.g., checklist was deleted), reset cache
                setChecklistId(null);
              });
            } else {
              // Fetch checklist ID if not cached
              getCurrentPropertyChecklist(propertyId, checklistType)
                .then((supabaseChecklist) => {
                  if (supabaseChecklist) {
                    // Cache the ID for future updates
                    setChecklistId(supabaseChecklist.id);
                    // Update existing checklist
                    // Skip auto-validation for debounced saves to prevent timeouts
                    updatePropertyChecklist(supabaseChecklist.id, {
                      sections: sectionsToSave,
                    }, { skipAutoValidation: true }).catch((error) => {
                      console.error("Error updating checklist in Supabase:", error);
                    });
                  } else {
                    // Create new checklist if doesn't exist
                    createPropertyChecklist(propertyId, checklistType, sectionsToSave)
                      .then((newId) => {
                        // Cache the new ID
                        setChecklistId(newId);
                      })
                      .catch((error) => {
                        console.error("Error creating checklist in Supabase:", error);
                      });
                  }
                })
                .catch((error) => {
                  console.error("Error checking checklist in Supabase:", error);
                });
            }
            
            pendingSectionsRef.current = null;
          }, 2000); // 2 second debounce
        }
        
        return updatedChecklist;
      });
    },
    [propertyId, checklistType]
  );

  // Immediate save (used by handleSave button - no debounce)
  const saveImmediate = useCallback(async (options?: { skipAutoValidation?: boolean }) => {
    if (!checklist || !propertyId) return;
    
    // Cancel any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    pendingSectionsRef.current = null;
    
    // Save to localStorage
    saveChecklist(checklist);
    
    // Save to Supabase immediately
    try {
      // Use cached checklistId if available, otherwise fetch it
      let currentChecklistId = checklistId;
      
      if (!currentChecklistId) {
        const supabaseChecklist = await getCurrentPropertyChecklist(propertyId, checklistType);
        if (supabaseChecklist) {
          currentChecklistId = supabaseChecklist.id;
          setChecklistId(currentChecklistId);
        }
      }
      
      if (currentChecklistId) {
        // Update existing checklist
        await updatePropertyChecklist(currentChecklistId, {
          sections: checklist.sections,
          completedAt: checklist.completedAt,
        }, options);
      } else {
        // Create new checklist
        const newId = await createPropertyChecklist(
          propertyId,
          checklistType,
          checklist.sections,
          checklist.completedAt
        );
        setChecklistId(newId);
      }
    } catch (error: any) {
      console.error("Error saving checklist to Supabase:", error);
      // If save fails, reset cache in case checklist was deleted
      if (error?.message?.includes('not found') || error?.code === 'PGRST116') {
        setChecklistId(null);
      }
      throw error;
    }
  }, [checklist, propertyId, checklistType, checklistId]);

  // Regular save (with debounce handling)
  const save = useCallback(async (options?: { skipAutoValidation?: boolean }) => {
    // Cancel any pending debounced save and force immediate save
    return saveImmediate(options);
  }, [saveImmediate]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    checklist,
    isLoading,
    updateSection,
    save,
    saveImmediate,
  };
}
