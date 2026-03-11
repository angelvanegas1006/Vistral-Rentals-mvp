import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCallerRole, isDeveloperRole } from "@/lib/auth/server-dev-check";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

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
      console.error("[Missing Property ID]:", "Params:", params, "URL:", request.url);
      return NextResponse.json(
        { success: false, error: "Property ID is required" },
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
      console.error("[Supabase Query Error]:", error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    if (data.is_dev) {
      const role = await getCallerRole(request);
      if (!isDeveloperRole(role)) {
        return NextResponse.json(
          { success: false, error: "Property not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Fetch Property Error]:", error);
    const errorMessage = error?.message || error?.code || "Error al obtener propiedad";
    const statusCode = error?.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

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

    const { data: existing } = await supabase
      .from("properties")
      .select("is_dev")
      .eq("property_unique_id", propertyId)
      .maybeSingle();

    if (existing?.is_dev) {
      const role = await getCallerRole(request);
      if (!isDeveloperRole(role)) {
        return NextResponse.json(
          { success: false, error: "No autorizado" },
          { status: 403 }
        );
      }
    }

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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Update Property Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar propiedad" },
      { status: 500 }
    );
  }
}
