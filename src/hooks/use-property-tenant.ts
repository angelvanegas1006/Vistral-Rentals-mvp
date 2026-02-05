"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PropertyTenant = Database["public"]["Tables"]["property_tenants"]["Row"];

interface UsePropertyTenantOptions {
  propertyId: string;
}

export function usePropertyTenant({ propertyId }: UsePropertyTenantOptions) {
  const [tenant, setTenant] = useState<PropertyTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  // Fetch tenant data
  const fetchTenant = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("property_tenants")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setTenant(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar datos del inquilino"));
      console.error("Error fetching tenant:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Update tenant data
  const updateTenant = useCallback(async (updates: Partial<PropertyTenant>) => {
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    try {
      setUpdating(true);
      setError(null);

      // Check if tenant exists
      const { data: existing } = await supabase
        .from("property_tenants")
        .select("id")
        .eq("property_id", propertyId)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing tenant
        const { data, error: updateError } = await supabase
          .from("property_tenants")
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
        // Create new tenant
        const { data, error: insertError } = await supabase
          .from("property_tenants")
          .insert({
            property_id: propertyId,
            ...updates,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      setTenant(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al actualizar datos del inquilino");
      setError(error);
      console.error("Error updating tenant:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [propertyId, supabase]);

  return {
    tenant,
    loading,
    error,
    updating,
    updateTenant,
    refetch: fetchTenant,
  };
}
