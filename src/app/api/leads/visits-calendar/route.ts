import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/leads/visits-calendar?start=ISO&end=ISO
 * Returns leads_properties with visit_date in the given range,
 * joined with lead name and property address.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ success: false, error: "start and end query params required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    let query = supabase
      .from("leads_properties")
      .select("id, leads_unique_id, properties_unique_id, visit_date, current_status")
      .not("visit_date", "is", null)
      .gte("visit_date", start)
      .lte("visit_date", end);

    const { data: mtps, error: mtpErr } = await query;
    if (mtpErr) throw mtpErr;

    if (!mtps || mtps.length === 0) {
      return NextResponse.json({ visits: [] });
    }

    const leadIds = [...new Set(mtps.map((m) => m.leads_unique_id))];
    const propIds = [...new Set(mtps.map((m) => m.properties_unique_id))];

    const [leadsRes, propsRes] = await Promise.all([
      supabase.from("leads").select("leads_unique_id, name").in("leads_unique_id", leadIds),
      supabase.from("properties").select("property_unique_id, address").in("property_unique_id", propIds),
    ]);

    const leadMap = new Map((leadsRes.data || []).map((l) => [l.leads_unique_id, l.name]));
    const propMap = new Map((propsRes.data || []).map((p) => [p.property_unique_id, p.address]));

    const visits = mtps.map((m) => ({
      id: m.id,
      visit_date: m.visit_date,
      lead_id: m.leads_unique_id,
      lead_name: leadMap.get(m.leads_unique_id) ?? m.leads_unique_id,
      property_id: m.properties_unique_id,
      property_address: propMap.get(m.properties_unique_id) ?? m.properties_unique_id,
      current_status: m.current_status,
    }));

    return NextResponse.json({ visits });
  } catch (error: unknown) {
    console.error("[Fetch Visits Calendar Error]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
