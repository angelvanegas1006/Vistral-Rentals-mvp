"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface LeadSummaryTabProps {
  lead: Lead;
}

export function LeadSummaryTab({ lead }: LeadSummaryTabProps) {
  const [formData, setFormData] = useState({
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    zone: lead.zone || "",
    averageIncome: "",
    finaerStatus: "",
    numberOfOccupants: "",
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Información del Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zona</Label>
              <Input
                id="zone"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageIncome">Ingresos medios</Label>
              <Input
                id="averageIncome"
                type="number"
                value={formData.averageIncome}
                onChange={(e) =>
                  setFormData({ ...formData, averageIncome: e.target.value })
                }
                placeholder="Ej: 3000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finaerStatus">Estado Finaer</Label>
              <Select
                value={formData.finaerStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, finaerStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending-upload">Pendiente de subir</SelectItem>
                  <SelectItem value="pending-accepted">Pendiente de aceptado</SelectItem>
                  <SelectItem value="accepted">Aceptado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfOccupants">Número de habitantes de vivienda</Label>
              <Input
                id="numberOfOccupants"
                type="number"
                value={formData.numberOfOccupants}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfOccupants: e.target.value })
                }
                placeholder="Ej: 2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
