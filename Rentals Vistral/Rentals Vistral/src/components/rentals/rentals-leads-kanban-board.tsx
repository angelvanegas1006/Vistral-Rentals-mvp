"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RentalsLeadCard } from "./rentals-lead-card";
import { RentalsHomeLoader } from "./rentals-home-loader";
import { useLeads } from "@/hooks/use-leads";
import { mapLeadFromSupabase } from "@/lib/supabase/mappers";

interface Lead {
  id: string;
  leadsUniqueId?: string;
  name: string;
  phone: string;
  email?: string;
  interestedProperty?: {
    id: string;
    address: string;
    city?: string;
  };
  zone?: string;
  currentPhase: string;
  daysInPhase?: number;
  isHighlighted?: boolean;
  needsUpdate?: boolean;
}

interface LeadsKanbanColumn {
  id: string;
  title: string;
  leads: Lead[];
}

interface RentalsLeadsKanbanBoardProps {
  columns?: LeadsKanbanColumn[];
  searchQuery?: string;
  filters?: Record<string, any>;
  loading?: boolean;
}

export const LEAD_PHASE_IDS = [
  "interesado-cualificado",
  "visita-agendada",
  "recogiendo-informacion",
  "calificacion-en-curso",
  "calificacion-aprobada",
  "inquilino-aceptado",
  "interesado-perdido",
  "interesado-rechazado",
] as const;

export const LEAD_PHASE_TITLES: Record<(typeof LEAD_PHASE_IDS)[number], string> = {
  "interesado-cualificado": "Interesado Cualificado",
  "visita-agendada": "Visita Agendada",
  "recogiendo-informacion": "Recogiendo Información",
  "calificacion-en-curso": "Calificación en Curso",
  "calificacion-aprobada": "Interesado Presentado",
  "inquilino-aceptado": "Interesado Aceptado",
  "interesado-perdido": "Interesado Perdido",
  "interesado-rechazado": "Interesado Rechazado",
};

export const LEAD_TERMINAL_PHASE_IDS = ["interesado-perdido", "interesado-rechazado"] as const;

const MOCK_LEADS_BY_PHASE: Record<string, Lead[]> = {
  "interesado-cualificado": [
    { id: "LEAD-001", name: "Juan Pérez", phone: "+34 600 123 456", email: "juan.perez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Interesado Cualificado", daysInPhase: 1 },
    { id: "LEAD-002", name: "María García", phone: "+34 611 234 567", email: "maria.garcia@email.com", zone: "Chamberí", currentPhase: "Interesado Cualificado", daysInPhase: 3 },
  ],
  "visita-agendada": [
    { id: "LEAD-003", name: "Carlos López", phone: "+34 622 345 678", email: "carlos.lopez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Visita Agendada", daysInPhase: 2 },
  ],
  "recogiendo-informacion": [
    { id: "LEAD-004", name: "Ana Martínez", phone: "+34 633 456 789", email: "ana.martinez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Recogiendo Información", daysInPhase: 5 },
    { id: "LEAD-008", name: "Sofía Martín", phone: "+34 677 890 123", email: "sofia.martin@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Recogiendo Información", daysInPhase: 1 },
    { id: "LEAD-009", name: "Pablo Ruiz", phone: "+34 688 901 234", email: "pablo.ruiz@email.com", zone: "Retiro", currentPhase: "Recogiendo Información", daysInPhase: 2 },
  ],
  "calificacion-en-curso": [
    { id: "LEAD-010", name: "Elena Torres", phone: "+34 699 012 345", email: "elena.torres@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Calificación en Curso", daysInPhase: 4 },
  ],
  "calificacion-aprobada": [
    { id: "LEAD-005", name: "Pedro Sánchez", phone: "+34 644 567 890", email: "pedro.sanchez@email.com", interestedProperty: { id: "PROP-006", address: "Calle Alcalá 100, 5º E", city: "Madrid" }, zone: "Centro", currentPhase: "Interesado Presentado", daysInPhase: 7 },
  ],
  "inquilino-aceptado": [
    { id: "LEAD-006", name: "Laura Fernández", phone: "+34 655 678 901", email: "laura.fernandez@email.com", zone: "Salamanca", currentPhase: "Interesado Aceptado", daysInPhase: 10 },
    { id: "LEAD-007", name: "Roberto Silva", phone: "+34 666 789 012", email: "roberto.silva@email.com", zone: "Retiro", currentPhase: "Interesado Aceptado", daysInPhase: 0 },
  ],
  "interesado-perdido": [],
  "interesado-rechazado": [],
};

