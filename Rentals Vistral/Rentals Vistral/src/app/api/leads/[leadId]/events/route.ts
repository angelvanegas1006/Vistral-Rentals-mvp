import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { insertLeadEvent, type LeadEventType } from "@/lib/leads/lead-events";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * GET /api/leads/[leadId]/events
 * Returns the activity log (lead_events) for a lead, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { error: "leadId (leads_unique_id) is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("lead_events")
      .select("*")
      .eq("leads_unique_id", leadId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ events: data ?? [] });
  } catch (error: unknown) {
    console.error("Error fetching lead events:", error);
    const message = error instanceof Error ? error.message : "Error al cargar eventos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const VALID_EVENT_TYPES: LeadEventType[] = [
  "PROPERTY_ADDED", "MTP_UPDATE", "PHASE_CHANGE", "PHASE_CHANGE_BACKWARD", "MTP_ARCHIVED",
];

/**
 * POST /api/leads/[leadId]/events
 * Creates a new activity-log entry for the lead.
 * Body: { event_type, title, description, properties_unique_id?, new_status? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const { leadId } = await params;
    if (!leadId?.trim()) {
      return NextResponse.json(
        { error: "leadId (leads_unique_id) is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { event_type, title, description, properties_unique_id, new_status } = body;

    if (!event_type || !title || !description) {
      return NextResponse.json(
        { error: "event_type, title, and description are required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    await insertLeadEvent(supabase, {
      leads_unique_id: leadId,
      properties_unique_id: properties_unique_id ?? null,
      event_type,
      title,
      description,
      new_status: new_status ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Error creating lead event:", error);
    const message = error instanceof Error ? error.message : "Error al crear evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
