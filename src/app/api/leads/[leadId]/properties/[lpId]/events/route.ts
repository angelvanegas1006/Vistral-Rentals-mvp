import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads/[leadId]/properties/[lpId]/events
 * Returns lead_events filtered by lead + property for the Historial y Correcciones modal.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string; lpId: string }> }
) {
  try {
    const { leadId, lpId } = await params;
    if (!leadId?.trim() || !lpId?.trim()) {
      return NextResponse.json(
        { error: "leadId and lpId are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: mtp, error: mtpError } = await supabase
      .from("leads_properties")
      .select("properties_unique_id")
      .eq("id", lpId)
      .eq("leads_unique_id", leadId)
      .single();

    if (mtpError || !mtp) {
      return NextResponse.json(
        { error: "MTP not found" },
        { status: 404 }
      );
    }

    const { data: events, error: eventsError } = await supabase
      .from("lead_events")
      .select("id, event_type, title, description, new_status, created_at")
      .eq("leads_unique_id", leadId)
      .eq("properties_unique_id", mtp.properties_unique_id)
      .order("created_at", { ascending: true });

    if (eventsError) throw eventsError;

    return NextResponse.json({ events: events ?? [] });
  } catch (error: unknown) {
    console.error("Error fetching MTP events:", error);
    const message = error instanceof Error ? error.message : "Error fetching events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
