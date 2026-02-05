# Debug de Conexión con Supabase

## Problema
Sigue viendo propiedades mock en el Kanban aunque la base de datos está vacía.

## Posibles Causas

### 1. Variables de Entorno no se están leyendo
**Solución**: Reinicia el servidor de desarrollo después de crear `.env.local`
```bash
# Detén el servidor (Ctrl+C) y vuelve a ejecutar:
npm run dev
```

### 2. La tabla `properties` no existe en Supabase
**Verificación**: Ve al Table Editor de Supabase y verifica que existe la tabla `properties`

**Solución**: Si no existe, necesitas crearla. La tabla `properties` debería tener estos campos:
- `property_ref_id` (TEXT) - ID único
- `address` (TEXT)
- `city` (TEXT, nullable)
- `region` (TEXT, nullable)
- `current_phase` (TEXT)
- `days_in_phase` (INTEGER)
- `is_expired` (BOOLEAN, nullable)
- `needs_update` (BOOLEAN, nullable)
- `property_type` (TEXT, nullable)
- `manager_initials` (TEXT, nullable)
- `manager_name` (TEXT, nullable)
- `writing_date` (DATE, nullable)
- `visit_date` (DATE, nullable)
- `days_to_visit` (INTEGER, nullable)
- `days_to_start` (INTEGER, nullable)

### 3. La tabla existe pero está vacía
**Comportamiento esperado**: Si la tabla está vacía, el Kanban debería mostrar columnas vacías, no datos mock.

**Problema actual**: El código está usando datos mock como fallback cuando Supabase devuelve un array vacío.

## Cómo Verificar

1. **Abre la consola del navegador** (F12 o Cmd+Option+I)
2. **Busca estos mensajes**:
   - `🔌 Intentando conectar a Supabase...` - Indica que está intentando conectar
   - `✅ Propiedades obtenidas de Supabase: X propiedades` - Indica cuántas propiedades se obtuvieron
   - `⚠️ No hay propiedades de Supabase, usando datos mock` - Indica que está usando mock
   - `❌ Error de Supabase:` - Indica un error de conexión

3. **Verifica en Supabase**:
   - Ve al Table Editor
   - Verifica que la tabla `properties` existe
   - Verifica que tiene datos (o está vacía)

## Solución Temporal

Si quieres que el Kanban muestre columnas vacías cuando no hay datos (en lugar de datos mock), podemos modificar el código para que:
- Si Supabase está configurado y responde correctamente (aunque esté vacío), muestre columnas vacías
- Solo use datos mock si hay un error de conexión o Supabase no está configurado

## Próximos Pasos

1. **Reinicia el servidor** (`npm run dev`)
2. **Abre la consola del navegador** y revisa los logs
3. **Comparte conmigo**:
   - ¿Qué mensajes ves en la consola?
   - ¿Existe la tabla `properties` en Supabase?
   - ¿Tiene datos o está vacía?
