/**
 * Script para verificar las columnas de la tabla properties en Supabase
 * 
 * Este script consulta la estructura de la tabla properties y verifica
 * si existen los campos específicos solicitados:
 * - rental_type
 * - property_management_plan (o management_plan)
 * - property_manager (o property_manager_id)
 * - rentals_analyst
 * 
 * USAGE:
 *   npm run check-columns
 * 
 * O ejecutar directamente:
 *   npx tsx scripts/check-properties-columns.ts
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

// Campos que queremos verificar
const TARGET_FIELDS = [
  'rental_type',
  'property_management_plan',
  'management_plan',
  'property_manager',
  'property_manager_id',
  'rentals_analyst'
];

// ============================================
// MAIN FUNCTION
// ============================================

async function checkPropertiesColumns() {
  console.log('🔍 Verificando estructura de la tabla properties en Supabase...\n');
  console.log(`📡 Conectando a: ${SUPABASE_URL}\n`);

  try {
    // Query para obtener todas las columnas de la tabla properties
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'properties'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Si el RPC no funciona, intentar con una query directa usando PostgREST
      // Primero intentemos obtener una propiedad para ver qué campos tiene
      console.log('⚠️  No se pudo usar RPC, intentando método alternativo...\n');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

      if (sampleError) {
        throw new Error(`Error al consultar la tabla: ${sampleError.message}`);
      }

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log('📋 Columnas encontradas en la tabla properties:\n');
        console.log(`Total de columnas: ${columns.length}\n`);
        
        // Mostrar todas las columnas
        columns.forEach((col, index) => {
          console.log(`${index + 1}. ${col}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🔎 Verificación de campos específicos:\n');

        // Verificar campos específicos
        const foundFields: string[] = [];
        const missingFields: string[] = [];

        TARGET_FIELDS.forEach(field => {
          if (columns.includes(field)) {
            foundFields.push(field);
            console.log(`✅ ${field} - ENCONTRADO`);
          } else {
            missingFields.push(field);
            console.log(`❌ ${field} - NO ENCONTRADO`);
          }
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Resumen:\n');
        console.log(`✅ Campos encontrados: ${foundFields.length}`);
        if (foundFields.length > 0) {
          foundFields.forEach(f => console.log(`   - ${f}`));
        }
        
        console.log(`\n❌ Campos NO encontrados: ${missingFields.length}`);
        if (missingFields.length > 0) {
          missingFields.forEach(f => console.log(`   - ${f}`));
        }

        // Buscar campos similares
        console.log('\n' + '='.repeat(60));
        console.log('\n🔍 Búsqueda de campos similares:\n');
        
        TARGET_FIELDS.forEach(targetField => {
          if (!columns.includes(targetField)) {
            const similar = columns.filter(col => 
              col.toLowerCase().includes(targetField.toLowerCase().split('_')[0]) ||
              targetField.toLowerCase().split('_')[0].includes(col.toLowerCase())
            );
            if (similar.length > 0) {
              console.log(`Para "${targetField}" se encontraron campos similares:`);
              similar.forEach(s => console.log(`   - ${s}`));
            }
          }
        });

      } else {
        console.log('⚠️  La tabla properties está vacía. No se pueden inferir las columnas desde los datos.');
        console.log('💡 Intenta insertar un registro de prueba o consulta directamente en Supabase SQL Editor:');
        console.log(`
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;
        `);
      }

    } else {
      // Si el RPC funcionó, mostrar los resultados
      console.log('📋 Columnas encontradas en la tabla properties:\n');
      
      if (data && Array.isArray(data)) {
        data.forEach((col: any, index: number) => {
          console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        const columnNames = data.map((col: any) => col.column_name);
        
        console.log('\n' + '='.repeat(60));
        console.log('🔎 Verificación de campos específicos:\n');

        TARGET_FIELDS.forEach(field => {
          if (columnNames.includes(field)) {
            const colInfo = data.find((col: any) => col.column_name === field);
            console.log(`✅ ${field} - ENCONTRADO (${colInfo.data_type}, ${colInfo.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
          } else {
            console.log(`❌ ${field} - NO ENCONTRADO`);
          }
        });
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Alternativa: Ejecuta esta query directamente en Supabase SQL Editor:');
    console.log(`
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN (
    'rental_type',
    'property_management_plan',
    'management_plan',
    'property_manager',
    'property_manager_id',
    'rentals_analyst'
  )
ORDER BY column_name;
    `);
    process.exit(1);
  }
}

// Ejecutar el script
checkPropertiesColumns()
  .then(() => {
    console.log('\n✅ Verificación completada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
