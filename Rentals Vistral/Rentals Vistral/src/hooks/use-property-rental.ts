"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PropertyRental = Database["public"]["Tables"]["property_rentals"]["Row"];

interface UsePropertyRentalOptions {
  propertyId: string;
}

export function usePropertyRental({ propertyId }: UsePropertyRentalOptions) {
  const [rental, setRental] = useState<PropertyRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  // Fetch rental data
  const fetchRental = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("property_rentals")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setRental(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar datos del alquiler"));
      console.error("Error fetching rental:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase]);

  useEffect(() => {
    fetchRental();
  }, [fetchRental]);

  // Update rental data
  const updateRental = useCallback(async (updates: Partial<PropertyRental>) => {
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    try {
      setUpdating(true);
      setError(null);

      // Check if rental exists
      const { data: existing } = await supabase
        .from("property_rentals")
        .select("id")
        .eq("property_id", propertyId)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing rental
        const { data, error: updateError } = await supabase
          .from("property_rentals")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("property_id", propertyId)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new rental
        const { data, error: insertError } = await supabase
          .from("property_rentals")
          .insert({
            property_id: propertyId,
            ...updates,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      setRental(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al actualizar datos del alquiler");
      setError(error);
      console.error("Error updating rental:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [propertyId, supabase]);

  return {
    rental,
    loading,
    error,
    updating,
    updateRental,
    refetch: fetchRental,
  };
}
