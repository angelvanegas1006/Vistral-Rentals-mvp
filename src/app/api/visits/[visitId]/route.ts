import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const visitId = params.visitId;
    const body = await request.json();

    const { visit_date, visit_type, notes } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (visit_date !== undefined) updateData.visit_date = visit_date;
    if (visit_type !== undefined) updateData.visit_type = visit_type;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from("property_visits")
      .update(updateData)
      .eq("id", visitId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ visit: data });
  } catch (error) {
    console.error("Error updating visit:", error);
    return NextResponse.json(
      { error: "Error al actualizar visita" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const visitId = params.visitId;

    const { error } = await supabase
      .from("property_visits")
      .delete()
      .eq("id", visitId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit:", error);
    return NextResponse.json(
      { error: "Error al eliminar visita" },
      { status: 500 }
    );
  }
}
