# Campos de Base de Datos - Fase 2 "Listo para Alquilar"

**Fecha:** 2026-02-04  
**Descripción:** Documento que recopila todos los campos de la base de datos utilizados en la Fase 2 "Listo para Alquilar"

---

## Resumen Ejecutivo

La Fase 2 "Listo para Alquilar" utiliza **10 campos** de la tabla `properties`, organizados en 4 secciones principales:

1. **Presentación al Cliente** (3 campos nuevos)
2. **Estrategia de Precio** (1 campo nuevo + 3 campos existentes)
3. **Inspección Técnica y Reportaje** (1 campo nuevo JSONB que consolida toda la información)
4. **Lanzamiento Comercial** (2 campos nuevos)

**Nota:** La Sección 3 ahora utiliza un único campo JSONB `technical_inspection_report` en lugar de las 45 columnas individuales que existían anteriormente.

---

## SECCIÓN 1: PRESENTACIÓN AL CLIENTE

### Campos Nuevos (Creados en Phase 2)

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `client_presentation_done` | `BOOLEAN` | ¿Se ha realizado la presentación del servicio al cliente? | `NULL` = no respondido<br>`true` = Sí<br>`false` = No |
| `client_presentation_date` | `DATE` | Fecha en que se realizó la presentación del servicio al cliente | Se autocompleta con la fecha actual cuando `client_presentation_done = true` |
| `client_presentation_channel` | `ENUM` | Canal de comunicación utilizado para la presentación | `"Llamada telefónica"`<br>`"Correo electrónico"`<br>`"Ambos"` |

### Criterios de Completitud
La sección está completa cuando:
- `client_presentation_done = true`
- `client_presentation_date IS NOT NULL`
- `client_presentation_channel IS NOT NULL`

---

## SECCIÓN 2: ESTRATEGIA DE PRECIO

### Campo Nuevo (Creado en Phase 2)

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `price_approval` | `BOOLEAN` | ¿Ha aprobado el cliente este precio de publicación? | `NULL` = no respondido<br>`true` = Sí<br>`false` = No |

### Campos Existentes (Ya en la tabla)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `announcement_price` | `NUMERIC` | Precio de publicación del anuncio |
| `target_rent_price` | `NUMERIC` | Precio objetivo de alquiler mensual |
| `expected_yield` | `NUMERIC` | Rentabilidad esperada en porcentaje |

### Criterios de Completitud
La sección está completa cuando:
- `announcement_price > 0`
- `price_approval = true`

---

## SECCIÓN 3: INSPECCIÓN TÉCNICA Y REPORTAGE

### Campo Nuevo - Reporte de Inspección Técnica (Creado en Phase 2)

**Migración:** Todas las columnas individuales de inspección técnica han sido consolidadas en un único campo JSONB para optimizar la arquitectura de la base de datos.

| Campo | Tipo | Descripción | Estructura |
|-------|------|-------------|------------|
| `technical_inspection_report` | `JSONB` | Reporte completo de inspección técnica agrupado por estancia | Objeto JSON con datos por estancia |

### Estructura del Campo `technical_inspection_report`

El campo `technical_inspection_report` es un objeto JSONB que agrupa toda la información de inspección técnica por estancia. Cada estancia puede tener los siguientes datos:

#### Estructura de Datos por Estancia

```typescript
interface RoomInspectionData {
  status: "good" | "incident" | null;           // Estado de la estancia
  comment: string | null;                       // Comentario descriptivo (si hay incidencias)
  affects_commercialization: boolean | null;     // ¿Afecta a la comercialización? (si hay incidencias)
  incident_photos: string[];                     // Array de URLs de fotos de incidencias
  marketing_photos: string[];                   // Array de URLs de fotos comerciales/marketing
}
```

#### Estancias Simples (Objetos Únicos)

Las siguientes estancias se almacenan como objetos únicos dentro del JSON:

- `common_areas` - Entorno y zonas comunes
- `entry_hallways` - Entrada y pasillos
- `living_room` - Salón
- `kitchen` - Cocina
- `exterior` - Exteriores
- `garage` - Garaje (condicional)
- `terrace` - Terraza (condicional)
- `storage` - Trastero (condicional)

