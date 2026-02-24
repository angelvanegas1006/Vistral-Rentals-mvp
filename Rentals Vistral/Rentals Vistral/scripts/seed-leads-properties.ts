/**
 * Seed script: crea registros coherentes en leads_properties
 *
 * Para cada lead, genera 2-4 MTPs cuyo estado más avanzado coincide
 * con la current_phase del lead. Rellena todos los campos de la máquina
 * de estados según el estado de cada MTP.
 *
 * Reglas de negocio:
 * - Leads en "Interesado Aceptado": 1 MTP en interesado_aceptado,
 *   las demás en descartada (interesado aceptado para otra).
 * - Leads en fases >= Calificación en Curso: las MTPs secundarias
 *   van a en_espera (cascada) con su previous_status.
 * - Propiedades asignadas a un lead en "Interesado Aceptado" aparecen
 *   como no_disponible en las MTPs de otros leads.
 *
 * USO:
 *   1. Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   2. Ejecutar: npx tsx scripts/seed-leads-properties.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ============================================
// Cargar .env.local
// ============================================

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        if (!process.env[key.trim()]) process.env[key.trim()] = value;
      }
    }
  });
}

// ============================================
// Configuración
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// Helpers
// ============================================

const random = {
  int: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  bool: () => Math.random() > 0.5,
  choice: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
};

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const EXIT_REASONS_DESCARTADA = [
  "precio",
  "zona",
  "caracteristicas",
  "otro",
];

const VISIT_FEEDBACKS = [
  "Candidato adecuado, buena impresión general.",
  "Perfil correcto. Le gustó la distribución de la vivienda.",
  "Visita positiva, encaja con el perfil buscado por el propietario.",
  "Buen candidato, estable económicamente y con referencias.",
  "Interesado confirmó que cumple con los requisitos.",
];

// ============================================
// Mapeo fase lead -> estado MTP principal
// ============================================

type MtpStatus = string;

interface MtpRecord {
  leads_unique_id: string;
  properties_unique_id: string;
  current_status: MtpStatus;
  previous_status: MtpStatus | null;
  visit_date: string | null;
  visit_feedback: string | null;
  tenant_confirmed_interest: string | null;
  sent_to_finaer_at: string | null;
  finaer_status: string | null;
  finaer_rejection_reason: string | null;
  owner_status: string | null;
  owner_rejection_reason: string | null;
  exit_reason: string | null;
  exit_comments: string | null;
}

/**
 * For a given lead phase, returns the MTP status that should be the most
 * advanced (the one that dictates the lead phase).
 */
function getPrimaryMtpStatusForPhase(phase: string): MtpStatus {
  switch (phase) {
    case "Interesado Cualificado":
      return "interesado_cualificado";
    case "Visita Agendada":
      return random.choice([
        "visita_agendada",
        "pendiente_de_evaluacion",
        "esperando_decision",
      ]);
    case "Recogiendo Información":
      return "recogiendo_informacion";
    case "Calificación en Curso":
      return "calificacion_en_curso";
    case "Interesado Presentado":
      return "interesado_presentado";
    case "Interesado Aceptado":
      return "interesado_aceptado";
    default:
      return "interesado_cualificado";
  }
}

/**
 * Generates the secondary MTP statuses for a lead given its phase.
 * Returns 1-2 secondary statuses.
 */
function getSecondaryMtpStatuses(
  phase: string,
  _primaryStatus: MtpStatus
): { status: MtpStatus; previousStatus: MtpStatus | null }[] {
  const secondaries: { status: MtpStatus; previousStatus: MtpStatus | null }[] = [];

  switch (phase) {
    case "Interesado Cualificado":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      break;

    case "Visita Agendada":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      if (random.bool()) {
        secondaries.push({
          status: "descartada",
          previousStatus: "interesado_cualificado",
        });
      }
      break;

    case "Recogiendo Información":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      if (random.bool()) {
        secondaries.push({ status: "visita_agendada", previousStatus: null });
      }
      break;

    case "Calificación en Curso":
    case "Interesado Presentado":
      // Cascade: secondary MTPs go to en_espera
      secondaries.push({
        status: "en_espera",
        previousStatus: random.choice([
          "interesado_cualificado",
          "visita_agendada",
          "pendiente_de_evaluacion",
        ]),
      });
      if (random.bool()) {
        secondaries.push({
          status: "descartada",
          previousStatus: "interesado_cualificado",
        });
      }
      break;

    case "Interesado Aceptado":
      // All other MTPs go to descartada (lead accepted for the primary property)
      secondaries.push({
        status: "descartada",
        previousStatus: random.choice([
          "en_espera",
          "visita_agendada",
          "interesado_cualificado",
        ]),
      });
      if (random.bool()) {
        secondaries.push({
          status: "descartada",
          previousStatus: "interesado_cualificado",
        });
      }
      break;
  }

  return secondaries;
}

