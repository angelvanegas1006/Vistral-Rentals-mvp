"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePropertyForm } from "./property-form-context";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingProceduresTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function PendingProceduresTasks({ property }: PendingProceduresTasksProps) {
  const { formData, updateField } = usePropertyForm();
  const [guaranteeFile, setGuaranteeFile] = useState<File | null>(null);
  const [utilitiesFiles, setUtilitiesFiles] = useState<File[]>([]);
  const [depositReceiptFile, setDepositReceiptFile] = useState<File | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);

  const sectionId = "pendingProcedures";

  // Obtener valores del formulario
  const guaranteeSigned = formData[`${sectionId}.guaranteeSigned`] || false;
  const utilitiesValidated = formData[`${sectionId}.utilitiesValidated`] || false;
  const ownershipChanged = formData[`${sectionId}.ownershipChanged`] || false;
  const depositVerified = formData[`${sectionId}.depositVerified`] || false;
  const liquidationCompleted = formData[`${sectionId}.liquidationCompleted`] || false;
  const documentsClosed = formData[`${sectionId}.documentsClosed`] || false;

  const handleGuaranteeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setGuaranteeFile(files[0]);
      updateField(sectionId, "guaranteeFile", files[0].name);
      updateField(sectionId, "guaranteeSigned", true);
    }
  };

  const handleRemoveGuarantee = () => {
    setGuaranteeFile(null);
    updateField(sectionId, "guaranteeFile", null);
    updateField(sectionId, "guaranteeSigned", false);
  };

  const handleUtilitiesFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUtilitiesFiles((prev) => [...prev, ...newFiles]);
      updateField(sectionId, "utilitiesFiles", newFiles.map((f) => f.name));
    }
  };

  const handleRemoveUtilityFile = (index: number) => {
    setUtilitiesFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      updateField(sectionId, "utilitiesFiles", newFiles.map((f) => f.name));
      return newFiles;
    });
  };

  const handleDepositReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setDepositReceiptFile(files[0]);
      updateField(sectionId, "depositReceiptFile", files[0].name);
    }
  };

  const handleRemoveDepositReceipt = () => {
    setDepositReceiptFile(null);
    updateField(sectionId, "depositReceiptFile", null);
  };

  const handlePaymentReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPaymentReceiptFile(files[0]);
      updateField(sectionId, "paymentReceiptFile", files[0].name);
    }
  };

  const handleRemovePaymentReceipt = () => {
    setPaymentReceiptFile(null);
    updateField(sectionId, "paymentReceiptFile", null);
  };

  return (
    <div className="space-y-6">
      {/* Garantía Finaer */}
      <Card id="section-guarantee">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Garantía Finaer</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PropHero
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="guaranteeSigned"
              checked={guaranteeSigned}
              onCheckedChange={(checked) =>
                updateField(sectionId, "guaranteeSigned", checked === true)
              }
            />
            <Label
              htmlFor="guaranteeSigned"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Firmar la garantía de renta ilimitada
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guarantee-upload" className="text-sm font-medium">
              Subir documento firmado
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="guarantee-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleGuaranteeFileChange}
                  className="hidden"
                />
                {guaranteeFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {guaranteeFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(guaranteeFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveGuarantee}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="guarantee-upload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir el documento firmado
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX hasta 10MB
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de Suministros */}
      <Card id="section-utilities">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Datos de Suministros</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PropHero
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="utilities-upload" className="text-sm font-medium">
              Cargar documentos de suministros del propietario
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="utilities-upload"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleUtilitiesFilesChange}
                  className="hidden"
                />
                {utilitiesFiles.length > 0 ? (
                  <div className="w-full space-y-2">
                    {utilitiesFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUtilityFile(index)}
                          className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="utilities-upload"
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Añadir más documentos</span>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="utilities-upload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir documentos
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX hasta 10MB (múltiples archivos)
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="utilitiesValidated"
              checked={utilitiesValidated}
              onCheckedChange={(checked) =>
                updateField(sectionId, "utilitiesValidated", checked === true)
              }
            />
            <Label
              htmlFor="utilitiesValidated"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Validar que toda la información necesaria para el cambio de titularidad está lista
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Cambio de Titularidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Cambio de Titularidad</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownershipChanged"
              checked={ownershipChanged}
              onCheckedChange={(checked) =>
                updateField(sectionId, "ownershipChanged", checked === true)
              }
            />
            <Label
              htmlFor="ownershipChanged"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Ejecutar el cambio de suministros a nombre del inquilino una vez PropHero haya
              completado los pasos anteriores
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Fianza */}
      <Card id="section-deposit">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Fianza</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="depositVerified"
              checked={depositVerified}
              onCheckedChange={(checked) =>
                updateField(sectionId, "depositVerified", checked === true)
              }
            />
            <Label
              htmlFor="depositVerified"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Verificar que el depósito de la fianza ha sido realizado
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-receipt-upload" className="text-sm font-medium">
              Registrar resguardo
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="deposit-receipt-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDepositReceiptChange}
                  className="hidden"
                />
                {depositReceiptFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {depositReceiptFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(depositReceiptFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDepositReceipt}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="deposit-receipt-upload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir el resguardo
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG hasta 10MB
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidación */}
      <Card id="section-liquidation">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Liquidación</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="liquidationCompleted"
              checked={liquidationCompleted}
              onCheckedChange={(checked) =>
                updateField(sectionId, "liquidationCompleted", checked === true)
              }
            />
            <Label
              htmlFor="liquidationCompleted"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Confirmar que la transferencia del mes en curso al propietario se ha completado
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-receipt-upload" className="text-sm font-medium">
              Subir comprobante de pago
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <input
                  type="file"
                  id="payment-receipt-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handlePaymentReceiptChange}
                  className="hidden"
                />
                {paymentReceiptFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {paymentReceiptFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(paymentReceiptFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePaymentReceipt}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="payment-receipt-upload"
                    className="flex flex-col items-center justify-center w-full cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir el comprobante
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG hasta 10MB
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cierre Documental */}
      <Card id="section-documentation">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Cierre Documental</CardTitle>
            <Badge variant="secondary" className="text-xs">
              PM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="documentsClosed"
              checked={documentsClosed}
              onCheckedChange={(checked) =>
                updateField(sectionId, "documentsClosed", checked === true)
              }
            />
            <Label
              htmlFor="documentsClosed"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Asegurar que todos los documentos justificativos del expediente estén correctamente
              cargados antes de finalizar
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
