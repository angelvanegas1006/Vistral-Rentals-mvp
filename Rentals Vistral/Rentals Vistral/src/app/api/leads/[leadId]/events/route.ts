import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });

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
