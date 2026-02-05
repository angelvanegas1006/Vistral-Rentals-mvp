"use client";

import { useRouter, useParams } from "next/navigation";
import { useRef, startTransition, useEffect, useCallback, useMemo, useState, use } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplySidebar } from "@/components/supply/supply-sidebar";
import { EditSidebar } from "@/components/supply/property/edit-sidebar";
import { MobileSidebarMenu } from "@/components/supply/property/mobile-sidebar-menu";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Custom hooks
import { usePropertyWithChecklist } from "@/hooks/usePropertyWithChecklist";
import { usePropertyUIState } from "@/hooks/usePropertyUIState";
import { usePropertyValidation } from "@/hooks/usePropertyValidation";
import { PropertyData } from "@/lib/supply-property-storage";
import { validateForSubmission } from "@/lib/supply-property-validation";
import { useI18n } from "@/lib/i18n";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import { canEditProperty } from "@/lib/auth/permissions";
import { getPropertyWithUsers, savePropertyBasicData } from "@/lib/supply-property-supabase";
import { savePropertyOwners } from "@/lib/supply-owners-supabase";
import { savePropertyTenant } from "@/lib/supply-tenants-supabase";
import { createClient } from "@/lib/supabase/client";

// Section components
import { InfoPropiedadSection } from "@/components/supply/property/sections/info-propiedad-section";
import { InfoEconomicaSection } from "@/components/supply/property/sections/info-economica-section";
import { EstadoLegalSection } from "@/components/supply/property/sections/estado-legal-section";
import { DocumentacionSection } from "@/components/supply/property/sections/documentacion-section";
import { DatosVendedorSection } from "@/components/supply/property/sections/datos-vendedor-section";
import { DatosInquilinoSection } from "@/components/supply/property/sections/datos-inquilino-section";

// Checklist section components - will be imported from main project
// For now, we'll create placeholder imports that will be replaced when checklist sections are copied
import { EntornoZonasComunesSection } from "@/components/checklist/sections/entorno-zonas-comunes-section";
import { EstadoGeneralSection } from "@/components/checklist/sections/estado-general-section";
import { EntradaPasillosSection } from "@/components/checklist/sections/entrada-pasillos-section";
import { HabitacionesSection } from "@/components/checklist/sections/habitaciones-section";
import { SalonSection } from "@/components/checklist/sections/salon-section";
import { BanosSection } from "@/components/checklist/sections/banos-section";
import { CocinaSection } from "@/components/checklist/sections/cocina-section";
import { ExterioresSection } from "@/components/checklist/sections/exteriores-section";
import { useChecklist } from "@/hooks/useChecklist";
import { ChecklistCarpentryItem, ChecklistData } from "@/lib/supply-checklist-storage";

const CARPENTRY_ITEMS_SALON = [
  { id: "ventanas", translationKey: "ventanas" },
  { id: "persianas", translationKey: "persianas" },
  { id: "armarios", translationKey: "armarios" },
] as const;

const CLIMATIZATION_ITEMS_SALON = [
  { id: "radiadores", translationKey: "radiadores" },
  { id: "split-ac", translationKey: "splitAc" },
] as const;

const CARPENTRY_ITEMS_HABITACIONES = [
  { id: "ventanas", translationKey: "ventanas" },
  { id: "persianas", translationKey: "persianas" },
  { id: "armarios", translationKey: "armarios" },
] as const;

const CLIMATIZATION_ITEMS_HABITACIONES = [
  { id: "radiadores", translationKey: "radiadores" },
  { id: "split-ac", translationKey: "splitAc" },
] as const;

const CARPENTRY_ITEMS_BANOS = [
  { id: "ventanas", translationKey: "ventanas" },
  { id: "persianas", translationKey: "persianas" },
] as const;

