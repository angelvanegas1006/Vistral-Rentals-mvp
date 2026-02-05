"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Copy, Check, User, Wallet } from "lucide-react";
import { DocumentSection } from "@/components/ui/DocumentSection";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyStatusTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: PropertyRow | null;
}

export function PropertyStatusTab({ propertyId, currentPhase, property }: PropertyStatusTabProps) {
  // Local state for property data (enables instant updates without page refresh)
  const [localProperty, setLocalProperty] = useState(property);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Update local property when prop changes
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Function to mask bank account number (show only last 4 digits)
  const maskBankAccount = (accountNumber: string): string => {
    if (!accountNumber) return "";
    
    // Extract only digits from the account number
    const digits = accountNumber.replace(/\D/g, "");
    
    if (digits.length <= 4) {
      // If 4 or fewer digits, return as is
      return accountNumber;
    }
    
    // Get last 4 digits
    const lastFour = digits.slice(-4);
    
    // Replace all digits except the last 4 with asterisks, preserving non-digit characters
    let masked = "";
    let digitIndex = 0;
    
    for (let i = 0; i < accountNumber.length; i++) {
      const char = accountNumber[i];
      if (/\d/.test(char)) {
        // It's a digit
        if (digitIndex >= digits.length - 4) {
          // This is one of the last 4 digits
          masked += char;
        } else {
          // Replace with asterisk
          masked += "*";
        }
        digitIndex++;
      } else {
        // It's a non-digit character (space, letter, etc.) - keep it
        masked += char;
      }
    }
    
    return masked;
  };



  // Helper function to get initials from full name
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };


  if (!localProperty) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Investor Information Section - Similar to Property owners reference */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Propietario</h2>
        
        {/* Owner Profile */}
        <div className="flex items-center gap-4 mb-8">
          {/* Avatar with initials */}
          <div className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#374151] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              {getInitials(localProperty?.client_full_name)}
            </span>
          </div>
          
          {/* Name and Role */}
          <div>
            <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
              {localProperty?.client_full_name || "No disponible"}
            </p>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Inversor
            </p>
          </div>
        </div>

        {/* Contact Details - Two Column Layout */}
        <div className="space-y-4">
          {/* ID Number */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">ID Number</p>
            <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
              {localProperty?.client_identity_doc_number || "No disponible"}
            </p>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Email</p>
            {localProperty?.client_email ? (
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${localProperty.client_email}`}
                  className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                >
                  {localProperty.client_email}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(localProperty.client_email!, "email");
                  }}
                  className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                  title="Copiar email"
                >
                  {copiedField === "email" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                No disponible
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Phone number</p>
            {localProperty?.client_phone ? (
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${localProperty.client_phone.replace(/\s/g, "")}`}
                  className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                >
                  {localProperty.client_phone}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(localProperty.client_phone!, "phone");
                  }}
                  className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedField === "phone" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                No disponible
              </p>
            )}
          </div>

          {/* IBAN */}
          {localProperty?.client_iban && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Cuenta bancaria</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] font-mono">
                  {maskBankAccount(localProperty.client_iban)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(localProperty.client_iban!, "iban");
                  }}
                  className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                  title="Copiar cuenta bancaria"
                >
                  {copiedField === "iban" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </Card>

      {/* Tenant Information Section - Same format as Investor */}
      {localProperty?.tenant_full_name && (
        <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Inquilino</h2>
          
          {/* Tenant Profile */}
          <div className="flex items-center gap-4 mb-8">
            {/* Avatar with initials */}
            <div className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#374151] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                {getInitials(localProperty?.tenant_full_name)}
              </span>
            </div>
            
            {/* Name and Role */}
            <div>
              <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {localProperty?.tenant_full_name || "No disponible"}
              </p>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                Inquilino
              </p>
            </div>
          </div>

          {/* Contact Details - Two Column Layout */}
          <div className="space-y-4">
            {/* ID Number */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">ID Number</p>
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {localProperty?.tenant_nif || "No disponible"}
              </p>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Email</p>
              {localProperty?.tenant_email ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${localProperty.tenant_email}`}
                    className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                  >
                    {localProperty.tenant_email}
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(localProperty.tenant_email!, "tenant-email");
                    }}
                    className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                    title="Copiar email"
                  >
                    {copiedField === "tenant-email" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  No disponible
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Phone number</p>
              {localProperty?.tenant_phone ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${localProperty.tenant_phone.replace(/\s/g, "")}`}
                    className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                  >
                    {localProperty.tenant_phone}
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(localProperty.tenant_phone!, "tenant-phone");
                    }}
                    className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                    title="Copiar teléfono"
                  >
                    {copiedField === "tenant-phone" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  No disponible
                </p>
              )}
            </div>

            {/* IBAN */}
            {localProperty?.tenant_iban && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Cuenta bancaria</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] font-mono">
                    {maskBankAccount(localProperty.tenant_iban)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(localProperty.tenant_iban!, "tenant-iban");
                    }}
                    className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                    title="Copiar cuenta bancaria"
                  >
                    {copiedField === "tenant-iban" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </Card>
      )}

      {/* Documents Section - Reorganized with subsecciones */}
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {/* Identidad */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Identidad
              </h4>
              <DocumentSection
                title="Identidad"
                icon={User}
                fixedFields={[
                  {
                    dbField: "client_identity_doc_url",
                    label: "Documento de Identidad",
                    path: "client/identity",
                  },
                ]}
                customField="client_custom_identity_documents"
                customPath="client/identity"
                property={localProperty}
                onPropertyUpdate={(updates) => {
                  setLocalProperty((prev) => (prev ? { ...prev, ...updates } : null));
                }}
                hideTitle={true}
                searchQuery=""
              />
            </div>

            {/* Financiero */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Financiero
              </h4>
              <DocumentSection
                title="Financiero"
                icon={Wallet}
                fixedFields={[
                  {
                    dbField: "client_bank_certificate_url",
                    label: "Certificado de titularidad bancaria",
                    path: "client/financial",
                  },
                ]}
                customField="client_custom_financial_documents"
                customPath="client/financial"
                property={localProperty}
                onPropertyUpdate={(updates) => {
                  setLocalProperty((prev) => (prev ? { ...prev, ...updates } : null));
                }}
                hideTitle={true}
              searchQuery=""
            />
            </div>

            {/* Otros */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Otros
              </h4>
              <DocumentSection
                title="Otros"
                icon={FileText}
                fixedFields={[]}
                customField="client_custom_other_documents"
                customPath="client/other"
                property={localProperty}
                onPropertyUpdate={(updates) => {
                  setLocalProperty((prev) => (prev ? { ...prev, ...updates } : null));
                }}
                hideTitle={true}
                searchQuery=""
              />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
