# Documentación Técnica: Resolución de Oportunidades (Finaer / Propietario) y Sistema de Etiquetas

Este documento define la lógica de negocio para gestionar el éxito o fracaso de un Interesado en las fases críticas del embudo, así como el sistema de etiquetas visuales para identificar el historial del lead en su fase inicial.

## 1. Sistema de Etiquetas de Interesado (Labels en el Kanban)

Para aportar contexto visual rápido al Property Manager (PM) en el tablero Kanban, se introducen dos etiquetas dinámicas. Estas etiquetas **solo existen y son visibles mientras el Interesado se encuentre en la Fase 1 (`Interesado Cualificado`)**. Al avanzar de fase, desaparecen de la UI.

* **Label `[ 🆕 Nuevo ]`:**
    * **Condición:** Se asigna automáticamente a un Interesado que acaba de ser creado en el sistema y se encuentra en la Fase 1 por primera vez.
* **Label `[ 🔄 Recuperado ]`:**
    * **Condición:** Se asigna a un Interesado que ha retornado a la Fase 1 (`Interesado Cualificado`) tras haber sufrido un rechazo o una caída en fases posteriores (ya sea por acción manual del PM o por una automatización de Cascada Negativa).

### 1.1. Nueva Sección de Trabajo: "Notificaciones"
Siempre que un Interesado posea la etiqueta `[ 🔄 Recuperado ]`, el sistema renderizará una nueva sección en el tab *Espacio de Trabajo*, ubicada justo debajo del Widget de Progreso General.
* **Contenido (Banner Dinámico):** Mostrará un resumen de la caída anterior. Ej: *"Este interesado ha sido recuperado desde la fase [Fase Previa] porque [Motivo del Rechazo/Archivo]. Preséntale nuevas propiedades o recupera las propiedades archivadas. En caso de que ya no esté interesado, puedes desechar al interesado."*

---

## 2. Casuística en Fase "Calificación en Curso" (Resolución Finaer)

En esta fase, la MTP principal del Interesado se encuentra en estado `Calificación en Curso`. La interfaz presenta una validación obligatoria para el PM mediante un **radio button** con la pregunta: **¿Ha sido aceptado el Interesado por Finaer?**

La sección de "Propiedad Seleccionada" se renderiza con el mismo estilo (`Phase2SectionWidget`) que en la fase Recogiendo Información: borde verde, título, instrucciones y checkmark.

### 2.1. Escenario A: Aprobado (SÍ)
1.  **UI — Información de Contacto del Propietario:** Al marcar "Sí" en el radio button, se despliega dentro de la sección de trabajo de la MTP un bloque con la información de contacto del propietario (nombre, teléfono, email).
2.  **UI — Confirmación de Presentación:** Se muestra un botón "Confirmar Presentación al Propietario" en la sección de trabajo de la MTP.
3.  **Acción del PM:** El PM contacta al propietario para presentarle el perfil (fuera de la app) y luego confirma la acción en la UI.
4.  **Transición:** Al confirmar, la MTP avanza al estado `Interesado Presentado` (lo que empuja al Lead a la fase global equivalente).

### 2.2. Escenario B: Rechazado (NO)
Al marcar "No" en el radio button, el flujo se desarrolla en **tres pasos secuenciales** sin cambiar el estado de la MTP hasta el final:

1.  **Paso 1 — Recopilación de Datos:** Se despliegan dos campos obligatorios dentro de la sección de trabajo:
    * **Motivo del Rechazo** (Dropdown): Ingresos insuficientes, Documentación incompleta, Historial crediticio negativo, Situación laboral inestable, Otro motivo.
    * **Comentarios** (Textarea): Campo libre obligatorio para detalles adicionales.
2.  **Paso 2 — Decisión Final del PM:** Una vez **ambos campos están completos**, se desbloquea un segundo radio button con la pregunta: *"¿Qué quieres hacer con este Interesado?"* con dos opciones:
    * **`[ 🚫 Descartar Interesado ]`:** Marca la MTP como rechazada y abre el modal de cierre global (que cambia la fase del Lead a Perdido/Rechazado, archivando todo su entorno).
    * **`[ 🔄 Recuperar Interesado ]`:** Marca la MTP como rechazada y recupera al Lead:
        * El Lead retrocede a la fase global `Interesado Cualificado`.
        * Se le asigna el label `[ 🔄 Recuperado ]`.
        * Se genera la alerta en la sección "Notificaciones" de su nuevo espacio de trabajo.
3.  **Paso 3 — Ejecución:** Solo cuando el PM selecciona una de las dos opciones y confirma, se ejecuta la transición:
    * La MTP cambia al estado inactivo `Rechazado por Finaer` (y se mueve a la pestaña Archivo).
    * Se ejecuta la acción correspondiente (cierre global o recuperación).

**Nota importante:** La MTP **NO** cambia a `Rechazado por Finaer` de forma instantánea al marcar "No". El cambio de estado se aplaza hasta que el PM haya completado los campos obligatorios y haya elegido una resolución (descartar o recuperar).

---

## 3. Casuística en Fase "Interesado Presentado" (Resolución Propietario)

En esta fase, la MTP se encuentra en estado `Interesado Presentado`. El PM espera la decisión del dueño de la vivienda. La interfaz presenta una validación obligatoria mediante un **radio button** con la pregunta: **¿Ha sido aceptado el Interesado por el Propietario?**

El formato y diseño es idéntico al de la fase "Calificación en Curso" (radio buttons con colores, header instructivo, misma estructura de flujo).

### 3.1. Escenario A: Aprobado (SÍ)
1.  **UI:** Al marcar "Sí", se muestra un botón "Confirmar Aceptación del Propietario".
2.  **Transición de Éxito:** Al confirmar, la MTP cambia al estado `Interesado Aceptado`.
3.  **Impacto Global:** La tarjeta del Interesado avanza a la fase final `Interesado Aceptado`.
4.  **Automatización:** Se dispara automáticamente la **Cascada Negativa** (definida en documentación previa), pasando a estado `No Disponible` las MTPs del resto de interesados que competían por esta vivienda.

### 3.2. Escenario B: Rechazado (NO)
Al marcar "No" en el radio button, el flujo es **idéntico al descrito en 2.2** (tres pasos secuenciales), con las siguientes diferencias:

1.  **Paso 1 — Recopilación de Datos:** Se despliegan los mismos campos obligatorios:
    * **Motivo del Rechazo** (Dropdown): Perfil no adecuado, Prefiere inquilino sin mascotas, Ingresos demasiado justos, Prefiere otro candidato, Otro motivo.
    * **Comentarios** (Textarea): Campo libre obligatorio.
2.  **Paso 2 — Decisión Final del PM:** Mismo comportamiento: segundo radio button con opciones `Descartar Interesado` y `Recuperar Interesado`.
3.  **Paso 3 — Ejecución:** Solo al confirmar una resolución:
    * La MTP cambia al estado inactivo `Rechazado por el Propietario` (y se mueve a la pestaña Archivo).
    * Se ejecuta la acción correspondiente (cierre global o recuperación).

**Nota importante:** Al igual que en Calificación en Curso, la MTP **NO** cambia a `Rechazado por el Propietario` de forma instantánea al marcar "No". El cambio se aplaza hasta que se complete el flujo de resolución.
