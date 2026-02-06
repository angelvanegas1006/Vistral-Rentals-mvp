import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Extract property ID from params or URL as fallback
    let propertyId = params?.id;
    
    // Fallback: extract from URL if params.id is not available
    if (!propertyId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const idIndex = pathParts.indexOf('properties');
      if (idIndex !== -1 && pathParts[idIndex + 1]) {
        propertyId = decodeURIComponent(pathParts[idIndex + 1]);
      }
    }

    console.log("API Route - Received params:", params);
    console.log("API Route - Property ID:", propertyId);
    console.log("API Route - Request URL:", request.url);

    if (!propertyId || propertyId.trim() === "") {
      console.error("Property ID is missing or empty. Params:", params, "URL:", request.url);
      return NextResponse.json(
        { error: "Property ID is required", receivedParams: params, url: request.url },
        { status: 400 }
      );
    }

    // Buscar por property_unique_id (primary identifier for routing)
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("property_unique_id", propertyId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ property: data });
  } catch (error: any) {
    console.error("Error fetching property:", error);
    const errorMessage = error?.message || error?.code || "Error al obtener propiedad";
    const statusCode = error?.code === "PGRST116" ? 404 : 500; // PGRST116 = no rows returned
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Extract property ID from params or URL as fallback
    let propertyId = params?.id;
    
    // Fallback: extract from URL if params.id is not available
    if (!propertyId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const idIndex = pathParts.indexOf('properties');
      if (idIndex !== -1 && pathParts[idIndex + 1]) {
        propertyId = decodeURIComponent(pathParts[idIndex + 1]);
      }
    }
    const body = await request.json();

    // Actualizar propiedad por property_unique_id
    const { data, error } = await supabase
      .from("properties")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("property_unique_id", propertyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ property: data });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Error al actualizar propiedad" },
      { status: 500 }
    );
  }
}
