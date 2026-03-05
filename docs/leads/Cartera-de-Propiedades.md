# Cartera de Propiedades

Tab dentro de la vista de detalle de un Interesado (`/rentals/leads/[id]`) que permite buscar propiedades en estado **Publicado** y vincularlas al lead.

## Ubicación en la aplicación

Se muestra como una sección dentro de la página de detalle del interesado, debajo de las propiedades ya vinculadas.

## Arquitectura

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Componente UI | `src/components/rentals/otras-propiedades-cartera.tsx` | Filtros, listado y acción de añadir |
| Hook de datos | `src/hooks/use-published-properties.ts` | Fetch con filtros, abort de peticiones previas |
| API Route | `src/app/api/properties/published/route.ts` | Query a Supabase con filtros dinámicos |

## Filtros disponibles

Los filtros se organizan en un panel colapsable con la siguiente distribución por filas:

### Fila 1 — Ubicación

| Filtro | Tipo | Columna DB | Comportamiento |
|--------|------|------------|----------------|
| Ciudad | Select (single) | `city` | Match exacto. Al cambiar ciudad se resetean las zonas |
| Zonas | Multi-select con checkboxes | `area_cluster` | Filtro `IN`. Las opciones se recalculan según la ciudad seleccionada |

### Fila 2 — Precio, tipo y tamaño

| Filtro | Tipo | Columna DB | Comportamiento |
|--------|------|------------|----------------|
| Precio (€/mes) | Dos inputs numéricos (Mín / Máx) | `announcement_price` | `>= min` y `<= max` |
| Tipo de alquiler | Select (single) | `rental_type` | Match exacto. Opciones fijas: Larga estancia, Corta estancia, Vacacional |
| Tamaño (m²) | Dos inputs numéricos (Mín / Máx) | `square_meters` | `>= min` y `<= max` |

### Fila 3 — Habitaciones y baños

| Filtro | Tipo | Columna DB | Comportamiento |
|--------|------|------------|----------------|
| Habitaciones | Dos inputs numéricos (Mín / Máx) | `bedrooms` | `>= min` y `<= max`. Admite 0 como mínimo (= Estudio) |
| Baños | Dos inputs numéricos (Mín / Máx) | `bathrooms` | `>= min` y `<= max` |

### Fila 4 — Características

| Filtro | Tipo | Columna DB | Comportamiento |
|--------|------|------------|----------------|
| Ascensor | Checkbox | `has_elevator` (boolean) | `has_elevator = true` |
| Garaje | Checkbox | `garage` (text) | `garage != 'No tiene'` AND `garage IS NOT NULL` |
| Terraza | Checkbox | `has_terrace` (boolean) | `has_terrace = true` |

> **Nota sobre Garaje:** El campo `garage` en Supabase es de tipo `text`, no `boolean`. Cuando no hay garaje el valor es `'No tiene'`. Cualquier otro valor (`'Plaza 13'`, `'Doble'`, etc.) indica que sí hay garaje.

### Barra de búsqueda

Además de los filtros, hay un input de texto libre que busca por dirección (`address ILIKE '%texto%'`).

## Exclusión automática

Las propiedades que ya están vinculadas al interesado actual se excluyen automáticamente de los resultados (`exclude_ids`).

## Botones de acción en filtros

### Restablecer

- Limpia **todos** los filtros a estado vacío (sin valores predeterminados).
- Limpia también la barra de búsqueda por dirección.
- El resultado es mostrar el catálogo completo de propiedades publicadas.

### Sugeridos (Smart Match)

Rellena automáticamente los filtros basándose en la **primera propiedad vinculada** al interesado.

**Lógica para encontrar la primera propiedad:**

1. Consulta los registros de `leads_properties` para el `leads_unique_id` actual.
2. Ordena por `created_at ASC` y toma el primero.
3. Extrae las características de esa propiedad.

**Mapeo de filtros:**

| Filtro | Valor asignado |
|--------|---------------|
| Ciudad | `primera_propiedad.city` |
| Zona | `primera_propiedad.area_cluster` |
| Precio máximo | `primera_propiedad.announcement_price × 1.1` (redondeado hacia arriba) |
| Habitaciones mínimas | `primera_propiedad.bedrooms` |

**Casos límite:**

| Caso | Comportamiento |
|------|---------------|
| Sin historial de propiedades | Botón deshabilitado (`disabled`) |
| Campo nulo en la primera propiedad | Ese filtro específico se deja en blanco |

## Persistencia de filtros

Los valores de todos los filtros (incluyendo el estado abierto/cerrado del panel) se guardan en `sessionStorage` con la clave `otras-propiedades-filters-{leadsUniqueId}`. Al volver a la página del mismo interesado en la misma sesión, los filtros se restauran.

Prioridad de carga inicial:
1. `sessionStorage` (si existe para ese lead)
2. Smart defaults (primera propiedad vinculada)
3. Vacío (sin filtros)

## Contador de filtros activos

Un badge junto al botón "Filtros" muestra la cantidad de filtros con valor distinto de vacío. Cualquier filtro con dato cuenta como activo.

## Acción: Añadir propiedad

Cada tarjeta de resultado tiene un botón para vincular la propiedad al interesado. La acción:

1. Hace `POST /api/leads/{leadsUniqueId}/properties` con `{ properties_unique_id }`.
2. Muestra toast de confirmación o error.
3. Refresca la lista de propiedades vinculadas mediante `onPropertyAdded()`.

## API Route: `GET /api/properties/published`

### Query params

| Parámetro | Tipo | Filtro SQL |
|-----------|------|------------|
| `city` | string | `city = valor` |
| `min_price` | number | `announcement_price >= valor` |
| `max_price` | number | `announcement_price <= valor` |
| `min_bedrooms` | number | `bedrooms >= valor` |
| `max_bedrooms` | number | `bedrooms <= valor` |
| `area_clusters` | string (CSV) | `area_cluster IN (valores)` |
| `rental_type` | string | `rental_type = valor` |
| `min_sqm` | number | `square_meters >= valor` |
| `max_sqm` | number | `square_meters <= valor` |
| `min_bathrooms` | number | `bathrooms >= valor` |
| `max_bathrooms` | number | `bathrooms <= valor` |
| `has_elevator` | `"true"` | `has_elevator = true` |
| `has_garage` | `"true"` | `garage != 'No tiene' AND garage IS NOT NULL` |
| `has_terrace` | `"true"` | `has_terrace = true` |
| `exclude_ids` | string (CSV) | `property_unique_id NOT IN (valores)` |
| `search` | string | `address ILIKE '%valor%'` |

### Respuesta

```json
{
  "properties": [ /* PropertyRow[] */ ],
  "filterOptions": {
    "cities": ["Madrid", "Barcelona"],
    "areaClusters": ["Chamartín", "Salamanca"],
    "rentalTypes": ["Larga estancia", "Corta estancia"]
  }
}
```

- `properties`: Resultados filtrados, ordenados por `announcement_price ASC`.
- `filterOptions.cities`: Todas las ciudades con propiedades en estado "Publicado".
- `filterOptions.areaClusters`: Zonas disponibles, filtradas por la ciudad seleccionada.
- `filterOptions.rentalTypes`: Todos los tipos de alquiler existentes.

## Referencias

- Componente: `src/components/rentals/otras-propiedades-cartera.tsx`
- Hook: `src/hooks/use-published-properties.ts`
- API Route: `src/app/api/properties/published/route.ts`
- Tarjeta de resultado: `src/components/rentals/property-search-card.tsx`
- Tipos: `src/lib/supabase/types.ts` → tablas `properties`, `leads_properties`
