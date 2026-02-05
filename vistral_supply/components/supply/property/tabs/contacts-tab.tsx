"use client";

import { useState, memo } from "react";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
import { Eye, Download, FileText } from "lucide-react";
import { getStorageFileUrl } from "@/lib/supply-storage-supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ContactsTabProps {
  property: PropertyWithUsers;
}

// Helper function to get initials from name
const getInitials = (name?: string): string => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to format phone number
const formatPhoneNumber = (countryCode?: string, number?: string): string => {
  if (!number) return "";
  const country = countryCode || "+34";
  return `${country} ${number}`;
};

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Uploaded 1 day ago";
    if (diffDays < 7) return `Uploaded ${diffDays} days ago`;
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

// Helper function to get file URL
const getFileUrl = (file: any): string | null => {
  if (file?.url) return file.url;
  if (file?.path) return getStorageFileUrl(file.path);
  if (file?.data) return file.data; // base64
  return null;
};

function ContactsTabComponent({ property }: ContactsTabProps) {
  const { t } = useI18n();
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string; type?: string } | null>(null);

  const vendedores = property.data?.vendedores || [];
  const inquilino = property.data?.inquilino;

  const handleViewDocument = (file: any, name: string) => {
    const url = getFileUrl(file);
    if (url) {
      setSelectedDocument({
        url,
        name: name || file.name || "Document",
        type: file.type || "application/pdf",
      });
    }
  };

  const handleDownloadDocument = (file: any, name: string) => {
    const url = getFileUrl(file);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = name || file.name || "document";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (selectedDocument) {
      window.open(selectedDocument.url, "_blank");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[800px]">
      {/* Property Owners Section */}
      {vendedores.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6">
          <h3 className="text-xl font-bold text-[#212121] mb-6">
            {t.propertyDetail.contacts.propertyOwners || "Property owners"}
          </h3>
          
          <div className="space-y-6">
            {vendedores.map((vendedor, index) => (
              <div key={index} className={index < vendedores.length - 1 ? "pb-6 border-b border-[#E4E4E7]" : ""}>
                {/* Avatar and Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-[#71717A]">
                      {getInitials(vendedor.nombreCompleto)}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-medium text-[#212121]">
                      {vendedor.nombreCompleto || "N/A"}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      {t.propertyDetail.contacts.seller || "Seller"}
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-3 mb-6">
                  {vendedor.dniNifCif && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#71717A]">
                        {t.propertyDetail.contacts.idNumber || "ID Number"}
                      </span>
                      <span className="text-sm font-medium text-[#212121]">
                        {vendedor.dniNifCif}
                      </span>
                    </div>
                  )}
                  
                  {vendedor.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#71717A]">
                        {t.propertyDetail.contacts.email || "Email"}
                      </span>
                      <span className="text-sm font-medium text-[#212121]">
                        {vendedor.email}
                      </span>
                    </div>
                  )}
                  
                  {(vendedor.telefonoPais || vendedor.telefonoNumero) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#71717A]">
                        {t.propertyDetail.contacts.phoneNumber || "Phone number"}
                      </span>
                      <span className="text-sm font-medium text-[#212121]">
                        {formatPhoneNumber(vendedor.telefonoPais, vendedor.telefonoNumero)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Seller Documents */}
                {vendedor.dniAdjunto && vendedor.dniAdjunto.length > 0 && (
                  <div className="pt-4 border-t border-[#E4E4E7]">
                    <h4 className="text-sm font-semibold text-[#212121] mb-3">
                      {t.propertyDetail.contacts.documents || "Documents"}
                    </h4>
                    {vendedor.dniAdjunto.map((file, fileIndex) => (
                      <div 
                        key={fileIndex} 
                        onClick={() => handleViewDocument(file, file.name || `DNI Seller - ${vendedor.nombreCompleto}`)}
                        className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg mb-2 cursor-pointer hover:bg-[#F0F4FF] transition-colors last:mb-0"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-[#71717A] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#212121] truncate">
                              {file.name || `DNI Seller - ${vendedor.nombreCompleto}`}
                            </div>
                            {file.uploadedAt && (
                              <div className="text-xs text-[#71717A]">
                                {formatDate(file.uploadedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(file, file.name || `DNI Seller - ${vendedor.nombreCompleto}`);
                            }}
                            className="p-1.5 hover:bg-[#E0E7FF] rounded transition-colors"
                            aria-label="View document"
                          >
                            <Eye className="w-4 h-4 text-[#162EB7]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(file, file.name || `DNI Seller - ${vendedor.nombreCompleto}`);
                            }}
                            className="p-1.5 hover:bg-[#E0E7FF] rounded transition-colors"
                            aria-label="Download document"
                          >
                            <Download className="w-4 h-4 text-[#162EB7]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenant Information Section */}
      {inquilino && (
        <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6">
          <h3 className="text-xl font-bold text-[#212121] mb-6">
            {t.propertyDetail.contacts.tenantInformation || "Tenant information"}
          </h3>

          {/* Avatar and Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-[#71717A]">
                {getInitials(inquilino.nombreCompleto)}
              </span>
            </div>
            <div>
              <div className="text-base font-medium text-[#212121]">
                {inquilino.nombreCompleto || "N/A"}
              </div>
              <div className="text-sm text-[#71717A]">
                {t.propertyDetail.contacts.tenant || "Tenant"}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 mb-6">
            {inquilino.dniNie && inquilino.dniNie.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  {t.propertyDetail.contacts.idNumber || "ID Number"}
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {inquilino.dniNie[0]?.name || "N/A"}
                </span>
              </div>
            )}
            
            {inquilino.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  {t.propertyDetail.contacts.email || "Email"}
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {inquilino.email}
                </span>
              </div>
            )}
            
            {(inquilino.telefonoPais || inquilino.telefonoNumero) && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#71717A]">
                  {t.propertyDetail.contacts.phoneNumber || "Phone number"}
                </span>
                <span className="text-sm font-medium text-[#212121]">
                  {formatPhoneNumber(inquilino.telefonoPais, inquilino.telefonoNumero)}
                </span>
              </div>
            )}
          </div>

          {/* Tenant Documents */}
          {inquilino.dniNie && inquilino.dniNie.length > 0 && (
            <div className="pt-4 border-t border-[#E4E4E7]">
              <h4 className="text-sm font-semibold text-[#212121] mb-3">
                {t.propertyDetail.contacts.documents || "Documents"}
              </h4>
              {inquilino.dniNie.map((file, index) => (
                <div 
                  key={index} 
                  onClick={() => handleViewDocument(file, file.name || `DNI Tenant - ${inquilino.nombreCompleto}`)}
                  className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg mb-2 cursor-pointer hover:bg-[#F0F4FF] transition-colors last:mb-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-[#71717A] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#212121] truncate">
                        {file.name || `DNI Tenant - ${inquilino.nombreCompleto}`}
                      </div>
                      {file.uploadedAt && (
                        <div className="text-xs text-[#71717A]">
                          {formatDate(file.uploadedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(file, file.name || `DNI Tenant - ${inquilino.nombreCompleto}`);
                      }}
                      className="p-1.5 hover:bg-[#E0E7FF] rounded transition-colors"
                      aria-label="View document"
                    >
                      <Eye className="w-4 h-4 text-[#162EB7]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(file, file.name || `DNI Tenant - ${inquilino.nombreCompleto}`);
                      }}
                      className="p-1.5 hover:bg-[#E0E7FF] rounded transition-colors"
                      aria-label="Download document"
                    >
                      <Download className="w-4 h-4 text-[#162EB7]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {vendedores.length === 0 && !inquilino && (
        <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-12 text-center">
          <p className="text-[#71717A]">
            {t.propertyDetail.contacts.noContacts || "No contact information available"}
          </p>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedDocument.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedDocument.type?.startsWith("image/") ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[70vh] border-0"
                  title={selectedDocument.name}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 text-sm font-medium text-[#162EB7] hover:bg-[#F0F4FF] rounded transition-colors"
              >
                Open in new tab
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = selectedDocument.url;
                  link.download = selectedDocument.name;
                  link.click();
                }}
                className="px-4 py-2 text-sm font-medium text-[#162EB7] hover:bg-[#F0F4FF] rounded transition-colors"
              >
                Download
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export const ContactsTab = memo(ContactsTabComponent);
