# 3. Estructura de carpetas

## Árbol de directorios

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

## Convenciones

- **Rutas:** bajo `app/` por dominio (supply, admin, login, etc.).
- **Componentes:** `components/ui/` para primitivos; subcarpetas por feature.
- **Servicios y tipos:** `lib/`; Supabase tipado en `lib/supabase/types.ts`.
- **Migraciones:** solo en `supabase/migrations/`, numeradas y ordenadas (001_, 002_, ...).
