# 10. API Routes (Next.js)

## Ubicación

- **`app/api/`** por dominio (ej. `app/api/admin/users/route.ts`, `app/api/google-maps/autocomplete/route.ts`).

## Seguridad

- Verificar **sesión** o **rol** cuando haya datos sensibles.
- Usar cliente de servidor o service role si hace falta.

## Respuestas

- Respuesta JSON consistente.
- Códigos HTTP correctos (401, 403, 404, 500).

## Variables de entorno

- Leer desde `process.env` o desde **`lib/config/environment`**.
- No exponer service role ni secrets al cliente.

**Reglas detalladas:** Ver `.cursor/rules/06-api-routes.mdc`
