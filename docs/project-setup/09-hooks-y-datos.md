# 9. Hooks y datos

## Supabase

- Crear hooks que usen `createClient()` de `lib/supabase/client` o (en Server Components) el cliente de servidor.
- No instanciar Supabase fuera de `lib/supabase`.

## Patrón de datos

- Un hook por "recurso" o pantalla (ej. **usePropertyData**) que encapsule loading, error, fetch y mutaciones.
- Opcionalmente soporte demo/localStorage si aplica.

## Params (Next 16+)

- `useParams()` puede devolver Promise; usar **`use(paramsPromise)`** cuando sea necesario.

## Servicios

- Lógica de negocio y llamadas a Supabase en **`lib/*-supabase.ts`** o **`lib/*-storage.ts`**.
- Los hooks solo orquestan y exponen estado.
