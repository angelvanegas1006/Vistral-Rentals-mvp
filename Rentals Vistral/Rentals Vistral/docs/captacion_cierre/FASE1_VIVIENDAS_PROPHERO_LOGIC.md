# Fase 1: Viviendas Prophero - Lógica Completa

**Documento Fuente de Verdad**  
Este documento contiene toda la lógica detallada para la implementación de la Fase 1: Viviendas Prophero.

---

## Normas Generales de Subestado

Las siguientes normas determinan el subestado de la tarjeta en la Fase 1: Viviendas Prophero:

1. **Norma 1**: Siempre que haya un campo de "¿Es correcta esta información?" en BLANCO/NULL, el subestado de la tarjeta será **"Pendiente de revisión"**.

2. **Norma 2**: Si no hay ningún campo "¿Es correcta esta información?" en BLANCO/NULL y hay alguno en NO, el subestado de la tarjeta será **"Pendiente de información"**.

3. **Norma 3**: Si hay campos "¿Es correcta esta información?" en NO y campos en NULL, el estado será **"Pendiente de revisión"** (NULL/blanco es más restrictivo y tiene prioridad).

---

## Botón "Enviar Comentarios"

### Condiciones de Aparición

El botón de "Enviar comentarios" debe aparecer cuando se detecten nuevos comentarios en las secciones de comentarios.

### Condiciones de Activación

El botón solo debe activarse cuando se cumplan TODAS las siguientes condiciones:

1. **Todos los campos de "¿Es correcta esta información?" estén completos** en todas las secciones (ningún campo en NULL).
2. **Todas las cajas de comentarios de las secciones** en las que "No" sea la respuesta a "¿Es correcta esta información?", estén completas (no vacías).

### Validación y Mensajes de Error

Si se intenta pulsar el botón de "Enviar comentarios" antes de cumplir las condiciones previamente descritas, debe aparecer un mensaje de error toast que advierta del motivo por el cual no se puede desarrollar esta acción.

**Mensajes de error posibles:**
- "No se pueden enviar comentarios. Faltan secciones por revisar."
- "No se pueden enviar comentarios. Faltan comentarios en las secciones marcadas como incorrectas."
- "No se pueden enviar comentarios. Faltan secciones por revisar y comentarios por completar."

### Comportamiento Después del Envío

Después de enviar comentarios:
- El botón debe deshabilitarse hasta que haya nuevos comentarios o se editen los existentes.
- El subestado de la tarjeta debe cambiar a **"Pendiente de información"**.

---

## Subestados en Tarjetas Kanban

Los subestados de las tarjetas en la Fase 1: Viviendas Prophero deben mostrarse como **tags en la esquina superior derecha** de las tarjetas minikanban.

**Estilos de tags:**
- **"Pendiente de revisión"**: Badge amarillo/naranja claro (`bg-yellow-100 text-yellow-800`)
- **"Pendiente de información"**: Badge naranja (`bg-orange-100 text-orange-800`)
- **Sin subestado** (todas las secciones en "Sí"): No mostrar tag

---

## Estado: Inicial

### Comportamiento

1. La tarjeta recién creada aparecerá en el kanban en el estado **"Pendiente de revisión"**.

2. Al entrar a la tarjeta, **todas las secciones se encuentran desplegadas**.

3. Todos los campos "¿Es correcta esta información?" deben estar **en blanco** (NULL).

---

## Estado: Primera Revisión

### Comportamiento al Marcar "Sí"

1. Si se marca la respuesta **"Sí"** a "¿Es correcta esta información?", la sección se **encoge** (colapsa).

2. **Que la respuesta sea "Sí"** en una fase a la pregunta "¿Es correcta esta información?" significa que esa fase está completa. Tener en cuenta para el **Widget de Progreso General**.

3. Si la respuesta en **todas las secciones** a "¿Es correcta esta información?" es **"Sí"**, se habilitará el avance de la propiedad/tarjeta a la siguiente fase. Esto equivale a que el **Progreso General = 100%**.

### Comportamiento al Marcar "No"

1. Si se marca la respuesta **"No"** a "¿Es correcta esta información?":
   - Se abre el cuadro para dejar comentarios.
   - En el caso de que falte algún documento o dato/información de algún campo de la sección, el cuadro de comentarios debe estar **prerrellenado** con un texto explicativo parecido a: "Falta [nombre del campo/documento]". Una línea de texto por cada campo/documento faltante.
   - El texto debe ser **profesional, explicativo y sencillo**.

### Comportamiento del Botón "Enviar Comentarios"

#### Cuando se Pulsa el Botón (Habilitado)

Cuando se pulse el Botón "Enviar comentarios" cuando este esté habilitado:

1. **Lo correcto sería deshabilitar el botón** de "Enviar comentarios" hasta que haya nuevos comentarios o se editen.

2. **Cambiar el subestado** de la tarjeta en la Fase 1: Viviendas Prophero a **"Pendiente de información"**.

