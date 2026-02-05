/**
 * Final Massive Seeding Script
 * 
 * This script:
 * 1. Cleans storage buckets (empties properties-public-docs and properties-restricted-docs)
 * 2. Cleans the database (truncates properties table)
 * 3. Creates 23 distinct properties with mock data
 * 4. Uploads accompanying files from ./dummy_files/ to Supabase Storage
 * 5. Ensures all Kanban stages are covered
 * 
 * USAGE:
 *   1. Ensure environment variables are set:
 *      - NEXT_PUBLIC_SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY
 *   2. Ensure dummy files exist in docs/dummy_files/ or ./dummy_files/
 *   3. Run: npm run seed
 * 
 * PREREQUISITES:
 *   - Dummy files must be present (Foto-1.jpg through Foto-6.jpg, PDFs, etc.)
 *   - Supabase buckets must exist: properties-public-docs, properties-restricted-docs
 *   - Database table: properties
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================

// Load .env.local file if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
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

// Kanban stages (as specified by user)
const ALL_STAGES = [
  // Kanban 1: Captación y Cierre
  'Viviendas Prophero',
  'Listo para Alquilar',
  'Publicado',
  'Inquilino aceptado',
  'Pendiente de trámites',
  // Kanban 2: Gestión De Cartera
  'Alquilado',
  'Actualización de Renta (IPC)',
  'Gestión de Renovación',
  'Finalización y Salida'
] as const;

// File mappings
const DUMMY_FILES_DIR = path.join(process.cwd(), 'docs', 'dummy_files');
const DUMMY_FILES_DIR_ALT = path.join(process.cwd(), 'dummy_files');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Simple random data generators (since faker is not installed)
 */
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

// Mock data arrays
const CITIES = ['Madrid', 'Valencia', 'Sevilla', 'Málaga'];
const DISTRICTS = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Triana', 'Nervión', 'Chamberí', 'Salamanca', 'Malasaña'];
const PROPERTY_TYPES = ['Project', 'Building', 'Unit', 'WIP'];
const ORIENTATIONS = ['Norte', 'Sur', 'Este', 'Oeste'];
const GARAGE_OPTIONS = ['Plaza 12', 'No tiene', 'Doble', 'Plaza 5', 'Plaza 8', 'Garaje privado'];
const KEYS_LOCATIONS = ['Portería', 'Cajetín', 'Oficina', 'Propietario', 'Caja fuerte'];
const ADMIN_NAMES = ['Admin Fincas SL', 'Gestión Inmobiliaria SA', 'Administración Central', 'Fincas Premium', 'Gestión Vistral'];
const INSURANCE_TYPES = [
  'Seguro básico',
  'Seguro multirriesgo',
  'Seguro del inquilino',
  'Seguro del propietario',
  'Seguro a todo riesgo',
  'Otro'
];

// Generate mock names and data
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

const generatePhone = () => {
  return `6${random.int(10000000, 99999999)}`;
};

const generateDNI = () => {
  const numbers = random.int(10000000, 99999999);
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const letter = letters[numbers % 23];
  return `${numbers}${letter}`;
};

const generateIBAN = () => {
  return `ES${random.int(10, 99)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)} ${random.int(1000, 9999)}`;
};

const generateAddress = () => {
  const streets = ['Calle', 'Avenida', 'Plaza', 'Paseo', 'Camino'];
  const streetNames = ['Mayor', 'Gran Vía', 'Sol', 'Norte', 'Sur', 'Libertad', 'Independencia', 'España', 'Real', 'Nueva'];
  return `${random.choice(streets)} ${random.choice(streetNames)}, ${random.int(1, 200)}`;
};

// ============================================
// FILE UPLOAD FUNCTIONS
// ============================================

/**
 * Find dummy files directory (check both locations)
 */
function findDummyFilesDir(): string {
  if (fs.existsSync(DUMMY_FILES_DIR)) {
    return DUMMY_FILES_DIR;
  }
  if (fs.existsSync(DUMMY_FILES_DIR_ALT)) {
    return DUMMY_FILES_DIR_ALT;
  }
  throw new Error(`Dummy files directory not found. Checked: ${DUMMY_FILES_DIR} and ${DUMMY_FILES_DIR_ALT}`);
}

/**
 * Find file by pattern (handles encoding issues)
 */
