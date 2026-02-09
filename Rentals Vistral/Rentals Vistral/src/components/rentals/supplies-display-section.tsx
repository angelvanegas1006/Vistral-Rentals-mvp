"use client";

import { FileText, Zap, Droplets, Flame, Package } from "lucide-react";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { useState } from "react";

interface SuppliesDisplaySectionProps {
  property: {
    doc_contract_electricity?: string | null;
    doc_bill_electricity?: string | null;
    doc_contract_water?: string | null;
    doc_bill_water?: string | null;
    doc_contract_gas?: string | null;
    doc_bill_gas?: string | null;
    custom_supplies_documents?: Array<{ title: string; url: string; createdAt: string }> | null;
  };
}

interface SupplySection {
  id: string;
  name: string;
  icon: typeof Zap;
  contractUrl: string | null;
  billUrl: string | null;
  customDocs?: Array<{ title: string; url: string; createdAt: string }> | null;
}

export function SuppliesDisplaySection({ property }: SuppliesDisplaySectionProps) {
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label: "" });

  // Early return if property is null or undefined
  if (!property) {
    return null;
  }

  // Build supply sections - only include sections that have documents
  const supplySections: SupplySection[] = [];

  // Electricity section
  if (property.doc_contract_electricity || property.doc_bill_electricity) {
    supplySections.push({
      id: "electricity",
      name: "Electricidad",
      icon: Zap,
      contractUrl: property.doc_contract_electricity || null,
      billUrl: property.doc_bill_electricity || null,
    });
  }

  // Water section
  if (property.doc_contract_water || property.doc_bill_water) {
    supplySections.push({
      id: "water",
      name: "Agua",
      icon: Droplets,
      contractUrl: property.doc_contract_water || null,
      billUrl: property.doc_bill_water || null,
    });
  }

  // Gas section
  if (property.doc_contract_gas || property.doc_bill_gas) {
    supplySections.push({
      id: "gas",
      name: "Gas",
      icon: Flame,
      contractUrl: property.doc_contract_gas || null,
      billUrl: property.doc_bill_gas || null,
    });
  }

  // Other section (custom supplies)
  if (property.custom_supplies_documents && Array.isArray(property.custom_supplies_documents) && property.custom_supplies_documents.length > 0) {
    supplySections.push({
      id: "other",
      name: "Otros",
      icon: Package,
      contractUrl: null,
      billUrl: null,
      customDocs: property.custom_supplies_documents,
    });
  }

  // If no sections have documents, don't render anything
  if (supplySections.length === 0) {
    return null;
  }

  const handleDocumentClick = (url: string, label: string) => {
    setPreviewModal({ open: true, url, label });
  };

  return (
    <>
      <div className="space-y-4">
        {supplySections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  {section.name}
                </h4>
              </div>
              <div className="space-y-2 pl-6">
                {/* Contract document */}
                {section.contractUrl && (
                  <div
                    className="flex items-center gap-3 p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleDocumentClick(section.contractUrl!, `Contrato ${section.name}`)}
                  >
                    <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                        Contrato {section.name}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        {section.contractUrl.split('/').pop()?.split('?')[0] || "PDF"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bill document */}
                {section.billUrl && (
                  <div
                    className="flex items-center gap-3 p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleDocumentClick(section.billUrl!, `Factura ${section.name}`)}
                  >
                    <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                        Factura {section.name}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        {section.billUrl.split('/').pop()?.split('?')[0] || "PDF"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom documents (for "Otros" section) */}
                {section.customDocs && section.customDocs.length > 0 && (
                  <>
                    {section.customDocs.map((doc, index) => (
                      <div
                        key={`${doc.url}-${index}`}
                        className="flex items-center gap-3 p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50 cursor-pointer"
                        onClick={() => handleDocumentClick(doc.url, doc.title)}
                      >
                        <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                            {doc.title}
                          </p>
                          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {doc.url.split('/').pop()?.split('?')[0] || "PDF"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label}
      />
    </>
  );
}
