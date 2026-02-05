# Campos de Base de Datos - Fase 2 "Listo para Alquilar"

**Fecha:** 2026-02-04  
**Descripción:** Documento que recopila todos los campos de la base de datos utilizados en la Fase 2 "Listo para Alquilar"

---

## Resumen Ejecutivo

La Fase 2 "Listo para Alquilar" utiliza **54 campos** de la tabla `properties`, organizados en 4 secciones principales:

1. **Presentación al Cliente** (3 campos nuevos)
2. **Estrategia de Precio** (1 campo nuevo + 3 campos existentes)
3. **Inspección Técnica y Reportaje** (45 campos nuevos)
4. **Lanzamiento Comercial** (2 campos nuevos)

---

## SECCIÓN 1: PRESENTACIÓN AL CLIENTE

### Campos Nuevos (Creados en Phase 2)

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `client_presentation_done` | `BOOLEAN` | ¿Se ha realizado la presentación del servicio al cliente? | `NULL` = no respondido<br>`true` = Sí<br>`false` = No |
| `client_presentation_date` | `DATE` | Fecha en que se realizó la presentación del servicio al cliente | Se autocompleta con la fecha actual cuando `client_presentation_done = true` |
| `client_presentation_channel` | `TEXT` | Canal de comunicación utilizado para la presentación | `"Llamada telefónica"`<br>`"Correo electrónico"`<br>`"Ambos"` |

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

### Campos Nuevos - Fotos de Incidencias (Creados en Phase 2)

Las fotos de incidencias son diferentes de las fotos comerciales. Se guardan en:
- **Bucket:** `properties-public-docs`
- **Folders:** `photos/incidents/{estancia}/`

| Campo | Tipo | Descripción | Estructura |
|-------|------|-------------|------------|
| `incident_photos_common_areas` | `JSONB` | Fotos de incidencias - Entorno y zonas comunes | Array de strings (URLs) |
| `incident_photos_entry_hallways` | `JSONB` | Fotos de incidencias - Entrada y pasillos | Array de strings (URLs) |
| `incident_photos_bedrooms` | `JSONB` | Fotos de incidencias - Habitaciones | Array de arrays de strings (una por habitación) |
| `incident_photos_living_room` | `JSONB` | Fotos de incidencias - Salón | Array de strings (URLs) |
| `incident_photos_bathrooms` | `JSONB` | Fotos de incidencias - Baños | Array de arrays de strings (uno por baño) |
| `incident_photos_kitchen` | `JSONB` | Fotos de incidencias - Cocina | Array de strings (URLs) |
| `incident_photos_exterior` | `JSONB` | Fotos de incidencias - Exteriores | Array de strings (URLs) |
| `incident_photos_garage` | `JSONB` | Fotos de incidencias - Garaje | Array de strings (URLs)<br>*Solo si la propiedad tiene garaje* |
| `incident_photos_terrace` | `JSONB` | Fotos de incidencias - Terraza | Array de strings (URLs)<br>*Solo si la propiedad tiene terraza* |

### Campos Nuevos - Fotos Comerciales/Marketing (Creados en Phase 2)

Las fotos comerciales se guardan en:
- **Bucket:** `properties-public-docs`
- **Folders:** `photos/marketing/{estancia}/`

| Campo | Tipo | Descripción | Estructura |
|-------|------|-------------|------------|
| `marketing_photos_common_areas` | `JSONB` | Fotos comerciales/marketing - Entorno y zonas comunes | Array de strings (URLs) |
| `marketing_photos_entry_hallways` | `JSONB` | Fotos comerciales/marketing - Entrada y pasillos | Array de strings (URLs) |
| `marketing_photos_bedrooms` | `JSONB` | Fotos comerciales/marketing - Habitaciones | Array de arrays de strings (una por habitación) |
| `marketing_photos_living_room` | `JSONB` | Fotos comerciales/marketing - Salón | Array de strings (URLs) |
| `marketing_photos_bathrooms` | `JSONB` | Fotos comerciales/marketing - Baños | Array de arrays de strings (uno por baño) |
| `marketing_photos_kitchen` | `JSONB` | Fotos comerciales/marketing - Cocina | Array de strings (URLs) |
| `marketing_photos_exterior` | `JSONB` | Fotos comerciales/marketing - Exteriores | Array de strings (URLs) |
| `marketing_photos_garage` | `JSONB` | Fotos comerciales/marketing - Garaje | Array de strings (URLs)<br>*Solo si la propiedad tiene garaje* |
| `marketing_photos_terrace` | `JSONB` | Fotos comerciales/marketing - Terraza | Array de strings (URLs)<br>*Solo si la propiedad tiene terraza* |

