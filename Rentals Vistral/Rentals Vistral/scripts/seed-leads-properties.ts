/**
 * Seed script: crea un registro en leads_properties por cada lead
 *
 * 1. Obtiene todos los leads de la tabla leads.
 * 2. Obtiene todas las propiedades en fase "Publicado".
 * 3. Asigna cada lead a una propiedad (round-robin).
 * 4. Inserta en leads_properties: leads_unique_id, properties_unique_id
 *
 * USO:
 *   1. Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   2. Ejecutar: npx tsx scripts/seed-leads-properties.ts
 *   3. Requiere: tabla leads_properties creada (ejecutar SQL/create_leads_properties_table.sql)
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
// Main
// ============================================

async function main() {
  console.log("Iniciando seed de leads_properties...\n");

  // 1. Obtener todos los leads
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("leads_unique_id");

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
    console.log(
      'No hay propiedades en fase "Publicado". Ejecuta primero: npm run seed'
    );
    process.exit(0);
  }

  const publishedIds = properties
    .map((p) => p.property_unique_id)
    .filter((id): id is string => id != null && id !== "");
  console.log(`Leads: ${leads.length}`);
  console.log(`Propiedades Publicado: ${publishedIds.length}\n`);

  if (publishedIds.length === 0) {
    console.log('No hay property_unique_id válidos en propiedades "Publicado".');
    process.exit(0);
  }

  // 3. Borrar registros existentes de estos leads para re-seed idempotente
  const leadIds = leads.map((l) => l.leads_unique_id);
  const { error: deleteError } = await supabase
    .from("leads_properties")
    .delete()
    .in("leads_unique_id", leadIds);

  if (deleteError) {
    console.warn("Advertencia al limpiar registros previos:", deleteError.message);
  }

  // 4. Crear registros round-robin
  const records = leads.map((lead, i) => ({
    leads_unique_id: lead.leads_unique_id,
    properties_unique_id: publishedIds[i % publishedIds.length],
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("leads_properties")
    .insert(records)
    .select("id");

  if (insertError) {
    console.error("Error insertando en leads_properties:", insertError.message);
    process.exit(1);
  }

  console.log(`Insertados ${records.length} registros en leads_properties.`);
  if (inserted?.length) {
    console.log(`IDs generados: ${inserted.length}`);
  }
  console.log("\nSeed de leads_properties completado correctamente.");
}

main();
