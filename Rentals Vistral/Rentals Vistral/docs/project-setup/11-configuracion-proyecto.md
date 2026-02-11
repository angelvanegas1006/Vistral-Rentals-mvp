# 11. Configuración de proyecto

## TypeScript (`tsconfig.json`)

- `strict: true`
- `paths: { "@/*": ["./*"] }`
- `moduleResolution: "bundler"`
- `jsx: "react-jsx"`
- **include:** `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`
- **exclude:** `node_modules`, docs, scripts de test si aplica

## Next.js (`next.config.ts`)

- **images:** formats avif/webp; `remotePatterns` para Supabase, Google, Prophero, etc.
- `typescript.ignoreBuildErrors: false`
- Alias **`@`** con `path.resolve(__dirname)`; extensiones `['.tsx', '.ts', '.jsx', '.js', '.json']`
- En webpack: `resolve.fallback.canvas: false` en cliente si no se usa

## Variables de entorno (ejemplo `.env.local.example`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENV=development|staging|production`
- Opcionales: Airtable, Google Maps, etc., según el proyecto
- **IMPORTANTE:** Nunca incluir `SUPABASE_SERVICE_ROLE_KEY` en `.env.example` — solo en Vercel/env local

## Scripts recomendados en `package.json`

- `dev`, `dev:localhost` (hostname localhost, puerto 3003), `build`, `start`, `lint`, `test`
- `build:staging`, `build:prod` con `--env-file=.env.staging` / `.env.production`
- Scripts de utilidad: `create-test-users`, `assign-property`, etc., con `tsx scripts/...`
