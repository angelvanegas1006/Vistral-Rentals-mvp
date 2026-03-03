"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationColor = "red" | "yellow" | "blue" | null;

const TYPE_TO_COLOR: Record<string, NotificationColor> = {
  urgent_visit_cancel: "red",
  info_property_unavailable: "yellow",
  recovery: "blue",
};

/**
 * Fetches a summary map of leads_unique_id -> highest priority notification color.
 * Used by the Kanban board to color-code lead cards.
 */
export function useLeadNotificationsSummary() {
  const [colorMap, setColorMap] = useState<Record<string, NotificationColor>>({});
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/notifications-summary");
      const data = await res.json();
      if (res.ok && data.summary) {
        const mapped: Record<string, NotificationColor> = {};
        for (const [leadId, notifType] of Object.entries(data.summary)) {
          mapped[leadId] = TYPE_TO_COLOR[notifType as string] ?? null;
        }
        setColorMap(mapped);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { colorMap, loading, refetch: fetchSummary };
}
