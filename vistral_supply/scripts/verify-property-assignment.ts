/**
 * Script para verificar la asignación de una propiedad
 * Ejecutar con: npx tsx scripts/verify-property-assignment.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️  No se encontró .env.local, usando variables de entorno del sistema');
}

const PROPERTY_ID = 'supply_1768857579495_nixbyu4zd';
const SUPPLY_USER_EMAIL = 'supplyuser@prophero.com';

async function verifyAssignment() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  console.log('🔍 Verificando asignación de propiedad...\n');
  console.log(`📍 Propiedad ID: ${PROPERTY_ID}`);
  console.log(`👤 Usuario esperado: ${SUPPLY_USER_EMAIL}\n`);

  // Crear cliente admin con service role key
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Obtener el ID del usuario supply
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError.message);
      process.exit(1);
    }

    const supplyUser = usersData?.users?.find(u => u.email === SUPPLY_USER_EMAIL);
    
    if (!supplyUser) {
      console.error(`❌ Usuario ${SUPPLY_USER_EMAIL} no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${supplyUser.id}`);
    console.log(`   Email: ${supplyUser.email}\n`);

    // Verificar la propiedad
    const { data: property, error: propError } = await adminClient
      .from('properties')
      .select('id, assigned_to, analyst_status, status, created_at')
      .eq('id', PROPERTY_ID)
      .single();

    if (propError) {
      console.error('❌ Error obteniendo propiedad:', propError.message);
      process.exit(1);
    }

    if (!property) {
      console.error('❌ Propiedad no encontrada');
      process.exit(1);
    }

    console.log('📋 Información de la propiedad:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Assigned To: ${property.assigned_to || 'null'}`);
    console.log(`   Analyst Status: ${property.analyst_status || 'null'}`);
    console.log(`   Status: ${property.status || 'null'}\n`);

    // Verificar si está asignada correctamente
    if (property.assigned_to === supplyUser.id) {
      console.log('✅ ¡ASIGNACIÓN CORRECTA!');
      console.log(`   La propiedad está asignada a ${SUPPLY_USER_EMAIL}`);
    } else if (!property.assigned_to) {
      console.log('⚠️  La propiedad NO está asignada a ningún usuario');
      console.log(`   Assigned To: null`);
    } else {
      // Buscar quién está asignado
      const assignedUser = usersData?.users?.find(u => u.id === property.assigned_to);
      if (assignedUser) {
        console.log('❌ La propiedad está asignada a otro usuario:');
        console.log(`   Email: ${assignedUser.email}`);
        console.log(`   ID: ${assignedUser.id}`);
      } else {
        console.log('❌ La propiedad está asignada a un usuario desconocido:');
        console.log(`   ID: ${property.assigned_to}`);
      }
    }

    console.log('\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAssignment()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
