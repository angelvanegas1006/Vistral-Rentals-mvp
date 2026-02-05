"use client";

import { forwardRef, useCallback } from "react";
import { Info, Upload, X, Camera, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PropertyData, FileUpload } from "@/lib/supply-property-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFormState } from "@/hooks/useFormState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useI18n } from "@/lib/i18n";

interface DocumentacionSectionProps {
  data: PropertyData;
  onUpdate: (updates: Partial<PropertyData>) => void;
  onContinue?: () => void;
  propertyId?: string; // Property ID for organizing files in Storage
}

const MAX_FILE_SIZE = 64; // MB
const ACCEPTED_TYPES = [
  "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm",
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "application/pdf"
];

export const DocumentacionSection = forwardRef<HTMLDivElement, DocumentacionSectionProps>(
  ({ data, onUpdate, onContinue, propertyId }, ref) => {
    const { t } = useI18n();
    // Use form state hook for controlled components
    const { formData, updateField } = useFormState({
      initialData: data,
      onUpdate,
    });

    // File upload hooks for each type
    const notaSimpleUpload = useFileUpload({
      maxFileSize: MAX_FILE_SIZE,
      acceptedTypes: ACCEPTED_TYPES,
      propertyId,
      folder: "documentation",
      uploadToStorage: !!propertyId, // Enable Storage upload if propertyId is provided
      onFilesChange: (files) => updateField("notaSimpleRegistro", files),
    });

    const certificadoUpload = useFileUpload({
      maxFileSize: MAX_FILE_SIZE,
      acceptedTypes: ACCEPTED_TYPES,
      propertyId,
      folder: "documentation",
      uploadToStorage: !!propertyId, // Enable Storage upload if propertyId is provided
      onFilesChange: (files) => updateField("certificadoEnergetico", files),
    });

    // Memoized handlers (removed videoGeneral handlers)

    const renderDropZone = useCallback((
      field: "notaSimpleRegistro" | "certificadoEnergetico",
      title: string,
      description: string,
      isRequired: boolean,
      isOptional?: boolean
    ) => {
      const files = formData[field] || [];
      const uploadHook = field === "notaSimpleRegistro" ? notaSimpleUpload : 
                        certificadoUpload;

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {title} {isRequired && <span className="text-red-500">*</span>}
              {isOptional && <span className="text-xs text-muted-foreground font-normal ml-1">({t.formLabels.optional})</span>}
            </Label>
            <span className="text-xs text-muted-foreground">
              {files.length} {t.formLabels.files}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">{description}</p>

          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              uploadHook.isDragOver
                ? "border-[var(--prophero-blue-500)] bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/20"
                : "border-[var(--prophero-gray-300)] dark:border-[var(--prophero-gray-600)] hover:border-[var(--prophero-gray-400)] dark:hover:border-[var(--prophero-gray-500)]"
            )}
            onDragOver={uploadHook.handleDragOver}
            onDragLeave={uploadHook.handleDragLeave}
            onDrop={uploadHook.handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto text-[var(--prophero-gray-400)] mb-2" />
            <p className="text-sm text-[var(--prophero-gray-600)] dark:text-[var(--prophero-gray-400)] mb-2">
              {t.formLabels.dragDropFiles}
            </p>
            <p className="text-xs text-[var(--prophero-gray-500)] dark:text-[var(--prophero-gray-500)]">
              {t.formLabels.maxFileSize.replace("{size}", MAX_FILE_SIZE.toString())}
            </p>
            
            {/* Hidden file input */}
            <input
              ref={uploadHook.fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              onChange={uploadHook.handleFileSelect}
              className="hidden"
            />

            {/* Mobile camera/video buttons */}
            <div className="flex gap-2 justify-center mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => uploadHook.fileInputRef.current?.click()}
                className="flex items-center gap-1"
              >
                <Camera className="h-4 w-4" />
                {t.formLabels.photo}
              </Button>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id || index}
                  className="flex items-center justify-between p-3 bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-800)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-[var(--prophero-gray-500)]" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-[var(--prophero-gray-500)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => uploadHook.removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Error display */}
          {uploadHook.error && (
            <p className="text-sm text-red-500">{uploadHook.error}</p>
          )}
        </div>
      );
        }, [formData, notaSimpleUpload, certificadoUpload, t.formLabels]);

    return (
      <div ref={ref} className="bg-card dark:bg-[var(--prophero-gray-900)] rounded-lg border p-6 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t.property.sections.documentation}</h1>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-[var(--prophero-blue-50)] dark:bg-[var(--prophero-blue-950)]/20 border border-[var(--prophero-blue-200)] dark:border-[var(--prophero-blue-800)] rounded-lg">
          <Info className="h-5 w-5 text-[var(--prophero-blue-600)] dark:text-[var(--prophero-blue-400)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--prophero-blue-900)] dark:text-[var(--prophero-blue-200)]">
              {t.sectionInfo.optionalFields}
            </p>
            <p className="text-sm text-[var(--prophero-blue-800)] dark:text-[var(--prophero-blue-300)] mt-1">
              {t.sectionInfo.optionalFieldsDescription}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Nota Simple del Registro */}
          {renderDropZone(
            "notaSimpleRegistro",
            t.propertyFields.notaSimple,
            t.propertyFields.notaSimpleDescription,
            false,
            true
          )}

          {/* Certificado energético */}
          {renderDropZone(
            "certificadoEnergetico",
            t.propertyFields.energyCertificate,
            t.propertyFields.energyCertificateDescription,
            false,
            true
          )}
        </div>

        {/* Navigation */}
        {onContinue && (
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                window.history.back();
              }}
              className="flex items-center gap-2 text-sm font-medium text-[#162EB7] dark:text-[#5B8FFF] hover:opacity-80 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.526 3.862C9.7863 3.6017 10.2084 3.6017 10.4687 3.862C10.729 4.1224 10.729 4.5444 10.4687 4.8047L6.9401 8.3334H14.664C15.0322 8.3334 15.3307 8.6319 15.3307 9C15.3307 9.3682 15.0322 9.6667 14.664 9.6667H6.9401L10.4687 13.1953C10.729 13.4557 10.729 13.8777 10.4687 14.1381C10.2084 14.3984 9.7863 14.3984 9.526 14.1381L4.8593 9.4714C4.599 9.211 4.599 8.789 4.8593 8.5287L9.526 3.862Z" fill="currentColor"/>
              </svg>
              {t.common.back || "Atrás"}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate(formData);
                onContinue();
              }}
              className="px-6 py-2 h-9 bg-[#D9E7FF] dark:bg-[#1B36A3] text-[#162EB7] dark:text-[#5B8FFF] rounded-full font-medium text-sm hover:bg-[#C4D9FF] dark:hover:bg-[#2246CC] transition-colors"
            >
              {t.property.sections.nextSection || "Siguiente sección"}
            </button>
          </div>
        )}
      </div>
    );
  }
);

DocumentacionSection.displayName = "DocumentacionSection";
