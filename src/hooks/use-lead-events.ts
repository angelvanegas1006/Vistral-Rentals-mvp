"use client";

import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/lib/supabase/types";

type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];

export function useLeadEvents(leadId: string | undefined) {
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!leadId) return;

    try {
      setError(null);
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/events`);
      if (!res.ok) throw new Error("Error al cargar eventos");
      const json = await res.json();
      setEvents(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar eventos"));
      console.error("[Fetch Lead Events Error]:", err);
    }
  }, [leadId]);

  useEffect(() => {
    async function fetchEvents() {
      if (!leadId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/events`);
        if (!res.ok) throw new Error("Error al cargar eventos");
        const json = await res.json();
        setEvents(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar eventos"));
        console.error("[Fetch Lead Events Error]:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [leadId]);

  return { events, loading, error, refetch };
}
