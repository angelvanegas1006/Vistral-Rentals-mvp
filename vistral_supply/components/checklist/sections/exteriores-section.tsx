"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { ChecklistSection, ChecklistSecurityItem, ChecklistSystemItem, ChecklistStatus, ChecklistQuestion, ChecklistUploadZone, FileUpload } from "@/lib/supply-checklist-storage";
import { ChecklistQuestion as ChecklistQuestionComponent } from "../checklist-question";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "../checklist-upload-zone";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ThumbsUp, Wrench, ThumbsDown, XCircle } from "lucide-react";

interface ExterioresSectionProps {
  section: ChecklistSection;
  onUpdate: (updates: Partial<ChecklistSection>) => void;
  onContinue?: () => void;
  hasError?: boolean;
  propertyId?: string; // Property ID for organizing files in Storage
}

const SECURITY_ITEMS = [
  { id: "barandillas", translationKey: "barandillas" },
  { id: "rejas", translationKey: "rejas" },
] as const;

const SYSTEMS_ITEMS = [
  { id: "tendedero-exterior", translationKey: "tendederoExterior" },
  { id: "toldos", translationKey: "toldos" },
] as const;

const MAX_QUANTITY = 20;

export const ExterioresSection = forwardRef<HTMLDivElement, ExterioresSectionProps>(
  ({ section, onUpdate, onContinue, hasError = false, propertyId }, ref) => {
    const { t } = useI18n();

    // Initialize upload zone for exterior photos/video
    const uploadZone = section.uploadZones?.[0] || { id: "fotos-video-exterior", photos: [], videos: [] };

    // Default questions for initialization
    const defaultQuestions: ChecklistQuestion[] = [
      { id: "acabados-exteriores" },
      { id: "observaciones", notes: "" },
    ];

    // Always use section.questions if available and not empty, otherwise use defaults
    const questions: ChecklistQuestion[] = (section.questions && section.questions.length > 0) ? section.questions : defaultQuestions;

    // Initialize security items
    const securityItems = useMemo(() => {
      if (section.securityItems && section.securityItems.length > 0) {
        return section.securityItems;
      }
      return SECURITY_ITEMS.map(item => ({
        id: item.id,
        cantidad: 0,
      }));
    }, [section.securityItems]);

    // Initialize systems items
    const systemsItems = useMemo(() => {
      if (section.systemsItems && section.systemsItems.length > 0) {
        return section.systemsItems;
      }
      return SYSTEMS_ITEMS.map(item => ({
        id: item.id,
        cantidad: 0,
      }));
    }, [section.systemsItems]);


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


    // Generic handler for quantity changes (works for security and systems)
    const handleQuantityChange = useCallback((
      itemId: string,
      delta: number,
      items: (ChecklistSecurityItem | ChecklistSystemItem)[],
      itemsKey: "securityItems" | "systemsItems"
    ) => {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          const currentCantidad = item.cantidad || 0;
          const newCantidad = Math.max(0, Math.min(MAX_QUANTITY, currentCantidad + delta));
          
          let units = item.units || [];
          
          if (newCantidad > 1) {
            while (units.length < newCantidad) {
              units.push({ id: `${itemId}-${units.length + 1}` });
            }
            while (units.length > newCantidad) {
              units.pop();
            }
            return { ...item, cantidad: newCantidad, units, estado: undefined, notes: undefined, photos: undefined };
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
    }, [onUpdate]);

    // Generic handler for status changes
    const handleStatusChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      status: ChecklistStatus,
      items: (ChecklistSecurityItem | ChecklistSystemItem)[],
      itemsKey: "securityItems" | "systemsItems"
    ) => {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          if (unitIndex !== null && item.units && item.units.length > unitIndex) {
            const updatedUnits = item.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, estado: status } : unit
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, estado: status };
          }
        }
        return item;
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [onUpdate]);

    // Generic handler for notes changes
    const handleNotesChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      notes: string,
      items: (ChecklistSecurityItem | ChecklistSystemItem)[],
      itemsKey: "securityItems" | "systemsItems"
    ) => {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          if (unitIndex !== null && item.units && item.units.length > unitIndex) {
            const updatedUnits = item.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, notes } : unit
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, notes };
          }
        }
        return item;
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [onUpdate]);

    // Generic handler for photos changes
    const handlePhotosChange = useCallback((
      itemId: string,
      unitIndex: number | null,
      photos: FileUpload[],
      items: (ChecklistSecurityItem | ChecklistSystemItem)[],
      itemsKey: "securityItems" | "systemsItems"
    ) => {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          if (unitIndex !== null && item.units && item.units.length > unitIndex) {
            const updatedUnits = item.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, photos } : unit
            );
            return { ...item, units: updatedUnits };
          } else {
            return { ...item, photos };
          }
        }
        return item;
      });
      onUpdate({ [itemsKey]: updatedItems });
    }, [onUpdate]);

    // Render function for items with quantity (security, systems) - WITHOUT badElements checkboxes
    const renderQuantityItems = (
      items: (ChecklistSecurityItem | ChecklistSystemItem)[],
      itemsConfig: readonly { id: string; translationKey: string }[],
      itemsKey: "securityItems" | "systemsItems",
      translationPath: string
    ) => {
      return (
        <div className="space-y-4">
          {itemsConfig.map((itemConfig) => {
            const item = items.find(i => i.id === itemConfig.id) || {
              id: itemConfig.id,
              cantidad: 0,
            };
            const cantidad = item.cantidad || 0;
            const needsValidation = cantidad > 0;
            const hasMultipleUnits = cantidad > 1;
            const units = item.units || [];

            return (
              <div key={`${item.id}-${cantidad}`} className="space-y-4">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground leading-tight break-words">
                    {(() => {
                      if (translationPath === "seguridad") {
                        return t.checklist.sections.exteriores.seguridad.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.seguridad.items] || itemConfig.id;
                      } else if (translationPath === "sistemas") {
                        return t.checklist.sections.exteriores.sistemas.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.sistemas.items] || itemConfig.id;
                      }
                      return itemConfig.id;
                    })()}
                    {cantidad > 0 && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1, items, itemsKey)}
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
                      onClick={() => handleQuantityChange(item.id, 1, items, itemsKey)}
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
                              <div className="text-sm font-medium text-foreground leading-tight break-words">
                                {(() => {
                                  if (translationPath === "seguridad") {
                                    return `${t.checklist.sections.exteriores.seguridad.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.seguridad.items] || itemConfig.id} ${index + 1}`;
                                  } else if (translationPath === "sistemas") {
                                    return `${t.checklist.sections.exteriores.sistemas.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.sistemas.items] || itemConfig.id} ${index + 1}`;
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
                                      onClick={() => handleStatusChange(item.id, index, option.value, items, itemsKey)}
                                      className={cn(
                                        "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-colors w-full",
                                        isSelected
                                          ? "border-[var(--prophero-gray-400)] dark:border-[var(--prophero-gray-500)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]"
                                          : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)] bg-white dark:bg-[var(--prophero-gray-900)]"
                                      )}
                                    >
                                      <option.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                                      <span className="text-sm font-medium whitespace-nowrap text-center text-muted-foreground">
                                        {option.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Details for this unit (if necesita reparación or necesita reemplazo) - WITHOUT badElements */}
                              {unitRequiresDetails && (
                                <div className="space-y-4 pt-2">
                                  {/* Notes */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground leading-tight break-words">
                                      {t.checklist.notes} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                      value={unit.notes || ""}
                                      onChange={(e) => handleNotesChange(item.id, index, e.target.value, items, itemsKey)}
                                      placeholder={t.checklist.observationsPlaceholder}
                                      className="min-h-[80px] text-sm leading-relaxed w-full"
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
                                        handlePhotosChange(item.id, index, updates.photos, items, itemsKey);
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
                          <div className="text-sm font-medium text-foreground leading-tight break-words">
                            {(() => {
                              if (translationPath === "seguridad") {
                                return `${t.checklist.sections.exteriores.seguridad.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.seguridad.items] || itemConfig.id} 1`;
                              } else if (translationPath === "sistemas") {
                                return `${t.checklist.sections.exteriores.sistemas.items[itemConfig.translationKey as keyof typeof t.checklist.sections.exteriores.sistemas.items] || itemConfig.id} 1`;
                              }
                              return `${itemConfig.id} 1`;
                            })()}
                            <span className="text-red-500">*</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                          {STATUS_OPTIONS.map((option) => {
                            const isSelected = item.estado === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleStatusChange(item.id, null, option.value, items, itemsKey)}
                                className={cn(
                                  "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-colors w-full",
                                  isSelected
                                    ? "border-[var(--prophero-gray-400)] dark:border-[var(--prophero-gray-500)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]"
                                    : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)] bg-white dark:bg-[var(--prophero-gray-900)]"
                                )}
                              >
                                <option.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="text-sm font-medium whitespace-nowrap text-center text-muted-foreground">
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Details for single unit (if necesita reparación or necesita reemplazo) - WITHOUT badElements */}
                        {(item.estado === "necesita_reparacion" || item.estado === "necesita_reemplazo") && (
                          <div className="space-y-4 pt-2">
                            {/* Notes */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground leading-tight break-words">
                                {t.checklist.notes} <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                value={item.notes || ""}
                                onChange={(e) => handleNotesChange(item.id, null, e.target.value, items, itemsKey)}
                                placeholder={t.checklist.observationsPlaceholder}
                                className="min-h-[80px] text-sm leading-relaxed w-full"
                                required={true}
                              />
                            </div>

                            {/* Photos */}
                            <div className="space-y-2">
                              <ChecklistUploadZoneComponent
                                title="Fotos"
                                description="Añade fotos del problema o elemento que necesita reparación/reemplazo"
                                uploadZone={{ id: `${item.id}-photos`, photos: item.photos || [], videos: [] }}
                                onUpdate={(updates) => {
                                  handlePhotosChange(item.id, null, updates.photos, items, itemsKey);
                                }}
                                isRequired={true}
                                maxFiles={10}
                                maxSizeMB={5}
                              />
                            </div>
                          </div>
                        )}
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
          <h1 className="text-2xl font-bold text-foreground">{t.checklist.sections.exteriores.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.checklist.sections.exteriores.description}
          </p>
        </div>

        {/* Upload Zones con títulos fuera del contenedor general */}
        <div className="space-y-6">
          {/* Fotos y vídeo del exterior */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.exteriores.fotosVideoExterior.title} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  title={t.checklist.sections.exteriores.fotosVideoExterior.title}
                  description={t.checklist.sections.exteriores.fotosVideoExterior.description}
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
            {/* Seguridad */}
            <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.exteriores.seguridad.title}
            </h2>
          </div>

          {renderQuantityItems(securityItems, SECURITY_ITEMS, "securityItems", "seguridad")}
        </Card>

        {/* Sistemas */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.exteriores.sistemas.title}
            </h2>
          </div>

          {renderQuantityItems(systemsItems, SYSTEMS_ITEMS, "systemsItems", "sistemas")}
        </Card>

        {/* Acabados exteriores */}
        <Card className="p-6 space-y-4">
          <ChecklistQuestionComponent
            question={questions.find(q => q.id === "acabados-exteriores") || { id: "acabados-exteriores" }}
            questionId="acabados-exteriores"
            label={t.checklist.sections.exteriores.acabadosExteriores.title}
            description={t.checklist.sections.exteriores.acabadosExteriores.description}
            onUpdate={(updates) => handleQuestionUpdate("acabados-exteriores", updates)}
            isRequired={true}
            elements={[
              { id: "paredes", label: t.checklist.sections.exteriores.acabadosExteriores.elements.paredes },
              { id: "techos", label: t.checklist.sections.exteriores.acabadosExteriores.elements.techos },
              { id: "suelo", label: t.checklist.sections.exteriores.acabadosExteriores.elements.suelo },
              { id: "rodapies", label: t.checklist.sections.exteriores.acabadosExteriores.elements.rodapies },
                ]}
                propertyId={propertyId}
                folder="checklist/exteriores"
              />
            </Card>

        {/* Observaciones */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              {t.checklist.sections.exteriores.observaciones?.title || t.checklist.observations} <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              {t.checklist.sections.exteriores.observaciones?.description || t.checklist.observationsDescription}
            </p>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {STATUS_OPTIONS.map((option) => {
                const observacionesQuestion = questions.find(q => q.id === "observaciones");
                const isSelected = observacionesQuestion?.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleQuestionUpdate("observaciones", { status: option.value })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-colors w-full",
                      isSelected
                        ? "border-[var(--prophero-gray-400)] dark:border-[var(--prophero-gray-500)] bg-[var(--prophero-gray-100)] dark:bg-[var(--prophero-gray-800)]"
                        : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)] bg-white dark:bg-[var(--prophero-gray-900)]"
                    )}
                  >
                    <option.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium whitespace-nowrap text-center text-muted-foreground">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

          {/* Navigation - Only show back button, no continue since this is the last section */}
          <div className="flex justify-start pt-4 border-t">
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
          </div>
          </div>
        </div>
      </div>
    );
  }
);

ExterioresSection.displayName = "ExterioresSection";
