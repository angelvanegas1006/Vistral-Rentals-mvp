"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PropertyVisit = Database["public"]["Tables"]["property_visits"]["Row"];

interface UsePropertyVisitsOptions {
  propertyId?: string; // Optional: if not provided, fetch all visits
  startDate?: Date;
  endDate?: Date;
  visitType?: PropertyVisit["visit_type"];
}

export function usePropertyVisits({
  propertyId,
  startDate,
  endDate,
  visitType,
}: UsePropertyVisitsOptions = {}) {
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  // Fetch visits
  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("property_visits")
        .select("*");

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      if (visitType) {
        query = query.eq("visit_type", visitType);
      }

      if (startDate) {
        query = query.gte("visit_date", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("visit_date", endDate.toISOString());
      }

      const { data, error: fetchError } = await query
        .order("visit_date", { ascending: true });

      if (fetchError) throw fetchError;

      setVisits(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar visitas"));
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, startDate, endDate, visitType, supabase]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Create visit
  const createVisit = useCallback(async (visit: {
    property_id: string;
    visit_date: string;
    visit_type: PropertyVisit["visit_type"];
    notes?: string | null;
    created_by?: string | null;
  }) => {
    try {
      setUpdating(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("property_visits")
        .insert({
          ...visit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setVisits((prev) => [...prev, data]);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al crear visita");
      setError(error);
      console.error("Error creating visit:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [supabase]);

  // Update visit
  const updateVisit = useCallback(async (visitId: string, updates: Partial<PropertyVisit>) => {
    try {
      setUpdating(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from("property_visits")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitId)
        .select()
        .single();

      if (updateError) throw updateError;

      setVisits((prev) => prev.map((v) => (v.id === visitId ? data : v)));
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al actualizar visita");
      setError(error);
      console.error("Error updating visit:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [supabase]);

  // Delete visit
  const deleteVisit = useCallback(async (visitId: string) => {
    try {
      setUpdating(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("property_visits")
        .delete()
        .eq("id", visitId);

      if (deleteError) throw deleteError;

      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al eliminar visita");
      setError(error);
      console.error("Error deleting visit:", err);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [supabase]);

  return {
    visits,
    loading,
    error,
    updating,
    createVisit,
    updateVisit,
    deleteVisit,
    refetch: fetchVisits,
  };
}
