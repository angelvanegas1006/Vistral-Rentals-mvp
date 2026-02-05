import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "./utils";
import type { GooglePlaceDetails } from "@/hooks/useGoogleMapsAutocomplete";

export interface AddressData {
  property_id: string;
  geography_id?: string | null;
  address_line: string;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  planta?: string | null;
  puerta?: string | null;
  bloque?: string | null;
  escalera?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Extrae componentes de dirección de Google Place Details
 */
export function extractAddressComponents(
  placeDetails: GooglePlaceDetails,
  streetNumber?: string
): {
  address_line: string;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
} {
  const components = placeDetails.address_components || [];
  
  // Extraer componentes
  let streetName = "";
  let streetNumberFromGoogle = "";
  let postalCode: string | null = null;
  let city: string | null = null;
  let country: string | null = null;

  components.forEach((component) => {
    const types = component.types || [];
    
    if (types.includes("street_number")) {
      streetNumberFromGoogle = component.long_name;
    } else if (types.includes("route")) {
      streetName = component.long_name;
    } else if (types.includes("postal_code")) {
      postalCode = component.long_name;
    } else if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      // Si no hay city, usar provincia
      if (!city) {
        city = component.long_name;
      }
    } else if (types.includes("country")) {
      country = component.short_name; // Código de país (ej: "ES")
    }
  });

  // Construir dirección completa
  // Si tenemos número de calle (de Google o manual), incluirlo
  const finalStreetNumber = streetNumber || streetNumberFromGoogle;
  let addressLine = "";
  
  if (finalStreetNumber && streetName) {
    addressLine = `${streetName} ${finalStreetNumber}`;
  } else if (streetName) {
    addressLine = streetName;
  } else {
    // Si no hay calle, usar la dirección formateada completa
    addressLine = placeDetails.formatted_address;
  }

  // Agregar ciudad y código postal si existen
  if (city && postalCode) {
    addressLine += `, ${postalCode} ${city}`;
  } else if (city) {
    addressLine += `, ${city}`;
  } else if (postalCode) {
    addressLine += `, ${postalCode}`;
  }

  // Si no hay dirección construida, usar la formateada de Google
  if (!addressLine || addressLine.trim() === "") {
    addressLine = placeDetails.formatted_address;
  }

  return {
    address_line: addressLine,
    postal_code: postalCode,
    city: city,
    country: country,
    latitude: placeDetails.geometry?.location?.lat || null,
    longitude: placeDetails.geometry?.location?.lng || null,
  };
}

/**
 * Guarda o actualiza una dirección en Supabase
 */
export async function savePropertyAddress(
  propertyId: string,
  addressData: AddressData
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[savePropertyAddress] Demo mode: Skipping Supabase save");
    return "demo-address-id";
  }

  const supabase = createClient();

  try {
    // Verificar si ya existe una dirección para esta propiedad
    const { data: existingAddress, error: checkError } = await supabase
      .from("address")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe

    let addressId: string;

    if (existingAddress) {
      // Actualizar dirección existente
      const { data, error } = await supabase
        .from("address")
        .update({
          address_line: addressData.address_line,
          postal_code: addressData.postal_code,
          city: addressData.city,
          country: addressData.country,
          planta: addressData.planta,
          puerta: addressData.puerta,
          bloque: addressData.bloque,
          escalera: addressData.escalera,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          geography_id: addressData.geography_id,
          updated_at: new Date().toISOString(),
        })
        .eq("property_id", propertyId)
        .select()
        .single();

      if (error) {
        console.error("[savePropertyAddress] Error updating address:", error);
        throw new Error(`Error al actualizar la dirección: ${error.message}`);
      }

      addressId = data.id;
    } else {
      // Crear nueva dirección
      const { data, error } = await supabase
        .from("address")
        .insert({
          property_id: propertyId,
          address_line: addressData.address_line,
          postal_code: addressData.postal_code,
          city: addressData.city,
          country: addressData.country,
          planta: addressData.planta,
          puerta: addressData.puerta,
          bloque: addressData.bloque,
          escalera: addressData.escalera,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          geography_id: addressData.geography_id,
        })
        .select()
        .single();

      if (error) {
        console.error("[savePropertyAddress] Error creating address:", error);
        throw new Error(`Error al crear la dirección: ${error.message}`);
      }

      addressId = data.id;
    }

    console.log("[savePropertyAddress] Address saved successfully:", addressId);
    return addressId;
  } catch (error: any) {
    console.error("[savePropertyAddress] Unexpected error:", error);
    throw error;
  }
}

/**
 * Obtiene la dirección de una propiedad
 */
export async function getPropertyAddress(propertyId: string): Promise<AddressData | null> {
  if (isDemoMode()) {
    console.warn("[getPropertyAddress] Demo mode: Returning null");
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("address")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error 406 cuando no hay resultados

    if (error) {
      // Si la tabla no existe, retornar null silenciosamente
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn("[getPropertyAddress] Table address does not exist. Please run migration 010_address.sql");
        return null;
      }
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("[getPropertyAddress] Error fetching address:", error);
      // No lanzar error, solo retornar null para que la app continúe funcionando
      return null;
    }

    if (!data) return null;

    return data as AddressData;
  } catch (error: any) {
    // Manejar errores de tabla no encontrada
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      console.warn("[getPropertyAddress] Table address does not exist. Please run migration 010_address.sql");
      return null;
    }
    console.error("[getPropertyAddress] Unexpected error:", error);
    return null;
  }
}
