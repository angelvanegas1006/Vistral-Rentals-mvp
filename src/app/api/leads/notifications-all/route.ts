import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/leads/notifications-all
 * Returns all unread notifications across all leads, joined with lead name.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("lead_notifications")
      .select("*, leads!inner(name, leads_unique_id)")
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const notifications = (data ?? []).map((row: any) => ({
      id: row.id,
      leads_unique_id: row.leads_unique_id,
      properties_unique_id: row.properties_unique_id,
      notification_type: row.notification_type,
      title: row.title,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at,
      lead_name: row.leads?.name ?? "Interesado",
    }));

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    console.error("[Fetch All Notifications Error]:", error);
    const message =
      error instanceof Error ? error.message : "Error fetching notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/notifications-all
 * Marks a notification as read. Body: { notificationId: string }
 */
export async function PATCH(request: NextRequest) {
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
    const message =
      error instanceof Error ? error.message : "Error updating notification";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
