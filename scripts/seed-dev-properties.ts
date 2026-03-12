/**
 * DEV Properties Seeding Script
 *
 * Creates 48 development properties (is_dev=true) with the same distribution
 * as the normal seed script (15 Publicado + 33 in other phases).
 * IDs: DEV-PROP-001 to DEV-PROP-048.
 *
 * This script ONLY touches dev data:
 *   - Deletes properties where is_dev=true
 *   - Deletes storage files under DEV-PROP-* prefixes
 *   - Creates new dev properties
 *
 * USAGE:  npm run seed-dev
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
}

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALL_STAGES = [
  'Viviendas Prophero',
  'Listo para Alquilar',
  'Publicado',
  'Inquilino aceptado',
  'Pendiente de trámites',
  'Alquilado',
  'Actualización de Renta (IPC)',
  'Gestión de Renovación',
  'Finalización y Salida',
] as const;

const PUBLISHED_GROUPS = [
  { bedrooms: [1, 2] as const, rentMin: 400, rentMax: 700, city: 'Madrid', districts: ['Usera', 'Villaverde', 'Vallecas', 'Carabanchel', 'Latina'] },
  { bedrooms: [2, 3] as const, rentMin: 800, rentMax: 1200, city: 'Madrid', districts: ['Chamberí', 'Retiro', 'Arganzuela', 'Moncloa-Aravaca'] },
  { bedrooms: [3] as const, rentMin: 1301, rentMax: 2000, city: 'Madrid', districts: ['Salamanca', 'Chamartín', 'Centro'] },
] as const;

const DUMMY_FILES_DIR = path.join(process.cwd(), 'docs', 'dummy_files');
const DUMMY_FILES_DIR_ALT = path.join(process.cwd(), 'dummy_files');

// ============================================
// UTILITY FUNCTIONS
// ============================================

const random = {
  int: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min: number, max: number) => Math.random() * (max - min) + min,
  bool: () => Math.random() > 0.5,
  choice: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  string: (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
};

const CITIES = ['Madrid', 'Valencia', 'Sevilla', 'Málaga'];
const DISTRICTS = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Triana', 'Nervión', 'Chamberí', 'Salamanca', 'Malasaña'];
const PROPERTY_TYPES = ['Project', 'Building', 'Unit', 'WIP'];
const ORIENTATIONS = ['Norte', 'Sur', 'Este', 'Oeste'];
const GARAGE_OPTIONS = ['Plaza 12', 'No tiene', 'Doble', 'Plaza 5', 'Plaza 8', 'Garaje privado'];
const KEYS_LOCATIONS = ['Portería', 'Cajetín', 'Oficina', 'Propietario', 'Caja fuerte'];
const ADMIN_NAMES = ['Admin Fincas SL', 'Gestión Inmobiliaria SA', 'Administración Central', 'Fincas Premium', 'Gestión Vistral'];
const INSURANCE_TYPES = ['Seguro básico', 'Seguro multirriesgo', 'Seguro del inquilino', 'Seguro del propietario', 'Seguro a todo riesgo', 'Otro'];
const REALISTIC_RENTS = [350, 400, 430, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000];
const realisticRent = (min: number, max: number) => {
  const valid = REALISTIC_RENTS.filter((r) => r >= min && r <= max);
  return valid.length > 0 ? random.choice(valid) : Math.round(min / 50) * 50;
};

const RENTAL_TYPES = ['Larga estancia', 'Corta estancia', 'Vacacional'] as const;
const PM_PLANS = ['Premium', 'Basic'] as const;
const PROPERTY_MANAGERS = ['JJ'] as const;
const RENTALS_ANALYSTS = ['Luis Martín', 'Alice Ruggieri'] as const;

const generateName = () => {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura', 'Miguel', 'Sofía'];
  const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín'];
  return `${random.choice(firstNames)} ${random.choice(lastNames)} ${random.choice(lastNames)}`;
};

const generateEmail = (name: string) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com'];
  return `${cleanName}@${random.choice(domains)}`;
};

const generatePhone = () => `6${random.int(10000000, 99999999)}`;
const generateDNI = () => {
  const numbers = random.int(10000000, 99999999);
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  return `${numbers}${letters[numbers % 23]}`;
};
const generateIBAN = () =>
  `ES${random.int(10, 99)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)}`;
const generateAddress = () => {
  const streets = ['Calle', 'Avenida', 'Plaza', 'Paseo', 'Camino'];
  const streetNames = ['Mayor', 'Gran Vía', 'Sol', 'Norte', 'Sur', 'Libertad', 'Independencia', 'España', 'Real', 'Nueva'];
  return `${random.choice(streets)} ${random.choice(streetNames)}, ${random.int(1, 200)}`;
};

// ============================================
// FILE UPLOAD FUNCTIONS
// ============================================

function findDummyFilesDir(): string {
  if (fs.existsSync(DUMMY_FILES_DIR)) return DUMMY_FILES_DIR;
  if (fs.existsSync(DUMMY_FILES_DIR_ALT)) return DUMMY_FILES_DIR_ALT;
  throw new Error(`Dummy files directory not found. Checked: ${DUMMY_FILES_DIR} and ${DUMMY_FILES_DIR_ALT}`);
}

function findFileByPattern(dummyDir: string, pattern: string): string | null {
  const files = fs.readdirSync(dummyDir);
  const patternWords = pattern.toLowerCase().replace(/\.pdf$|\.jpg$|\.jpeg$|\.png$/i, '').split(/[\s\.\-_]+/).filter(w => w.length > 2);
  for (const file of files) {
    const fileWords = file.toLowerCase().replace(/\.pdf$|\.jpg$|\.jpeg$|\.png$/i, '').split(/[\s\.\-_]+/).filter(w => w.length > 2);
    const matches = patternWords.filter(pw => fileWords.some(fw => fw.includes(pw) || pw.includes(fw)));
    if (matches.length >= Math.max(1, Math.floor(patternWords.length * 0.7))) return file;
  }
  return null;
}

function readDummyFile(filename: string): Buffer {
  const dummyDir = findDummyFilesDir();
  let filePath = path.join(dummyDir, filename);
  if (!fs.existsSync(filePath)) {
    const foundFile = findFileByPattern(dummyDir, filename);
    if (foundFile) {
      filePath = path.join(dummyDir, foundFile);
    } else {
      throw new Error(`File not found: ${filePath}`);
    }
  }
  return fs.readFileSync(filePath);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function uploadFile(bucket: string, filePath: string, fileBuffer: Buffer, contentType: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, { contentType, upsert: true });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from(bucket).createSignedUrl(filePath, 315360000);
      if (signedUrlError || !signedUrlData) throw new Error(signedUrlError?.message || 'Failed to create signed URL');
      return signedUrlData.signedUrl;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isRetryable = msg.includes('JSON') || msg.includes('Unexpected') || msg.includes('fetch') || msg.includes('network');
      if (attempt < retries && isRetryable) {
        await sleep(2000 * attempt);
      } else {
        throw new Error(`Failed to upload ${filePath} to ${bucket}: ${err?.message || err}`);
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

async function uploadGallery(propertyId: string): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const fileBuffer = readDummyFile(`Foto-${i}.jpg`);
    const storagePath = `${propertyId}/gallery/foto_${i}_${Date.now()}.jpg`;
    urls.push(await uploadFile('properties-public-docs', storagePath, fileBuffer, 'image/jpeg'));
  }
  return urls;
}

async function uploadRenovationDocs(propertyId: string): Promise<string[]> {
  const fileBuffer = readDummyFile('Documentos Reforma.pdf');
  const storagePath = `${propertyId}/property/technical/renovation/doc_renovation_${Date.now()}.pdf`;
  return [await uploadFile('properties-restricted-docs', storagePath, fileBuffer, 'application/pdf')];
}

function sanitizeStoragePath(p: string): string {
  return p.replace(/[^a-zA-Z0-9_\-/]/g, '_').replace(/_{2,}/g, '_').replace(/\/_/g, '/').replace(/_\//g, '/');
}

async function uploadSingleDoc(propertyId: string, filename: string, folder: string, bucket: 'properties-public-docs' | 'properties-restricted-docs'): Promise<string> {
  const fileBuffer = readDummyFile(filename);
  const baseName = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename);
  const storagePath = sanitizeStoragePath(`${propertyId}/${folder}/${sanitizeStoragePath(baseName)}_${Date.now()}${ext}`);
  const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.jpg' ? 'image/jpeg' : ext === '.html' ? 'text/html' : 'application/octet-stream';
  return await uploadFile(bucket, storagePath, fileBuffer, contentType);
}

async function uploadSupplies(propertyId: string): Promise<Record<string, string>> {
  const fileBuffer = readDummyFile('Suministros.pdf');
  const timestamp = Date.now();
  const supplies = [
    { field: 'doc_contract_electricity', type: 'electricity' },
    { field: 'doc_bill_electricity', type: 'electricity' },
    { field: 'doc_contract_water', type: 'water' },
    { field: 'doc_bill_water', type: 'water' },
    { field: 'doc_contract_gas', type: 'gas' },
    { field: 'doc_bill_gas', type: 'gas' },
  ];
  const result: Record<string, string> = {};
  for (const s of supplies) {
    result[s.field] = await uploadFile('properties-restricted-docs', `${propertyId}/property/supplies/${s.type}/${s.field}_${timestamp}.pdf`, fileBuffer, 'application/pdf');
  }
  return result;
}

// ============================================
// STORAGE CLEANUP (DEV only)
// ============================================

async function listAllFiles(bucket: string, folder: string = ''): Promise<string[]> {
  const allFiles: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw new Error(`Failed to list files in ${bucket}/${folder}: ${error.message}`);
  if (!data) return allFiles;
  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null) {
      allFiles.push(...await listAllFiles(bucket, itemPath));
    } else {
      allFiles.push(itemPath);
    }
  }
  return allFiles;
}

async function cleanDevStorage(): Promise<void> {
  console.log('🗑️  Cleaning DEV storage files...');
  const buckets = ['properties-public-docs', 'properties-restricted-docs'];
  for (const bucket of buckets) {
    try {
      const files = await listAllFiles(bucket);
      const devFiles = files.filter((f) => f.startsWith('DEV-PROP-'));
      if (devFiles.length === 0) {
        console.log(`  📁 ${bucket}: No DEV files to delete`);
        continue;
      }
      console.log(`  📁 ${bucket}: Deleting ${devFiles.length} DEV file(s)...`);
      const { error } = await supabase.storage.from(bucket).remove(devFiles);
      if (error) throw new Error(`Failed to delete DEV files from ${bucket}: ${error.message}`);
      console.log(`  ✅ ${bucket}: Deleted ${devFiles.length} DEV file(s)`);
    } catch (error: any) {
      console.error(`  ⚠️ Error cleaning ${bucket}:`, error.message);
    }
  }
}

// ============================================
// CREATE PROPERTY
// ============================================

type PropertyOverrides = {
  stage?: string;
  bedrooms?: readonly number[];
  rentMin?: number;
  rentMax?: number;
  city?: string;
  districts?: readonly string[];
};

async function createProperty(devIndex: number, overrides?: PropertyOverrides): Promise<void> {
  const propertyUniqueId = `DEV-PROP-${String(devIndex).padStart(3, '0')}`;
  const currentStage = overrides?.stage ?? ALL_STAGES[devIndex % ALL_STAGES.length];
  const clientFullName = generateName();
  const clientEmail = generateEmail(clientFullName);

  const writingDate = new Date(); writingDate.setDate(writingDate.getDate() - random.int(30, 180));
  const renoEndDate = new Date(); renoEndDate.setDate(renoEndDate.getDate() + random.int(0, 60));
  const propertyReadyDate = new Date(); propertyReadyDate.setDate(propertyReadyDate.getDate() + random.int(0, 90));

  const bedrooms = overrides?.bedrooms?.length ? random.choice([...overrides.bedrooms]) : random.int(1, 5);
  const city = overrides?.city ?? random.choice(CITIES);
  const areaCluster = overrides?.districts?.length ? random.choice([...overrides.districts]) : random.choice(DISTRICTS);
  const targetRent = overrides?.rentMin != null && overrides?.rentMax != null
    ? realisticRent(overrides.rentMin, overrides.rentMax) : realisticRent(500, 2000);

  const propertyData: Record<string, any> = {
    id: randomUUID(),
    property_unique_id: propertyUniqueId,
    address: generateAddress(),
    city,
    area_cluster: areaCluster,
    property_asset_type: random.choice(PROPERTY_TYPES),
    square_meters: random.int(40, 200),
    bedrooms,
    bathrooms: random.int(1, 3),
    floor_number: random.int(0, 10),
    construction_year: random.int(1960, 2024),
    orientation: random.choice(ORIENTATIONS),
    garage: random.choice(GARAGE_OPTIONS),
    has_elevator: random.bool(),
    has_terrace: random.bool(),
    keys_location: random.choice(KEYS_LOCATIONS),
    admin_name: random.choice(ADMIN_NAMES),
    community_fees_paid: random.bool(),
    taxes_paid: random.bool(),
    itv_passed: random.bool(),
    home_insurance_type: random.choice(INSURANCE_TYPES),
    client_full_name: clientFullName,
    client_identity_doc_number: generateDNI(),
    client_phone: generatePhone(),
    client_email: clientEmail,
    client_iban: generateIBAN(),
    current_stage: currentStage,
    days_in_stage: random.int(0, 30),
    writing_date: writingDate.toISOString().split('T')[0],
    reno_end_date: renoEndDate.toISOString().split('T')[0],
    property_ready_date: propertyReadyDate.toISOString().split('T')[0],
    days_to_publish_rent: random.int(0, 30),
    target_rent_price: targetRent,
    announcement_price: overrides?.rentMin != null && overrides?.rentMax != null ? targetRent : null,
    rental_type: random.choice([...RENTAL_TYPES]),
    property_management_plan: random.choice([...PM_PLANS]),
    property_manager: random.choice([...PROPERTY_MANAGERS]),
    rentals_analyst: random.choice([...RENTALS_ANALYSTS]),
    expected_yield: random.float(3.0, 8.0).toFixed(2),
    days_in_phase: random.int(0, 90),
    actual_yield: random.float(2.5, 7.5).toFixed(2),
    client_custom_identity_documents: [],
    client_custom_financial_documents: [],
    client_custom_other_documents: [],
    custom_technical_documents: [],
    property_custom_other_documents: [],
    is_dev: true,
  };

  console.log(`\n📦 Creating ${propertyUniqueId} (Stage: ${currentStage})...`);

  try {
    propertyData.pics_urls = await uploadGallery(propertyUniqueId);
    propertyData.doc_renovation_files = await uploadRenovationDocs(propertyUniqueId);
    propertyData.doc_energy_cert = await uploadSingleDoc(propertyUniqueId, 'Cert. Eficiencia Energética.pdf', 'property/technical/energy_certificate', 'properties-restricted-docs');
    propertyData.doc_final_check = await uploadSingleDoc(propertyUniqueId, 'final_check.html', 'property/technical/final_check', 'properties-restricted-docs');
    propertyData.client_bank_certificate_url = await uploadSingleDoc(propertyUniqueId, 'Certificado de titularidad bancaria.pdf', 'client/financial', 'properties-restricted-docs');
    propertyData.doc_purchase_contract = await uploadSingleDoc(propertyUniqueId, 'Contrato Compraventa.pdf', 'property/legal/purchase_contract', 'properties-restricted-docs');
    propertyData.client_identity_doc_url = await uploadSingleDoc(propertyUniqueId, 'DNI del inversor.pdf', 'client/identity', 'properties-restricted-docs');
    propertyData.doc_land_registry_note = await uploadSingleDoc(propertyUniqueId, 'Nota Simple.pdf', 'property/legal/land_registry_note', 'properties-restricted-docs');
    propertyData.home_insurance_policy_url = await uploadSingleDoc(propertyUniqueId, 'Póliza Seguro Hogar.pdf', 'property/insurance', 'properties-restricted-docs');
    Object.assign(propertyData, await uploadSupplies(propertyUniqueId));

    if (currentStage === 'Pendiente de trámites') {
      propertyData.signed_lease_contract_url = await uploadSingleDoc(propertyUniqueId, 'Contrato Compraventa.pdf', 'property/legal/lease_contract', 'properties-restricted-docs');
      const leaseStart = new Date(); leaseStart.setDate(leaseStart.getDate() - random.int(7, 30));
      const leaseEnd = new Date(leaseStart); leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);
      propertyData.contract_signature_date = leaseStart.toISOString().split('T')[0];
      propertyData.lease_start_date = leaseStart.toISOString().split('T')[0];
      propertyData.lease_end_date = leaseEnd.toISOString().split('T')[0];
      propertyData.final_rent_amount = targetRent;
      propertyData.lease_duration = String(random.choice([11, 12]));
      propertyData.lease_duration_unit = 'months';
      propertyData.guarantee_id = `GAR-${random.string(8).toUpperCase()}`;
    }

    const { error } = await supabase.from('properties').upsert([propertyData], { onConflict: 'property_unique_id' });
    if (error) throw new Error(`Failed to insert property: ${error.message}`);

    console.log(`✅ Created ${propertyUniqueId} (Stage: ${currentStage}) - Owner: ${clientFullName}`);
    await sleep(200);
  } catch (error: any) {
    console.error(`❌ Error creating ${propertyUniqueId}:`, error.message);
    throw error;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Starting DEV Properties Seeding Script...\n');

  try {
    // Step 1: Clean DEV storage files
    await cleanDevStorage();

    // Step 2: Delete existing DEV properties from DB
    console.log('\n🧹 Deleting existing DEV properties from database...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('is_dev', true);

    if (deleteError) {
      throw new Error(`Failed to delete DEV properties: ${deleteError.message}`);
    }
    console.log('✅ DEV properties deleted.');

    // Step 3: Create 48 DEV properties (same distribution as normal)
    console.log('\n🏗️  Creating 48 DEV properties...\n');

    let devIndex = 1;

    // 3a. 15 DEV properties in "Publicado" (3 groups of 5)
    console.log('📢 Creating 15 DEV properties in "Publicado" (3 groups)...\n');
    for (const group of PUBLISHED_GROUPS) {
      for (let i = 0; i < 5; i++) {
        await createProperty(devIndex++, {
          stage: 'Publicado',
          bedrooms: group.bedrooms,
          rentMin: group.rentMin,
          rentMax: group.rentMax,
          city: group.city,
          districts: group.districts,
        });
      }
    }

    // 3b. 33 DEV properties in other 8 phases
    const OTHER_STAGES = ALL_STAGES.filter((s) => s !== 'Publicado');
    const distribution = [5, 5, 4, 4, 4, 4, 4, 3]; // 33 total
    let stageIndex = 0;
    console.log('\n📋 Creating 33 DEV properties in other phases...\n');
    for (let i = 0; i < 33; i++) {
      while (distribution[stageIndex] === 0) stageIndex++;
      await createProperty(devIndex++, { stage: OTHER_STAGES[stageIndex] });
      distribution[stageIndex]--;
      if (distribution[stageIndex] === 0) stageIndex++;
    }

    // Step 4: Summary
    console.log('\n📊 Summary:');
    console.log('✅ DEV storage cleaned');
    console.log('✅ DEV properties deleted from DB');
    console.log('✅ Created 48 DEV properties (15 Publicado + 33 in other phases)');
    console.log(`✅ All stages covered: ${ALL_STAGES.join(', ')}`);
    console.log('\n🎉 DEV properties seeding completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
