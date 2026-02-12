"use client";

import { useState } from "react";
import { Copy, Check, Users, Calendar, CalendarRange, Briefcase, User, Banknote, UserCheck } from "lucide-react";

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
  /** Número de ocupantes (desde number_of_occupants en leads) */
  occupant_count?: number | null;
  move_in_timeframe?: string | null;
  lease_duration_preference?: string | null;
  employment_status?: string | null;
  job_title?: string | null;
  monthly_net_income?: number | null;
  has_guarantor?: boolean | null;
}

interface LeadSummaryTabProps {
  lead: Lead;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadSummaryTab({ lead }: LeadSummaryTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Interesado card - mismo formato que Inquilino en Captación y cierre */}
      <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Interesado</h2>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-[#374151] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              {getInitials(lead?.name)}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
              {lead?.name || "No disponible"}
            </p>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Interesado
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Email</p>
            {lead?.email ? (
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                >
                  {lead.email}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(lead.email!, "lead-email");
                  }}
                  className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                  title="Copiar email"
                >
                  {copiedField === "lead-email" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                No disponible
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Número de teléfono</p>
            {lead?.phone ? (
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${lead.phone.replace(/\s/g, "")}`}
                  className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                >
                  {lead.phone}
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(lead.phone!, "lead-phone");
                  }}
                  className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                  title="Copiar teléfono"
                >
                  {copiedField === "lead-phone" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                No disponible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preferencias de Alquiler - título mismo estilo que Documentos */}
      <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <div className="tracking-tight text-base font-semibold flex items-center gap-2">
            Preferencias de Alquiler
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Número de ocupantes
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.occupant_count != null ? String(lead.occupant_count) : "--"}
              </p>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Fecha de entrada
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.move_in_timeframe ?? "--"}
              </p>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Duración
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.lease_duration_preference ?? "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Perfil Económico - mismo estilo que Preferencias de Alquiler */}
      <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <div className="tracking-tight text-base font-semibold flex items-center gap-2">
            Perfil Económico
          </div>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
            <div className="py-3 text-center min-w-0 px-1">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Situación laboral
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB] break-words">
                {lead?.employment_status ?? "--"}
              </p>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Puesto / Profesión
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.job_title ?? "--"}
              </p>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Banknote className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Ingresos netos mensuales
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.monthly_net_income != null ? String(lead.monthly_net_income) : "--"}
              </p>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Avalista
                </span>
              </div>
              <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {lead?.has_guarantor === true ? "Sí" : lead?.has_guarantor === false ? "No" : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
