import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MTP_EXIT_STATUS_IDS } from "@/lib/leads/mtp-status";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads/filter-by-mtp?property_query=...&mtp_status_type=active|inactive|all
 *
 * Returns distinct leads_unique_id values for leads that have an MTP
 * matching the given property (by address or property_unique_id) and
 * optionally filtered by active/inactive MTP status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyQuery = searchParams.get("property_query")?.trim() || "";
    const mtpStatusType = searchParams.get("mtp_status_type") || "all";

    if (!propertyQuery) {
      return NextResponse.json(
        { error: "property_query is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const search = `%${propertyQuery.toLowerCase()}%`;

    const [byId, byAddr] = await Promise.all([
      supabase.from("properties").select("property_unique_id").ilike("property_unique_id", search),
      supabase.from("properties").select("property_unique_id").ilike("address", search),
    ]);

    if (byId.error) throw byId.error;
    if (byAddr.error) throw byAddr.error;

    const matchedProperties = [
      ...(byId.data || []),
      ...(byAddr.data || []),
    ];

    if (!matchedProperties || matchedProperties.length === 0) {
      return NextResponse.json({ leads_unique_ids: [] });
    }

    const propertyIds = [...new Set(matchedProperties.map((p) => p.property_unique_id))];

    let lpQuery = supabase
      .from("leads_properties")
      .select("leads_unique_id")
      .in("properties_unique_id", propertyIds);

    if (mtpStatusType === "active") {
      const exitStatuses = MTP_EXIT_STATUS_IDS as unknown as string[];
      for (const status of exitStatuses) {
        lpQuery = lpQuery.neq("current_status", status);
      }
    } else if (mtpStatusType === "inactive") {
      lpQuery = lpQuery.in("current_status", MTP_EXIT_STATUS_IDS as unknown as string[]);
    }

    const { data: leadProps, error: lpError } = await lpQuery;

    if (lpError) throw lpError;

    const uniqueIds = [...new Set((leadProps || []).map((lp) => lp.leads_unique_id))];

    return NextResponse.json({ leads_unique_ids: uniqueIds });
  } catch (error: unknown) {
    console.error("Error in filter-by-mtp:", error);
    const message = error instanceof Error ? error.message : "Error al filtrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
