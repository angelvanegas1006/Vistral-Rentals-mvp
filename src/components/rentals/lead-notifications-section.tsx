"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertWithIcon } from "@/components/ui/alert";
import { LEAD_NOTIFICATIONS_CHANGED } from "@/hooks/use-lead-notifications-summary";
import { Card } from "@/components/ui/card";
import { Bell, Loader2 } from "lucide-react";
import { renderNotificationMessage, getNotificationCardClassName } from "@/lib/notifications/render-message";

interface LeadNotification {
  id: string;
  leads_unique_id: string;
  properties_unique_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_VARIANT_MAP: Record<string, "danger" | "warning" | "info"> = {
  urgent_visit_cancel: "danger",
  auto_recovery: "warning",
  phase_auto_move: "warning",
  info_property_unavailable: "warning",
  recovery: "info",
};

interface LeadNotificationsSectionProps {
  leadId: string;
  refreshKey?: number;
}

export function LeadNotificationsSection({ leadId, refreshKey }: LeadNotificationsSectionProps) {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/notifications`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshKey]);

  const handleDismiss = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/notifications`, {
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
    [leadId, fetchNotifications]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando notificaciones...
      </div>
    );
  }

  if (notifications.length === 0) return null;

  return (
    <Card className="border transition-all shadow-sm border-gray-200 bg-white dark:bg-gray-800">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Notificaciones
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Avisos importantes que requieren tu atención sobre este interesado.
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mx-4" />

      <div className="px-4 py-4 space-y-3">
        {notifications.map((n) => (
          <AlertWithIcon
            key={n.id}
            variant={NOTIFICATION_VARIANT_MAP[n.notification_type] ?? "info"}
            className={getNotificationCardClassName(n.notification_type)}
            title={n.title}
            description={renderNotificationMessage(n.message)}
            onClose={() => handleDismiss(n.id)}
          />
        ))}
      </div>
    </Card>
  );
}
