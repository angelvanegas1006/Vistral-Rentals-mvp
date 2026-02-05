"use client";

import React, { useMemo, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Wrench, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistStatus, ChecklistQuestion as ChecklistQuestionType, ChecklistUploadZone as ChecklistUploadZoneType } from "@/lib/supply-checklist-storage";
import { ChecklistUploadZone as ChecklistUploadZoneComponent } from "./checklist-upload-zone";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChecklistQuestionProps {
  question: ChecklistQuestionType;
  questionId: string;
  label: string;
  description?: string;
  onUpdate: (updates: Partial<ChecklistQuestionType>) => void;
  showPhotos?: boolean;
  showNotes?: boolean;
  elements?: Array<{ id: string; label: string }>; // Specific elements for this question
  readOnly?: boolean; // Si es true, el componente es solo lectura
  propertyId?: string; // Property ID for organizing files in Storage
  folder?: string; // Folder name in Storage
  isRequired?: boolean; // Si es true, muestra asterisco en el título
}

// Status options will be created using translations

export function ChecklistQuestion({
  question,
  questionId,
  label,
  description,
  onUpdate,
  showPhotos = true,
  showNotes = true,
  elements = [],
  readOnly = false,
  propertyId,
  folder,
  isRequired = false,
}: ChecklistQuestionProps) {
  const { t } = useI18n();
  
  // No default status - questions should start unselected
  const questionStatus = question?.status;
  const requiresDetails = questionStatus === "necesita_reparacion" || questionStatus === "necesita_reemplazo";
  
  const handleBadElementToggle = (elementId: string) => {
    if (!question) return;
    const currentElements = question.badElements || [];
    const updatedElements = currentElements.includes(elementId)
      ? currentElements.filter(id => id !== elementId)
      : [...currentElements, elementId];
    onUpdate({ badElements: updatedElements });
  };

  const STATUS_OPTIONS: Array<{
    value: ChecklistStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      value: "buen_estado",
      label: t.checklist.buenEstado,
      icon: ThumbsUp,
    },
    {
      value: "necesita_reparacion",
      label: t.checklist.necesitaReparacion,
      icon: Wrench,
    },
    {
      value: "necesita_reemplazo",
      label: t.checklist.necesitaReemplazo,
      icon: ThumbsDown,
    },
    {
      value: "no_aplica",
      label: t.checklist.noAplica,
      icon: XCircle,
    },
  ];

  const handleStatusChange = (status: ChecklistStatus) => {
    if (!question) return;
    
    // If status is "no_aplica", clear badElements, notes, and photos
    if (status === "no_aplica") {
      const updates = { 
        status, 
        badElements: undefined, 
        notes: undefined, 
        photos: undefined 
      };
      onUpdate(updates);
    } else if (status === "buen_estado") {
      // For "buen_estado", clear badElements and photos, but keep notes (needed for mobiliario)
      const updates = { 
        status, 
        badElements: undefined, 
        photos: undefined 
        // Keep notes - don't clear them
      };
      onUpdate(updates);
    } else {
      // For "necesita_reparacion" or "necesita_reemplazo", keep existing data but update status
      const updates = { status };
      onUpdate(updates);
    }
  };

  const handleNotesChange = (notes: string) => {
    if (!question) return;
    onUpdate({ notes });
  };

  // Convert photos array to uploadZone format for ChecklistUploadZone component
  const uploadZone: ChecklistUploadZoneType = useMemo(() => {
    // Ensure photos is always an array
    const photos = Array.isArray(question?.photos) ? question.photos : [];
    return {
      id: `${questionId}-photos`,
      photos,
      videos: [], // Questions don't support videos currently
    };
  }, [questionId, question?.photos]);

  const handleUploadZoneUpdate = useCallback((updates: ChecklistUploadZoneType) => {
    // Ensure photos is always an array
    const photos = Array.isArray(updates?.photos) ? updates.photos : [];
    onUpdate({ photos });
  }, [onUpdate]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground leading-tight break-words">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed break-words">{description}</p>
        )}
      </div>

      {/* Status Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = questionStatus !== undefined && questionStatus === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !readOnly && handleStatusChange(option.value)}
              disabled={readOnly}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2.5 h-10 rounded-lg border transition-colors w-full",
                isSelected
                  ? "border-[#E4E4E7] dark:border-[#525252] bg-black/4 dark:bg-white/16"
                  : "border-[#E4E4E7] dark:border-[#525252] bg-white dark:bg-[#1A1A1A] hover:bg-[#FAFAFA] dark:hover:bg-[#262626]",
                readOnly && "opacity-60 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 text-[#212121] dark:text-[#FFFFFF]")} />
              <span className={cn("text-sm font-medium text-center leading-tight text-[#212121] dark:text-[#FFFFFF]")}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bad Elements Checkboxes (shown when status is "necesita_reparacion" or "necesita_reemplazo") */}
      {requiresDetails && elements.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
            {t.checklist.whatElementsBadCondition}
          </Label>
          <div className="space-y-2">
            {elements.map((element) => (
              <div key={element.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${questionId}-${element.id}`}
                  checked={question?.badElements?.includes(element.id) || false}
                  onCheckedChange={() => handleBadElementToggle(element.id)}
                />
                <label
                  htmlFor={`${questionId}-${element.id}`}
                  className="text-xs sm:text-sm font-medium text-foreground leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words"
                >
                  {element.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes (required when status is "necesita_reparacion" or "necesita_reemplazo") */}
      {showNotes && requiresDetails && (
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-medium text-foreground leading-tight break-words">
            {t.checklist.notes} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={question?.notes || ""}
            onChange={(e) => !readOnly && handleNotesChange(e.target.value)}
            placeholder={t.checklist.observationsPlaceholder}
            className="min-h-[80px] text-xs sm:text-sm leading-relaxed w-full"
            required={requiresDetails}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Photos (required when status is "necesita_reparacion" or "necesita_reemplazo") */}
      {showPhotos && requiresDetails && (
        <div className="space-y-2">
          <ChecklistUploadZoneComponent
            title="Fotos"
            description="Añade fotos del problema o elemento que necesita reparación/reemplazo"
            uploadZone={uploadZone}
            onUpdate={handleUploadZoneUpdate}
            isRequired={requiresDetails}
            maxFiles={10}
            maxSizeMB={5}
            readOnly={readOnly}
            propertyId={propertyId}
            folder={folder}
          />
        </div>
      )}
    </div>
  );
}
