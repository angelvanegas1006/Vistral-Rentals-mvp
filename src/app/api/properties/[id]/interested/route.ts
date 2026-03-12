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

    // Fetch active (non-terminal) MTPs
    const { data: mtps, error: mtpError } = await supabase
      .from("leads_properties")
      .select("leads_unique_id, current_status")
      .eq("properties_unique_id", propertyId)
      .not("current_status", "in", `(${TERMINAL_STATUSES.join(",")})`);

    if (mtpError) throw mtpError;

    // Fetch accepted MTP (if any)
    const { data: acceptedMtps, error: acceptedError } = await supabase
      .from("leads_properties")
      .select("leads_unique_id")
      .eq("properties_unique_id", propertyId)
      .eq("current_status", "interesado_aceptado")
      .limit(1);

    if (acceptedError) throw acceptedError;

    // Build active interested list
    let interested: Array<{
      leadId: string;
      leadUuid: string;
      leadName: string;
      mtpStatus: string;
    }> = [];

    if (mtps && mtps.length > 0) {
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

      interested = mtps.map((m) => {
        const lead = leadMap.get(m.leads_unique_id);
        return {
          leadId: m.leads_unique_id,
          leadUuid: lead?.uuid || "",
          leadName: lead?.name || "Sin nombre",
          mtpStatus: m.current_status || "interesado_cualificado",
        };
      });
    }

    // Build accepted lead object (if any)
    let acceptedLead = null;

    if (acceptedMtps && acceptedMtps.length > 0) {
      const acceptedLeadUniqueId = acceptedMtps[0].leads_unique_id;

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select(
          "id, leads_unique_id, name, phone, email, occupant_count, move_in_timeframe, lease_duration_preference, employment_status, job_title, monthly_net_income, has_guarantor"
        )
        .eq("leads_unique_id", acceptedLeadUniqueId)
        .single();

      if (leadError) {
        console.error("[Fetch Accepted Lead Error]:", leadError);
      } else if (leadData) {
        acceptedLead = {
          leadId: leadData.leads_unique_id,
          leadUuid: leadData.id,
          leadName: leadData.name || "Sin nombre",
          phone: leadData.phone || "",
          email: leadData.email || "",
          occupant_count: leadData.occupant_count,
          move_in_timeframe: leadData.move_in_timeframe,
          lease_duration_preference: leadData.lease_duration_preference,
          employment_status: leadData.employment_status,
          job_title: leadData.job_title,
          monthly_net_income: leadData.monthly_net_income,
          has_guarantor: leadData.has_guarantor,
        };
      }
    }

    return NextResponse.json({ interested, acceptedLead });
  } catch (error) {
    console.error("[Fetch Interested Leads Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener interesados" },
      { status: 500 }
    );
  }
}
