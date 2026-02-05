"use client";

import { useState, memo } from "react";
import { PropertyWithUsers } from "@/lib/supply-property-supabase";
import { useI18n } from "@/lib/i18n";
import { getStorageFileUrl } from "@/lib/supply-storage-supabase";
import { FileText, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RentalTabProps {
  property: PropertyWithUsers;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Helper function to get file URL
const getFileUrl = (file: any): string | null => {
  if (file?.url) return file.url;
  if (file?.path) return getStorageFileUrl(file.path);
  if (file?.data) return file.data; // base64
  return null;
};

function RentalTabComponent({ property }: RentalTabProps) {
  const { t } = useI18n();
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string; type?: string } | null>(null);

  const isRented = property.data?.propiedadAlquilada;
  const tenant = property.data?.inquilino;

  if (!isRented) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t.propertyDetail.rental.notRented || "This property is not currently rented."}
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t.propertyDetail.rental.noTenantData || "No tenant data available."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract terms and conditions */}
      <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6">
        <h3 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px] mb-6">
          {t.tenantFields.contractTermsAndConditions || "Contract terms and conditions"}
        </h3>
        
        <div className="space-y-4">
          {/* Fecha de finalización */}
          {tenant.fechaFinalizacionContrato && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.contractEndDate || "Fecha de finalización"}
              </div>
              <div className="text-sm text-[#212121]">
                {formatDate(tenant.fechaFinalizacionContrato)}
              </div>
            </div>
          )}

          {/* Periodo de preaviso */}
          {tenant.periodoPreaviso !== undefined && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.noticePeriod || "Periodo de preaviso"}
              </div>
              <div className="text-sm text-[#212121]">
                {tenant.periodoPreaviso} {t.tenantFields.days || "days"}
              </div>
            </div>
          )}

          {/* Subrogación del contrato */}
          {tenant.subrogacionContrato && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.contractSubrogation || "Subrogación del contrato"}
              </div>
              <div className="text-sm text-[#212121]">
                {tenant.subrogacionContrato === "Con subrogación"
                  ? t.tenantFields.subrogationOptions?.withSubrogation || "Con subrogación"
                  : t.tenantFields.subrogationOptions?.withoutSubrogation || "Sin subrogación"}
              </div>
            </div>
          )}

          {/* Contrato de arrendamiento files */}
          {tenant.contratoArrendamiento && tenant.contratoArrendamiento.length > 0 && (
            <div className="mt-4 space-y-2">
              {tenant.contratoArrendamiento.map((file: any, index: number) => {
                const fileUrl = getFileUrl(file);
                return (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#71717A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#212121] truncate">{file.name}</p>
                        <p className="text-xs text-[#71717A]">{formatFileSize(file.size || 0)}</p>
                      </div>
                    </div>
                    {fileUrl && (
                      <button
                        onClick={() => setSelectedDocument({ url: fileUrl, name: file.name, type: file.type })}
                        className="text-[#316EFF] hover:text-[#2563EB] p-1 rounded transition-colors flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment management and settlement */}
      <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6">
        <h3 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px] mb-6">
          {t.tenantFields.paymentManagementAndSettlement || "Payment management and settlement"}
        </h3>
        
        <div className="space-y-4">
          {/* Importe del alquiler a transferir */}
          {tenant.importeAlquilerTransferir !== undefined && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.rentalAmountToTransfer || "Importe del alquiler a transferir (al comprador)"}
              </div>
              <div className="text-sm text-[#212121]">
                {tenant.importeAlquilerTransferir.toLocaleString("es-ES")}€
              </div>
            </div>
          )}

          {/* Fecha del último recibo */}
          {tenant.fechaUltimoRecibo && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.lastReceiptDate || "Fecha del último recibo"}
              </div>
              <div className="text-sm text-[#212121]">
                {formatDate(tenant.fechaUltimoRecibo)}
              </div>
            </div>
          )}

          {/* Justificantes de pago */}
          {tenant.justificantesPago && tenant.justificantesPago.length > 0 && (
            <div className="mt-4 space-y-2">
              {tenant.justificantesPago.map((file: any, index: number) => {
                const fileUrl = getFileUrl(file);
                return (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#71717A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#212121] truncate">{file.name}</p>
                        <p className="text-xs text-[#71717A]">{formatFileSize(file.size || 0)}</p>
                      </div>
                    </div>
                    {fileUrl && (
                      <button
                        onClick={() => setSelectedDocument({ url: fileUrl, name: file.name, type: file.type })}
                        className="text-[#316EFF] hover:text-[#2563EB] p-1 rounded transition-colors flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Comprobante de transferencia del vendedor */}
          {tenant.comprobanteTransferenciaVendedor && tenant.comprobanteTransferenciaVendedor.length > 0 && (
            <div className="mt-4 space-y-2">
              {tenant.comprobanteTransferenciaVendedor.map((file: any, index: number) => {
                const fileUrl = getFileUrl(file);
                return (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#71717A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#212121] truncate">{file.name}</p>
                        <p className="text-xs text-[#71717A]">{formatFileSize(file.size || 0)}</p>
                      </div>
                    </div>
                    {fileUrl && (
                      <button
                        onClick={() => setSelectedDocument({ url: fileUrl, name: file.name, type: file.type })}
                        className="text-[#316EFF] hover:text-[#2563EB] p-1 rounded transition-colors flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Justificante del depósito */}
          {tenant.justificanteDeposito && tenant.justificanteDeposito.length > 0 && (
            <div className="mt-4 space-y-2">
              {tenant.justificanteDeposito.map((file: any, index: number) => {
                const fileUrl = getFileUrl(file);
                return (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#71717A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#212121] truncate">{file.name}</p>
                        <p className="text-xs text-[#71717A]">{formatFileSize(file.size || 0)}</p>
                      </div>
                    </div>
                    {fileUrl && (
                      <button
                        onClick={() => setSelectedDocument({ url: fileUrl, name: file.name, type: file.type })}
                        className="text-[#316EFF] hover:text-[#2563EB] p-1 rounded transition-colors flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rental coverage and insurance */}
      <div className="bg-white rounded-lg border border-[#E4E4E7] shadow-sm p-6">
        <h3 className="text-2xl font-medium text-[#212121] leading-8 tracking-[-1.5px] mb-6">
          {t.tenantFields.rentalCoverageAndInsurance || "Rental coverage and insurance"}
        </h3>
        
        <div className="space-y-4">
          {/* Estado del seguro de alquiler */}
          {tenant.estadoSeguroAlquiler && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.rentalInsuranceStatus || "Seguro de alquiler"}
              </div>
              <div className="text-sm text-[#212121]">
                {tenant.estadoSeguroAlquiler === "En vigor"
                  ? t.tenantFields.insuranceStatusOptions?.inForce || "En vigor"
                  : t.tenantFields.insuranceStatusOptions?.expired || "Vencido"}
              </div>
            </div>
          )}

          {/* Proveedor del seguro */}
          {tenant.proveedorSeguroAlquiler && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.rentalInsuranceProvider || "Proveedor"}
              </div>
              <div className="text-sm text-[#212121]">
                {tenant.proveedorSeguroAlquiler}
              </div>
            </div>
          )}

          {/* Fecha de vencimiento */}
          {tenant.fechaVencimientoSeguroAlquiler && (
            <div>
              <div className="text-sm font-medium text-[#71717A] mb-1">
                {t.tenantFields.rentalInsuranceExpiryDate || "Fecha de vencimiento"}
              </div>
              <div className="text-sm text-[#212121]">
                {formatDate(tenant.fechaVencimientoSeguroAlquiler)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="mt-4">
              {selectedDocument.type?.startsWith("image/") ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[600px] rounded-lg border"
                  title={selectedDocument.name}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const RentalTab = memo(RentalTabComponent);
