"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadLeadLaboralObligatoryDocument,
  deleteLeadLaboralDocument,
} from "@/lib/lead-document-upload";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";

/** Obligatory field config: fieldKey -> label */
export const OBLIGATORY_FIELDS: Record<string, string> = {
  ultima_nomina: "Última nómina",
  vida_laboral: "Vida laboral",
  contrato_laboral: "Contrato laboral",
  ultimo_irpf: "Último IRPF presentado",
  ultimo_iva: "Último IVA",
  certificado_administracion_publica: "Certificado de administración pública",
  justificante_bancario: "Justificante bancario",
  demostracion_ingresos: "Demostración de ingresos",
  justificantes_bancarios_3_meses:
    "Justificantes bancarios de los ingresos obtenidos en los últimos 3 meses",
  matricula_curso_carnet_estudiante:
    "Matrícula del curso o carnet de estudiante en vigor",
  demostracion_ingresos_avalista:
    "Demostración de ingresos propios o de un avalista",
};

/** Get obligatory field keys for given employment_status and employment_contract_type */
export function getObligatoryFieldKeys(
  employmentStatus: string | null | undefined,
  employmentContractType: string | null | undefined
): string[] {
  if (!employmentStatus) return [];

  if (employmentStatus === "Empleado" || employmentStatus === "Funcionario") {
    if (employmentContractType === "Contrato indefinido") {
      return ["ultima_nomina"];
    }
    if (employmentContractType === "Contrato temporal") {
      return ["ultima_nomina", "vida_laboral"];
    }
    if (employmentContractType === "Contrato laboral reciente") {
      return ["contrato_laboral"];
    }
    return [];
  }

  if (employmentStatus === "Autónomo") {
    return ["ultimo_irpf", "ultimo_iva"];
  }
  if (employmentStatus === "Pensionista") {
    return ["certificado_administracion_publica", "justificante_bancario"];
  }
  if (employmentStatus === "Ingresos en el exterior") {
    return ["demostracion_ingresos", "justificantes_bancarios_3_meses"];
  }
  if (employmentStatus === "Estudiante") {
    return [
      "matricula_curso_carnet_estudiante",
      "demostracion_ingresos_avalista",
    ];
  }
  if (employmentStatus === "Desempleado") {
    return ["demostracion_ingresos_avalista"];
  }

  return [];
}

interface LeadLaboralObligatoryDocFieldProps {
  leadId: string;
  leadsUniqueId: string;
  fieldKey: string;
  label: string;
  value: string | null;
  onUpdate: () => void | Promise<void>;
  showWarning?: boolean;
  disabled?: boolean;
}

function LeadLaboralObligatoryDocField({
  leadId,
  leadsUniqueId,
  fieldKey,
  label,
  value,
  onUpdate,
  showWarning = false,
  disabled = false,
}: LeadLaboralObligatoryDocFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    label: string;
  }>({ open: false, url: null, label });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setUploading(true);
    try {
      await uploadLeadLaboralObligatoryDocument(
        leadId,
        leadsUniqueId,
        fieldKey,
        uploadedFile,
        value || undefined
      );
      await onUpdate();
    } catch (error) {
      console.error("Error uploading laboral document:", error);
      alert("Error al subir el documento. Por favor, inténtalo de nuevo.");
      setFile(null);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    try {
      await deleteLeadLaboralDocument(leadId, value, fieldKey);
      setFile(null);
      await onUpdate();
    } catch (error) {
      console.error("Error deleting laboral document:", error);
      alert("Error al eliminar el documento. Por favor, inténtalo de nuevo.");
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleUpload(files[0]);
    if (e.target) e.target.value = "";
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      const uploadedFile = files[0];
      const validTypes = ACCEPT.split(",").map((ext) => ext.trim());
      const ext =
        "." + uploadedFile.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(ext)) {
        await handleUpload(uploadedFile);
      } else {
        alert(
          `Por favor, sube un archivo ${ACCEPT.replace(/\./g, "").toUpperCase()}`
        );
      }
    }
  };

  return (
    <div className={cn("space-y-2")}>
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
        {showWarning && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Debe ser indefinido y figurar el salario del Interesado
          </span>
        )}
      </div>
      {value ? (
        <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() =>
              setPreviewModal({ open: true, url: value, label })
            }
          >
            <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                {label}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {file?.name ||
                  value.split("/").pop()?.split("?")[0] ||
                  "Documento"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            disabled={uploading || disabled}
            className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading || disabled}
          />
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            disabled={uploading || disabled}
            className={cn(
              "w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2",
              isDragging && "bg-primary/5",
              (uploading || disabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Subir documento
            </span>
          </button>
        </div>
      )}

      <DocumentPreviewModal
        open={previewModal.open && !!previewModal.url}
        onOpenChange={(open) => setPreviewModal({ ...previewModal, open })}
        documentUrl={previewModal.url || undefined}
        documentName={previewModal.label}
      />

      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          setUploadModalOpen(open);
          if (!open) setUploading(false);
        }}
        onUpload={async (uploadedFile) => {
          await handleUpload(uploadedFile);
        }}
        label={label}
        isEdit={false}
        allowCustomTitle={false}
      />
    </div>
  );
}

interface LeadLaboralObligatoryDocsProps {
  leadId: string;
  leadsUniqueId: string;
  employmentStatus: string | null | undefined;
  employmentContractType: string | null | undefined;
  laboralFinancialDocs: LaboralFinancialDocs | null | undefined;
  onRefetch: () => void | Promise<void>;
}

export function LeadLaboralObligatoryDocs({
  leadId,
  leadsUniqueId,
  employmentStatus,
  employmentContractType,
  laboralFinancialDocs,
  onRefetch,
}: LeadLaboralObligatoryDocsProps) {
  const fieldKeys = getObligatoryFieldKeys(
    employmentStatus,
    employmentContractType
  );

  if (fieldKeys.length === 0) return null;

  const obligatory = laboralFinancialDocs?.obligatory || {};

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">
        Documentos obligatorios
      </h4>
      <div className="space-y-4">
        {fieldKeys.map((fieldKey) => (
          <LeadLaboralObligatoryDocField
            key={fieldKey}
            leadId={leadId}
            leadsUniqueId={leadsUniqueId}
            fieldKey={fieldKey}
            label={OBLIGATORY_FIELDS[fieldKey] || fieldKey}
            value={(obligatory[fieldKey] as string) || null}
            onUpdate={onRefetch}
            showWarning={
              fieldKey === "contrato_laboral" &&
              employmentContractType === "Contrato laboral reciente"
            }
          />
        ))}
      </div>
    </div>
  );
}