/**
 * Fills the data fields of an MTP record based on its current_status.
 * Fields are populated cumulatively: higher states include data from lower states.
 */
function fillMtpFields(record: MtpRecord): MtpRecord {
  const status = record.current_status;
  const isExit = ["en_espera", "descartada", "no_disponible"].includes(status);
  const effectiveStatus = isExit ? (record.previous_status ?? status) : status;

  const RANK: Record<string, number> = {
    interesado_cualificado: 1,
    visita_agendada: 2,
    pendiente_de_evaluacion: 3,
    esperando_decision: 4,
    recogiendo_informacion: 5,
    calificacion_en_curso: 6,
    interesado_presentado: 7,
    interesado_aceptado: 8,
  };

  const rank = RANK[effectiveStatus] ?? 0;

  // >= visita_agendada: visit_date
  if (rank >= 2) {
    if (effectiveStatus === "visita_agendada" && !isExit) {
      record.visit_date = daysFromNow(random.int(1, 14));
    } else {
      record.visit_date = daysAgo(random.int(3, 30));
    }
  }

  // >= pendiente_de_evaluacion: visit_feedback
  if (rank >= 3) {
    record.visit_feedback = random.choice(VISIT_FEEDBACKS);
  }

  // >= esperando_decision: tenant_confirmed_interest
  if (rank >= 4) {
    record.tenant_confirmed_interest = daysAgo(random.int(1, 15));
  }

  // >= recogiendo_informacion: sent_to_finaer_at
  if (rank >= 5) {
    record.sent_to_finaer_at = daysAgo(random.int(1, 10));
  }

  // >= calificacion_en_curso: finaer_status
  if (rank >= 6) {
    record.finaer_status = rank >= 7 ? "approved" : "pending";
  }

  // >= interesado_presentado: owner_status
  if (rank >= 7) {
    record.owner_status = rank >= 8 ? "approved" : "pending";
  }

  // Exit states: exit_reason + exit_comments
  if (status === "descartada") {
    record.exit_reason = record.previous_status === "en_espera"
      ? "interesado_aceptado_otra"
      : random.choice(EXIT_REASONS_DESCARTADA);
    record.exit_comments = "Descarte generado por seed.";
  } else if (status === "en_espera") {
    record.exit_reason = "pendiente_documentacion";
    record.exit_comments = "En espera por cascada (seed).";
  } else if (status === "no_disponible") {
    record.exit_reason = "propiedad_no_disponible";
    record.exit_comments = "Propiedad alquilada a otro interesado (seed).";
  }

  return record;
}

