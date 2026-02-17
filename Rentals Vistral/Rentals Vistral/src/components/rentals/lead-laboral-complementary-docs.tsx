"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadLeadLaboralComplementaryDocument,
  deleteLeadLaboralDocument,
} from "@/lib/lead-document-upload";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import type { LaboralFinancialComplementaryDoc } from "@/lib/supabase/types";

const COMPLEMENTARY_DOC_TYPES = [
  "Saldo en cuenta bancaria",
  "Fondo de inversión / ahorro",
  "Fondo de pensión privado",
  "Ayudas",
  "Rentas de alquiler",
  "Otros",
] as const;

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";

function isValidFileType(file: File): boolean {
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
}

function getFileIcon(file: File | null) {
  if (!file) return null;
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".pdf")) {
    return <FileText className="h-8 w-8 text-blue-500" />;
  }
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => fileName.endsWith(ext))) {
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  }
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

interface LeadLaboralComplementaryUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadsUniqueId: string;
  onSuccess: () => void | Promise<void>;
}

function LeadLaboralComplementaryUploadModal({
  open,
  onOpenChange,
  leadId,
  leadsUniqueId,
  onSuccess,
}: LeadLaboralComplementaryUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [docTitle, setDocTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    selectedFile &&
    docType &&
    docTitle.trim() !== "";

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

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length && isValidFileType(files[0])) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length && isValidFileType(files[0])) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedFile || !docType || !canSubmit) return;
    const title = docTitle.trim();
    setIsUploading(true);
    try {
      await uploadLeadLaboralComplementaryDocument(
        leadId,
        leadsUniqueId,
        docType,
        title,
        selectedFile
      );
      await onSuccess();
      setSelectedFile(null);
      setDocType("");
      setDocTitle("");
      onOpenChange(false);
    } catch (error) {
      console.error("Upload complementary doc error:", error);
      alert("Error al subir el documento. Por favor, inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, docType, docTitle, canSubmit, leadId, leadsUniqueId, onSuccess, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      setSelectedFile(null);
      setDocType("");
      setDocTitle("");
      setIsDragging(false);
      onOpenChange(false);
    }
  }, [isUploading, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden [&>button]:hidden z-50">
        <DialogTitle className="sr-only">Agregar documento complementario</DialogTitle>
        <DialogDescription className="sr-only">
          Subir un documento complementario para Información Laboral y Financiera
        </DialogDescription>

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <h3 className="text-lg font-semibold">Subir documento</h3>
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

          <div className="p-6 space-y-4">
            {/* Upload area */}
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
                      {(selectedFile.size / 1024).toFixed(1)} KB
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Formatos: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {/* Type dropdown - shown after file selected */}
            {selectedFile && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEMENTARY_DOC_TYPES.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {docType && (
                  <div className="space-y-2">
                    <Label htmlFor="doc-title">Título del documento</Label>
                    <Input
                      id="doc-title"
                      placeholder="Ingresa el título del documento"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canSubmit || isUploading}
              >
                {isUploading ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LeadLaboralComplementaryDocsProps {
  leadId: string;
  leadsUniqueId: string;
  complementary: LaboralFinancialComplementaryDoc[];
  onRefetch: () => void | Promise<void>;
}

export function LeadLaboralComplementaryDocs({
  leadId,
  leadsUniqueId,
  complementary,
  onRefetch,
}: LeadLaboralComplementaryDocsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });

  const handleDelete = async (doc: LaboralFinancialComplementaryDoc) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await deleteLeadLaboralDocument(leadId, doc.url);
      await onRefetch();
    } catch (error) {
      console.error("Error deleting complementary doc:", error);
      alert("Error al eliminar el documento.");
    }
  };

  // Group by type for display
  const byType = complementary.reduce<Record<string, LaboralFinancialComplementaryDoc[]>>(
    (acc, doc) => {
      const key = doc.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
          Documentos complementarios
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar documento
        </Button>
      </div>

      {complementary.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay documentos complementarios. Haz clic en &quot;Agregar documento&quot; para subir uno.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byType).map(([type, docs]) => (
            <div key={type} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {type}
              </p>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.url}
                    className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-accent/50"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() =>
                        setPreviewModal({
                          open: true,
                          url: doc.url,
                          label: doc.title || doc.type,
                        })
                      }
                    >
                      <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                          {doc.title || doc.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadLaboralComplementaryUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        leadId={leadId}
        leadsUniqueId={leadsUniqueId}
        onSuccess={onRefetch}
      />

      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label}
      />
    </div>
  );
}
