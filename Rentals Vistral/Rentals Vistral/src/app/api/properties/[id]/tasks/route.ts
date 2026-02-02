import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    let query = supabase
      .from("property_tasks")
      .select("*")
      .eq("property_id", propertyId);

    if (phase) {
      query = query.eq("phase", phase);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;
    const body = await request.json();

    const { phase, task_type, is_completed, task_data } = body;

    // Check if task exists
    const { data: existing } = await supabase
      .from("property_tasks")
      .select("id")
      .eq("property_id", propertyId)
      .eq("phase", phase)
      .eq("task_type", task_type)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing task
      const updateData: any = {
        is_completed: is_completed ?? existing.is_completed,
        task_data: task_data ?? existing.task_data,
        updated_at: new Date().toISOString(),
      };

      // Set completed_at if completing the task
      if (is_completed === true && !existing.is_completed) {
        updateData.completed_at = new Date().toISOString();
      } else if (is_completed === false) {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from("property_tasks")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new task
      const insertData: any = {
        property_id: propertyId,
        phase,
        task_type,
        is_completed: is_completed || false,
        task_data: task_data || {},
      };

      if (insertData.is_completed) {
        insertData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("property_tasks")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ task: result });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");
    const task_type = searchParams.get("task_type");

    if (!phase || !task_type) {
      return NextResponse.json(
        { error: "phase y task_type son requeridos" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("property_tasks")
      .delete()
      .eq("property_id", propertyId)
      .eq("phase", phase)
      .eq("task_type", task_type);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
