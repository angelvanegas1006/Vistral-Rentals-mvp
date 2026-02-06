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

      // Filtrar campos undefined antes de enviar (PostgREST no maneja bien undefined)
      const filteredUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        // Include null values (they are valid for clearing fields)
        // Only exclude undefined values
        if (value !== undefined) {
          filteredUpdates[key] = value;
        }
      }

      // Si no hay campos para actualizar después del filtrado, retornar éxito
      if (Object.keys(filteredUpdates).length === 0) {
        console.log("⚠️ No hay campos válidos para actualizar después del filtrado");
        return true;
      }

      // Intentar actualizar por property_unique_id primero
      console.log("🔄 Intentando actualizar propiedad:", { propertyId, updates: filteredUpdates });
      const { data: updatedData, error: updateError } = await supabase
        .from("properties")
        .update(filteredUpdates)
        .eq("property_unique_id", propertyId)
        .select();
      
      if (updateError) {
        console.error("❌ Error al actualizar por property_unique_id:", updateError);
        console.error("   - Campos que se intentaron actualizar:", Object.keys(filteredUpdates));
        console.error("   - Valores:", filteredUpdates);
        console.error("   - Código de error:", updateError.code);
        console.error("   - Mensaje:", updateError.message);
        console.error("   - Detalles:", updateError.details);
        console.error("   - Hint:", updateError.hint);
        
        // Si el error es sobre schema cache, proporcionar información útil
        if (updateError.code === 'PGRST204') {
          console.error("⚠️ Error de schema cache de PostgREST:");
          console.error("   - El schema cache de Supabase puede estar desactualizado");
          console.error("   - Solución: Verificar que las columnas existen en la base de datos");
          console.error("   - O refrescar el schema cache de Supabase");
        }
        
        // Si falla, intentar por id directamente
        const { error: idError } = await supabase
          .from("properties")
          .update(filteredUpdates)
          .eq("id", propertyId);
        
        if (idError) {
          console.error("❌ Error al actualizar por id:", idError);
          throw idError;
        } else {
          console.log("✅ Actualización exitosa por id");
          // Disparar evento para actualizar componentes que escuchan cambios
          window.dispatchEvent(new CustomEvent('property-updated', {
            detail: { propertyId }
          }));
        }
      } else {
        console.log("✅ Actualización exitosa por property_unique_id:", updatedData);
      }

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
