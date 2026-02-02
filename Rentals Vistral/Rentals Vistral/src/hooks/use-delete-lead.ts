"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useDeleteLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al eliminar lead"));
      console.error("Error deleting lead:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteLead, loading, error };
}
