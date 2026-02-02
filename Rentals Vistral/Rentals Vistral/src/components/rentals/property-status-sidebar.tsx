"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Calendar, User, FileText, AlertCircle } from "lucide-react";

interface PropertyStatusSidebarProps {
  property?: {
    property_unique_id: string;
    address: string;
    city?: string;
    currentPhase: string;
    daysInPhase: number;
  };
  supabaseProperty?: any;
  propertyId: string;
  pendingItems?: number;
}

export function PropertyStatusSidebar({
  property,
  supabaseProperty,
  propertyId,
  pendingItems = 0,
}: PropertyStatusSidebarProps) {
  // Mock data if not provided
  const propertyData = property || {
    property_unique_id: propertyId,
    address: "Calle Gran Vía 45, 3º B",
    city: "Madrid",
    currentPhase: "Viviendas Prophero",
    daysInPhase: 2,
  };

  return (
    <div className="w-full lg:w-80 border-l-0 lg:border-l bg-card dark:bg-[var(--prophero-gray-900)] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Phase Badge */}
        <div>
          <Badge
            className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {propertyData.currentPhase}
          </Badge>
        </div>

        {/* Property Info */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Información
          </h3>
          <div className="space-y-2 text-sm text-foreground">
            <p className="font-medium">{propertyData.address}</p>
            {propertyData.city && (
              <p className="text-muted-foreground">{propertyData.city}</p>
            )}
            <p className="text-muted-foreground">
              ID: {propertyData.property_unique_id}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Estado
          </h3>
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <span className="text-muted-foreground">Días en fase:</span>{" "}
              <span className="font-medium">{propertyData.daysInPhase}</span>
            </p>
            {pendingItems > 0 && (
              <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {pendingItems} pendiente{pendingItems > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Acciones Rápidas
          </h3>
          <div className="space-y-2">
            <a
              href="#"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver documentos
            </a>
            <a
              href="#"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver historial
            </a>
            <a
              href="#"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contactar propietario
            </a>
          </div>
        </div>

        {/* Additional Info */}
        {supabaseProperty && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Detalles
            </h3>
            <div className="space-y-2 text-sm text-foreground">
              {/* Add more details from supabaseProperty here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
