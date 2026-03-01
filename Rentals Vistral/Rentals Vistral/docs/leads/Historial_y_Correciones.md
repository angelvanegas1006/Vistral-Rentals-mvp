# Documentación Técnica: Modal "Historial y Correcciones" (Kebab Menu)

Esta sección define el modal accesible desde el menú Kebab (`⋮`) de la MTP bajo la opción **"Historial y Correcciones"**. Su objetivo es visualizar la trazabilidad de la propiedad y permitir retrocesos a estados anteriores.

> **Nota:** Este modal sustituye al antiguo banner "Anterior: [Estado] | Deshacer" que aparecía entre el header y la sección de trabajo de la MTP. Toda la funcionalidad de reversión se centraliza ahora en este modal.

## 1. UI del Modal: Timeline de Estados

El modal se estructura como una línea de tiempo vertical (Stepper) que muestra la historia de la MTP desde su creación hasta su estado actual, incluyendo los estados futuros (en gris/deshabilitados).

### 1.1. Estructura de un Nodo (Paso en el Timeline)
Cada estado de la MTP se representa como un bloque:
* **Indicador Visual:** Un círculo. El estado actual (Current) está resaltado con un anillo y mayor tamaño. Los estados pasados tienen un círculo relleno. Los futuros están en gris/transparente.
* **Cabecera del Nodo:** Nombre del Estado (ej. "Pendiente de Evaluación"). El estado actual lleva una etiqueta "Actual".
* **Timestamp:** Fecha y hora extraídas de la tabla `lead_events` (campo `created_at` del evento cuyo `new_status` coincide con el estado del nodo). Esto proporciona timestamps precisos de cada transición, independientes del campo `updated_at` de `leads_properties`.
* **Cuerpo del Nodo (Datos):** Muestra en formato solo-lectura los datos asociados a esa fase extraídos de `leads_properties` (ej. Fecha de visita, Feedback del PM, estado Finaer). Solo se muestran datos si existen. Los nodos futuros no muestran datos.

### 1.2. Acción de Corrección (Revertir a Estado Anterior)
En todos los nodos que representen un **estado pasado** (anteriores al `current_status` actual), se mostrará un botón secundario:
* **Botón:** `[ ↩️ Revertir ]`
* **Comportamiento al hacer clic:**
    1.  El sistema dispara la acción `revert` a través de la API de transiciones.
    2.  Si el cambio implica un cambio de fase global del Interesado, se muestra el **Modal de Confirmación de Transición** (definido en el Documento Maestro).
    3.  Si el usuario confirma (o no se requiere confirmación), el `current_status` de la MTP se actualiza al estado seleccionado.
    4.  Se guarda el estado anterior en `previous_status` (para preservar la compatibilidad con la funcionalidad de Recuperar en MTPs archivadas).
    5.  **Regla de Integridad de Datos:** Los datos rellenados en fases posteriores NO se borran de la base de datos (ej. `sent_to_finaer_at` no se pone a null). Quedan almacenados para que, si la MTP vuelve a avanzar, los inputs se muestren pre-completados.

## 2. Ventajas del Diseño para el Frontend
* Al centralizar el historial y la reversión en este modal, la tarjeta principal (MTP) queda limpia de botones/banners de retroceso.
* Permite saltos de múltiples pasos (ej. De "Calificación en Curso" directo a "Visita Agendada") sin requerir deshacer secuencialmente uno por uno.
* Los estados futuros se muestran en gris para que el PM tenga visibilidad del pipeline completo.

## 3. Fuente de Datos: `lead_events`

Los timestamps del timeline se obtienen de la tabla `lead_events`, no de los campos de `leads_properties` (que son imprecisos porque `updated_at` se sobreescribe con cada actualización).

### 3.1. Campo `new_status` en `lead_events`
Cada evento registrado incluye un campo `new_status` (TEXT, nullable) que almacena el ID del estado MTP resultante de la transición (ej. `"visita_agendada"`, `"pendiente_de_evaluacion"`). Esto permite mapear cada evento a un nodo del timeline sin parsear texto libre.

### 3.2. API de consulta
El modal consume `GET /api/leads/[leadId]/properties/[lpId]/events`, que devuelve los eventos filtrados por lead + propiedad, ordenados cronológicamente. Para cada estado, se usa el timestamp del evento más reciente con ese `new_status`.

### 3.3. Fallback
Si no hay eventos en `lead_events` (registros históricos sin `new_status`), el modal usa `created_at` de `leads_properties` como fallback para el estado inicial.

## 4. Log de Actividad
Al ejecutar una reversión de estado desde este modal, el sistema dispara un evento de tipo `MTP_UPDATE` o `PHASE_CHANGE` / `PHASE_CHANGE_BACKWARD` en la tabla `lead_events` (Sidebar) para dejar constancia de la corrección manual.

## 5. Referencias Técnicas
* **Componente:** `src/components/rentals/mtp-modal-registro-actividad.tsx`
* **API de transición:** `src/app/api/leads/[leadId]/properties/[lpId]/transition/route.ts` (action: `"revert"`)
* **API de eventos:** `src/app/api/leads/[leadId]/properties/[lpId]/events/route.ts`
* **Hook:** `src/hooks/use-mtp-transition.ts`
* **Migración:** `supabase/migrations/005_add_new_status_to_lead_events.sql`
