# 14. Seguridad (CRÍTICO)

## Reglas de seguridad

### NUNCA

- Pegar secrets reales. Siempre usar placeholders (ej. `sk_live_...` → `sk_live_PLACEHOLDER`)
- Leer archivos `.env*`, `*.pem`, `*.key`, o credenciales
- Committear service role keys, incluso en `.env.example`
- Exponer `SUPABASE_SERVICE_ROLE_KEY` en código cliente

### SIEMPRE

- Usar service role key **SOLO** en `app/api/**` o `lib/supabase/server.ts`
- Verificar que secrets no estén expuestos en bundles cliente
- Usar variables de entorno desde **`lib/config/environment.ts`**
- Verificar que **`.cursorignore`** excluya archivos sensibles

**Reglas detalladas:** Ver `.cursor/rules/01-security.mdc`
