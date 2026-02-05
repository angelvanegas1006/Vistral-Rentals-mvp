import { createClient } from "@/lib/supabase/client";
import { Property, PropertyType, PropertyData } from "./supply-property-storage";
import { isDemoMode } from "./utils";
import { validatePropertyComplete } from "./supply-property-validation";
import { getCurrentPropertyChecklist, checklistRowToChecklistData } from "./supply-checklist-supabase";
import { canViewAllProperties } from "./auth/permissions";
import { getCurrentPropertyOwners, ownerRowToVendedorData } from "./supply-owners-supabase";
import { getCurrentPropertyTenant, tenantRowToInquilinoData } from "./supply-tenants-supabase";
import type { Database } from "@/lib/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Save a property to Supabase database (full property object)
 */
export async function savePropertyToSupabase(property: Property): Promise<string> {
  if (isDemoMode()) {
    console.warn("[savePropertyToSupabase] Demo mode: Skipping Supabase save");
    return property.id;
  }

  const supabase = createClient();
  
  // Map Property to Supabase schema with all basic data
  const supabaseData = {
    id: property.id,
    name: property.fullAddress,
    address: property.fullAddress,
    type: property.propertyType,
    supply_phase: mapStageToSupplyPhase(property.currentStage),
    status: property.currentStage,
    property_unique_id: property.id,
    // Basic physical data
    superficie_construida: property.data?.superficieConstruida,
    superficie_util: property.data?.superficieUtil,
    ano_construccion: property.data?.anoConstruccion,
    referencia_catastral: property.data?.referenciaCatastral,
    habitaciones: property.data?.habitaciones,
    banos: property.data?.banos,
    plazas_aparcamiento: property.data?.plazasAparcamiento,
    ascensor: property.data?.ascensor,
    balcon_terraza: property.data?.balconTerraza,
    trastero: property.data?.trastero,
    orientacion: property.data?.orientacion ? JSON.stringify(property.data.orientacion) : null,
    // Economic data
    precio_venta: property.data?.precioVenta,
    gastos_comunidad: property.data?.gastosComunidad,
    confirmacion_gastos_comunidad: property.data?.confirmacionGastosComunidad,
    ibi_anual: property.data?.ibiAnual,
    confirmacion_ibi: property.data?.confirmacionIBI,
    // Legal and community status
    comunidad_propietarios_constituida: property.data?.comunidadPropietariosConstituida,
    edificio_seguro_activo: property.data?.edificioSeguroActivo,
    comercializa_exclusiva: property.data?.comercializaExclusiva,
    edificio_ite_favorable: property.data?.edificioITEfavorable,
    propiedad_alquilada: property.data?.propiedadAlquilada,
    situacion_inquilinos: property.data?.situacionInquilinos,
    // Address details
    planta: property.planta,
    puerta: property.puerta,
    bloque: property.bloque,
    escalera: property.escalera,
    // Documentation
    documentacion_minima: property.data?.videoGeneral || property.data?.notaSimpleRegistro || property.data?.certificadoEnergetico
      ? JSON.stringify({
          videoGeneral: property.data.videoGeneral || [],
          notaSimpleRegistro: property.data.notaSimpleRegistro || [],
          certificadoEnergetico: property.data.certificadoEnergetico || [],
        })
      : null,
    created_at: property.createdAt || new Date().toISOString(),
    updated_at: property.lastSaved || new Date().toISOString(),
    // Legacy fields for backward compatibility
    bedrooms: property.data?.habitaciones,
    bathrooms: property.data?.banos,
    square_meters: property.data?.superficieConstruida,
  };

  try {
    const { data, error } = await supabase
      .from("properties")
      .upsert(supabaseData, {
        onConflict: "id",
      })
      .select()
      .single();

    if (error) {
      console.error("[savePropertyToSupabase] Error saving property:", error);
      throw new Error(`Error al guardar la propiedad: ${error.message}`);
    }

    console.log("[savePropertyToSupabase] Property saved successfully:", data?.id);
    return data?.id || property.id;
  } catch (error: any) {
    console.error("[savePropertyToSupabase] Unexpected error:", error);
    throw error;
  }
}

