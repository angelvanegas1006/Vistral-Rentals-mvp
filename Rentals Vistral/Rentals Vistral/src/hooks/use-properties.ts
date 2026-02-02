"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface UsePropertiesOptions {
  kanbanType?: "captacion" | "portfolio";
  searchQuery?: string;
  filters?: Record<string, any>;
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      // Verificar que las variables de entorno estén configuradas
      const hasConfig = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      setIsSupabaseConfigured(hasConfig);

      if (!hasConfig) {
        console.warn("⚠️ Supabase no está configurado. Variables de entorno:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Existe" : "❌ No existe",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Existe" : "❌ No existe",
        });
        setLoading(false);
        setProperties([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🔌 Intentando conectar a Supabase...", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          kanbanType: options.kanbanType,
        });

        const supabase = createClient();
        let query = supabase.from("properties").select("*");

        // Aplicar filtros según kanbanType (solo si se especifica)
        // NOTA: La columna en Supabase puede ser "current_stage" en lugar de "current_phase"
        const phaseColumn = "current_stage"; // Cambiar a "current_phase" si es necesario
        
        if (options.kanbanType === "captacion") {
          // Filtrar por fases de Captación y Cierre
          query = query.in(phaseColumn, [
            "Viviendas Prophero",
            "Listo para Alquilar",
            "Publicado",
            "Inquilino aceptado",
            "Pendiente de trámites",
          ]);
        } else if (options.kanbanType === "portfolio") {
          // Filtrar por fases de Gestión De Cartera
          query = query.in(phaseColumn, [
            "Alquilado",
            "Actualización de Renta (IPC)",
            "Gestión de Renovación",
            "Finalización y Salida",
          ]);
        }
        // Si no se especifica kanbanType, se obtienen todas las propiedades

        // Aplicar búsqueda si existe
        if (options.searchQuery?.trim()) {
          const search = `%${options.searchQuery.toLowerCase()}%`;
          // Intentar buscar en diferentes columnas posibles (id, property_unique_id, address, city)
          query = query.or(
            `id.ilike.${search},property_unique_id.ilike.${search},address.ilike.${search},city.ilike.${search}`
          );
        }

        // Aplicar filtros (soporta arrays para múltiple selección)
        if (options.filters) {
          if (options.filters.property_type) {
            const propertyTypes = Array.isArray(options.filters.property_type)
              ? options.filters.property_type
              : [options.filters.property_type];
            if (propertyTypes.length > 0) {
              query = query.in("property_asset_type", propertyTypes);
            }
          }
          if (options.filters.area_cluster) {
            const areaClusters = Array.isArray(options.filters.area_cluster)
              ? options.filters.area_cluster
              : [options.filters.area_cluster];
            if (areaClusters.length > 0) {
              query = query.in("area_cluster", areaClusters);
            }
          }
          if (options.filters.admin_name) {
            const managers = Array.isArray(options.filters.admin_name)
              ? options.filters.admin_name
              : [options.filters.admin_name];
            if (managers.length > 0) {
              query = query.in("admin_name", managers);
            }
          }
        }

        // Ordenar por días en fase (puede ser "days_in_stage" o "days_in_phase")
        const daysColumn = "days_in_stage"; // Cambiar a "days_in_phase" si es necesario
        const { data, error: fetchError } = await query.order(daysColumn, {
          ascending: true,
        });

        if (fetchError) {
          console.error("❌ Error de Supabase:", fetchError);
          throw fetchError;
        }

        console.log("✅ Propiedades obtenidas de Supabase:", data?.length || 0, "propiedades");
        setProperties(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar propiedades"));
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [options.kanbanType, options.searchQuery, options.filters]);

  return { properties, loading, error, isSupabaseConfigured };
}
