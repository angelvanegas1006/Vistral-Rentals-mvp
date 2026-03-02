"use client";

import { EditableField } from "@/components/rentals/editable-field";
import { Phase2SectionWidget } from "@/components/rentals/phase2-section-widget";
import {
  LeadLaboralObligatoryDocs,
  getObligatoryFieldKeys,
} from "@/components/rentals/lead-laboral-obligatory-docs";
import { LeadLaboralComplementaryDocs } from "@/components/rentals/lead-laboral-complementary-docs";
import { useUpdateLead } from "@/hooks/use-update-lead";
import { clearLeadLaboralObligatoryDocs } from "@/lib/lead-document-upload";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCallback, useState, useEffect } from "react";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

const EMPLOYMENT_STATUSES = [
  "Empleado",
  "Funcionario",
  "Autónomo",
  "Pensionista",
  "Estudiante",
  "Desempleado",
  "Ingresos en el exterior",
] as const;

const EMPLOYMENT_CONTRACT_TYPES = [
  "Contrato indefinido",
  "Contrato temporal",
  "Contrato laboral reciente",
] as const;

const STATUSES_WITH_CONTRACT_TYPE = ["Empleado", "Funcionario"] as const;

export interface LeadEmploymentFinancialData {
  id: string;
  leadsUniqueId: string;
  employment_status?: string | null;
  job_title?: string | null;
  employment_contract_type?: string | null;
  laboral_financial_docs?: LaboralFinancialDocs | null;
}

/** Comprueba si la sección Información Laboral y Financiera está completa */
export function isEmploymentFinancialSectionComplete(
  data: Pick<
    LeadEmploymentFinancialData,
    "employment_status" | "employment_contract_type" | "laboral_financial_docs"
  >
): boolean {
  const status = data.employment_status;
  const contractType = data.employment_contract_type;
  const obligatory = data.laboral_financial_docs?.obligatory || {};

  if (!status || status.trim() === "") return false;

  const STATUSES_WITH_CONTRACT = ["Empleado", "Funcionario"];
  if (STATUSES_WITH_CONTRACT.includes(status)) {
    if (!contractType || contractType.trim() === "") return false;
  }

  const fieldKeys = getObligatoryFieldKeys(status, contractType);
  for (const key of fieldKeys) {
    const url = obligatory[key];
    if (!url || typeof url !== "string" || url.trim() === "") return false;
  }

  return true;
}

interface LeadEmploymentFinancialSectionProps {
  lead: LeadEmploymentFinancialData;
  isComplete?: boolean;
  onRefetch?: () => void | Promise<void>;
}

export function LeadEmploymentFinancialSection({
  lead,
  isComplete = false,
  onRefetch,
}: LeadEmploymentFinancialSectionProps) {
  const { updateLead } = useUpdateLead();

  // Estado local para actualización optimista: se marca al instante al pulsar
  const [contractTypeValue, setContractTypeValue] = useState(lead.employment_contract_type ?? "");
  useEffect(() => {
    setContractTypeValue(lead.employment_contract_type ?? "");
  }, [lead.employment_contract_type]);

  const showContractType =
    lead.employment_status &&
    STATUSES_WITH_CONTRACT_TYPE.includes(lead.employment_status as (typeof STATUSES_WITH_CONTRACT_TYPE)[number]);

  const handleEmploymentStatusSave = async (value: string | null) => {
    const updates: { employment_status: string | null; employment_contract_type?: string | null } = {
      employment_status: value,
    };
    if (!value || !STATUSES_WITH_CONTRACT_TYPE.includes(value as (typeof STATUSES_WITH_CONTRACT_TYPE)[number])) {
      updates.employment_contract_type = null;
    }
    try {
      await clearLeadLaboralObligatoryDocs(lead.id);
    } catch (e) {
      console.error("Error clearing obligatory docs:", e);
    }
    const success = await updateLead(lead.id, updates);
    if (success && onRefetch) {
      await onRefetch();
    }
  };

  const handleJobTitleSave = async (value: string | null) => {
    const success = await updateLead(lead.id, {
      job_title: value,
    });
    if (success && onRefetch) {
      await onRefetch();
    }
  };

  const handleContractTypeChange = useCallback(
    async (value: string) => {
      setContractTypeValue(value);
      try {
        await clearLeadLaboralObligatoryDocs(lead.id);
      } catch (e) {
        console.error("Error clearing obligatory docs:", e);
      }
      const success = await updateLead(lead.id, {
        employment_contract_type: value || null,
      });
      if (success && onRefetch) {
        await onRefetch();
      } else if (!success) {
        setContractTypeValue(lead.employment_contract_type ?? "");
      }
    },
    [lead.id, lead.employment_contract_type, updateLead, onRefetch]
  );

  return (
    <Phase2SectionWidget
      id="employment-financial"
      title="Información Laboral y Financiera del Interesado"
      instructions="Rellena la situación laboral y el puesto o profesión del interesado."
      isComplete={isComplete}
    >
      {/* Parte 1: Situación laboral + Profesión + Tipo de contrato */}
      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-muted/20 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableField
            label="Situación laboral"
            value={lead.employment_status ?? null}
            options={EMPLOYMENT_STATUSES}
            onSave={handleEmploymentStatusSave}
            placeholder="Seleccionar"
          />
          <EditableField
            label="Profesión"
            value={lead.job_title ?? null}
            onSave={handleJobTitleSave}
            placeholder="Ej. Ingeniero, Profesor..."
          />
        </div>

        {showContractType && (
          <div className="w-full space-y-2">
            <Label className="text-sm font-medium">Tipo de contrato</Label>
            <RadioGroup
              value={contractTypeValue}
              onValueChange={handleContractTypeChange}
              className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
            >
              {EMPLOYMENT_CONTRACT_TYPES.map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`contract-type-${opt.replace(/\s/g, "-")}`} />
                  <Label
                    htmlFor={`contract-type-${opt.replace(/\s/g, "-")}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Parte 2: Documentos obligatorios (solo si hay campos requeridos) */}
      {getObligatoryFieldKeys(lead.employment_status, lead.employment_contract_type).length > 0 && (
        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-muted/20 p-4">
          <LeadLaboralObligatoryDocs
            leadId={lead.id}
            leadsUniqueId={lead.leadsUniqueId}
            employmentStatus={lead.employment_status}
            employmentContractType={lead.employment_contract_type}
            laboralFinancialDocs={lead.laboral_financial_docs}
            onRefetch={onRefetch ?? (() => {})}
          />
        </div>
      )}

      {/* Parte 3: Documentos complementarios */}
      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-muted/20 p-4">
        <LeadLaboralComplementaryDocs
          leadId={lead.id}
          leadsUniqueId={lead.leadsUniqueId}
          complementary={lead.laboral_financial_docs?.complementary ?? []}
          onRefetch={onRefetch ?? (() => {})}
        />
      </div>
    </Phase2SectionWidget>
  );
}