3. Cuando entro a una tarjeta en el subestado "Pendiente de información" debo ver:
   - Las secciones con respuesta **"Sí"** a "¿Es correcta esta información?" **colapsadas**.
   - Las secciones con respuesta **"No"** a "¿Es correcta esta información?" **desplegadas**, en **color naranja** y con su sección de comentarios.

### Modificación de Comentarios

Si se modifica alguna de las secciones de comentarios, el botón de "Enviar comentarios" deberá volver a aparecer (Debe seguir la lógica descrita anteriormente sobre su funcionamiento). Es pura lógica: si aparecen comentarios nuevos, debo enviarlos.

Se puede modificar alguna de las secciones de comentarios por las siguientes razones:

1. **Alguna de las secciones** en las que la respuesta a "¿Es correcta esta información?" era **"Sí"** ha sido modificada y ahora la respuesta a "¿Es correcta esta información?" es **"No"**, por lo que aparecerá la sección de comentarios de esta sección. Esto es pura lógica: si aparecen nuevos comentarios debo enviarlos.

2. **Se modifican algunos comentarios** ya escritos anteriormente.

### Subestado Durante Primera Revisión

Mientras existan secciones con el campo "¿Es correcta esta información?" en blanco, el subestado de la tarjeta en la Fase 1: Viviendas Prophero deberá seguir siendo **"Pendiente de revisión"**.

---

## Estado: Revisión Número X

### Estado Inicial

1. La Propiedad se encuentra en el subestado **"Pendiente de Información"**.

### Actualización de Información

2. Alguno de los campos de las secciones con respuesta **"No"** a "¿Es correcta esta información?" es actualizado, lo que significa que se ha actualizado una información que no estaba correcta.

3. Esta nueva información requiere de **Revisión**, por lo que la respuesta a la pregunta "¿Es correcta esta información?" en esta sección debe ser **EN BLANCO/NULL**, ya que hay que revisarla.

4. Esto provoca de forma automática que el subestado de la tarjeta pase a ser **"Pendiente de revisión"**.

5. También debe **reiniciarse/ponerse en blanco** la caja de comentarios de esta sección, ya que hay nueva información disponible (esto **NO debe activar/despertar** al botón de "Enviar comentarios", ya que la caja de comentarios estará en blanco).

### Vista al Entrar en Tarjeta Reseteada

Cuando entro en una tarjeta que ha cambiado del subestado "Pendiente de información" → "Pendiente de revisión":

1. **Secciones en las que la respuesta** a "¿Es correcta esta información?" fuese **"No"** y **no han sufrido ninguna modificación** de información/documentación:
   - Deberán estar **desplegadas** y en **color naranja**.

2. **Secciones en las que la respuesta** a "¿Es correcta esta información?" era **"Sí"**:
   - Deberán mostrarse **colapsadas**, ya que no quiero revisar su información.

3. **Secciones en las que la respuesta** a "¿Es correcta esta información?" ha cambiado de **"No"** a **NULL/EN BLANCO**, porque se ha actualizado alguna información o documento de esa sección:
   - Me gustaría que estas secciones se muestren **desplegadas** y en un **color azul claro** para distinguirlas del resto.
   - Obviamente el campo "¿Es correcta esta información?" deberá estar en **blanco/NULL**.

### Revisión de Sección Reseteada

#### Opción A: Marcar "Sí" Después de Revisar

Si al revisar la información de esta sección está todo correcto, por lo que marcamos **"Sí"** en "¿Es correcta esta información?":

- Esto hará que la sección se **colapse**.

Ahora pueden ocurrir dos cosas:

1. **Todas las secciones tienen la respuesta "Sí"** en "¿Es correcta esta información?":
   - Por lo que la tarjeta estaría lista para cambiar de fase (**Progreso general = 100%**).
   - No tiene ningún subestado asociado.

2. **Si queda alguna sección** en la que la respuesta a "¿Es correcta esta información?" sea **"No"**:
   - El subestado de la tarjeta pasará a **"Pendiente de Información"**, ya que falta información por llegar.

#### Opción B: Marcar "No" Después de Revisar

Si al revisar la nueva información nos damos cuenta de que sigue siendo errónea, responderemos **"No"** a "¿Es correcta esta información?":

- Esto desplegará el campo de comentarios, el cual deberá estar en **blanco** puesto que se ha reiniciado.

- Al detectar nuevos comentarios debe activarse el botón de "Enviar comentarios" siempre y cuando se cumplan también las condiciones de que:
  - Todas las respuestas a "¿Es correcta esta información?" estén en **SI/NO** (no NULL).
  - Todos los campos de comentarios de las secciones con la respuesta **"No"** estén completados.

- El subestado de la tarjeta debe cambiar a **"Pendiente de información"** al haber al menos una sección con la respuesta **"No"** a "¿Es correcta esta información?".

---

## Estructura de Datos

### Campo `prophero_section_reviews` (JSONB)

