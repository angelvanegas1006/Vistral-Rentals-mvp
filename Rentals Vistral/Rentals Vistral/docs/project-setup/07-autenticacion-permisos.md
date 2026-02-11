# 7. Autenticación y permisos

## Capas

1. **Supabase Auth** → capa base.
2. **SupabaseAuthProvider** → contexto de sesión.
3. **AppAuthProvider** → capa de app con roles que lee `user_roles` y expone `user`, `role`, `hasRole`, `hasAnyRole`, `isAdmin`, etc.

## Roles

- Definidos en DB y en `Database['public']['Enums']['app_role']` (ej. supply_partner, supply_analyst, supply_admin).
- **No hardcodear** roles en strings; usar el tipo **`AppRole`**.

## Permisos

- Lógica centralizada en **`lib/auth/permissions.ts`** (ej. `canViewProperty`, `canEditProperty`) usando `AppRole` y datos del recurso.
- Usar estas funciones en páginas y componentes, no duplicar la lógica.

## Layout raíz

En `app/layout.tsx` envolver en este orden:

`ThemeProvider` → `I18nProvider` → `SupabaseAuthProvider` → `AppAuthProvider`; Toaster global.

**Reglas detalladas:** Ver `.cursor/rules/04-auth-permissions.mdc`
