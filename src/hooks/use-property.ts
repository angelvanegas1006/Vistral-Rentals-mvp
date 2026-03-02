"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export function useProperty(propertyId: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isInitialLoad = true;
    
    async function fetchProperty(skipLoading = false) {
      if (!propertyId || propertyId.trim() === "") {
        setLoading(false);
        setProperty(null);
        setError(new Error("Property ID is required"));
        return;
      }

      try {
        // Solo mostrar loading en la carga inicial, no en actualizaciones
        if (!skipLoading) {
          setLoading(true);
        }
        setError(null);

        // Usar API route con service role key para evitar problemas de RLS
        const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
          console.error(`Error fetching property ${propertyId}:`, errorMessage);
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const data = result.property;

        if (!data) {
          console.error(`Property ${propertyId} not found in response`);
          throw new Error("Propiedad no encontrada");
        }

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
