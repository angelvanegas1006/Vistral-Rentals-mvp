"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface UseLeadsOptions {
  phase?: string;
  searchQuery?: string;
  filters?: Record<string, any>;
  showDevCards?: boolean;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase no está configurado. Usando datos mock.");
      setIsConnected(false);
      setLoading(false);
      setLeads([]);
      return;
    }

    setIsConnected(true);

    try {
      setLoading(true);
      setError(null);

      let mtpLeadIds: string[] | null = null;
      if (options.filters?.mtp_property_query) {
        const params = new URLSearchParams({
          property_query: options.filters.mtp_property_query,
          mtp_status_type: options.filters.mtp_status_type || "all",
        });
        const res = await fetch(`/api/leads/filter-by-mtp?${params}`);
        if (!res.ok) {
          console.error("MTP filter API error:", res.status);
          setLeads([]);
          return;
        }
        const json = await res.json();
        mtpLeadIds = json.leads_unique_ids ?? [];

        if (mtpLeadIds.length === 0) {
          setLeads([]);
          return;
        }
      }

      const supabase = createClient();
      let query = supabase.from("leads").select("*");

      if (options.showDevCards) {
        query = query.eq("is_dev", true);
      } else {
        query = query.or("is_dev.is.null,is_dev.eq.false");
      }

      if (options.phase) {
        query = query.eq("current_phase", options.phase);
      }

      if (options.searchQuery?.trim()) {
        const search = `%${options.searchQuery.toLowerCase()}%`;
        query = query.or(
          `name.ilike.${search},phone.ilike.${search},email.ilike.${search},leads_unique_id.ilike.${search}`
        );
      }

      if (mtpLeadIds && mtpLeadIds.length > 0) {
        query = query.in("leads_unique_id", mtpLeadIds);
      }

      const { data, error: fetchError } = await query.order("phase_entered_at", {
        ascending: false,
      });

      if (fetchError) throw fetchError;

      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar leads"));
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [options.phase, options.searchQuery, options.filters, options.showDevCards]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads, isConnected };
}
