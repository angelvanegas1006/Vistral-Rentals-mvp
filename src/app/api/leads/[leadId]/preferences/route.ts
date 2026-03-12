import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * PATCH /api/leads/[leadId]/preferences
 * Updates rental preferences for a lead (by UUID).
 * Body: { number_of_occupants?, move_in_timeframe?, lease_duration_preference? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { success: false, error: "leadId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { number_of_occupants, move_in_timeframe, lease_duration_preference } = body as {
      number_of_occupants?: number | null;
      move_in_timeframe?: string | null;
      lease_duration_preference?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if ("number_of_occupants" in body) updates.number_of_occupants = number_of_occupants;
    if ("move_in_timeframe" in body) updates.move_in_timeframe = move_in_timeframe;
    if ("lease_duration_preference" in body) updates.lease_duration_preference = lease_duration_preference;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) {
      console.error("[Update Lead Preferences Error]:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("[API Lead Preferences Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
