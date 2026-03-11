# Documentación Técnica: Automatización MTP "No Disponible" (Cascada Negativa)

Este documento define la lógica de negocio y las actualizaciones de UI que ocurren cuando una propiedad es adjudicada a un candidato final y el resto de interesados deben ser notificados y reubicados.

## 1. Disparador Global (Trigger)
* **Evento:** Una MTP cambia su estado final a `Interesado Aceptado` (o el estado equivalente de éxito final).
* **Acción en Cascada:** El sistema busca todas las demás MTPs asociadas a esa misma propiedad (mismo `property_id`) pertenecientes a otros Interesados, e inicia la re-evaluación de sus estados.

## 2. Lógica de Casos por Interesado Afectado

El sistema evalúa cada MTP afectada y aplica una de las siguientes lógicas:

### Regla A: MTPs Inactivas (Caso 2)
* Si la MTP está en `Rechazado por el Propietario` o `Rechazado por Finaer`: **No se hace nada** (Se respeta el rechazo original).
* Si la MTP está en `Descartada` o `En Espera`: Su estado cambia a `No Disponible`. No afecta a la fase global del Interesado.

### Regla B: Única MTP Activa (Casos 1 y 5)
Aplica si la MTP afectada era la única oportunidad activa del Interesado (ya fuera en fases tempranas o en "Calificación en Curso" o "Interesado Presentado" donde el resto se habían pausado).
* **MTP:** Cambia a estado `No Disponible`.
* **Lead (Interesado):** Retrocede a la fase inicial `Interesado Cualificado` (Casilla de salida).
  * **Etiqueta `[ 🔄 Recuperado ]`:** Solo se asigna si el Interesado estaba en una fase **más avanzada** que `Interesado Cualificado` (es decir, hubo un retroceso real de fase). Si el Interesado ya estaba en `Interesado Cualificado` cuando perdió su última MTP activa, **no** se asigna la etiqueta, ya que no ha habido retroceso.
  * **Notificación de recuperación automática:** Solo se genera cuando se asigna la etiqueta `Recuperado` (retroceso real). En caso contrario, las notificaciones individuales por MTP ya informan al PM.

### Regla C: Múltiples MTPs Activas (Casos 3 y 4)
Aplica si el Interesado tiene otras propiedades activas en juego.
* **MTP:** Cambia a estado `No Disponible`.
* **Lead (Interesado) - Recálculo de Fase:** El sistema evalúa las MTPs activas restantes. La tarjeta del Interesado asume automáticamente la fase de la *siguiente MTP más avanzada*. 

---

## 3. Sistema de Notificaciones UI y Registro

Para los afectados por las **Reglas B y C**, el sistema debe generar alertas visuales. Estas alertas se agruparán en una **nueva sección de trabajo llamada "Notificaciones"**, ubicada dentro de la pestaña *Espacio de Trabajo* de la tarjeta del Interesado. Estas alertas (Banners) son persistentes hasta que el PM pulsa `[ Marcar como leído / ✖ ]`.

### 3.1. Alerta de Urgencia (Cancelación de Visita)
* **Condición:** Si el estado anterior de la MTP afectada era `Visita Agendada`.
* **UI:** Un Banner color Rojo/Naranja de alta prioridad en la sección Notificaciones.
* **Texto:** *"🚨 **ACCIÓN REQUERIDA:** La propiedad [Dirección] ha sido alquilada a otro candidato. Debes contactar urgentemente con este interesado para **cancelar la visita** que teníais agendada."*

### 3.2. Alerta Informativa (Archivo de Propiedad)
* **Condición:** Para todos los demás estados activos previos.
* **UI:** Un Banner color Amarillo/Info en la sección Notificaciones.
* **Texto:** *"ℹ️ **Aviso del Sistema:** La propiedad [Dirección] ya no está disponible (alquilada a otro cliente). La oportunidad ha sido archivada automáticamente."* *(Si el lead retrocedió de fase, añadir: "El interesado ha sido reubicado en el embudo").*

### 3.3. Registro de Actividad (Log Inmutable) (Esto afecta solo a la sección de Registro de Actividad del Sidebar)
En el *Sidebar* de Actividad de la tarjeta, el sistema inyecta un resumen claro y automático que no se puede borrar:
* **Tipo de Evento:** `AUTOMATION / PROPERTY_UNAVAILABLE`
* **Mensaje:** *"🤖 [Acción del Sistema]: La MTP de la propiedad [Dirección] pasó a 'No Disponible' debido al cierre con otro candidato."*
* **Detalle Adicional:** *"El interesado retrocedió a la fase [Nueva Fase]"* (Si aplica).