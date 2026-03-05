# Fase 3: Recogiendo Información

**Contexto:** Esta fase del pipeline de Interesados (Kanban) corresponde a la recogida de información personal y familiar del interesado antes de la calificación.

---

## 1. Objetivo de la fase

Recopilar y guardar en la base de datos (tabla `leads`) toda la **Información Personal del Interesado** y su **Perfil familiar**, así como una copia del **documento de identidad** y la **documentación laboral/financiera**, para poder enviar la solicitud de calificación a Finaer.

---

## 2. Secciones de trabajo del Espacio de Trabajo

La fase tiene **4 secciones de trabajo** que se muestran en el tab "Espacio de trabajo":

| # | Sección | Componente | Bloqueo |
|---|---------|-----------|---------|
| 1 | Propiedad Seleccionada | `LeadSelectedPropertySection` | Ninguno |
| 2 | Información Personal del Interesado | `LeadPersonalInfoSection` | Ninguno |
| 3 | Información Laboral y Financiera del Interesado | `LeadEmploymentFinancialSection` | Ninguno |
| 4 | Confirmación de Envío a Finaer | `LeadFinaerConfirmationSection` | Bloqueada hasta que 1, 2 y 3 estén completas |

Todas las secciones aparecen en el **Widget de Progreso General** (`ProgressOverviewWidget`).

---

## 3. Sección de trabajo: Propiedad Seleccionada

### 3.1 Objetivo

Definir cuál de las MTPs en estado `recogiendo_informacion` será la que se envíe a Finaer para el estudio de solvencia.

### 3.2 Comportamiento

- Cuando la tarjeta del Interesado pasa a esta fase, solo habrá **una MTP** en estado `recogiendo_informacion`. Esa MTP aparece automáticamente como propiedad seleccionada.
- Si hay **más de una MTP** en este estado (porque otras propiedades avanzaron mientras tanto), aparece un botón **"Cambiar propiedad seleccionada"** que abre un grid con las MTPs disponibles. El usuario puede cambiar la selección con 1 clic.
- La MTP seleccionada se muestra como una `LeadPropertyCard` con un mensaje informativo: _"Esta vivienda está seleccionada para el estudio de solvencia."_

### 3.3 Diseño

- Envuelta en `Phase2SectionWidget` con `id="selected-property"`.
- Mismo patrón visual que las secciones 2 y 3.
- El mensaje informativo usa el estilo "gray-box" (fondo gris redondeado), igual que el header de `LeadPropertyCardWorkEsperandoDecision`.

### 3.4 MTPs no seleccionadas

En la tab **Gestión de Propiedades** aparecen **todas** las MTPs activas (incluyendo las de `recogiendo_informacion` y la seleccionada). Las MTPs en estado `recogiendo_informacion` que NO son la seleccionada muestran en su sección de trabajo:

> _"Para iniciar el estudio de solvencia con esta vivienda, márcala en la sección superior 'Propiedad Seleccionada'."_

### 3.5 Progreso General

- `○ Propiedad seleccionada para calificación (0/1)` → Se completa automáticamente cuando hay una MTP seleccionada.

### 3.6 Persistencia

La selección de propiedad se gestiona con estado de React (no persiste en BD). El default es la primera MTP en `recogiendo_informacion`. Si se necesita persistencia entre recargas, se puede añadir `qualification_property_id` (UUID, FK a `leads_properties.id`) en la tabla `leads`.

---

## 4. Sección de trabajo: Información Personal del Interesado

Es la **segunda sección de trabajo** de la fase "Recogiendo información". Incluye:

### 4.1 Información personal

| Campo (UI)              | Campo BD              | Tipo   | Comportamiento |
|-------------------------|-----------------------|--------|----------------|
| Nacionalidad            | `nationality`         | TEXT   | Selector con buscador; **España** aparece siempre primero. |
| Tipo documento identidad| `identity_doc_type`   | ENUM   | Depende de nacionalidad: si **española** → solo DNI o Pasaporte; si **no española** → solo NIE o Pasaporte. |
| Número documento        | `identity_doc_number`  | TEXT   | Texto libre. |
| Documento de identidad  | `identity_doc_url`    | TEXT   | Un único archivo: subida a bucket `lead-restricted-docs`, carpeta `{LEAD_ID}/identity/`. Previsualización y eliminación para sustituir. |
| Fecha de nacimiento     | `date_of_birth`       | DATE   | Al guardar, se calcula y persiste la edad. |
| Edad                    | `age`                 | INT    | **Solo lectura**; se calcula automáticamente a partir de la fecha de nacimiento al guardar. |

### 4.2 Perfil familiar

| Campo (UI)       | Campo BD         | Tipo  | Comportamiento |
|-----------------|------------------|-------|----------------|
| Perfil familiar | `family_profile` | ENUM  | Valores: Soltero, Pareja, Con hijos. |
| Número de hijos | `children_count` | INT   | **Solo visible** cuando Perfil familiar = "Con hijos". |
| Mascotas        | `pet_info`       | JSONB | Información flexible (ej. tipo, número, descripción). |

