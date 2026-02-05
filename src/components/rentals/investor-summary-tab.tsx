"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, CreditCard, Building2, FileText, Wallet } from "lucide-react";
import { DocumentSection } from "@/components/ui/DocumentSection";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface InvestorSummaryTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: PropertyRow | null;
}

export function InvestorSummaryTab({ propertyId, currentPhase, property }: InvestorSummaryTabProps) {
  // Local state for property data (enables instant updates without page refresh)
  const [localProperty, setLocalProperty] = useState(property);

  // Update local property when prop changes
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  // Map UI labels to database field names
  const getFieldNameFromLabel = (label: string): string | null => {
    const labelToFieldMap: Record<string, string> = {
      "Documento de Identidad": "client_identity_doc_url",
      "Certificado de titularidad bancaria": "client_bank_certificate_url",
    };
    return labelToFieldMap[label] || null;
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

  // Simple smooth scroll (no animation)
  const scrollToFieldWithAnimation = (label: string) => {
    setTimeout(() => {
      const fieldElement = document.querySelector(`[data-field-label="${label}"]`) as HTMLElement;
      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // Handle document upload with instant state update (no page refresh!)
  const handleDocumentUpload = async (label: string, file: File) => {
    if (!localProperty?.property_unique_id) {
      console.error("Property ID is required for document upload");
      return;
    }

    const fieldName = getFieldNameFromLabel(label);
    if (!fieldName) {
      console.error(`Unknown field label: ${label}`);
      return;
    }

    try {
      // Get current value for cleanup
      const currentValue = localProperty[fieldName as keyof typeof localProperty] as string | null | undefined;
      
      // Upload file and get new URL
      const { uploadDocument } = await import("@/lib/document-upload");
      const newUrl = await uploadDocument(fieldName, localProperty.property_unique_id, file, currentValue);
      
      // Update local state immediately (no page refresh!)
      setLocalProperty(prev => {
        if (!prev) return prev;
        return { ...prev, [fieldName]: newUrl };
      });
      
      // Scroll to field with animation (instant, no page load!)
      scrollToFieldWithAnimation(label);
      
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Handle document deletion with instant state update (no page refresh!)
  const handleDocumentDelete = async (label: string) => {
    if (!localProperty?.property_unique_id) {
      console.error("Property ID is required for document deletion");
      return;
    }

    const fieldName = getFieldNameFromLabel(label);
    if (!fieldName) {
      console.error(`Unknown field label: ${label}`);
      return;
    }

    try {
      // Get current value
      const currentValue = localProperty[fieldName as keyof typeof localProperty] as string | null | undefined;
      if (!currentValue) {
        console.error("No document to delete");
        return;
      }
      
      // Delete file from backend
      const { deleteDocument } = await import("@/lib/document-upload");
      await deleteDocument(fieldName, localProperty.property_unique_id, currentValue);
      
      // Update local state immediately (no page refresh!)
      setLocalProperty(prev => {
        if (!prev) return prev;
        return { ...prev, [fieldName]: null };
      });
      
      // Don't scroll after delete - it causes unwanted layout shifts
      
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(`Error al eliminar el documento: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card rounded-lg border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Inversor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre Completo
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nombre completo del cliente"
              value={localProperty?.client_full_name || ""}
              readOnly
              className="bg-muted/50"
            />
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber" className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Número de Identificación
            </Label>
            <Input
              id="idNumber"
              type="text"
              placeholder="DNI/NIE"
              value={localProperty?.client_identity_doc_number || ""}
              readOnly
              className="bg-muted/50"
            />
          </div>

          {/* Identificación y Legal Section */}
          <DocumentSection
            title="Identificación y Legal"
            icon={FileText}
            fixedFields={[
              {
                dbField: "client_identity_doc_url",
                label: "DNI/NIE Principal",
                path: "client/identity",
              },
            ]}
            customField="client_custom_identity_documents"
            customPath="client/identity"
            property={localProperty!}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
          />

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            {localProperty?.client_email ? (
              <a
                href={`mailto:${localProperty.client_email}`}
                className="block"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={localProperty.client_email}
                  readOnly
                  className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                />
              </a>
            ) : (
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@email.com"
                value=""
                readOnly
                className="bg-muted/50"
              />
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono
            </Label>
            {localProperty?.client_phone ? (
              <a
                href={`tel:${localProperty.client_phone.replace(/\s/g, "")}`}
                className="block"
              >
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={localProperty.client_phone}
                  readOnly
                  className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                />
              </a>
            ) : (
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value=""
                readOnly
                className="bg-muted/50"
              />
            )}
          </div>

          {/* Cuenta bancaria */}
          <div className="space-y-2">
            <Label htmlFor="iban" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Cuenta bancaria
            </Label>
            <Input
              id="iban"
              type="text"
              placeholder="ES91 2100 0418 4502 0005 1332"
              value={localProperty?.client_iban ? maskBankAccount(localProperty.client_iban) : ""}
              readOnly
              className="bg-muted/50 font-mono"
            />
          </div>

          {/* Información Bancaria y Fiscal Section */}
          <DocumentSection
            title="Información Bancaria y Fiscal"
            icon={Wallet}
            fixedFields={[
              {
                dbField: "client_bank_certificate_url",
                label: "Certificado Titularidad",
                path: "client/financial",
              },
            ]}
            customField="client_custom_financial_documents"
            customPath="client/financial"
            property={localProperty!}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
          />

          {/* Documentación Adicional Section */}
          <DocumentSection
            title="Documentación Adicional"
            icon={FileText}
            fixedFields={[]}
            customField="client_custom_other_documents"
            customPath="client/other"
            property={localProperty!}
            onPropertyUpdate={(updates) => {
              setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
