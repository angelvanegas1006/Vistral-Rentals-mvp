import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * PATCH /api/leads-properties/[id]
 * Actualiza un registro de leads_properties (ej. scheduled_visit_date)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { error: "leads_properties id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { scheduled_visit_date } = body;

    const updateData: Record<string, unknown> = {};
    if (scheduled_visit_date !== undefined) {
      updateData.scheduled_visit_date = scheduled_visit_date === "" || scheduled_visit_date === null ? null : scheduled_visit_date;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("leads_properties")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating leads_properties:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Error in PATCH leads-properties:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
