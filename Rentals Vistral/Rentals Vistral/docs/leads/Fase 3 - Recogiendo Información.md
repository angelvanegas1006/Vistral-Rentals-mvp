# Fase 3: Recogiendo Información

**Contexto:** Esta fase del pipeline de Interesados (Kanban) corresponde a la recogida de información personal y familiar del interesado antes de la calificación.

---

## 1. Objetivo de la fase

Recopilar y guardar en la base de datos (tabla `leads`) toda la **Información Personal del Interesado** y su **Perfil familiar**, así como una copia del **documento de identidad**, para poder evaluar y dar continuidad al proceso.

---

## 2. Sección de trabajo: Información Personal del Interesado

Es la **primera sección de trabajo** de la fase "Recogiendo información". Incluye:

### 2.1 Información personal

| Campo (UI)              | Campo BD              | Tipo   | Comportamiento |
|-------------------------|-----------------------|--------|----------------|
| Nacionalidad            | `nationality`         | TEXT   | Selector con buscador; **España** aparece siempre primero. |
| Tipo documento identidad| `identity_doc_type`   | ENUM   | Depende de nacionalidad: si **española** → solo DNI o Pasaporte; si **no española** → solo NIE o Pasaporte. |
| Número documento        | `identity_doc_number`  | TEXT   | Texto libre. |
| Documento de identidad  | `identity_doc_url`    | TEXT   | Un único archivo: subida a bucket `lead-restricted-docs`, carpeta `{LEAD_ID}/identity/`. Previsualización y eliminación para sustituir. |
| Fecha de nacimiento     | `date_of_birth`       | DATE   | Al guardar, se calcula y persiste la edad. |
| Edad                    | `age`                 | INT    | **Solo lectura**; se calcula automáticamente a partir de la fecha de nacimiento al guardar. |

### 2.2 Perfil familiar

| Campo (UI)       | Campo BD         | Tipo  | Comportamiento |
|-----------------|------------------|-------|----------------|
| Perfil familiar | `family_profile` | ENUM  | Valores: Soltero, Pareja, Con hijos. |
| Número de hijos | `children_count` | INT   | **Solo visible** cuando Perfil familiar = "Con hijos". |
| Mascotas        | `pet_info`       | JSONB | Información flexible (ej. tipo, número, descripción). |

---

## 3. Sección de trabajo: Información Laboral y Financiera del Interesado

Es la **segunda sección de trabajo** de la fase "Recogiendo información". Incluye situación laboral, profesión, tipo de contrato (cuando aplica) y **documentos obligatorios y complementarios** según la situación laboral.

### 3.1 Campos de datos

| Campo (UI)       | Campo BD                    | Tipo   | Comportamiento |
|------------------|-----------------------------|--------|----------------|
| Situación laboral| `employment_status`        | TEXT   | Selector: Empleado, Funcionario, Autónomo, Pensionista, Estudiante, Desempleado, Ingresos en el exterior |
| Profesión        | `job_title`                | TEXT   | Texto libre |
| Tipo de contrato | `employment_contract_type` | TEXT   | Solo visible cuando employment_status = Empleado o Funcionario. Opciones: Contrato indefinido, Contrato temporal, Contrato laboral reciente |

### 3.2 Documentos obligatorios por situación laboral

Los documentos requeridos dependen de `employment_status` y, para Empleado/Funcionario, de `employment_contract_type`. Un solo documento por campo; para sustituir hay que eliminar el actual y subir otro.

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

### 3.3 Documentos complementarios (opcionales)

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

### 3.4 Storage: documentos laboral/financieros

- **Bucket:** `leads-restricted-docs` (privado)
- **Path:** `{leads_unique_id}/laboral_financial/{filename}`
- **Campo en BD:** `leads.laboral_financial_docs` (JSONB)
- **Estructura:** `{ obligatory: { [fieldKey]: url }, complementary: [{ type, title, url, createdAt }] }`

Ver también: `docs/docs-architecture.md` — sección "LEADS SECTION".

---

## 4. Reglas de negocio

- **Nacionalidad española** → Tipo documento: **DNI** o **Pasaporte**.
- **Nacionalidad no española** → Tipo documento: **NIE** o **Pasaporte**.
- **Documento de identidad:** un solo documento por interesado; al subir uno nuevo se puede eliminar el actual y subir otro (mismo comportamiento que "Agregar documento" en datos bancarios del inversor).
- **Edad:** cálculo automático al guardar la fecha de nacimiento (no editable por el usuario).
- **Número de hijos:** el campo solo se muestra cuando el perfil familiar es "Con hijos".
- **Documentos obligatorios:** un documento por campo; eliminar para sustituir.
- **Documentos complementarios:** título obligatorio solo para tipo "Otros".

---

## 5. Storage: documento de identidad del lead

- **Bucket:** `lead-restricted-docs` (privado). Debe existir en Supabase Storage; créalo como bucket privado si no existe.
- **Estructura de carpetas:** una carpeta por lead, nombrada con el **id del lead** (ej. `LEAD-001` o el UUID correspondiente). Los documentos de identidad van en la subcarpeta `identity`.
- **Ruta completa ejemplo:** `lead-restricted-docs / {lead_id} / identity / {nombre_archivo}`.
- **Campo en BD:** la URL resultante (signed o pública según configuración) se guarda en `leads.identity_doc_url`.

Ver también: `docs/docs-architecture.md` — sección "Leads (lead-restricted-docs)".

---

## 6. Funcionamiento en la UI

- Las secciones **Información Personal del Interesado** e **Información Laboral y Financiera del Interesado** se muestran en la pestaña **Espacio de trabajo** del detalle del interesado **solo cuando la fase actual es "Recogiendo Información"**.
- Los campos se persisten en la tabla `leads` vía `useUpdateLead`; los documentos se suben/eliminan mediante las API de documentos de leads (`/api/leads/[leadId]/documents/...`).
- **Documento de identidad:** un solo documento, con previsualización y opción de eliminar para subir otro.
- **Documentos laboral/financieros:** obligatorios (un documento por campo, eliminar para sustituir) y complementarios (modal con tipo y título, múltiples documentos).

---

## 7. Documentación relacionada

- **Arquitectura de documentos:** `docs/docs-architecture.md`
- **SQL de campos de la fase:** `SQL/create_leads_personal_family_fields.sql`
- **Tipos:** `src/lib/supabase/types.ts` (tabla `leads`)
