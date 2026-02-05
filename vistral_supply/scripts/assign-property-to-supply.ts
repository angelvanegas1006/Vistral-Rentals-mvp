/**
 * Script para asignar una propiedad al usuario supply analyst
 * Ejecutar con: npx tsx scripts/assign-property-to-supply.ts
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

async function assignProperty() {
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

  console.log('🚀 Asignando propiedad al usuario supply analyst...\n');
  console.log(`📍 Propiedad ID: ${PROPERTY_ID}`);
  console.log(`👤 Usuario: ${SUPPLY_USER_EMAIL}\n`);

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
      console.log('💡 Asegúrate de que el usuario existe ejecutando: npm run create-test-users');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado (ID: ${supplyUser.id.substring(0, 8)}...)\n`);

    // Asignar la propiedad
    const { data, error } = await adminClient
      .from('properties')
      .update({
        assigned_to: supplyUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', PROPERTY_ID)
      .select()
      .single();

    if (error) {
      console.error('❌ Error asignando propiedad:', error.message);
      process.exit(1);
    }

    if (!data) {
      console.error('❌ Propiedad no encontrada');
      process.exit(1);
    }

    console.log('✅ Propiedad asignada exitosamente!\n');
    console.log('📋 Detalles:');
    console.log(`   Propiedad ID: ${data.id}`);
    console.log(`   Asignada a: ${SUPPLY_USER_EMAIL}`);
    console.log(`   Analyst Status: ${data.analyst_status || 'null'}`);
    console.log('\n💡 El usuario supply analyst ahora puede ver esta propiedad en su kanban.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

assignProperty()
  .then(() => {
    console.log('\n✅ Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
