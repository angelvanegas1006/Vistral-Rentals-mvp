"use client";

import { useState, memo } from "react";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { ChecklistData } from "@/lib/supply-checklist-storage";
import { useI18n } from "@/lib/i18n";
import { getStorageFileUrl } from "@/lib/supply-storage-supabase";
import { Eye, Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentsTabProps {
  property: PropertyWithUsers;
  checklist?: ChecklistData | null;
}

interface DocumentFile {
  name: string;
  size: number;
  url?: string;
  path?: string;
  type: string;
}

function DocumentsTabComponent({ property, checklist }: DocumentsTabProps) {
  const { t } = useI18n();
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string; type?: string } | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get property documents
  const getPropertyDocuments = (): DocumentFile[] => {
    const docs: DocumentFile[] = [];
    
    // Documentation files - notaSimpleRegistro and certificadoEnergetico are arrays directly
    if (property.data?.notaSimpleRegistro && Array.isArray(property.data.notaSimpleRegistro)) {
      property.data.notaSimpleRegistro.forEach((file: any) => {
        docs.push({
          name: file.name || "Simple note.jpg",
          size: file.size || 0,
          url: file.url,
          path: file.path,
          type: file.type || (file.name?.endsWith('.jpg') || file.name?.endsWith('.jpeg') ? "image/jpeg" : "application/pdf"),
        });
      });
    }

    if (property.data?.certificadoEnergetico && Array.isArray(property.data.certificadoEnergetico)) {
      property.data.certificadoEnergetico.forEach((file: any) => {
        docs.push({
          name: file.name || "Energy Certificate.jpg",
          size: file.size || 0,
          url: file.url,
          path: file.path,
          type: file.type || (file.name?.endsWith('.jpg') || file.name?.endsWith('.jpeg') ? "image/jpeg" : "application/pdf"),
        });
      });
    }

    return docs;
  };

  // Get rental documents
  const getRentalDocuments = (): DocumentFile[] => {
    const docs: DocumentFile[] = [];
    
    // Get rental documents from property.data.inquilino
    // These are arrays of FileUpload directly
    if (property.data?.inquilino) {
      const tenant = property.data.inquilino;
      
      // Check for rental contract files
      if (tenant.contratoArrendamiento && Array.isArray(tenant.contratoArrendamiento)) {
        tenant.contratoArrendamiento.forEach((file: any) => {
          docs.push({
            name: file.name || "Contrato propiedad.pdf",
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf",
          });
        });
      }

      // Check for payment receipts
      if (tenant.justificantesPago && Array.isArray(tenant.justificantesPago)) {
        tenant.justificantesPago.forEach((file: any) => {
          docs.push({
            name: file.name || "Justificante Enero.pdf",
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf",
          });
        });
      }

      // Check for transfer proof
      if (tenant.comprobanteTransferenciaVendedor && Array.isArray(tenant.comprobanteTransferenciaVendedor)) {
        tenant.comprobanteTransferenciaVendedor.forEach((file: any) => {
          docs.push({
            name: file.name || "Comprobante.pdf",
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf",
          });
        });
      }

      // Check for deposit proof
      if (tenant.justificanteDeposito && Array.isArray(tenant.justificanteDeposito)) {
        tenant.justificanteDeposito.forEach((file: any) => {
          docs.push({
            name: file.name || "Depósito .pdf",
            size: file.size || 0,
            url: file.url,
            path: file.path,
            type: file.type || "application/pdf",
          });
        });
      }
    }

    return docs;
  };

  const propertyDocuments = getPropertyDocuments();
  const rentalDocuments = getRentalDocuments();

  // Get file URL
  const getFileUrl = (file: DocumentFile): string | null => {
    if (file.url) return file.url;
    if (file.path) return getStorageFileUrl(file.path);
    return null;
  };

  // Handle file view
  const handleViewFile = (file: DocumentFile) => {
    const fileUrl = getFileUrl(file);
    if (fileUrl) {
      setSelectedDocument({
        url: fileUrl,
        name: file.name,
        type: file.type,
      });
    }
  };

  return (
    <div className="flex flex-row items-start gap-8 w-full">
      {/* Left Column - Documents */}
      <div className="flex flex-col justify-center items-center gap-6 w-full max-w-[800px]">
        {/* Property Documents Card */}
        <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6 flex flex-col gap-6 box-border w-full">
          <div className="flex flex-row items-start gap-3 w-full h-8">
            <h3 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px]">
              Property documents
            </h3>
          </div>
          
          <div className="flex flex-col items-start gap-2 w-full">
            {propertyDocuments.length > 0 ? (
              propertyDocuments.map((doc, index) => {
                const fileUrl = getFileUrl(doc);
                return (
                  <div
                    key={index}
                    onClick={() => fileUrl && handleViewFile(doc)}
                    className={`flex flex-col justify-center items-start p-3 gap-2.5 w-full bg-white border border-[#E4E4E7] rounded-lg transition-all ${
                      fileUrl 
                        ? "cursor-pointer hover:border-[#162EB7] hover:bg-[#F0F4FF]/30 hover:shadow-sm" 
                        : "cursor-default opacity-60"
                    }`}
                  >
                    <div className="flex flex-row items-center gap-2 w-full">
                      {/* Preview Icon */}
                      <div className="w-11 h-11 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex items-center justify-center flex-shrink-0">
                        {doc.type?.startsWith('image/') ? (
                          <span className="text-xs font-medium text-[#71717A]">IMG</span>
                        ) : (
                          <span className="text-xs font-medium text-[#71717A]">PDF</span>
                        )}
                      </div>
                      
                      {/* File Metadata */}
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                        <div className="text-base font-medium text-[#212121] leading-6 tracking-[-0.7px] truncate w-full">
                          {doc.name}
                        </div>
                        <div className="flex flex-row items-center gap-1">
                          <span className="text-sm font-normal text-[#71717A] leading-5 tracking-[-0.5px]">
                            {formatFileSize(doc.size)}
                          </span>
                        </div>
                      </div>
                      
                      {/* View Icon (visual indicator only) */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-[#162EB7]" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-[#71717A] py-4">No property documents available</div>
            )}
          </div>
        </div>

        {/* Rental Documents Card */}
        <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6 flex flex-col gap-6 box-border w-full">
          <div className="flex flex-row items-start gap-3 w-full h-8">
            <h3 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px]">
              Rental documents
            </h3>
          </div>
          
          <div className="flex flex-col items-start gap-2 w-full">
            {rentalDocuments.length > 0 ? (
              rentalDocuments.map((doc, index) => {
                const fileUrl = getFileUrl(doc);
                return (
                  <div
                    key={index}
                    onClick={() => fileUrl && handleViewFile(doc)}
                    className={`flex flex-col justify-center items-start p-3 gap-2.5 w-full bg-white border border-[#E4E4E7] rounded-lg transition-all ${
                      fileUrl 
                        ? "cursor-pointer hover:border-[#162EB7] hover:bg-[#F0F4FF]/30 hover:shadow-sm" 
                        : "cursor-default opacity-60"
                    }`}
                  >
                    <div className="flex flex-row items-center gap-2 w-full">
                      {/* Preview Icon */}
                      <div className="w-11 h-11 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg flex items-center justify-center flex-shrink-0">
                        {doc.type?.startsWith('image/') ? (
                          <span className="text-xs font-medium text-[#71717A]">IMG</span>
                        ) : (
                          <span className="text-xs font-medium text-[#71717A]">PDF</span>
                        )}
                      </div>
                      
                      {/* File Metadata */}
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                        <div className="text-base font-medium text-[#212121] leading-6 tracking-[-0.7px] truncate w-full">
                          {doc.name}
                        </div>
                        <div className="flex flex-row items-center gap-1">
                          <span className="text-sm font-normal text-[#71717A] leading-5 tracking-[-0.5px]">
                            {formatFileSize(doc.size)}
                          </span>
                        </div>
                      </div>
                      
                      {/* View Icon (visual indicator only) */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-[#162EB7]" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-[#71717A] py-4">No rental documents available</div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-[#212121] flex-1 truncate">
              {selectedDocument?.name}
            </DialogTitle>
            {selectedDocument && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    if (selectedDocument) {
                      window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#316EFF] hover:text-[#2563EB] hover:bg-[#F0F4FF] rounded-md transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (selectedDocument) {
                      const link = document.createElement('a');
                      link.href = selectedDocument.url;
                      link.download = selectedDocument.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#316EFF] hover:text-[#2563EB] hover:bg-[#F0F4FF] rounded-md transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </DialogHeader>
          <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center bg-[#F9FAFB]">
            {selectedDocument && (
              <>
                {selectedDocument.type?.startsWith('image/') ? (
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      console.error('Error loading image:', selectedDocument.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <iframe
                    src={`${selectedDocument.url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-[calc(90vh-200px)] min-h-[600px] border border-[#E5E7EB] rounded-lg bg-white shadow-sm"
                    title={selectedDocument.name}
                    onError={(e) => {
                      console.error('Error loading PDF:', selectedDocument.url);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const DocumentsTab = memo(DocumentsTabComponent);
