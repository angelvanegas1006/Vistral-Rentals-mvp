/**
 * Script alternativo para crear usuarios de prueba usando la API de admin
 * 
 * Este script requiere que ya tengas un usuario admin autenticado.
 * 
 * Ejecutar con: npx tsx scripts/create-test-users-via-api.ts
 * 
 * NOTA: Este método requiere que estés autenticado como admin.
 * Si no tienes un usuario admin, usa el script principal: npm run create-test-users
 */

const TEST_USERS = [
  {
    email: 'partneruser@prophero.com',
    password: 'Partner123!',
    role: 'supply_partner',
  },
  {
    email: 'supplyuser@prophero.com',
    password: 'Supply123!',
    role: 'supply_analyst',
  },
  {
    email: 'renouser@prophero.com',
    password: 'Reno123!',
    role: 'renovator_analyst',
  },
];

async function createTestUsersViaAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
  
  console.log('🚀 Creando usuarios de prueba vía API...\n');
  console.log(`📍 API URL: ${baseUrl}/api/admin/users\n`);
  console.log('⚠️  NOTA: Este método requiere que estés autenticado como admin.\n');
  console.log('💡 Alternativa: Usa el script principal que no requiere autenticación:');
  console.log('   npm run create-test-users\n');
  console.log('   (Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local)\n');

  for (const user of TEST_USERS) {
    try {
      console.log(`📝 Creando: ${user.email} (${user.role})...`);

      const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          role: user.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`   ❌ Error: ${data.error || 'Error desconocido'}`);
        continue;
      }

      console.log(`   ✅ Usuario creado: ${user.email}`);
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✨ Proceso completado!\n');
  console.log('📋 Usuarios creados:');
  console.log('   👤 partneruser@prophero.com / Partner123! (supply_partner)');
  console.log('   👤 supplyuser@prophero.com / Supply123! (supply_analyst)');
  console.log('   👤 renouser@prophero.com / Reno123! (renovator_analyst)');
}

createTestUsersViaAPI()
  .then(() => {
    console.log('\n✅ Script ejecutado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
