"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NationalityCombobox } from "@/components/ui/nationality-combobox";
import { LeadIdentityDocumentField } from "@/components/rentals/lead-identity-document-field";
import { useUpdateLead } from "@/hooks/use-update-lead";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NATIONALITIES } from "@/lib/constants/nationalities";

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

const schema = z.object({
  nationality: z.string(),
  identity_doc_type: z.enum(["DNI", "NIE", "Pasaporte"]).optional().nullable(),
  identity_doc_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  family_profile: z.enum(["Soltero", "Pareja", "Con hijos"]).optional().nullable(),
  children_count: z.coerce.number().int().min(0).optional().nullable(),
  pet_info_notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.nationality === "España") {
      return !data.identity_doc_type || ["DNI", "Pasaporte"].includes(data.identity_doc_type);
    }
    if (data.nationality && data.nationality !== "España") {
      return !data.identity_doc_type || ["NIE", "Pasaporte"].includes(data.identity_doc_type);
    }
    return true;
  },
  { message: "Tipo de documento no válido para esta nacionalidad", path: ["identity_doc_type"] }
);

type FormValues = z.infer<typeof schema>;

export interface LeadPersonalInfoData {
  id: string;
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

interface LeadPersonalInfoSectionProps {
  lead: LeadPersonalInfoData;
}

export function LeadPersonalInfoSection({ lead }: LeadPersonalInfoSectionProps) {
  const router = useRouter();
  const { updateLead } = useUpdateLead();

  const isSpanish = (n: string) => n === "España";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nationality: lead.nationality ?? "",
      identity_doc_type: lead.identityDocType ?? null,
      identity_doc_number: lead.identityDocNumber ?? "",
      date_of_birth: lead.dateOfBirth ? lead.dateOfBirth.slice(0, 10) : "",
      family_profile: lead.familyProfile ?? null,
      children_count: lead.childrenCount ?? null,
      pet_info_notes: (lead.petInfo as { notes?: string } | null)?.notes ?? "",
    },
  });

  const nationality = form.watch("nationality");
  const familyProfile = form.watch("family_profile");
  const showChildrenCount = familyProfile === "Con hijos";

  // Sync identity_doc_type options when nationality changes: reset if invalid
  useEffect(() => {
    const current = form.getValues("identity_doc_type");
    if (!current) return;
    const allowed = isSpanish(nationality) ? IDENTITY_DOC_TYPES_ES : IDENTITY_DOC_TYPES_NON_ES;
    if (!allowed.includes(current)) {
      form.setValue("identity_doc_type", null);
    }
  }, [nationality, form]);

  const onSubmit = async (values: FormValues) => {
    const dateOfBirth = values.date_of_birth || null;
    const age = computeAge(dateOfBirth);

    const success = await updateLead(lead.id, {
      nationality: values.nationality || null,
      identity_doc_type: values.identity_doc_type ?? null,
      identity_doc_number: values.identity_doc_number || null,
      date_of_birth: dateOfBirth,
      age,
      family_profile: values.family_profile ?? null,
      children_count: showChildrenCount ? (values.children_count ?? null) : null,
      pet_info: values.pet_info_notes
        ? { notes: values.pet_info_notes }
        : null,
    });

    if (success) {
      toast.success("Datos guardados correctamente");
      router.refresh();
    } else {
      toast.error("Error al guardar. Inténtalo de nuevo.");
    }
  };

  const handleIdentityDocUpdate = async (url: string | null) => {
    const success = await updateLead(lead.id, { identity_doc_url: url });
    if (success) router.refresh();
  };

  return (
    <Card
      id="section-personal-info"
      className="border border-[#E5E7EB] dark:border-[#374151] shadow-sm"
    >
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Información Personal del Interesado
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Rellena los datos personales y de perfil familiar del interesado.
        </p>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />
      <CardContent className="space-y-4 px-4 py-4 pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            {/* Nacionalidad */}
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidad</FormLabel>
                  <FormControl>
                    <NationalityCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Buscar nacionalidad..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo documento */}
            <FormField
              control={form.control}
              name="identity_doc_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de documento de identidad</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v === "" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(isSpanish(nationality) ? IDENTITY_DOC_TYPES_ES : IDENTITY_DOC_TYPES_NON_ES).map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número documento */}
            <FormField
              control={form.control}
              name="identity_doc_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de documento de identidad</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej. 12345678A" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Documento de identidad (subida) */}
            <div className="space-y-2">
              <LeadIdentityDocumentField
                leadId={lead.id}
                value={lead.identityDocUrl ?? null}
                onUpdate={handleIdentityDocUpdate}
              />
            </div>

            {/* Fecha nacimiento */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Edad (solo lectura) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Edad</Label>
              <p className={cn(
                "text-sm rounded-md border border-[#E5E7EB] dark:border-[#374151] bg-muted/30 px-3 py-2",
                lead.age != null ? "text-[#111827] dark:text-[#F9FAFB]" : "text-muted-foreground"
              )}>
                {lead.age != null ? `${lead.age} años` : "Se calcula al guardar la fecha de nacimiento"}
              </p>
            </div>

            {/* Perfil familiar */}
            <FormField
              control={form.control}
              name="family_profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil familiar</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v === "" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FAMILY_PROFILES.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número de hijos - solo si Con hijos */}
            {showChildrenCount && (
              <FormField
                control={form.control}
                name="children_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de hijos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mascotas */}
            <FormField
              control={form.control}
              name="pet_info_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mascotas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ej. 1 perro, 2 gatos..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full sm:w-auto">
              Guardar cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
