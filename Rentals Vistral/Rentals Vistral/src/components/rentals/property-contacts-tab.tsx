"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePropertyTenant } from "@/hooks/use-property-tenant";

interface PropertyContactsTabProps {
  propertyId: string;
  currentPhase?: string;
}

export function PropertyContactsTab({ propertyId, currentPhase }: PropertyContactsTabProps) {
  const { tenant, loading, updateTenant } = usePropertyTenant({ propertyId });
  
  // Local state for form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");

  // Initialize form from tenant data
  useEffect(() => {
    if (tenant) {
      setFullName(tenant.full_name || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setNif(tenant.nif || "");
    }
  }, [tenant]);

  const handleFieldChange = async (field: string, value: string) => {
    // Update local state immediately for responsive UI
    switch (field) {
      case "fullName":
        setFullName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "nif":
        setNif(value);
        break;
    }

    // Update in database with debounce
    try {
      await updateTenant({
        full_name: field === "fullName" ? value : fullName,
        email: field === "email" ? value : email,
        phone: field === "phone" ? value : phone,
        nif: field === "nif" ? value : nif,
      });
    } catch (error) {
      console.error("Error updating tenant:", error);
      // Revert local state on error
      if (tenant) {
        setFullName(tenant.full_name || "");
        setEmail(tenant.email || "");
        setPhone(tenant.phone || "");
        setNif(tenant.nif || "");
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-semibold mb-0">Resumen Inquilino</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-fullName" className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id="tenant-fullName"
              type="text"
              placeholder="Nombre completo del inquilino"
              value={fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="tenant-email"
              type="email"
              placeholder="ejemplo@email.com"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-phone" className="text-sm font-medium">
              Teléfono
            </Label>
            <Input
              id="tenant-phone"
              type="tel"
              placeholder="Ej: +34 600 000 000"
              value={phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Verifica que el teléfono tenga prefijo internacional
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-nif" className="text-sm font-medium">
              DNI/NIE
            </Label>
            <Input
              id="tenant-nif"
              type="text"
              placeholder="Ej: 12345678A"
              value={nif}
              onChange={(e) => handleFieldChange("nif", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
