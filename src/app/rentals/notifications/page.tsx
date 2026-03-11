"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RentalsSidebar } from "@/components/rentals/rentals-sidebar";
import { LEAD_NOTIFICATIONS_CHANGED } from "@/hooks/use-lead-notifications-summary";
import { AlertWithIcon } from "@/components/ui/alert";
import { Bell, Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { renderNotificationMessage, getNotificationCardClassName } from "@/lib/notifications/render-message";

interface NotificationWithLead {
  id: string;
  leads_unique_id: string;
  properties_unique_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  lead_name: string;
}

const NOTIFICATION_VARIANT_MAP: Record<string, "danger" | "warning" | "info"> = {
  urgent_visit_cancel: "danger",
  auto_recovery: "warning",
  phase_auto_move: "warning",
  info_property_unavailable: "warning",
  recovery: "info",
};

function groupByLead(notifications: NotificationWithLead[]) {
  const groups: Record<string, { leadName: string; leadsUniqueId: string; items: NotificationWithLead[] }> = {};
  for (const n of notifications) {
    if (!groups[n.leads_unique_id]) {
      groups[n.leads_unique_id] = {
        leadName: n.lead_name,
        leadsUniqueId: n.leads_unique_id,
        items: [],
      };
    }
    groups[n.leads_unique_id].items.push(n);
  }
  return Object.values(groups);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useI18n();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/notifications-all");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDismiss = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      try {
        const res = await fetch("/api/leads/notifications-all", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId }),
        });
        if (res.ok) {
          window.dispatchEvent(new CustomEvent(LEAD_NOTIFICATIONS_CHANGED));
        }
      } catch {
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const handleLeadClick = (leadsUniqueId: string) => {
    router.push(`/rentals/leads/${leadsUniqueId}`);
  };

  const groups = groupByLead(notifications);

  return (
    <div className="flex h-screen overflow-hidden">
      <RentalsSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
          <Bell className="h-5 w-5 text-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
            {t("sidebar.notifications")}
          </h1>
          {notifications.length > 0 && (
            <span className="ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--vistral-blue-600)] px-2 text-xs font-semibold text-white">
              {notifications.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--vistral-gray-50)] dark:bg-[#000000] px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Cargando notificaciones...
              </span>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-medium text-muted-foreground">
                No hay notificaciones pendientes
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Cuando haya alertas sobre tus interesados, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {groups.map((group) => (
                <div
                  key={group.leadsUniqueId}
                  className="rounded-lg border border-border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleLeadClick(group.leadsUniqueId)}
                    className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-accent/50 rounded-t-lg transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <span className="text-xs font-semibold">
                        {group.leadName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {group.leadName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length}{" "}
                        {group.items.length === 1
                          ? "notificación"
                          : "notificaciones"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ver tarjeta →
                    </span>
                  </button>

                  <div className="border-t border-border" />

                  <div className="px-4 py-3 space-y-3">
                    {group.items.map((n) => (
                      <div key={n.id} className="relative">
                        <AlertWithIcon
                          variant={
                            NOTIFICATION_VARIANT_MAP[n.notification_type] ??
                            "info"
                          }
                          className={getNotificationCardClassName(n.notification_type)}
                          title={n.title}
                          description={renderNotificationMessage(n.message)}
                          onClose={() => handleDismiss(n.id)}
                        />
                        <span className="absolute bottom-2 right-10 text-[10px] text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
