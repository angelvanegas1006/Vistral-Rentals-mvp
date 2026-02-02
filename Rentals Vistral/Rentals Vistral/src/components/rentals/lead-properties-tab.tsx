"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { mockColumnsCaptacion } from "@/components/rentals/rentals-kanban-board";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  zone?: string;
  currentPhase: string;
  interestedProperties?: Array<{
    id: string;
    address: string;
    city?: string;
  }>;
}

interface LeadPropertiesTabProps {
  lead: Lead;
}

export function LeadPropertiesTab({ lead }: LeadPropertiesTabProps) {
  // Obtener solo las propiedades en fase "Publicado"
  const publishedProperties = mockColumnsCaptacion
    .find((col) => col.id === "published")
    ?.properties.map((prop) => ({
      id: prop.property_unique_id,
      address: prop.address,
      city: prop.city,
    })) || [];

  const [assignedProperties, setAssignedProperties] = useState<
    Array<{ id: string; address: string; city?: string }>
  >(lead.interestedProperties || []);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const handleAddProperty = () => {
    if (!selectedPropertyId) return;

    const property = publishedProperties.find((p) => p.id === selectedPropertyId);
    if (property && !assignedProperties.find((p) => p.id === property.id)) {
      setAssignedProperties([...assignedProperties, property]);
      setSelectedPropertyId("");
    }
  };

  const handleRemoveProperty = (propertyId: string) => {
    setAssignedProperties(assignedProperties.filter((p) => p.id !== propertyId));
  };

  // Filtrar propiedades ya asignadas del dropdown
  const availableProperties = publishedProperties.filter(
    (prop) => !assignedProperties.find((p) => p.id === prop.id)
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Propiedades de Interés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector para añadir propiedades */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="property-select">Añadir propiedad</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="property-select">
                  <SelectValue placeholder="Selecciona una propiedad en fase Publicado" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay más propiedades disponibles
                    </div>
                  ) : (
                    availableProperties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.address}
                        {prop.city && ` • ${prop.city}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddProperty}
                disabled={!selectedPropertyId}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Añadir
              </Button>
            </div>
          </div>

          {/* Lista de propiedades asignadas */}
          <div className="space-y-2">
            <Label>Propiedades asignadas</Label>
            {assignedProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No hay propiedades asignadas. Añade una propiedad desde el selector arriba.
              </p>
            ) : (
              <div className="space-y-2">
                {assignedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {prop.address}
                      </p>
                      {prop.city && (
                        <p className="text-xs text-muted-foreground">{prop.city}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveProperty(prop.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Solo se pueden asignar propiedades que estén en fase
              "Publicado" del kanban de Captación y Cierre. Cuando asignes una propiedad a
              este lead, aparecerá automáticamente en las tareas de "Publicado" de esa
              propiedad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