export default function PropertyEditPage() {
  const router = useRouter();
  const paramsPromise = useParams();
  const params = paramsPromise instanceof Promise ? use(paramsPromise) : paramsPromise;
  const propertyIdFromParams = params.id as string;
  
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({});
  const { t } = useI18n();
  const { user, role, isLoading: authLoading } = useAppAuth();
  const [canEdit, setCanEdit] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Check permissions - optimized for admin users
  useEffect(() => {
    let isMounted = true;
    
    const checkPermissions = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!user || !propertyIdFromParams) {
        if (isMounted) {
          setCanEdit(false);
          setIsCheckingPermissions(false);
        }
        return;
      }

      // If role is not loaded yet, wait a bit more
      if (!role) {
        setTimeout(() => {
          if (isMounted && !role) {
            console.warn("[PropertyEditPage] Role still not loaded after timeout");
            setCanEdit(false);
            setIsCheckingPermissions(false);
          }
        }, 2000);
        return;
      }

      try {
        // For admin users, skip the expensive getPropertyWithUsers call
        // Admin can always edit, so we can check permissions faster
        const adminRoles = ["supply_admin", "supply_lead", "supply_analyst"];
        if (adminRoles.includes(role)) {
          if (isMounted) {
            setCanEdit(true);
            setIsCheckingPermissions(false);
          }
          return;
        }

        // For partners, we need to check if they created the property
        const propertyId = propertyIdFromParams;
        const propertyWithUsers = await getPropertyWithUsers(propertyId);
        if (!propertyWithUsers) {
          if (isMounted) setIsCheckingPermissions(false);
          return;
        }

        // Get created_by directly from Supabase
        const supabase = createClient();
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("created_by")
          .eq("id", propertyId)
          .single();

        if (propertyError) {
          console.error("[PropertyEditPage] Error fetching created_by:", propertyError);
        }

        const propertyRow = {
          id: propertyWithUsers.id,
          created_by: propertyData?.created_by || null,
        } as any;

        const hasPermission = canEditProperty(role, propertyRow, user.id);
        
        if (isMounted) {
          setCanEdit(hasPermission);

          if (!hasPermission) {
            toast.error("No tienes permisos para editar esta propiedad");
            router.push("/supply/kanban");
          }
        }
      } catch (error) {
        console.error("[PropertyEditPage] Error checking permissions:", error);
        if (isMounted) setCanEdit(false);
      } finally {
        if (isMounted) setIsCheckingPermissions(false);
      }
    };

    checkPermissions();
    
    return () => {
      isMounted = false;
    };
  }, [user, role, authLoading, router, propertyIdFromParams]);

  // Custom hooks - use combined hook for parallel loading
  const {
    property,
    checklist: checklistFromHook,
    checklistId: checklistIdFromHook,
    isLoading,
    error,
    updatePropertyData,
    saveProperty,
    submitToReview,
    deletePropertyById,
  } = usePropertyWithChecklist("supply_initial");

  // Debug logs - removed to reduce console noise

  // Get property data with fallback (memoized to recalculate when property changes)
  // MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const propertyData: PropertyData = useMemo(() => {
    if (!property) {
      return {
        tipoPropiedad: "Piso" as const,
        superficieConstruida: 0,
        superficieUtil: 0,
        anoConstruccion: 0,
        referenciaCatastral: "",
        orientacion: ["Norte"] as const,
        habitaciones: 0,
        banos: 0,
        plazasAparcamiento: 0,
        ascensor: false,
        balconTerraza: false,
        trastero: false,
        precioVenta: 0,
        gastosComunidad: 0,
        ibiAnual: 0,
        confirmacionGastosComunidad: false,
        confirmacionIBI: false,
        propiedadAlquilada: false,
        situacionInquilinos: "Los inquilinos permanecen" as const,
        comunidadPropietariosConstituida: false,
        edificioSeguroActivo: false,
        comercializaExclusiva: false,
        edificioITEfavorable: false,
        videoGeneral: [],
        notaSimpleRegistro: [],
        certificadoEnergetico: [],
      };
    }
    return property.data || {
      tipoPropiedad: property.propertyType,
      superficieConstruida: 0,
      superficieUtil: 0,
      anoConstruccion: 0,
      referenciaCatastral: "",
      orientacion: ["Norte"] as const,
      habitaciones: 0,
      banos: 0,
      plazasAparcamiento: 0,
      ascensor: false,
      balconTerraza: false,
      trastero: false,
      precioVenta: 0,
      gastosComunidad: 0,
      ibiAnual: 0,
      confirmacionGastosComunidad: false,
      confirmacionIBI: false,
      propiedadAlquilada: false,
      situacionInquilinos: "Los inquilinos permanecen" as const,
      comunidadPropietariosConstituida: false,
      edificioSeguroActivo: false,
      comercializaExclusiva: false,
      edificioITEfavorable: false,
      videoGeneral: [],
      notaSimpleRegistro: [],
      certificadoEnergetico: [],
    };
  }, [property]);

  const {
    activeSection,
    hasUnsavedChanges,
    showDeleteModal,
    isMobileMenuOpen,
    expandedGroups,
    showInquilino,
    setActiveSection,
    setHasUnsavedChanges,
    setShowDeleteModal,
    setIsMobileMenuOpen,
    toggleGroup,
    handleSectionClick,
    markAsChanged,
    markAsSaved,
  } = usePropertyUIState(propertyData);

  // State for mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // State for submit loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for save loading
  const [isSaving, setIsSaving] = useState(false);

  // Checklist hook - use checklist and ID from combined hook to avoid duplicate loading
  const { checklist, updateSection: updateChecklistSectionRaw, save: saveChecklist, saveImmediate: saveChecklistImmediate } = useChecklist({
    propertyId: property?.id || "",
    checklistType: "supply_initial",
    initialChecklist: checklistFromHook, // Use checklist from combined hook (loaded in parallel)
    initialChecklistId: checklistIdFromHook, // Use cached ID from combined hook
  });

  // Wrapper to mark as changed when checklist is updated
  const updateChecklistSection = useCallback((sectionId: string, sectionData: Partial<any>) => {
    updateChecklistSectionRaw(sectionId, sectionData);
    markAsChanged(); // Mark as changed when checklist is updated
  }, [updateChecklistSectionRaw, markAsChanged]);

  // Sync checklist dynamicCount with property data when property loads
  useEffect(() => {
    if (!checklist || !propertyData) return;
    
    const habitacionesCount = propertyData.habitaciones || 0;
    const banosCount = propertyData.banos || 0;
    
    const currentHabitacionesCount = checklist.sections["habitaciones"]?.dynamicCount ?? 0;
    const currentBanosCount = checklist.sections["banos"]?.dynamicCount ?? 0;
    
    // Only update if counts differ
    if (habitacionesCount !== currentHabitacionesCount) {
      let updatedItems = [...(checklist.sections["habitaciones"]?.dynamicItems || [])];
      
      if (habitacionesCount > currentHabitacionesCount) {
        // Add new bedrooms
        while (updatedItems.length < habitacionesCount) {
          const newIndex = updatedItems.length + 1;
          updatedItems.push({
            id: `habitacion-${newIndex}`,
            questions: [
              { id: "acabados" },
              { id: "electricidad" },
              { id: "puerta-entrada" },
            ],
            uploadZone: { id: `fotos-video-habitaciones-${newIndex}`, photos: [], videos: [] },
            carpentryItems: CARPENTRY_ITEMS_HABITACIONES.map(item => ({ id: item.id, cantidad: 0 })),
            climatizationItems: CLIMATIZATION_ITEMS_HABITACIONES.map(item => ({ id: item.id, cantidad: 0 })),
            mobiliario: { existeMobiliario: false },
          });
        }
      } else if (habitacionesCount < currentHabitacionesCount) {
        // Remove bedrooms
        updatedItems = updatedItems.slice(0, habitacionesCount);
      }
      
      updateChecklistSection("habitaciones", {
        dynamicCount: habitacionesCount,
        dynamicItems: updatedItems,
      });
    }
    
    if (banosCount !== currentBanosCount) {
      let updatedItems = [...(checklist.sections["banos"]?.dynamicItems || [])];
      
      if (banosCount > currentBanosCount) {
        // Add new bathrooms
        while (updatedItems.length < banosCount) {
          const newIndex = updatedItems.length + 1;
          updatedItems.push({
            id: `bano-${newIndex}`,
            questions: [
              { id: "acabados" },
              { id: "agua-drenaje" },
              { id: "sanitarios" },
              { id: "griferia-ducha" },
              { id: "puerta-entrada" },
              { id: "mobiliario" },
              { id: "ventilacion" },
            ],
            uploadZone: { id: `fotos-video-banos-${newIndex}`, photos: [], videos: [] },
            carpentryItems: CARPENTRY_ITEMS_BANOS.map(item => ({ id: item.id, cantidad: 0 })),
          });
        }
      } else if (banosCount < currentBanosCount) {
        // Remove bathrooms
        updatedItems = updatedItems.slice(0, banosCount);
      }
      
      updateChecklistSection("banos", {
        dynamicCount: banosCount,
        dynamicItems: updatedItems,
      });
    }
  }, [propertyData?.habitaciones, propertyData?.banos, checklist, updateChecklistSection]);

  const validation = usePropertyValidation(propertyData, showInquilino, checklist ?? undefined);
  
  // Use sectionsProgress from validation hook (includes showInquilino logic)
  const sectionsProgress = validation.sectionsProgress;
  const overallProgress = validation.overallProgress;
  const canSubmit = validation.canSubmit;

  // Event handlers - memoized to prevent unnecessary re-renders
  // ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS
  const handleDataUpdate = useCallback(async (updates: Partial<PropertyData>) => {
    try {
      await updatePropertyData(updates);
      markAsChanged();
      
      // Sync habitaciones and banos with checklist sections
      if (updates.habitaciones !== undefined && checklist) {
        const currentCount = checklist.sections["habitaciones"]?.dynamicCount ?? 0;
        const newCount = updates.habitaciones;
        if (currentCount !== newCount) {
          // Update checklist dynamicCount and dynamicItems
          let updatedItems = [...(checklist.sections["habitaciones"]?.dynamicItems || [])];
          
          if (newCount > currentCount) {
            // Add new bedrooms
            while (updatedItems.length < newCount) {
              const newIndex = updatedItems.length + 1;
              updatedItems.push({
                id: `habitacion-${newIndex}`,
                questions: [
                  { id: "acabados" },
                  { id: "electricidad" },
                  { id: "puerta-entrada" },
                ],
                uploadZone: { id: `fotos-video-habitaciones-${newIndex}`, photos: [], videos: [] },
                carpentryItems: CARPENTRY_ITEMS_HABITACIONES.map(item => ({ id: item.id, cantidad: 0 })),
                climatizationItems: CLIMATIZATION_ITEMS_HABITACIONES.map(item => ({ id: item.id, cantidad: 0 })),
                mobiliario: { existeMobiliario: false },
              });
            }
          } else if (newCount < currentCount) {
            // Remove bedrooms
            updatedItems = updatedItems.slice(0, newCount);
          }
          
          updateChecklistSection("habitaciones", {
            dynamicCount: newCount,
            dynamicItems: updatedItems,
          });
        }
      }
      
      if (updates.banos !== undefined && checklist) {
        const currentCount = checklist.sections["banos"]?.dynamicCount ?? 0;
        const newCount = updates.banos;
        if (currentCount !== newCount) {
          // Update checklist dynamicCount and dynamicItems
          let updatedItems = [...(checklist.sections["banos"]?.dynamicItems || [])];
          
          if (newCount > currentCount) {
            // Add new bathrooms
            while (updatedItems.length < newCount) {
              const newIndex = updatedItems.length + 1;
              updatedItems.push({
                id: `bano-${newIndex}`,
                questions: [
                  { id: "acabados" },
                  { id: "agua-drenaje" },
                  { id: "sanitarios" },
                  { id: "griferia-ducha" },
                  { id: "puerta-entrada" },
                  { id: "mobiliario" },
                  { id: "ventilacion" },
                ],
                uploadZone: { id: `fotos-video-banos-${newIndex}`, photos: [], videos: [] },
                carpentryItems: CARPENTRY_ITEMS_BANOS.map(item => ({ id: item.id, cantidad: 0 })),
              });
            }
          } else if (newCount < currentCount) {
            // Remove bathrooms
            updatedItems = updatedItems.slice(0, newCount);
          }
          
          updateChecklistSection("banos", {
            dynamicCount: newCount,
            dynamicItems: updatedItems,
          });
        }
      }
    } catch (err) {
      console.error("Error updating property data:", err);
      toast.error("Error al actualizar los datos");
    }
  }, [updatePropertyData, markAsChanged, checklist, updateChecklistSection]);

  // Scroll to active section effect
  useEffect(() => {
    const ref = sectionRefs.current[activeSection];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  // Show loading while checking permissions
  if (isCheckingPermissions) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--prophero-blue-600)] dark:border-[var(--prophero-blue-400)] mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have permission (will redirect)
  if (!canEdit) {
    if (!isCheckingPermissions) {
      // Only show message if we've finished checking permissions
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No tienes permisos para editar esta propiedad</p>
            <Button onClick={() => router.push("/supply/kanban")}>
              {t.messages.backToKanban}
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  // Error handling - NOW after all hooks
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t.messages.error}: {error}</p>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push("/supply/kanban");
                });
              }}
            >
              {t.messages.backToKanban}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--prophero-blue-600)] dark:border-[var(--prophero-blue-400)] mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">{t.messages.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t.messages.notFound}</p>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push("/supply/kanban");
                });
              }}
            >
              {t.messages.backToKanban}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!property || isSaving) return;
    
    setIsSaving(true);
    try {
      // Save to localStorage first (works even if Supabase is down)
      await saveProperty();
      
      // Save property, owners, tenant, and checklist to Supabase in parallel for better performance
      const savePromises: Promise<any>[] = [];
      
      // Save property data to Supabase
      savePromises.push(
        savePropertyBasicData(property.id, propertyData).catch((supabaseError: any) => {
          console.warn("[handleSave] Supabase save failed, but localStorage save succeeded:", supabaseError);
          // Continue even if Supabase fails - localStorage save already succeeded
        })
      );
      
      // Save property owners to Supabase
      if (propertyData.vendedores && propertyData.vendedores.length > 0) {
        savePromises.push(
          savePropertyOwners(property.id, propertyData.vendedores).catch((ownersError: any) => {
            console.warn("[handleSave] Owners Supabase save failed, but localStorage save succeeded:", ownersError);
            // Continue even if Supabase fails - localStorage save already succeeded
          })
        );
      }
      
      // Save tenant to Supabase if exists
      if (propertyData.inquilino) {
        savePromises.push(
          savePropertyTenant(property.id, propertyData.inquilino).catch((tenantError: any) => {
            console.warn("[handleSave] Tenant Supabase save failed, but localStorage save succeeded:", tenantError);
            // Continue even if Supabase fails - localStorage save already succeeded
          })
        );
      }
      
      // Save checklist to Supabase if it exists (use saveImmediate to bypass debounce)
      if (checklist !== null && checklist !== undefined) {
        savePromises.push(
          saveChecklistImmediate().catch((checklistError: any) => {
            console.warn("[handleSave] Checklist Supabase save failed, but localStorage save succeeded:", checklistError);
            // Continue even if Supabase fails - localStorage save already succeeded
          })
        );
      }
      
      // Wait for all saves to complete (or fail gracefully)
      await Promise.allSettled(savePromises);
      
      markAsSaved();
      toast.success(t.messages.saveSuccess);
    } catch (err: any) {
      console.error("Error saving property:", err);
      const errorMessage = err?.message || t.messages.saveError;
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate property and checklist
    const validationResult = validateForSubmission(propertyData, showInquilino, checklist ?? undefined);
    
    if (!validationResult.isValid) {
      // Build error message with missing fields and sections
      const errorMessages: string[] = [];
      
      if (validationResult.missingFields && validationResult.missingFields.length > 0) {
        errorMessages.push(`Campos faltantes: ${validationResult.missingFields.join(", ")}`);
      }
      
      if (validationResult.missingSections && validationResult.missingSections.length > 0) {
        errorMessages.push(`Secciones del checklist incompletas: ${validationResult.missingSections.join(", ")}`);
      }
      
      toast.error(errorMessages.join("\n") || t.messages.completeRequiredFields);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save checklist first if there are unsaved changes (skip auto-validation since we're submitting explicitly)
      if (hasUnsavedChanges && checklist) {
        await saveChecklistImmediate({ skipAutoValidation: true });
      }
      
      // Then submit to review
      await submitToReview();
      toast.success(t.messages.submitSuccess);
      startTransition(() => {
        router.push(`/supply/property/${property.id}`);
      });
    } catch (err) {
      console.error("Error submitting property:", err);
      const errorMessage = err instanceof Error ? err.message : t.messages.submitError;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePropertyById();
      startTransition(() => {
        router.push("/supply/kanban");
      });
    } catch (err) {
      console.error("Error deleting property:", err);
      toast.error(t.messages.deleteConfirm);
    }
  };

  const formatAddress = () => {
    // Split address into main part and auxiliary parts
    const addressParts = property.fullAddress.split(',');
    const mainAddress = addressParts[0] || property.fullAddress;
    const cityAndPostal = addressParts.slice(1).join(',').trim();
    
    // Build auxiliary parts
    const auxiliaryParts = [
      property.planta && `Ptl. ${property.planta}`,
      property.puerta && `Pt. ${property.puerta}`,
      property.bloque && `Bloque ${property.bloque}`,
      property.escalera && `Escalera ${property.escalera}`,
    ].filter(Boolean);
    
    // Combine auxiliary parts with city/postal
    const secondaryLine = [
      ...auxiliaryParts,
      cityAndPostal,
    ].filter(Boolean).join(' · ');
    
    return {
      main: mainAddress,
      secondary: secondaryLine,
    };
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "info-propiedad":
        return (
          <InfoPropiedadSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            onContinue={() => handleSectionClick("info-economica")}
            ref={(el) => {
              if (el) sectionRefs.current["info-propiedad"] = el;
            }}
          />
        );
      case "info-economica":
        return (
          <InfoEconomicaSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            onContinue={() => handleSectionClick("estado-legal")}
            ref={(el) => {
              if (el) sectionRefs.current["info-economica"] = el;
            }}
          />
        );
      case "estado-legal":
        return (
          <EstadoLegalSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            onContinue={() => handleSectionClick("documentacion")}
            ref={(el) => {
              if (el) sectionRefs.current["estado-legal"] = el;
            }}
          />
        );
      case "documentacion":
        return (
          <DocumentacionSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["documentacion"] = el;
            }}
          />
        );
      case "datos-vendedor":
        return (
          <DatosVendedorSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["datos-vendedor"] = el;
            }}
          />
        );
      case "datos-inquilino":
        if (!showInquilino) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">
                {t.sectionMessages.tenantSectionUnavailable}
              </p>
            </div>
          );
        }
        return (
          <DatosInquilinoSection
            data={propertyData}
            onUpdate={handleDataUpdate}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["datos-inquilino"] = el;
            }}
          />
        );
      case "checklist-entorno-zonas-comunes":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <EntornoZonasComunesSection
            section={checklist.sections["entorno-zonas-comunes"] || {
              id: "entorno-zonas-comunes",
              uploadZones: [],
              questions: [],
            }}
            onUpdate={(updates) => {
              updateChecklistSection("entorno-zonas-comunes", updates);
            }}
            onContinue={() => handleSectionClick("checklist-estado-general")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-entorno-zonas-comunes"] = el;
            }}
          />
        );
      case "checklist-estado-general":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <EstadoGeneralSection
            section={checklist.sections["estado-general"] || {
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
            }}
            onUpdate={(updates) => {
              updateChecklistSection("estado-general", updates);
            }}
            onContinue={() => handleSectionClick("checklist-entrada-pasillos")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-estado-general"] = el;
            }}
          />
        );
      case "checklist-entrada-pasillos":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <EntradaPasillosSection
            section={checklist.sections["entrada-pasillos"] || {
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
            }}
            onUpdate={(updates) => {
              updateChecklistSection("entrada-pasillos", updates);
            }}
            onContinue={() => handleSectionClick("checklist-habitaciones")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-entrada-pasillos"] = el;
            }}
          />
        );
      case "checklist-habitaciones":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        const habitacionesSectionRaw = checklist.sections["habitaciones"] || {
          id: "habitaciones",
          dynamicItems: [],
          dynamicCount: propertyData?.habitaciones || 0,
        };
        const habitacionesSection = habitacionesSectionRaw.dynamicItems 
          ? {
              ...habitacionesSectionRaw,
              dynamicItems: JSON.parse(JSON.stringify(habitacionesSectionRaw.dynamicItems)),
            }
          : {
              ...habitacionesSectionRaw,
              dynamicItems: [],
            };
        
        return (
          <HabitacionesSection
            section={habitacionesSection}
            onUpdate={(updates) => {
              updateChecklistSection("habitaciones", updates);
            }}
            onPropertyUpdate={(updates) => {
              updatePropertyData(updates);
            }}
            onNavigateToHabitacion={(index) => {
              handleSectionClick(`checklist-habitaciones-${index + 1}`);
            }}
            onContinue={() => handleSectionClick("checklist-salon")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-habitaciones"] = el;
            }}
          />
        );
      case "checklist-salon":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <SalonSection
            section={checklist.sections["salon"] || {
              id: "salon",
              uploadZones: [{ id: "fotos-video-salon", photos: [], videos: [] }],
              questions: [
                { id: "acabados" },
                { id: "electricidad" },
                { id: "puerta-entrada" },
              ],
              carpentryItems: CARPENTRY_ITEMS_SALON.map(item => ({ id: item.id, cantidad: 0 })),
              climatizationItems: CLIMATIZATION_ITEMS_SALON.map(item => ({ id: item.id, cantidad: 0 })),
              mobiliario: { existeMobiliario: false },
            }}
            onUpdate={(updates) => {
              updateChecklistSection("salon", updates);
            }}
            onContinue={() => handleSectionClick("checklist-banos")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-salon"] = el;
            }}
          />
        );
      case "checklist-banos":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        const banosSectionRaw = checklist.sections["banos"] || {
          id: "banos",
          dynamicItems: [],
          dynamicCount: propertyData?.banos || 0,
        };
        const banosSection = banosSectionRaw.dynamicItems 
          ? {
              ...banosSectionRaw,
              dynamicItems: JSON.parse(JSON.stringify(banosSectionRaw.dynamicItems)),
            }
          : {
              ...banosSectionRaw,
              dynamicItems: [],
            };
        
        return (
          <BanosSection
            section={banosSection}
            onUpdate={(updates) => {
              updateChecklistSection("banos", updates);
            }}
            onPropertyUpdate={(updates) => {
              updatePropertyData(updates);
            }}
            onNavigateToBano={(index) => {
              handleSectionClick(`checklist-banos-${index + 1}`);
            }}
            onContinue={() => handleSectionClick("checklist-cocina")}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-banos"] = el;
            }}
          />
        );
      case "checklist-cocina":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <CocinaSection
            section={checklist.sections["cocina"] || {
              id: "cocina",
              uploadZones: [{ id: "fotos-video-cocina", photos: [], videos: [] }],
              questions: [
                { id: "acabados" },
                { id: "mobiliario-fijo" },
                { id: "agua-drenaje" },
              ],
              carpentryItems: [
                { id: "ventanas", cantidad: 0 },
                { id: "persianas", cantidad: 0 },
                { id: "puerta-entrada", cantidad: 0 },
              ],
              storageItems: [
                { id: "armarios-despensa", cantidad: 0 },
                { id: "cuarto-lavado", cantidad: 0 },
              ],
              appliancesItems: [
                { id: "placa-gas", cantidad: 0 },
                { id: "placa-vitro-induccion", cantidad: 0 },
                { id: "campana-extractora", cantidad: 0 },
                { id: "horno", cantidad: 0 },
                { id: "nevera", cantidad: 0 },
                { id: "lavadora", cantidad: 0 },
                { id: "lavavajillas", cantidad: 0 },
                { id: "microondas", cantidad: 0 },
              ],
            }}
            onUpdate={(updates) => {
              updateChecklistSection("cocina", updates);
            }}
            onContinue={() => handleSectionClick("checklist-exteriores")}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-cocina"] = el;
            }}
          />
        );
      case "checklist-exteriores":
        if (!checklist) {
          return (
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <p className="text-muted-foreground">Cargando checklist...</p>
            </div>
          );
        }
        return (
          <ExterioresSection
            section={checklist.sections["exteriores"] || {
              id: "exteriores",
              uploadZones: [{ id: "fotos-video-exterior", photos: [], videos: [] }],
              questions: [
                { id: "acabados-exteriores" },
                { id: "observaciones", notes: "" },
              ],
              securityItems: [
                { id: "barandillas", cantidad: 0 },
                { id: "rejas", cantidad: 0 },
              ],
              systemsItems: [
                { id: "tendedero-exterior", cantidad: 0 },
                { id: "toldos", cantidad: 0 },
              ],
            }}
            onUpdate={(updates) => {
              updateChecklistSection("exteriores", updates);
            }}
            propertyId={property?.id}
            ref={(el) => {
              if (el) sectionRefs.current["checklist-exteriores"] = el;
            }}
          />
        );
      default:
        // Handle individual bathroom cases (checklist-banos-1, checklist-banos-2, etc.)
        if (activeSection.startsWith("checklist-banos-")) {
          const banoNumber = parseInt(activeSection.replace("checklist-banos-", ""));
          if (!isNaN(banoNumber) && banoNumber > 0) {
            const banoIndex = banoNumber - 1;
            if (!checklist) {
              return (
                <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
                  <p className="text-muted-foreground">Cargando checklist...</p>
                </div>
              );
            }
            const banosSectionRaw = checklist.sections["banos"] || {
              id: "banos",
              dynamicItems: [],
              dynamicCount: propertyData?.banos || 0,
            };
            const banosSection = banosSectionRaw.dynamicItems 
              ? {
                  ...banosSectionRaw,
                  dynamicItems: JSON.parse(JSON.stringify(banosSectionRaw.dynamicItems)),
                }
              : {
                  ...banosSectionRaw,
                  dynamicItems: [],
                };
            
            const dynamicItems = banosSection.dynamicItems || [];
            if (banoIndex >= dynamicItems.length) {
              const updatedItems = [...dynamicItems];
              while (updatedItems.length <= banoIndex) {
                updatedItems.push({
                  id: `bano-${updatedItems.length + 1}`,
                  questions: [
                    { id: "acabados" },
                    { id: "agua-drenaje" },
                    { id: "sanitarios" },
                    { id: "griferia-ducha" },
                    { id: "puerta-entrada" },
                    { id: "mobiliario" },
                    { id: "ventilacion" },
                  ],
                  uploadZone: { id: "fotos-video", photos: [], videos: [] },
                  carpentryItems: [
                    { id: "ventanas", cantidad: 0 },
                    { id: "persianas", cantidad: 0 },
                  ],
                });
              }
              banosSection.dynamicItems = updatedItems;
              banosSection.dynamicCount = Math.max(banosSection.dynamicCount || 0, updatedItems.length);
              updateChecklistSection("banos", banosSection);
            }
            
            return (
              <BanosSection
                section={banosSection}
                onUpdate={(updates) => {
                  updateChecklistSection("banos", updates);
                }}
                banoIndex={banoIndex}
                onNavigateToBano={(index) => {
                  handleSectionClick(`checklist-banos-${index + 1}`);
                }}
                onContinue={() => {
                  if (banoIndex < (banosSection.dynamicCount || 0) - 1) {
                    handleSectionClick(`checklist-banos-${banoIndex + 2}`);
                  } else {
                    handleSectionClick("checklist-cocina");
                  }
                }}
                ref={(el) => {
                  if (el) sectionRefs.current[activeSection] = el;
                }}
              />
            );
          }
        }
        // Handle individual bedroom cases (checklist-habitaciones-1, checklist-habitaciones-2, etc.)
        if (activeSection.startsWith("checklist-habitaciones-")) {
          const habitacionNumber = parseInt(activeSection.replace("checklist-habitaciones-", ""));
          if (!isNaN(habitacionNumber) && habitacionNumber > 0) {
            const habitacionIndex = habitacionNumber - 1;
            if (!checklist) {
              return (
                <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
                  <p className="text-muted-foreground">Cargando checklist...</p>
                </div>
              );
            }
            const habitacionesSectionRaw = checklist.sections["habitaciones"] || {
              id: "habitaciones",
              dynamicItems: [],
              dynamicCount: propertyData?.habitaciones || 0,
            };
            const habitacionesSection = habitacionesSectionRaw.dynamicItems 
              ? {
                  ...habitacionesSectionRaw,
                  dynamicItems: JSON.parse(JSON.stringify(habitacionesSectionRaw.dynamicItems)),
                }
              : {
                  ...habitacionesSectionRaw,
                  dynamicItems: [],
                };
            
            const dynamicItems = habitacionesSection.dynamicItems || [];
            if (habitacionIndex >= dynamicItems.length) {
              const updatedItems = [...dynamicItems];
              while (updatedItems.length <= habitacionIndex) {
                updatedItems.push({
                  id: `habitacion-${updatedItems.length + 1}`,
                  questions: [
                    { id: "acabados" },
                    { id: "electricidad" },
                    { id: "puerta-entrada" },
                  ],
                  uploadZone: { id: "fotos-video", photos: [], videos: [] },
                  carpentryItems: [
                    { id: "ventanas", cantidad: 0 },
                    { id: "persianas", cantidad: 0 },
                    { id: "armarios", cantidad: 0 },
                  ],
                  climatizationItems: [
                    { id: "radiadores", cantidad: 0 },
                    { id: "split-ac", cantidad: 0 },
                  ],
                  mobiliario: { existeMobiliario: false },
                });
              }
              updateChecklistSection("habitaciones", { dynamicItems: updatedItems });
            }
            
            return (
              <HabitacionesSection
                section={habitacionesSection}
                onUpdate={(updates) => {
                  updateChecklistSection("habitaciones", updates);
                }}
                habitacionIndex={habitacionIndex}
                onNavigateToHabitacion={(index) => {
                  handleSectionClick(`checklist-habitaciones-${index + 1}`);
                }}
                onContinue={() => {
                  if (habitacionIndex < (propertyData?.habitaciones || 0) - 1) {
                    handleSectionClick(`checklist-habitaciones-${habitacionIndex + 2}`);
                  } else {
                    handleSectionClick("checklist-salon");
                  }
                }}
                ref={(el) => {
                  if (el) sectionRefs.current[activeSection] = el;
                }}
              />
            );
          }
        }
        return (
          <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
            <p className="text-muted-foreground">
              {t.sectionMessages.sectionInDevelopment}: {activeSection}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Desktop Header - Full width, above everything */}
      <div className="hidden md:flex bg-card dark:bg-[var(--prophero-gray-900)] border-b px-6 py-4 items-center justify-between flex-shrink-0 w-full">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                router.push("/supply/kanban");
              });
            }}
            className="flex items-center gap-2 text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="currentColor"/>
            </svg>
            {t.messages.backToKanban}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.checklist?.submitting || "Guardando..."}
              </>
            ) : (
              t.property.save
            )}
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-6 py-2 h-9 bg-[#2050F6] hover:bg-[#1A42E0] text-white rounded-full font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
{t.checklist?.submitting || "Submitting..."}
              </>
            ) : (
              t.property.submitReview
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area - Below header */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Edit Sidebar - Below header */}
        <div className="hidden md:flex flex-col h-full w-80 border-r bg-card dark:bg-[var(--prophero-gray-900)]">
          <EditSidebar
            address={formatAddress()}
            overallProgress={overallProgress}
            sections={sectionsProgress}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            onSave={handleSave}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            canSubmit={canSubmit}
            hasUnsavedChanges={hasUnsavedChanges}
            showInquilino={showInquilino}
            habitacionesCount={checklist?.sections?.["habitaciones"]?.dynamicCount ?? propertyData?.habitaciones ?? 0}
            banosCount={checklist?.sections?.["banos"]?.dynamicCount ?? propertyData?.banos ?? 0}
            checklist={checklist ?? undefined}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-card dark:bg-[var(--prophero-gray-900)] border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  startTransition(() => {
                    router.push("/supply/kanban");
                  });
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[var(--prophero-blue-100)] dark:bg-[var(--prophero-blue-900)] rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)]">
                    {Math.round(overallProgress)}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formatAddress().main}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAddress().secondary || `ID: ${property.id}`}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)] p-4 md:p-6">
            {renderActiveSection()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <MobileSidebarMenu
        isOpen={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        address={formatAddress()}
        overallProgress={overallProgress}
        sections={sectionsProgress}
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        canSubmit={canSubmit}
        hasUnsavedChanges={hasUnsavedChanges}
        showInquilino={showInquilino}
        habitacionesCount={checklist?.sections?.["habitaciones"]?.dynamicCount ?? propertyData?.habitaciones ?? 0}
        banosCount={checklist?.sections?.["banos"]?.dynamicCount ?? propertyData?.banos ?? 0}
        checklist={checklist}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.messages.deleteConfirm}</DialogTitle>
            <DialogDescription>
              {t.messages.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