**Ejemplo de estructura para estancias simples:**
```json
{
  "common_areas": {
    "status": "good",
    "comment": null,
    "affects_commercialization": null,
    "incident_photos": [],
    "marketing_photos": ["url1", "url2"]
  },
  "kitchen": {
    "status": "incident",
    "comment": "Fugas en el grifo",
    "affects_commercialization": false,
    "incident_photos": ["url3", "url4"],
    "marketing_photos": ["url5"]
  }
}
```

#### Estancias Múltiples (Arrays)

Las siguientes estancias se almacenan como arrays porque cada propiedad puede tener múltiples instancias:

- `bedrooms` - Array de objetos (una por habitación)
- `bathrooms` - Array de objetos (uno por baño)

**Ejemplo de estructura para estancias múltiples:**
```json
{
  "bedrooms": [
    {
      "status": "good",
      "comment": null,
      "affects_commercialization": null,
      "incident_photos": [],
      "marketing_photos": ["url1", "url2"]
    },
    {
      "status": "incident",
      "comment": "Pared con humedad",
      "affects_commercialization": true,
      "incident_photos": ["url3"],
      "marketing_photos": []
    }
  ],
  "bathrooms": [
    {
      "status": "good",
      "comment": null,
      "affects_commercialization": null,
      "incident_photos": [],
      "marketing_photos": ["url4"]
    }
  ]
}
```

### Almacenamiento de Fotos

Las fotos se almacenan en Supabase Storage con la siguiente estructura:

- **Bucket:** `properties-public-docs` (acceso público)
- **Fotos Comerciales/Marketing:** `/{property_unique_id}/photos/marketing/{estancia}/`
- **Fotos de Incidencias:** `/{property_unique_id}/photos/incidents/{estancia}/`

**Nota:** Los nombres de campos antiguos (`marketing_photos_common_areas`, `incident_photos_bedrooms`, etc.) se siguen utilizando en las rutas API para determinar la ruta de almacenamiento en Supabase Storage, pero las URLs de las fotos se almacenan dentro del campo JSONB `technical_inspection_report`.

### Criterios de Completitud por Estancia

Cada estancia puede estar en uno de estos estados (según los datos dentro de `technical_inspection_report`):

#### 1. Buen Estado
- `status = 'good'`
- `marketing_photos` tiene al menos una foto comercial

#### 2. Con Incidencias Bloqueantes
- `status = 'incident'`
- `comment IS NOT NULL`
- `incident_photos` tiene al menos una foto
- `affects_commercialization = true`

#### 3. Con Incidencias No Bloqueantes
- `status = 'incident'`
- `comment IS NOT NULL`
- `incident_photos` tiene al menos una foto
- `affects_commercialization = false`
- `marketing_photos` tiene al menos una foto comercial

### Criterios de Completitud de la Sección

**La Sección 3 está completa cuando TODAS las estancias están en uno de estos estados:**
- **Buen Estado** (Estado 1), O
- **Con Incidencias No Bloqueantes** (Estado 3)

**La Sección 3 NO está completa si alguna estancia tiene:**
- **Con Incidencias Bloqueantes** (Estado 2) - `affects_commercialization = true`

En otras palabras, la sección solo se completa cuando todas las estancias están listas para comercializar (ya sea porque están en buen estado o porque tienen incidencias que no bloquean la comercialización).

---

## SECCIÓN 4: LANZAMIENTO COMERCIAL

### Campos Nuevos (Creados en Phase 2)

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `publish_online` | `BOOLEAN` | ¿Publicar online? | `true` = Sí<br>`false` = No<br>`NULL` = No respondido |
| `idealista_description` | `TEXT` | Descripción del inmueble para el anuncio | Texto descriptivo |

### Criterios de Completitud

La sección está **bloqueada** hasta que las Secciones 1, 2 y 3 estén completas.

La sección está completa cuando:
- `publish_online = false` **O**
- (`publish_online = true` **AND** `idealista_description IS NOT NULL`)