function findFileByPattern(dummyDir: string, pattern: string): string | null {
  const files = fs.readdirSync(dummyDir);
  // Extract key words from pattern (e.g., "Cert. Eficiencia Energética.pdf" -> ["cert", "eficiencia", "energetica"])
  const patternWords = pattern.toLowerCase()
    .replace(/\.pdf$|\.jpg$|\.jpeg$|\.png$/i, '')
    .split(/[\s\.\-_]+/)
    .filter(w => w.length > 2);
  
  for (const file of files) {
    const fileWords = file.toLowerCase()
      .replace(/\.pdf$|\.jpg$|\.jpeg$|\.png$/i, '')
      .split(/[\s\.\-_]+/)
      .filter(w => w.length > 2);
    
    // Check if all key words from pattern are present in file
    const matches = patternWords.filter(pw => 
      fileWords.some(fw => fw.includes(pw) || pw.includes(fw))
    );
    
    // If most key words match, consider it a match
    if (matches.length >= Math.max(1, Math.floor(patternWords.length * 0.7))) {
      return file;
    }
  }
  return null;
}

/**
 * Read file from dummy files directory
 */
function readDummyFile(filename: string): Buffer {
  const dummyDir = findDummyFilesDir();
  let filePath = path.join(dummyDir, filename);
  
  // If file doesn't exist, try to find it by pattern matching
  if (!fs.existsSync(filePath)) {
    const foundFile = findFileByPattern(dummyDir, filename);
    if (foundFile) {
      filePath = path.join(dummyDir, foundFile);
      console.log(`  ℹ️  Found file by pattern: ${foundFile} (looking for ${filename})`);
    } else {
      throw new Error(`File not found: ${filePath}`);
    }
  }
  
  return fs.readFileSync(filePath);
}

/**
 * Upload file to Supabase Storage
 */
