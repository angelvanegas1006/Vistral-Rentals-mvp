"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export function useUpdateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const updateLead = async (leadId: string, updates: LeadUpdate): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log("Actualizando lead:", { leadId, updates });

      // Limpiar updates: remover campos undefined y null innecesarios
      const cleanUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });

      console.log("Updates limpios:", cleanUpdates);

      const { data, error: updateError } = await supabase
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
  };

  return { updateLead, loading, error };
}
