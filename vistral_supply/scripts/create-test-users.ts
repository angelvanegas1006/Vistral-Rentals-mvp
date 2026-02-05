/**
 * Script para crear usuarios de prueba
 * 
 * Ejecutar con:
 *   npm run create-test-users
 * 
 * O directamente:
 *   npx tsx scripts/create-test-users.ts
 * 
 * Requiere:
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL en .env.local
 * 
 * Puedes encontrar el service_role_key en:
 *   Supabase Dashboard → Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno desde .env.local manualmente
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
  // Si no existe .env.local, continuar (las variables pueden estar en el entorno)
  console.log('⚠️  No se encontró .env.local, usando variables de entorno del sistema');
}

const TEST_USERS = [
  {
    email: 'partneruser@prophero.com',
    password: 'Partner123!',
    role: 'supply_partner' as const,
  },
  {
    email: 'supplyuser@prophero.com',
    password: 'Supply123!',
    role: 'supply_analyst' as const,
  },
  {
    email: 'renouser@prophero.com',
    password: 'Reno123!',
    role: 'renovator_analyst' as const,
  },
];

async function createTestUsers() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado');
    console.error('Por favor, configura SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local');
    console.error('Puedes encontrarlo en: Supabase Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  console.log('🚀 Creando usuarios de prueba...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // Crear cliente admin con service role key
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const user of TEST_USERS) {
    try {
      console.log(`📝 Procesando: ${user.email} (${user.role})...`);

      // Verificar si el usuario ya existe
      const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
      
      if (listError) {
        console.error(`   ❌ Error listando usuarios:`, listError.message);
        continue;
      }

      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      let userId: string;

      if (existingUser) {
        console.log(`   ⚠️  Usuario ya existe (ID: ${existingUser.id.substring(0, 8)}...)`);
        userId = existingUser.id;
        
        // Actualizar contraseña por si acaso
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
          password: user.password,
        });
        
        if (updateError) {
          console.log(`   ⚠️  No se pudo actualizar contraseña: ${updateError.message}`);
        } else {
          console.log(`   ✅ Contraseña actualizada`);
        }
      } else {
        // Crear usuario en auth.users
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirmar email
        });

        if (authError) {
          console.error(`   ❌ Error creando usuario:`, authError.message);
          continue;
        }

        if (!authData.user) {
          console.error(`   ❌ No se pudo crear el usuario`);
          continue;
        }

        userId = authData.user.id;
        console.log(`   ✅ Usuario creado en auth.users (ID: ${userId.substring(0, 8)}...)`);
      }

      // Verificar si ya tiene rol asignado
      const { data: existingRole, error: roleCheckError } = await adminClient
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`   ❌ Error verificando rol:`, roleCheckError.message);
        continue;
      }

      if (existingRole) {
        // Actualizar rol si es diferente
        if (existingRole.role !== user.role) {
          const { error: updateError } = await adminClient
            .from('user_roles')
            .update({ role: user.role })
            .eq('user_id', userId);

          if (updateError) {
            console.error(`   ❌ Error actualizando rol:`, updateError.message);
          } else {
            console.log(`   ✅ Rol actualizado: ${existingRole.role} → ${user.role}`);
          }
        } else {
          console.log(`   ✅ Rol ya está asignado: ${user.role}`);
        }
      } else {
        // Asignar rol
        const { error: roleError } = await adminClient
          .from('user_roles')
          .insert({
            user_id: userId,
            role: user.role,
          });

        if (roleError) {
          console.error(`   ❌ Error asignando rol:`, roleError.message);
        } else {
          console.log(`   ✅ Rol asignado: ${user.role}`);
        }
      }

      console.log(`   ✅ Usuario ${user.email} listo!\n`);
    } catch (error: any) {
      console.error(`   ❌ Error procesando usuario ${user.email}:`, error.message);
      console.error('');
    }
  }

  console.log('✨ Proceso completado!\n');
  console.log('📋 Resumen de usuarios creados:');
  console.log('   👤 partneruser@prophero.com / Partner123! (supply_partner)');
  console.log('   👤 supplyuser@prophero.com / Supply123! (supply_analyst)');
  console.log('   👤 renouser@prophero.com / Reno123! (renovator_analyst)');
  console.log('\n💡 Puedes iniciar sesión con estos usuarios en la aplicación.');
}

// Ejecutar script
createTestUsers()
  .then(() => {
    console.log('\n✅ Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