---

## Resumen de Campos por Tipo

### Campos Nuevos (Creados en Phase 2)
- **Total:** 7 campos nuevos
  - 3 campos de Presentación al Cliente
  - 1 campo de Estrategia de Precio
  - 1 campo de Inspección Técnica (`technical_inspection_report` JSONB que consolida toda la información)
  - 2 campos de Lanzamiento Comercial

**Nota:** El campo `technical_inspection_report` reemplaza a las 45 columnas individuales que existían anteriormente (`check_*`, `comment_*`, `affects_commercialization_*`, `incident_photos_*`, `marketing_photos_*`), optimizando significativamente la estructura de la base de datos.

### Campos Existentes (Ya en la tabla)
- **Total:** 3 campos existentes
  - `announcement_price` - Precio de publicación del anuncio
  - `target_rent_price` - Precio objetivo de alquiler mensual
  - `expected_yield` - Rentabilidad esperada en porcentaje

---

## Estancias Cubiertas

Las siguientes estancias tienen campos asociados:

1. **Entorno y zonas comunes** (`common_areas`)
2. **Entrada y pasillos** (`entry_hallways`)
3. **Habitaciones** (`bedrooms`) - Array dinámico
4. **Salón** (`living_room`)
5. **Baños** (`bathrooms`) - Array dinámico
6. **Cocina** (`kitchen`)
7. **Exteriores** (`exterior`)
8. **Garaje** (`garage`) - Condicional
9. **Terraza** (`terrace`) - Condicional

---

## Notas de Implementación

### Estructura de Datos para Arrays

- **Habitaciones y Baños:** Se almacenan como arrays dentro del objeto `technical_inspection_report` porque cada propiedad puede tener un número variable de habitaciones/baños.
  - `bedrooms`: Array de objetos `RoomInspectionData` (uno por habitación)
  - `bathrooms`: Array de objetos `RoomInspectionData` (uno por baño)
  
**Ejemplo:**
```json
{
  "bedrooms": [
    { "status": "good", "comment": null, "affects_commercialization": null, "incident_photos": [], "marketing_photos": ["url1"] },
    { "status": "incident", "comment": "Humedad", "affects_commercialization": false, "incident_photos": ["url2"], "marketing_photos": ["url3"] }
  ]
}
```

### Campos Condicionales

Los campos de **garaje** y **terraza** solo se usan si la propiedad tiene estas características:
- Verificar `has_terrace`, `garage`, etc. antes de mostrar estos campos en el UI

### Diferenciación de Fotos

- **Fotos Comerciales/Marketing** (`marketing_photos_*`): Para mostrar en anuncios y marketing
- **Fotos de Incidencias** (`incident_photos_*`): Para documentar daños o problemas técnicos

---

## Referencias

- **SQL Migration:** `SQL/migrate_technical_inspection_to_json.sql` (migración a JSONB)
- **SQL Migration Original:** `SQL/create_phase2_ready_to_rent_fields.sql` (deprecated - columnas individuales eliminadas)
- **TypeScript Types:** `src/lib/supabase/types.ts` (interfaces `TechnicalInspectionReport` y `RoomInspectionData`)
- **Componente Principal:** `src/components/rentals/ready-to-rent-tasks.tsx`
- **Rutas API:** `src/app/api/documents/upload/route.ts` y `src/app/api/documents/delete/route.ts`

---

## Historial de Cambios

### 2026-02-05 - Migración a JSONB
- **Cambio:** Todas las columnas individuales de inspección técnica (`check_*`, `comment_*`, `affects_commercialization_*`, `incident_photos_*`, `marketing_photos_*`) han sido eliminadas y consolidadas en un único campo JSONB `technical_inspection_report`.
- **Razón:** Optimización de la arquitectura de la base de datos, reduciendo de 45 columnas a 1 campo estructurado.
- **Migración:** Ver `SQL/migrate_technical_inspection_to_json.sql`
- **Nota:** No se migraron datos existentes - se empezó limpio con la nueva estructura.

**Última actualización:** 2026-02-05