---

## 5. Sección de trabajo: Información Laboral y Financiera del Interesado

Es la **tercera sección de trabajo** de la fase "Recogiendo información". Incluye situación laboral, profesión, tipo de contrato (cuando aplica) y **documentos obligatorios y complementarios** según la situación laboral.

### 5.1 Campos de datos

| Campo (UI)       | Campo BD                    | Tipo   | Comportamiento |
|------------------|-----------------------------|--------|----------------|
| Situación laboral| `employment_status`        | TEXT   | Selector: Empleado, Funcionario, Autónomo, Pensionista, Estudiante, Desempleado, Ingresos en el exterior |
| Profesión        | `job_title`                | TEXT   | Texto libre |
| Tipo de contrato | `employment_contract_type` | TEXT   | Solo visible cuando employment_status = Empleado o Funcionario. Opciones: Contrato indefinido, Contrato temporal, Contrato laboral reciente |

### 5.2 Documentos obligatorios por situación laboral

| employment_status       | employment_contract_type  | Documentos obligatorios |
|-------------------------|---------------------------|-------------------------|
| Empleado / Funcionario  | Contrato indefinido       | Última nómina |
| Empleado / Funcionario  | Contrato temporal         | Última nómina, Vida laboral |
| Empleado / Funcionario  | Contrato laboral reciente | Contrato laboral *(Advertencia: Debe ser indefinido y figurar el salario del Interesado)* |
| Autónomo                | -                         | Último IRPF presentado, Último IVA |
| Pensionista             | -                         | Certificado de administración pública, Justificante bancario |
| Ingresos en el exterior | -                         | Demostración de ingresos, Justificantes bancarios de los ingresos obtenidos en los últimos 3 meses |
| Estudiante              | -                         | Matrícula del curso o carnet de estudiante en vigor, Demostración de ingresos propios o de un avalista |
| Desempleado             | -                         | Demostración de ingresos propios o de un avalista |

### 5.3 Documentos complementarios (opcionales)

- Botón "Agregar documento" que abre modal.
- Tras subir el archivo: dropdown para seleccionar tipo:
  * Saldo en cuenta bancaria
  * Fondo de inversión / ahorro
  * Fondo de pensión privado
  * Ayudas
  * Rentas de alquiler
  * Otros *(Obligatorio añadir Título)*
- Campo "Título" obligatorio cuando el tipo es "Otros".
- Se pueden subir múltiples documentos complementarios, diferenciados por tipo.
- Cada documento permite previsualización y eliminación.

### 5.4 Storage: documentos laboral/financieros

- **Bucket:** `leads-restricted-docs` (privado)
- **Path:** `{leads_unique_id}/laboral_financial/{filename}`
- **Campo en BD:** `leads.laboral_financial_docs` (JSONB)
- **Estructura:** `{ obligatory: { [fieldKey]: url }, complementary: [{ type, title, url, createdAt }] }`

---

## 6. Sección de trabajo: Confirmación de Envío a Finaer

### 6.1 Bloqueo

Esta sección está **bloqueada** hasta que las secciones 1 (Propiedad Seleccionada), 2 (Información Personal) y 3 (Información Laboral y Financiera) estén completas.

El patrón de bloqueo es idéntico al de "Lanzamiento Comercial" en la fase "Listo para Alquilar" del kanban de Captación y Cierre: opacity-60, icono de candado, mensaje "Completa las secciones anteriores para continuar".

### 6.2 Cuando se desbloquea

Radio button full-width con la pregunta:

> _¿Se ha iniciado el estudio de solvencia de **[Nombre del Interesado]** para **[Dirección de la Propiedad Seleccionada]** con Finaer?_

- **Sí:** Abre el modal de confirmación (sección 7).
- **No:** Muestra un mensaje de advertencia: _"La calificación con Finaer es obligatoria para continuar con el proceso de alquiler. Cuando esté lista, vuelve a esta sección y confirma."_

### 6.3 Progreso General

- `○ Confirmación de envío a Finaer (0/1)` → Se completa cuando se confirma el envío.

---

## 7. Modal: Confirmar inicio de calificación

Se abre al pulsar "Sí" en la sección de Confirmación de Envío a Finaer.

### 7.1 Contenido del modal

- **Título:** "Confirmar inicio de calificación"
- **Cuerpo:** "Vas a iniciar el estudio de solvencia para la propiedad **[Dirección Seleccionada]**. Al confirmar, ocurrirá lo siguiente:"
  - ✅ El Interesado avanzará a la fase **Calificación en Curso**.
  - ⏸️ Las otras **[X]** propiedades en las que estaba interesado pasarán al estado **En Espera** de forma automática. *(Solo si X > 0)*

### 7.2 Mecanismo de confirmación

- Checkbox: "Confirmar inicio de calificación para **[Dirección]**"
- Botones: `[Cancelar]` / `[Confirmar y Avanzar]` (habilitado solo al marcar el checkbox)

### 7.3 Efecto al confirmar

