"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Shield, Zap, Search } from "lucide-react";
import { DocumentSection } from "@/components/ui/DocumentSection";
import { DOCUMENT_LABELS } from "@/lib/document-labels";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyDocumentsTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: PropertyRow | null;
}

export function PropertyDocumentsTab({ propertyId, currentPhase, property }: PropertyDocumentsTabProps) {
  const [localProperty, setLocalProperty] = useState(property);
  const [searchQuery, setSearchQuery] = useState("");

  // Update local property when prop changes
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  if (!localProperty) {
    return <div>Cargando...</div>;
  }

  // Helper function to check if a document label matches search
  const matchesSearch = (label: string): boolean => {
    if (!searchQuery.trim()) return true;
    return label.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  // Check if there are any visible documents
  const hasVisibleDocuments = (): boolean => {
    if (!searchQuery.trim()) return true;
    
    // Check fixed fields
    const allFixedFields = [
      { dbField: "home_insurance_policy_url", label: DOCUMENT_LABELS.HOME_INSURANCE_POLICY },
      { dbField: "doc_energy_cert", label: DOCUMENT_LABELS.ENERGY_CERTIFICATE },
      { dbField: "doc_renovation_files", label: DOCUMENT_LABELS.RENOVATION_FILES },
      { dbField: "doc_purchase_contract", label: DOCUMENT_LABELS.PURCHASE_CONTRACT },
      { dbField: "doc_land_registry_note", label: DOCUMENT_LABELS.LAND_REGISTRY_NOTE },
      { dbField: "property_management_plan_contract_url", label: DOCUMENT_LABELS.PROPERTY_MANAGEMENT_CONTRACT },
      { dbField: "doc_contract_electricity", label: DOCUMENT_LABELS.CONTRACT_ELECTRICITY },
      { dbField: "doc_bill_electricity", label: DOCUMENT_LABELS.BILL_ELECTRICITY },
      { dbField: "doc_contract_water", label: DOCUMENT_LABELS.CONTRACT_WATER },
      { dbField: "doc_bill_water", label: DOCUMENT_LABELS.BILL_WATER },
      { dbField: "doc_contract_gas", label: DOCUMENT_LABELS.CONTRACT_GAS },
      { dbField: "doc_bill_gas", label: DOCUMENT_LABELS.BILL_GAS },
    ];
    
    const hasMatchingFixedField = allFixedFields.some(field => matchesSearch(field.label));
    
    // Check custom documents
    const customFields = [
      "custom_insurance_documents",
      "custom_technical_documents",
      "custom_legal_documents",
      "custom_supplies_documents",
      "property_custom_other_documents",
    ];
    
    const hasMatchingCustomDoc = customFields.some(fieldName => {
      const docs = Array.isArray(localProperty[fieldName]) ? localProperty[fieldName] : [];
      return docs.some((doc: any) => matchesSearch(doc.title || ""));
    });
    
    return hasMatchingFixedField || hasMatchingCustomDoc;
  };

  return (
    <div className="space-y-6">
      {/* Buscador de archivos */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
          <Input
            type="text"
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-input rounded-lg w-full"
          />
        </div>
      </Card>

      {/* Mensaje cuando no hay resultados */}
      {searchQuery.trim() && !hasVisibleDocuments() && (
        <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-8 shadow-sm">
          <div className="text-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              No se encontraron documentos que coincidan con "{searchQuery}"
            </p>
          </div>
        </Card>
      )}

      {/* Documentación Legal */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Documentación Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentSection
            title="Documentación Legal"
            icon={FileText}
            fixedFields={[
              {
                dbField: "doc_purchase_contract",
                label: DOCUMENT_LABELS.PURCHASE_CONTRACT,
                path: "property/legal/purchase_contract",
              },
              {
                dbField: "doc_land_registry_note",
                label: DOCUMENT_LABELS.LAND_REGISTRY_NOTE,
                path: "property/legal/land_registry_note",
              },
              {
                dbField: "property_management_plan_contract_url",
                label: DOCUMENT_LABELS.PROPERTY_MANAGEMENT_CONTRACT,
                path: "property/legal/property_management_plan_contract",
              },
            ]}
            customField="custom_legal_documents"
            customPath="property/legal/custom"
            property={localProperty}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
            hideTitle={true}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>

      {/* Documentación Técnica */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Documentación Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentSection
            title="Documentación Técnica"
            icon={FileText}
            fixedFields={[
              {
                dbField: "doc_energy_cert",
                label: DOCUMENT_LABELS.ENERGY_CERTIFICATE,
                path: "property/technical/energy_certificate",
              },
              {
                dbField: "doc_renovation_files",
                label: DOCUMENT_LABELS.RENOVATION_FILES,
                path: "property/technical/renovation",
                isArray: true,
              },
            ]}
            customField="custom_technical_documents"
            customPath="property/technical/custom"
            property={localProperty}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
            hideTitle={true}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>

      {/* Seguro de Hogar */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Seguro de Hogar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentSection
            title="Seguro de Hogar"
            icon={Shield}
            fixedFields={[
              {
                dbField: "home_insurance_policy_url",
                label: DOCUMENT_LABELS.HOME_INSURANCE_POLICY,
                path: "property/insurance",
              },
            ]}
            customField="custom_insurance_documents"
            customPath="property/insurance"
            property={localProperty}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
            hideTitle={true}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>

      {/* Suministros */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Suministros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          {/* Electricidad */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
              Electricidad
            </h4>
            <DocumentSection
              title="Electricidad"
              icon={Zap}
              fixedFields={[
                {
                  dbField: "doc_contract_electricity",
                  label: DOCUMENT_LABELS.CONTRACT_ELECTRICITY,
                  path: "property/supplies/electricity",
                },
                {
                  dbField: "doc_bill_electricity",
                  label: DOCUMENT_LABELS.BILL_ELECTRICITY,
                  path: "property/supplies/electricity",
                },
              ]}
              customField=""
              customPath="property/supplies/electricity"
              property={localProperty}
              onPropertyUpdate={(updates) => {
                setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
              }}
              hideTitle={true}
              hideCustomDocuments={true}
              searchQuery={searchQuery}
            />
          </div>

          {/* Agua */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
              Agua
            </h4>
            <DocumentSection
              title="Agua"
              icon={Zap}
              fixedFields={[
                {
                  dbField: "doc_contract_water",
                  label: DOCUMENT_LABELS.CONTRACT_WATER,
                  path: "property/supplies/water",
                },
                {
                  dbField: "doc_bill_water",
                  label: DOCUMENT_LABELS.BILL_WATER,
                  path: "property/supplies/water",
                },
              ]}
              customField=""
              customPath="property/supplies/water"
              property={localProperty}
              onPropertyUpdate={(updates) => {
                setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
              }}
              hideTitle={true}
              hideCustomDocuments={true}
              searchQuery={searchQuery}
            />
          </div>

          {/* Gas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
              Gas
            </h4>
            <DocumentSection
              title="Gas"
              icon={Zap}
              fixedFields={[
                {
                  dbField: "doc_contract_gas",
                  label: DOCUMENT_LABELS.CONTRACT_GAS,
                  path: "property/supplies/gas",
                },
                {
                  dbField: "doc_bill_gas",
                  label: DOCUMENT_LABELS.BILL_GAS,
                  path: "property/supplies/gas",
                },
              ]}
              customField=""
              customPath="property/supplies/gas"
              property={localProperty}
              onPropertyUpdate={(updates) => {
                setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
              }}
              hideTitle={true}
              hideCustomDocuments={true}
              searchQuery={searchQuery}
            />
          </div>

          {/* Otros */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
              Otros
            </h4>
            <DocumentSection
              title="Otros"
              icon={Zap}
              fixedFields={[]}
              customField="custom_supplies_documents"
              customPath="property/supplies/other"
              property={localProperty}
              onPropertyUpdate={(updates) => {
                setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
              }}
              hideTitle={true}
              searchQuery={searchQuery}
            />
          </div>
        </CardContent>
      </Card>

      {/* Otros Documentos de la Propiedad */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Otros Documentos de la Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentSection
            title="Otros Documentos de la Propiedad"
            icon={FileText}
            fixedFields={[]}
            customField="property_custom_other_documents"
            customPath="property/other"
            property={localProperty}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
            hideTitle={true}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}
