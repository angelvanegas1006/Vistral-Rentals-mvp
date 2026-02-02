/**
 * Script para actualizar los campos de gestión de alquileres en la tabla properties
 * 
 * Este script asigna valores aleatorios a los siguientes campos enum:
 * - rental_type: ' Larga estancia ', ' Corta estancia', ' Vacacional '
 * - property_management_plan: ' Premium', ' Basic'
 * - property_manager: 'JJ' (único valor por ahora)
 * - rentals_analyst: 'Luis Martín', 'Alice Ruggieri'
 * 
 * USAGE:
 *   npm run update-rental-fields
 * 
 * O ejecutar directamente:
 *   npx tsx scripts/update-rental-fields.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

// Valores permitidos para los enums (sin espacios al inicio/final como están en Supabase)
const RENTAL_TYPES = ['Larga estancia', 'Corta estancia', 'Vacacional'] as const;
const MANAGEMENT_PLANS = ['Premium', 'Basic'] as const;
const PROPERTY_MANAGER = 'JJ'; // Único valor por ahora
const RENTALS_ANALYSTS = ['Luis Martín', 'Alice Ruggieri'] as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Selecciona un valor aleatorio de un array
 */
function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// MAIN FUNCTION
// ============================================

async function updateRentalFields() {
  console.log('🔄 Actualizando campos de gestión de alquileres...\n');
  console.log(`📡 Conectando a: ${SUPABASE_URL}\n`);

  try {
    // 1. Obtener todas las propiedades
    console.log('📋 Obteniendo todas las propiedades...');
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, property_unique_id, address');

    if (fetchError) {
      throw new Error(`Error al obtener propiedades: ${fetchError.message}`);
    }

    if (!properties || properties.length === 0) {
      console.log('⚠️  No se encontraron propiedades en la base de datos.');
      return;
    }

    console.log(`✅ Se encontraron ${properties.length} propiedades\n`);

    // 2. Actualizar cada propiedad con valores aleatorios
    console.log('🔄 Actualizando propiedades...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        // Generar valores aleatorios para cada campo
        const rentalType = randomChoice(RENTAL_TYPES);
        const managementPlan = randomChoice(MANAGEMENT_PLANS);
        const analyst = randomChoice(RENTALS_ANALYSTS);

        // Actualizar la propiedad
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            rental_type: rentalType,
            property_management_plan: managementPlan,
            property_manager: PROPERTY_MANAGER,
            rentals_analyst: analyst,
          })
          .eq('id', property.id);

        if (updateError) {
          console.error(`❌ Error actualizando ${property.property_unique_id || property.id}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ ${property.property_unique_id || property.id} - Tipo: ${rentalType.trim()}, Plan: ${managementPlan.trim()}, Analista: ${analyst}`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error procesando ${property.property_unique_id || property.id}: ${error.message}`);
        errorCount++;
      }
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 Resumen de actualización:\n');
    console.log(`✅ Propiedades actualizadas exitosamente: ${successCount}`);
    console.log(`❌ Propiedades con errores: ${errorCount}`);
    console.log(`📦 Total procesadas: ${properties.length}`);

    // 4. Verificar los valores asignados
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Verificando valores asignados...\n');

    const { data: verification, error: verifyError } = await supabase
      .from('properties')
      .select('rental_type, property_management_plan, property_manager, rentals_analyst')
      .limit(5);

    if (!verifyError && verification) {
      console.log('Muestra de valores asignados (primeras 5 propiedades):\n');
      verification.forEach((prop, index) => {
        console.log(`${index + 1}. Tipo: ${prop.rental_type || 'NULL'}`);
        console.log(`   Plan: ${prop.property_management_plan || 'NULL'}`);
        console.log(`   Manager: ${prop.property_manager || 'NULL'}`);
        console.log(`   Analista: ${prop.rentals_analyst || 'NULL'}\n`);
      });
    }

    // Estadísticas de distribución
    console.log('='.repeat(60));
    console.log('📈 Estadísticas de distribución:\n');

    const { data: stats, error: statsError } = await supabase
      .from('properties')
      .select('rental_type, property_management_plan, rentals_analyst');

    if (!statsError && stats) {
      // Contar por tipo de alquiler
      const rentalTypeCounts: Record<string, number> = {};
      const planCounts: Record<string, number> = {};
      const analystCounts: Record<string, number> = {};

      stats.forEach(prop => {
        rentalTypeCounts[prop.rental_type || 'NULL'] = (rentalTypeCounts[prop.rental_type || 'NULL'] || 0) + 1;
        planCounts[prop.property_management_plan || 'NULL'] = (planCounts[prop.property_management_plan || 'NULL'] || 0) + 1;
        analystCounts[prop.rentals_analyst || 'NULL'] = (analystCounts[prop.rentals_analyst || 'NULL'] || 0) + 1;
      });

      console.log('Tipo de alquiler:');
      Object.entries(rentalTypeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nPlan de gestión:');
      Object.entries(planCounts).forEach(([plan, count]) => {
        console.log(`  ${plan}: ${count}`);
      });

      console.log('\nAnalista:');
      Object.entries(analystCounts).forEach(([analyst, count]) => {
        console.log(`  ${analyst}: ${count}`);
      });
    }

    console.log('\n✅ Actualización completada exitosamente!');

  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar el script
updateRentalFields()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
