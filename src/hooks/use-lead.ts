"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export function useLead(leadId: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLead() {
      if (!leadId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single();

        if (fetchError) throw fetchError;

        setLead(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar lead"));
        console.error("Error fetching lead:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [leadId]);

  return { lead, loading, error };
}
