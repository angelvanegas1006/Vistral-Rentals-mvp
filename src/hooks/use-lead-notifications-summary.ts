"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationColor = "red" | "yellow" | "blue" | null;

const TYPE_TO_COLOR: Record<string, NotificationColor> = {
  urgent_visit_cancel: "red",
  auto_recovery: "yellow",
  phase_auto_move: "yellow",
  info_property_unavailable: "yellow",
  recovery: "blue",
};

export const LEAD_NOTIFICATIONS_CHANGED = "lead-notifications-changed";

/**
 * Summary: leads_unique_id -> color (red > yellow > blue).
 * Only notifications with is_read=false count.
 */
export function useLeadNotificationsSummary() {
  const [colorMap, setColorMap] = useState<Record<string, NotificationColor>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/notifications-summary?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        const summary = data.summary ?? {};
        const mapped: Record<string, NotificationColor> = {};
        for (const [leadId, notifType] of Object.entries(summary)) {
          mapped[leadId] = TYPE_TO_COLOR[notifType as string] ?? null;
        }
        setColorMap(mapped);
        setTotalCount(data.totalCount ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const iv = setInterval(fetchSummary, 2000);
    return () => clearInterval(iv);
  }, [fetchSummary]);

  useEffect(() => {
    const h = () => fetchSummary();
    window.addEventListener(LEAD_NOTIFICATIONS_CHANGED, h);
    return () => window.removeEventListener(LEAD_NOTIFICATIONS_CHANGED, h);
  }, [fetchSummary]);

  const supabaseRef = useRef(createClient());
  useEffect(() => {
    const ch = supabaseRef.current
      .channel("ln")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_notifications" }, () =>
        fetchSummary()
      )
      .subscribe();
    return () => {
      supabaseRef.current.removeChannel(ch);
    };
  }, [fetchSummary]);

  return { colorMap, totalCount, loading, refetch: fetchSummary };
}
