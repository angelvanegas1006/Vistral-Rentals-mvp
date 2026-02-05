# Vistral Lab – Guía de proyecto y configuración en Cursor

## Objetivo

Este documento define los **patrones de diseño**, **design system**, **conexiones** (Supabase, Vercel, Git) y **configuraciones de proyecto** que debe seguir todo el equipo. 

**IMPORTANTE:** Este documento es para **humanos**. Las reglas para Cursor están en `.cursor/rules/*.mdc` (ver sección "Sistema de Reglas Modulares" abajo).

---

## Sistema de Reglas Modulares

Las reglas de Cursor están divididas en archivos modulares en `.cursor/rules/` para mejor performance y mantenibilidad:

- **`00-core.mdc`** - Reglas base (stack, estructura, seguridad básica, workflow)
- **`01-security.mdc`** - Guardrails de seguridad y protección de credenciales
- **`02-design-system.mdc`** - Design system (Prophero, tokens, componentes)
- **`03-supabase.mdc`** - Clientes Supabase, tipos, migraciones
- **`04-auth-permissions.mdc`** - Autenticación, roles, permisos
- **`05-forms-ui.mdc`** - Formularios (react-hook-form + Zod) y patrones UI
- **`06-api-routes.mdc`** - Rutas API, seguridad, respuestas
- **`07-domain-boundaries.mdc`** - Límites de dominio y aislamiento

Ver `.cursor/rules/README.md` para más detalles sobre el sistema de reglas.

---

## 1. Stack y dependencias base

- **Framework:** Next.js 16+ (App Router)
- **Lenguaje:** TypeScript (strict)
- **UI:** React 19, Radix UI, Tailwind CSS 4
- **Backend / DB:** Supabase (auth, DB, storage, RLS)
- **Formularios:** react-hook-form + @hookform/resolvers + Zod
- **Estilos:** class-variance-authority (cva), clsx, tailwind-merge
- **Deploy:** Vercel (recomendado)

**Dependencias clave en `package.json`:**
- `@supabase/ssr`, `@supabase/supabase-js`
- `next`, `react`, `react-dom`
- `@radix-ui/*` (dialog, dropdown-menu, label, select, etc.)
- `tailwindcss`, `@tailwindcss/postcss`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `lucide-react`, `date-fns`, `sonner` (toasts)

---

## 2. Estructura de carpetas

```
app/           # App Router: pages, layouts, api
  api/         # Route handlers (admin, google-maps, etc.)
  login/, admin/, supply/, reno/  # Rutas por dominio
components/    # UI reutilizable
  ui/          # Primitivos (Button, Input, Form, Dialog, etc.)
  auth/, supply/, checklist/, icons/  # Por feature
hooks/         # Custom hooks (usePropertyData, useSupabaseAuth, etc.)
lib/           # Lógica y config
  auth/        # Contextos de auth (Supabase + App)
  config/      # environment.ts
  supabase/    # client.ts, server.ts, types.ts
  i18n/        # Traducciones y contexto
  supply-*-supabase.ts  # Servicios por dominio
supabase/
  migrations/  # SQL en orden 001_, 002_, ...
public/        # Assets, logos, iconos
scripts/       # Scripts de utilidad (tsx)
.cursor/
  rules/       # Reglas modulares de Cursor (*.mdc)
```

- **Rutas:** bajo `app/` por dominio (supply, admin, login, etc.).
- **Componentes:** `components/ui/` para primitivos; subcarpetas por feature.
- **Servicios y tipos:** `lib/`; Supabase tipado en `lib/supabase/types.ts`.
- **Migraciones:** solo en `supabase/migrations/`, numeradas y ordenadas.

---

## 3. Design system (Prophero + Tailwind)

