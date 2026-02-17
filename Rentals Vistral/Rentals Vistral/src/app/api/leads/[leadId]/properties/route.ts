import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/leads/[leadId]/properties
 * Obtiene leads_properties con properties unidos para un lead.
 * leadId = leads_unique_id (ej: LEAD-001)
 */
export async function GET(
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: leadProps, error: lpError } = await supabase
      .from("leads_properties")
      .select("*")
      .eq("leads_unique_id", leadId);

    if (lpError) throw lpError;

    if (!leadProps || leadProps.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const propertyIds = leadProps.map((lp) => lp.properties_unique_id);

    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .in("property_unique_id", propertyIds);

    if (propError) throw propError;

    const propertyMap = new Map(
      (properties || []).map((p) => [p.property_unique_id, p])
    );

    const items = leadProps
      .map((lp) => {
        const property = propertyMap.get(lp.properties_unique_id);
        if (!property) return null;
        return { leadsProperty: lp, property };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error("Error fetching lead properties:", error);
    const message = error instanceof Error ? error.message : "Error al cargar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
