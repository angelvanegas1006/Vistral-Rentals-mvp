import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const visit_type = searchParams.get("visit_type");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let query = supabase
      .from("property_visits")
      .select("*")
      .eq("property_id", propertyId);

    if (visit_type) {
      query = query.eq("visit_type", visit_type);
    }

    if (start_date) {
      query = query.gte("visit_date", start_date);
    }

    if (end_date) {
      query = query.lte("visit_date", end_date);
    }

    const { data, error } = await query.order("visit_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ visits: data || [] });
  } catch (error) {
    console.error("[Fetch Visits Error]:", error);
    return NextResponse.json(
      { error: "Error al obtener visitas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const propertyId = params.id;
    const body = await request.json();

    const { visit_date, visit_type, notes, created_by } = body;

    if (!visit_date || !visit_type) {
      return NextResponse.json(
        { error: "visit_date y visit_type son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("property_visits")
      .insert({
        property_id: propertyId,
        visit_date,
        visit_type,
        notes: notes || null,
        created_by: created_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Create Visit Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear visita" },
      { status: 500 }
    );
  }
}
