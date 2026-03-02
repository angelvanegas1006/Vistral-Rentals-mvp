"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { NationalityCombobox } from "@/components/ui/nationality-combobox";
import { LeadIdentityDocumentField } from "@/components/rentals/lead-identity-document-field";
import { Phase2SectionWidget } from "@/components/rentals/phase2-section-widget";
import { useUpdateLead } from "@/hooks/use-update-lead";
import { cn } from "@/lib/utils";

const IDENTITY_DOC_TYPES_ES = ["DNI", "Pasaporte"] as const;
const IDENTITY_DOC_TYPES_NON_ES = ["NIE", "Pasaporte"] as const;
const FAMILY_PROFILES = ["Soltero", "Pareja", "Con hijos"] as const;

function computeAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

// ---------- Types ----------

export interface LeadPersonalInfoData {
  id: string;
  leadsUniqueId: string;
  nationality?: string | null;
  identityDocType?: "DNI" | "NIE" | "Pasaporte" | null;
  identityDocNumber?: string | null;
  identityDocUrl?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  familyProfile?: "Soltero" | "Pareja" | "Con hijos" | null;
  childrenCount?: number | null;
  petInfo?: Record<string, unknown> | null;
}

/** Live snapshot of field values — emitted on every change so parent can update progress widget. */
export interface LeadPersonalInfoLiveData {
  nationality: string;
  identityDocType: string | null;
  identityDocNumber: string;
  identityDocUrl: string | null;
  dateOfBirth: string;
  familyProfile: string | null;
  childrenCount: number | null;
  hasPets: string | null;
  petDetails: string;
}

interface LeadPersonalInfoSectionProps {
  lead: LeadPersonalInfoData;
  /** Called on every field change with the current live values */
  onFieldsChange?: (data: LeadPersonalInfoLiveData) => void;
  /** Whether the section is fully complete */
  isComplete?: boolean;
}

interface FieldValues {
  nationality: string;
  identityDocType: string | null;
  identityDocNumber: string;
  dateOfBirth: string;
  familyProfile: string | null;
  childrenCount: number | null;
  hasPets: string | null;
  petDetails: string;
}

// ---------- Component ----------

