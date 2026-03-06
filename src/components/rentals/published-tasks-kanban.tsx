"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MTP_ACTIVE_STATUSES,
  MTP_INACTIVE_STATUSES,
  type InterestedLeadItem,
  type MtpStatusDisplay,
} from "@/lib/leads/mtp-display";

interface PublishedTasksKanbanProps {
  interested: InterestedLeadItem[];
  onNavigateToLead: (leadUuid: string) => void;
}

interface KanbanRow {
  statuses: MtpStatusDisplay["id"][];
  bg: string;
}

const ACTIVE_ROWS: KanbanRow[] = [
  {
    statuses: ["interesado_cualificado", "visita_agendada"],
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
  },
  {
    statuses: ["pendiente_de_evaluacion", "esperando_decision"],
    bg: "bg-indigo-50/70 dark:bg-indigo-950/20",
  },
  {
    statuses: ["recogiendo_informacion", "calificacion_en_curso"],
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
  },
  {
    statuses: ["interesado_presentado"],
    bg: "bg-teal-50/70 dark:bg-teal-950/20",
  },
];

const INACTIVE_ROWS: KanbanRow[] = [
  {
    statuses: ["rechazado_por_finaer", "rechazado_por_propietario"],
    bg: "bg-red-50/70 dark:bg-red-950/20",
  },
  {
    statuses: ["interesado_rechazado", "interesado_perdido"],
    bg: "bg-pink-50/50 dark:bg-pink-950/15",
  },
  {
    statuses: ["descartada", "en_espera"],
    bg: "bg-gray-50/70 dark:bg-gray-900/30",
  },
];

const ACTIVE_MAP = new Map(MTP_ACTIVE_STATUSES.map((s) => [s.id, s]));
const INACTIVE_MAP = new Map(MTP_INACTIVE_STATUSES.map((s) => [s.id, s]));

function MiniLeadCard({
  lead,
  dotColor,
  onNavigate,
}: {
  lead: InterestedLeadItem;
  dotColor: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-md px-3 py-2 shadow-sm">
      <div className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
      <span className="text-sm text-foreground truncate flex-1">
        {lead.leadName}
      </span>
      <button
        type="button"
        onClick={onNavigate}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
      >
        Ver más
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

function StatusColumn({
  display,
  leads,
  onNavigateToLead,
}: {
  display: MtpStatusDisplay;
  leads: InterestedLeadItem[];
  onNavigateToLead: (leadUuid: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-lg p-3 flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn("h-2.5 w-2.5 rounded-full shrink-0", display.dotColor)}
        />
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex-1 truncate">
          {display.label}
        </h4>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            leads.length > 0
              ? cn(display.badgeBg, display.badgeText)
              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
          )}
        >
          {leads.length}
        </span>
      </div>

      {leads.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 py-1">
          Sin interesados
        </p>
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => (
            <MiniLeadCard
              key={`${lead.leadId}-${display.id}`}
              lead={lead}
              dotColor={display.dotColor}
              onNavigate={() => onNavigateToLead(lead.leadUuid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanRows({
  rows,
  statusMap,
  interested,
  onNavigateToLead,
}: {
  rows: KanbanRow[];
  statusMap: Map<string, MtpStatusDisplay>;
  interested: InterestedLeadItem[];
  onNavigateToLead: (leadUuid: string) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={cn("rounded-lg p-3", row.bg)}
        >
          <div className="flex gap-3">
            {row.statuses.map((statusId) => {
              const display = statusMap.get(statusId);
              if (!display) return null;
              const leads = interested.filter(
                (i) => i.mtpStatus === statusId
              );
              return (
                <StatusColumn
                  key={statusId}
                  display={display}
                  leads={leads}
                  onNavigateToLead={onNavigateToLead}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublishedTasksKanban({
  interested,
  onNavigateToLead,
}: PublishedTasksKanbanProps) {
  const [inactiveOpen, setInactiveOpen] = useState(false);

  const activeTotal = useMemo(
    () =>
      interested.filter((i) =>
        MTP_ACTIVE_STATUSES.some((s) => s.id === i.mtpStatus)
      ).length,
    [interested]
  );

  const inactiveTotal = useMemo(
    () =>
      interested.filter((i) =>
        MTP_INACTIVE_STATUSES.some((s) => s.id === i.mtpStatus)
      ).length,
    [interested]
  );

  return (
    <div className="space-y-6">
      {/* Activos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Interesados Activos
          </h4>
          <Badge variant="secondary" className="text-xs">
            {activeTotal}
          </Badge>
        </div>
        <KanbanRows
          rows={ACTIVE_ROWS}
          statusMap={ACTIVE_MAP}
          interested={interested}
          onNavigateToLead={onNavigateToLead}
        />
      </div>

      {/* Inactivos (colapsable) */}
      <div>
        <button
          type="button"
          onClick={() => setInactiveOpen(!inactiveOpen)}
          className="flex items-center gap-2 mb-3 group cursor-pointer"
        >
          {inactiveOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <h4 className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Interesados Inactivos
          </h4>
          <Badge
            variant="secondary"
            className="text-xs bg-gray-100 dark:bg-gray-800"
          >
            {inactiveTotal}
          </Badge>
        </button>
        {inactiveOpen && (
          <KanbanRows
            rows={INACTIVE_ROWS}
            statusMap={INACTIVE_MAP}
            interested={interested}
            onNavigateToLead={onNavigateToLead}
          />
        )}
      </div>
    </div>
  );
}
