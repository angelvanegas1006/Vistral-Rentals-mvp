"use client";

import { useMemo, useState, useEffect } from "react";
import { Banknote, Calendar, FileText, Zap } from "lucide-react";
import { useProperty } from "@/hooks/use-property";
import { cn } from "@/lib/utils";
import { format, differenceInDays, differenceInMonths, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { DocumentSection } from "@/components/ui/DocumentSection";

interface RentalSummaryTabProps {
  propertyId: string;
  currentPhase?: string;
}

const labelStyle = "text-base font-medium text-[#6B7280] dark:text-[#9CA3AF]";

/** Format YYYY-MM-DD to DD/MM/YY */
function formatShortDate(dateStr: string | null): string {
  if (!dateStr || !dateStr.trim()) return "—";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yy", { locale: es }) : "—";
}

/** Next rent revision = next_rent_update_date, or lease_start_date + 1 year */
function getNextRevisionDate(
  nextRentUpdate: string | null,
  leaseStart: string | null
): string | null {
  if (nextRentUpdate && nextRentUpdate.trim()) return nextRentUpdate;
  if (!leaseStart || !leaseStart.trim()) return null;
  const d = parseISO(leaseStart);
  if (!isValid(d)) return null;
  const next = new Date(d);
  next.setFullYear(next.getFullYear() + 1);
  return format(next, "yyyy-MM-dd");
}

/** Progress 0–100: today between lease_start_date and lease_end_date */
function getLeaseProgressPercent(
  startStr: string | null,
  endStr: string | null
): number | null {
  if (!startStr || !endStr) return null;
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (!isValid(start) || !isValid(end) || end <= start) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  if (today <= s) return 0;
  if (today >= e) return 100;
  const total = differenceInDays(e, s);
  const elapsed = differenceInDays(today, s);
  return Math.round((elapsed / total) * 100);
}

/** Duration label for badge: e.g. "12 meses", "6 años" (display as "6 Años" in pill) */
function getDurationLabel(
  duration: string | null,
  unit: "months" | "years" | null
): string | null {
  if (!duration || !duration.trim()) return null;
  if (!unit) return duration;
  if (unit === "months") return `${duration} meses`;
  if (unit === "years") return `${duration} años`;
  return duration;
}

export function RentalSummaryTab({ propertyId }: RentalSummaryTabProps) {
  const { property, loading } = useProperty(propertyId);
  const [localProperty, setLocalProperty] = useState(property ?? null);

  useEffect(() => {
    setLocalProperty(property ?? null);
  }, [property]);

  const finalRentAmount = (localProperty ?? property)?.final_rent_amount ?? null;
  const prop = localProperty ?? property;
  const leaseStart = prop?.lease_start_date ?? null;
  const leaseEnd = prop?.lease_end_date ?? null;
  const nextRentUpdate = prop?.next_rent_update_date ?? null;
  const leaseDuration = prop?.lease_duration ?? null;
  const leaseDurationUnit = prop?.lease_duration_unit ?? null;

  const nextRevision = useMemo(
    () => getNextRevisionDate(nextRentUpdate, leaseStart),
    [nextRentUpdate, leaseStart]
  );

  const revisionContext = useMemo(() => {
    if (!nextRevision) return null;
    const nextDate = parseISO(nextRevision);
    if (!isValid(nextDate)) return null;
    const daysUntil = differenceInDays(nextDate, new Date());
    const monthsUntil = differenceInMonths(nextDate, new Date());
    const formatted = format(nextDate, "d MMM yyyy", { locale: es });
    const monthsText =
      monthsUntil <= 0
        ? "próximamente"
        : `en ${monthsUntil} ${monthsUntil === 1 ? "mes" : "meses"}`;
    return { formatted, monthsText, daysUntil };
  }, [nextRevision]);

  const progressPercent = useMemo(
    () => getLeaseProgressPercent(leaseStart, leaseEnd),
    [leaseStart, leaseEnd]
  );

  const durationLabel = useMemo(
    () => getDurationLabel(leaseDuration, leaseDurationUnit),
    [leaseDuration, leaseDurationUnit]
  );

  const isRevisionSoon =
    (revisionContext?.daysUntil ?? 999) < 45 &&
    (revisionContext?.daysUntil ?? 0) >= 0;

  const cardStyle =
    "text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm";

  if (loading) {
    return (
      <div className="space-y-8">
        <div className={cn(cardStyle, "animate-pulse")}>
          <div className="h-7 w-24 bg-[#E5E7EB] dark:bg-[#374151] rounded mb-6" />
          <div className="h-10 w-32 bg-[#E5E7EB] dark:bg-[#374151] rounded" />
          <div className="mt-2 h-4 w-48 bg-[#E5E7EB] dark:bg-[#374151] rounded" />
        </div>
        <div className={cn(cardStyle, "animate-pulse")}>
          <div className="h-7 w-20 bg-[#E5E7EB] dark:bg-[#374151] rounded mb-6" />
          <div className="h-3 w-full bg-[#E5E7EB] dark:bg-[#374151] rounded-full" />
          <div className="mt-2 flex justify-between">
            <div className="h-4 w-20 bg-[#E5E7EB] dark:bg-[#374151] rounded" />
            <div className="h-4 w-20 bg-[#E5E7EB] dark:bg-[#374151] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Card 1: Renta actual */}
      <div className={cardStyle}>
        <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <div className="text-base font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Renta actual
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {finalRentAmount != null && finalRentAmount > 0
                ? `${Number(finalRentAmount).toLocaleString("es-ES")} €`
                : "—"}
            </p>
          </div>
          {revisionContext && (
            <p
              className={cn(
                "text-sm text-gray-500 dark:text-gray-400 shrink-0",
                isRevisionSoon &&
                  "text-amber-600 dark:text-amber-500 font-medium"
              )}
            >
              Próxima revisión: {revisionContext.formatted} (
              {revisionContext.monthsText})
            </p>
          )}
        </div>
      </div>

      {/* Card 2: Cronología */}
      <div className={cardStyle}>
        <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
          <div className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
            Cronología
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {durationLabel && (
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                {durationLabel}
              </span>
            )}
          </div>
          <div className="w-full h-2 sm:h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              style={{
                width: `${progressPercent != null ? progressPercent : 0}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Inicio: {formatShortDate(leaseStart)}</span>
            <span>Fin: {formatShortDate(leaseEnd)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Documentos (misma estructura que tab Inversor) */}
      {localProperty && (
        <div className={cn(cardStyle, "hover:shadow-md transition-shadow")}>
          <div className="flex flex-col space-y-1.5 p-0 pb-4 border-b border-[#E5E7EB] dark:border-[#374151] mb-4">
            <div className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
              Documentos
            </div>
          </div>
          <div className="space-y-6">
            {/* 1. Contractuales y Financieros */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Contractuales y Financieros
              </h4>
              <DocumentSection
                title="Contractuales y Financieros"
                icon={FileText}
                fixedFields={[
                  { dbField: "signed_lease_contract_url", label: "Contrato de alquiler firmado", path: "rental/contractual_financial/lease_contract" },
                  { dbField: "guarantee_file_url", label: "Garantía de renta ilimitada de Finaer", path: "rental/contractual_financial/non-payment_insurance" },
                  { dbField: "deposit_receipt_file_url", label: "Resguardo del depósito de la fianza", path: "rental/contractual_financial/deposit" },
                  { dbField: "first_rent_payment_file_url", label: "Comprobante de transferencia del mes en curso", path: "rental/contractual_financial/first_rent_payment" },
                ]}
                customField="rental_custom_contractual_financial_documents"
                customPath="rental/contractual_financial/other"
                property={localProperty}
                onPropertyUpdate={(updates) => {
                  setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                }}
                hideTitle={true}
              />
            </div>

            {/* 2. Suministros (misma lógica que tab Documentos de Propiedad: Electricidad, Agua, Gas + custom) */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Suministros
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Electricidad</span>
                  <DocumentSection
                    title="Electricidad"
                    icon={Zap}
                    fixedFields={[
                      { dbField: "tenant_contract_electricity", label: "Contrato Electricidad", path: "rental/utilities" },
                    ]}
                    customField=""
                    customPath="rental/utilities"
                    property={localProperty}
                    onPropertyUpdate={(updates) => {
                      setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                    }}
                    hideTitle={true}
                    hideCustomDocuments={true}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Agua</span>
                  <DocumentSection
                    title="Agua"
                    icon={Zap}
                    fixedFields={[
                      { dbField: "tenant_contract_water", label: "Contrato Agua", path: "rental/utilities" },
                    ]}
                    customField=""
                    customPath="rental/utilities"
                    property={localProperty}
                    onPropertyUpdate={(updates) => {
                      setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                    }}
                    hideTitle={true}
                    hideCustomDocuments={true}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Gas</span>
                  <DocumentSection
                    title="Gas"
                    icon={Zap}
                    fixedFields={[
                      { dbField: "tenant_contract_gas", label: "Contrato Gas", path: "rental/utilities" },
                    ]}
                    customField=""
                    customPath="rental/utilities"
                    property={localProperty}
                    onPropertyUpdate={(updates) => {
                      setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                    }}
                    hideTitle={true}
                    hideCustomDocuments={true}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Otros</span>
                  <DocumentSection
                    title="Otros suministros"
                    icon={Zap}
                    fixedFields={[]}
                    customField="rental_custom_utilities_documents"
                    customPath="rental/utilities"
                    property={localProperty}
                    onPropertyUpdate={(updates) => {
                      setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                    }}
                    hideTitle={true}
                  />
                </div>
              </div>
            </div>

            {/* 3. Otros Documentos del Alquiler (igual que Otros en Inversor) */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#374151] pb-2">
                Otros Documentos del Alquiler
              </h4>
              <DocumentSection
                title="Otros Documentos del Alquiler"
                icon={FileText}
                fixedFields={[]}
                customField="rental_custom_other_documents"
                customPath="rental/other"
                property={localProperty}
                onPropertyUpdate={(updates) => {
                  setLocalProperty((prev) => (prev ? { ...prev, ...updates } : prev));
                }}
                hideTitle={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