```json
{
  "_meta": {
    "commentsSubmitted": boolean,
    "commentsSubmittedAt": string,
    "commentSubmissionHistory": [
      {
        "sectionId": string,
        "sectionTitle": string,
        "comments": string,
        "submittedAt": string,
        "fieldValues": object
      }
    ]
  },
  "section-id": {
    "reviewed": boolean,
    "isCorrect": boolean | null,  // true = Sí, false = No, null = Pendiente
    "comments": string | null,
    "submittedComments": string | null,
    "snapshot": object | null,
    "hasIssue": boolean
  }
}
```

### Valores de `isCorrect`

- `null` = Campo en blanco/NULL (Pendiente de revisión)
- `false` = Respuesta "No" (Pendiente de información si hay comentarios enviados)
- `true` = Respuesta "Sí" (Sección completa)

### Campos Importantes

- **`snapshot`**: Valores de campos cuando se marcó como "No", usado para detectar cambios
- **`submittedComments`**: Snapshot de comentarios enviados (read-only después del envío)
- **`comments`**: Comentarios editables (siempre existe, puede estar vacío)

---

## Colores de Secciones

### Sección con Respuesta "No" (No Reseteada)

- **Color**: Naranja
- **Clases**: `bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/30`
- **Estado**: Desplegada

### Sección Reseteada (isCorrect === null con submittedComments)

- **Color**: Azul claro
- **Clases**: `bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30`
- **Estado**: Desplegada

### Sección con Respuesta "Sí"

- **Color**: Normal
- **Clases**: `bg-white border-gray-200 dark:bg-[var(--prophero-gray-900)]`
- **Estado**: Colapsada

---

## Detección de Campos Faltantes

Cuando se marca una sección como "No", el sistema debe detectar automáticamente los campos/documentos faltantes y prerrellenar el cuadro de comentarios con un texto profesional.

### Formato del Texto

- Una línea por cada campo/documento faltante
- Formato: "Falta [nombre del campo/documento]"
- Ejemplo:
  ```
  Falta Certificado de eficiencia energética
  Falta Documentos de la reforma
  ```

### Campos por Sección

Cada sección tiene campos específicos que deben verificarse:

- **property-management-info**: `admin_name`, `keys_location`
- **technical-documents**: `doc_energy_cert`, `doc_renovation_files`
- **legal-documents**: `doc_purchase_contract`, `doc_land_registry_note`
- **client-financial-info**: `client_iban`, `client_bank_certificate_url`
- **supplies-contracts**: `doc_contract_electricity`, `doc_contract_water`, `doc_contract_gas`
- **supplies-bills**: `doc_bill_electricity`, `doc_bill_water`, `doc_bill_gas`
- **home-insurance**: `home_insurance_type`, `home_insurance_policy_url`
- **property-management**: `property_management_plan`, `property_management_plan_contract_url`, `property_manager`

---

## Widget de Progreso General

### Cálculo de Progreso

- Una sección se considera **completa** solo cuando `isCorrect === true`.
- El **Progreso General = 100%** solo cuando todas las secciones tienen `isCorrect === true`.
- Si alguna sección tiene `isCorrect === null` o `isCorrect === false`, la sección cuenta como **0% completa**.

---

## Flujo de Estados

```
Estado Inicial
  ↓
[Todas las secciones con isCorrect === null]
Subestado: "Pendiente de revisión"
  ↓
Primera Revisión
  ↓
[Algunas secciones marcadas como "Sí" o "No"]
  ↓
Si hay NULL → Subestado: "Pendiente de revisión"
Si solo hay "Sí" y "No" → Subestado: "Pendiente de información" (después de enviar comentarios)
  ↓
Revisión Número X
  ↓
[Se actualiza información de sección con "No"]
  ↓
[isCorrect se resetea a null automáticamente]
Subestado: "Pendiente de revisión"
  ↓
[Se revisa la nueva información]
  ↓
Si marca "Sí" → Sección completa
Si marca "No" → Vuelve a "Pendiente de información"
```

---

## Notas de Implementación

1. **Prioridad de NULL sobre NO**: Cuando hay secciones con `isCorrect === null` y secciones con `isCorrect === false`, el subestado siempre será "Pendiente de revisión" (NULL tiene prioridad).

2. **Reset Automático**: Cuando se detecta un cambio en los campos de una sección que tiene `isCorrect === false` y `submittedComments`, el sistema debe:
   - Resetear `isCorrect` a `null`
   - Resetear `comments` a `null`
   - Mantener `submittedComments` y `snapshot` para referencia histórica
   - Cambiar subestado a "Pendiente de revisión"

3. **Detección de Cambios**: El sistema compara los valores actuales de los campos con el `snapshot` guardado cuando se marcó como "No". Si hay diferencias, se considera que hubo una actualización.

4. **Botón "Enviar Comentarios"**: El botón debe aparecer cuando:
   - Hay secciones con "No" que tienen comentarios nuevos o modificados
   - No todas las secciones con "No" están bloqueadas (tienen cambios detectados)

5. **Tags en Kanban**: Los tags deben mostrarse solo para propiedades en la fase "Viviendas Prophero" y solo cuando hay un subestado definido.

---

**Última actualización**: 2026-02-03  
**Versión**: 1.0
