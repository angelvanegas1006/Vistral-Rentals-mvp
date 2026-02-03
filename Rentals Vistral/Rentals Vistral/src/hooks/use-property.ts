"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export function useProperty(propertyId: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let isInitialLoad = true;
    
    async function fetchProperty(skipLoading = false) {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        // Solo mostrar loading en la carga inicial, no en actualizaciones
        if (!skipLoading) {
          setLoading(true);
        }
        setError(null);

        // Buscar por property_unique_id (primary identifier for routing)
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("property_unique_id", propertyId)
          .single();

        if (fetchError) throw fetchError;

        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar propiedad"));
        console.error("Error fetching property:", err);
      } finally {
        if (!skipLoading) {
          setLoading(false);
        }
      }
    }

    fetchProperty();
    isInitialLoad = false;
    
    // Escuchar eventos de actualización de propiedad
    // NO mostrar loading state cuando se actualiza desde un evento (evita recargas)
    const handlePropertyUpdate = (event: CustomEvent) => {
      if (event.detail?.propertyId === propertyId) {
        fetchProperty(true); // skipLoading = true para evitar mostrar loading state
      }
    };
    
    window.addEventListener('property-updated', handlePropertyUpdate as EventListener);
    return () => {
      window.removeEventListener('property-updated', handlePropertyUpdate as EventListener);
    };
  }, [propertyId]);

  return { property, loading, error };
}
