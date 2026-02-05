"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export function useUpdateProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const updateProperty = async (
    propertyId: string,
    updates: PropertyUpdate
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Intentar actualizar por property_unique_id primero, luego por id
      let updateError;
      const { error: uniqueIdError } = await supabase
        .from("properties")
        .update(updates)
        .eq("property_unique_id", propertyId);
      
      if (uniqueIdError) {
        // Si falla, intentar por property_unique_id
        const { error: refIdError } = await supabase
          .from("properties")
          .update(updates)
          .eq("property_unique_id", propertyId);
        
        if (refIdError) {
          // Si falla, intentar por id directamente
          const { error: idError } = await supabase
            .from("properties")
            .update(updates)
            .eq("id", propertyId);
          updateError = idError;
        } else {
          updateError = null;
        }
      } else {
        updateError = null;
      }

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al actualizar propiedad"));
      console.error("Error updating property:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateProperty, loading, error };
}
