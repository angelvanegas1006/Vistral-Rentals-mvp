import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("lead_notifications")
      .select("*")
      .eq("leads_unique_id", leadId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    const message = error instanceof Error ? error.message : "Error fetching notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[leadId]/notifications
 * Marks a notification as read. Body: { notificationId: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const { notificationId } = await request.json();
    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase
      .from("lead_notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("leads_unique_id", leadId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating notification:", error);
    const message = error instanceof Error ? error.message : "Error updating notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
