"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePropertyForm } from "./property-form-context";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText } from "lucide-react";

interface RenewalManagementTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function RenewalManagementTasks({ property }: RenewalManagementTasksProps) {
  const { formData, updateField } = usePropertyForm();
  const [renewalDocumentFile, setRenewalDocumentFile] = useState<File | null>(null);

  const sectionId = "renewalManagement";

  // Obtener valores del formulario
  const ownerConsulted = formData[`${sectionId}.ownerConsulted`] || false;
  const ownerIntention = formData[`${sectionId}.ownerIntention`] || "";
  const newConditions = formData[`${sectionId}.newConditions`] || "";
  const tenantNegotiated = formData[`${sectionId}.tenantNegotiated`] || false;
  const negotiationNotes = formData[`${sectionId}.negotiationNotes`] || "";
  const formalized = formData[`${sectionId}.formalized`] || false;
  const newStartDate = formData[`${sectionId}.newStartDate`] || "";
  const newEndDate = formData[`${sectionId}.newEndDate`] || "";
  const deadlinesUpdated = formData[`${sectionId}.deadlinesUpdated`] || false;
  const noAgreement = formData[`${sectionId}.noAgreement`] || false;

  const handleRenewalDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setRenewalDocumentFile(files[0]);
      updateField(sectionId, "renewalDocumentFile", files[0].name);
      updateField(sectionId, "formalized", true);
    }
  };

  const handleRemoveRenewalDocument = () => {
    setRenewalDocumentFile(null);
    updateField(sectionId, "renewalDocumentFile", null);
    updateField(sectionId, "formalized", false);
  };

  const handleFieldChange = (field: string, value: string) => {
    updateField(sectionId, field, value);
  };

  return (
    <div className="space-y-6">
      {/* Consulta al Propietario */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Consulta al Propietario</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownerConsulted"
              checked={ownerConsulted}
              onCheckedChange={(checked) =>
                updateField(sectionId, "ownerConsulted", checked === true)
              }
            />
            <Label
              htmlFor="ownerConsulted"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Contactar con la propiedad para definir su intención de renovar y establecer las
              nuevas condiciones económicas (subida de precio, mantenimiento, etc.)
            </Label>
          </div>
          {ownerConsulted && (
            <div className="space-y-4 pl-6 border-l-2 border-border">
              <div className="space-y-2">
                <Label htmlFor="ownerIntention" className="text-sm font-medium">
                  Intención del propietario
                </Label>
                <Textarea
                  id="ownerIntention"
                  placeholder="Describir la intención del propietario..."
                  value={ownerIntention}
                  onChange={(e) => handleFieldChange("ownerIntention", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newConditions" className="text-sm font-medium">
                  Nuevas condiciones económicas
                </Label>
                <Textarea
                  id="newConditions"
                  placeholder="Subida de precio, mantenimiento, etc..."
                  value={newConditions}
                  onChange={(e) => handleFieldChange("newConditions", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negociación con Inquilino */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Negociación con Inquilino</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tenantNegotiated"
              checked={tenantNegotiated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "tenantNegotiated", checked === true)
              }
            />
            <Label
              htmlFor="tenantNegotiated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Comunicar las condiciones al inquilino y gestionar la negociación para alcanzar un
              acuerdo de renovación
            </Label>
          </div>
          {tenantNegotiated && (
            <div className="space-y-2 pl-6 border-l-2 border-border">
              <Label htmlFor="negotiationNotes" className="text-sm font-medium">
                Notas de la negociación
              </Label>
              <Textarea
                id="negotiationNotes"
                placeholder="Detalles de la negociación con el inquilino..."
                value={negotiationNotes}
                onChange={(e) => handleFieldChange("negotiationNotes", e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formalización */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Formalización</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="renewal-document-upload" className="text-sm font-medium">
              Subir adenda de prórroga o nuevo contrato
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="renewal-document-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleRenewalDocumentChange}
                  className="hidden"
                />
                {renewalDocumentFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {renewalDocumentFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(renewalDocumentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveRenewalDocument}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="renewal-document-upload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir el documento
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX hasta 10MB
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="formalized"
              checked={formalized}
              onCheckedChange={(checked) =>
                updateField(sectionId, "formalized", checked === true)
              }
            />
            <Label
              htmlFor="formalized"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Redactar y firmar la adenda de prórroga o el nuevo contrato de arrendamiento
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actualización de Plazos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Actualización de Plazos</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newStartDate" className="text-sm font-medium">
                Nueva fecha de inicio
              </Label>
              <Input
                id="newStartDate"
                type="date"
                value={newStartDate}
                onChange={(e) => handleFieldChange("newStartDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEndDate" className="text-sm font-medium">
                Nueva fecha de fin
              </Label>
              <Input
                id="newEndDate"
                type="date"
                value={newEndDate}
                onChange={(e) => handleFieldChange("newEndDate", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deadlinesUpdated"
              checked={deadlinesUpdated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "deadlinesUpdated", checked === true)
              }
            />
            <Label
              htmlFor="deadlinesUpdated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Registrar las nuevas fechas de vigencia
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="noAgreement"
              checked={noAgreement}
              onCheckedChange={(checked) =>
                updateField(sectionId, "noAgreement", checked === true)
              }
            />
            <Label
              htmlFor="noAgreement"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              No hay acuerdo - Mover la tarjeta a la fase de Salida
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