function createMtpRecord(
  leadId: string,
  propertyId: string,
  status: MtpStatus,
  previousStatus: MtpStatus | null
): MtpRecord {
  const record: MtpRecord = {
    leads_unique_id: leadId,
    properties_unique_id: propertyId,
    current_status: status,
    previous_status: previousStatus,
    visit_date: null,
    visit_feedback: null,
    tenant_confirmed_interest: null,
    sent_to_finaer_at: null,
    finaer_status: null,
    finaer_rejection_reason: null,
    owner_status: null,
    owner_rejection_reason: null,
    exit_reason: null,
    exit_comments: null,
  };
  return fillMtpFields(record);
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("Iniciando seed de leads_properties (coherente con fases)...\n");

  // 1. Obtener todos los leads con su current_phase
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("leads_unique_id, current_phase")
    .order("leads_unique_id");

  if (leadsError) {
    console.error("Error obteniendo leads:", leadsError.message);
    process.exit(1);
  }

  if (!leads || leads.length === 0) {
    console.log("No hay leads en la tabla. Ejecuta primero: npm run seed-leads");
    process.exit(0);
  }

  // 2. Obtener propiedades en fase "Publicado"
  const { data: properties, error: propsError } = await supabase
    .from("properties")
    .select("property_unique_id")
    .eq("current_stage", "Publicado");

  if (propsError) {
    console.error("Error obteniendo propiedades:", propsError.message);
    process.exit(1);
  }

  if (!properties || properties.length === 0) {
    console.log('No hay propiedades en fase "Publicado".');
    process.exit(0);
  }

  const publishedIds = properties
    .map((p) => p.property_unique_id)
    .filter((id): id is string => id != null && id !== "");

  console.log(`Leads: ${leads.length}`);
  console.log(`Propiedades Publicado: ${publishedIds.length}\n`);

  if (publishedIds.length < 3) {
    console.log("Se necesitan al menos 3 propiedades publicadas para el seed.");
    process.exit(0);
  }

  // 3. Borrar registros existentes
  const leadIds = leads.map((l) => l.leads_unique_id);
  const { error: deleteError } = await supabase
    .from("leads_properties")
    .delete()
    .in("leads_unique_id", leadIds);

  if (deleteError) {
    console.warn("Advertencia al limpiar registros previos:", deleteError.message);
  }

  // 4. Generar MTPs coherentes
  let propIdx = 0;
  const nextProperty = (): string => {
    const id = publishedIds[propIdx % publishedIds.length];
    propIdx++;
    return id;
  };

  const allRecords: MtpRecord[] = [];
  // Track which properties are "accepted" (lead in Interesado Aceptado)
  const acceptedPropertyIds = new Set<string>();

  // First pass: generate MTPs for each lead
  for (const lead of leads) {
    const phase = lead.current_phase ?? "Interesado Cualificado";
    const leadId = lead.leads_unique_id;

    const primaryStatus = getPrimaryMtpStatusForPhase(phase);
    const primaryPropertyId = nextProperty();

    // Primary MTP
    allRecords.push(
      createMtpRecord(leadId, primaryPropertyId, primaryStatus, null)
    );

    if (phase === "Interesado Aceptado") {
      acceptedPropertyIds.add(primaryPropertyId);
    }

    // Secondary MTPs
    const secondaries = getSecondaryMtpStatuses(phase, primaryStatus);
    for (const sec of secondaries) {
      const secPropertyId = nextProperty();
      allRecords.push(
        createMtpRecord(leadId, secPropertyId, sec.status, sec.previousStatus)
      );
    }
  }

  // Second pass: for properties that are "accepted", mark them as no_disponible
  // in OTHER leads' MTPs (if any other lead has an MTP for the same property)
  // Since we use round-robin, collisions are possible; handle them
  for (const record of allRecords) {
    if (
      acceptedPropertyIds.has(record.properties_unique_id) &&
      record.current_status !== "interesado_aceptado"
    ) {
      const previousStatus = record.current_status === "no_disponible"
        ? record.previous_status
        : record.current_status;
      record.previous_status = previousStatus;
      record.current_status = "no_disponible";
      record.exit_reason = "propiedad_no_disponible";
      record.exit_comments = "Propiedad alquilada a otro interesado (seed).";
    }
  }

  // 5. Insert
  const { data: inserted, error: insertError } = await supabase
    .from("leads_properties")
    .insert(allRecords)
    .select("id");

  if (insertError) {
    console.error("Error insertando en leads_properties:", insertError.message);
    console.error("Detalle:", insertError);
    process.exit(1);
  }

  // 6. Summary
  const statusCounts: Record<string, number> = {};
  for (const r of allRecords) {
    statusCounts[r.current_status] = (statusCounts[r.current_status] ?? 0) + 1;
  }

  console.log(`Insertados ${allRecords.length} registros en leads_properties.`);
  console.log("\nDistribución de estados:");
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    console.log(`  ${status}: ${count}`);
  }
  if (inserted?.length) {
    console.log(`\nIDs generados: ${inserted.length}`);
  }
  console.log("\nSeed de leads_properties completado correctamente.");
}

main();
