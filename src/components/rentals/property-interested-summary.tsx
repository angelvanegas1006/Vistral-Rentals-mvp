"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterestedLead {
  leadId: string;
  leadName: string;
  mtpStatus: string;
}

interface StatusRowData {
  id: string;
  label: string;
  count: number;
  leads: { leadId: string; leadName: string }[];
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

const MTP_STATUSES_DISPLAY: Omit<StatusRowData, "count" | "leads">[] = [
  {
    id: "interesado_cualificado",
    label: "Interesado Cualificado",
    accentBorder: "border-l-blue-300 dark:border-l-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeText: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: "visita_agendada",
    label: "Visita Agendada",
    accentBorder: "border-l-blue-700 dark:border-l-blue-500",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/50",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    dotColor: "bg-indigo-500",
  },
  {
    id: "pendiente_de_evaluacion",
    label: "Pendiente de Evaluación",
    accentBorder: "border-l-blue-300 dark:border-l-blue-400",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50",
    badgeText: "text-violet-700 dark:text-violet-300",
    dotColor: "bg-violet-500",
  },
  {
    id: "esperando_decision",
    label: "Esperando Decisión",
    accentBorder: "border-l-blue-700 dark:border-l-blue-500",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-700 dark:text-purple-300",
    dotColor: "bg-purple-500",
  },
  {
    id: "recogiendo_informacion",
    label: "Recogiendo Información",
    accentBorder: "border-l-blue-300 dark:border-l-blue-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "calificacion_en_curso",
    label: "Calificación en Curso",
    accentBorder: "border-l-blue-700 dark:border-l-blue-500",
    badgeBg: "bg-orange-100 dark:bg-orange-900/50",
    badgeText: "text-orange-700 dark:text-orange-300",
    dotColor: "bg-orange-500",
  },
  {
    id: "interesado_presentado",
    label: "Interesado Presentado",
    accentBorder: "border-l-blue-300 dark:border-l-blue-400",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50",
    badgeText: "text-teal-700 dark:text-teal-300",
    dotColor: "bg-teal-500",
  },
];

export function PropertyInterestedSummary({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<StatusRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/interested`);
      if (!res.ok) throw new Error("fetch failed");
      const { interested } = (await res.json()) as { interested: InterestedLead[] };

      const grouped = new Map<string, { leadId: string; leadName: string }[]>();
      for (const s of MTP_STATUSES_DISPLAY) {
        grouped.set(s.id, []);
      }

      for (const item of interested) {
        if (grouped.has(item.mtpStatus)) {
          grouped.get(item.mtpStatus)!.push({ leadId: item.leadId, leadName: item.leadName });
        }
      }

      const result: StatusRowData[] = MTP_STATUSES_DISPLAY.map((s) => ({
        ...s,
        count: grouped.get(s.id)?.length ?? 0,
        leads: grouped.get(s.id) ?? [],
      }));

      setRows(result);
      setTotal(interested.length);
    } catch (err) {
      console.error("Error fetching interested summary:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhase((prev) => (prev === phaseId ? null : phaseId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <Users className="h-8 w-8 opacity-40" />
        <p className="text-sm">No hay interesados activos para esta propiedad</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} interesado{total !== 1 ? "s" : ""} activo{total !== 1 ? "s" : ""} en total
      </p>

      <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#374151]">
        {rows.map((row) => (
          <div key={row.id}>
            <button
              type="button"
              onClick={() => row.count > 0 && togglePhase(row.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left border-l-[3px] transition-colors",
                row.accentBorder,
                "bg-white dark:bg-[#1F2937]",
                row.count > 0
                  ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#263244]"
                  : "cursor-default"
              )}
            >
              <span className="text-sm font-medium text-foreground flex-1">
                {row.label}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                  row.count > 0
                    ? cn(row.badgeBg, row.badgeText)
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                )}
              >
                <User className="h-3 w-3" />
                {row.count}
              </span>

              {row.count > 0 && (
                expandedPhase === row.id ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )
              )}
            </button>

            {expandedPhase === row.id && row.count > 0 && (
              <div className="border-l-[3px] border-l-transparent bg-gray-50 dark:bg-[#111827] px-5 py-2">
                {row.leads.map((lead) => (
                  <div
                    key={lead.leadId}
                    className="flex items-center gap-2.5 py-1.5 text-sm text-foreground"
                  >
                    <div className={cn("h-2 w-2 rounded-full shrink-0", row.dotColor)} />
                    <span className="truncate">{lead.leadName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