/**
 * Save basic property data to Supabase (only PropertyData fields)
 */
export async function savePropertyBasicData(
  propertyId: string,
  data: PropertyData
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[savePropertyBasicData] Demo mode: Skipping Supabase save");
    return;
  }

  const supabase = createClient();
  
  // Get current property to check stage and propertyType
  const currentProperty = await getPropertyFromSupabase(propertyId);
  const propertyType = currentProperty?.propertyType || data.tipoPropiedad;
  
  // Build update data object, only including fields that have values
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Property type
  if (data.tipoPropiedad || propertyType) {
    updateData.type = data.tipoPropiedad || propertyType;
  }

  // Basic physical data - only add if value exists
  if (data.superficieConstruida !== undefined && data.superficieConstruida !== null) {
    updateData.superficie_construida = data.superficieConstruida;
    updateData.square_meters = data.superficieConstruida; // Legacy field
  }
  if (data.superficieUtil !== undefined && data.superficieUtil !== null) {
    updateData.superficie_util = data.superficieUtil;
  }
  if (data.anoConstruccion !== undefined && data.anoConstruccion !== null) {
    updateData.ano_construccion = data.anoConstruccion;
  }
  if (data.referenciaCatastral !== undefined && data.referenciaCatastral !== null) {
    updateData.referencia_catastral = data.referenciaCatastral;
  }
  if (data.habitaciones !== undefined && data.habitaciones !== null) {
    updateData.habitaciones = data.habitaciones;
    updateData.bedrooms = data.habitaciones; // Legacy field
  }
  if (data.banos !== undefined && data.banos !== null) {
    updateData.banos = data.banos;
    updateData.bathrooms = data.banos; // Legacy field
  }
  if (data.plazasAparcamiento !== undefined && data.plazasAparcamiento !== null) {
    updateData.plazas_aparcamiento = data.plazasAparcamiento;
  }
  if (data.ascensor !== undefined && data.ascensor !== null) {
    updateData.ascensor = data.ascensor;
  }
  if (data.balconTerraza !== undefined && data.balconTerraza !== null) {
    updateData.balcon_terraza = data.balconTerraza;
  }
  if (data.trastero !== undefined && data.trastero !== null) {
    updateData.trastero = data.trastero;
  }
  if (data.orientacion !== undefined && data.orientacion !== null) {
    // For JSONB fields, Supabase can handle both string and object formats
    // Store as array directly (JSONB) or as JSON string
    updateData.orientacion = Array.isArray(data.orientacion) && data.orientacion.length > 0 
      ? data.orientacion 
      : null;
  }

  // Economic data
  if (data.precioVenta !== undefined && data.precioVenta !== null) {
    updateData.precio_venta = data.precioVenta;
  }
  if (data.gastosComunidad !== undefined && data.gastosComunidad !== null) {
    updateData.gastos_comunidad = data.gastosComunidad;
  }
  if (data.confirmacionGastosComunidad !== undefined && data.confirmacionGastosComunidad !== null) {
    updateData.confirmacion_gastos_comunidad = data.confirmacionGastosComunidad;
  }
  if (data.ibiAnual !== undefined && data.ibiAnual !== null) {
    updateData.ibi_anual = data.ibiAnual;
  }
  if (data.confirmacionIBI !== undefined && data.confirmacionIBI !== null) {
    updateData.confirmacion_ibi = data.confirmacionIBI;
  }

  // Legal and community status
  if (data.comunidadPropietariosConstituida !== undefined && data.comunidadPropietariosConstituida !== null) {
    updateData.comunidad_propietarios_constituida = data.comunidadPropietariosConstituida;
  }
  if (data.edificioSeguroActivo !== undefined && data.edificioSeguroActivo !== null) {
    updateData.edificio_seguro_activo = data.edificioSeguroActivo;
  }
  if (data.comercializaExclusiva !== undefined && data.comercializaExclusiva !== null) {
    updateData.comercializa_exclusiva = data.comercializaExclusiva;
  }
  if (data.edificioITEfavorable !== undefined && data.edificioITEfavorable !== null) {
    updateData.edificio_ite_favorable = data.edificioITEfavorable;
  }
  if (data.propiedadAlquilada !== undefined && data.propiedadAlquilada !== null) {
    updateData.propiedad_alquilada = data.propiedadAlquilada;
  }
  if (data.situacionInquilinos !== undefined && data.situacionInquilinos !== null) {
    updateData.situacion_inquilinos = data.situacionInquilinos;
  }

  // Documentation - store as JSONB object directly
  if (data.videoGeneral || data.notaSimpleRegistro || data.certificadoEnergetico) {
    updateData.documentacion_minima = {
      videoGeneral: data.videoGeneral || [],
      notaSimpleRegistro: data.notaSimpleRegistro || [],
      certificadoEnergetico: data.certificadoEnergetico || [],
    };
  }

  try {
    const { error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", propertyId);

    if (error) {
      console.error("[savePropertyBasicData] Error updating property:", error);
      throw new Error(`Error al actualizar datos básicos: ${error.message}`);
    }

    console.log("[savePropertyBasicData] Basic data saved successfully");
    
    // Check if property should advance to "in-review" stage (optimized - only check if draft)
    // Note: This validation is now optional and can be skipped if user explicitly submits
    // The explicit submit action will handle the stage change more efficiently
    if (currentProperty?.currentStage === "draft") {
      // Get current checklist (already have data, so just need checklist)
      const checklistRow = await getCurrentPropertyChecklist(propertyId);
      const checklist = checklistRow ? checklistRowToChecklistData(checklistRow) : undefined;
      
      // Validate if property is complete
      const isComplete = validatePropertyComplete(data, propertyType, checklist);
      
      if (isComplete) {
        // Update stage to "in-review"
        const { error: stageError } = await supabase
          .from("properties")
          .update({
            status: "in-review",
            supply_phase: mapStageToSupplyPhase("in-review"),
            updated_at: new Date().toISOString(),
          })
          .eq("id", propertyId);
        
        if (stageError) {
          console.error("[savePropertyBasicData] Error updating stage:", stageError);
        } else {
          console.log("[savePropertyBasicData] Property advanced to 'in-review' stage");
        }
      }
    }
  } catch (error: any) {
    console.error("[savePropertyBasicData] Unexpected error:", error);
    throw error;
  }
}

