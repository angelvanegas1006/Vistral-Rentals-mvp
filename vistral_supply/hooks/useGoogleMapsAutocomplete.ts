"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { config } from "@/lib/config/environment";

export interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
}

interface UseGoogleMapsAutocompleteOptions {
  input: string;
  minLength?: number;
  debounceMs?: number;
  countryRestriction?: string; // e.g., "es" for Spain
}

interface UseGoogleMapsAutocompleteReturn {
  predictions: GooglePlacePrediction[];
  isLoading: boolean;
  error: string | null;
  getPlaceDetails: (placeId: string) => Promise<GooglePlaceDetails | null>;
}

/**
 * Hook para usar Google Maps Places Autocomplete API
 */
export function useGoogleMapsAutocomplete({
  input,
  minLength = 3,
  debounceMs = 300,
  countryRestriction = "es", // Por defecto España
}: UseGoogleMapsAutocompleteOptions): UseGoogleMapsAutocompleteReturn {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Función para obtener predicciones de autocomplete
  const fetchPredictions = useCallback(
    async (query: string) => {
      if (!config.googleMaps.apiKey) {
        console.warn("[Google Maps] API key no configurada. Verifica NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local");
        setError("Google Maps API key no configurada. Verifica tu configuración.");
        setPredictions([]);
        return;
      }

      if (query.length < minLength) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Debug: Verificar API key
      console.log("[Google Maps] API Key configurada:", config.googleMaps.apiKey ? "Sí" : "No");
      console.log("[Google Maps] Query:", query);

      try {
        // Usar endpoint proxy de Next.js para evitar problemas de CORS
        const proxyUrl = new URL("/api/google-maps/autocomplete", window.location.origin);
        proxyUrl.searchParams.append("input", query);
        proxyUrl.searchParams.append("country", countryRestriction);

        console.log("[Google Maps] Requesting via proxy:", proxyUrl.toString());

        const response = await fetch(proxyUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();

        console.log("[Google Maps] API Response:", { status: data.status, error_message: data.error_message });

        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          setPredictions(data.predictions || []);
          setError(null);
        } else if (data.status === "REQUEST_DENIED") {
          const errorMsg = data.error_message || "Acceso denegado a Google Maps API. Verifica tu API key y restricciones.";
          setError(errorMsg);
          setPredictions([]);
          console.error("[Google Maps] REQUEST_DENIED:", errorMsg);
        } else if (data.status === "INVALID_REQUEST") {
          const errorMsg = data.error_message || "Solicitud inválida a Google Maps API.";
          setError(errorMsg);
          setPredictions([]);
          console.error("[Google Maps] INVALID_REQUEST:", errorMsg);
        } else {
          const errorMsg = data.error_message || `Error de Google Maps: ${data.status}`;
          setError(errorMsg);
          setPredictions([]);
          console.error("[Google Maps] Error:", data.status, errorMsg);
        }
      } catch (err: any) {
        console.error("Error fetching Google Maps predictions:", err);
        setError(`Error al conectar con Google Maps: ${err.message || "Error de red"}`);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minLength, countryRestriction]
  );

  // Debounce del input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(input);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, fetchPredictions, debounceMs]);

  // Función para obtener detalles completos de un lugar
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<GooglePlaceDetails | null> => {
      if (!config.googleMaps.apiKey) {
        setError("Google Maps API key no configurada");
        return null;
      }

      try {
        // Usar endpoint proxy de Next.js para evitar problemas de CORS
        const proxyUrl = new URL("/api/google-maps/details", window.location.origin);
        proxyUrl.searchParams.append("place_id", placeId);

        console.log("[Google Maps] Requesting place details via proxy:", proxyUrl.toString());

        const response = await fetch(proxyUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.status === "OK" && data.result) {
          return data.result as GooglePlaceDetails;
        } else {
          setError(`Error obteniendo detalles: ${data.status}`);
          return null;
        }
      } catch (err) {
        console.error("Error fetching place details:", err);
        setError("Error al obtener detalles del lugar");
        return null;
      }
    },
    []
  );

  return {
    predictions,
    isLoading,
    error,
    getPlaceDetails,
  };
}
