"use client";

import { useEffect, type MutableRefObject } from "react";
import { Plus, RefreshCw, ArrowRight, ArrowLeft, Archive, Loader2 } from "lucide-react";
import { useLeadEvents } from "@/hooks/use-lead-events";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];

interface LeadRightSidebarProps {
  leadId?: string;
  refetchRef?: MutableRefObject<(() => Promise<void> | void) | null>;
}

const EVENT_CONFIG: Record<
  LeadEvent["event_type"],
  { icon: typeof Plus; dotClass: string; iconClass: string }
> = {
  PROPERTY_ADDED: {
    icon: Plus,
    dotClass: "bg-blue-100 dark:bg-blue-900",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  MTP_UPDATE: {
    icon: RefreshCw,
    dotClass: "bg-blue-100 dark:bg-blue-900",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  PHASE_CHANGE: {
    icon: ArrowRight,
    dotClass: "bg-green-100 dark:bg-green-900",
    iconClass: "text-green-600 dark:text-green-400",
  },
  PHASE_CHANGE_BACKWARD: {
    icon: ArrowLeft,
    dotClass: "bg-red-100 dark:bg-red-900",
    iconClass: "text-red-600 dark:text-red-400",
  },
  MTP_ARCHIVED: {
    icon: Archive,
    dotClass: "bg-gray-100 dark:bg-gray-800",
    iconClass: "text-gray-500 dark:text-gray-400",
  },
};

function formatEventTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffMinutes < 1) return "Ahora mismo";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (isToday) return `Hoy, ${time}`;
  if (diffDays === 1) return `Ayer, ${time}`;
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function EventItem({ event, isLast }: { event: LeadEvent; isLast: boolean }) {
  const config = EVENT_CONFIG[event.event_type];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--vistral-gray-200)] dark:bg-[var(--vistral-gray-700)]" />
      )}

      {/* Icon dot */}
      <div
        className={cn(
          "relative z-10 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full",
          config.dotClass
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", config.iconClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5">
        <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] leading-tight">
          {event.title}
        </p>
        <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] mt-0.5">
          {formatEventTimestamp(event.created_at)}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 leading-relaxed">
          {event.description}
        </p>
      </div>
    </div>
  );
}

export function LeadRightSidebar({ leadId, refetchRef }: LeadRightSidebarProps) {
  const { events, loading, error, refetch } = useLeadEvents(leadId);

  useEffect(() => {
    if (refetchRef) refetchRef.current = refetch;
  }, [refetchRef, refetch]);

  return (
    <div className="w-full lg:w-80 border-l-0 lg:border-l bg-white dark:bg-[var(--vistral-gray-900)] rounded-lg border border-[var(--vistral-gray-200)] dark:border-[var(--vistral-gray-800)] shadow-sm">
      <div className="p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Registro de Actividad
        </h3>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#9CA3AF]" />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 py-4">
            Error al cargar el registro de actividad.
          </p>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] py-4">
            No hay actividad registrada aún.
          </p>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="max-h-[calc(100vh-34rem)] overflow-y-auto pr-1 scrollbar-thin">
            <div className="space-y-0">
              {events.map((event, index) => (
                <EventItem
                  key={event.id}
                  event={event}
                  isLast={index === events.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
