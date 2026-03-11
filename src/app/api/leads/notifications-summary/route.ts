import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const NOTIFICATION_PRIORITY: Record<string, number> = {
  urgent_visit_cancel: 1,
  auto_recovery: 2,
  phase_auto_move: 2,
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
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("lead_notifications")
      .select("leads_unique_id, notification_type, is_read")
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

    return NextResponse.json(
      { summary: summaryMap, totalCount: (data ?? []).length },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: unknown) {
    console.error("[Fetch Notifications Summary Error]:", error);
    const message = error instanceof Error ? error.message : "Error fetching notifications summary";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
