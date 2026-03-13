"use client";

import { useState } from "react";
import {
  Copy, Check, Users, Calendar, CalendarRange, Briefcase, User,
  Banknote, UserCheck, Pencil, X, IdCard, Globe, Cake, Heart,
  PawPrint, FileText, Upload, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DocumentPreviewModal } from "@/components/rentals/document-preview-modal";
import { DocumentUploadModal } from "@/components/rentals/document-upload-modal";
import {
  OBLIGATORY_FIELDS,
  getObligatoryFieldKeys,
} from "@/components/rentals/lead-laboral-obligatory-docs";
import {
  uploadLeadIdentityDocument,
  deleteLeadIdentityDocument,
  uploadLeadLaboralObligatoryDocument,
  deleteLeadLaboralDocument,
  uploadLeadLaboralComplementaryDocument,
} from "@/lib/lead-document-upload";
import type { LaboralFinancialDocs } from "@/lib/supabase/types";

const MOVE_IN_TIMEFRAMES = ["Inmediato", "1-2 semanas", "1 mes", "1-3 meses", "3-6 meses", "Flexible"];
const LEASE_DURATION_PREFERENCES = ["11 meses", "1 año", "2 años", "Largo plazo", "Corto plazo"];

interface Lead {
  id: string;
  leadsUniqueId?: string;
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
  occupant_count?: number | null;
  move_in_timeframe?: string | null;
  lease_duration_preference?: string | null;
  employment_status?: string | null;
  job_title?: string | null;
  employment_contract_type?: string | null;
  monthly_net_income?: number | null;
  has_guarantor?: boolean | null;
  laboral_financial_docs?: LaboralFinancialDocs | null;
  nationality?: string | null;
  identityDocType?: string | null;
  identityDocNumber?: string | null;
  identityDocUrl?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  familyProfile?: string | null;
  childrenCount?: number | null;
  petInfo?: Record<string, unknown> | null;
}

