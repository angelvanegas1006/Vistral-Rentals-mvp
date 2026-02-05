"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreviewModal } from "./document-preview-modal";
import { DocumentUploadModal } from "./document-upload-modal";

interface SmartDocumentFieldProps {
  label: string;
  value: string | null | undefined;
  onUpload?: (file: File) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function SmartDocumentField({
  label,
  value,
  onUpload,
  onDelete,
  className,
  disabled = false,
}: SmartDocumentFieldProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ALWAYS RENDER: Component must never return null
  // Check if document exists (value is not null/empty)
  const hasDocument = value && value.trim().length > 0;

  const handleViewClick = () => {
    if (hasDocument) {
      setPreviewOpen(true);
    }
  };

  const handleEditClick = () => {
    if (!disabled && onUpload) {
      setUploadModalOpen(true);
    }
  };

  const handleUploadClick = () => {
    if (!disabled && onUpload) {
      setUploadModalOpen(true);
    }
  };

  const handleUploadComplete = async (file: File) => {
    if (onUpload) {
      await onUpload(file);
      setUploadModalOpen(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete || disabled) return;

    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este documento?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    if (!value) return null;
    const url = value.toLowerCase();
    if (url.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => url.endsWith(ext))) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileName = () => {
    if (!value) return "";
    try {
      const url = new URL(value);
      const pathParts = url.pathname.split("/");
      return pathParts[pathParts.length - 1] || "Documento";
    } catch {
      const pathParts = value.split("/");
      return pathParts[pathParts.length - 1] || "Documento";
    }
  };

  // ALWAYS RENDER - Component must never return null
  return (
    <>
      <div className={cn("space-y-2", className)} data-field-label={label}>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        
        {hasDocument ? (
          /* Mode B: Value Exists - Show filename button + edit button + delete button */
          <div className="flex items-center gap-2">
            {/* Button 1: View - Filename button (NO Eye Icon) */}
            <Button
              variant="outline"
              onClick={handleViewClick}
              disabled={disabled}
              className="flex-1 justify-start gap-2 h-10"
              title="Ver documento"
            >
              {getFileIcon()}
              <span className="text-sm font-medium truncate">{getFileName()}</span>
            </Button>
            {/* Button 2: Edit - Pencil Icon */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleEditClick}
              disabled={disabled || !onUpload}
              title="Reemplazar documento"
              className="h-10 w-10 flex-shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {/* Button 3: Delete - Trash Icon */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleDeleteClick}
              disabled={disabled || !onDelete || isDeleting}
              title="Eliminar documento"
              className="h-10 w-10 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Mode A: Value is NULL/Empty - Upload Button (same size as document + edit buttons) */
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={disabled || !onUpload}
              className={cn(
                "flex-1 justify-center gap-2 h-10 border-2 border-dashed",
                "hover:border-primary hover:bg-accent/50",
                "transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title="Subir documento"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Subir Documento
              </span>
            </Button>
            {/* Spacer to match edit button width */}
            <div className="h-10 w-10 flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {hasDocument && (
        <DocumentPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          documentUrl={value}
          documentName={getFileName() || label}
        />
      )}

      {/* Document Upload Modal */}
      {onUpload && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleUploadComplete}
          label={label}
          isEdit={hasDocument}
        />
      )}
    </>
  );
}
