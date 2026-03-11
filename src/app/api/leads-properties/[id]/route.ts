import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * PATCH /api/leads-properties/[id]
 * Actualiza un registro de leads_properties (ej. scheduled_visit_date)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "leads_properties id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      scheduled_visit_date,
      current_status,
      previous_status,
      visit_date,
      visit_feedback,
      visit_completed,
      tenant_confirmed_interest,
      sent_to_finaer_at,
      finaer_status,
      finaer_rejection_reason,
      owner_status,
      owner_rejection_reason,
      exit_reason,
      exit_comments,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (scheduled_visit_date !== undefined) {
      updateData.scheduled_visit_date = scheduled_visit_date === "" || scheduled_visit_date === null ? null : scheduled_visit_date;
    }
    if (current_status !== undefined) updateData.current_status = current_status;
    if (previous_status !== undefined) updateData.previous_status = previous_status;
    if (visit_date !== undefined) updateData.visit_date = visit_date === "" || visit_date === null ? null : visit_date;
    if (visit_feedback !== undefined) updateData.visit_feedback = visit_feedback;
    if (visit_completed !== undefined) updateData.visit_completed = visit_completed;
    if (tenant_confirmed_interest !== undefined) {
      updateData.tenant_confirmed_interest = tenant_confirmed_interest === "" || tenant_confirmed_interest === null ? null : tenant_confirmed_interest;
    }
    if (sent_to_finaer_at !== undefined) {
      updateData.sent_to_finaer_at = sent_to_finaer_at === "" || sent_to_finaer_at === null ? null : sent_to_finaer_at;
    }
    if (finaer_status !== undefined) updateData.finaer_status = finaer_status;
    if (finaer_rejection_reason !== undefined) updateData.finaer_rejection_reason = finaer_rejection_reason;
    if (owner_status !== undefined) updateData.owner_status = owner_status;
    if (owner_rejection_reason !== undefined) updateData.owner_rejection_reason = owner_rejection_reason;
    if (exit_reason !== undefined) updateData.exit_reason = exit_reason;
    if (exit_comments !== undefined) updateData.exit_comments = exit_comments;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("leads_properties")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Update Leads Properties Error]:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("[PATCH Leads Properties Error]:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
