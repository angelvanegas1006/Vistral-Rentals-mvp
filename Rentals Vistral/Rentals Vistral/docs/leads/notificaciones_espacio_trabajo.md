# Documentación Técnica: Sección de Notificaciones del Espacio de Trabajo

Este documento define el comportamiento completo del sistema de notificaciones que aparece dentro del Espacio de Trabajo de cada Interesado. Su objetivo es proporcionar información valiosa y accionable al Property Manager (PM) sobre situaciones críticas que requieren su atención.

---

## 1. Propósito y Ubicación

La sección **"Notificaciones"** es un bloque dinámico que se renderiza dentro de la pestaña *Espacio de Trabajo* de la tarjeta del Interesado, justo debajo del Widget de Progreso General.

- **Visibilidad condicional:** La sección solo aparece si existen notificaciones activas (no leídas) para ese Interesado. Si no hay ninguna, la sección desaparece por completo del DOM.
- **Contenido:** Se compone de uno o varios banners de alerta apilados verticalmente, cada uno con su propio estilo de color y botón de cierre.

---

## 2. Tipos de Notificación y Código de Colores

Existen tres tipos de notificación, definidos por el campo `notification_type` en la tabla `lead_notifications`. Cada tipo tiene un color asociado y un nivel de prioridad que determina su impacto visual tanto en la sección de notificaciones como en la tarjeta Kanban del Interesado.

| `notification_type` | Color | Variante UI | Prioridad | Situación |
|---|---|---|---|---|
| `urgent_visit_cancel` | Rojo | `danger` | 1 (máxima) | Propiedad no disponible y el Interesado tenía una visita agendada |
| `info_property_unavailable` | Amarillo / Ámbar | `warning` | 2 | Propiedad no disponible (estados activos previos distintos a Visita Agendada) |
| `recovery` | Azul | `info` | 3 | Interesado recuperado tras rechazo por Finaer o por el Propietario |

---

### 2.1. Notificación Roja: Cancelación de Visita Urgente (`urgent_visit_cancel`)

- **Condición de generación:** Se dispara durante la Cascada Negativa cuando una propiedad es adjudicada a otro candidato (`Interesado Aceptado`) y la MTP afectada del Interesado estaba en estado `Visita Agendada`.
- **Título:** *"ACCIÓN REQUERIDA: Cancelar visita"*
- **Mensaje:** *"La propiedad [Dirección] ha sido alquilada a otro candidato. Debes contactar urgentemente con este interesado para cancelar la visita que teníais agendada."*
- **Acción esperada del PM:** Contactar al interesado para cancelar la visita y luego cerrar la notificación.

### 2.2. Notificación Amarilla: Archivo Automático de Propiedad (`info_property_unavailable`)

- **Condición de generación:** Se dispara durante la Cascada Negativa cuando una propiedad es adjudicada a otro candidato y la MTP afectada del Interesado estaba en cualquier estado activo distinto a `Visita Agendada`.
- **Título:** *"Aviso del Sistema: Propiedad no disponible"*
- **Mensaje:** *"La propiedad [Dirección] ya no está disponible (alquilada a otro cliente). La oportunidad ha sido archivada automáticamente."*
- **Acción esperada del PM:** Tomar conocimiento. Si el Interesado ha retrocedido de fase, presentarle nuevas propiedades.

### 2.3. Notificación Azul: Interesado Recuperado tras Rechazo (`recovery`)

- **Condición de generación:** Se dispara cuando el PM pulsa "Recuperar Interesado" tras un rechazo por Finaer o por el Propietario. También se genera automáticamente si la Cascada Negativa deja al Interesado sin MTPs activas y lo reubica en la fase inicial.
- **Título:** *"Interesado recuperado"*
- **Mensaje (rechazo Finaer):** *"Este interesado fue rechazado por Finaer. Motivo: [motivo registrado]. Preséntale nuevas oportunidades o recupera sus propiedades archivadas/inactivas."*
- **Mensaje (rechazo Propietario):** *"Este interesado fue rechazado por el Propietario. Motivo: [motivo registrado]. Preséntale nuevas oportunidades o recupera sus propiedades archivadas/inactivas."*
- **Mensaje (reubicación por Cascada Negativa):** *"Este interesado ha sido recuperado porque la propiedad [Dirección] ya no está disponible. Preséntale nuevas propiedades o recupera las propiedades archivadas."*
- **Acción esperada del PM:** Buscar nuevas propiedades para el Interesado o recuperar MTPs archivadas desde la pestaña Archivo.

---

## 3. Reflejo de Color en la Tarjeta Mini Kanban

El color de la notificación de mayor prioridad activa se refleja visualmente en la tarjeta del Interesado dentro del tablero Kanban. Esto permite al PM identificar de un vistazo, sin necesidad de abrir la tarjeta, qué Interesados requieren atención.

### 3.1. Regla de Prioridad

