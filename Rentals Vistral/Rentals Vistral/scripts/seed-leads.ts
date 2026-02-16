/**
 * Seed script: 30 registros en la tabla leads de Supabase
 *
 * 1. Borra todos los registros existentes en la tabla leads.
 * 2. Inserta 30 leads repartidos en las 6 fases del pipe/kanban:
 * - Perfil cualificado
 * - Visita agendada
 * - Recogiendo Información
 * - Calificación en curso
 * - Inquilino presentado
 * - Inquilino aceptado
 *
 * USO:
 *   1. Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   2. Ejecutar: npx tsx scripts/seed-leads.ts
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

// Fases del kanban de leads (títulos tal como se guardan en current_phase)
const PHASES = [
  "Perfil cualificado",
  "Visita agendada",
  "Recogiendo Información",
  "Calificación en curso",
  "Inquilino presentado",
  "Inquilino aceptado",
] as const;

// ============================================
// Datos de ejemplo
// ============================================

const random = {
  int: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min: number, max: number) =>
    Math.round((Math.random() * (max - min) + min) * 100) / 100,
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

const MOVE_IN_TIMEFRAMES = [
  "Inmediato",
  "1-2 semanas",
  "1 mes",
  "1-3 meses",
  "3-6 meses",
  "Flexible",
];

const LEASE_DURATION_PREFERENCES = [
  "11 meses",
  "1 año",
  "2 años",
  "Largo plazo",
  "Corto plazo",
];

// Valores del enum employment_status en DB
const EMPLOYMENT_STATUSES = [
  "Empleado",
  "Funcionario",
  "Autónomo",
  "Pensionista",
  "Estudiante",
  "Desempleado",
  "Ingresos en el exterior",
] as const;

// Estados que no tienen trabajo remunerado → no tienen job_title
const EMPLOYMENT_STATUSES_WITHOUT_JOB: string[] = [
  "Pensionista",
  "Estudiante",
  "Desempleado",
];

const JOB_TITLES = [
  "Ingeniero", "Profesor", "Enfermera", "Comercial", "Diseñador",
  "Abogado", "Arquitecto", "Administrativo", "Técnico", "Consultor",
  "Médico", "Funcionario", "Emprendedor", "Contable", "Marketing",
];

// Rango de ingresos netos mensuales (€) coherente con cada employment_status
const INCOME_BY_STATUS: Record<string, { min: number; max: number }> = {
  Estudiante: { min: 0, max: 900 },
  Desempleado: { min: 400, max: 1100 },
  Pensionista: { min: 800, max: 2200 },
  Empleado: { min: 1600, max: 4200 },
  Funcionario: { min: 1600, max: 4200 },
  Autónomo: { min: 1200, max: 4500 },
  "Ingresos en el exterior": { min: 2000, max: 6000 },
};

const GUARANTOR_INCOME_THRESHOLD = 1000; // has_guarantor = true solo si ingreso < 1000€

function generateName(): string {
  return `${random.choice(FIRST_NAMES)} ${random.choice(LAST_NAMES)}`;
}

function generateEmail(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, ".");
  const domains = ["gmail.com", "hotmail.com", "yahoo.es", "outlook.com"];
  return `${base}@${random.choice(domains)}`;
}

function generatePhone(): string {
  return `+34 6${random.int(10000000, 99999999)}`;
}

/** Genera employment_status, monthly_net_income, job_title y has_guarantor coherentes entre sí. */
function generateEmploymentData(): {
  employment_status: string;
  job_title: string | null;
  monthly_net_income: number;
  has_guarantor: boolean;
} {
  const employment_status = random.choice([...EMPLOYMENT_STATUSES]);
  const range = INCOME_BY_STATUS[employment_status] ?? { min: 1200, max: 3500 };
  const monthly_net_income = Math.round(random.float(range.min, range.max) * 100) / 100;
  const hasNoJob = EMPLOYMENT_STATUSES_WITHOUT_JOB.includes(employment_status);
  const job_title = hasNoJob ? null : random.choice(JOB_TITLES);
  const has_guarantor = monthly_net_income < GUARANTOR_INCOME_THRESHOLD;
  return { employment_status, job_title, monthly_net_income, has_guarantor };
}

// ============================================
// Generar 30 leads repartidos en las 6 fases
// ============================================

/** Formato tipo PROP-023: prefijo + número de 3 dígitos (LEAD-001, LEAD-002, ...) */
function formatLeadUniqueId(sequence: number): string {
  return `LEAD-${String(sequence).padStart(3, "0")}`;
}

interface LeadInsert {
  leads_unique_id: string;
  current_phase: string;
  name: string;
  phone: string;
  email: string;
  area_cluster: string;
  days_in_phase: number;
  occupant_count: number;
  move_in_timeframe: string;
  lease_duration_preference: string;
  employment_status: string;
  job_title: string | null;
  monthly_net_income: number;
  has_guarantor: boolean;
  raw_qualification_data: Record<string, unknown>;
}

function buildLead(phase: string, indexInPhase: number, uniqueId: string): LeadInsert {
  const name = generateName();
  const { employment_status, job_title, monthly_net_income, has_guarantor } =
    generateEmploymentData();
  return {
    leads_unique_id: uniqueId,
    current_phase: phase,
    name,
    phone: generatePhone(),
    email: generateEmail(name),
    area_cluster: random.choice(AREA_CLUSTERS),
    days_in_phase: random.int(0, 14),
    occupant_count: random.int(1, 5),
    move_in_timeframe: random.choice(MOVE_IN_TIMEFRAMES),
    lease_duration_preference: random.choice(LEASE_DURATION_PREFERENCES),
    employment_status,
    job_title,
    monthly_net_income,
    has_guarantor,
    raw_qualification_data: {
      source: "seed",
      score: random.float(0.5, 1),
      notes: `Lead de prueba ${indexInPhase + 1}`,
      qualified_at: new Date().toISOString(),
    },
  };
}

async function main() {
  console.log("Iniciando seed de leads (30 registros)...\n");

  // 1. Borrar todos los leads existentes
  console.log("Borrando registros existentes en la tabla leads...");
  const { error: deleteError } = await supabase
    .from("leads")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    console.error("Error borrando leads:", deleteError.message);
    process.exit(1);
  }
  console.log("Leads existentes borrados.\n");

  // 2. Generar e insertar los 30 nuevos leads
  const leads: LeadInsert[] = [];
  const totalPerPhase = 5; // 30 / 6 = 5 por fase

  let sequence = 1;
  for (let p = 0; p < PHASES.length; p++) {
    const phase = PHASES[p];
    for (let i = 0; i < totalPerPhase; i++) {
      leads.push(buildLead(phase, p * totalPerPhase + i, formatLeadUniqueId(sequence)));
      sequence += 1;
    }
  }

  const { data, error } = await supabase.from("leads").insert(leads).select("id");

  if (error) {
    console.error("Error insertando leads:", error.message);
    console.error("Detalle:", error);
    process.exit(1);
  }

  console.log("Insertados 30 leads en la tabla leads.");
  console.log("Fases cubiertas:", PHASES.join(", "));
  if (data?.length) {
    console.log("IDs generados:", data.length);
  }
  console.log("\nSeed de leads completado correctamente.");
}

main();
