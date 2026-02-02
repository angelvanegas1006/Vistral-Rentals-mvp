"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const createLead = async (leadData: LeadInsert): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();

      if (insertError) throw insertError;

      return data.id;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al crear lead"));
      console.error("Error creating lead:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createLead, loading, error };
}
