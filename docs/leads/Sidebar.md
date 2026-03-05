# Documentación Técnica: Sidebar de "Registro de Actividad" (Event Log)

Esta sección define la arquitectura y UI de la barra lateral (Sidebar) en la tarjeta del Interesado. Su función es servir como un rastro de auditoría (Audit Trail) inmutable de todo lo que ocurre con este lead y sus propiedades.

## 1. Esquema de Base de Datos (Tabla: `lead_events`)

Para alimentar este log de forma eficiente y desconectada de los cálculos en tiempo real, se utilizará una tabla dedicada.

**Campos requeridos:**
* `id` (UUID / Incremental)
* `leads_unique_id` (TEXT. Relación con el Interesado)
* `properties_unique_id` (TEXT. Nullable. Relación con la Propiedad que detonó el evento, si aplica)
* `event_type` (String. Clasificador para renderizar iconos/colores en UI. Valores: `PROPERTY_ADDED`, `MTP_UPDATE`, `PHASE_CHANGE`, `PHASE_CHANGE_BACKWARD`, `MTP_ARCHIVED`)
* `title` (String. Título corto del evento)
* `description` (Text. Explicación contextual del suceso)
* `new_status` (TEXT. Nullable. ID del estado MTP resultante de la transición, ej. `"visita_agendada"`. Usado por el modal Historial y Correcciones para timestamps precisos)
* `created_at` (Timestamp)

---

## 2. Diccionario de Eventos (Triggers de Backend)

El sistema debe insertar un nuevo registro en `lead_events` cuando ocurran las siguientes acciones:

### Evento 1: Vinculación Inicial
* **Trigger:** Se añade una propiedad al "Espacio de trabajo" o "Gestión" del Interesado.
* `event_type`: `PROPERTY_ADDED`
* `title`: "Nueva propiedad en gestión"
* `description`: "Se ha vinculado la propiedad [Dirección] a este interesado."

### Evento 2: Cambio de Estado MTP (Sin cambio de fase global)
* **Trigger:** Una MTP avanza o retrocede, pero NO altera la fase global del Interesado.
* `event_type`: `MTP_UPDATE`
* `title`: "Actualización en [Dirección]"
* `description`: "El estado de la propiedad ha cambiado a: [Nuevo Estado]."

### Evento 3: Cambio de Fase Global (Causa + Efecto)
* **Trigger:** Una MTP cambia de estado Y esto provoca que la tarjeta del Interesado avance o retroceda de fase en el Kanban.
* *Nota de Lógica:* Para evitar duplicidades visuales, este evento absorbe al Evento 2.
* `event_type`: `PHASE_CHANGE`
* `title`: "Movimiento a: [Nombre Nueva Fase del Kanban]"
* `description`: "El interesado ha cambiado de fase porque la propiedad [Dirección] ha pasado al estado [Nuevo Estado MTP]."
* *Caso de automatización negativa:* "El interesado retrocede a [Fase Anterior] porque la propiedad más avanzada ([Dirección]) ha sido alquilada a otro cliente."

### Evento 4: Desactivación / Archivo de MTP
* **Trigger:** Una MTP pasa a Descartada, En Espera o No Disponible.
* `event_type`: `MTP_ARCHIVED`
* `title`: "Propiedad Archivada: [Dirección]"
* `description`: "Estado: [Descartada/En Espera/No Disponible]. Motivo: [exit_reason]."

---

## 3. UI del Sidebar (Frontend)

El Sidebar se mostrará en el lateral derecho de la vista detallada del Interesado.

### 3.1. Estructura General
* **Título del Sidebar:** "Registro de Actividad"
* **Orden:** Cronológico inverso (`ORDER BY created_at DESC`), mostrando lo más reciente arriba.

### 3.2. Estructura del Item de Evento (Card/Nodo)
Cada evento en la lista debe renderizarse con la siguiente estructura visual:
1.  **Label / Icono (Izquierda):** Un icono o punto de color basado en el `event_type` (ej. Azul para info, Verde para avance, Rojo/Gris para archivo).
2.  **Cuerpo (Derecha):**
    * **Título:** Texto principal en negrita (`title`).
    * **Timestamp:** Fecha y hora en formato amigable (ej. "Hoy, 10:30" o "Hace 2 días").
    * **Descripción:** Texto secundario en gris con el contexto (`description`).