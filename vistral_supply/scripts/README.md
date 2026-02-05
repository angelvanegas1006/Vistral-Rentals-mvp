# Scripts de Utilidad

## Crear Usuarios de Prueba

Este script crea usuarios de prueba para evaluar los diferentes roles en la aplicación.

### Opción 1: Usar el script TypeScript (Recomendado)

**Requisitos:**
- Tener `SUPABASE_SERVICE_ROLE_KEY` configurado en `.env.local`
- Tener `NEXT_PUBLIC_SUPABASE_URL` configurado en `.env.local`

**Ejecutar:**
```bash
npm run create-test-users
```

O directamente:
```bash
npx tsx scripts/create-test-users.ts
```

**Usuarios creados:**
- **partneruser@prophero.com** / `Partner123!` → `supply_partner`
- **supplyuser@prophero.com** / `Supply123!` → `supply_analyst`
- **renouser@prophero.com** / `Reno123!` → `renovator_analyst`

### Opción 2: Crear usuarios manualmente + SQL

1. **Crear usuarios en Supabase Dashboard:**
   - Ve a: Supabase Dashboard → Authentication → Users → Add user
   - Crea los tres usuarios con los emails mencionados arriba
   - Establece contraseñas temporales (puedes cambiarlas después)

2. **Asignar roles ejecutando la migración SQL:**
   - Ve a: Supabase Dashboard → SQL Editor
   - Ejecuta el archivo: `supabase/migrations/022_create_test_users.sql`

### Opción 3: Usar la API de Admin (si tienes acceso)

Si ya tienes un usuario admin, puedes usar la página de administración:
- Ve a: `/admin/users`
- Crea los usuarios desde la interfaz

### Notas

- El script verifica si los usuarios ya existen antes de crearlos
- Si un usuario ya existe, actualiza su contraseña y rol si es necesario
- El script es idempotente: puedes ejecutarlo múltiples veces sin problemas
