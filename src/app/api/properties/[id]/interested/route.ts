import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const TERMINAL_STATUSES = ["interesado_aceptado", "no_disponible"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    const propertyId = params.id;

    const { data: mtps, error: mtpError } = await supabase
      .from("leads_properties")
      .select("leads_unique_id, current_status")
      .eq("properties_unique_id", propertyId)
      .not("current_status", "in", `(${TERMINAL_STATUSES.join(",")})`);

    if (mtpError) throw mtpError;
    if (!mtps || mtps.length === 0) {
      return NextResponse.json({ interested: [] });
    }

    const leadIds = [...new Set(mtps.map((m) => m.leads_unique_id))];

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, leads_unique_id, name")
      .in("leads_unique_id", leadIds);

    if (leadsError) throw leadsError;

    const leadMap = new Map(
      (leads || []).map((l) => [
        l.leads_unique_id,
        { uuid: l.id, name: l.name },
      ])
    );

    const interested = mtps.map((m) => {
      const lead = leadMap.get(m.leads_unique_id);
      return {
        leadId: m.leads_unique_id,
        leadUuid: lead?.uuid || "",
        leadName: lead?.name || "Sin nombre",
        mtpStatus: m.current_status || "interesado_cualificado",
      };
    });

    return NextResponse.json({ interested });
  } catch (error) {
    console.error("[Fetch Interested Leads Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener interesados" },
      { status: 500 }
    );
  }
}
