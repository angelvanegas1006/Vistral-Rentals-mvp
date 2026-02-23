# Configuración Completa de Tablas Leads

## 📋 Resumen

Este documento contiene todas las queries SQL necesarias para crear y configurar las tablas `leads` y `leads_properties` en Supabase, con todos los campos que se usan en el frontend.

## 🔍 Campos Usados en el Frontend

### Tabla `leads`:
- **Información básica**: `name`, `phone`, `email`, `zone`
- **Estado Kanban**: `current_phase`, `days_in_phase`
- **PublishedTasks**: `called`, `discarded`, `scheduled_date`, `visit_date`, `qualified`
- **Resumen Lead**: `average_income`, `finaer_status`, `number_of_occupants`
- **Control**: `needs_update`
- **Sistema**: `id` (UUID), `created_at`, `updated_at`

### Tabla `leads_properties`:
- **Relación**: `leads_unique_id` (TEXT → leads.leads_unique_id), `properties_unique_id` (TEXT → properties.property_unique_id)
- **Sistema**: `id` (UUID), `created_at`

## 📝 Paso 1: Crear Tablas

Ejecuta el archivo `CREATE_LEADS_TABLES.sql` completo en el editor SQL de Supabase.

Este archivo incluye:
- ✅ Creación de tabla `leads` con todos los campos
- ✅ Creación de tabla `leads_properties` 
- ✅ Índices para búsquedas rápidas
- ✅ Triggers para `updated_at` automático
- ✅ Políticas RLS (deshabilitadas para desarrollo)

## 📝 Paso 2: Insertar Datos Mock

Ejecuta el archivo `INSERT_MOCK_LEADS.sql` para insertar datos de prueba.

## 🔧 Paso 3: Verificar Estructura

Ejecuta estas queries para verificar:

```sql
-- Ver estructura de leads
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Ver estructura de leads_properties
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads_properties' 
ORDER BY ordinal_position;

-- Ver datos insertados
SELECT id, name, phone, current_phase, days_in_phase FROM leads ORDER BY current_phase, days_in_phase;
```

## ⚠️ Nota Importante sobre IDs

- **En Supabase**: Los `id` son **UUID** (generados automáticamente)
- **En datos mock del código**: Los `id` son strings como "LEAD-001"
- **Solución**: Cuando uses datos mock, el código debe generar UUIDs o usar un campo `property_ref_id` similar

## 🐛 Solución al Error 400

El error 400 probablemente se debe a:
1. El `leadId` que se pasa no es un UUID válido
2. Algún campo en `updates` tiene un formato incorrecto

**Solución temporal**: El código ahora limpia los `updates` antes de enviarlos y añade logs para debuggear.

## 📊 Mapeo de Fases

### Kanban de Interesados (pipeline principal)

Las fases del Kanban de Interesados se mapean así en `current_phase`:
- `"Interesado Cualificado"` → `current_phase = 'Interesado Cualificado'`
- `"Visita Agendada"` → `current_phase = 'Visita Agendada'`
- `"Recogiendo Información"` → `current_phase = 'Recogiendo Información'`
- `"Calificación en Curso"` → `current_phase = 'Calificación en Curso'`
- `"Interesado Presentado"` → `current_phase = 'Interesado Presentado'`
- `"Interesado Aceptado"` → `current_phase = 'Interesado Aceptado'`
- `"Interesado Perdido"` → `current_phase = 'Interesado Perdido'` *(fase terminal, tarjetas desactivadas)*
- `"Interesado Rechazado"` → `current_phase = 'Interesado Rechazado'` *(fase terminal, tarjetas desactivadas)*

### PublishedTasks (vista alternativa)

- `"Sin Contactar"` → `current_phase = 'Sin Contactar'`
- `"Agendados"` → `current_phase = 'Agendados'`
- `"Visita Hecha / Pendiente de Doc."` → `current_phase = 'Visita Hecha / Pendiente de Doc.'`
- `"Descartados"` → `current_phase = 'Descartados'`

## 🔄 Siguiente Paso

Una vez creadas las tablas, el drag & drop debería funcionar correctamente y actualizar los leads en Supabase.
