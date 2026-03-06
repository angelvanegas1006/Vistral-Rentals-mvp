import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { searchParams } = new URL(request.url);
    const kanbanType = searchParams.get("kanbanType");
    const searchQuery = searchParams.get("searchQuery");
    const property_type = searchParams.get("property_type");
    const area_cluster = searchParams.get("area_cluster");
    const admin_name = searchParams.get("admin_name");
    const showDev = searchParams.get("show_dev");

    let query = supabase.from("properties").select("*");

    if (showDev === "true") {
      query = query.eq("is_dev", true);
    } else {
      query = query.or("is_dev.is.null,is_dev.eq.false");
    }

    // Aplicar filtros según kanbanType
    const phaseColumn = "current_stage";
    
    if (kanbanType === "captacion") {
      query = query.in(phaseColumn, [
        "Viviendas Prophero",
        "Listo para Alquilar",
        "Publicado",
        "Inquilino aceptado",
        "Pendiente de trámites",
      ]);
    } else if (kanbanType === "portfolio") {
      query = query.in(phaseColumn, [
        "Alquilado",
        "Actualización de Renta (IPC)",
        "Gestión de Renovación",
        "Finalización y Salida",
      ]);
    }

    // Aplicar búsqueda si existe
    if (searchQuery?.trim()) {
      const search = `%${searchQuery.toLowerCase()}%`;
      query = query.or(
        `id.ilike.${search},property_unique_id.ilike.${search},address.ilike.${search},city.ilike.${search}`
      );
    }

    // Aplicar filtros
    if (property_type) {
      const propertyTypes = property_type.split(",");
      if (propertyTypes.length > 0) {
        query = query.in("property_asset_type", propertyTypes);
      }
    }
    if (area_cluster) {
      const areaClusters = area_cluster.split(",");
      if (areaClusters.length > 0) {
        query = query.in("area_cluster", areaClusters);
      }
    }
    if (admin_name) {
      const managers = admin_name.split(",");
      if (managers.length > 0) {
        query = query.in("admin_name", managers);
      }
    }

    // Ordenar por días en fase
    const daysColumn = "days_in_stage";
    const { data, error } = await query.order(daysColumn, {
      ascending: true,
    });

    if (error) throw error;

    return NextResponse.json({ properties: data || [] });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Error al obtener propiedades" },
      { status: 500 }
    );
  }
}