interface LeadSummaryTabProps {
  lead: Lead;
  onLeadUpdate?: () => Promise<void> | void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const EARLY_PHASES = [
  "Interesado Cualificado",
  "Visita Agendada",
  "Recogiendo Información",
];

export function LeadSummaryTab({ lead, onLeadUpdate }: LeadSummaryTabProps) {
  const showExpandedInfo = !EARLY_PHASES.includes(lead.currentPhase);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string | null; label: string }>({ open: false, url: null, label: "" });
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    target: "identity" | "obligatory" | "complementary" | null;
    fieldKey?: string;
    label?: string;
  }>({ open: false, target: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    label: string;
    target: "identity" | "obligatory" | "complementary" | null;
    fieldKey?: string;
    fileUrl?: string;
  }>({ open: false, label: "", target: null });

  const [editingPrefs, setEditingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [editOccupants, setEditOccupants] = useState<string>("");
  const [editMoveIn, setEditMoveIn] = useState<string>("");
  const [editLeaseDuration, setEditLeaseDuration] = useState<string>("");

  const handleDocUpload = async (file: File, customTitle?: string) => {
    try {
      if (uploadModal.target === "identity") {
        await uploadLeadIdentityDocument(
          lead.id,
          lead.leadsUniqueId ?? "",
          file,
          lead.identityDocUrl,
        );
        toast.success("Documento de identidad subido");
      } else if (uploadModal.target === "obligatory" && uploadModal.fieldKey) {
        const existingUrl = lead.laboral_financial_docs?.obligatory?.[uploadModal.fieldKey] ?? null;
        await uploadLeadLaboralObligatoryDocument(
          lead.id,
          lead.leadsUniqueId ?? "",
          uploadModal.fieldKey,
          file,
          existingUrl,
        );
        toast.success("Documento subido");
      } else if (uploadModal.target === "complementary") {
        const title = customTitle?.trim() || file.name;
        await uploadLeadLaboralComplementaryDocument(
          lead.id,
          lead.leadsUniqueId ?? "",
          "Otros",
          title,
          file,
        );
        toast.success("Documento complementario subido");
      }
      setUploadModal({ open: false, target: null });
      await onLeadUpdate?.();
    } catch (error) {
      console.error("[Upload Lead Document Error]:", error);
      toast.error(`Error al subir: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  const handleDocDelete = async () => {
    const { target, fieldKey, fileUrl } = deleteDialog;
    if (!fileUrl) return;
    try {
      if (target === "identity") {
        await deleteLeadIdentityDocument(lead.id, fileUrl);
        toast.success("Documento de identidad eliminado");
      } else if (target === "obligatory") {
        await deleteLeadLaboralDocument(lead.id, fileUrl, fieldKey);
        toast.success("Documento eliminado");
      } else if (target === "complementary") {
        await deleteLeadLaboralDocument(lead.id, fileUrl);
        toast.success("Documento complementario eliminado");
      }
      setDeleteDialog({ open: false, label: "", target: null });
      await onLeadUpdate?.();
    } catch (error) {
      console.error("[Delete Lead Document Error]:", error);
      toast.error(`Error al eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  const startEditingPrefs = () => {
    setEditOccupants(lead?.occupant_count != null ? String(lead.occupant_count) : "");
    setEditMoveIn(lead?.move_in_timeframe ?? "");
    setEditLeaseDuration(lead?.lease_duration_preference ?? "");
    setEditingPrefs(true);
  };

  const cancelEditingPrefs = () => {
    setEditingPrefs(false);
  };

  const savePrefs = async () => {
    try {
      setSavingPrefs(true);
      const occupants = editOccupants.trim() === "" ? null : parseInt(editOccupants, 10);
      if (editOccupants.trim() !== "" && (isNaN(occupants!) || occupants! < 0)) {
        toast.error("El número de ocupantes debe ser un número válido");
        return;
      }

      const res = await fetch(`/api/leads/${lead.id}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number_of_occupants: occupants,
          move_in_timeframe: editMoveIn || null,
          lease_duration_preference: editLeaseDuration || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error ?? "Error al guardar las preferencias");
      }

      toast.success("Preferencias de alquiler actualizadas");
      setEditingPrefs(false);
      await onLeadUpdate?.();
    } catch (error) {
      console.error("[Save Rental Preferences Error]:", error);
      toast.error("Error al guardar las preferencias");
    } finally {
      setSavingPrefs(false);
    }
  };

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
          {showExpandedInfo && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Número de Identificación</p>
              {lead?.identityDocNumber ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                    {lead.identityDocType ? `${lead.identityDocType}: ` : ""}{lead.identityDocNumber}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(lead.identityDocNumber!, "lead-doc-number");
                    }}
                    className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                    title="Copiar número de identificación"
                  >
                    {copiedField === "lead-doc-number" ? (
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
          )}

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
          <div className="tracking-tight text-base font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">Preferencias de Alquiler</span>
            {!editingPrefs ? (
              <button
                onClick={startEditingPrefs}
                className="p-1.5 rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-colors"
                title="Editar preferencias"
              >
                <Pencil className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
              </button>
            ) : (
              <button
                onClick={cancelEditingPrefs}
                className="p-1.5 rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-colors"
                title="Cancelar edición"
              >
                <X className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
              </button>
            )}
          </div>
        </div>

        {!editingPrefs ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
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
              </div>
            </div>

            {showExpandedInfo && (
              <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
                  <div className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        Perfil familiar
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                      {lead?.familyProfile ?? "--"}
                      {lead?.familyProfile === "Con hijos" && lead?.childrenCount != null
                        ? ` (${lead.childrenCount})`
                        : ""}
                    </p>
                  </div>
                  <div className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <PawPrint className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        ¿Tiene mascotas?
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                      {(() => {
                        const pi = lead?.petInfo as { has_pets?: boolean; details?: string; notes?: string } | null;
                        if (pi?.has_pets === true) {
                          const details = pi.details || pi.notes;
                          return details ? `Sí — ${details}` : "Sí";
                        }
                        if (pi?.has_pets === false) return "No";
                        return "--";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  Número de ocupantes
                </label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  placeholder="--"
                  value={editOccupants}
                  onChange={(e) => setEditOccupants(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  Fecha de entrada
                </label>
                <Select value={editMoveIn} onValueChange={setEditMoveIn}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVE_IN_TIMEFRAMES.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
                  <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" />
                  Duración
                </label>
                <Select value={editLeaseDuration} onValueChange={setEditLeaseDuration}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LEASE_DURATION_PREFERENCES.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={cancelEditingPrefs} disabled={savingPrefs}>
                Cancelar
              </Button>
              <Button size="sm" onClick={savePrefs} disabled={savingPrefs}>
                {savingPrefs ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {showExpandedInfo && (
        <>
        {/* Información Personal */}
        <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
            <div className="tracking-tight text-base font-semibold flex items-center gap-2">
              Información Personal
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Nacionalidad
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {lead?.nationality ?? "--"}
                  </p>
                </div>
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <Cake className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Fecha de nacimiento (Edad)
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {lead?.dateOfBirth
                      ? `${lead.dateOfBirth}${lead.age != null ? ` (${lead.age} años)` : ""}`
                      : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[#E5E7EB] dark:divide-[#374151]">
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Tipo de documento de identidad
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {lead?.identityDocType ?? "--"}
                  </p>
                </div>
                <div className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] flex-shrink-0" />
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Número de documento de identidad
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {lead?.identityDocNumber ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    if (lead?.identityDocUrl) {
                      setPreviewModal({ open: true, url: lead.identityDocUrl, label: "Documento de identidad" });
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Documento de identidad</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      {lead?.identityDocUrl ? "PDF" : "No disponible"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead?.identityDocUrl ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog({
                          open: true,
                          label: "Documento de identidad",
                          target: "identity",
                          fileUrl: lead.identityDocUrl!,
                        });
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadModal({ open: true, target: "identity", label: "Documento de identidad" });
                      }}
                      className="h-8 w-8 border-2 border-dashed"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Información Laboral y Financiera (expanded) / Perfil Económico (simple) */}
      <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <div className="tracking-tight text-base font-semibold flex items-center gap-2">
            {showExpandedInfo ? "Información Laboral y Financiera" : "Perfil Económico"}
          </div>
        </div>
        <div className="space-y-4">
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
                    Profesión
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
                  {lead?.monthly_net_income != null
                    ? `${lead.monthly_net_income.toLocaleString("es-ES")} €`
                    : "--"}
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

          {/* Documentos obligatorios - solo en fases avanzadas */}
          {showExpandedInfo && (() => {
            const obligatoryKeys = getObligatoryFieldKeys(
              lead?.employment_status ?? null,
              lead?.employment_contract_type ?? null,
            );
            const obligatoryDocs = lead?.laboral_financial_docs?.obligatory ?? {};
            if (obligatoryKeys.length === 0) return null;

            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide pt-2">
                  Documentos obligatorios
                </p>
                {obligatoryKeys.map((key) => {
                  const url = obligatoryDocs[key];
                  const label = OBLIGATORY_FIELDS[key] ?? key;
                  const hasDoc = url && url.trim().length > 0;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          if (hasDoc) {
                            setPreviewModal({ open: true, url: url!, label });
                          }
                        }}
                      >
                        <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</p>
                          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {hasDoc ? "PDF" : "No disponible"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasDoc ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({
                                open: true,
                                label,
                                target: "obligatory",
                                fieldKey: key,
                                fileUrl: url!,
                              });
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadModal({ open: true, target: "obligatory", fieldKey: key, label });
                            }}
                            className="h-8 w-8 border-2 border-dashed"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Documentos complementarios - solo en fases avanzadas */}
          {showExpandedInfo && (() => {
            const complementaryDocs = lead?.laboral_financial_docs?.complementary ?? [];
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide pt-2">
                  Documentos complementarios
                </p>
                {complementaryDocs.map((doc, idx) => {
                  const docLabel = doc.title || doc.type;
                  const hasDoc = doc.url && doc.url.trim().length > 0;
                  return (
                    <div key={`comp-${idx}`} className="flex items-center justify-between p-3 border border-[#E5E7EB] dark:border-[#374151] rounded-lg transition-colors hover:bg-accent/50">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          if (hasDoc) {
                            setPreviewModal({ open: true, url: doc.url, label: docLabel });
                          }
                        }}
                      >
                        <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#374151] rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{docLabel}</p>
                          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {doc.type && doc.title ? doc.type : (hasDoc ? "PDF" : "No disponible")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasDoc && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({
                                open: true,
                                label: docLabel,
                                target: "complementary",
                                fileUrl: doc.url,
                              });
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUploadModal({ open: true, target: "complementary", label: "Nuevo documento complementario" });
                  }}
                  className="w-full p-2 border border-dashed border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                  <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Agregar documento complementario</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Document preview modal */}
      {previewModal.open && previewModal.url && (
        <DocumentPreviewModal
          open={previewModal.open}
          onOpenChange={(open) => { if (!open) setPreviewModal({ open: false, url: null, label: "" }); }}
          documentUrl={previewModal.url}
          documentName={previewModal.label}
        />
      )}

      {/* Upload modal */}
      {uploadModal.open && (
        <DocumentUploadModal
          open={uploadModal.open}
          onOpenChange={(open) => { if (!open) setUploadModal({ open: false, target: null }); }}
          onUpload={(file, customTitle) => handleDocUpload(file, customTitle)}
          label={uploadModal.label ?? ""}
          isEdit={false}
          allowCustomTitle={uploadModal.target === "complementary"}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, label: "", target: null }); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el documento &ldquo;{deleteDialog.label}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, label: "", target: null })}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDocDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