export const mockLeadsColumns: LeadsKanbanColumn[] = LEAD_PHASE_IDS.map((id) => ({
  id,
  title: LEAD_PHASE_TITLES[id],
  leads: MOCK_LEADS_BY_PHASE[id] || [],
}));

export function RentalsLeadsKanbanBoard({
  columns: providedColumns,
  searchQuery = "",
  filters = {},
  loading = false,
}: RentalsLeadsKanbanBoardProps) {
  const router = useRouter();
  const [localColumns, setLocalColumns] = useState<LeadsKanbanColumn[]>([]);

  const leadPhases = LEAD_PHASE_IDS.map((id) => LEAD_PHASE_TITLES[id]);

  const { leads: allSupabaseLeads, loading: allLeadsLoading, refetch: refetchLeads } = useLeads({
    searchQuery,
    filters,
  });

  const autoAdvanceRan = useRef(false);
  useEffect(() => {
    if (autoAdvanceRan.current) return;
    autoAdvanceRan.current = true;

    let cancelled = false;
    fetch("/api/leads/auto-advance-visits", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.advanced > 0) {
          console.log(`[kanban] auto-advance: ${data.advanced} MTPs advanced, ${data.leadsUpdated} leads updated`);
          refetchLeads();
        }
      })
      .catch((err) => {
        console.error("[kanban] auto-advance error:", err);
      });

    return () => {
      cancelled = true;
      autoAdvanceRan.current = false;
    };
  }, [refetchLeads]);

  const supabaseColumns = useMemo(() => {
    if (!allSupabaseLeads || allSupabaseLeads.length === 0) return null;

    const columnsMap: Record<string, Lead[]> = {};
    const phaseNameMap: Record<string, string> = {
      "Calificación aprobada": "Interesado Presentado",
      "Inquilino presentado": "Interesado Presentado",
      "Inquilino aceptado": "Interesado Aceptado",
      "Perfil cualificado": "Interesado Cualificado",
      "Interesado cualificado": "Interesado Cualificado",
      "Visita agendada": "Visita Agendada",
      "Recogiendo información": "Recogiendo Información",
      "Calificación en curso": "Calificación en Curso",
      "Interesado presentado": "Interesado Presentado",
      "Interesado aceptado": "Interesado Aceptado",
      "Interesado perdido": "Interesado Perdido",
      "Interesado rechazado": "Interesado Rechazado",
    };

    allSupabaseLeads.forEach((leadRow) => {
      const mappedLead = mapLeadFromSupabase(leadRow);
      const phaseNameForIndex = phaseNameMap[mappedLead.currentPhase] ?? mappedLead.currentPhase;
      const phaseIndex = leadPhases.indexOf(phaseNameForIndex);
      const phaseId = phaseIndex >= 0 ? LEAD_PHASE_IDS[phaseIndex] : LEAD_PHASE_IDS[0];

      if (!columnsMap[phaseId]) columnsMap[phaseId] = [];
      columnsMap[phaseId].push(mappedLead);
    });

    return LEAD_PHASE_IDS.map((phaseId) => ({
      id: phaseId,
      title: LEAD_PHASE_TITLES[phaseId],
      leads: columnsMap[phaseId] || [],
    }));
  }, [allSupabaseLeads]);

  const columns = useMemo(() => {
    if (providedColumns) return providedColumns;
    if (supabaseColumns && supabaseColumns.length > 0) return supabaseColumns;
    return mockLeadsColumns;
  }, [providedColumns, supabaseColumns]);

  const prevColumnsRef = useRef<string>("");

  useEffect(() => {
    const sig = JSON.stringify(columns.map((c) => ({ id: c.id, leadIds: c.leads.map((l) => l.id).sort() })));
    if (sig !== prevColumnsRef.current) {
      prevColumnsRef.current = sig;
      setLocalColumns(columns);
    }
  }, [columns]);

  const filteredColumns = useMemo(() => {
    const processLeads = (leads: Lead[], highlight: boolean) =>
      [...leads]
        .sort((a, b) => (a.daysInPhase ?? Infinity) - (b.daysInPhase ?? Infinity))
        .map((lead) => ({ ...lead, isHighlighted: highlight }));

    if (!searchQuery.trim()) {
      return localColumns.map((col) => ({ ...col, leads: processLeads(col.leads, false) }));
    }

    const query = searchQuery.toLowerCase();
    return localColumns.map((col) => ({
      ...col,
      leads: processLeads(
        col.leads.filter((lead) => {
          return (
            lead.name.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query) ||
            lead.interestedProperty?.address.toLowerCase().includes(query) ||
            lead.interestedProperty?.city?.toLowerCase().includes(query) ||
            lead.zone?.toLowerCase().includes(query)
          );
        }),
        true
      ),
    }));
  }, [localColumns, searchQuery]);

  const handleCardClick = (leadId: string) => {
    router.push(`/rentals/leads/${leadId}`);
  };

  if (loading || allLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <RentalsHomeLoader />
      </div>
    );
  }

  return (
    <div className="flex gap-gutter-md lg:gap-gutter-lg xl:gap-gutter-xl h-full min-w-max overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      {filteredColumns.map((column, colIndex) => {
        const isTerminalPhase = (LEAD_TERMINAL_PHASE_IDS as readonly string[]).includes(column.id);
        const showSeparatorBefore =
          isTerminalPhase &&
          colIndex > 0 &&
          !(LEAD_TERMINAL_PHASE_IDS as readonly string[]).includes(filteredColumns[colIndex - 1]?.id ?? "");

        return (
          <React.Fragment key={column.id}>
            {showSeparatorBefore && (
              <div className="flex-shrink-0 w-px self-stretch bg-border mx-1" aria-hidden />
            )}
            <div
              data-column-id={column.id}
              className={cn(
                "flex flex-col flex-shrink-0 min-w-[320px] md:min-w-[320px] w-full md:w-[320px] pt-[7px] pb-[7px]",
                isTerminalPhase && [
                  "border-l border-border pl-4 ml-2",
                  "bg-muted/30 dark:bg-muted/10 rounded-r-lg",
                ]
              )}
            >
              <div className="mb-[7px] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2
                    className={cn(
                      "text-sm font-semibold",
                      isTerminalPhase ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {column.title}
                  </h2>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isTerminalPhase ? "text-muted-foreground/80 bg-muted/50" : "text-muted-foreground bg-muted"
                    )}
                  >
                    {column.leads.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {column.leads.length === 0 ? (
                  <div
                    className={cn(
                      "rounded-lg p-6 text-center",
                      isTerminalPhase
                        ? "bg-muted/20 dark:bg-muted/5 border border-dashed border-border"
                        : "bg-card dark:bg-[#000000] border border-border md:border-0 md:bg-transparent"
                    )}
                  >
                    <p className="text-sm font-medium text-muted-foreground">No hay interesados</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Los interesados aparecerán aquí</p>
                  </div>
                ) : (
                  column.leads.map((lead) => (
                    <RentalsLeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => handleCardClick(lead.id)}
                      searchQuery={searchQuery}
                      disabled={isTerminalPhase}
                    />
                  ))
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
