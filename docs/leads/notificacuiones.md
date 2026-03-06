# Documentación Técnica: Sistema de Notificaciones Inteligentes y Sincronización de Kanban

Este documento define la implementación de un sistema de notificaciones persistentes y jerárquicas para la tarjeta del Interesado (Lead), incluyendo el reflejo visual de su urgencia en el Kanban global.

## 1. Arquitectura de Datos (Base de Datos)

### Tabla `lead_notifications` (Supabase)

| Columna | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | auto-generado | Clave primaria |
| `leads_unique_id` | `text` | NOT NULL | — | FK al Lead |
| `properties_unique_id` | `text` | NULL | — | FK a la propiedad relacionada (null si no aplica, ej. recovery) |
| `notification_type` | `text` | NOT NULL | — | Tipo de notificación (ver tabla de tipos abajo) |
| `title` | `text` | NOT NULL | — | Título corto de la notificación |
| `message` | `text` | NOT NULL | — | Cuerpo completo del mensaje (puede contener markdown) |
| `is_read` | `boolean` | NOT NULL | `false` | Si el PM ha cerrado/leído la notificación |
| `created_at` | `timestamptz` | NOT NULL | auto-generado | Fecha de creación |

### Valores de `notification_type` y su mapeo a color/prioridad

| `notification_type` | Color Kanban | Prioridad | Variante UI | Descripción |
|---|---|---|---|---|
| `urgent_visit_cancel` | Rojo | 1 (máxima) | `danger` | Visita que debe cancelarse urgentemente |
| `auto_recovery` | Amarillo | 2 | `warning` | Lead devuelto automáticamente a casilla de salida |
| `phase_auto_move` | Amarillo | 2 | `warning` | Movimiento automático de fase por cascada negativa |
| `info_property_unavailable` | Amarillo | 2 | `warning` | Propiedad ya no disponible (no requiere cancelar visita) |
| `recovery` | Azul | 3 | `info` | Lead recuperado manualmente por el PM |

## 2. Reglas de UI/UX: Espacio de Trabajo (Workspace)
* **Ubicación:** Sección "Notificaciones" en la parte superior del tab *Espacio de Trabajo* de la tarjeta del Interesado (`LeadNotificationsSection`).
* **Renderizado Condicional:** Solo visible si existe al menos una notificación con `is_read == false` para ese Lead. Si no hay ninguna, la sección completa desaparece.
* **Interacción (Dismiss):** Cada alerta tiene un botón de cerrar. Al pulsarlo, se actualiza la BD (`is_read = true` via `PATCH /api/leads/[leadId]/notifications`) y desaparece de la UI. Se emite el evento `LEAD_NOTIFICATIONS_CHANGED` para actualizar el Kanban.

## 3. Reglas de UI/UX: Sincronización del Kanban (Color Matching)
El color de la tarjeta del Interesado en el tablero Kanban refleja el nivel de urgencia de sus notificaciones no leídas.
* **Lógica de Prioridad Estricta:** El endpoint `GET /api/leads/notifications-summary` evalúa las notificaciones no leídas (`is_read == false`) y el hook `useLeadNotificationsSummary` mapea `notification_type` → color:
  1. Si existe `urgent_visit_cancel` (prioridad 1) ➔ Tarjeta Roja.
  2. Else if existe `auto_recovery`, `phase_auto_move` o `info_property_unavailable` (prioridad 2) ➔ Tarjeta Amarilla.
  3. Else if existe `recovery` (prioridad 3) ➔ Tarjeta Azul.
  4. Else ➔ Tarjeta Blanca (Default).
* **Reactividad:** El Kanban se actualiza por tres vías: polling cada 2s, escucha Realtime de Supabase (`postgres_changes` en la tabla `lead_notifications`), y evento `LEAD_NOTIFICATIONS_CHANGED` al cerrar una notificación.

## 4. Tipos de Notificaciones y Triggers (Automatizaciones)

Implementar los siguientes disparadores (triggers) en el backend/lógica de negocio para insertar filas en `lead_notifications`:

