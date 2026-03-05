# Documentación Técnica: Acciones de Cierre Global (Perdido / Rechazado)

Esta sección define los controles de la interfaz y la lógica de base de datos para finalizar la gestión de un Interesado (Lead), ya sea porque se ha retirado o porque ha sido descartado por la agencia/propietario.

## 1. UI: Botones en el Header del Interesado
Se añaden dos botones de acción principal en la cabecera (Header) de la vista detallada del Interesado. Al hacer clic en cualquiera de ellos, se abre un modal de confirmación.

* **Botón 1:** `[ 📉 Interesado Perdido ]` (El cliente ya no busca o encontró otra cosa).
* **Botón 2:** `[ 🚫 Interesado Rechazado ]` (La agencia, Finaer o el Propietario descartan su perfil).

## 2. Modal de Cierre y Motivos
Al pulsar cualquiera de los dos botones, se abre un modal para recopilar el contexto del cierre.

### 2.1. Campos del Modal
* **Motivo (Select dinámico):**
  * *Si pulsó Perdido:* "Encontró otra opción", "No responde", "Presupuesto insuficiente", "Cambio de planes".
  * *Si pulsó Rechazado:* "Rechazado por Finaer", "Rechazado por Propietario", "Documentación falsa/incompleta", "Perfil conflictivo".
* **Comentarios (Textarea):** Campo libre para que el PM añada notas adicionales.
* **Acción:** Botón de confirmación (ej. `[ Confirmar Cierre ]`).

## 3. Lógica de Cascada en Base de Datos
Al confirmar el modal, el sistema ejecuta una actualización masiva (Transacción):

1. **Fase Global del Interesado:** La tarjeta del lead se mueve a la fase correspondiente en el Kanban principal (`Interesado Perdido` o `Interesado Rechazado`).
2. **Nuevos Estados Terminales MTP:** El sistema busca todas las MTPs de este lead que estuvieran activas y actualiza su registro en `leads_properties`:
   * `current_status` pasa a ser `Interesado Perdido` o `Interesado Rechazado` (heredando la decisión global).
   * `exit_reason` = [El motivo seleccionado en el modal].
   * `exit_comments` = [Los comentarios escritos en el modal].
   * *Efecto:* Al pasar a estos estados inactivos, todas las MTPs se mueven automáticamente a la pestaña "Archivo de Propiedades".
3. **Registro de Actividad (Sidebar):** Se inserta un evento tipo `PHASE_CHANGE` indicando la resolución y el motivo del cierre.

## 4. Reestructuración de la UI (Tabs en Fases Terminales)
Cuando la tarjeta del Interesado se encuentra en la fase `Interesado Perdido` o `Interesado Rechazado`, el entorno de trabajo cambia radicalmente. Desaparecen los tabs operativos (Espacio de Trabajo, Explorar Cartera) y se instaura una vista de consulta con **3 Tabs**:

* **Tab 1: Resolución (Vista Principal por defecto)**
  * Diseño limpio que muestra un resumen visual del cierre.
  * *Contenido:* Estado final (Perdido/Rechazado), Fecha de cierre, Motivo seleccionado y los Comentarios del PM.
* **Tab 2: Archivo de Propiedades `(⚠️ Componente ya definido)`**
  * Muestra el histórico de todas las MTPs (que ahora estarán todas en estado inactivo/rechazado/perdido).
* **Tab 3: Interesado `(⚠️ Componente ya implementado)`**
  * Display de sólo lectura con los datos personales y de contacto del cliente.