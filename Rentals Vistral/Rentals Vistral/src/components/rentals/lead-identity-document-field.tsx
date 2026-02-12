"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadLeadIdentityDocument, deleteLeadIdentityDocument } from "@/lib/lead-document-upload";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";

interface LeadIdentityDocumentFieldProps {
  leadId: string;
  value: string | null;
  onUpdate: (url: string | null) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const DOCUMENT_TITLE = "Documento de identidad";
const ACCEPT = ".pdf,.doc,.docx";

export function LeadIdentityDocumentField({
  leadId,
  value,
  onUpdate,
  disabled = false,
  className,
}: LeadIdentityDocumentFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: DOCUMENT_TITLE });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setUploading(true);
    try {
      const url = await uploadLeadIdentityDocument(leadId, uploadedFile, value || undefined);
      await onUpdate(url);
    } catch (error) {
      console.error("Error uploading lead identity document:", error);
      alert("Error al subir el documento. Por favor, inténtalo de nuevo.");
      setFile(null);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    try {
      await deleteLeadIdentityDocument(leadId, value);
      setFile(null);
      await onUpdate(null);
    } catch (error) {
      console.error("Error deleting lead identity document:", error);
      alert("Error al eliminar el documento. Por favor, inténtalo de nuevo.");
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleUpload(files[0]);
    if (e.target) e.target.value = "";
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
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
    if (files?.length > 0) {
      const uploadedFile = files[0];
      const validTypes = ACCEPT.split(",").map((ext) => ext.trim());
      const fileExtension = "." + uploadedFile.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(fileExtension)) {
        await handleUpload(uploadedFile);
      } else {
        alert(`Por favor, sube un archivo ${ACCEPT.replace(/\./g, "").toUpperCase()}`);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">Documento de identidad</Label>
      {value ? (
        <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() =>
              setPreviewModal({ open: true, url: value, label: DOCUMENT_TITLE })
            }
          >
            <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {DOCUMENT_TITLE}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {file?.name || value.split("/").pop()?.split("?")[0] || "PDF"}
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
            id="lead-identity-doc-upload"
            accept={ACCEPT}
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

      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label || DOCUMENT_TITLE}
      />

      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          setUploadModalOpen(open);
          if (!open) setUploading(false);
        }}
        onUpload={async (uploadedFile) => {
          try {
            await handleUpload(uploadedFile);
          } catch (err) {
            throw err;
          }
        }}
        label="Documento de identidad"
        isEdit={false}
        allowCustomTitle={false}
      />
    </div>
  );
}
