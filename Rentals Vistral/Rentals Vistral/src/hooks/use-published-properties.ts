"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Database } from "@/lib/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export interface PublishedPropertiesFilters {
  city?: string;
  maxPrice?: number;
  minBedrooms?: number;
  areaClusters?: string[];
  rentalType?: string;
  minSqm?: number;
  minBathrooms?: number;
  search?: string;
  excludeIds?: string[];
}

export interface PublishedPropertiesResult {
  properties: PropertyRow[];
  filterOptions: {
    cities: string[];
    areaClusters: string[];
    rentalTypes: string[];
  };
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch properties in "Publicado" phase with optional filters.
 * Debounces search input to avoid excessive API calls.
 */
export function usePublishedProperties(
  filters: PublishedPropertiesFilters,
  enabled = true
): PublishedPropertiesResult {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    cities: string[];
    areaClusters: string[];
    rentalTypes: string[];
  }>({ cities: [], areaClusters: [], rentalTypes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Serialize filters to a stable key for dependency tracking
  const filtersKey = JSON.stringify({
    city: filters.city,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    areaClusters: filters.areaClusters?.sort().join(",") ?? "",
    rentalType: filters.rentalType,
    minSqm: filters.minSqm,
    minBathrooms: filters.minBathrooms,
    search: filters.search,
    excludeIds: filters.excludeIds?.sort().join(",") ?? "",
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!enabled) {
      setProperties([]);
      setLoading(false);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const parsed = JSON.parse(filtersKey);

      if (parsed.city) {
        params.set("city", parsed.city);
      }
      if (parsed.maxPrice != null && parsed.maxPrice > 0) {
        params.set("max_price", String(parsed.maxPrice));
      }
      if (parsed.minBedrooms != null && parsed.minBedrooms > 0) {
        params.set("min_bedrooms", String(parsed.minBedrooms));
      }
      if (parsed.areaClusters) {
        params.set("area_clusters", parsed.areaClusters);
      }
      if (parsed.rentalType) {
        params.set("rental_type", parsed.rentalType);
      }
      if (parsed.minSqm != null && parsed.minSqm > 0) {
        params.set("min_sqm", String(parsed.minSqm));
      }
      if (parsed.minBathrooms != null && parsed.minBathrooms > 0) {
        params.set("min_bathrooms", String(parsed.minBathrooms));
      }
      if (parsed.excludeIds) {
        params.set("exclude_ids", parsed.excludeIds);
      }
      if (parsed.search?.trim()) {
        params.set("search", parsed.search.trim());
      }

      const res = await fetch(
        `/api/properties/published?${params.toString()}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setProperties(json.properties ?? []);
      if (json.filterOptions) {
        setFilterOptions(json.filterOptions);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err : new Error("Error al cargar"));
      setProperties([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, enabled]);

  useEffect(() => {
    fetchProperties();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchProperties]);

  return { properties, filterOptions, loading, error, refetch: fetchProperties };
}
