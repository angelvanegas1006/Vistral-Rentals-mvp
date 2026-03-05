/**
 * DEV Leads Seeding Script
 *
 * Creates 30 development leads (is_dev=true) with the same distribution
 * as the normal seed script (5 per phase in 6 main phases).
 * IDs: DEV-LEAD-001 to DEV-LEAD-030.
 *
 * This script ONLY touches dev data:
 *   - Deletes lead_notifications, lead_events, leads_properties for DEV leads
 *   - Deletes leads where is_dev=true
 *   - Creates new dev leads
 *
 * USAGE:  npm run seed-dev-leads
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

const PHASES = [
  "Interesado Cualificado",
  "Visita Agendada",
  "Recogiendo Información",
  "Calificación en Curso",
  "Interesado Presentado",
  "Interesado Aceptado",
] as const;

// ============================================
// Datos de ejemplo
// ============================================

const random = {
  int: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100,
  bool: () => Math.random() > 0.5,
  choice: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
};

const FIRST_NAMES = [
  "Juan", "María", "Carlos", "Ana", "Luis", "Carmen", "Pedro", "Laura",
  "Miguel", "Sofía", "Pablo", "Elena", "Roberto", "Isabel", "Javier",
  "Patricia", "David", "Raquel", "Daniel", "Cristina", "Alejandro", "Lucía",
  "Antonio", "Marta", "Francisco", "Eva", "Jorge", "Rocío", "Álvaro", "Sara",
];

const LAST_NAMES = [
  "García", "Rodríguez", "González", "Fernández", "López", "Martínez",
  "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández",
  "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez",
];

const AREA_CLUSTERS = [
  "Centro", "Ruzafa", "El Carmen", "Poblats Marítims", "Campanar",
  "Jesús", "Benimaclet", "Patraix", "L'Alcúdia", "Paterna", "Torrent",
];

const MOVE_IN_TIMEFRAMES = ["Inmediato", "1-2 semanas", "1 mes", "1-3 meses", "3-6 meses", "Flexible"];
const LEASE_DURATION_PREFERENCES = ["11 meses", "1 año", "2 años", "Largo plazo", "Corto plazo"];
const EMPLOYMENT_STATUSES = ["Empleado", "Funcionario", "Autónomo", "Pensionista", "Estudiante", "Desempleado", "Ingresos en el exterior"] as const;
const EMPLOYMENT_STATUSES_WITHOUT_JOB: string[] = ["Pensionista", "Estudiante", "Desempleado"];
const JOB_TITLES = ["Ingeniero", "Profesor", "Enfermera", "Comercial", "Diseñador", "Abogado", "Arquitecto", "Administrativo", "Técnico", "Consultor", "Médico", "Funcionario", "Emprendedor", "Contable", "Marketing"];

const INCOME_BY_STATUS: Record<string, { min: number; max: number }> = {
  Estudiante: { min: 0, max: 900 },
  Desempleado: { min: 400, max: 1100 },
  Pensionista: { min: 800, max: 2200 },
  Empleado: { min: 1600, max: 4200 },
  Funcionario: { min: 1600, max: 4200 },
  Autónomo: { min: 1200, max: 4500 },
  "Ingresos en el exterior": { min: 2000, max: 6000 },
};

const GUARANTOR_INCOME_THRESHOLD = 1000;

function generateName(): string {
  return `${random.choice(FIRST_NAMES)} ${random.choice(LAST_NAMES)}`;
}

function generateEmail(name: string): string {
  const base = name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, ".");
  const domains = ["gmail.com", "hotmail.com", "yahoo.es", "outlook.com"];
  return `${base}@${random.choice(domains)}`;
}

function generatePhone(): string {
  return `+34 6${random.int(10000000, 99999999)}`;
}

function generateEmploymentData() {
  const employment_status = random.choice([...EMPLOYMENT_STATUSES]);
  const range = INCOME_BY_STATUS[employment_status] ?? { min: 1200, max: 3500 };
  const monthly_net_income = Math.round(random.float(range.min, range.max) * 100) / 100;
  const hasNoJob = EMPLOYMENT_STATUSES_WITHOUT_JOB.includes(employment_status);
  const job_title = hasNoJob ? null : random.choice(JOB_TITLES);
  const has_guarantor = monthly_net_income < GUARANTOR_INCOME_THRESHOLD;
  return { employment_status, job_title, monthly_net_income, has_guarantor };
}

function formatDevLeadId(sequence: number): string {
  return `DEV-LEAD-${String(sequence).padStart(3, "0")}`;
}

function assignLabel(phase: string, indexInPhase: number): string | null {
  if (phase !== "Interesado Cualificado") return null;
  return indexInPhase < 2 ? "recuperado" : "nuevo";
}

interface LeadInsert {
  leads_unique_id: string;
  current_phase: string;
  name: string;
  phone: string;
  email: string;
  area_cluster: string;
  days_in_phase: number;
  phase_entered_at: string;
  occupant_count: number;
  move_in_timeframe: string;
  lease_duration_preference: string;
  employment_status: string;
  job_title: string | null;
  monthly_net_income: number;
  has_guarantor: boolean;
  raw_qualification_data: Record<string, unknown>;
  label: string | null;
  is_dev: boolean;
}

function buildLead(phase: string, indexInPhase: number, uniqueId: string): LeadInsert {
  const name = generateName();
  const { employment_status, job_title, monthly_net_income, has_guarantor } = generateEmploymentData();
  const daysInPhase = random.int(0, 14);
  const phaseEnteredAt = new Date(Date.now() - daysInPhase * 86400000).toISOString();
  return {
    leads_unique_id: uniqueId,
    current_phase: phase,
    name,
    phone: generatePhone(),
    email: generateEmail(name),
    area_cluster: random.choice(AREA_CLUSTERS),
    days_in_phase: daysInPhase,
    phase_entered_at: phaseEnteredAt,
    occupant_count: random.int(1, 5),
    move_in_timeframe: random.choice(MOVE_IN_TIMEFRAMES),
    lease_duration_preference: random.choice(LEASE_DURATION_PREFERENCES),
    employment_status,
    job_title,
    monthly_net_income,
    has_guarantor,
    raw_qualification_data: {
      source: "seed-dev",
      score: random.float(0.5, 1),
      notes: `DEV lead de prueba ${indexInPhase + 1}`,
      qualified_at: new Date().toISOString(),
    },
    label: assignLabel(phase, indexInPhase),
    is_dev: true,
  };
}

async function main() {
  console.log("🚀 Iniciando seed de DEV leads (30 registros)...\n");

  // 1. Find existing DEV leads to clean up related tables
  const { data: existingDevLeads } = await supabase
    .from("leads")
    .select("leads_unique_id")
    .eq("is_dev", true);

  const devLeadIds = (existingDevLeads ?? []).map((l) => l.leads_unique_id);

  if (devLeadIds.length > 0) {
    console.log(`Encontrados ${devLeadIds.length} DEV leads existentes. Limpiando...`);

    console.log("  Borrando lead_notifications de DEV leads...");
    await supabase.from("lead_notifications").delete().in("leads_unique_id", devLeadIds);

    console.log("  Borrando lead_events de DEV leads...");
    await supabase.from("lead_events").delete().in("leads_unique_id", devLeadIds);

    console.log("  Borrando leads_properties de DEV leads...");
    await supabase.from("leads_properties").delete().in("leads_unique_id", devLeadIds);

    console.log("  Borrando DEV leads...");
    const { error: deleteError } = await supabase.from("leads").delete().eq("is_dev", true);
    if (deleteError) {
      console.error("Error borrando DEV leads:", deleteError.message);
      process.exit(1);
    }
    console.log("✅ DEV leads y registros relacionados borrados.\n");
  } else {
    console.log("No hay DEV leads existentes.\n");
  }

  // 2. Create 30 DEV leads (5 per phase, 6 main phases)
  const leads: LeadInsert[] = [];
  const totalPerPhase = 5;

  let sequence = 1;
  for (let p = 0; p < PHASES.length; p++) {
    const phase = PHASES[p];
    for (let i = 0; i < totalPerPhase; i++) {
      leads.push(buildLead(phase, p * totalPerPhase + i, formatDevLeadId(sequence)));
      sequence += 1;
    }
  }

  const { data, error } = await supabase.from("leads").insert(leads).select("id");

  if (error) {
    console.error("Error insertando DEV leads:", error.message);
    console.error("Detalle:", error);
    process.exit(1);
  }

  console.log(`Insertados ${leads.length} DEV leads en la tabla leads.`);
  console.log("Fases cubiertas:", PHASES.join(", "));
  if (data?.length) {
    console.log("IDs generados:", data.length);
  }

  console.log("\n🎉 Seed de DEV leads completado correctamente.");
}

main();
