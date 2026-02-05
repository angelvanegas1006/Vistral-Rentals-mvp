"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { ChecklistSection, ChecklistCarpentryItem, ChecklistStorageItem, ChecklistApplianceItem, ChecklistStatus, ChecklistQuestion, ChecklistUploadZone, FileUpload } from "@/lib/supply-checklist-storage";
import { ChecklistQuestion as ChecklistQuestionComponent } from "../checklist-question";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "../checklist-upload-zone";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ThumbsUp, Wrench, ThumbsDown, XCircle } from "lucide-react";

interface CocinaSectionProps {
  section: ChecklistSection;
  onUpdate: (updates: Partial<ChecklistSection>) => void;
  onContinue?: () => void;
  hasError?: boolean;
  propertyId?: string; // Property ID for organizing files in Storage
}

const CARPENTRY_ITEMS = [
  { id: "ventanas", translationKey: "ventanas" },
  { id: "persianas", translationKey: "persianas" },
] as const;

const STORAGE_ITEMS = [
  { id: "armarios-despensa", translationKey: "armariosDespensa" },
  { id: "cuarto-lavado", translationKey: "cuartoLavado" },
] as const;

const APPLIANCES_ITEMS = [
  { id: "placa-gas", translationKey: "placaGas" },
  { id: "placa-vitro-induccion", translationKey: "placaVitroInduccion" },
  { id: "campana-extractora", translationKey: "campanaExtractora" },
  { id: "horno", translationKey: "horno" },
  { id: "nevera", translationKey: "nevera" },
  { id: "lavadora", translationKey: "lavadora" },
  { id: "lavavajillas", translationKey: "lavavajillas" },
  { id: "microondas", translationKey: "microondas" },
] as const;

const MAX_QUANTITY = 20;

