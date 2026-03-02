"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface UseLeadsOptions {
  phase?: string;
  searchQuery?: string;
  filters?: Record<string, any>;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase no está configurado. Usando datos mock.");
      setLoading(false);
      setLeads([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase.from("leads").select("*");

      if (options.phase) {
        query = query.eq("current_phase", options.phase);
      }

      if (options.searchQuery?.trim()) {
        const search = `%${options.searchQuery.toLowerCase()}%`;
        query = query.or(
          `name.ilike.${search},phone.ilike.${search},email.ilike.${search}`
        );
      }

      const { data, error: fetchError } = await query.order("days_in_phase", {
        ascending: true,
      });

      if (fetchError) throw fetchError;

      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar leads"));
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [options.phase, options.searchQuery, options.filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}
