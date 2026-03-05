# 6. Supabase

## Cliente browser

- **Archivo:** `lib/supabase/client.ts`
- **Uso:** `createBrowserClient` de `@supabase/ssr`, solo en código con `"use client"`.
- **Opciones:** `persistSession`, `autoRefreshToken`, `detectSessionInUrl`; headers `x-client-info` y `x-supabase-project` con nombre de proyecto.

## Cliente servidor

- **Archivo:** `lib/supabase/server.ts`
- **Uso:** `createServerClient` con `cookies()` de `next/headers`; manejo de `getAll`/`setAll` en cookies.

## Tipos

- **Archivo:** `lib/supabase/types.ts` generado desde Supabase (Database, Tables, Enums).
- Tipar siempre los clientes con **`Database`**.

## Variables de entorno

- **Públicas:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Servidor (nunca en cliente):** `SUPABASE_SERVICE_ROLE_KEY`.

## Config centralizada

- **Archivo:** `lib/config/environment.ts` lee env y exporta `config` (environment, supabase.url, supabase.anonKey, etc.) y helpers como `getSupabaseProjectName()`.

## Demo mode

- Si no hay URL/anon key válidos, el cliente puede usar un mock (sin llamadas reales) y auth un usuario mock.
- Detección con función tipo **`isDemoMode()`** en `lib/utils.ts`.

**Reglas detalladas:** Ver `.cursor/rules/03-supabase.mdc`
