# Documentación Técnica: Automatización "Cascada de Éxito del Interesado"

Este documento define la limpieza automática del embudo (pipeline) de un Interesado cuando este resulta ganador (aceptado) en una propiedad específica.

## 1. Disparador (Trigger)

* **Evento:** Una MTP (Match Tenant-Property) cambia su estado a `Interesado Aceptado`.
* **Sujeto:** El Interesado (Lead) asociado a esa MTP.
* **Ubicación en código:** `POST /api/leads/[leadId]/properties/[lpId]/transition` — dentro del bloque `if (targetStatus === "interesado_aceptado")`, después de la Cascada Negativa.

## 2. Lógica de Cascada (Limpieza de MTPs restantes)

Dado que el Interesado ya ha asegurado una vivienda, sus demás opciones en el sistema quedan invalidadas.

* **Búsqueda:** El sistema busca todas las demás MTPs asociadas a ese mismo `lead_id` (el inquilino ganador) excluyendo la MTP que acaba de ser aceptada.
* **Filtro:** Selecciona únicamente aquellas MTPs que se encuentren en estado `En Espera` o cualquier estado activo (`interesado_cualificado`, `visita_agendada`, `pendiente_de_evaluacion`, `esperando_decision`, `recogiendo_informacion`, `calificacion_en_curso`, `interesado_presentado`).
* **Ignoradas:** Las MTPs en estados inactivos terminales se ignoran y conservan su estado original:
  * `descartada`
  * `no_disponible`
  * `rechazado_por_finaer`
  * `rechazado_por_propietario`
  * `interesado_perdido`
  * `interesado_rechazado`

### Acción de Actualización

Para cada MTP filtrada:

| Campo | Valor |
|---|---|
| `current_status` | `descartada` |
| `previous_status` | valor actual de `current_status` (antes de la cascada) |
| `exit_reason` | `cierre_automatico_aceptado` |
| `exit_comments` | *"Cierre automático: El interesado ha sido aceptado para otra propiedad."* |

## 3. Registro de Actividad (Eventos)

Por cada MTP descartada en la cascada, se inserta un registro en `lead_events`:

| Campo | Valor |
|---|---|
| `event_type` | `MTP_ARCHIVED` |
| `title` | *"Propiedad Descartada: [Dirección]"* |
| `description` | *"Estado: Descartada. Causa: El interesado ha sido aceptado para la propiedad [Dirección de la propiedad ganadora]."* |
| `new_status` | `descartada` |

**No se generan notificaciones** (`lead_notifications`) para esta cascada, ya que es un resultado positivo para el Interesado y no requiere acción del PM.

## 4. Impacto en la Fase del Lead

No requiere recálculo de fase. La MTP ganadora tiene status `interesado_aceptado` (rango 8, el más alto), por lo que la fase del Lead ya es `Interesado Aceptado` independientemente del estado de las demás MTPs.

## 5. Idempotencia

Si la transición se ejecuta más de una vez, la segunda ejecución no encontrará MTPs pendientes de descartar (ya estarán en `descartada`), por lo que la operación es segura ante reintentos.

## 6. Relación con otras Cascadas

Esta cascada convive con otras dos que se disparan en el mismo evento (`interesado_aceptado`):

| Cascada | Alcance | Estado destino | Descripción |
|---|---|---|---|
| **Cascada Negativa** | Otros leads, misma propiedad | `no_disponible` | Las MTPs de otros candidatos para la misma propiedad se archivan como no disponibles. Ver `logica_no_disponible.md`. |
| **Cascada de Éxito** (este doc) | Mismo lead, otras propiedades | `descartada` | Las demás MTPs del lead ganador se descartan automáticamente. |
| **Cascada Calificación** | Mismo lead, otras propiedades | `en_espera` | Se dispara al entrar en `calificacion_en_curso` (previa a esta). Las MTPs ya estarán en `en_espera` cuando se llegue a `interesado_aceptado`. |

### Orden de ejecución

```
MTP → interesado_aceptado
  │
  ├─ 1. Cascada Negativa (otros leads → no_disponible)
  │
  └─ 2. Cascada de Éxito (mismo lead → descartada)
```
