"use client";

import { useState } from "react";
import { FileText, Upload, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import type { LucideIcon } from "lucide-react";

// Type for custom document structure (stored in JSONB)
type CustomDocument = {
  title: string;
  url: string;
  createdAt?: string;
};

// Type for fixed field definition
type FixedField = {
  dbField: string;
  label: string;
  path: string;
  isArray?: boolean; // true if field stores an array of URLs
};

interface DocumentSectionProps {
  title: string;
  icon: LucideIcon;
  fixedFields: FixedField[];
  customField: string; // JSONB column name
  customPath: string; // Storage folder path for custom uploads
  property: {
    property_unique_id: string;
    [key: string]: any; // Allow any property fields
  };
  onPropertyUpdate: (updates: Record<string, any>) => void;
  hideTitle?: boolean; // Optionally hide the section title
  hideCustomDocuments?: boolean; // Optionally hide custom documents section
  searchQuery?: string; // Search query to filter documents
}

export function DocumentSection({
  title,
  icon: Icon,
  fixedFields,
  customField,
  customPath,
  property,
  onPropertyUpdate,
  hideTitle = false,
  hideCustomDocuments = false,
  searchQuery = "",
}: DocumentSectionProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState<{
    open: boolean;
    fieldName: string | null;
    isCustom: boolean;
  }>({ open: false, fieldName: null, isCustom: false });
  
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });
  
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    label: string;
    fieldName: string | null;
    fileUrl?: string;
    isCustom: boolean;
  }>({ open: false, label: "", fieldName: null, isCustom: false });

  // Get custom documents array
  const customDocuments: CustomDocument[] = (() => {
    if (!customField) return [];
    const fieldValue = property[customField];
    
    if (Array.isArray(fieldValue)) {
      return fieldValue as CustomDocument[];
    }
    // Handle null, undefined, or invalid values
    if (fieldValue === null || fieldValue === undefined) {
      return [];
    }
    // Try to parse if it's a string (shouldn't happen, but handle gracefully)
    if (typeof fieldValue === 'string') {
      try {
        const parsed = JSON.parse(fieldValue);
        return Array.isArray(parsed) ? parsed as CustomDocument[] : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  // Filter function to check if a document matches the search query
  const matchesSearch = (label: string): boolean => {
    if (!searchQuery.trim()) return true;
    return label.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  // Handle fixed document upload
  const handleFixedUpload = async (fieldName: string, file: File, isArray?: boolean) => {
    try {
      const { uploadDocument } = await import("@/lib/document-upload");
      
      if (isArray) {
        // For array fields, append to array
        const currentValue = null; // Don't replace, append
        const newUrl = await uploadDocument(fieldName, property.property_unique_id, file, currentValue);
        const currentArray = Array.isArray(property[fieldName]) 
          ? (property[fieldName] as string[])
          : [];
        onPropertyUpdate({ [fieldName]: [...currentArray, newUrl] });
      } else {
        // For single fields, replace
        const currentValue = property[fieldName] as string | null | undefined;
        const newUrl = await uploadDocument(fieldName, property.property_unique_id, file, currentValue);
        onPropertyUpdate({ [fieldName]: newUrl });
      }
      
      setUploadModalOpen({ open: false, fieldName: null, isCustom: false });
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle custom document upload
  const handleCustomUpload = async (file: File, customTitle: string) => {
    if (!customTitle.trim()) {
      alert("Por favor ingresa un título para el documento");
      return;
    }

    try {
      // Upload file using the custom field name and custom path
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", customField);
      formData.append("propertyId", property.property_unique_id);
      formData.append("customTitle", customTitle.trim());

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      const newDocument: CustomDocument = {
        title: customTitle.trim(),
        url: data.url,
        createdAt: new Date().toISOString(),
      };

      // Update local state
      const currentArray = customDocuments;
      onPropertyUpdate({ [customField]: [...currentArray, newDocument] });
      
      setUploadModalOpen({ open: false, fieldName: null, isCustom: false });
    } catch (error) {
      console.error("Failed to upload custom document:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle document delete
  const handleDelete = async () => {
    const { fieldName, fileUrl, isCustom } = deleteConfirmDialog;
    if (!fieldName || !fileUrl) return;

    try {
      const { deleteDocument } = await import("@/lib/document-upload");
      
      if (isCustom) {
        // Delete from custom documents array
        await deleteDocument(customField, property.property_unique_id, fileUrl);
        const updatedArray = customDocuments.filter(doc => doc.url !== fileUrl);
        onPropertyUpdate({ [customField]: updatedArray });
      } else {
        // Delete fixed document
        await deleteDocument(fieldName, property.property_unique_id, fileUrl);
        const field = fixedFields.find(f => f.dbField === fieldName);
        if (field?.isArray) {
          // Remove from array
          const currentArray = Array.isArray(property[fieldName]) 
            ? (property[fieldName] as string[])
            : [];
          const updatedArray = currentArray.filter(url => url !== fileUrl);
          onPropertyUpdate({ [fieldName]: updatedArray });
        } else {
          // Set to null
          onPropertyUpdate({ [fieldName]: null });
        }
      }
      
      setDeleteConfirmDialog({ open: false, label: "", fieldName: null, isCustom: false });
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Render document pill/row
  const renderDocumentPill = (
    label: string,
    url: string | null,
    onDelete?: () => void
  ) => {
    const hasDocument = url && url.trim().length > 0;

    return (
      <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => {
            if (hasDocument) {
              setPreviewModal({ open: true, url: url!, label });
            }
          }}
        >
          <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              {hasDocument ? "PDF" : "No disponible"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDocument ? (
            <>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  // This is a fixed field upload placeholder - call the function directly
                  onDelete();
                }
              }}
              className="h-8 w-8 border-2 border-dashed"
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        {!hideTitle && (
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{title}</h3>
          </div>
        )}

        {/* Fixed Documents */}
        {fixedFields.length > 0 && (
          <div className="space-y-2">
            {fixedFields
              .map((field) => {
                const value = property[field.dbField];
                const matches = matchesSearch(field.label);
                return { field, value, matches };
              })
              .sort((a, b) => {
                // When searching, show matching fields first
                if (searchQuery.trim()) {
                  if (a.matches && !b.matches) return -1;
                  if (!a.matches && b.matches) return 1;
                }
                return 0;
              })
              .filter((item) => {
                // If searching, only show matching items or items with matching array elements
                if (searchQuery.trim()) {
                  if (item.field.isArray) {
                    const arrayValue = Array.isArray(item.value) ? (item.value as string[]) : [];
                    const hasMatchingItems = arrayValue.some((url, idx) =>
                      matchesSearch(`${item.field.label} ${idx + 1}`)
                    );
                    return item.matches || hasMatchingItems;
                  }
                  return item.matches;
                }
                return true;
              })
              .map(({ field, value }) => {
                if (field.isArray) {
                  // Handle array fields (e.g., doc_renovation_files)
                  const arrayValue = Array.isArray(value) ? (value as string[]) : [];
                  // Map array items with match status and sort
                  const itemsWithMatches = arrayValue
                    .map((url, idx) => ({
                      url,
                      idx,
                      label: `${field.label} ${idx + 1}`,
                      matches: matchesSearch(`${field.label} ${idx + 1}`),
                    }))
                    .sort((a, b) => {
                      // When searching, show matching items first
                      if (searchQuery.trim()) {
                        if (a.matches && !b.matches) return -1;
                        if (!a.matches && b.matches) return 1;
                      }
                      return 0;
                    })
                    .filter((item) => {
                      // If searching, only show matching items
                      if (searchQuery.trim()) {
                        return item.matches;
                      }
                      return true;
                    });
                  
                  return (
                    <div key={field.dbField} className="space-y-2">
                      {itemsWithMatches.length > 0 ? (
                        itemsWithMatches.map((item) => (
                          <div key={item.idx}>
                            {renderDocumentPill(
                              item.label,
                              item.url,
                              () => {
                                setDeleteConfirmDialog({
                                  open: true,
                                  label: item.label,
                                  fieldName: field.dbField,
                                  fileUrl: item.url,
                                  isCustom: false,
                                });
                              }
                            )}
                          </div>
                        ))
                      ) : arrayValue.length === 0 ? (
                        <div>
                          {renderDocumentPill(
                            field.label,
                            null,
                            () => {
                              setUploadModalOpen({
                                open: true,
                                fieldName: field.dbField,
                                isCustom: false,
                              });
                            }
                          )}
                        </div>
                      ) : null}
                      {/* Add another button for arrays */}
                      {arrayValue.length > 0 && !searchQuery.trim() && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUploadModalOpen({
                              open: true,
                              fieldName: field.dbField,
                              isCustom: false,
                            });
                          }}
                          className="w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                          <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Añadir otro {field.label}</span>
                        </button>
                      )}
                    </div>
                  );
                } else {
                  // Handle single fields
                  const singleValue = value as string | null | undefined;
                  return (
                    <div key={field.dbField}>
                      {renderDocumentPill(
                        field.label,
                        singleValue || null,
                        singleValue
                          ? () => {
                              setDeleteConfirmDialog({
                                open: true,
                                label: field.label,
                                fieldName: field.dbField,
                                fileUrl: singleValue,
                                isCustom: false,
                              });
                            }
                          : () => {
                              setUploadModalOpen({
                                open: true,
                                fieldName: field.dbField,
                                isCustom: false,
                              });
                            }
                      )}
                    </div>
                  );
                }
              })}
          </div>
        )}

        {/* Custom Documents */}
        {!hideCustomDocuments && (
          <div className="space-y-2">
            {customDocuments
              .map((doc) => ({
                ...doc,
                matches: matchesSearch(doc.title),
              }))
              .sort((a, b) => {
                // When searching, show matching documents first
                if (searchQuery.trim()) {
                  if (a.matches && !b.matches) return -1;
                  if (!a.matches && b.matches) return 1;
                }
                return 0;
              })
              .filter((doc) => {
                // If searching, only show matching documents
                if (searchQuery.trim()) {
                  return doc.matches;
                }
                return true;
              })
              .map((doc, idx) => (
                <div key={idx}>
                  {renderDocumentPill(
                    doc.title,
                    doc.url,
                    () => {
                      setDeleteConfirmDialog({
                        open: true,
                        label: doc.title,
                        fieldName: customField,
                        fileUrl: doc.url,
                        isCustom: true,
                      });
                    }
                  )}
                </div>
              ))}
            
            {/* Add Custom Document Button - only show when not searching */}
            {!searchQuery.trim() && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUploadModalOpen({ open: true, fieldName: null, isCustom: true });
                }}
                className="w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Agregar documento</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen.open && (
        <DocumentUploadModal
          open={uploadModalOpen.open}
          onOpenChange={(open) => {
            if (!open) {
              setUploadModalOpen({ open: false, fieldName: null, isCustom: false });
            }
          }}
          onUpload={(file, customTitle) => {
            if (uploadModalOpen.isCustom) {
              if (!customTitle) {
                alert("Por favor ingresa un título para el documento");
                return;
              }
              handleCustomUpload(file, customTitle);
            } else if (uploadModalOpen.fieldName) {
              const field = fixedFields.find(f => f.dbField === uploadModalOpen.fieldName);
              handleFixedUpload(uploadModalOpen.fieldName, file, field?.isArray);
            }
          }}
          label={uploadModalOpen.isCustom ? "Nuevo documento" : fixedFields.find(f => f.dbField === uploadModalOpen.fieldName)?.label || ""}
          isEdit={false}
          allowCustomTitle={uploadModalOpen.isCustom}
        />
      )}

      {/* Preview Modal */}
      {previewModal.open && previewModal.url && (
        <DocumentPreviewModal
          open={previewModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewModal({ open: false, url: null, label: "" });
            }
          }}
          documentUrl={previewModal.url}
          documentName={previewModal.label}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmDialog({ open: false, label: "", fieldName: null, isCustom: false });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el documento "{deleteConfirmDialog.label}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmDialog({ open: false, label: "", fieldName: null, isCustom: false });
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
