import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/leads/[leadId]/notifications
 * Returns unread notifications for a lead.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json({ success: false, error: "leadId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("lead_notifications")
      .select("*")
      .eq("leads_unique_id", leadId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: unknown) {
    console.error("[Fetch Notifications Error]:", error);
    const message = error instanceof Error ? error.message : "Error fetching notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[leadId]/notifications
 * Marks a notification as read. Body: { notificationId: string }
 * Updates by id only - notificationId uniquely identifies the row.
 */
export async function PATCH(
  request: NextRequest,
  _context: { params: Promise<{ leadId: string }> }
) {
  try {
    const { notificationId } = await request.json();
    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: updated, error } = await supabase
      .from("lead_notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select("id");

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return NextResponse.json({ success: false, error: "Notification not found or already read" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { updated: updated.length } });
  } catch (error: unknown) {
    console.error("[Update Notification Error]:", error);
    const message = error instanceof Error ? error.message : "Error updating notification";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