export const CocinaSection = forwardRef<HTMLDivElement, CocinaSectionProps>(
  ({ section, onUpdate, onContinue, hasError = false, propertyId }, ref) => {
    const { t } = useI18n();

    // Initialize upload zone for kitchen photos/video
    const uploadZone = section.uploadZones?.[0] || { id: "fotos-video-cocina", photos: [], videos: [] };

    // Default questions for initialization
    const defaultQuestions = [
      { id: "acabados" },
      { id: "mobiliario-fijo" },
      { id: "agua-drenaje" },
      { id: "puerta-entrada" },
    ];

    // Always use section.questions if available and not empty, otherwise use defaults
    const questions = (section.questions && section.questions.length > 0) ? section.questions : defaultQuestions;

    // Initialize carpentry items - always use section directly, don't memoize
    const carpentryItems = section.carpentryItems && section.carpentryItems.length > 0
      ? section.carpentryItems
      : CARPENTRY_ITEMS.map(item => ({
          id: item.id,
          cantidad: 0,
        }));

    // Initialize storage items - always use section directly, don't memoize
    const storageItems = section.storageItems && section.storageItems.length > 0
      ? section.storageItems
      : STORAGE_ITEMS.map(item => ({
          id: item.id,
          cantidad: 0,
        }));

    // Initialize appliances items - always use section directly, don't memoize
    const appliancesItems = section.appliancesItems && section.appliancesItems.length > 0
      ? section.appliancesItems
      : APPLIANCES_ITEMS.map(item => ({
          id: item.id,
          cantidad: 0,
        }));

    const STATUS_OPTIONS: Array<{
      value: ChecklistStatus;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = useMemo(() => [
      { value: "buen_estado", label: t.checklist.buenEstado, icon: ThumbsUp },
      { value: "necesita_reparacion", label: t.checklist.necesitaReparacion, icon: Wrench },
      { value: "necesita_reemplazo", label: t.checklist.necesitaReemplazo, icon: ThumbsDown },
      { value: "no_aplica", label: t.checklist.noAplica, icon: XCircle },
    ], [t]);

    // Handlers
    const handleUploadZoneUpdate = useCallback((updates: ChecklistUploadZone) => {
      // Create new references for arrays to ensure React detects changes
      const updatedZones = [{
        ...updates,
        photos: updates.photos ? [...updates.photos] : [],
        videos: updates.videos ? [...updates.videos] : [],
      }];
      onUpdate({ uploadZones: updatedZones });
    }, [onUpdate]);

    const handleQuestionUpdate = useCallback((questionId: string, updates: Partial<ChecklistQuestion>) => {
      const currentQuestions = (section.questions && section.questions.length > 0) ? section.questions : defaultQuestions;
      const updatedQuestions = currentQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      if (!currentQuestions.find(q => q.id === questionId)) {
        updatedQuestions.push({ id: questionId, ...updates });
      }
      onUpdate({ questions: updatedQuestions });
    }, [section.questions, defaultQuestions, onUpdate]);

    // Generic handler for quantity changes (works for carpentry, storage, appliances)
    const handleQuantityChange = useCallback((
      itemId: string,
      delta: number,
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems"
    ) => {
      // Always get the latest items directly from section and clone to avoid mutations
      const currentItems = (() => {
        if (itemsKey === "carpentryItems") {
          return (section.carpentryItems && section.carpentryItems.length > 0)
            ? [...section.carpentryItems] // Clonar array para evitar mutaciones
            : [...carpentryItems];
        } else if (itemsKey === "storageItems") {
          return (section.storageItems && section.storageItems.length > 0)
            ? [...section.storageItems] // Clonar array para evitar mutaciones
            : [...storageItems];
        } else if (itemsKey === "appliancesItems") {
          return (section.appliancesItems && section.appliancesItems.length > 0)
            ? [...section.appliancesItems] // Clonar array para evitar mutaciones
            : [...appliancesItems];
        }
        return [];
      })();

      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const currentCantidad = item.cantidad || 0;
          const newCantidad = Math.max(0, Math.min(MAX_QUANTITY, currentCantidad + delta));

          // Type guard: verificar que el item tiene units (todos los tipos de items en cocina tienen units opcional)
          const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
          let units = (itemWithUnits.units || []).map(u => ({ ...u })); // Clonar units también
          
          if (newCantidad > 1) {
            while (units.length < newCantidad) {
              units.push({ id: `${itemId}-${units.length + 1}` });
            }
            while (units.length > newCantidad) {
              units.pop();
            }
            return { ...item, cantidad: newCantidad, units: units.map(u => ({ ...u })), estado: undefined, notes: undefined, photos: undefined };
          } else if (newCantidad === 1) {
            const singleEstado = units.length > 0 ? units[0].estado : undefined;
            const singleNotes = units.length > 0 ? units[0].notes : undefined;
            const singlePhotos = units.length > 0 ? units[0].photos : undefined;
            return { ...item, cantidad: newCantidad, units: undefined, estado: singleEstado, notes: singleNotes, photos: singlePhotos };
          } else {
            return { ...item, cantidad: newCantidad, units: undefined, estado: undefined, notes: undefined, photos: undefined };
          }
        }
        return item;
      });

      onUpdate({ [itemsKey]: updatedItems });
    }, [section.carpentryItems, section.storageItems, section.appliancesItems, carpentryItems, storageItems, appliancesItems, onUpdate]);

    // Generic handler for status changes
    const handleStatusChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      status: ChecklistStatus,
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems"
    ) => {
      // Always get the latest items directly from section and clone to avoid mutations
      const currentItems = (() => {
        if (itemsKey === "carpentryItems") {
          return (section.carpentryItems && section.carpentryItems.length > 0)
            ? [...section.carpentryItems]
            : [...carpentryItems];
        } else if (itemsKey === "storageItems") {
          return (section.storageItems && section.storageItems.length > 0)
            ? [...section.storageItems]
            : [...storageItems];
        } else if (itemsKey === "appliancesItems") {
          return (section.appliancesItems && section.appliancesItems.length > 0)
            ? [...section.appliancesItems]
            : [...appliancesItems];
        }
        return [];
      })();
      
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
          if (unitIndex !== null && itemWithUnits.units && itemWithUnits.units.length > unitIndex) {
            const updatedUnits = itemWithUnits.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, estado: status } : { ...unit }
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, estado: status };
          }
        }
        return { ...item };
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [section.carpentryItems, section.storageItems, section.appliancesItems, carpentryItems, storageItems, appliancesItems, onUpdate]);

    // Generic handler for bad elements changes
    const handleBadElementsChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      badElements: string[],
      items: (ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem)[],
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems"
    ) => {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
          if (unitIndex !== null && itemWithUnits.units && itemWithUnits.units.length > unitIndex) {
            const updatedUnits = itemWithUnits.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, badElements } : { ...unit }
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, badElements };
          }
        }
        return { ...item };
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [onUpdate]);

    // Generic handler for notes changes
    const handleNotesChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      notes: string,
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems"
    ) => {
      // Always get the latest items directly from section and clone to avoid mutations
      const currentItems = (() => {
        if (itemsKey === "carpentryItems") {
          return (section.carpentryItems && section.carpentryItems.length > 0)
            ? [...section.carpentryItems]
            : [...carpentryItems];
        } else if (itemsKey === "storageItems") {
          return (section.storageItems && section.storageItems.length > 0)
            ? [...section.storageItems]
            : [...storageItems];
        } else if (itemsKey === "appliancesItems") {
          return (section.appliancesItems && section.appliancesItems.length > 0)
            ? [...section.appliancesItems]
            : [...appliancesItems];
        }
        return [];
      })();
      
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
          if (unitIndex !== null && itemWithUnits.units && itemWithUnits.units.length > unitIndex) {
            const updatedUnits = itemWithUnits.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, notes } : { ...unit }
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, notes };
          }
        }
        return { ...item };
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [section.carpentryItems, section.storageItems, section.appliancesItems, carpentryItems, storageItems, appliancesItems, onUpdate]);

    // Generic handler for photos changes
    const handlePhotosChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      photos: FileUpload[],
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems"
    ) => {
      // Always get the latest items directly from section and clone to avoid mutations
      const currentItems = (() => {
        if (itemsKey === "carpentryItems") {
          return (section.carpentryItems && section.carpentryItems.length > 0)
            ? [...section.carpentryItems]
            : [...carpentryItems];
        } else if (itemsKey === "storageItems") {
          return (section.storageItems && section.storageItems.length > 0)
            ? [...section.storageItems]
            : [...storageItems];
        } else if (itemsKey === "appliancesItems") {
          return (section.appliancesItems && section.appliancesItems.length > 0)
            ? [...section.appliancesItems]
            : [...appliancesItems];
        }
        return [];
      })();
      
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
          if (unitIndex !== null && itemWithUnits.units && itemWithUnits.units.length > unitIndex) {
            const updatedUnits = itemWithUnits.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, photos } : { ...unit }
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, photos };
          }
        }
        return { ...item };
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [section.carpentryItems, section.storageItems, section.appliancesItems, carpentryItems, storageItems, appliancesItems, onUpdate]);

    // Render function for items with quantity (carpentry, storage, appliances)
    const renderQuantityItems = (
      items: (ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem)[],
      itemsConfig: readonly { id: string; translationKey: string }[],
      itemsKey: "carpentryItems" | "storageItems" | "appliancesItems",
      translationPath: string
    ) => {
      // Always get the latest items from section to ensure we have the most recent state
      const latestItems = (() => {
        if (itemsKey === "carpentryItems") {
          return section.carpentryItems || items;
        } else if (itemsKey === "storageItems") {
          return section.storageItems || items;
        } else if (itemsKey === "appliancesItems") {
          return section.appliancesItems || items;
        }
        return items;
      })();
      
      return (
        <div className="space-y-4">
          {itemsConfig.map((itemConfig) => {
            // Always get the latest item from latestItems to ensure we have the most recent state
            const item = latestItems.find(i => i.id === itemConfig.id) || {
              id: itemConfig.id,
              cantidad: 0,
            };
            const cantidad = item.cantidad || 0;
            const needsValidation = cantidad > 0;
            const hasMultipleUnits = cantidad > 1;
            const itemWithUnits = item as ChecklistCarpentryItem | ChecklistStorageItem | ChecklistApplianceItem;
            const units = itemWithUnits.units || [];
            
            // Ensure we're using the latest item state for rendering
            const currentItem = latestItems.find(i => i.id === itemConfig.id) || item;

            return (
              <div key={`${item.id}-${cantidad}`} className="space-y-4 w-full overflow-hidden">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight break-words">
                    {(() => {
                      if (translationPath === "carpinteria") {
                        return t.checklist.sections.cocina.carpinteria.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.carpinteria.items] || itemConfig.id;
                      } else if (translationPath === "almacenamiento") {
                        return t.checklist.sections.cocina.almacenamiento.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.almacenamiento.items] || itemConfig.id;
                      } else if (translationPath === "electrodomesticos") {
                        return t.checklist.sections.cocina.electrodomesticos.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.electrodomesticos.items] || itemConfig.id;
                      }
                      return itemConfig.id;
                    })()}
                    {cantidad > 0 && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1, itemsKey)}
                      disabled={cantidad === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E5E5] dark:bg-[#3D3D3D] hover:bg-[#D4D4D4] dark:hover:bg-[#4D4D4D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrementar cantidad"
                    >
                      <Minus className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
                    </button>
                    <div className="flex h-8 w-[34px] items-center justify-center rounded border border-[#D4D4D8] dark:border-[#525252] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                      <span className="text-sm font-medium text-[#A1A1AA] dark:text-[#737373] text-center">
                        {cantidad}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1, itemsKey)}
                      disabled={cantidad >= MAX_QUANTITY}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9E7FF] dark:bg-[#1B36A3] hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Incrementar cantidad"
                    >
                      <Plus className="h-4 w-4 text-[#162EB7] dark:text-[#5B8FFF]" />
                    </button>
                  </div>
                </div>

                {/* Status Options (only if cantidad > 0) */}
                {needsValidation && (
                  <>
                    {hasMultipleUnits ? (
                      // Render individual units when cantidad > 1
                      <div className="space-y-6">
                        {Array.from({ length: cantidad }, (_, index) => {
                          const unit = units[index] || { id: `${item.id}-${index + 1}` };
                          const unitRequiresDetails = unit.estado === "necesita_reparacion" || unit.estado === "necesita_reemplazo";

                          return (
                            <div key={unit.id || index} className="space-y-4 border-l-2 pl-2 sm:pl-4 border-[var(--prophero-gray-200)] dark:border-[var(--prophero-gray-700)]">
                              <div className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                {(() => {
                                  if (translationPath === "carpinteria") {
                                    return `${t.checklist.sections.cocina.carpinteria.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.carpinteria.items] || itemConfig.id} ${index + 1}`;
                                  } else if (translationPath === "almacenamiento") {
                                    return `${t.checklist.sections.cocina.almacenamiento.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.almacenamiento.items] || itemConfig.id} ${index + 1}`;
                                  } else if (translationPath === "electrodomesticos") {
                                    return `${t.checklist.sections.cocina.electrodomesticos.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.electrodomesticos.items] || itemConfig.id} ${index + 1}`;
                                  }
                                  return `${itemConfig.id} ${index + 1}`;
                                })()}
                                <span className="text-red-500">*</span>
                              </div>
                              
                              {/* Status Options for this unit */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                {STATUS_OPTIONS.map((option) => {
                                  const isSelected = unit.estado === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => handleStatusChange(item.id, index, option.value, itemsKey)}
                                      className={cn(
                                        "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-colors w-full",
                                        isSelected
                                          ? "border-[var(--prophero-gray-400)] dark:border-[var(--prophero-gray-500)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]"
                                          : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)] bg-white dark:bg-[var(--prophero-gray-900)]"
                                      )}
                                    >
                                      <option.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                                      <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-center text-muted-foreground">
                                        {option.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Details for this unit (if necesita reparación or necesita reemplazo) */}
                              {unitRequiresDetails && (
                                <div className="space-y-4 pt-2 w-full overflow-hidden">
                                  {/* Notes */}
                                  <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                      {t.checklist.notes} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                      value={unit.notes || ""}
                                        onChange={(e) => handleNotesChange(item.id, index, e.target.value, itemsKey)}
                                      placeholder={t.checklist.observationsPlaceholder}
                                      className="min-h-[80px] text-xs sm:text-sm leading-relaxed w-full"
                                      required={unitRequiresDetails}
                                    />
                                  </div>

                                  {/* Photos */}
                                  <div className="space-y-2">
                                    <ChecklistUploadZoneComponent
                                      title="Fotos"
                                      description="Añade fotos del problema o elemento que necesita reparación/reemplazo"
                                      uploadZone={{ id: `${item.id}-${index + 1}-photos`, photos: unit.photos || [], videos: [] }}
                                      onUpdate={(updates) => {
                                        handlePhotosChange(item.id, index, updates.photos, itemsKey);
                                      }}
                                      isRequired={unitRequiresDetails}
                                      maxFiles={10}
                                      maxSizeMB={5}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Render single status selector when cantidad === 1
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                            {(() => {
                              if (translationPath === "carpinteria") {
                                return `${t.checklist.sections.cocina.carpinteria.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.carpinteria.items] || itemConfig.id} 1`;
                              } else if (translationPath === "almacenamiento") {
                                return `${t.checklist.sections.cocina.almacenamiento.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.almacenamiento.items] || itemConfig.id} 1`;
                              } else if (translationPath === "electrodomesticos") {
                                return `${t.checklist.sections.cocina.electrodomesticos.items[itemConfig.translationKey as keyof typeof t.checklist.sections.cocina.electrodomesticos.items] || itemConfig.id} 1`;
                              }
                              return `${itemConfig.id} 1`;
                            })()}
                            <span className="text-red-500">*</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                          {STATUS_OPTIONS.map((option) => {
                            // Always get the latest item state to ensure correct selection state
                            const latestItem = latestItems.find(i => i.id === itemConfig.id) || item;
                            const isSelected = latestItem.estado === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleStatusChange(latestItem.id, null, option.value, itemsKey)}
                                className={cn(
                                  "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-colors w-full",
                                  isSelected
                                    ? "border-[var(--prophero-gray-400)] dark:border-[var(--prophero-gray-500)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]"
                                    : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)] bg-white dark:bg-[var(--prophero-gray-900)]"
                                )}
                              >
                                <option.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-center text-muted-foreground">
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Details for single unit (if necesita reparación or necesita reemplazo) */}
                        {(() => {
                          const latestItem = latestItems.find(i => i.id === itemConfig.id) || item;
                          return (latestItem.estado === "necesita_reparacion" || latestItem.estado === "necesita_reemplazo") && (
                            <div className="space-y-4 pt-2 w-full overflow-hidden">
                              {/* Notes */}
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                {t.checklist.notes} <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                value={latestItem.notes || ""}
                                onChange={(e) => handleNotesChange(latestItem.id, null, e.target.value, itemsKey)}
                                placeholder={t.checklist.observationsPlaceholder}
                                className="min-h-[80px] text-xs sm:text-sm leading-relaxed w-full"
                                required={true}
                              />
                            </div>

                            {/* Photos */}
                            <div className="space-y-2">
                              <ChecklistUploadZoneComponent
                                title="Fotos"
                                description="Añade fotos del problema o elemento que necesita reparación/reemplazo"
                                uploadZone={{ id: `${latestItem.id}-photos`, photos: latestItem.photos || [], videos: [] }}
                                onUpdate={(updates) => {
                                  handlePhotosChange(latestItem.id, null, updates.photos, itemsKey);
                                }}
                                isRequired={true}
                                maxFiles={10}
                                maxSizeMB={5}
                              />
                            </div>
                          </div>
                        );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div 
        ref={ref} 
        className={cn(
          "checklist-section space-y-8",
          hasError && "border-4 border-red-500 rounded-lg p-4 bg-red-50 dark:bg-red-900/10"
        )}
      >
        {hasError && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              ⚠️ Esta sección tiene campos requeridos sin completar. Por favor, completa todos los campos marcados como obligatorios antes de finalizar el checklist.
            </p>
          </div>
        )}

        {/* Main Section Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t.checklist.sections.cocina.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.checklist.sections.cocina.description}
          </p>
        </div>

        {/* Upload Zones con títulos fuera del contenedor general */}
        <div className="space-y-6">
          {/* Fotos y vídeo de la cocina */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.cocina.fotosVideoCocina.title} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  title={t.checklist.sections.cocina.fotosVideoCocina.title}
                  description={t.checklist.sections.cocina.fotosVideoCocina.description}
                  uploadZone={uploadZone}
                  onUpdate={handleUploadZoneUpdate}
                  isRequired={true}
                  maxFiles={10}
                  maxSizeMB={5}
                  hideTitle={true}
                />
              </Card>
            </div>
          </div>
        </div>

        {/* Questions - Contenedor general para las preguntas */}
        <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6 mt-8">
          <div className="space-y-6">
            {/* Acabados */}
            <Card className="p-6 space-y-4">
          <ChecklistQuestionComponent
            question={questions.find(q => q.id === "acabados") || { id: "acabados" }}
            questionId="acabados"
            label={t.checklist.sections.cocina.acabados.title}
            description={t.checklist.sections.cocina.acabados.description}
            onUpdate={(updates) => handleQuestionUpdate("acabados", updates)}
            isRequired={true}
            elements={[
              { id: "paredes", label: t.checklist.sections.cocina.acabados.elements.paredes },
              { id: "techos", label: t.checklist.sections.cocina.acabados.elements.techos },
              { id: "suelo", label: t.checklist.sections.cocina.acabados.elements.suelo },
              { id: "rodapies", label: t.checklist.sections.cocina.acabados.elements.rodapies },
                ]}
                propertyId={propertyId}
                folder="checklist/cocina"
              />
        </Card>

            {/* Mobiliario Fijo */}
            <Card className="p-6 space-y-4">
          <ChecklistQuestionComponent
            question={questions.find(q => q.id === "mobiliario-fijo") || { id: "mobiliario-fijo" }}
            questionId="mobiliario-fijo"
            label={t.checklist.sections.cocina.mobiliarioFijo.title}
            description={t.checklist.sections.cocina.mobiliarioFijo.description}
            onUpdate={(updates) => handleQuestionUpdate("mobiliario-fijo", updates)}
            isRequired={true}
            elements={[
              { id: "modulos-bajos", label: t.checklist.sections.cocina.mobiliarioFijo.elements.modulosBajos },
              { id: "modulos-altos", label: t.checklist.sections.cocina.mobiliarioFijo.elements.modulosAltos },
              { id: "encimera", label: t.checklist.sections.cocina.mobiliarioFijo.elements.encimera },
              { id: "zocalo", label: t.checklist.sections.cocina.mobiliarioFijo.elements.zocalo },
                ]}
                propertyId={propertyId}
                folder="checklist/cocina"
              />
        </Card>

            {/* Agua y drenaje */}
            <Card className="p-6 space-y-4">
          <ChecklistQuestionComponent
            question={questions.find(q => q.id === "agua-drenaje") || { id: "agua-drenaje" }}
            questionId="agua-drenaje"
            label={t.checklist.sections.cocina.aguaDrenaje.title}
            description={t.checklist.sections.cocina.aguaDrenaje.description}
            onUpdate={(updates) => handleQuestionUpdate("agua-drenaje", updates)}
            isRequired={true}
            elements={[
              { id: "grifo", label: t.checklist.sections.cocina.aguaDrenaje.elements.grifo },
              { id: "fregadero", label: t.checklist.sections.cocina.aguaDrenaje.elements.fregadero },
              { id: "desagues", label: t.checklist.sections.cocina.aguaDrenaje.elements.desagues },
                ]}
                propertyId={propertyId}
                folder="checklist/cocina"
              />
        </Card>

            {/* Carpintería */}
            <Card className="p-6 space-y-4 w-full overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.cocina.carpinteria.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {t.checklist.sections.cocina.carpinteria.description}
            </p>
          </div>

          {renderQuantityItems(
            section.carpentryItems || carpentryItems, 
            CARPENTRY_ITEMS, 
            "carpentryItems", 
            "carpinteria"
          )}

          {/* Puerta de entrada - Status selector (not quantity) */}
          <div className="space-y-4 pt-4 border-t">
            <ChecklistQuestionComponent
              question={questions.find(q => q.id === "puerta-entrada") || { id: "puerta-entrada" }}
              questionId="puerta-entrada"
              label={t.checklist.sections.cocina.carpinteria.puertaEntrada}
              description=""
              onUpdate={(updates) => handleQuestionUpdate("puerta-entrada", updates)}
              isRequired={true}
            />
          </div>
        </Card>

            {/* Almacenamiento */}
            <Card className="p-6 space-y-4 w-full overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.cocina.almacenamiento.title}
            </h2>
          </div>

          {renderQuantityItems(
            section.storageItems || storageItems, 
            STORAGE_ITEMS, 
            "storageItems", 
            "almacenamiento"
          )}
        </Card>

            {/* Electrodomésticos */}
            <Card className="p-6 space-y-4 w-full overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.cocina.electrodomesticos.title}
            </h2>
          </div>

          {renderQuantityItems(
            section.appliancesItems || appliancesItems, 
            APPLIANCES_ITEMS, 
            "appliancesItems", 
            "electrodomesticos"
          )}
            </Card>

          {/* Navigation */}
          {onContinue && (
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="currentColor"/>
                </svg>
                {t.common.back}
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="px-6 py-2 h-9 bg-[#D9E7FF] dark:bg-[#1B36A3] text-[#162EB7] dark:text-[#5B8FFF] rounded-full font-medium text-sm hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] transition-colors"
              >
                {t.common.continue}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }
);

CocinaSection.displayName = "CocinaSection";
