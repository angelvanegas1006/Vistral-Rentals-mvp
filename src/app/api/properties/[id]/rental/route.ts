import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const propertyId = params.id;

    const { data, error } = await supabase
      .from("property_rentals")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ rental: data });
  } catch (error) {
    console.error("[Fetch Rental Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener datos del alquiler" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const propertyId = params.id;
    const body = await request.json();

    const { rent_price, start_date, duration, security_deposit, legal_contract_url } = body;

    // Check if rental exists
    const { data: existing } = await supabase
      .from("property_rentals")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing rental
      const { data, error } = await supabase
        .from("property_rentals")
        .update({
          rent_price,
          start_date,
          duration,
          security_deposit,
          legal_contract_url,
          updated_at: new Date().toISOString(),
        })
        .eq("property_id", propertyId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new rental
      const { data, error } = await supabase
        .from("property_rentals")
        .insert({
          property_id: propertyId,
          rent_price,
          start_date,
          duration,
          security_deposit,
          legal_contract_url,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ rental: result });
  } catch (error) {
    console.error("[Update Rental Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar datos del alquiler" },
      { status: 500 }
    );
  }
}
