"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocument, deleteDocument } from "@/lib/document-upload";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";

interface DocumentUploadFieldProps {
  label: string;
  documentTitle: string; // Título que se muestra cuando hay documento (ej: "Certificado de titularidad bancaria", "Garantía de renta ilimitada de Finaer")
  fieldName: string; // Nombre del campo en la BD (ej: "client_rent_receiving_bank_certificate_url", "guarantee_file_url")
  propertyId: string;
  value: string | null; // URL del documento actual
  onUpdate: (url: string | null) => Promise<void>; // Callback para actualizar el estado en el componente padre
  onCompletionCheck?: () => Promise<void>; // Callback opcional para verificar completado de sección
  accept?: string; // Tipos de archivo aceptados (default: ".pdf,.doc,.docx")
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadField({
  label,
  documentTitle,
  fieldName,
  propertyId,
  value,
  onUpdate,
  onCompletionCheck,
  accept = ".pdf,.doc,.docx",
  disabled = false,
  className,
}: DocumentUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setUploading(true);

    try {
      const url = await uploadDocument(fieldName, propertyId, uploadedFile, value || undefined);
      await onUpdate(url);
      
      // Check completion if callback provided
      if (onCompletionCheck) {
        await onCompletionCheck();
      }
      
      // Modal will close automatically after successful upload (handled by modal itself)
    } catch (error) {
      console.error(`Error uploading ${fieldName}:`, error);
      alert(`Error al subir el documento. Por favor, inténtalo de nuevo.`);
      setFile(null);
      throw error; // Re-throw so modal doesn't close on error
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal
  const handleRemove = async () => {
    if (!value) return;

    try {
      await deleteDocument(fieldName, propertyId, value);
      setFile(null);
      await onUpdate(null);
      
      // Check completion if callback provided
      if (onCompletionCheck) {
        await onCompletionCheck();
      }
    } catch (error) {
      console.error(`Error deleting ${fieldName}:`, error);
      alert(`Error al eliminar el documento. Por favor, inténtalo de nuevo.`);
    }
  };

  // Handle file input change
  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleUpload(files[0]);
    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      const validTypes = accept.split(",").map(ext => ext.trim());
      const fileExtension = "." + uploadedFile.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(fileExtension)) {
        await handleUpload(uploadedFile);
      } else {
        alert(`Por favor, sube un archivo ${accept.replace(/\./g, "").toUpperCase()}`);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {value ? (
        <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => {
              if (value) {
                setPreviewModal({
                  open: true,
                  url: value,
                  label: documentTitle,
                });
              }
            }}
          >
            <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {documentTitle}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {file?.name || (value ? value.split('/').pop()?.split('?')[0] || "PDF" : "PDF")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            disabled={uploading || disabled}
            className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id={`${fieldName}-upload`}
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading || disabled}
          />
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            disabled={uploading || disabled}
            className={cn(
              "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
              isDragging && "bg-primary/5",
              (uploading || disabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Agregar documento
            </span>
          </button>
        </div>
      )}

      {/* Document Preview Modal - Always render to avoid hook order issues */}
      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label || documentTitle}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          setUploadModalOpen(open);
          if (!open) {
            setUploading(false);
          }
        }}
        onUpload={async (uploadedFile) => {
          try {
            await handleUpload(uploadedFile);
          } catch (error) {
            // Error ya está manejado en handleUpload
            throw error; // Re-throw para que el modal no cierre en caso de error
          }
        }}
        label={label}
        isEdit={false}
        allowCustomTitle={false}
      />
    </div>
  );
}
