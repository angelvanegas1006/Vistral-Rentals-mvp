"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";

type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export function useUpdateProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProperty = async (
    propertyId: string,
    updates: PropertyUpdate
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Filtrar campos undefined antes de enviar
      const filteredUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          // For JSONB fields, ensure they are properly formatted
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            filteredUpdates[key] = JSON.parse(JSON.stringify(value));
          } else if (Array.isArray(value)) {
            filteredUpdates[key] = JSON.parse(JSON.stringify(value));
          } else {
            filteredUpdates[key] = value;
          }
        }
      }

      // Si no hay campos para actualizar después del filtrado, retornar éxito
      if (Object.keys(filteredUpdates).length === 0) {
        console.log("⚠️ No hay campos válidos para actualizar después del filtrado");
        return true;
      }

      console.log("🔄 Actualizando propiedad via API:", { propertyId, fields: Object.keys(filteredUpdates) });

      // Usar la API route (service role key) para garantizar que la actualización persiste
      const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredUpdates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Error al actualizar propiedad:", {
          status: response.status,
          error: errorData.error,
          fields: Object.keys(filteredUpdates),
        });
        throw new Error(errorData.error || `Update failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Propiedad actualizada correctamente:", {
        fields: Object.keys(filteredUpdates),
        ...(filteredUpdates.tenant_supplies_toggles ? {
          togglesSaved: result.property?.tenant_supplies_toggles,
        } : {}),
      });

      // Disparar evento para actualizar componentes que escuchan cambios
      window.dispatchEvent(new CustomEvent('property-updated', {
        detail: { propertyId }
      }));

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
