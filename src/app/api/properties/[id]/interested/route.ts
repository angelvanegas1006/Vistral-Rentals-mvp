import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const EXIT_STATUSES = ["en_espera", "descartada", "no_disponible"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;

    const { data: mtps, error: mtpError } = await supabase
      .from("leads_properties")
      .select("leads_unique_id, current_status")
      .eq("properties_unique_id", propertyId)
      .not("current_status", "in", `(${EXIT_STATUSES.join(",")})`);

    if (mtpError) throw mtpError;
    if (!mtps || mtps.length === 0) {
      return NextResponse.json({ interested: [] });
    }

    const leadIds = [...new Set(mtps.map((m) => m.leads_unique_id))];

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("leads_unique_id, name")
      .in("leads_unique_id", leadIds);

    if (leadsError) throw leadsError;

    const nameMap = new Map(
      (leads || []).map((l) => [l.leads_unique_id, l.name])
    );

    const interested = mtps.map((m) => ({
      leadId: m.leads_unique_id,
      leadName: nameMap.get(m.leads_unique_id) || "Sin nombre",
      mtpStatus: m.current_status || "interesado_cualificado",
    }));

    return NextResponse.json({ interested });
  } catch (error) {
    console.error("Error fetching interested leads:", error);
    return NextResponse.json(
      { error: "Error al obtener interesados" },
      { status: 500 }
    );
  }
}
