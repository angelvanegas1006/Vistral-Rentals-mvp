"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { ChecklistSection, ChecklistCarpentryItem, ChecklistClimatizationItem, ChecklistClimatizationUnit, ChecklistStatus, ChecklistQuestion, ChecklistUploadZone, FileUpload } from "@/lib/supply-checklist-storage";
import { ChecklistQuestion as ChecklistQuestionComponent } from "../checklist-question";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "../checklist-upload-zone";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ThumbsUp, Wrench, ThumbsDown, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SalonSectionProps {
  section: ChecklistSection;
  onUpdate: (updates: Partial<ChecklistSection>) => void;
  onContinue?: () => void;
  hasError?: boolean;
  propertyId?: string; // Property ID for organizing files in Storage
}

const CARPENTRY_ITEMS = [
  { id: "ventanas", translationKey: "ventanas" },
  { id: "persianas", translationKey: "persianas" },
  { id: "armarios", translationKey: "armarios" },
] as const;

const CLIMATIZATION_ITEMS = [
  { id: "radiadores", translationKey: "radiadores" },
  { id: "split-ac", translationKey: "splitAc" },
] as const;

const MAX_QUANTITY = 20;

export const SalonSection = forwardRef<HTMLDivElement, SalonSectionProps>(
  ({ section, onUpdate, onContinue, hasError = false, propertyId }, ref) => {
    const { t } = useI18n();

    // Initialize upload zone for salon photos/video
    const uploadZone = section.uploadZones?.[0] || { id: "fotos-video-salon", photos: [], videos: [] };

    // Default questions for initialization
    const defaultQuestions = [
      { id: "acabados" },
      { id: "electricidad" },
      { id: "puerta-entrada" },
    ];

    // Always use section.questions if available and not empty, otherwise use defaults
    const questions = (section.questions && section.questions.length > 0) ? section.questions : defaultQuestions;
    
    // Get individual questions directly from questions array to ensure they update
    const acabadosQuestion = questions.find(q => q.id === "acabados") || { id: "acabados" };
    const electricidadQuestion = questions.find(q => q.id === "electricidad") || { id: "electricidad" };

    // Initialize carpentry items
    const carpentryItems = useMemo(() => {
      if (section.carpentryItems && section.carpentryItems.length > 0) {
        return section.carpentryItems;
      }
      return CARPENTRY_ITEMS.map(item => ({
        id: item.id,
        cantidad: 0,
      }));
    }, [section.carpentryItems]);

    // Initialize climatization items
    const climatizationItems = useMemo(() => {
      if (section.climatizationItems && section.climatizationItems.length > 0) {
        return section.climatizationItems;
      }
      return CLIMATIZATION_ITEMS.map(item => ({
        id: item.id,
        cantidad: 0,
      }));
    }, [section.climatizationItems]);

    // Initialize mobiliario
    const mobiliario = section.mobiliario || { existeMobiliario: false };

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
      // Always use the current section.questions, fallback to default if not present or empty
      const currentQuestions = (section.questions && section.questions.length > 0) ? section.questions : defaultQuestions;
      
      const updatedQuestions = currentQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      
      // If question doesn't exist, add it
      if (!currentQuestions.find(q => q.id === questionId)) {
        updatedQuestions.push({ id: questionId, ...updates });
      }
      
      onUpdate({ questions: updatedQuestions });
    }, [section.questions, defaultQuestions, onUpdate]);

    const handleCarpentryQuantityChange = useCallback((itemId: string, delta: number) => {
      const currentItems = (section.carpentryItems && section.carpentryItems.length > 0) 
        ? [...section.carpentryItems] // Clonar array para evitar mutaciones
        : [...carpentryItems];
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const carpentryItem = item as ChecklistCarpentryItem;
          const currentCantidad = carpentryItem.cantidad || 0;
          const newCantidad = Math.max(0, Math.min(MAX_QUANTITY, currentCantidad + delta));
          
          let units = carpentryItem.units || [];
          
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
      onUpdate({ carpentryItems: updatedItems });
    }, [section.carpentryItems, carpentryItems, onUpdate]);

    const handleCarpentryStatusChange = useCallback((itemId: string, unitIndex: number | null, status: ChecklistStatus) => {
      const currentItems = (section.carpentryItems && section.carpentryItems.length > 0) 
        ? section.carpentryItems 
        : carpentryItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const carpentryItem = item as ChecklistCarpentryItem;
          if (unitIndex !== null && carpentryItem.units && carpentryItem.units.length > unitIndex) {
            const updatedUnits = carpentryItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, estado: status } : unit
            );
            return { ...carpentryItem, units: updatedUnits };
          } else {
            return { ...carpentryItem, estado: status };
          }
        }
        return item;
      });
      onUpdate({ carpentryItems: updatedItems });
    }, [section.carpentryItems, carpentryItems, onUpdate]);

    const handleCarpentryNotesChange = useCallback((itemId: string, unitIndex: number | null, notes: string) => {
      const currentItems = (section.carpentryItems && section.carpentryItems.length > 0) 
        ? section.carpentryItems 
        : carpentryItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const carpentryItem = item as ChecklistCarpentryItem;
          if (unitIndex !== null && carpentryItem.units && carpentryItem.units.length > unitIndex) {
            const updatedUnits = carpentryItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, notes } : unit
            );
            return { ...carpentryItem, units: updatedUnits };
          } else {
            return { ...carpentryItem, notes };
          }
        }
        return item;
      });
      onUpdate({ carpentryItems: updatedItems });
    }, [section.carpentryItems, carpentryItems, onUpdate]);

    const handleCarpentryPhotosChange = useCallback((itemId: string, unitIndex: number | null, photos: FileUpload[]) => {
      const currentItems = (section.carpentryItems && section.carpentryItems.length > 0) 
        ? section.carpentryItems 
        : carpentryItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const carpentryItem = item as ChecklistCarpentryItem;
          if (unitIndex !== null && carpentryItem.units && carpentryItem.units.length > unitIndex) {
            const updatedUnits = carpentryItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, photos } : unit
            );
            return { ...carpentryItem, units: updatedUnits };
          } else {
            return { ...carpentryItem, photos };
          }
        }
        return item;
      });
      onUpdate({ carpentryItems: updatedItems });
    }, [section.carpentryItems, carpentryItems, onUpdate]);

    const handleCarpentryBadElementsChange = useCallback((itemId: string, unitIndex: number | null, badElements: string[]) => {
      const currentItems = section.carpentryItems || carpentryItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const carpentryItem = item as ChecklistCarpentryItem;
          if (unitIndex !== null && carpentryItem.units && carpentryItem.units.length > unitIndex) {
            const updatedUnits = carpentryItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, badElements } : unit
            );
            return { ...carpentryItem, units: updatedUnits };
          } else {
            return { ...carpentryItem, badElements };
          }
        }
        return item;
      });
      onUpdate({ carpentryItems: updatedItems });
    }, [section.carpentryItems, carpentryItems, onUpdate]);

    const handleClimatizationQuantityChange = useCallback((itemId: string, delta: number) => {
      const currentItems = (section.climatizationItems && section.climatizationItems.length > 0) 
        ? [...section.climatizationItems] // Clonar array para evitar mutaciones
        : [...climatizationItems];
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const climatizationItem = item as ChecklistClimatizationItem;
          const currentCantidad = climatizationItem.cantidad || 0;
          const newCantidad = Math.max(0, Math.min(MAX_QUANTITY, currentCantidad + delta));
          
          let units = climatizationItem.units || [];
          
          if (newCantidad > 1) {
            while (units.length < newCantidad) {
              units.push({ id: `${itemId}-${units.length + 1}` });
            }
            while (units.length > newCantidad) {
              units.pop();
            }
            return { ...climatizationItem, cantidad: newCantidad, units, estado: undefined, notes: undefined, photos: undefined };
          } else if (newCantidad === 1) {
            const singleEstado = units.length > 0 ? units[0].estado : undefined;
            const singleNotes = units.length > 0 ? units[0].notes : undefined;
            const singlePhotos = units.length > 0 ? units[0].photos : undefined;
            return { ...climatizationItem, cantidad: newCantidad, units: undefined, estado: singleEstado, notes: singleNotes, photos: singlePhotos };
          } else {
            return { ...climatizationItem, cantidad: newCantidad, units: undefined, estado: undefined, notes: undefined, photos: undefined };
          }
        }
        return item;
      });
      onUpdate({ climatizationItems: updatedItems });
    }, [section.climatizationItems, climatizationItems, onUpdate]);

    const handleClimatizationStatusChange = useCallback((itemId: string, unitIndex: number | null, status: ChecklistStatus) => {
      const currentItems = (section.climatizationItems && section.climatizationItems.length > 0) 
        ? section.climatizationItems 
        : climatizationItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const climatizationItem = item as ChecklistClimatizationItem;
          if (unitIndex !== null && climatizationItem.units && climatizationItem.units.length > unitIndex) {
            const updatedUnits = climatizationItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, estado: status } : unit
            );
            return { ...climatizationItem, units: updatedUnits };
          } else {
            return { ...climatizationItem, estado: status };
          }
        }
        return item;
      });
      onUpdate({ climatizationItems: updatedItems });
    }, [section.climatizationItems, climatizationItems, onUpdate]);

    const handleClimatizationNotesChange = useCallback((itemId: string, unitIndex: number | null, notes: string) => {
      const currentItems = (section.climatizationItems && section.climatizationItems.length > 0) 
        ? section.climatizationItems 
        : climatizationItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const climatizationItem = item as ChecklistClimatizationItem;
          if (unitIndex !== null && climatizationItem.units && climatizationItem.units.length > unitIndex) {
            const updatedUnits = climatizationItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, notes } : unit
            );
            return { ...climatizationItem, units: updatedUnits };
          } else {
            return { ...climatizationItem, notes };
          }
        }
        return item;
      });
      onUpdate({ climatizationItems: updatedItems });
    }, [section.climatizationItems, climatizationItems, onUpdate]);

    const handleClimatizationPhotosChange = useCallback((itemId: string, unitIndex: number | null, photos: FileUpload[]) => {
      const currentItems = (section.climatizationItems && section.climatizationItems.length > 0) 
        ? section.climatizationItems 
        : climatizationItems;
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          const climatizationItem = item as ChecklistClimatizationItem;
          if (unitIndex !== null && climatizationItem.units && climatizationItem.units.length > unitIndex) {
            const updatedUnits = climatizationItem.units.map((unit, idx) =>
              idx === unitIndex ? { ...unit, photos } : unit
            );
            return { ...climatizationItem, units: updatedUnits };
          } else {
            return { ...climatizationItem, photos };
          }
        }
        return item;
      });
      onUpdate({ climatizationItems: updatedItems });
    }, [section.climatizationItems, climatizationItems, onUpdate]);

    const handleMobiliarioToggle = useCallback((checked: boolean) => {
      onUpdate({
        mobiliario: {
          existeMobiliario: checked,
          question: checked ? (mobiliario.question || { id: "mobiliario" }) : undefined,
        },
      });
    }, [mobiliario, onUpdate]);

    const handleMobiliarioQuestionUpdate = useCallback((updates: Partial<ChecklistQuestion>) => {
      onUpdate({
        mobiliario: {
          ...mobiliario,
          question: { ...(mobiliario.question || { id: "mobiliario" }), ...updates },
        },
      });
    }, [mobiliario, onUpdate]);

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
          <h1 className="text-2xl font-bold text-foreground">{t.checklist.sections.salon.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.checklist.sections.salon.description}
          </p>
        </div>

        {/* Upload Zones con títulos fuera del contenedor general */}
        <div className="space-y-6">
          {/* Fotos y vídeo del salón */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.checklist.sections.salon.fotosVideoSalon.title} <span className="text-red-500">*</span>
            </h2>
            <div className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm">
              <Card className="p-6 space-y-4">
                <ChecklistUploadZoneComponent
                  title={t.checklist.sections.salon.fotosVideoSalon.title}
                  description={t.checklist.sections.salon.fotosVideoSalon.description}
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
            question={acabadosQuestion}
            questionId="acabados"
            label={t.checklist.sections.salon.acabados.title}
            description={t.checklist.sections.salon.acabados.description}
            onUpdate={(updates) => handleQuestionUpdate("acabados", updates)}
            isRequired={true}
            elements={[
              { id: "paredes", label: t.checklist.sections.salon.acabados.elements.paredes },
              { id: "techos", label: t.checklist.sections.salon.acabados.elements.techos },
              { id: "suelo", label: t.checklist.sections.salon.acabados.elements.suelo },
              { id: "rodapies", label: t.checklist.sections.salon.acabados.elements.rodapies },
                ]}
                propertyId={propertyId}
                folder="checklist/salon"
              />
        </Card>

            {/* Carpintería */}
            <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.salon.carpinteria.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {t.checklist.sections.salon.carpinteria.description}
            </p>
          </div>

          {/* Quantity Steppers for Ventanas, Persianas, Armarios */}
          <div className="space-y-4">
            {CARPENTRY_ITEMS.map((itemConfig) => {
              const itemsToSearch = (section.carpentryItems && section.carpentryItems.length > 0) 
                ? section.carpentryItems 
                : carpentryItems;
              const item = itemsToSearch.find(i => i.id === itemConfig.id) || {
                id: itemConfig.id,
                cantidad: 0,
              } as ChecklistCarpentryItem;
              const carpentryItem = item as ChecklistCarpentryItem;
              const cantidad = carpentryItem.cantidad || 0;
              const needsValidation = cantidad > 0;
              const hasMultipleUnits = cantidad > 1;
              const units = carpentryItem.units || [];

              return (
                <div key={item.id} className="space-y-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight break-words">
                      {t.checklist.sections.salon.carpinteria.items[itemConfig.translationKey]}
                      {cantidad > 0 && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCarpentryQuantityChange(item.id, -1)}
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
                        onClick={() => handleCarpentryQuantityChange(item.id, 1)}
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
                                  {t.checklist.sections.salon.carpinteria.items[itemConfig.translationKey]} {index + 1} <span className="text-red-500">*</span>
                                </div>
                                
                                {/* Status Options for this unit */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                  {STATUS_OPTIONS.map((option) => {
                                    const isSelected = unit.estado === option.value;
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleCarpentryStatusChange(item.id, index, option.value)}
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
                                  <div className="space-y-4 pt-2">
                                    {/* Notes */}
                                    <div className="space-y-2">
                                      <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                        {t.checklist.notes} <span className="text-red-500">*</span>
                                      </Label>
                                      <Textarea
                                        value={unit.notes || ""}
                                        onChange={(e) => handleCarpentryNotesChange(item.id, index, e.target.value)}
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
                                          handleCarpentryPhotosChange(item.id, index, updates.photos);
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
                        <>
                          <div className="space-y-2">
                            <div className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                              {t.checklist.sections.salon.carpinteria.items[itemConfig.translationKey]} 1 <span className="text-red-500">*</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                            {STATUS_OPTIONS.map((option) => {
                              const isSelected = carpentryItem.estado === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleCarpentryStatusChange(carpentryItem.id, null, option.value)}
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
                          {(carpentryItem.estado === "necesita_reparacion" || carpentryItem.estado === "necesita_reemplazo") && (
                            <div className="space-y-4 pt-2">
                              {/* Notes */}
                              <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                  {t.checklist.notes} <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                  value={carpentryItem.notes || ""}
                                  onChange={(e) => handleCarpentryNotesChange(carpentryItem.id, null, e.target.value)}
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
                                  uploadZone={{ id: `${carpentryItem.id}-photos`, photos: carpentryItem.photos || [], videos: [] }}
                                  onUpdate={(updates) => {
                                    handleCarpentryPhotosChange(carpentryItem.id, null, updates.photos);
                                  }}
                                  isRequired={true}
                                  maxFiles={10}
                                  maxSizeMB={5}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Puerta de entrada */}
          <div className="pt-4 border-t">
            <ChecklistQuestionComponent
              question={questions.find(q => q.id === "puerta-entrada") || { id: "puerta-entrada" }}
              questionId="puerta-entrada"
              label={t.checklist.sections.salon.carpinteria.puertaEntrada}
              description=""
              onUpdate={(updates) => handleQuestionUpdate("puerta-entrada", updates)}
              isRequired={true}
              elements={[                ]}
                propertyId={propertyId}
                folder="checklist/salon"
              />
          </div>
        </Card>

            {/* Electricidad */}
            <Card className="p-6 space-y-4">
          <ChecklistQuestionComponent
            question={electricidadQuestion}
            questionId="electricidad"
            label={t.checklist.sections.salon.electricidad.title}
            description={t.checklist.sections.salon.electricidad.description}
            onUpdate={(updates) => handleQuestionUpdate("electricidad", updates)}
            isRequired={true}
            elements={[
              { id: "luces", label: t.checklist.sections.salon.electricidad.elements.luces },
              { id: "interruptores", label: t.checklist.sections.salon.electricidad.elements.interruptores },
              { id: "tomas-corriente", label: t.checklist.sections.salon.electricidad.elements.tomasCorriente },
              { id: "toma-television", label: t.checklist.sections.salon.electricidad.elements.tomaTelevision },
                ]}
                propertyId={propertyId}
                folder="checklist/salon"
              />
        </Card>

            {/* Climatización */}
            <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
              {t.checklist.sections.salon.climatizacion.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {t.checklist.sections.salon.climatizacion.description}
            </p>
          </div>

          <div className="space-y-4">
            {CLIMATIZATION_ITEMS.map((itemConfig) => {
              const itemsToSearch = (section.climatizationItems && section.climatizationItems.length > 0) 
                ? section.climatizationItems 
                : climatizationItems;
              const item = itemsToSearch.find(i => i.id === itemConfig.id) || {
                id: itemConfig.id,
                cantidad: 0,
              } as ChecklistClimatizationItem;
              const climatizationItem = item as ChecklistClimatizationItem;
              const cantidad = climatizationItem.cantidad || 0;
              const needsValidation = cantidad > 0;
              const hasMultipleUnits = cantidad > 1;
              const units = climatizationItem.units || [];

              return (
                <div key={item.id} className="space-y-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight break-words">
                      {t.checklist.sections.salon.climatizacion.items[itemConfig.translationKey]}
                      {cantidad > 0 && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleClimatizationQuantityChange(item.id, -1)}
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
                        onClick={() => handleClimatizationQuantityChange(item.id, 1)}
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
                                  {t.checklist.sections.salon.climatizacion.items[itemConfig.translationKey]} {index + 1} <span className="text-red-500">*</span>
                                </div>
                                
                                {/* Status Options for this unit */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                  {STATUS_OPTIONS.map((option) => {
                                    const isSelected = unit.estado === option.value;
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleClimatizationStatusChange(item.id, index, option.value)}
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
                                  <div className="space-y-4 pt-2">
                                    {/* Notes */}
                                    <div className="space-y-2">
                                      <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                        {t.checklist.notes} <span className="text-red-500">*</span>
                                      </Label>
                                      <Textarea
                                        value={unit.notes || ""}
                                        onChange={(e) => handleClimatizationNotesChange(item.id, index, e.target.value)}
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
                                          handleClimatizationPhotosChange(item.id, index, updates.photos);
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
                        // Render single estado when cantidad = 1
                        <>
                          <div className="space-y-2">
                            <div className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                              {t.checklist.sections.salon.climatizacion.items[itemConfig.translationKey]} 1 <span className="text-red-500">*</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                            {STATUS_OPTIONS.map((option) => {
                              const isSelected = climatizationItem.estado === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleClimatizationStatusChange(climatizationItem.id, null, option.value)}
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

                          {/* Notes (required when status is "necesita_reparacion" or "necesita_reemplazo") */}
                          {(climatizationItem.estado === "necesita_reparacion" || climatizationItem.estado === "necesita_reemplazo") && (
                            <div className="space-y-4 pt-2">
                              {/* Notes */}
                              <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                                  {t.checklist.notes} <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                  value={climatizationItem.notes || ""}
                                  onChange={(e) => handleClimatizationNotesChange(climatizationItem.id, null, e.target.value)}
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
                                  uploadZone={{ id: `${climatizationItem.id}-photos`, photos: climatizationItem.photos || [], videos: [] }}
                                  onUpdate={(updates) => {
                                    handleClimatizationPhotosChange(climatizationItem.id, null, updates.photos);
                                  }}
                                  isRequired={true}
                                  maxFiles={10}
                                  maxSizeMB={5}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

            {/* Mobiliario */}
            <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-semibold text-foreground leading-tight break-words">
                {t.checklist.sections.salon.mobiliario.existeMobiliario}
              </Label>
              <Switch
                checked={mobiliario.existeMobiliario || false}
                onCheckedChange={handleMobiliarioToggle}
              />
            </div>

            {mobiliario.existeMobiliario && (
              <div className="space-y-4 pt-4 border-t">
                <ChecklistQuestionComponent
                  question={mobiliario.question || { id: "mobiliario" }}
                  questionId="mobiliario"
                  label=""
                  onUpdate={handleMobiliarioQuestionUpdate}
                  elements={[]}
                  showNotes={false}
                />
                {/* Campo de notas obligatorio para describir qué mobiliario existe */}
                {(mobiliario.question?.status === "buen_estado" || mobiliario.question?.status === "necesita_reparacion" || mobiliario.question?.status === "necesita_reemplazo") && (
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
                      {t.checklist.sections.salon.mobiliario.queMobiliarioExiste} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={mobiliario.question?.notes || ""}
                      onChange={(e) => handleMobiliarioQuestionUpdate({ notes: e.target.value })}
                      placeholder="Describe qué mobiliario existe en el salón..."
                      className="min-h-[80px] text-xs sm:text-sm leading-relaxed w-full"
                      required={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
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

SalonSection.displayName = "SalonSection";