export function LeadPersonalInfoSection({
  lead,
  onFieldsChange,
  isComplete = false,
}: LeadPersonalInfoSectionProps) {
  const router = useRouter();
  const { updateLead } = useUpdateLead();

  // --- Initial field values derived from the lead prop ---
  const buildInitialFields = useCallback((): FieldValues => {
    const petInfo = lead.petInfo as { has_pets?: boolean; details?: string; notes?: string } | null;
    const hasPets =
      petInfo?.has_pets === true || (petInfo?.notes && petInfo.notes.trim() !== "")
        ? "yes"
        : petInfo?.has_pets === false || petInfo === null
          ? "no"
          : null;
    return {
      nationality: lead.nationality ?? "",
      identityDocType: lead.identityDocType ?? null,
      identityDocNumber: lead.identityDocNumber ?? "",
      dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.slice(0, 10) : "",
      familyProfile: lead.familyProfile ?? null,
      childrenCount: lead.childrenCount ?? null,
      hasPets,
      petDetails: petInfo?.details ?? petInfo?.notes ?? "",
    };
  }, [lead]);

  // --- State for all fields (single object, like property-form-context) ---
  const [fields, setFields] = useState<FieldValues>(buildInitialFields);

  // --- Local state for identity_doc_url (updated optimistically after upload/delete) ---
  const [identityDocUrl, setIdentityDocUrl] = useState<string | null>(
    lead.identityDocUrl ?? null
  );

  // Sync if parent provides new lead data (e.g. after navigation)
  useEffect(() => {
    setIdentityDocUrl(lead.identityDocUrl ?? null);
  }, [lead.identityDocUrl]);

  // --- Ref to always hold the latest field values (avoids stale closure in setTimeout) ---
  const fieldsRef = useRef<FieldValues>(fields);

  // --- Debounce timer ref ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // --- Save function — reads from ref so it always has fresh values ---
  const saveToSupabase = useCallback(async (vals: FieldValues) => {
    const dob = vals.dateOfBirth || null;
    const age = computeAge(dob);
    const childrenCount =
      vals.familyProfile === "Con hijos" ? (vals.childrenCount ?? null) : null;

    const updates = {
      nationality: vals.nationality || null,
      identity_doc_type: (vals.identityDocType as "DNI" | "NIE" | "Pasaporte" | null) ?? null,
      identity_doc_number: vals.identityDocNumber || null,
      date_of_birth: dob,
      age,
      family_profile: (vals.familyProfile as "Soltero" | "Pareja" | "Con hijos" | null) ?? null,
      children_count: childrenCount,
      pet_info:
        vals.hasPets === "yes"
          ? { has_pets: true, details: vals.petDetails?.trim() || null }
          : { has_pets: false },
    };

    console.log("💾 Guardando lead en Supabase:", { leadId: lead.id, updates });
    const success = await updateLead(lead.id, updates);
    if (success) {
      console.log("✅ Lead guardado exitosamente");
      router.refresh();
    } else {
      console.error("❌ Error al guardar lead");
    }
  }, [lead.id, updateLead, router]);

  // Keep saveToSupabase ref fresh
  const saveRef = useRef(saveToSupabase);
  useEffect(() => { saveRef.current = saveToSupabase; });

  // --- Generic field updater — same pattern as property-form-context.tsx ---
  const updateField = useCallback(<K extends keyof FieldValues>(key: K, value: FieldValues[K]) => {
    setFields((prev) => {
      let updated = { ...prev, [key]: value };

      // When nationality changes, reset identity_doc_type if it's no longer valid
      if (key === "nationality") {
        const isSpanish = (value as string) === "España";
        const allowed: readonly string[] = isSpanish ? IDENTITY_DOC_TYPES_ES : IDENTITY_DOC_TYPES_NON_ES;
        if (updated.identityDocType && !allowed.includes(updated.identityDocType)) {
          updated = { ...updated, identityDocType: null };
        }
      }

      // Update ref with the latest values (critical for debounce)
      fieldsRef.current = updated;

      // Debounce save — 1 second, matching property-form-context
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveRef.current(fieldsRef.current);
      }, 1000);

      return updated;
    });
  }, []);

  // --- Derived values for conditional rendering ---
  const isSpanish = fields.nationality === "España";
  const computedAge = computeAge(fields.dateOfBirth);
  const displayAge = computedAge ?? lead.age;
  const showChildrenCount = fields.familyProfile === "Con hijos";
  const showPetDetails = fields.hasPets === "yes";

  // --- Document upload callback (API route already updates DB) ---
  const handleIdentityDocUpdate = async (url: string | null) => {
    setIdentityDocUrl(url);
    router.refresh();
  };

  // --- Notify parent of live field values (for progress widget) ---
  const onFieldsChangeRef = useRef(onFieldsChange);
  useEffect(() => { onFieldsChangeRef.current = onFieldsChange; });

  useEffect(() => {
    onFieldsChangeRef.current?.({
      ...fields,
      identityDocUrl,
    });
  }, [fields, identityDocUrl]);

  // ---------- Render ----------
  // Uses Phase2SectionWidget — the same wrapper used by all property kanban sections

  return (
    <Phase2SectionWidget
      id="personal-info"
      title="Información Personal del Interesado"
      instructions="Rellena los datos personales y de perfil familiar del interesado."
      required
      isComplete={isComplete}
    >
      {/* Nacionalidad */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Nacionalidad</Label>
        <NationalityCombobox
          value={fields.nationality}
          onChange={(v) => updateField("nationality", v)}
          placeholder="Buscar nacionalidad..."
        />
      </div>

      {/* Tipo y número de documento en paralelo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo de documento de identidad</Label>
          <Select
            value={fields.identityDocType ?? ""}
            onValueChange={(v) => updateField("identityDocType", v === "" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {(isSpanish ? IDENTITY_DOC_TYPES_ES : IDENTITY_DOC_TYPES_NON_ES).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Número de documento de identidad</Label>
          <Input
            value={fields.identityDocNumber}
            onChange={(e) => updateField("identityDocNumber", e.target.value)}
            placeholder="Ej. 12345678A"
          />
        </div>
      </div>

      {/* Documento de identidad (subida) */}
      <div className="space-y-2">
        <LeadIdentityDocumentField
          leadId={lead.id}
          leadsUniqueId={lead.leadsUniqueId}
          value={identityDocUrl}
          onUpdate={handleIdentityDocUpdate}
        />
      </div>

      {/* Fecha nacimiento y Edad en paralelo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fecha de nacimiento</Label>
          <Input
            type="date"
            value={fields.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Edad</Label>
          <p
            className={cn(
              "text-sm rounded-md border border-[#E5E7EB] dark:border-[#374151] bg-muted/30 px-3 py-2",
              displayAge != null
                ? "text-[#111827] dark:text-[#F9FAFB]"
                : "text-muted-foreground"
            )}
          >
            {displayAge != null
              ? `${displayAge} años`
              : "Se calcula al indicar la fecha de nacimiento"}
          </p>
        </div>
      </div>

      {/* Perfil familiar */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Perfil familiar</Label>
        <Select
          value={fields.familyProfile ?? ""}
          onValueChange={(v) => updateField("familyProfile", v === "" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {FAMILY_PROFILES.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Número de hijos - solo si Con hijos */}
      {showChildrenCount && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Número de hijos</Label>
          <Input
            type="number"
            min={0}
            value={fields.childrenCount ?? ""}
            onChange={(e) =>
              updateField(
                "childrenCount",
                e.target.value === "" ? null : parseInt(e.target.value, 10)
              )
            }
          />
        </div>
      )}

      {/* Mascotas */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">¿Tiene mascotas?</Label>
        <RadioGroup
          value={fields.hasPets ?? ""}
          onValueChange={(v) => updateField("hasPets", v === "" ? null : v)}
          className="flex items-center gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="has-pets-yes" />
            <Label
              htmlFor="has-pets-yes"
              className="text-sm font-normal cursor-pointer"
            >
              Sí
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="has-pets-no" />
            <Label
              htmlFor="has-pets-no"
              className="text-sm font-normal cursor-pointer"
            >
              No
            </Label>
          </div>
        </RadioGroup>
      </div>
      {showPetDetails && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Detalles de mascotas</Label>
          <Textarea
            value={fields.petDetails}
            onChange={(e) => updateField("petDetails", e.target.value)}
            placeholder="Ej. 3 perros (pequeños) y 1 gato"
            className="min-h-[80px]"
          />
        </div>
      )}
    </Phase2SectionWidget>
  );
}
