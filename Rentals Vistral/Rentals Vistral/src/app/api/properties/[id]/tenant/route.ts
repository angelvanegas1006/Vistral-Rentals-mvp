import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;

    const { data, error } = await supabase
      .from("property_tenants")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ tenant: data });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del inquilino" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;
    const body = await request.json();

    const { full_name, email, phone, nif } = body;

    // Check if tenant exists
    const { data: existing } = await supabase
      .from("property_tenants")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing tenant
      const { data, error } = await supabase
        .from("property_tenants")
        .update({
          full_name,
          email,
          phone,
          nif,
          updated_at: new Date().toISOString(),
        })
        .eq("property_id", propertyId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new tenant
      const { data, error } = await supabase
        .from("property_tenants")
        .insert({
          property_id: propertyId,
          full_name,
          email,
          phone,
          nif,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Also update properties table for quick access
    await supabase
      .from("properties")
      .update({
        tenant_full_name: full_name,
        tenant_email: email,
        tenant_phone: phone,
        tenant_nif: nif,
      })
      .eq("property_unique_id", propertyId);

    return NextResponse.json({ tenant: result });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json(
      { error: "Error al actualizar datos del inquilino" },
      { status: 500 }
    );
  }
}
