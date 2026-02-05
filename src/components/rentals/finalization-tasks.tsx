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

interface FinalizationTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function FinalizationTasks({ property }: FinalizationTasksProps) {
  const { formData, updateField } = usePropertyForm();
  const [noticeDocumentFile, setNoticeDocumentFile] = useState<File | null>(null);

  const sectionId = "finalization";

  // Obtener valores del formulario
  const noticeReceived = formData[`${sectionId}.noticeReceived`] || false;
  const checkoutCompleted = formData[`${sectionId}.checkoutCompleted`] || false;
  const checkoutNotes = formData[`${sectionId}.checkoutNotes`] || "";
  const inventoryChecked = formData[`${sectionId}.inventoryChecked`] || false;
  const keysCollected = formData[`${sectionId}.keysCollected`] || false;
  const depositLiquidated = formData[`${sectionId}.depositLiquidated`] || false;
  const deductions = formData[`${sectionId}.deductions`] || "";
  const depositAmount = formData[`${sectionId}.depositAmount`] || "";
  const depositReturned = formData[`${sectionId}.depositReturned`] || false;
  const depositRetained = formData[`${sectionId}.depositRetained`] || false;
  const reactivated = formData[`${sectionId}.reactivated`] || false;

  const handleNoticeDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setNoticeDocumentFile(files[0]);
      updateField(sectionId, "noticeDocumentFile", files[0].name);
      updateField(sectionId, "noticeReceived", true);
    }
  };

  const handleRemoveNoticeDocument = () => {
    setNoticeDocumentFile(null);
    updateField(sectionId, "noticeDocumentFile", null);
    updateField(sectionId, "noticeReceived", false);
  };

  const handleFieldChange = (field: string, value: string) => {
    updateField(sectionId, field, value);
  };

  return (
    <div className="space-y-6">
      {/* Recepción de Aviso */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Recepción de Aviso</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notice-document-upload" className="text-sm font-medium">
              Subir documento de desistimiento o no renovación
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="notice-document-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleNoticeDocumentChange}
                  className="hidden"
                />
                {noticeDocumentFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {noticeDocumentFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(noticeDocumentFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveNoticeDocument}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="notice-document-upload"
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
              id="noticeReceived"
              checked={noticeReceived}
              onCheckedChange={(checked) =>
                updateField(sectionId, "noticeReceived", checked === true)
              }
            />
            <Label
              htmlFor="noticeReceived"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Gestionar formalmente el documento de desistimiento o no renovación por parte del
              inquilino
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Check-out */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Check-out</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="checkoutCompleted"
              checked={checkoutCompleted}
              onCheckedChange={(checked) =>
                updateField(sectionId, "checkoutCompleted", checked === true)
              }
            />
            <Label
              htmlFor="checkoutCompleted"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Realizar la visita de salida para inspeccionar el estado de la vivienda, comprobar el
              inventario y recoger las llaves
            </Label>
          </div>
          {checkoutCompleted && (
            <div className="space-y-4 pl-6 border-l-2 border-border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventoryChecked"
                  checked={inventoryChecked}
                  onCheckedChange={(checked) =>
                    updateField(sectionId, "inventoryChecked", checked === true)
                  }
                />
                <Label
                  htmlFor="inventoryChecked"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Inventario comprobado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keysCollected"
                  checked={keysCollected}
                  onCheckedChange={(checked) =>
                    updateField(sectionId, "keysCollected", checked === true)
                  }
                />
                <Label
                  htmlFor="keysCollected"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Llaves recogidas
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkoutNotes" className="text-sm font-medium">
                  Notas de la inspección
                </Label>
                <Textarea
                  id="checkoutNotes"
                  placeholder="Estado de la vivienda, observaciones, daños encontrados..."
                  value={checkoutNotes}
                  onChange={(e) => handleFieldChange("checkoutNotes", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liquidación de Fianza */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Liquidación de Fianza</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="depositLiquidated"
              checked={depositLiquidated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "depositLiquidated", checked === true)
              }
            />
            <Label
              htmlFor="depositLiquidated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Calcular las deducciones pertinentes (si las hubiera por daños o suministros
              pendientes) y tramitar la devolución o retención de la fianza
            </Label>
          </div>
          {depositLiquidated && (
            <div className="space-y-4 pl-6 border-l-2 border-border">
              <div className="space-y-2">
                <Label htmlFor="depositAmount" className="text-sm font-medium">
                  Monto de la fianza (€)
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  placeholder="Ej: 1200"
                  value={depositAmount}
                  onChange={(e) => handleFieldChange("depositAmount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductions" className="text-sm font-medium">
                  Deducciones (€)
                </Label>
                <Input
                  id="deductions"
                  type="number"
                  placeholder="Ej: 150"
                  value={deductions}
                  onChange={(e) => handleFieldChange("deductions", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Por daños o suministros pendientes
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="depositReturned"
                  checked={depositReturned}
                  onCheckedChange={(checked) =>
                    updateField(sectionId, "depositReturned", checked === true)
                  }
                />
                <Label
                  htmlFor="depositReturned"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Fianza devuelta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="depositRetained"
                  checked={depositRetained}
                  onCheckedChange={(checked) =>
                    updateField(sectionId, "depositRetained", checked === true)
                  }
                />
                <Label
                  htmlFor="depositRetained"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Fianza retenida
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reactivación */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Reactivación</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reactivated"
              checked={reactivated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "reactivated", checked === true)
              }
            />
            <Label
              htmlFor="reactivated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Confirmar la disponibilidad de la propiedad y moverla nuevamente a la Fase 1 para
              iniciar un nuevo ciclo de comercialización
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
