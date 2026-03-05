# 12. Vercel y Git

## Deploy

- Conectar repo a **Vercel**; builds con `next build`.
- Variables de entorno en dashboard (development, preview, production).

## Ramas

- **main** para producción.
- Preview deployments por rama/PR.

## Git

- Commits claros.
- **No subir:** `.env*.local`, `.env.staging`, `.env.production`, `node_modules`, `.next`, `.vercel`.
- Tener **`.env.local.example`** actualizado.

## Migraciones

- Ejecutar migraciones de Supabase en el proyecto vinculado (Dashboard o CLI).
- No asumir que se aplican solas en Vercel.
