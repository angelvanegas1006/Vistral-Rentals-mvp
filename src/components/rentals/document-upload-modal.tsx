"use client";

import { useState, useCallback, DragEvent, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, customTitle?: string) => void | Promise<void>;
  label: string;
  isEdit?: boolean; // true if replacing existing document, false if uploading new
  allowCustomTitle?: boolean; // true if user can enter a custom title for the document
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  onUpload,
  label,
  isEdit = false,
  allowCustomTitle = false,
}: DocumentUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (isValidFileType(file)) {
          setSelectedFile(file);
        }
      }
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedFile && onUpload) {
      // If custom title is required but empty, don't proceed
      if (allowCustomTitle && !customTitle.trim()) {
        return;
      }
      setIsUploading(true);
      try {
        await onUpload(selectedFile, allowCustomTitle ? customTitle.trim() : undefined);
        setSelectedFile(null);
        setCustomTitle("");
        onOpenChange(false);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    }
  }, [selectedFile, onUpload, onOpenChange, allowCustomTitle, customTitle]);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      setSelectedFile(null);
      setCustomTitle("");
      setIsDragging(false);
      onOpenChange(false);
    }
  }, [isUploading, onOpenChange]);

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const validExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const fileName = file.name.toLowerCase();
    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext))
    );
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return null;
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".pdf")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => fileName.endsWith(ext))) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden [&>button]:hidden z-50">
        <DialogTitle className="sr-only">
          {isEdit ? "Reemplazar documento" : "Subir documento"} - {label}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit
            ? `Reemplazar el documento ${label}`
            : `Subir un nuevo documento para ${label}`}
        </DialogDescription>

        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <h3 className="text-lg font-semibold">
              {isEdit ? "Reemplazar documento" : "Subir documento"}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-full"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">{label}</p>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-muted-foreground/50",
                selectedFile && "border-primary bg-primary/5"
              )}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4">
                  {getFileIcon(selectedFile)}
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">
                      Arrastra y suelta un archivo aquí
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      o haz clic para seleccionar
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Formatos soportados: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            {/* Custom Title Input - Only show when allowCustomTitle is true */}
            {allowCustomTitle && selectedFile && (
              <div className="space-y-2">
                <Label htmlFor="custom-title">Título del documento</Label>
                <Input
                  id="custom-title"
                  placeholder="Ingresa el título del documento"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Este título se mostrará en la lista de documentos
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedFile || isUploading || (allowCustomTitle && !customTitle.trim())}
              >
                {isUploading
                  ? "Subiendo..."
                  : isEdit
                  ? "Reemplazar"
                  : "Subir"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
