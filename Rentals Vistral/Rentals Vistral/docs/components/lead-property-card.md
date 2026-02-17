# LeadPropertyCard

Componente de tarjeta reutilizable que representa la relación entre un lead y una propiedad (`leads_properties`). Se usa en el **Espacio de trabajo** del detalle del lead cuando la fase es **Perfil cualificado**.

## Propósito

Permite al usuario ver información resumida de cada propiedad asignada al lead y realizar tareas específicas por fase (por ejemplo, registrar la fecha de visita agendada en Perfil cualificado).

## Estructura visual

```
┌─────────────────────────────────────────────────────────────────┐
│  [Foto]  Dirección de la propiedad                    [Ver más]  │
│          area_cluster · precio €/mes · N hab.                    │
├─────────────────────────────────────────────────────────────────┤
│  Sección de trabajo (slot flexible)                              │
│  - Perfil cualificado: Fecha de visita agendada                  │
│  - Otras fases: campos según corresponda                        │
└─────────────────────────────────────────────────────────────────┘
```

- **Header horizontal:** Foto de la propiedad (80x80 o 96x96), información (dirección, area_cluster, precio, habitaciones) y botón "Ver más detalles".
- **Sección de trabajo:** Contenido inyectado vía prop `workSection`. Cambia según la fase del lead.

## Flujo de datos

```mermaid
flowchart LR
    subgraph DB [Base de datos]
        LP[leads_properties]
        P[properties]
    end
    
    subgraph API [API Server]
        GET[GET /api/leads/leadId/properties]
        PATCH[PATCH /api/leads-properties/id]
    end
    
    subgraph Hook [useLeadProperties]
        HookFetch[fetch] --> GET
        GET --> LP
        GET --> P
        GET --> Items[items]
    end
    
    subgraph Card [LeadPropertyCard]
        Items --> Card
        Card --> Modal[Modal PropertySummaryTab]
    end
    
    subgraph Work [workSection]
        Card --> Work
        Work -->|updateLeadsProperty| PATCH
        PATCH --> LP
    end
```

### Datos de entrada

| Origen | Campo | Descripción |
|--------|-------|-------------|
| `leads_properties` | `id` | UUID del registro |
| `leads_properties` | `leads_unique_id` | ID del lead (ej: LEAD-001) |
| `leads_properties` | `properties_unique_id` | ID de la propiedad (ej: PROP-001) |
| `leads_properties` | `scheduled_visit_date` | Fecha de visita agendada (DATE, nullable) |
| `properties` | `address`, `area_cluster`, `announcement_price`, `bedrooms`, `pics_urls`, etc. | Datos de la propiedad |

### Persistencia de cambios

- **Fecha de visita agendada:** Se guarda en `leads_properties.scheduled_visit_date` mediante `PATCH /api/leads-properties/[id]`.
- El servicio `updateLeadsProperty` en `src/services/leads-sync.ts` realiza la llamada.

## Reutilización

### Cambiar la sección de trabajo según fase

La prop `workSection` es un slot. Puedes pasar diferentes componentes según la fase:

```tsx
// Fase Perfil cualificado
<LeadPropertyCard
  leadsProperty={lp}
  property={prop}
  workSection={
    <LeadPropertyCardWorkPerfilCualificado
      leadsProperty={lp}
      onUpdated={refetch}
    />
  }
/>

// Otra fase (ejemplo futuro)
<LeadPropertyCard
  leadsProperty={lp}
  property={prop}
  workSection={<LeadPropertyCardWorkOtherPhase ... />}
/>
```

### Crear una nueva sección de trabajo

1. Crea un componente que reciba `leadsProperty` (y opcionalmente `property`).
2. Usa `updateLeadsProperty` o la API correspondiente para persistir cambios.
3. Pásalo como `workSection` a `LeadPropertyCard`.

## Integración

| Ubicación | Condición |
|-----------|-----------|
| `LeadTasksTab` | Solo cuando `lead.currentPhase === "Perfil cualificado"` |

El archivo `src/components/rentals/lead-tasks-tab.tsx` usa `useLeadProperties(lead.leadsUniqueId)` para obtener las tarjetas y las renderiza solo en esa fase.

## Dependencias

- **Hooks:** `useLeadProperties` (`src/hooks/use-lead-properties.ts`) — usa API, no Supabase en cliente
- **API:** `GET /api/leads/[leadId]/properties` (leadId = leads_unique_id)
- **Servicios:** `updateLeadsProperty` (`src/services/leads-sync.ts`)
- **Componentes:** `PropertySummaryTab` (modal "Ver más detalles"), `LeadPropertyCardWorkPerfilCualificado`
- **API:** `PATCH /api/leads-properties/[id]`

## Migración

Antes de usar el campo `scheduled_visit_date`, ejecutar:

```sql
-- SQL/add_scheduled_visit_date_leads_properties.sql
ALTER TABLE leads_properties
ADD COLUMN IF NOT EXISTS scheduled_visit_date DATE;
```

## Archivos relacionados

- `src/app/api/leads/[leadId]/properties/route.ts` - API GET para obtener leads_properties + properties
- `src/components/rentals/lead-property-card.tsx` - Componente principal
- `src/components/rentals/lead-property-card-work-perfil-cualificado.tsx` - Sección de trabajo para Perfil cualificado
- `src/components/rentals/lead-tasks-tab.tsx` - Integración
- `src/hooks/use-lead-properties.ts` - Hook de datos
- `src/services/leads-sync.ts` - Servicio de actualización
- `src/app/api/leads-properties/[id]/route.ts` - API PATCH