async function uploadFile(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${filePath} to ${bucket}: ${error.message}`);
  }

  // Use signed URLs for both public and private buckets
  // This ensures reliable access regardless of bucket configuration or storage policies
  // Using 10-year expiration (315360000 seconds) for long-term access
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 315360000); // 10 years in seconds
  
  if (signedUrlError || !signedUrlData) {
    throw new Error(`Failed to create signed URL for ${filePath} in ${bucket}: ${signedUrlError?.message || 'Unknown error'}`);
  }
  
  return signedUrlData.signedUrl;
}

/**
 * Upload gallery images (Foto-1.jpg to Foto-6.jpg)
 */
async function uploadGallery(propertyId: string): Promise<string[]> {
  const galleryUrls: string[] = [];
  
  for (let i = 1; i <= 6; i++) {
    const filename = `Foto-${i}.jpg`;
    const fileBuffer = readDummyFile(filename);
    const timestamp = Date.now();
    const storagePath = `${propertyId}/gallery/foto_${i}_${timestamp}.jpg`;
    
    const url = await uploadFile('properties-public-docs', storagePath, fileBuffer, 'image/jpeg');
    galleryUrls.push(url);
  }
  
  return galleryUrls;
}

/**
 * Upload renovation documents
 */
async function uploadRenovationDocs(propertyId: string): Promise<string[]> {
  const fileBuffer = readDummyFile('Documentos Reforma.pdf');
  const timestamp = Date.now();
  const storagePath = `${propertyId}/property/technical/renovation/doc_renovation_${timestamp}.pdf`;
  
  const path = await uploadFile('properties-restricted-docs', storagePath, fileBuffer, 'application/pdf');
  return [path];
}

/**
 * Sanitize storage path for Supabase (remove invalid characters)
 */
function sanitizeStoragePath(path: string): string {
  // Replace spaces, periods, and other invalid characters with underscores
  // Keep only alphanumeric, hyphens, underscores, and forward slashes
  return path
    .replace(/[^a-zA-Z0-9_\-/]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/\/_/g, '/') // Remove underscores after slashes
    .replace(/_\//g, '/'); // Remove underscores before slashes
}

/**
 * Upload single document
 */
async function uploadSingleDoc(
  propertyId: string,
  filename: string,
  folder: string,
  bucket: 'properties-public-docs' | 'properties-restricted-docs'
): Promise<string> {
  const fileBuffer = readDummyFile(filename);
  const timestamp = Date.now();
  const baseName = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename);
  // Sanitize the base name to remove invalid characters
  const sanitizedBaseName = sanitizeStoragePath(baseName);
  const storagePath = sanitizeStoragePath(`${propertyId}/${folder}/${sanitizedBaseName}_${timestamp}${ext}`);
  
  const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream';
  
  return await uploadFile(bucket, storagePath, fileBuffer, contentType);
}

/**
 * Upload supplies documents (6 files from Suministros.pdf)
 * Note: doc_contract_other and doc_bill_other are deprecated and skipped
 */
async function uploadSupplies(propertyId: string): Promise<{
  doc_contract_electricity: string;
  doc_bill_electricity: string;
  doc_contract_water: string;
  doc_bill_water: string;
  doc_contract_gas: string;
  doc_bill_gas: string;
}> {
  const fileBuffer = readDummyFile('Suministros.pdf');
  const timestamp = Date.now();
  
  const supplies = [
    { field: 'doc_contract_electricity', type: 'electricity', suffix: 'contract' },
    { field: 'doc_bill_electricity', type: 'electricity', suffix: 'bill' },
    { field: 'doc_contract_water', type: 'water', suffix: 'contract' },
    { field: 'doc_bill_water', type: 'water', suffix: 'bill' },
    { field: 'doc_contract_gas', type: 'gas', suffix: 'contract' },
    { field: 'doc_bill_gas', type: 'gas', suffix: 'bill' },
    // Note: doc_contract_other and doc_bill_other are deprecated - skipped
  ];
  
  const result: Record<string, string> = {};
  
  for (const supply of supplies) {
    const storagePath = `${propertyId}/property/supplies/${supply.type}/${supply.field}_${timestamp}.pdf`;
    const path = await uploadFile('properties-restricted-docs', storagePath, fileBuffer, 'application/pdf');
    result[supply.field] = path;
  }
  
  return result as any;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Recursively list all files in a storage bucket
 */
async function listAllFiles(bucket: string, folder: string = ''): Promise<string[]> {
  const allFiles: string[] = [];
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (error) {
    throw new Error(`Failed to list files in ${bucket}/${folder}: ${error.message}`);
  }
  
  if (!data) {
    return allFiles;
  }
  
  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    
    if (item.id === null) {
      // This is a folder, recurse into it
      const nestedFiles = await listAllFiles(bucket, itemPath);
      allFiles.push(...nestedFiles);
    } else {
      // This is a file
      allFiles.push(itemPath);
    }
  }
  
  return allFiles;
}

/**
 * Clean storage buckets (delete all files)
 */
async function cleanStorage(): Promise<void> {
  console.log('🗑️  Cleaning storage buckets...');
  
  const buckets = ['properties-public-docs', 'properties-restricted-docs'];
  
  for (const bucket of buckets) {
    try {
      // List all files recursively
      const files = await listAllFiles(bucket);
      
      if (files.length === 0) {
        console.log(`  📁 ${bucket}: No files to delete`);
        continue;
      }
      
      console.log(`  📁 ${bucket}: Found ${files.length} file(s) to delete`);
      
      // Delete all files (Supabase remove can handle arrays)
      const { error } = await supabase.storage
        .from(bucket)
        .remove(files);
      
      if (error) {
        throw new Error(`Failed to delete files from ${bucket}: ${error.message}`);
      }
      
      console.log(`  ✅ ${bucket}: Deleted ${files.length} file(s)`);
      
    } catch (error: any) {
      throw new Error(`Failed to clean bucket ${bucket}: ${error.message}`);
    }
  }
  
  console.log('🗑️  Storage buckets emptied.');
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Clean database (truncate tables)
 */
async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning database...');
  
  // Delete all properties
  const { error: propsError } = await supabase
    .from('properties')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (propsError) {
    throw new Error(`Failed to truncate properties table: ${propsError.message}`);
  }
  
  console.log('✅ Database cleaned successfully');
}

/**
 * Create a single property with all files
 */
async function createProperty(index: number): Promise<void> {
  const propertyUniqueId = `PROP-${String(index + 1).padStart(3, '0')}`;
  const systemId = randomUUID();
  
  // Distribute stages evenly across 23 properties using round-robin
  const currentStage = ALL_STAGES[index % ALL_STAGES.length];
  
  // Generate owner data
  const clientFullName = generateName();
  const clientEmail = generateEmail(clientFullName);
  
  // Generate dates for timeline fields
  const writingDate = new Date();
  writingDate.setDate(writingDate.getDate() - random.int(30, 180)); // 30-180 days ago
  
  const renoEndDate = new Date();
  renoEndDate.setDate(renoEndDate.getDate() + random.int(0, 60)); // 0-60 days from now
  
  const propertyReadyDate = new Date();
  propertyReadyDate.setDate(propertyReadyDate.getDate() + random.int(0, 90)); // 0-90 days from now

  // Generate property data (using Record to allow dynamic assignment)
  const propertyData: Record<string, any> = {
    id: systemId,
    property_unique_id: propertyUniqueId,
    address: generateAddress(),
    city: random.choice(CITIES),
    area_cluster: random.choice(DISTRICTS),
    property_asset_type: random.choice(PROPERTY_TYPES),
    square_meters: random.int(40, 200),
    bedrooms: random.int(1, 5),
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
    writing_date: writingDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    reno_end_date: renoEndDate.toISOString().split('T')[0],
    property_ready_date: propertyReadyDate.toISOString().split('T')[0],
    days_to_publish_rent: random.int(0, 30),
    target_rent_price: random.int(500, 2000),
    expected_yield: random.float(3.0, 8.0).toFixed(2),
    days_in_phase: random.int(0, 90),
    actual_yield: random.float(2.5, 7.5).toFixed(2),
    
    // Deprecated fields - removed (columns don't exist in database anymore)
    // doc_contract_other: null,  // Column removed
    // doc_bill_other: null,      // Column removed
    // custom_investor_documents: null,  // Column removed
    
    // New JSONB fields - initialize as empty arrays
    client_custom_identity_documents: [],
    client_custom_financial_documents: [],
    client_custom_other_documents: [],
    custom_technical_documents: [],
    property_custom_other_documents: [],
  };
  
  console.log(`\n📦 Creating ${propertyUniqueId} (Stage: ${currentStage})...`);
  
  // Upload all files
  console.log(`  📤 Uploading files for ${propertyUniqueId}...`);
  
  try {
    // Gallery (public)
    const picsUrls = await uploadGallery(propertyUniqueId);
    propertyData.pics_urls = picsUrls;
    
    // Renovation docs
    const docRenovationFiles = await uploadRenovationDocs(propertyUniqueId);
    propertyData.doc_renovation_files = docRenovationFiles;
    
    // Single documents
    propertyData.doc_energy_cert = await uploadSingleDoc(
      propertyUniqueId,
      'Cert. Eficiencia Energética.pdf',
      'property/technical/energy_certificate',
      'properties-restricted-docs'
    );
    
    propertyData.client_bank_certificate_url = await uploadSingleDoc(
      propertyUniqueId,
      'Certificado de titularidad bancaria.pdf',
      'client/financial',
      'properties-restricted-docs'
    );
    
    propertyData.doc_purchase_contract = await uploadSingleDoc(
      propertyUniqueId,
      'Contrato Compraventa.pdf',
      'property/legal/purchase_contract',
      'properties-restricted-docs'
    );
    
    propertyData.client_identity_doc_url = await uploadSingleDoc(
      propertyUniqueId,
      'DNI del inversor.pdf',
      'client/identity',
      'properties-restricted-docs'
    );
    
    propertyData.doc_land_registry_note = await uploadSingleDoc(
      propertyUniqueId,
      'Nota Simple.pdf',
      'property/legal/land_registry_note',
      'properties-restricted-docs'
    );
    
    propertyData.home_insurance_policy_url = await uploadSingleDoc(
      propertyUniqueId,
      'Póliza Seguro Hogar.pdf',
      'property/insurance',
      'properties-restricted-docs'
    );
    
    // Supplies (8 files)
    const supplies = await uploadSupplies(propertyUniqueId);
    Object.assign(propertyData, supplies);
    
    // Insert into database
    const { error } = await supabase
      .from('properties')
      .insert([propertyData]);
    
    if (error) {
      throw new Error(`Failed to insert property: ${error.message}`);
    }
    
    console.log(`✅ Created ${propertyUniqueId} (Stage: ${currentStage}) - Owner: ${clientFullName} - Files Uploaded.`);
    
  } catch (error: any) {
    console.error(`❌ Error creating ${propertyUniqueId}:`, error.message);
    throw error;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Starting Final Massive Seeding Script...\n');
  
  try {
    // Step 1: Clean storage buckets
    await cleanStorage();
    
    // Step 2: Clean database
    await cleanDatabase();
    
    // Step 3: Create 23 properties
    console.log('\n🏗️  Creating 23 properties...\n');
    
    for (let i = 0; i < 23; i++) {
      await createProperty(i);
    }
    
    // Step 4: Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Storage buckets cleaned`);
    console.log(`✅ Database cleaned`);
    console.log(`✅ Created 23 properties`);
    console.log(`✅ All stages covered: ${ALL_STAGES.join(', ')}`);
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
