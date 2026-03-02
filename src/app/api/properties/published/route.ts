import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/properties/published
 * Returns properties in "Publicado" phase with optional filters.
 *
 * Query params:
 *   - city: string (exact match on city)
 *   - min_price: number (announcement_price >= value)
 *   - max_price: number (announcement_price <= value)
 *   - min_bedrooms: number (bedrooms >= value)
 *   - max_bedrooms: number (bedrooms <= value)
 *   - area_clusters: comma-separated area_cluster values (IN filter)
 *   - rental_type: string (exact match on rental_type)
 *   - min_sqm: number (square_meters >= value)
 *   - max_sqm: number (square_meters <= value)
 *   - min_bathrooms: number (bathrooms >= value)
 *   - max_bathrooms: number (bathrooms <= value)
 *   - has_elevator: "true" => has_elevator = true
 *   - has_garage: "true" => garage != 'No tiene' and garage is not null
 *   - has_terrace: "true" => has_terrace = true
 *   - exclude_ids: comma-separated property_unique_ids to exclude
 *   - search: text search on address
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const minBedrooms = searchParams.get("min_bedrooms");
    const maxBedrooms = searchParams.get("max_bedrooms");
    const areaClusters = searchParams.get("area_clusters");
    const rentalType = searchParams.get("rental_type");
    const minSqm = searchParams.get("min_sqm");
    const maxSqm = searchParams.get("max_sqm");
    const minBathrooms = searchParams.get("min_bathrooms");
    const maxBathrooms = searchParams.get("max_bathrooms");
    const hasElevator = searchParams.get("has_elevator");
    const hasGarage = searchParams.get("has_garage");
    const hasTerrace = searchParams.get("has_terrace");
    const excludeIds = searchParams.get("exclude_ids");
    const search = searchParams.get("search");

    let query = supabase
      .from("properties")
      .select("*")
      .eq("current_stage", "Publicado");

    if (city) {
      query = query.eq("city", city);
    }
    if (minPrice) {
      query = query.gte("announcement_price", parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte("announcement_price", parseFloat(maxPrice));
    }
    if (minBedrooms) {
      query = query.gte("bedrooms", parseInt(minBedrooms, 10));
    }
    if (maxBedrooms) {
      query = query.lte("bedrooms", parseInt(maxBedrooms, 10));
    }
    if (areaClusters) {
      const zones = areaClusters.split(",").filter(Boolean);
      if (zones.length > 0) {
        query = query.in("area_cluster", zones);
      }
    }
    if (rentalType) {
      query = query.eq("rental_type", rentalType);
    }
    if (minSqm) {
      query = query.gte("square_meters", parseInt(minSqm, 10));
    }
    if (maxSqm) {
      query = query.lte("square_meters", parseInt(maxSqm, 10));
    }
    if (minBathrooms) {
      query = query.gte("bathrooms", parseInt(minBathrooms, 10));
    }
    if (maxBathrooms) {
      query = query.lte("bathrooms", parseInt(maxBathrooms, 10));
    }
    if (hasElevator === "true") {
      query = query.eq("has_elevator", true);
    }
    if (hasGarage === "true") {
      query = query.neq("garage", "No tiene").not("garage", "is", null);
    }
    if (hasTerrace === "true") {
      query = query.eq("has_terrace", true);
    }
    if (excludeIds) {
      const ids = excludeIds.split(",").filter(Boolean);
      if (ids.length > 0) {
        const inList = "(" + ids.map((id) => `"${id}"`).join(",") + ")";
        query = query.not("property_unique_id", "in", inList);
      }
    }
    if (search?.trim()) {
      query = query.ilike("address", `%${search.trim()}%`);
    }

    query = query.order("announcement_price", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // Fetch ALL "Publicado" properties for dropdown options
    const { data: allPublished } = await supabase
      .from("properties")
      .select("city, area_cluster, rental_type")
      .eq("current_stage", "Publicado");

    const allCities = [
      ...new Set(
        (allPublished || [])
          .map((p) => p.city)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      ),
    ].sort();

    // Area clusters scoped to the selected city (so zones update when city changes)
    const scopedPublished = city
      ? (allPublished || []).filter((p) => p.city === city)
      : allPublished || [];

    const allAreaClusters = [
      ...new Set(
        scopedPublished
          .map((p) => p.area_cluster)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      ),
    ].sort();

    const allRentalTypes = [
      ...new Set(
        (allPublished || [])
          .map((p) => p.rental_type)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      ),
    ].sort();

    return NextResponse.json({
      properties: data || [],
      filterOptions: {
        cities: allCities,
        areaClusters: allAreaClusters,
        rentalTypes: allRentalTypes,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching published properties:", error);
    const message = error instanceof Error ? error.message : "Error al cargar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
