"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePropertyForm } from "./property-form-context";
import { Badge } from "@/components/ui/badge";

interface IpcUpdateTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function IpcUpdateTasks({ property }: IpcUpdateTasksProps) {
  const { formData, updateField } = usePropertyForm();
  const sectionId = "ipcUpdate";

  // Obtener valores del formulario
  const indexCalculated = formData[`${sectionId}.indexCalculated`] || false;
  const indexType = formData[`${sectionId}.indexType`] || "";
  const newRentAmount = formData[`${sectionId}.newRentAmount`] || "";
  const officialCommunication = formData[`${sectionId}.officialCommunication`] || false;
  const notificationDate = formData[`${sectionId}.notificationDate`] || "";
  const systemUpdated = formData[`${sectionId}.systemUpdated`] || false;
  const confirmation = formData[`${sectionId}.confirmation`] || false;
  const tenantAccepted = formData[`${sectionId}.tenantAccepted`] || false;

  const handleFieldChange = (field: string, value: string) => {
    updateField(sectionId, field, value);
  };

  return (
    <div className="space-y-6">
      {/* Cálculo del Índice */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Cálculo del Índice</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indexType" className="text-sm font-medium">
              Índice de referencia aplicable
            </Label>
            <Select value={indexType} onValueChange={(value) => handleFieldChange("indexType", value)}>
              <SelectTrigger id="indexType" className="w-full">
                <SelectValue placeholder="Selecciona el índice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ipc">IPC</SelectItem>
                <SelectItem value="igc">IGC</SelectItem>
                <SelectItem value="tope-gubernamental">Tope Gubernamental</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newRentAmount" className="text-sm font-medium">
              Nuevo importe de la renta (€)
            </Label>
            <Input
              id="newRentAmount"
              type="number"
              placeholder="Ej: 1250"
              value={newRentAmount}
              onChange={(e) => handleFieldChange("newRentAmount", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="indexCalculated"
              checked={indexCalculated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "indexCalculated", checked === true)
              }
            />
            <Label
              htmlFor="indexCalculated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Verificar el índice de referencia aplicable (IPC, IGC o tope gubernamental) para
              calcular el nuevo importe de la renta
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Comunicación Oficial */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Comunicación Oficial</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationDate" className="text-sm font-medium">
              Fecha de notificación
            </Label>
            <Input
              id="notificationDate"
              type="date"
              value={notificationDate}
              onChange={(e) => handleFieldChange("notificationDate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generalmente 30 días antes de la renovación anual
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="officialCommunication"
              checked={officialCommunication}
              onCheckedChange={(checked) =>
                updateField(sectionId, "officialCommunication", checked === true)
              }
            />
            <Label
              htmlFor="officialCommunication"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Notificar al inquilino el nuevo precio cumpliendo con el plazo legal de preaviso
              (generalmente 30 días antes de la renovación anual)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actualización del Sistema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Actualización del Sistema</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="systemUpdated"
              checked={systemUpdated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "systemUpdated", checked === true)
              }
            />
            <Label
              htmlFor="systemUpdated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Registrar el nuevo importe de la renta en la ficha de la propiedad y en la orden de
              cobro recurrente
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Confirmación */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Confirmación</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tenantAccepted"
              checked={tenantAccepted}
              onCheckedChange={(checked) =>
                updateField(sectionId, "tenantAccepted", checked === true)
              }
            />
            <Label
              htmlFor="tenantAccepted"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              El inquilino ha aceptado el cargo actualizado
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmation"
              checked={confirmation}
              onCheckedChange={(checked) =>
                updateField(sectionId, "confirmation", checked === true)
              }
            />
            <Label
              htmlFor="confirmation"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Validar que el inquilino ha recibido la notificación y aceptado el cargo actualizado
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
