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

## 3. Reglas de negocio

- **Nacionalidad española** → Tipo documento: **DNI** o **Pasaporte**.
- **Nacionalidad no española** → Tipo documento: **NIE** o **Pasaporte**.
- **Documento de identidad:** un solo documento por interesado; al subir uno nuevo se puede eliminar el actual y subir otro (mismo comportamiento que "Agregar documento" en datos bancarios del inversor).
- **Edad:** cálculo automático al guardar la fecha de nacimiento (no editable por el usuario).
- **Número de hijos:** el campo solo se muestra cuando el perfil familiar es "Con hijos".

---

## 4. Storage: documento de identidad del lead

- **Bucket:** `lead-restricted-docs` (privado). Debe existir en Supabase Storage; créalo como bucket privado si no existe.
- **Estructura de carpetas:** una carpeta por lead, nombrada con el **id del lead** (ej. `LEAD-001` o el UUID correspondiente). Los documentos de identidad van en la subcarpeta `identity`.
- **Ruta completa ejemplo:** `lead-restricted-docs / {lead_id} / identity / {nombre_archivo}`.
- **Campo en BD:** la URL resultante (signed o pública según configuración) se guarda en `leads.identity_doc_url`.

Ver también: `docs/docs-architecture.md` — sección "Leads (lead-restricted-docs)".

---

## 5. Funcionamiento en la UI

- La sección **Información Personal del Interesado** se muestra en la pestaña **Espacio de trabajo** del detalle del interesado **solo cuando la fase actual es "Recogiendo Información"**.
- Los campos se persisten en la tabla `leads` vía `useUpdateLead`; el documento se sube/elimina mediante las API de documentos de leads (`/api/leads/[leadId]/documents/...`).
- El botón de subida de documento tiene el mismo aspecto y comportamiento que el de "Agregar documento" de la sección de datos bancarios: un solo documento, con previsualización y opción de eliminar para subir otro.

---

## 6. Documentación relacionada

- **Arquitectura de documentos:** `docs/docs-architecture.md`
- **SQL de campos de la fase:** `SQL/create_leads_personal_family_fields.sql`
- **Tipos:** `src/lib/supabase/types.ts` (tabla `leads`)
