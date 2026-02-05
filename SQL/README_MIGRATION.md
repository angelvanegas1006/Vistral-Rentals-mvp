# Scripts de Migración a Base de Datos

Este directorio contiene los scripts SQL necesarios para migrar todos los datos hardcodeados/mock a la base de datos Supabase.

## 📋 Orden de Ejecución

Ejecuta los scripts en el siguiente orden en el **SQL Editor de Supabase Dashboard**:

### ⚠️ IMPORTANTE: Paso Previo Requerido

**Si recibes el error:** `there is no unique constraint matching given keys for referenced table "properties"`

Ejecuta primero este script:
```
00_FIX_PROPERTY_UNIQUE_ID.sql
```

Este script asegura que `property_unique_id` tenga una restricción UNIQUE antes de crear las claves foráneas.

### Opción 1: Script Maestro (Recomendado)
Ejecuta un solo script que contiene todo (incluye el fix automático):
```
00_MIGRATION_MASTER.sql
```

### Opción 2: Scripts Individuales
Si prefieres ejecutar cada script por separado:

**Paso 0 (si es necesario):**
- **00_FIX_PROPERTY_UNIQUE_ID.sql** - Agrega restricción UNIQUE a property_unique_id

**Luego ejecuta en orden:**

1. **CREATE_PROPERTY_TENANTS_TABLE.sql**
   - Crea la tabla `property_tenants` para almacenar información de inquilinos

2. **CREATE_PROPERTY_RENTALS_TABLE.sql**
   - Crea la tabla `property_rentals` para almacenar información de contratos de alquiler

3. **CREATE_PROPERTY_TASKS_TABLE.sql**
   - Crea la tabla `property_tasks` para rastrear el estado de completitud de tareas

4. **CREATE_PROPERTY_VISITS_TABLE.sql**
   - Crea la tabla `property_visits` para almacenar visitas y eventos del calendario

5. **ADD_TASKS_FIELDS_TO_PROPERTIES.sql**
   - Agrega campos adicionales a la tabla `properties` para almacenar datos estáticos de tareas

## 🚀 Cómo Ejecutar

1. Ve al **Supabase Dashboard** → Tu proyecto → **SQL Editor**
2. Copia y pega el contenido del script `00_MIGRATION_MASTER.sql`
3. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`
4. Verifica que no haya errores en la consola

## 📊 Estructura de las Tablas

### `property_tenants`
Almacena información del inquilino asociado a una propiedad.
- `property_id` (FK → properties.property_unique_id)
- `full_name`, `email`, `phone`, `nif`

### `property_rentals`
Almacena información del contrato de alquiler.
- `property_id` (FK → properties.property_unique_id)
- `rent_price`, `start_date`, `duration`, `security_deposit`, `legal_contract_url`

### `property_tasks`
Almacena el estado de completitud de todas las tareas por fase.
- `property_id` (FK → properties.property_unique_id)
- `phase` (ej: "Inquilino aceptado", "Pendiente de trámites")
- `task_type` (identificador único de la tarea)
- `task_data` (JSONB con datos flexibles)
- `is_completed`, `completed_at`

### `property_visits`
Almacena visitas y eventos del calendario.
- `property_id` (FK → properties.property_unique_id)
- `visit_date`, `visit_type` (renovation-end, contract-end, scheduled-visit, ipc-update)
- `notes`, `created_by`

## ⚠️ Notas Importantes

- Todos los scripts usan `IF NOT EXISTS` para evitar errores si ya existen las tablas/columnas
- Los triggers se crean o reemplazan automáticamente
- Las relaciones de claves foráneas usan `ON DELETE CASCADE` para mantener la integridad
- Los índices se crean automáticamente para optimizar las consultas

## ✅ Verificación

Después de ejecutar los scripts, verifica que:

1. Las tablas aparecen en el **Table Editor** de Supabase
2. Los campos nuevos aparecen en la tabla `properties`
3. No hay errores en la consola del SQL Editor

## 🔄 Rollback

Si necesitas revertir los cambios, puedes ejecutar:

```sql
-- Eliminar tablas (¡CUIDADO! Esto eliminará todos los datos)
DROP TABLE IF EXISTS property_visits CASCADE;
DROP TABLE IF EXISTS property_tasks CASCADE;
DROP TABLE IF EXISTS property_rentals CASCADE;
DROP TABLE IF EXISTS property_tenants CASCADE;

-- Eliminar columnas de properties (requiere más cuidado)
-- Ejecuta manualmente solo las columnas que quieras eliminar
```
