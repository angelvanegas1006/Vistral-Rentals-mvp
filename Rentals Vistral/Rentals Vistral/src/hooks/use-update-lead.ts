"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export function useUpdateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabaseRef = useRef(createClient());

  const updateLead = useCallback(async (leadId: string, updates: LeadUpdate): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Limpiar updates: remover campos undefined y null innecesarios
      const cleanUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });

      console.log("Actualizando lead:", { leadId, updates: cleanUpdates });

      const { data, error: updateError } = await supabaseRef.current
        .from("leads")
        .update(cleanUpdates)
        .eq("id", leadId)
        .select();

      if (updateError) {
        console.error("Error de Supabase al actualizar lead:", updateError);
        throw updateError;
      }

      console.log("Lead actualizado exitosamente:", data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al actualizar lead"));
      console.error("Error updating lead:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateLead, loading, error };
}
