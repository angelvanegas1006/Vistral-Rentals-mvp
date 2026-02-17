"use client";

import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/lib/supabase/types";

type LeadsPropertyRow = Database["public"]["Tables"]["leads_properties"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export interface LeadPropertyItem {
  leadsProperty: LeadsPropertyRow;
  property: PropertyRow;
}

/**
 * Obtiene los registros de leads_properties para un lead con los datos de properties unidos.
 * Usa API route para evitar bundling de Supabase en el cliente.
 * @param leadsUniqueId - leads_unique_id del lead (ej: LEAD-001)
 */
export function useLeadProperties(leadsUniqueId: string | undefined) {
  const [items, setItems] = useState<LeadPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!leadsUniqueId?.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/leads/${encodeURIComponent(leadsUniqueId)}/properties`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const { items: data } = await res.json();
      setItems(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar"));
      console.error("Error fetching lead properties:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [leadsUniqueId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
}