- **Storybook (referencia de componentes):** [Prophero React Design System](https://react.design.prophero.com/) — ej. [Alert](https://react.design.prophero.com/?path=/docs/components-alert--docs). Consultar ahí variantes, props y ejemplos de todos los componentes.
- **Tokens:** Definidos en `app/prophero.css` (colores, tipografía, espaciado, radius, sombras, z-index, breakpoints).
- **Variables CSS:** Prefijo `--prophero-*` (ej. `--prophero-blue-500`, `--prophero-radius-lg`, `--prophero-margin-md`).
- **Grid responsivo:** Breakpoints XS–XXL con márgenes y gutters en `lib/constants.ts` (`BREAKPOINTS`, `SPACING`) y en `prophero.css` (`--prophero-margin-*`, `--prophero-gutter-*`).
- **Uso:** Clases `container-margin` y `gutter`; constantes desde `@/lib/constants`; variables CSS para valores concretos.
- **Tema:** `globals.css` importa Tailwind y `prophero.css`; `@theme inline` mapea variables a Tailwind (--color-background, --font-sans, etc.).
- **Componentes UI:** Usar siempre `cn()` de `@/lib/utils` y, para variantes, **CVA** (class-variance-authority) como en `Button` y `Badge`.

**Reglas detalladas:** Ver `.cursor/rules/02-design-system.mdc`

---

## 4. Patrones de componentes (UI)

- **Clases:** `cn(...)` para combinar clases (clsx + tailwind-merge). Nunca concatenar strings a mano.
- **Variantes:** CVA con `variant` y `size`; exportar `componentVariants` y usarlas con `cn(componentVariants({ variant, size, className }))`.
- **Refs:** Componentes que envuelven elementos nativos usan `forwardRef` y pasan `ref` al DOM.
- **Accesibilidad:** Radix para teclado, focus y ARIA; no reinventar modales, selects o dropdowns.
- **Formularios:** Siempre que haya formulario: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` de `@/components/ui/form` + react-hook-form + Zod para validación.

**Reglas detalladas:** Ver `.cursor/rules/05-forms-ui.mdc`

---

## 5. Supabase

- **Cliente browser:** `lib/supabase/client.ts` — `createBrowserClient` de `@supabase/ssr`, solo en código con `"use client"`. Opciones: `persistSession`, `autoRefreshToken`, `detectSessionInUrl`; headers `x-client-info` y `x-supabase-project` con nombre de proyecto.
- **Cliente servidor:** `lib/supabase/server.ts` — `createServerClient` con `cookies()` de `next/headers`; manejo de `getAll`/`setAll` en cookies.
- **Tipos:** `lib/supabase/types.ts` generado desde Supabase (Database, Tables, Enums). Tipar siempre los clientes con `Database`.
- **Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. En servidor, si hace falta: `SUPABASE_SERVICE_ROLE_KEY` (nunca exponer en cliente).
- **Config centralizada:** `lib/config/environment.ts` lee env y exporta `config` (environment, supabase.url, supabase.anonKey, etc.) y helpers como `getSupabaseProjectName()`.
- **Demo mode:** Si no hay URL/anon key válidos, el cliente puede usar un mock (sin llamadas reales) y auth un usuario mock; la detección con función tipo `isDemoMode()` en `lib/utils.ts`.

**Reglas detalladas:** Ver `.cursor/rules/03-supabase.mdc`

---

## 6. Autenticación y permisos

- **Capas:** Supabase Auth → contexto de sesión (`SupabaseAuthProvider`) → capa de app con roles (`AppAuthProvider`) que lee `user_roles` y expone `user`, `role`, `hasRole`, `hasAnyRole`, `isAdmin`, etc.
- **Roles:** Definidos en DB y en `Database['public']['Enums']['app_role']` (ej. supply_partner, supply_analyst, supply_admin). No hardcodear roles en strings; usar el tipo `AppRole`.
- **Permisos:** Lógica centralizada en `lib/auth/permissions.ts` (ej. `canViewProperty`, `canEditProperty`) usando `AppRole` y datos del recurso. Usar estas funciones en páginas y componentes, no duplicar la lógica.
- **Layout raíz:** En `app/layout.tsx` envolver con ThemeProvider → I18nProvider → SupabaseAuthProvider → AppAuthProvider; Toaster global.

**Reglas detalladas:** Ver `.cursor/rules/04-auth-permissions.mdc`

---

## 7. Formularios y validación

- **Control:** react-hook-form con `FormProvider` (Form de `@/components/ui/form`).
- **Validación:** esquemas Zod y `@hookform/resolvers/zod` en `resolver`.
- **Campos:** `FormField` + `Controller` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`; componentes UI existentes (Input, Select, etc.) dentro de `FormControl`.
- **Estado y envío:** `handleSubmit`, `formState.errors`, `watch`; para datos async o complejos, hooks dedicados (ej. usePropertyData, useFormState) que llamen a servicios en `lib/`.

**Reglas detalladas:** Ver `.cursor/rules/05-forms-ui.mdc`

---

## 8. Hooks y datos

- **Supabase:** Crear hooks que usen `createClient()` de `lib/supabase/client` o (en Server Components) el cliente de servidor; no instanciar Supabase fuera de `lib/supabase`.
- **Patrón de datos:** Un hook por "recurso" o pantalla (ej. usePropertyData) que encapsule loading, error, fetch y mutaciones; opcionalmente soporte demo/localStorage si aplica.
- **Params:** En Next 16+, `useParams()` puede devolver Promise; usar `use(paramsPromise)` cuando sea necesario.
- **Servicios:** Lógica de negocio y llamadas a Supabase en `lib/*-supabase.ts` o `lib/*-storage.ts`; los hooks solo orquestan y exponen estado.

---

## 9. API Routes (Next.js)

- **Ubicación:** `app/api/` por dominio (ej. `app/api/admin/users/route.ts`, `app/api/google-maps/autocomplete/route.ts`).
- **Seguridad:** Verificar sesión o rol cuando haya datos sensibles; usar cliente de servidor o service role si hace falta.
- **Respuestas:** Respuesta JSON consistente; códigos HTTP correctos (401, 403, 404, 500).
- **Env:** Leer desde `process.env` o desde `lib/config/environment`; no exponer service role ni secrets al cliente.

**Reglas detalladas:** Ver `.cursor/rules/06-api-routes.mdc`

---

## 10. Configuración de proyecto

**TypeScript (`tsconfig.json`):**
- `strict: true`, `paths: { "@/*": ["./*"] }`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`.
- `include`: `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`.
- `exclude`: `node_modules`, docs, scripts de test si aplica.

**Next.js (`next.config.ts`):**
- `images`: formats avif/webp; `remotePatterns` para Supabase, Google, Prophero, etc.
- `typescript.ignoreBuildErrors: false`.
- Alias `@` con `path.resolve(__dirname)`; extensiones `['.tsx', '.ts', '.jsx', '.js', '.json']`.
- En webpack, `resolve.fallback.canvas: false` en cliente si no se usa.

**Variables de entorno (ejemplo `.env.local.example`):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENV=development|staging|production`
- Opcionales: Airtable, Google Maps, etc., según el proyecto.
- **IMPORTANTE:** Nunca incluir `SUPABASE_SERVICE_ROLE_KEY` en `.env.example` - solo en Vercel/env local.

**Scripts recomendados en `package.json`:**
- `dev`, `dev:localhost` (hostname localhost, puerto 3003), `build`, `start`, `lint`, `test`.
- `build:staging`, `build:prod` con `--env-file=.env.staging` / `.env.production`.
- Scripts de utilidad: `create-test-users`, `assign-property`, etc., con `tsx scripts/...`.

---

## 11. Vercel y Git

- **Deploy:** Conectar repo a Vercel; builds con `next build`; variables de entorno en dashboard (development, preview, production).
- **Ramas:** `main` para producción; preview deployments por rama/PR.
- **Git:** Commits claros; no subir `.env*.local`, `.env.staging`, `.env.production`, `node_modules`, `.next`, `.vercel`. Tener `.env.local.example` actualizado.
- **Migraciones:** Ejecutar migraciones de Supabase en el proyecto vinculado (Dashboard o CLI); no asumir que se aplican solas en Vercel.

---

## 12. Cursor Configuration

### Models

- **Complex tasks:** Claude 4 Sonnet / GPT-5.1 Codex
- **Simple edits:** GPT-4.1 Codex

### Mode

- **Default:** Agent/Composer mode (for code tasks)
- **Non-code tasks:** Chat mode

### Context Management

- **Max files:** 50 files via @mentions
- **Indexing:** Use `.cursorignore` to exclude unnecessary files
- **Priority indexing:** `components/`, `lib/`, `app/`
- **Excluded:** `node_modules/`, `.next/`, `.env*`, `*.log`, `*.pem`, `*.key`

### Workflow

1. **Create PRD.md or SPEC.md** for features before coding
2. **Use Notepads** for common prompts (code review, security checks)
3. **Commit before major AI refactors** (use Restore feature if needed)
4. **Use Debug Mode** for runtime issues

### Security in Cursor

- **Never paste real secrets** - Always use placeholders
- **Never read `.env*` files** - Use `.env.local.example` for structure
- **Service role key** - Only in `app/api/**` or `lib/supabase/server.ts`
- **`.cursorignore`** - Excludes sensitive files from indexing

---

## 13. Seguridad (CRÍTICO)

### Reglas de Seguridad

**NUNCA:**
- Pegar secrets reales. Siempre usar placeholders (ej. `sk_live_...` → `sk_live_PLACEHOLDER`)
- Leer archivos `.env*`, `*.pem`, `*.key`, o credenciales
- Committear service role keys, incluso en `.env.example`
- Exponer `SUPABASE_SERVICE_ROLE_KEY` en código cliente

**SIEMPRE:**
- Usar service role key SOLO en `app/api/**` o `lib/supabase/server.ts`
- Verificar que secrets no estén expuestos en bundles cliente
- Usar variables de entorno desde `lib/config/environment.ts`
- Verificar que `.cursorignore` excluya archivos sensibles

**Reglas detalladas:** Ver `.cursor/rules/01-security.mdc`

---

## 14. Zonas Protegidas

**No modificar a menos que se solicite explícitamente:**
- `supabase/migrations/**` - Migraciones de base de datos (solo agregar nuevas, nunca modificar existentes)
- `lib/auth/**` - Proveedores de autenticación (SupabaseAuthProvider, AppAuthProvider)
- `app/prophero.css` - Tokens de diseño (colores, espaciado, tipografía)
- `.cursorignore` - Exclusiones de indexado de Cursor

---

## 15. Workflow de Planificación (OBLIGATORIO)

**Antes de codificar:**
1. Resumir intención - ¿Qué estamos tratando de lograr?
2. Listar pasos - Dividir en pasos concretos
3. Identificar riesgos - ¿Qué podría salir mal?

**Después de codificar:**
1. Resumir cambios - ¿Qué se modificó/creó?
2. Listar riesgos introducidos - ¿Alguna nueva preocupación de seguridad/performance?
3. Sugerir casos de prueba o pasos de verificación manual

---

## 16. Límites de Dominio

Cuando trabajes en un dominio específico (`/app/supply`, `/app/admin`, `/app/reno`):
- **NO toques otros dominios** a menos que se solicite explícitamente
- Mantén la lógica específica del dominio dentro de las carpetas del dominio
- Usa utilidades compartidas de `lib/` cuando sea apropiado

**Reglas detalladas:** Ver `.cursor/rules/07-domain-boundaries.mdc`

---

## 17. Cómo usar este documento

1. **Para humanos:** Este documento (`VISTRAL_LAB_RULES.md`) es la referencia completa para el equipo.
2. **Para Cursor:** Las reglas modulares en `.cursor/rules/*.mdc` son leídas automáticamente por Cursor según los glob patterns.
3. **Nuevo proyecto:** Al iniciar un proyecto nuevo, referenciar este archivo y las reglas en `.cursor/rules/`.
4. **Actualizar reglas:** Modificar archivos `.mdc` individuales según necesidad; actualizar versión y `lastUpdated` en frontmatter.

---

## 18. Checklist rápido para nuevo proyecto

- [ ] Next.js 16 + TypeScript + App Router
- [ ] Estructura `app/`, `components/`, `lib/`, `hooks/`, `supabase/`
- [ ] `lib/config/environment.ts` y `lib/utils.ts` (cn, isDemoMode si aplica)
- [ ] Supabase: `lib/supabase/client.ts`, `server.ts`, `types.ts`
- [ ] Auth: SupabaseAuthProvider + AppAuthProvider + permissions
- [ ] Design system: prophero.css + globals.css + BREAKPOINTS/SPACING en constants
- [ ] UI: componentes con CVA + cn; Form con react-hook-form + Zod
- [ ] tsconfig paths `@/*`, next.config con alias e images
- [ ] `.env.local.example` y `.gitignore` actualizados (sin service role key)
- [ ] `.cursorignore` creado con exclusiones de seguridad
- [ ] Reglas modulares en `.cursor/rules/*.mdc` configuradas
- [ ] Repo conectado a Vercel; env configurados por entorno (service role solo en Vercel)

---

## Versión

**Versión:** 1.0  
**Última actualización:** 2026-02-02  
**Propietario:** Vistral Lab
