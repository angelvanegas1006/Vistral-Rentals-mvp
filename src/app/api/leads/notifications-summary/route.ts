import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const NOTIFICATION_PRIORITY: Record<string, number> = {
  urgent_visit_cancel: 1,
  info_property_unavailable: 2,
  recovery: 3,
};

/**
 * GET /api/leads/notifications-summary
 * Returns a map of leads_unique_id -> highest priority notification_type
 * for all leads that have unread notifications.
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("lead_notifications")
      .select("leads_unique_id, notification_type")
      .eq("is_read", false);

    if (error) throw error;

    const summaryMap: Record<string, string> = {};

    for (const row of data ?? []) {
      const existing = summaryMap[row.leads_unique_id];
      const existingPriority = existing ? (NOTIFICATION_PRIORITY[existing] ?? 99) : 99;
      const newPriority = NOTIFICATION_PRIORITY[row.notification_type] ?? 99;

      if (newPriority < existingPriority) {
        summaryMap[row.leads_unique_id] = row.notification_type;
      }
    }

    return NextResponse.json({ summary: summaryMap });
  } catch (error: unknown) {
    console.error("Error fetching notifications summary:", error);
    const message = error instanceof Error ? error.message : "Error fetching notifications summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
