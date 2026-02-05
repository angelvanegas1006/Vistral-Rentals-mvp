"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Upload, Image as ImageIcon, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreviewModal } from "./document-preview-modal";
import { DocumentUploadModal } from "./document-upload-modal";

interface SmartDocumentFieldArrayProps {
  label: string;
  value: string[] | null | undefined;
  onUpload?: (file: File) => void | Promise<void>;
  onDelete?: (fileUrl: string) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function SmartDocumentFieldArray({
  label,
  value,
  onUpload,
  onDelete,
  className,
  disabled = false,
}: SmartDocumentFieldArrayProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  // Extract array of URLs
  const files = Array.isArray(value) 
    ? value.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];

  const hasFiles = files.length > 0;

  const handleViewClick = (url: string) => {
    setPreviewUrl(url);
  };

  const handleDeleteClick = async (url: string) => {
    if (!onDelete || disabled) return;

    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este documento?");
    if (!confirmed) return;

    setDeletingUrl(url);
    try {
      await onDelete(url);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setDeletingUrl(null);
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

  const getFileIcon = (url: string) => {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => urlLower.endsWith(ext))) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return pathParts[pathParts.length - 1] || "Documento";
    } catch {
      const pathParts = url.split("/");
      return pathParts[pathParts.length - 1] || "Documento";
    }
  };

  return (
    <>
      <div className={cn("space-y-3", className)} data-field-label={label}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {/* Upload button only visible when files exist */}
          {hasFiles && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={disabled || !onUpload}
              className="h-8 gap-2"
              title="Subir documento adicional"
            >
              <Upload className="h-4 w-4" />
              <span className="text-xs">Añadir</span>
            </Button>
          )}
        </div>

        {hasFiles ? (
          /* Display all files in a grid */
          <div className="space-y-2">
            {files.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="flex items-center gap-2 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                {/* File icon and name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(url)}
                  <span className="text-sm font-medium truncate">
                    {getFileName(url)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* View button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewClick(url)}
                    disabled={disabled}
                    title="Ver documento"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(url)}
                    disabled={disabled || !onDelete || deletingUrl === url}
                    title="Eliminar documento"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state - matches SmartDocumentField */
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
            {/* Spacer to match layout when files exist (matches SmartDocumentField) */}
            <div className="h-10 w-10 flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <DocumentPreviewModal
          open={!!previewUrl}
          onOpenChange={(open) => !open && setPreviewUrl(null)}
          documentUrl={previewUrl}
          documentName={getFileName(previewUrl) || label}
        />
      )}

      {/* Document Upload Modal */}
      {onUpload && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleUploadComplete}
          label={label}
          isEdit={false} // Always adding, not replacing
        />
      )}
    </>
  );
}
