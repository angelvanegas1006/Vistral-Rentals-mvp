/**
 * DEV Leads-Properties (MTPs) Seeding Script
 *
 * Creates leads_properties records linking DEV leads to DEV properties.
 * Uses only is_dev=true leads and is_dev=true "Publicado" properties.
 *
 * This script ONLY touches dev data:
 *   - Deletes leads_properties for DEV leads
 *   - Creates new MTPs linking dev leads to dev properties
 *
 * USAGE:  npm run seed-dev-leads-properties
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
  throw new Error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// Helpers
// ============================================

const random = {
  int: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  bool: () => Math.random() > 0.5,
  choice: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
};

function daysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString();
}

const EXIT_REASONS_DESCARTADA = ["precio", "zona", "caracteristicas", "otro"];
const VISIT_FEEDBACKS = [
  "Candidato adecuado, buena impresión general.",
  "Perfil correcto. Le gustó la distribución de la vivienda.",
  "Visita positiva, encaja con el perfil buscado por el propietario.",
  "Buen candidato, estable económicamente y con referencias.",
  "Interesado confirmó que cumple con los requisitos.",
];

// ============================================
// MTP logic (same as seed-leads-properties.ts)
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

function getPrimaryMtpStatusForPhase(phase: string): MtpStatus {
  switch (phase) {
    case "Interesado Cualificado": return "interesado_cualificado";
    case "Visita Agendada": return random.choice(["visita_agendada", "pendiente_de_evaluacion", "esperando_decision"]);
    case "Recogiendo Información": return "recogiendo_informacion";
    case "Calificación en Curso": return "calificacion_en_curso";
    case "Interesado Presentado": return "interesado_presentado";
    case "Interesado Aceptado": return "interesado_aceptado";
    case "Interesado Perdido": return "interesado_perdido";
    case "Interesado Rechazado": return "interesado_rechazado";
    default: return "interesado_cualificado";
  }
}

function getSecondaryMtpStatuses(phase: string, _primaryStatus: MtpStatus): { status: MtpStatus; previousStatus: MtpStatus | null }[] {
  const secondaries: { status: MtpStatus; previousStatus: MtpStatus | null }[] = [];
  switch (phase) {
    case "Interesado Cualificado":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      break;
    case "Visita Agendada":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      if (random.bool()) secondaries.push({ status: "descartada", previousStatus: "interesado_cualificado" });
      break;
    case "Recogiendo Información":
      secondaries.push({ status: "interesado_cualificado", previousStatus: null });
      if (random.bool()) secondaries.push({ status: "visita_agendada", previousStatus: null });
      break;
    case "Calificación en Curso":
    case "Interesado Presentado":
      secondaries.push({ status: "en_espera", previousStatus: random.choice(["interesado_cualificado", "visita_agendada", "pendiente_de_evaluacion"]) });
      if (random.bool()) secondaries.push({ status: "descartada", previousStatus: "interesado_cualificado" });
      break;
    case "Interesado Aceptado":
      secondaries.push({ status: "descartada", previousStatus: random.choice(["en_espera", "visita_agendada", "interesado_cualificado"]) });
      if (random.bool()) secondaries.push({ status: "descartada", previousStatus: "interesado_cualificado" });
      break;
    case "Interesado Perdido":
    case "Interesado Rechazado":
      secondaries.push({ status: "descartada", previousStatus: random.choice(["interesado_cualificado", "visita_agendada"]) });
      break;
  }
  return secondaries;
}

function fillMtpFields(record: MtpRecord): MtpRecord {
  const status = record.current_status;
  const isExit = ["en_espera", "descartada", "no_disponible", "interesado_perdido", "interesado_rechazado"].includes(status);
  const effectiveStatus = isExit ? (record.previous_status ?? status) : status;

  const RANK: Record<string, number> = {
    interesado_cualificado: 1, visita_agendada: 2, pendiente_de_evaluacion: 3,
    esperando_decision: 4, recogiendo_informacion: 5, calificacion_en_curso: 6,
    interesado_presentado: 7, interesado_aceptado: 8,
  };
  const rank = RANK[effectiveStatus] ?? 0;

  if (rank >= 2) {
    record.visit_date = (effectiveStatus === "visita_agendada" && !isExit) ? daysFromNow(random.int(1, 14)) : daysAgo(random.int(3, 30));
  }
  if (rank >= 3) record.visit_feedback = random.choice(VISIT_FEEDBACKS);
  if (rank >= 4) record.tenant_confirmed_interest = daysAgo(random.int(1, 15));
  if (rank >= 5) record.sent_to_finaer_at = daysAgo(random.int(1, 10));
  if (rank >= 6) record.finaer_status = rank >= 7 ? "approved" : "pending";
  if (rank >= 7) record.owner_status = rank >= 8 ? "approved" : "pending";

  if (status === "descartada") {
    record.exit_reason = record.previous_status === "en_espera" ? "interesado_aceptado_otra" : random.choice(EXIT_REASONS_DESCARTADA);
    record.exit_comments = "Descarte generado por seed (DEV).";
  } else if (status === "en_espera") {
    record.exit_reason = "pendiente_documentacion";
    record.exit_comments = "En espera por cascada (DEV seed).";
  } else if (status === "no_disponible") {
    record.exit_reason = "propiedad_no_disponible";
    record.exit_comments = "Propiedad alquilada a otro interesado (DEV seed).";
  } else if (status === "interesado_perdido") {
    record.exit_reason = random.choice(["no_contactable", "no_interesado", "encontro_otra_vivienda"]);
    record.exit_comments = "Lead perdido (DEV seed).";
  } else if (status === "interesado_rechazado") {
    record.exit_reason = random.choice(["rechazado_finaer", "rechazado_propietario", "documentacion_insuficiente"]);
    record.exit_comments = "Lead rechazado (DEV seed).";
  }

  return record;
}

function createMtpRecord(leadId: string, propertyId: string, status: MtpStatus, previousStatus: MtpStatus | null): MtpRecord {
  const record: MtpRecord = {
    leads_unique_id: leadId,
    properties_unique_id: propertyId,
    current_status: status,
    previous_status: previousStatus,
    visit_date: null, visit_feedback: null, tenant_confirmed_interest: null,
    sent_to_finaer_at: null, finaer_status: null, finaer_rejection_reason: null,
    owner_status: null, owner_rejection_reason: null, exit_reason: null, exit_comments: null,
  };
  return fillMtpFields(record);
}

function generateMtpsForLeads(
  leads: { leads_unique_id: string; current_phase: string | null }[],
  propertyIds: string[]
): MtpRecord[] {
  const acceptedLeads = leads.filter((l) => l.current_phase === "Interesado Aceptado");
  const otherLeads = leads.filter((l) => l.current_phase !== "Interesado Aceptado");

  const acceptedPropertyIds = new Set<string>();
  const primaryRecords = new Set<MtpRecord>();
  const allRecords: MtpRecord[] = [];

  let propIdx = 0;
  const nextProperty = (): string => {
    const id = propertyIds[propIdx % propertyIds.length];
    propIdx++;
    return id;
  };
  const nextPropertyExcluding = (excluded: Set<string>): string => {
    for (let i = 0; i < propertyIds.length; i++) {
      const id = nextProperty();
      if (!excluded.has(id)) return id;
    }
    return nextProperty();
  };

  for (const lead of acceptedLeads) {
    const leadId = lead.leads_unique_id;
    const primaryPropertyId = nextProperty();
    acceptedPropertyIds.add(primaryPropertyId);
    const primary = createMtpRecord(leadId, primaryPropertyId, "interesado_aceptado", null);
    primaryRecords.add(primary);
    allRecords.push(primary);
    for (const sec of getSecondaryMtpStatuses("Interesado Aceptado", "interesado_aceptado")) {
      allRecords.push(createMtpRecord(leadId, nextProperty(), sec.status, sec.previousStatus));
    }
  }

  for (const lead of otherLeads) {
    const phase = lead.current_phase ?? "Interesado Cualificado";
    const leadId = lead.leads_unique_id;
    const primaryStatus = getPrimaryMtpStatusForPhase(phase);
    const primaryPropertyId = nextPropertyExcluding(acceptedPropertyIds);
    const primary = createMtpRecord(leadId, primaryPropertyId, primaryStatus, null);
    primaryRecords.add(primary);
    allRecords.push(primary);
    for (const sec of getSecondaryMtpStatuses(phase, primaryStatus)) {
      allRecords.push(createMtpRecord(leadId, nextProperty(), sec.status, sec.previousStatus));
    }
  }

  for (const record of allRecords) {
    if (primaryRecords.has(record)) continue;
    if (acceptedPropertyIds.has(record.properties_unique_id) && record.current_status !== "interesado_aceptado") {
      const previousStatus = record.current_status === "no_disponible" ? record.previous_status : record.current_status;
      record.previous_status = previousStatus;
      record.current_status = "no_disponible";
      record.exit_reason = "propiedad_no_disponible";
      record.exit_comments = "Propiedad alquilada a otro interesado (DEV seed).";
    }
  }

  return allRecords;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("🚀 Iniciando seed de DEV leads_properties...\n");

  // 1. Get DEV leads
  const { data: devLeads, error: leadsError } = await supabase
    .from("leads")
    .select("leads_unique_id, current_phase")
    .eq("is_dev", true)
    .order("leads_unique_id");

  if (leadsError) {
    console.error("Error obteniendo DEV leads:", leadsError.message);
    process.exit(1);
  }

  if (!devLeads || devLeads.length === 0) {
    console.log("No hay DEV leads. Ejecuta primero: npm run seed-dev-leads");
    process.exit(0);
  }

  // 2. Get DEV properties in "Publicado"
  const { data: devProps, error: propsError } = await supabase
    .from("properties")
    .select("property_unique_id")
    .eq("current_stage", "Publicado")
    .eq("is_dev", true);

  if (propsError) {
    console.error("Error obteniendo DEV propiedades:", propsError.message);
    process.exit(1);
  }

  const devPublishedIds = (devProps ?? [])
    .map((p) => p.property_unique_id)
    .filter((id): id is string => id != null && id !== "");

  console.log(`DEV Leads: ${devLeads.length}`);
  console.log(`DEV Propiedades Publicado: ${devPublishedIds.length}\n`);

  if (devPublishedIds.length < 3) {
    console.log("Se necesitan al menos 3 propiedades DEV publicadas. Ejecuta primero: npm run seed-dev");
    process.exit(0);
  }

  // 3. Delete existing DEV leads_properties
  const devLeadIds = devLeads.map((l) => l.leads_unique_id);

  console.log("Borrando lead_events de DEV leads...");
  await supabase.from("lead_events").delete().in("leads_unique_id", devLeadIds);

  console.log("Borrando leads_properties de DEV leads...");
  await supabase.from("leads_properties").delete().in("leads_unique_id", devLeadIds);

  // 4. Generate MTPs
  console.log("\nGenerando MTPs para DEV leads...");
  const allRecords = generateMtpsForLeads(devLeads, devPublishedIds);

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

  // 6. Verification pass
  const EXIT_STATUSES = new Set(["en_espera", "descartada", "no_disponible", "interesado_perdido", "interesado_rechazado"]);
  const TERMINAL_PHASES = new Set(["Interesado Perdido", "Interesado Rechazado"]);

  const mtpsByLead = new Map<string, MtpRecord[]>();
  for (const r of allRecords) {
    const list = mtpsByLead.get(r.leads_unique_id) ?? [];
    list.push(r);
    mtpsByLead.set(r.leads_unique_id, list);
  }

  const leadPhaseMap = new Map(devLeads.map((l) => [l.leads_unique_id, l.current_phase]));
  const leadsToCorrect: string[] = [];
  for (const [leadId, mtps] of mtpsByLead) {
    const phase = leadPhaseMap.get(leadId) ?? "";
    if (TERMINAL_PHASES.has(phase)) continue;
    const hasActive = mtps.some((m) => !EXIT_STATUSES.has(m.current_status));
    if (!hasActive) leadsToCorrect.push(leadId);
  }

  if (leadsToCorrect.length > 0) {
    console.log(`\nCorrigiendo ${leadsToCorrect.length} DEV leads sin MTPs activas → "Interesado Cualificado":`);
    console.log(`  ${leadsToCorrect.join(", ")}`);
    await supabase.from("leads").update({ current_phase: "Interesado Cualificado" }).in("leads_unique_id", leadsToCorrect);
  }

  // 7. Summary
  const statusCounts: Record<string, number> = {};
  for (const r of allRecords) {
    statusCounts[r.current_status] = (statusCounts[r.current_status] ?? 0) + 1;
  }

  console.log(`\nInsertados ${allRecords.length} registros DEV en leads_properties.`);
  console.log("\nDistribución de estados:");
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    console.log(`  ${status}: ${count}`);
  }
  if (inserted?.length) {
    console.log(`\nIDs generados: ${inserted.length}`);
  }
  console.log("\n🎉 Seed de DEV leads_properties completado correctamente.");
}

main();