### 4.1. Prioridad ROJA — `urgent_visit_cancel`
* **Trigger:** Cascada negativa al aceptar a otro candidato (`interesado_aceptado`): si la MTP afectada estaba en `visita_agendada`, se inserta este tipo.
* **Origen:** `POST /api/leads/[leadId]/properties/[lpId]/transition` (sección cascada negativa).
* **Título:** "ACCIÓN REQUERIDA: Cancelar visita"
* **Mensaje:** "🚨 **ACCIÓN REQUERIDA:** La propiedad [Dirección] ya no está disponible. Contacta urgentemente al interesado para CANCELAR la visita."

### 4.2. Prioridad AMARILLA — `info_property_unavailable` / `phase_auto_move` / `auto_recovery`

Se disparan durante la cascada negativa cuando otro candidato es aceptado (`interesado_aceptado`) y las MTPs de otros leads para esa propiedad pasan a `no_disponible`.

* **`info_property_unavailable`** — La MTP afectada estaba activa (incluye `en_espera`) pero NO en `visita_agendada`. Se crea para cualquier MTP que no estuviera ya en un estado terminal (`descartada`, `no_disponible`, `interesado_perdido`, `interesado_rechazado`, `rechazado_por_finaer`, `rechazado_por_propietario`):
  * **Título:** "Aviso del Sistema: Propiedad no disponible"
  * **Mensaje:** "⚠️ **Aviso del Sistema:** La propiedad [Dirección] ya no está disponible (alquilada a otro cliente). La oportunidad ha sido archivada automáticamente."

* **`phase_auto_move`** — El Lead aún conserva otras MTPs activas pero cambió de fase:
  * **Título:** "Movimiento Automático de Fase"
  * **Mensaje:** "⚠️ **Aviso del Sistema:** Esta tarjeta se ha movido automáticamente de la fase [Fase Anterior] a [Nueva Fase] porque la propiedad [Dirección] ya no está disponible."

* **`auto_recovery`** — El Lead se queda sin MTPs activas:
  * **Acción adicional:** El sistema asigna el label `recuperado` y devuelve al Lead a `Interesado Cualificado`.
  * **Título:** "Recuperación Automática"
  * **Mensaje:** "⚠️ **Recuperación Automática:** El interesado ha vuelto a la casilla de salida porque su única opción activa ([Dirección]) fue asignada a otro perfil. Presenta nuevas opciones o descártalo."

### 4.3. Prioridad AZUL — `recovery`
* **Trigger:** El PM pulsa el botón de recuperar un lead rechazado (via `POST /api/leads/[leadId]/recover`).
* **Comportamiento:** El Lead vuelve a `Interesado Cualificado` con label `recuperado`. Las MTPs archivadas NO se reviven — permanecen en el estado en que estaban al momento de la recuperación.
* **Título:** "Interesado recuperado"
* **Mensaje:** "ℹ️ **Lead Recuperado:** Has reactivado a este interesado tras ser rechazado en [Fase de rechazo]. Preséntale nuevas opciones o recupera propiedades archivadas."

### 4.4. TODO: `property_resurrection` (Pendiente de implementar)
* **Trigger:** Una propiedad en estado Cierre/Alquilada se cae y el PM la devuelve a "Comercialización/Disponible".
* **Lógica de Cascada Positiva:** Buscar todas las MTPs de esa propiedad en `no_disponible` y pasarlas a `en_espera`.
* **Filtro de Lead:** Solo generar la notificación si el Lead sigue en una fase activa del embudo (excluir leads en 'Perdido' o 'Aceptado').
* **Mensaje propuesto:** "🔵 **Nueva Oportunidad:** La propiedad [Dirección] que estaba perdida ha vuelto al mercado. Su estado se ha actualizado a 'En Espera'. Puedes reactivarla si el candidato sigue interesado."
* **Nota:** Requiere detectar el cambio de estado de la propiedad en el Kanban de Captación (de "Alquilada/Cierre" a "Disponible/Comercialización"), implementar la cascada positiva de MTPs (`no_disponible` → `en_espera`), y generar la notificación azul para cada lead afectado que siga activo. Ver `TODO` en `transition/route.ts`.