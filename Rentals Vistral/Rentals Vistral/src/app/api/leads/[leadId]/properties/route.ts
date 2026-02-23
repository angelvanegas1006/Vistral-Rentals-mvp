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

    // Auto-advance: Visita Agendada -> Pendiente de Evaluación cuando visit_date <= now
    const now = new Date().toISOString();
    const { data: toAdvance } = await supabase
      .from("leads_properties")
      .select("id, current_status, visit_date, scheduled_visit_date")
      .eq("leads_unique_id", leadId)
      .eq("current_status", "visita_agendada");

    if (toAdvance?.length) {
      for (const lp of toAdvance) {
        const visitDate = (lp.visit_date ?? lp.scheduled_visit_date) as string | null;
        const visitDateTime = visitDate?.includes("T") ? visitDate : `${visitDate}T00:00:00.000Z`;
        if (visitDate && visitDateTime <= now) {
          await supabase
            .from("leads_properties")
            .update({
              current_status: "pendiente_de_evaluacion",
              previous_status: "visita_agendada",
            })
            .eq("id", lp.id);
        }
      }
    }

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

/**
 * POST /api/leads/[leadId]/properties
 * Adds a property to the lead (creates a leads_properties record).
 * Body: { properties_unique_id: string }
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
    const { properties_unique_id } = body;

    if (!properties_unique_id?.trim()) {
      return NextResponse.json(
        { error: "properties_unique_id is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check for duplicate
    const { data: existing } = await supabase
      .from("leads_properties")
      .select("id")
      .eq("leads_unique_id", leadId)
      .eq("properties_unique_id", properties_unique_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Esta propiedad ya está asignada a este interesado" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("leads_properties")
      .insert({
        leads_unique_id: leadId,
        properties_unique_id: properties_unique_id,
        current_status: "perfil_cualificado",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding property to lead:", error);
    const message = error instanceof Error ? error.message : "Error al asignar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
