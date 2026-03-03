# Documentación Técnica: Modal de Recuperación de MTP

Esta sección define el proceso para reactivar una MTP que actualmente se encuentra en estado inactivo (`Descartada` o `En Espera`), devolviéndola a un estado activo del embudo.

## 1. Disparador (Trigger) y UI del Modal
* **Acceso:** Desde la pestaña "Archivo de Propiedades" o el Espacio de Trabajo (para las En Espera), al pulsar en el menú Kebab (`⋮`) de la MTP, se selecciona la acción `[ 📤 Recuperar Propiedad ]`.
* **Apertura:** Se abre el modal "Recuperar Oportunidad".

### 1.1. Campos del Modal
1. **Selector de Estado Destino (Dropdown/Select):**
   * El PM debe elegir a qué fase activa del embudo quiere devolver la MTP.
   * **Regla de Bloqueo Histórico:** El listado de opciones disponibles estará limitado. Solo se mostrarán los estados del embudo *hasta el último estado activo máximo* que alcanzó esa MTP antes de ser archivada/pausada. (Ej. Si se pausó estando en "Visita Agendada", el dropdown solo mostrará "Interesado Cualificado" y "Visita Agendada").

2. **Campo Condicional (Validación de Fecha de Visita):**
   * **Condición:** Si el PM selecciona el estado destino `Visita Agendada`.
   * **Validación interna:** El sistema comprueba el campo `visit_date` guardado en la base de datos para esa MTP.
   * **Acción:** Si `visit_date` es menor a la fecha/hora actual (es decir, la visita original ya caducó), el sistema bloquea el botón de confirmar y **despliega obligatoriamente un Datepicker** con el texto: *"⚠️ La fecha de la visita anterior ya ha expirado. Por favor, selecciona una nueva fecha y hora para reactivarla en este estado."*

3. **Botón de Acción:** `[ 📤 Confirmar Recuperación ]`

---

## 2. Lógica de Base de Datos y Cascada (Al Confirmar)

Al pulsar confirmar, el sistema ejecuta una transacción para mantener la integridad de los datos:

### 2.1. Actualización de la MTP
* `current_status` pasa al estado seleccionado en el modal.
* `exit_reason` y `exit_comments` se limpian (pasan a `null`), ya que la propiedad vuelve a estar viva.
* Si aplica, se actualiza el campo `visit_date` con la nueva fecha seleccionada.
* **UI:** La MTP abandona la pestaña "Archivo de Propiedades" y vuelve al "Espacio de Trabajo".

### 2.2. Recálculo de la Fase del Interesado (Cascada Ascendente)
* **Regla:** Dado que "La MTP más avanzada dicta la fase global", el sistema evalúa si la MTP recién recuperada es ahora la más avanzada del cliente.
* Si es así, la tarjeta global del Interesado **avanza o se ajusta** automáticamente en el Kanban a la fase correspondiente de esa MTP.

### 2.3. Registro de Actividad (Sidebar)
* Se inyecta un evento en la tabla `lead_events` para auditar la reactivación:
  * **Tipo:** `MTP_RECOVERED`
  * **Título:** *"Propiedad recuperada"*
  * **Descripción:** *"El PM recuperó la propiedad [Dirección] devolviéndola al estado [Estado Seleccionado]."*. (Si se cambió la fecha de visita, añadir: *"Nueva fecha agendada: [Fecha]"*).