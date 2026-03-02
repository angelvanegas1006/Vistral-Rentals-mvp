"use client";

import { useState, useEffect } from "react";
import type { Database, PropheroSectionReviews, PropheroSectionReview } from "@/lib/supabase/types";

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

        // Construir query params para la API route
        const params = new URLSearchParams();
        if (options.kanbanType) {
          params.append("kanbanType", options.kanbanType);
        }
        if (options.searchQuery?.trim()) {
          params.append("searchQuery", options.searchQuery.trim());
        }
        if (options.filters?.property_type) {
          const propertyTypes = Array.isArray(options.filters.property_type)
            ? options.filters.property_type
            : [options.filters.property_type];
          params.append("property_type", propertyTypes.join(","));
        }
        if (options.filters?.area_cluster) {
          const areaClusters = Array.isArray(options.filters.area_cluster)
            ? options.filters.area_cluster
            : [options.filters.area_cluster];
          params.append("area_cluster", areaClusters.join(","));
        }
        if (options.filters?.admin_name) {
          const managers = Array.isArray(options.filters.admin_name)
            ? options.filters.admin_name
            : [options.filters.admin_name];
          params.append("admin_name", managers.join(","));
        }

        // Usar API route con service role key para evitar problemas de RLS
        const response = await fetch(`/api/properties?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const { properties: data } = await response.json();

        console.log("✅ Propiedades obtenidas de Supabase:", data?.length || 0, "propiedades");
        
        // Detectar cambios ANTES de establecer las propiedades para evitar doble renderizado
        if (data && data.length > 0) {
          const propheroProperties = data.filter((prop) => prop.current_stage === "Viviendas Prophero");
          
          if (propheroProperties.length > 0) {
            // Procesar todas las propiedades de forma síncrona antes de establecer el estado
            const updatedData = await Promise.all(
              propheroProperties.map(async (prop) => {
                if (!prop.prophero_section_reviews || !prop.property_unique_id) return prop;
                
                try {
                  // Parsear reviews
                  const reviews: PropheroSectionReviews = typeof prop.prophero_section_reviews === 'string'
                    ? JSON.parse(prop.prophero_section_reviews)
                    : prop.prophero_section_reviews;
                  
                  // Verificar si hay secciones con estado "No" y snapshot
                  const hasSectionsToCheck = Object.entries(reviews).some(([sectionId, review]) => {
                    if (sectionId === '_meta') return false;
                    const sectionReview = review as PropheroSectionReview;
                    return sectionReview.isCorrect === false && sectionReview.snapshot;
                  });
                  
                  if (!hasSectionsToCheck) return prop;
                  
                  // Usar los datos que ya tenemos
                  const currentValues: Record<string, any> = {};
                  Object.entries(prop).forEach(([key, value]) => {
                    if (key !== 'prophero_section_reviews' && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                      currentValues[key] = value;
                    }
                  });
                  
                  // Verificar cada sección con estado "No" y snapshot
                  const updatedReviews: PropheroSectionReviews = { ...reviews };
                  let hasChanges = false;
                  
                  Object.entries(reviews).forEach(([sectionId, review]) => {
                    if (sectionId === '_meta') return;
                    
                    const sectionReview = review as PropheroSectionReview;
                    if (sectionReview.isCorrect === false && sectionReview.snapshot) {
                      const sectionFields = getSectionFields(sectionId);
                      const hasFieldChanges = sectionFields.some((field) => {
                        const currentValue = currentValues[field];
                        const snapshotValue = sectionReview.snapshot?.[field];
                        return compareValues(currentValue, snapshotValue);
                      });
                      
                      if (hasFieldChanges) {
                        updatedReviews[sectionId] = {
                          ...sectionReview,
                          isCorrect: null,
                          reviewed: false,
                          comments: null,
                          snapshot: sectionReview.snapshot,
                        };
                        hasChanges = true;
                      }
                    }
                  });
                  
                  // Si hay cambios, actualizar en Supabase y devolver propiedad actualizada
                  if (hasChanges) {
                    // Usar API route para actualizar (bypass RLS)
                    await fetch(`/api/properties/${prop.property_unique_id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        prophero_section_reviews: updatedReviews,
                      }),
                    });
                    
                    return {
                      ...prop,
                      prophero_section_reviews: updatedReviews,
                    };
                  }
                } catch (error) {
                  console.error(`Error checking property ${prop.property_unique_id}:`, error);
                }
                
                return prop;
              })
            );
            
            // Reemplazar las propiedades procesadas en los datos
            const finalData = data.map((prop) => {
              const updated = updatedData.find((p) => p.property_unique_id === prop.property_unique_id);
              return updated || prop;
            });
            
            setProperties(finalData);
            return;
          }
        }
        
        setProperties(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar propiedades"));
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
    
    // Escuchar eventos de actualización de propiedad para refrescar datos
    const handlePropertyUpdate = () => {
      // Pequeño delay para asegurar que Supabase haya guardado los cambios
      setTimeout(() => {
        fetchProperties();
      }, 100);
    };
    
    // NO escuchar prophero-reviews-updated aquí porque causa actualizaciones duplicadas
    // El kanban maneja las actualizaciones optimistas directamente
    window.addEventListener('property-updated', handlePropertyUpdate);
    return () => {
      window.removeEventListener('property-updated', handlePropertyUpdate);
    };
  }, [options.kanbanType, options.searchQuery, options.filters]);

  return { properties, loading, error, isSupabaseConfigured };
}

// Helper function para obtener campos de una sección
function getSectionFields(sectionId: string): string[] {
  const SECTION_FIELDS_MAP: Record<string, string[]> = {
    "property-management-info": ["admin_name", "keys_location"],
    "technical-documents": ["doc_energy_cert", "doc_renovation_files"],
    "legal-documents": ["doc_purchase_contract", "doc_land_registry_note"],
    "client-financial-info": ["client_iban", "client_bank_certificate_url"],
    "supplies-contracts": ["doc_contract_electricity", "doc_contract_water", "doc_contract_gas"],
    "supplies-bills": ["doc_bill_electricity", "doc_bill_water", "doc_bill_gas"],
    "home-insurance": ["home_insurance_type", "home_insurance_policy_url"],
    "property-management": ["property_management_plan", "property_management_plan_contract_url", "property_manager"],
  };
  return SECTION_FIELDS_MAP[sectionId] || [];
}

// Helper function para comparar valores
function compareValues(newValue: any, snapshotValue: any): boolean {
  // Manejar arrays (como doc_renovation_files)
  if (Array.isArray(newValue) || Array.isArray(snapshotValue)) {
    const newArray = Array.isArray(newValue) ? newValue : [];
    const snapshotArray = Array.isArray(snapshotValue) ? snapshotValue : [];
    return JSON.stringify(newArray.sort()) !== JSON.stringify(snapshotArray.sort());
  }
  
  // Comparación normal
  const normalizedNew = newValue !== null && newValue !== undefined ? newValue : null;
  const normalizedSnapshot = snapshotValue !== null && snapshotValue !== undefined ? snapshotValue : null;
  
  return normalizedNew !== normalizedSnapshot;
}
