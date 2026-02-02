"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePropertyTasks } from "@/hooks/use-property-tasks";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantAcceptedTasksProps {
  propertyId: string;
  property?: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

const PHASE = "Inquilino aceptado";

export function TenantAcceptedTasks({ propertyId, property }: TenantAcceptedTasksProps) {
  const { tasks, isTaskCompleted, getTaskData, updateTask } = usePropertyTasks({
    propertyId,
    phase: PHASE,
  });
  
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [guaranteeFile, setGuaranteeFile] = useState<File | null>(null);

  // Get task data
  const taskData = getTaskData("tenantAccepted", PHASE) as {
    signatureDate?: string;
    startDate?: string;
    duration?: string;
    durationUnit?: string;
    finalRentPrice?: string;
    guaranteeId?: string;
    contractFileUrl?: string;
    guaranteeFileUrl?: string;
  } || {};

  // Local state for form fields
  const [signatureDate, setSignatureDate] = useState(taskData.signatureDate || "");
  const [startDate, setStartDate] = useState(taskData.startDate || "");
  const [duration, setDuration] = useState(taskData.duration || "");
  const [durationUnit, setDurationUnit] = useState(taskData.durationUnit || "months");
  const [finalRentPrice, setFinalRentPrice] = useState(taskData.finalRentPrice || "");
  const [guaranteeId, setGuaranteeId] = useState(taskData.guaranteeId || "");

  // Initialize from task data
  useEffect(() => {
    if (taskData) {
      setSignatureDate(taskData.signatureDate || "");
      setStartDate(taskData.startDate || "");
      setDuration(taskData.duration || "");
      setDurationUnit(taskData.durationUnit || "months");
      setFinalRentPrice(taskData.finalRentPrice || "");
      setGuaranteeId(taskData.guaranteeId || "");
    }
  }, [taskData]);

  const bankDataConfirmed = isTaskCompleted("bankDataConfirmed", PHASE);
  const contractSigned = isTaskCompleted("contractSigned", PHASE);
  const guaranteeSigned = isTaskCompleted("guaranteeSigned", PHASE);

  const handleBankDataChange = async (checked: boolean) => {
    await updateTask("bankDataConfirmed", PHASE, {
      is_completed: checked,
    });
  };

  const handleContractFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setContractFile(file);
      
      // TODO: Upload file to storage and get URL
      // For now, store filename in task_data
      await updateTask("contractSigned", PHASE, {
        is_completed: true,
        task_data: {
          ...taskData,
          contractFileUrl: file.name, // Replace with actual URL after upload
        },
      });
    }
  };

  const handleRemoveContract = async () => {
    setContractFile(null);
    await updateTask("contractSigned", PHASE, {
      is_completed: false,
      task_data: {
        ...taskData,
        contractFileUrl: null,
      },
    });
  };

  const handleGuaranteeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setGuaranteeFile(file);
      
      // TODO: Upload file to storage and get URL
      await updateTask("guaranteeSigned", PHASE, {
        task_data: {
          ...taskData,
          guaranteeFileUrl: file.name, // Replace with actual URL after upload
        },
      });
    }
  };

  const handleRemoveGuarantee = async () => {
    setGuaranteeFile(null);
    await updateTask("guaranteeSigned", PHASE, {
      task_data: {
        ...taskData,
        guaranteeFileUrl: null,
      },
    });
  };

  const handleFieldChange = async (field: string, value: string) => {
    const updates: any = {
      signatureDate: field === "signatureDate" ? value : signatureDate,
      startDate: field === "startDate" ? value : startDate,
      duration: field === "duration" ? value : duration,
      durationUnit: field === "durationUnit" ? value : durationUnit,
      finalRentPrice: field === "finalRentPrice" ? value : finalRentPrice,
      guaranteeId: field === "guaranteeId" ? value : guaranteeId,
      contractFileUrl: taskData.contractFileUrl,
      guaranteeFileUrl: taskData.guaranteeFileUrl,
    };

    // Update local state
    switch (field) {
      case "signatureDate":
        setSignatureDate(value);
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "duration":
        setDuration(value);
        break;
      case "durationUnit":
        setDurationUnit(value);
        break;
      case "finalRentPrice":
        setFinalRentPrice(value);
        break;
      case "guaranteeId":
        setGuaranteeId(value);
        break;
    }

    // Update in database
    await updateTask("tenantAccepted", PHASE, {
      task_data: updates,
    });
  };

  return (
    <div className="space-y-6">
      {/* Datos Bancarios */}
      <Card id="section-bank-data">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Datos Bancarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bankDataConfirmed"
              checked={bankDataConfirmed}
              onCheckedChange={(checked) => handleBankDataChange(checked === true)}
            />
            <Label
              htmlFor="bankDataConfirmed"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Confirmar la cuenta bancaria final del propietario para habilitar el cobro de la renta.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Contrato */}
      <Card id="section-contract">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Redactar el documento y gestionar la firma del contrato de arrendamiento entre el
              propietario y el inquilino.
            </p>
            <div className="space-y-2">
              <Label htmlFor="contract-upload" className="text-sm font-medium">
                Subir contrato
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <input
                    type="file"
                    id="contract-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleContractFileChange}
                    className="hidden"
                  />
                  {contractFile ? (
                    <div className="flex items-center gap-3 w-full">
                      <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {contractFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(contractFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveContract}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="contract-upload"
                      className="flex flex-col items-center justify-center w-full cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground text-center">
                        Haz clic para subir el contrato
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX hasta 10MB
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registro de Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Registro de Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Registrar en el sistema la fecha de firma, la fecha de inicio, la duración acordada
            (meses o años) y el precio final del alquiler reflejado en el documento firmado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signatureDate" className="text-sm font-medium">
                Fecha de firma
              </Label>
              <Input
                id="signatureDate"
                type="date"
                value={signatureDate}
                onChange={(e) => handleFieldChange("signatureDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Fecha de inicio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duración
              </Label>
              <div className="flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  placeholder="Ej: 12"
                  value={duration}
                  onChange={(e) => handleFieldChange("duration", e.target.value)}
                  className="flex-1"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => handleFieldChange("durationUnit", e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="months">Meses</option>
                  <option value="years">Años</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalRentPrice" className="text-sm font-medium">
                Precio final del alquiler (€)
              </Label>
              <Input
                id="finalRentPrice"
                type="number"
                placeholder="Ej: 1200"
                value={finalRentPrice}
                onChange={(e) => handleFieldChange("finalRentPrice", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Garantía Finaer */}
      <Card id="section-guarantee">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Garantía Finaer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Recoger e introducir el ID de la garantía de renta ilimitada y enviarla a firma para
            completar el expediente.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guarantee-upload" className="text-sm font-medium">
                Subir documento de garantía
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

            <div className="space-y-2">
              <Label htmlFor="guaranteeId" className="text-sm font-medium">
                ID de la garantía
              </Label>
              <Input
                id="guaranteeId"
                type="text"
                placeholder="Ej: FIN-123456"
                value={guaranteeId}
                onChange={(e) => handleFieldChange("guaranteeId", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="guaranteeSigned"
                checked={guaranteeSigned}
                onCheckedChange={(checked) =>
                  updateTask("guaranteeSigned", PHASE, {
                    is_completed: checked === true,
                  })
                }
              />
              <Label
                htmlFor="guaranteeSigned"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enviada a firma
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