/**
 * Get basic property data from Supabase
 */
export async function getPropertyBasicData(propertyId: string): Promise<PropertyData | null> {
  if (isDemoMode()) {
    console.warn("[getPropertyBasicData] Demo mode: Returning null");
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[getPropertyBasicData] Error fetching property:", error);
      throw error;
    }

    if (!data) return null;

    // Parse JSON fields - handle both string and object formats
    const orientacion = data.orientacion 
      ? (typeof data.orientacion === 'string' ? JSON.parse(data.orientacion) : data.orientacion)
      : undefined;
    const documentacionMinima = data.documentacion_minima 
      ? (typeof data.documentacion_minima === 'string' ? JSON.parse(data.documentacion_minima) : data.documentacion_minima)
      : {};

    return {
      tipoPropiedad: (data.type as PropertyType) || undefined,
      superficieConstruida: data.superficie_construida ? Number(data.superficie_construida) : undefined,
      superficieUtil: data.superficie_util ? Number(data.superficie_util) : undefined,
      anoConstruccion: data.ano_construccion || undefined,
      referenciaCatastral: data.referencia_catastral || undefined,
      habitaciones: data.habitaciones || undefined,
      banos: data.banos || undefined,
      plazasAparcamiento: data.plazas_aparcamiento || undefined,
      ascensor: data.ascensor ?? undefined,
      balconTerraza: data.balcon_terraza ?? undefined,
      trastero: data.trastero ?? undefined,
      orientacion: orientacion,
      precioVenta: data.precio_venta ? Number(data.precio_venta) : undefined,
      gastosComunidad: data.gastos_comunidad ? Number(data.gastos_comunidad) : undefined,
      confirmacionGastosComunidad: data.confirmacion_gastos_comunidad ?? undefined,
      ibiAnual: data.ibi_anual ? Number(data.ibi_anual) : undefined,
      confirmacionIBI: data.confirmacion_ibi ?? undefined,
      comunidadPropietariosConstituida: data.comunidad_propietarios_constituida ?? undefined,
      edificioSeguroActivo: data.edificio_seguro_activo ?? undefined,
      comercializaExclusiva: data.comercializa_exclusiva ?? undefined,
      edificioITEfavorable: data.edificio_ite_favorable ?? undefined,
      propiedadAlquilada: data.propiedad_alquilada ?? undefined,
      situacionInquilinos: data.situacion_inquilinos as any,
      videoGeneral: documentacionMinima.videoGeneral || undefined,
      notaSimpleRegistro: documentacionMinima.notaSimpleRegistro || undefined,
      certificadoEnergetico: documentacionMinima.certificadoEnergetico || undefined,
    };
  } catch (error: any) {
    console.error("[getPropertyBasicData] Unexpected error:", error);
    return null;
  }
}

