# 2. Stack y dependencias base

## Stack

- **Framework:** Next.js 16+ (App Router)
- **Lenguaje:** TypeScript (strict)
- **UI:** React 19, Radix UI, Tailwind CSS 4
- **Backend / DB:** Supabase (auth, DB, storage, RLS)
- **Formularios:** react-hook-form + @hookform/resolvers + Zod
- **Estilos:** class-variance-authority (cva), clsx, tailwind-merge
- **Deploy:** Vercel (recomendado)

## Dependencias clave en `package.json`

- `@supabase/ssr`, `@supabase/supabase-js`
- `next`, `react`, `react-dom`
- `@radix-ui/*` (dialog, dropdown-menu, label, select, etc.)
- `tailwindcss`, `@tailwindcss/postcss`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `lucide-react`, `date-fns`, `sonner` (toasts)
