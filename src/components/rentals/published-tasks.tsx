"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, ChevronDown, ChevronUp, User, ExternalLink, Copy, Check, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublishedTasksKanban } from "./published-tasks-kanban";
import { AcceptedLeadDetailModal } from "./accepted-lead-detail-modal";
import {
  MTP_ACTIVE_STATUSES,
  MTP_INACTIVE_STATUSES,
  type InterestedLeadItem,
  type MtpStatusDisplay,
} from "@/lib/leads/mtp-display";

export interface AcceptedLeadData {
  leadId: string;
  leadUuid: string;
  leadName: string;
  phone: string;
  email: string;
  occupant_count?: number | null;
  move_in_timeframe?: string | null;
  lease_duration_preference?: string | null;
  employment_status?: string | null;
  job_title?: string | null;
  monthly_net_income?: number | null;
  has_guarantor?: boolean | null;
}

interface PublishedTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
  onAcceptedLeadChange?: (hasAccepted: boolean) => void;
}

interface StatusGroup {
  display: MtpStatusDisplay;
  leads: InterestedLeadItem[];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PublishedTasks({ property, onAcceptedLeadChange }: PublishedTasksProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"lists" | "kanban">("lists");
  const [interested, setInterested] = useState<InterestedLeadItem[]>([]);
  const [acceptedLead, setAcceptedLead] = useState<AcceptedLeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/properties/${encodeURIComponent(property.property_unique_id)}/interested`
      );
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      const items: InterestedLeadItem[] = json.interested || [];
      const accepted: AcceptedLeadData | null = json.acceptedLead || null;
      setInterested(items);
      setAcceptedLead(accepted);
      onAcceptedLeadChange?.(!!accepted);
    } catch (err) {
      console.error("Error fetching interested summary:", err);
    } finally {
      setLoading(false);
    }
  }, [property.property_unique_id, onAcceptedLeadChange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeGroups: StatusGroup[] = useMemo(() => {
    return MTP_ACTIVE_STATUSES.map((display) => ({
      display,
      leads: interested.filter((i) => i.mtpStatus === display.id),
    }));
  }, [interested]);

  const inactiveGroups: StatusGroup[] = useMemo(() => {
    return MTP_INACTIVE_STATUSES.map((display) => ({
      display,
      leads: interested.filter((i) => i.mtpStatus === display.id),
    }));
  }, [interested]);

  const activeTotal = useMemo(
    () => activeGroups.reduce((sum, g) => sum + g.leads.length, 0),
    [activeGroups]
  );

  const inactiveTotal = useMemo(
    () => inactiveGroups.reduce((sum, g) => sum + g.leads.length, 0),
    [inactiveGroups]
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhase((prev) => (prev === phaseId ? null : phaseId));
  };

  const handleNavigateToLead = (leadUuid: string) => {
    router.push(`/rentals/leads/${leadUuid}`);
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

  const renderStatusRow = (group: StatusGroup) => {
    const { display, leads } = group;
    return (
      <div key={display.id}>
        <button
          type="button"
          onClick={() => leads.length > 0 && togglePhase(display.id)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-left border-l-[3px] transition-colors",
            display.accentBorder,
            "bg-white dark:bg-[#1F2937]",
            leads.length > 0
              ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#263244]"
              : "cursor-default"
          )}
        >
          <span className="text-sm font-medium text-foreground flex-1">
            {display.label}
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              leads.length > 0
                ? cn(display.badgeBg, display.badgeText)
                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            )}
          >
            <User className="h-3 w-3" />
            {leads.length}
          </span>

          {leads.length > 0 &&
            (expandedPhase === display.id ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ))}
        </button>

        {expandedPhase === display.id && leads.length > 0 && (
          <div className="border-l-[3px] border-l-transparent bg-gray-50 dark:bg-[#111827] px-5 py-2">
            {leads.map((lead) => (
              <div
                key={`${lead.leadId}-${display.id}`}
                className="flex items-center gap-2.5 py-1.5 text-sm text-foreground"
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    display.dotColor
                  )}
                />
                <span className="truncate flex-1">{lead.leadName}</span>
                <button
                  type="button"
                  onClick={() => handleNavigateToLead(lead.leadUuid)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
                >
                  Ver más
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border transition-all shadow-sm border-gray-200 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      </Card>
    );
  }

  // --- Accepted Lead View ---
  if (acceptedLead) {
    const leadForModal = {
      id: acceptedLead.leadUuid,
      name: acceptedLead.leadName,
      phone: acceptedLead.phone,
      email: acceptedLead.email,
      currentPhase: "Interesado Aceptado",
      occupant_count: acceptedLead.occupant_count,
      move_in_timeframe: acceptedLead.move_in_timeframe,
      lease_duration_preference: acceptedLead.lease_duration_preference,
      employment_status: acceptedLead.employment_status,
      job_title: acceptedLead.job_title,
      monthly_net_income: acceptedLead.monthly_net_income,
      has_guarantor: acceptedLead.has_guarantor,
    };

    return (
      <>
        <Card className="border transition-all shadow-sm border-green-200 dark:border-green-800 bg-white dark:bg-gray-800" id="section-accepted-lead">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Interesado aceptado
              </h3>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

          <div className="px-4 py-4">
            <div className="text-card-foreground bg-white dark:bg-[#1F2937] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-sm">
              {/* Header: Avatar + Name + Ver más detalles */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {getInitials(acceptedLead.leadName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    {acceptedLead.leadName}
                  </p>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    Interesado aceptado
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModalOpen(true)}
                  className="h-8 w-8 shrink-0"
                  title="Ver más detalles"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Contact info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Teléfono</p>
                  {acceptedLead.phone ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${acceptedLead.phone.replace(/\s/g, "")}`}
                        className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                      >
                        {acceptedLead.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(acceptedLead.phone, "accepted-phone")}
                        className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                        title="Copiar teléfono"
                      >
                        {copiedField === "accepted-phone" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">No disponible</p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Email</p>
                  {acceptedLead.email ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${acceptedLead.email}`}
                        className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                      >
                        {acceptedLead.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(acceptedLead.email, "accepted-email")}
                        className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-[#374151] rounded transition-colors"
                        title="Copiar email"
                      >
                        {copiedField === "accepted-email" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">No disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <AcceptedLeadDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          lead={leadForModal}
          onLeadUpdate={fetchData}
        />
      </>
    );
  }

  // --- Normal (no accepted lead) View ---
  const total = activeTotal + inactiveTotal;

  return (
    <Card className="border transition-all shadow-sm border-gray-200 bg-white dark:bg-gray-800" id="section-accepted-lead">
      {/* Header: titulo + descripción */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Resumen de Interesados
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {total} interesado{total !== 1 ? "s" : ""} en total
              {activeTotal > 0 && (
                <span>
                  {" "}
                  &middot; {activeTotal} activo{activeTotal !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

      {/* Toggle Listas/Kanban + contenido */}
      <div className="px-4 py-4">
        <div className="space-y-4">
          {/* Toggle de vista */}
          <div className="flex items-center gap-2 bg-accent dark:bg-[var(--vistral-gray-800)] rounded-lg p-1">
            <Button
              variant={viewMode === "lists" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("lists")}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                viewMode === "lists"
                  ? "bg-[var(--vistral-blue-500)] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              <span>Listas</span>
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                viewMode === "kanban"
                  ? "bg-[var(--vistral-blue-500)] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Kanban</span>
            </Button>
          </div>

          {/* Vista Listas */}
          {viewMode === "lists" && (
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
                <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#374151]">
                  {activeGroups.map(renderStatusRow)}
                </div>
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
                  <div className="rounded-lg border border-[#E5E7EB] dark:border-[#374151] overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#374151]">
                    {inactiveGroups.map(renderStatusRow)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vista Kanban */}
          {viewMode === "kanban" && (
            <PublishedTasksKanban
              interested={interested}
              onNavigateToLead={handleNavigateToLead}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