Si un Interesado tiene varias notificaciones activas de distintos tipos simultáneamente, la tarjeta Kanban muestra el color de la notificación con mayor prioridad:

```
Rojo (urgent_visit_cancel)  >  Amarillo (info_property_unavailable)  >  Azul (recovery)
```

### 3.2. Comportamiento Visual

| Estado de notificaciones | Color de la tarjeta Kanban |
|---|---|
| Al menos una `urgent_visit_cancel` activa | Rojo (borde/fondo de alerta) |
| Sin rojas, al menos una `info_property_unavailable` activa | Amarillo/Ámbar |
| Sin rojas ni amarillas, al menos una `recovery` activa | Azul |
| Sin notificaciones activas | Estilo por defecto (sin color adicional) |

### 3.3. Actualización Dinámica

- Cuando el PM cierra (descarta) una notificación, el sistema recalcula el color de la tarjeta Kanban basándose en las notificaciones restantes.
- Si se cierra la última notificación, la tarjeta Kanban vuelve inmediatamente a su estilo por defecto.

---

## 4. Comportamiento de Cierre / Dismissal

Cada banner de notificación incluye un botón de cierre (`X`) en la esquina superior derecha.

1. **Al pulsar el botón de cierre:**
   - La notificación desaparece del DOM de forma inmediata (optimistic update).
   - Se envía un `PATCH` al endpoint `/api/leads/[leadId]/notifications` con el `notificationId`, que marca el registro como `is_read = true` en la base de datos.
2. **Si era la última notificación activa:**
   - La sección completa de "Notificaciones" desaparece del Espacio de Trabajo.
   - El color de la tarjeta Kanban vuelve al estilo por defecto.
3. **Persistencia:** Las notificaciones son persistentes. Permanecen visibles hasta que el PM las cierra manualmente. No desaparecen por expiración temporal ni por navegar fuera de la tarjeta.
4. **Idempotencia:** Una notificación cerrada no vuelve a aparecer. El registro permanece en la base de datos con `is_read = true` para auditoría, pero no se muestra al PM.

---

## 5. Tabla de Base de Datos: `lead_notifications`

Las notificaciones se almacenan en la tabla `lead_notifications`, creada en la migración `010_labels_notifications_cascade.sql`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único de la notificación |
| `leads_unique_id` | TEXT (NOT NULL) | ID del Interesado al que pertenece la notificación |
| `properties_unique_id` | TEXT (nullable) | ID de la propiedad relacionada (si aplica). NULL para notificaciones de tipo `recovery` generales |
| `notification_type` | TEXT (NOT NULL) | Tipo: `urgent_visit_cancel`, `info_property_unavailable`, o `recovery` |
| `title` | TEXT (NOT NULL) | Título breve del banner |
| `message` | TEXT (NOT NULL) | Mensaje descriptivo completo |
| `is_read` | BOOLEAN (default FALSE) | `false` = activa/visible, `true` = cerrada por el PM |
| `created_at` | TIMESTAMPTZ (default now()) | Fecha y hora de creación |

**Índice:** `idx_lead_notifications_lead` sobre `(leads_unique_id, is_read)` para consultas rápidas de notificaciones activas por Interesado.

---

## 6. Eventos que Generan Notificaciones

### 6.1. Cascada Negativa (Propiedad adjudicada a otro candidato)

Cuando una MTP alcanza el estado `Interesado Aceptado`, el sistema ejecuta la Cascada Negativa sobre las MTPs de otros Interesados que competían por la misma propiedad. Para cada MTP afectada que estaba en un estado activo:

- Si el estado anterior era `Visita Agendada` → se genera una notificación `urgent_visit_cancel`.
- Si el estado anterior era cualquier otro estado activo → se genera una notificación `info_property_unavailable`.
- Si el Interesado se queda sin MTPs activas y retrocede a la fase inicial → se genera adicionalmente una notificación `recovery`.

### 6.2. Recuperación tras Rechazo (Finaer o Propietario)

Cuando el PM pulsa "Recuperar Interesado" desde la tarjeta de una MTP rechazada por Finaer (`rechazado_por_finaer`) o por el Propietario (`rechazado_por_propietario`):

- El Interesado retrocede a la fase `Interesado Cualificado`.
- Se le asigna la etiqueta visual `Recuperado`.
- Se genera una notificación `recovery` que explica el motivo del rechazo y sugiere acciones al PM.

---

## 7. API de Notificaciones

**Endpoint:** `/api/leads/[leadId]/notifications`

| Método | Descripción | Parámetros |
|---|---|---|
| `GET` | Obtiene todas las notificaciones no leídas del Interesado | - |
| `PATCH` | Marca una notificación como leída | Body: `{ notificationId: string }` |

---

## 8. Restricciones de Redacción

- **Nunca** se usará el término "embudo" en ningún texto de notificación ni en la interfaz de usuario.
- Los textos deben ser claros, directos y orientados a la acción que debe tomar el PM.