/**
 * Create a new property in Supabase
 */
export async function createPropertyInSupabase(
  fullAddress: string,
  propertyType: PropertyType,
  planta?: string,
  puerta?: string,
  bloque?: string,
  escalera?: string
): Promise<string> {
  if (isDemoMode()) {
    console.warn("[createPropertyInSupabase] Demo mode: Skipping Supabase create");
    // Generate a demo ID
    return `supply_${Date.now()}`;
  }

  const supabase = createClient();
  
  // Get current user ID for created_by
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  
  // Generate ID
  const id = `supply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const supabaseData: any = {
    id,
    name: fullAddress,
    address: fullAddress,
    type: propertyType,
    supply_phase: "pending", // New properties start as pending
    status: "draft",
    property_unique_id: id,
    created_at: now,
    updated_at: now,
    notes: JSON.stringify({
      planta,
      puerta,
      bloque,
      escalera,
    }),
  };

  // Set created_by if user is authenticated
  if (userId) {
    supabaseData.created_by = userId;
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error("[createPropertyInSupabase] Error creating property:", error);
      throw new Error(`Error al crear la propiedad: ${error.message}`);
    }

    console.log("[createPropertyInSupabase] Property created successfully:", data?.id);
    return data?.id || id;
  } catch (error: any) {
    console.error("[createPropertyInSupabase] Unexpected error:", error);
    throw error;
  }
}

/**
 * Map SupplyPropertyStage to supply_phase enum
 */
export function mapStageToSupplyPhase(stage: string): string {
  const stageMap: Record<string, string> = {
    draft: "pending",
    "in-review": "review",
    "needs-correction": "in-progress",
    "in-negotiation": "in-progress",
    arras: "in-progress",
    "pending-to-settlement": "in-progress",
    settlement: "completed",
    rejected: "orphaned",
  };

  return stageMap[stage] || "pending";
}

/**
 * Get all properties from Supabase filtered by user role
 */
export async function getAllPropertiesFromSupabase(
  userId?: string | null,
  userRole?: AppRole | null
): Promise<Property[]> {
  if (isDemoMode()) {
    console.warn("[getAllPropertiesFromSupabase] Demo mode: Returning empty array");
    return [];
  }

  const supabase = createClient();

  try {
    let query = supabase
      .from("properties")
      .select("*");

    // Filter by role:
    // - Partners only see their own properties (created_by)
    // - Analysts only see properties assigned to them (assigned_to)
    if (userRole && userId) {
      if (userRole === 'supply_partner') {
        // Partners see only properties they created
        query = query.eq("created_by", userId);
      } else if (userRole === 'supply_analyst' || userRole === 'supply_lead') {
        // Analysts see only properties assigned to them
        query = query.eq("assigned_to", userId);
      } else if (userRole === 'renovator_analyst' || userRole === 'reno_lead') {
        // Reno analysts see only properties assigned to them
        query = query.eq("assigned_to", userId);
      }
      // Admins and other roles see all properties (no filter)
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[getAllPropertiesFromSupabase] Error fetching properties:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    type PropertiesRow = Database["public"]["Tables"]["properties"]["Row"];
    // Map Supabase data to Property format
    return data.map((row: PropertiesRow) => {
      const orientacion = row.orientacion ? (typeof row.orientacion === 'string' ? JSON.parse(row.orientacion) : row.orientacion) : undefined;
      const documentacionMinima = row.documentacion_minima ? (typeof row.documentacion_minima === 'string' ? JSON.parse(row.documentacion_minima) : row.documentacion_minima) : {};
      
      // Parse tags and rejection_reasons from JSONB
      const tags = row.tags ? (Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags as string)) : undefined;
      const rejectionReasons = row.rejection_reasons ? (Array.isArray(row.rejection_reasons) ? row.rejection_reasons : JSON.parse(row.rejection_reasons as string)) : undefined;
      
      // Determine current stage based on role
      // Map partner phases to analyst and reno phases
      // IMPORTANT: Only properties in "in-review" appear in backlog of Analyst/Reno
      // Properties in "draft" are only visible to Partners
      const partnerToAnalystPhaseMap: Record<string, string> = {
        'in-review': 'backlog', // When partner completes, goes to analyst backlog
        'needs-correction': 'needs-correction',
        'in-negotiation': 'in-negotiation',
        'arras': 'arras',
        'settlement': 'done',
        'sold': 'done',
        'rejected': 'rejected',
      };

      const partnerToRenoPhaseMap: Record<string, string> = {
        'in-review': 'backlog', // When partner completes, goes to reno backlog
        'needs-correction': 'backlog',
        'in-negotiation': 'in-progress',
        'arras': 'in-progress',
        'settlement': 'completed',
        'sold': 'completed',
        'rejected': 'backlog',
      };

      let currentStage: string;
      if (userRole === 'supply_analyst' || userRole === 'supply_lead') {
        // For analysts: use analyst_status if available, otherwise map from status
        if (row.analyst_status) {
          currentStage = row.analyst_status;
        } else if (row.status && partnerToAnalystPhaseMap[row.status]) {
          currentStage = partnerToAnalystPhaseMap[row.status];
        } else if (row.status === 'draft') {
          // Draft properties are not visible to analysts
          currentStage = 'draft'; // Will be filtered out
        } else {
          currentStage = row.status || "backlog";
        }
      } else if (userRole === 'renovator_analyst' || userRole === 'reno_lead') {
        // For reno: map from status to reno phases
        if (row.status && partnerToRenoPhaseMap[row.status]) {
          currentStage = partnerToRenoPhaseMap[row.status];
        } else if (row.status === 'draft') {
          // Draft properties are not visible to reno
          currentStage = 'draft'; // Will be filtered out
        } else {
          currentStage = row.status || "backlog";
        }
      } else {
        // For partners and admins: use status
        currentStage = row.status || "draft";
      }
      
      return {
        id: row.id,
        fullAddress: row.address || row.name || "",
        address: row.address || row.name || "",
        propertyType: (row.type as PropertyType) || "Piso",
        currentStage: currentStage,
        planta: row.planta,
        puerta: row.puerta,
        bloque: row.bloque,
        escalera: row.escalera,
        timeInStage: "0 días", // Calculate if needed
        createdAt: row.created_at || new Date().toISOString(),
        lastSaved: row.updated_at,
        // Supply Analyst fields
        assignedTo: row.assigned_to || undefined,
        tags: tags,
        correctionsCount: row.corrections_count || undefined,
        totalInvestment: row.total_investment ? Number(row.total_investment) : undefined,
        rejectionReasons: rejectionReasons,
        analystStatus: row.analyst_status || undefined,
        data: {
          tipoPropiedad: (row.type as PropertyType) || "Piso",
          superficieConstruida: row.superficie_construida ? Number(row.superficie_construida) : undefined,
          superficieUtil: row.superficie_util ? Number(row.superficie_util) : undefined,
          anoConstruccion: row.ano_construccion || undefined,
          referenciaCatastral: row.referencia_catastral || undefined,
          habitaciones: row.habitaciones || undefined,
          banos: row.banos || undefined,
          plazasAparcamiento: row.plazas_aparcamiento || undefined,
          ascensor: row.ascensor ?? undefined,
          balconTerraza: row.balcon_terraza ?? undefined,
          trastero: row.trastero ?? undefined,
          orientacion: orientacion,
          precioVenta: row.precio_venta ? Number(row.precio_venta) : undefined,
          gastosComunidad: row.gastos_comunidad ? Number(row.gastos_comunidad) : undefined,
          confirmacionGastosComunidad: row.confirmacion_gastos_comunidad ?? undefined,
          ibiAnual: row.ibi_anual ? Number(row.ibi_anual) : undefined,
          confirmacionIBI: row.confirmacion_ibi ?? undefined,
          comunidadPropietariosConstituida: row.comunidad_propietarios_constituida ?? undefined,
          edificioSeguroActivo: row.edificio_seguro_activo ?? undefined,
          comercializaExclusiva: row.comercializa_exclusiva ?? undefined,
          edificioITEfavorable: row.edificio_ite_favorable ?? undefined,
          propiedadAlquilada: row.propiedad_alquilada ?? undefined,
          situacionInquilinos: row.situacion_inquilinos as any,
          notaSimpleRegistro: documentacionMinima.notaSimpleRegistro || undefined,
          certificadoEnergetico: documentacionMinima.certificadoEnergetico || undefined,
        },
      };
    });
  } catch (error: any) {
    console.error("[getAllPropertiesFromSupabase] Unexpected error:", error);
    return [];
  }
}

/**
 * Get property from Supabase by ID
 */
export interface PropertyWithUsers extends Property {
  partnerName?: string;
  partnerEmail?: string;
  analystName?: string;
  analystEmail?: string;
}

/**
 * Get property with user information (partner and analyst)
 */
export async function getPropertyWithUsers(id: string): Promise<PropertyWithUsers | null> {
  if (isDemoMode()) {
    console.warn("[getPropertyWithUsers] Demo mode: Returning null");
    return null;
  }

  const supabase = createClient();

  try {
    // Load property and user metadata in parallel for better performance
    const [property, propertyRowResult, usersResult] = await Promise.allSettled([
      getPropertyFromSupabase(id),
      supabase
        .from("properties")
        .select("created_by, assigned_to")
        .eq("id", id)
        .single()
        .then((result: { data: { created_by?: string | null; assigned_to?: string | null } | null; error: { code?: string; message?: string } | null }) => {
          const { data, error } = result;
          if (error?.code === '42703') {
            // Column doesn't exist - migration hasn't been run
            return null;
          }
          if (error && error.code !== 'PGRST116') {
            console.warn("[getPropertyWithUsers] Could not fetch created_by/assigned_to:", {
              message: error.message,
              code: error.code,
            });
          }
          return data;
        }),
      supabase.rpc("get_users_with_roles").then((result: { data: unknown; error: { message?: string } | null }) => {
        const { data, error } = result;
        if (error) {
          console.warn("[getPropertyWithUsers] Error fetching users:", error);
          return null;
        }
        return data;
      }),
    ]);

    if (property.status === 'rejected' || !property.value) {
      return null;
    }

    const propertyData = property.value;
    const propertyRow = propertyRowResult.status === 'fulfilled' ? propertyRowResult.value : null;
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : null;

    // If we don't have user data or property row, return property without user info
    if (!usersData || !propertyRow) {
      return propertyData as PropertyWithUsers;
    }

    // Find partner (created_by) and analyst (assigned_to)
    const partner = usersData?.find((u: any) => u.id === propertyRow?.created_by);
    const analyst = usersData?.find((u: any) => u.id === propertyRow?.assigned_to);

    return {
      ...propertyData,
      partnerName: partner?.email ? extractNameFromEmail(partner.email) : undefined,
      partnerEmail: partner?.email || undefined,
      analystName: analyst?.email ? extractNameFromEmail(analyst.email) : undefined,
      analystEmail: analyst?.email || undefined,
    };
  } catch (error) {
    console.error("[getPropertyWithUsers] Unexpected error:", error);
    return null;
  }
}

/**
 * Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
 */
function extractNameFromEmail(email: string): string {
  const parts = email.split("@")[0].split(".");
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getPropertyFromSupabase(id: string): Promise<Property | null> {
  if (isDemoMode()) {
    console.warn("[getPropertyFromSupabase] Demo mode: Returning null");
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[getPropertyFromSupabase] Error fetching property:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Map Supabase data back to Property format
    const orientacion = data.orientacion ? (typeof data.orientacion === 'string' ? JSON.parse(data.orientacion) : data.orientacion) : undefined;
    const documentacionMinima = data.documentacion_minima ? (typeof data.documentacion_minima === 'string' ? JSON.parse(data.documentacion_minima) : data.documentacion_minima) : {};
    
    // Load vendedor and inquilino data in parallel for better performance
    let vendedores: PropertyData['vendedores'];
    let inquilino: PropertyData['inquilino'];
    
    const [ownersResult, tenantResult] = await Promise.allSettled([
      getCurrentPropertyOwners(id),
      getCurrentPropertyTenant(id),
    ]);
    
    if (ownersResult.status === 'fulfilled' && ownersResult.value && ownersResult.value.length > 0) {
      vendedores = ownersResult.value.map(owner => ownerRowToVendedorData(owner));
    }
    
    if (tenantResult.status === 'fulfilled' && tenantResult.value) {
      inquilino = tenantRowToInquilinoData(tenantResult.value);
    }
    
    const propertyData: PropertyData = {
        tipoPropiedad: (data.type as PropertyType) || "Piso",
        superficieConstruida: data.superficie_construida ? Number(data.superficie_construida) : undefined,
        superficieUtil: data.superficie_util ? Number(data.superficie_util) : undefined,
        anoConstruccion: data.ano_construccion || undefined,
        referenciaCatastral: data.referencia_catastral || undefined,
        habitaciones: data.habitaciones || undefined,
        banos: data.banos || undefined,
        plazasAparcamiento: data.plazas_aparcamiento || undefined,
        ascensor: data.ascensor ?? undefined,
        balconTerraza: data.balcon_terraza ?? undefined,
        trastero: data.trastero ?? undefined,
        orientacion: orientacion,
        precioVenta: data.precio_venta ? Number(data.precio_venta) : undefined,
        gastosComunidad: data.gastos_comunidad ? Number(data.gastos_comunidad) : undefined,
        confirmacionGastosComunidad: data.confirmacion_gastos_comunidad ?? undefined,
        ibiAnual: data.ibi_anual ? Number(data.ibi_anual) : undefined,
        confirmacionIBI: data.confirmacion_ibi ?? undefined,
        comunidadPropietariosConstituida: data.comunidad_propietarios_constituida ?? undefined,
        edificioSeguroActivo: data.edificio_seguro_activo ?? undefined,
        comercializaExclusiva: data.comercializa_exclusiva ?? undefined,
        edificioITEfavorable: data.edificio_ite_favorable ?? undefined,
        propiedadAlquilada: data.propiedad_alquilada ?? undefined,
        situacionInquilinos: data.situacion_inquilinos as any,
        notaSimpleRegistro: documentacionMinima.notaSimpleRegistro || undefined,
        certificadoEnergetico: documentacionMinima.certificadoEnergetico || undefined,
        vendedores: vendedores,
        inquilino: inquilino,
      };

    // Parse tags and rejection_reasons from JSONB
    const tags = data.tags ? (Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags as string)) : undefined;
    const rejectionReasons = data.rejection_reasons ? (Array.isArray(data.rejection_reasons) ? data.rejection_reasons : JSON.parse(data.rejection_reasons as string)) : undefined;

    return {
      id: data.id,
      fullAddress: data.address || data.name || "",
      address: data.address || data.name || "",
      propertyType: (data.type as PropertyType) || "Piso",
      currentStage: data.status || "draft",
      planta: data.planta,
      puerta: data.puerta,
      bloque: data.bloque,
      escalera: data.escalera,
      timeInStage: "0 días", // Calculate if needed
      createdAt: data.created_at || new Date().toISOString(),
      lastSaved: data.updated_at,
      // Supply Analyst fields
      assignedTo: data.assigned_to || undefined,
      tags: tags,
      correctionsCount: data.corrections_count || undefined,
      totalInvestment: data.total_investment ? Number(data.total_investment) : undefined,
      rejectionReasons: rejectionReasons,
      analystStatus: data.analyst_status || undefined,
      data: propertyData,
    };
  } catch (error: any) {
    console.error("[getPropertyFromSupabase] Unexpected error:", error);
    return null;
  }
}

/**
 * Assign a property to a Supply Analyst
 */
export async function assignPropertyToAnalyst(
  propertyId: string,
  analystId: string
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[assignPropertyToAnalyst] Demo mode: Skipping assignment");
    return;
  }

  const supabase = createClient();

  // First, get current property to check if analyst_status is already set
  const { data: currentProperty } = await supabase
    .from("properties")
    .select("analyst_status")
    .eq("id", propertyId)
    .single();

  const updateData: any = {
    assigned_to: analystId,
    updated_at: new Date().toISOString(),
  };

  // Set analyst_status to 'backlog' if not already set
  if (!currentProperty?.analyst_status) {
    updateData.analyst_status = 'backlog';
  }

  const { error } = await supabase
    .from("properties")
    .update(updateData)
    .eq("id", propertyId);

  if (error) {
    console.error("[assignPropertyToAnalyst] Error assigning property:", error);
    throw new Error(`Error al asignar la propiedad: ${error.message}`);
  }
}

/**
 * Update analyst status for a property
 */
export async function updateAnalystStatus(
  propertyId: string,
  status: string
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updateAnalystStatus] Demo mode: Skipping status update");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      analyst_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    console.error("[updateAnalystStatus] Error updating status:", error);
    throw new Error(`Error al actualizar el estado: ${error.message}`);
  }
}

/**
 * Update property tags
 */
export async function updatePropertyTags(
  propertyId: string,
  tags: string[]
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyTags] Demo mode: Skipping tags update");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      tags: tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    console.error("[updatePropertyTags] Error updating tags:", error);
    throw new Error(`Error al actualizar los tags: ${error.message}`);
  }
}

/**
 * Update property rejection reasons
 */
export async function updatePropertyRejectionReasons(
  propertyId: string,
  reasons: string[]
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyRejectionReasons] Demo mode: Skipping rejection reasons update");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      rejection_reasons: reasons,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    console.error("[updatePropertyRejectionReasons] Error updating rejection reasons:", error);
    throw new Error(`Error al actualizar las razones de rechazo: ${error.message}`);
  }
}

/**
 * Update property total investment
 */
export async function updatePropertyTotalInvestment(
  propertyId: string,
  totalInvestment: number
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyTotalInvestment] Demo mode: Skipping investment update");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      total_investment: totalInvestment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    console.error("[updatePropertyTotalInvestment] Error updating investment:", error);
    throw new Error(`Error al actualizar la inversión total: ${error.message}`);
  }
}

/**
 * Update property corrections count
 */
export async function updatePropertyCorrectionsCount(
  propertyId: string,
  correctionsCount: number
): Promise<void> {
  if (isDemoMode()) {
    console.warn("[updatePropertyCorrectionsCount] Demo mode: Skipping corrections count update");
    return;
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      corrections_count: correctionsCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (error) {
    console.error("[updatePropertyCorrectionsCount] Error updating corrections count:", error);
    throw new Error(`Error al actualizar el contador de correcciones: ${error.message}`);
  }
}
