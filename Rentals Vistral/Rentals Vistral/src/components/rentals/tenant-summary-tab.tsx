"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, CreditCard } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface TenantSummaryTabProps {
  propertyId: string;
  currentPhase?: string;
  property?: PropertyRow | null;
}

export function TenantSummaryTab({ propertyId, currentPhase, property }: TenantSummaryTabProps) {
  // Local state for property data (enables instant updates without page refresh)
  const [localProperty, setLocalProperty] = useState(property);

  // Update local property when prop changes
  useEffect(() => {
    if (property) {
      setLocalProperty(property);
    }
  }, [property]);

  return (
    <div className="space-y-6">
      <Card className="bg-card rounded-lg border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Inquilino
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="tenantFullName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre Completo
            </Label>
            <Input
              id="tenantFullName"
              type="text"
              placeholder="Nombre completo del inquilino"
              value={localProperty?.tenant_full_name || ""}
              readOnly
              className="bg-muted/50"
            />
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="tenantIdNumber" className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Número de Identificación
            </Label>
            <Input
              id="tenantIdNumber"
              type="text"
              placeholder="DNI/NIE"
              value={localProperty?.tenant_nif || ""}
              readOnly
              className="bg-muted/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="tenantEmail" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            {localProperty?.tenant_email ? (
              <a
                href={`mailto:${localProperty.tenant_email}`}
                className="block"
              >
                <Input
                  id="tenantEmail"
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={localProperty.tenant_email}
                  readOnly
                  className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                />
              </a>
            ) : (
              <Input
                id="tenantEmail"
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
            <Label htmlFor="tenantPhone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono
            </Label>
            {localProperty?.tenant_phone ? (
              <a
                href={`tel:${localProperty.tenant_phone.replace(/\s/g, "")}`}
                className="block"
              >
                <Input
                  id="tenantPhone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={localProperty.tenant_phone}
                  readOnly
                  className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                />
              </a>
            ) : (
              <Input
                id="tenantPhone"
                type="tel"
                placeholder="+34 600 000 000"
                value=""
                readOnly
                className="bg-muted/50"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
