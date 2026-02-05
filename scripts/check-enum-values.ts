/**
 * Script para verificar los valores exactos de los enums en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkEnumValues() {
  console.log('🔍 Verificando valores de enums...\n');

  // Obtener una propiedad para ver los valores actuales
  const { data, error } = await supabase
    .from('properties')
    .select('rental_type, property_management_plan, property_manager, rentals_analyst')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Valores encontrados en propiedades existentes:\n');
  
  const rentalTypes = new Set<string>();
  const plans = new Set<string>();
  const managers = new Set<string>();
  const analysts = new Set<string>();

  data?.forEach(prop => {
    if (prop.rental_type) rentalTypes.add(prop.rental_type);
    if (prop.property_management_plan) plans.add(prop.property_management_plan);
    if (prop.property_manager) managers.add(prop.property_manager);
    if (prop.rentals_analyst) analysts.add(prop.rentals_analyst);
  });

  console.log('Rental Types encontrados:');
  rentalTypes.forEach(v => console.log(`  "${v}" (length: ${v.length})`));
  
  console.log('\nManagement Plans encontrados:');
  plans.forEach(v => console.log(`  "${v}" (length: ${v.length})`));
  
  console.log('\nManagers encontrados:');
  managers.forEach(v => console.log(`  "${v}"`));
  
  console.log('\nAnalysts encontrados:');
  analysts.forEach(v => console.log(`  "${v}"`));
}

checkEnumValues();