### Campos Nuevos - Estado de Estancias (Creados en Phase 2)

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `check_common_areas` | `TEXT` | Estado - Entorno y zonas comunes | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_entry_hallways` | `TEXT` | Estado - Entrada y pasillos | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_bedrooms` | `JSONB` | Estado - Habitaciones | Array de textos: `"good"` o `"incident"`<br>(una por habitación) |
| `check_living_room` | `TEXT` | Estado - Salón | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_bathrooms` | `JSONB` | Estado - Baños | Array de textos: `"good"` o `"incident"`<br>(uno por baño) |
| `check_kitchen` | `TEXT` | Estado - Cocina | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_exterior` | `TEXT` | Estado - Exteriores | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_garage` | `TEXT` | Estado - Garaje | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |
| `check_terrace` | `TEXT` | Estado - Terraza | `"good"` = Buen estado<br>`"incident"` = Con incidencias<br>`NULL` = No evaluado |

### Campos Nuevos - Comentarios (Creados en Phase 2)

Se usan cuando el estado es `"incident"`:

| Campo | Tipo | Descripción | Estructura |
|-------|------|-------------|------------|
| `comment_common_areas` | `TEXT` | Comentario - Entorno y zonas comunes | String |
| `comment_entry_hallways` | `TEXT` | Comentario - Entrada y pasillos | String |
| `comment_bedrooms` | `JSONB` | Comentarios - Habitaciones | Array de textos (uno por habitación) |
| `comment_living_room` | `TEXT` | Comentario - Salón | String |
| `comment_bathrooms` | `JSONB` | Comentarios - Baños | Array de textos (uno por baño) |
| `comment_kitchen` | `TEXT` | Comentario - Cocina | String |
| `comment_exterior` | `TEXT` | Comentario - Exteriores | String |
| `comment_garage` | `TEXT` | Comentario - Garaje | String |
| `comment_terrace` | `TEXT` | Comentario - Terraza | String |

### Campos Nuevos - Impacto en Comercialización (Creados en Phase 2)

Se usan cuando hay incidencias (`check_* = "incident"`):

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `affects_commercialization_common_areas` | `BOOLEAN` | ¿Afecta la comercialización? - Entorno y zonas comunes | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_entry_hallways` | `BOOLEAN` | ¿Afecta la comercialización? - Entrada y pasillos | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_bedrooms` | `JSONB` | ¿Afecta la comercialización? - Habitaciones | Array de booleanos (uno por habitación) |
| `affects_commercialization_living_room` | `BOOLEAN` | ¿Afecta la comercialización? - Salón | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_bathrooms` | `JSONB` | ¿Afecta la comercialización? - Baños | Array de booleanos (uno por baño) |
| `affects_commercialization_kitchen` | `BOOLEAN` | ¿Afecta la comercialización? - Cocina | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_exterior` | `BOOLEAN` | ¿Afecta la comercialización? - Exteriores | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_garage` | `BOOLEAN` | ¿Afecta la comercialización? - Garaje | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |
| `affects_commercialization_terrace` | `BOOLEAN` | ¿Afecta la comercialización? - Terraza | `true` = Sí<br>`false` = No<br>`NULL` = No aplica |

### Criterios de Completitud por Estancia

Cada estancia puede estar en uno de estos estados:

#### 1. Buen Estado
- `check_* = 'good'`
- `marketing_photos_*` tiene fotos comerciales

#### 2. Con Incidencias Bloqueantes
- `check_* = 'incident'`
- `comment_* IS NOT NULL`
- `incident_photos_*` tiene fotos
- `affects_commercialization_* = true`

#### 3. Con Incidencias No Bloqueantes
- `check_* = 'incident'`
- `comment_* IS NOT NULL`
- `incident_photos_*` tiene fotos
- `affects_commercialization_* = false`
- `marketing_photos_*` tiene fotos comerciales

### Criterios de Completitud de la Sección

**La Sección 3 está completa cuando TODAS las estancias están en uno de estos estados:**
- **Buen Estado** (Estado 1), O
- **Con Incidencias No Bloqueantes** (Estado 3)

**La Sección 3 NO está completa si alguna estancia tiene:**
- **Con Incidencias Bloqueantes** (Estado 2) - `affects_commercialization_* = true`

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
- **Total:** 51 campos nuevos
  - 3 campos de Presentación al Cliente
  - 1 campo de Estrategia de Precio
  - 9 campos de Fotos de Incidencias (incident_photos_*)
  - 9 campos de Fotos Comerciales/Marketing (marketing_photos_*)
  - 9 campos de Estado de Estancias (check_*)
  - 9 campos de Comentarios (comment_*)
  - 9 campos de Impacto en Comercialización (affects_commercialization_*)
  - 2 campos de Lanzamiento Comercial

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

- **Habitaciones y Baños:** Se usan arrays dinámicos porque cada propiedad puede tener un número variable de habitaciones/baños.
  - `check_bedrooms`: `["good", "incident", "good"]` (una entrada por habitación)
  - `marketing_photos_bedrooms`: `[["url1", "url2"], ["url3"], ["url4", "url5"]]` (array de arrays, uno por habitación)
  - `incident_photos_bedrooms`: Similar estructura

### Campos Condicionales

Los campos de **garaje** y **terraza** solo se usan si la propiedad tiene estas características:
- Verificar `has_terrace`, `garage`, etc. antes de mostrar estos campos en el UI

### Diferenciación de Fotos

- **Fotos Comerciales/Marketing** (`marketing_photos_*`): Para mostrar en anuncios y marketing
- **Fotos de Incidencias** (`incident_photos_*`): Para documentar daños o problemas técnicos

---

## Referencias

- **SQL Migration:** `SQL/create_phase2_ready_to_rent_fields.sql`
- **TypeScript Types:** `src/lib/supabase/types.ts`
- **Componente Principal:** `src/components/rentals/ready-to-rent-tasks.tsx`
- **Análisis de Columnas:** `PROPERTIES_COLUMNS_ANALYSIS.md`

---

**Última actualización:** 2026-02-04