1. Llama a la API de transición con `newStatus = "calificacion_en_curso"`, `action = "advance"`, `updates = { sent_to_finaer_at: timestamp, confirmed: true }`.
2. La API ejecuta la **cascada**: todas las demás MTPs activas del lead pasan a `en_espera`.
3. El lead avanza a la fase **Calificación en Curso**.
4. Se registran los eventos correspondientes en `lead_events`.

---

## 8. Reglas de negocio

- **Nacionalidad española** → Tipo documento: **DNI** o **Pasaporte**.
- **Nacionalidad no española** → Tipo documento: **NIE** o **Pasaporte**.
- **Documento de identidad:** un solo documento por interesado; al subir uno nuevo se puede eliminar el actual y subir otro.
- **Edad:** cálculo automático al guardar la fecha de nacimiento (no editable por el usuario).
- **Número de hijos:** el campo solo se muestra cuando el perfil familiar es "Con hijos".
- **Documentos obligatorios:** un documento por campo; eliminar para sustituir.
- **Documentos complementarios:** título obligatorio solo para tipo "Otros".
- **Cascada al enviar a Finaer:** todas las MTPs activas (excepto la seleccionada) pasan automáticamente a `en_espera`.

---

## 9. Storage: documento de identidad del lead

- **Bucket:** `lead-restricted-docs` (privado).
- **Estructura de carpetas:** una carpeta por lead, nombrada con el **id del lead**. Los documentos de identidad van en la subcarpeta `identity`.
- **Ruta completa ejemplo:** `lead-restricted-docs / {lead_id} / identity / {nombre_archivo}`.
- **Campo en BD:** la URL resultante se guarda en `leads.identity_doc_url`.

Ver también: `docs/docs-architecture.md` — sección "Leads (lead-restricted-docs)".

---

## 10. Funcionamiento en la UI

- Las 4 secciones de trabajo se muestran en la pestaña **Espacio de trabajo** del detalle del interesado **solo cuando la fase actual es "Recogiendo Información"**.
- Los campos se persisten en la tabla `leads` vía `useUpdateLead`; los documentos se suben/eliminan mediante las API de documentos de leads.
- En la pestaña **Gestión de Propiedades** aparecen TODAS las MTPs activas (incluyendo las de estado `recogiendo_informacion` y la propiedad seleccionada).

---

## 11. Campos de BD utilizados

### Tabla `leads`

| Campo | Uso en esta fase |
|-------|-----------------|
| `nationality` | Nacionalidad del interesado |
| `identity_doc_type` | Tipo de documento de identidad |
| `identity_doc_number` | Número de documento |
| `identity_doc_url` | URL del documento subido |
| `date_of_birth` | Fecha de nacimiento |
| `age` | Edad calculada |
| `family_profile` | Perfil familiar |
| `children_count` | Número de hijos |
| `pet_info` | Información de mascotas (JSONB) |
| `employment_status` | Situación laboral |
| `job_title` | Profesión |
| `employment_contract_type` | Tipo de contrato |
| `laboral_financial_docs` | Documentos obligatorios y complementarios (JSONB) |

### Tabla `leads_properties`

| Campo | Uso en esta fase |
|-------|-----------------|
| `current_status` | `recogiendo_informacion` → `calificacion_en_curso` |
| `previous_status` | Se guarda al transicionar |
| `sent_to_finaer_at` | Timestamp del envío a Finaer |
| `finaer_status` | Estado de la calificación ('pending', 'approved', 'rejected') |

---

## 12. Documentación relacionada

- **Fases del Kanban de Interesados:** `docs/leads/Kanban-Interesados-Fases.md`
- **Máquina de estados MTP:** `docs/leads/Maquina_estados_leads_properties`
- **Arquitectura de documentos:** `docs/docs-architecture.md`
- **SQL de campos de la fase:** `SQL/create_leads_personal_family_fields.sql`
- **Tipos:** `src/lib/supabase/types.ts` (tabla `leads`)

---

## 13. Componentes

| Componente | Archivo |
|-----------|---------|
| `LeadSelectedPropertySection` | `src/components/rentals/lead-selected-property-section.tsx` |
| `LeadPersonalInfoSection` | `src/components/rentals/lead-personal-info-section.tsx` |
| `LeadEmploymentFinancialSection` | `src/components/rentals/lead-employment-financial-section.tsx` |
| `LeadFinaerConfirmationSection` | `src/components/rentals/lead-finaer-confirmation-section.tsx` |
| `MtpModalFinaerConfirmation` | `src/components/rentals/mtp-modal-finaer-confirmation.tsx` |
| `LeadPropertyCardWorkRecogiendoInformacion` | `src/components/rentals/lead-property-card-work-recogiendo-informacion.tsx` |
| `Phase2SectionWidget` | `src/components/rentals/phase2-section-widget.tsx` |
| `ProgressOverviewWidget` | `src/components/specs-card/ProgressOverviewWidget.tsx` |
| `LeadTasksTab` | `src/components/rentals/lead-tasks-tab.tsx` |
