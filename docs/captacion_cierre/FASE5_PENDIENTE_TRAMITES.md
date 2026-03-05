# Fase 5: Pendiente de trámites

**Fecha de implementación:** 2026-02-06  
**Estado:** 🚧 En desarrollo

---

## Descripción General

La fase "Pendiente de trámites" es la quinta fase del proceso de gestión de alquileres. En esta fase se gestionan los trámites pendientes necesarios para completar el proceso de alquiler, incluyendo la firma de la garantía de Finaer y otros documentos requeridos.

---

## Secciones de Trabajo

### 1. Firma de la Garantía de renta ilimitada de Finaer

**Objetivo:** Confirmar que la Garantía de renta ilimitada de Finaer ha sido firmada y subir el documento firmado.

#### Flujo de Trabajo

1. **Visualización del ID de garantía**: Se muestra el ID de la garantía de Finaer (`guarantee_id`) en un campo de solo lectura. Si no hay ID registrado, se muestra "No disponible".

2. **Confirmación de firma**: El usuario debe responder mediante radio buttons si la garantía ha sido firmada:
   - **Sí**: La garantía ha sido firmada
   - **No**: La garantía no ha sido firmada

3. **Upload del documento firmado**: 
   - Campo para subir el documento de garantía firmado (PDF, DOC, DOCX)
   - El documento es único: solo se puede tener un documento a la vez
   - Si ya existe un documento, se puede eliminar para subir uno nuevo
   - El documento se guarda en la carpeta `rental/contractual_financial/non-payment_insurance/` del bucket `properties-restricted-docs`
   - Soporta drag and drop para facilitar la carga

4. **Completado de la sección**: La sección se marca como completada cuando:
   - Se selecciona "Sí" en el radio button (`guarantee_signed === true`)
   - El documento está subido (`guarantee_file_url` existe)

#### Campos de Base de Datos

**Campos Utilizados:**

- `guarantee_id` (TEXT | null): ID de la garantía de Finaer (ya existente)
- `guarantee_signed` (BOOLEAN | null): Confirma si la garantía ha sido firmada
  - `true` = Sí, ha sido firmada
  - `false` = No, no ha sido firmada
  - `null` = No ha respondido aún
- `guarantee_file_url` (TEXT | null): URL del documento de garantía firmado. Se guarda en `rental/contractual_financial/non-payment_insurance/`

**Nota:** Todos los campos necesarios ya existen en la base de datos. No se requiere crear nuevos campos.

#### Estructura de Datos

```typescript
{
  guarantee_id: string | null;
  guarantee_signed: boolean | null;
  guarantee_file_url: string | null;
}
```

#### Criterios de Completado

La sección se considera completada cuando:
- `guarantee_signed === true` (se ha confirmado que la garantía fue firmada)
- `guarantee_file_url !== null` (el documento firmado está subido)

#### Comportamiento de la UI

- **Campo display del ID**: Muestra el `guarantee_id` en un componente tipo card similar al de "ADMINISTRADOR DE LA PROPIEDAD". Si no hay ID, muestra "No disponible" en color gris.
- **Radio buttons**: Se muestran horizontalmente (Sí/No) similar a otras secciones.
- **Campo de upload**: Permite subir el documento con drag and drop o selección de archivo. Muestra el documento actual si existe y permite eliminarlo.
- **Estilo condicional**: Cuando está completada, la card tiene borde y fondo verde (similar a otras secciones completadas).
- **Colapso**: Cuando está completada, la sección se puede colapsar/expandir usando un Accordion. Al entrar a la tarjeta, las secciones completadas están colapsadas por defecto.
- **Prevención de desplazamiento**: Al expandir/colapsar, se preserva la posición del scroll para evitar saltos de página.

#### Estructura de Carpetas en Storage

```
properties-restricted-docs/
  └── {property_unique_id}/
      └── rental/
          └── contractual_financial/
              └── non-payment_insurance/
                  └── guarantee_file_url_{timestamp}.pdf
```

#### Task de Completado

- **Task ID**: `guaranteeSigned`
- **Fase**: `Pendiente de trámites`
- **Estado**: Se actualiza automáticamente cuando `guarantee_signed === true` y `guarantee_file_url !== null`.

---

### 2. Cambio de suministros

**Objetivo:** Seleccionar quién es el responsable del depósito de la fianza y, si es Prophero, subir el resguardo del depósito.

#### Flujo de Trabajo

1. **Selección del responsable**: El usuario debe seleccionar mediante radio buttons quién es el responsable del depósito:
   - **Prophero**: Prophero es el responsable
   - **Inversor**: El inversor es el responsable

2. **Upload del resguardo (condicional)**: 
   - Solo se muestra cuando el responsable es "Prophero"
   - Campo para subir el resguardo del depósito de la fianza (PDF, DOC, DOCX)
   - El documento es único: solo se puede tener un documento a la vez
   - Si ya existe un documento, se puede eliminar para subir uno nuevo
   - El documento se guarda en la carpeta `rental/contractual_financial/deposit/` del bucket `properties-restricted-docs`
   - Soporta drag and drop para facilitar la carga

3. **Completado de la sección**: La sección se marca como completada cuando:
   - Se selecciona "Inversor" como responsable (no requiere documento), O
   - Se selecciona "Prophero" como responsable Y el documento está subido (`deposit_receipt_file_url` existe)

#### Campos de Base de Datos

**Campos Utilizados:**

- `deposit_responsible` (ENUM | null): Responsable del depósito de la fianza
  - `"Prophero"` = Prophero es responsable
  - `"Inversor"` = Inversor es responsable
  - `null` = No se ha seleccionado aún
- `deposit_receipt_file_url` (TEXT | null): URL del resguardo del depósito de la fianza. Se guarda en `rental/contractual_financial/deposit/`

#### Estructura de Datos

```typescript
{
  deposit_responsible: "Prophero" | "Inversor" | null;
  deposit_receipt_file_url: string | null;
}
```

#### Criterios de Completado

La sección se considera completada cuando:
- `deposit_responsible === "Inversor"` (Inversor es responsable, no requiere documento)
- O `deposit_responsible === "Prophero"` Y `deposit_receipt_file_url !== null` (Prophero es responsable y documento subido)

#### Comportamiento de la UI

- **Radio buttons**: Se muestran horizontalmente (Prophero/Inversor) similar a otras secciones.
- **Campo de upload**: Permite subir el documento con drag and drop o selección de archivo. Solo se muestra cuando el responsable es "Prophero". Muestra el documento actual si existe y permite eliminarlo.
- **Estilo condicional**: Cuando está completada, la card tiene borde y fondo verde (similar a otras secciones completadas).
- **Colapso**: Cuando está completada, la sección se puede colapsar/expandir usando un Accordion. Al entrar a la tarjeta, las secciones completadas están colapsadas por defecto.
- **Prevención de desplazamiento**: Al expandir/colapsar, se preserva la posición del scroll para evitar saltos de página.

#### Estructura de Carpetas en Storage

```
properties-restricted-docs/
  └── {property_unique_id}/
      └── rental/
          └── contractual_financial/
              └── deposit/
                  └── deposit_receipt_file_url_{timestamp}.pdf
```

#### Task de Completado

- **Task ID**: `depositReceipt`
- **Fase**: `Pendiente de trámites`
- **Estado**: Se actualiza automáticamente cuando se cumplen los criterios de completado.

---

### 3. Depósito de la fianza

**Objetivo:** Gestionar el cambio de titularidad activando los suministros que asumirá el inquilino y subir los nuevos contratos; los servicios desactivados se mantendrán a nombre del propietario.

#### Flujo de Trabajo

1. **Activación de suministros**: El usuario debe activar mediante toggles los suministros que asumirá el inquilino:
   - **Electricidad**: Toggle para activar/desactivar
   - **Agua**: Toggle para activar/desactivar
   - **Gas**: Toggle para activar/desactivar
   - **Otros**: Toggle para activar/desactivar (suministros adicionales como internet, teléfono, etc.)

2. **Upload de contratos del inquilino**: 
   - Para cada suministro activado, se debe subir el contrato correspondiente del inquilino
   - Los documentos se guardan en la carpeta `rental/utilities/` del bucket `properties-restricted-docs`
   - Soporta drag and drop para facilitar la carga
   - Para "Otros", se pueden subir múltiples documentos con títulos personalizados

3. **Visualización de documentos del inversor**: 
   - Sección colapsable que muestra los documentos originales de suministros del inversor
   - Permite consultar contratos y facturas originales para obtener datos necesarios

4. **Completado de la sección**: La sección se marca como completada cuando:
   - No hay suministros activados (todos los toggles en false), O
   - Todos los suministros activados tienen sus contratos correspondientes subidos

#### Campos de Base de Datos

**Campos Utilizados:**

- `tenant_supplies_toggles` (JSONB | null): Estados de los toggles de suministros
  - Estructura: `{electricity: boolean, water: boolean, gas: boolean, other: boolean}`
  - Se inicializa automáticamente desde los documentos del inversor la primera vez
- `tenant_contract_electricity` (TEXT | null): URL del contrato de electricidad del inquilino
- `tenant_contract_water` (TEXT | null): URL del contrato de agua del inquilino
- `tenant_contract_gas` (TEXT | null): URL del contrato de gas del inquilino
- `rental_custom_utilities_documents` (JSONB | null): Array de documentos de otros suministros del inquilino (sección "Otros")
  - Estructura: `[{title: string, url: string, createdAt: string}]`

#### Estructura de Datos

```typescript
{
  tenant_supplies_toggles: {
    electricity: boolean;
    water: boolean;
    gas: boolean;
    other: boolean;
  } | null;
  tenant_contract_electricity: string | null;
  tenant_contract_water: string | null;
  tenant_contract_gas: string | null;
  rental_custom_utilities_documents: Array<{
    title: string;
    url: string;
    createdAt: string;
  }> | null;
}
```

#### Criterios de Completado

La sección se considera completada cuando:
- Todos los toggles están en `false` (no hay suministros que cambiar), O
- Para cada toggle activado (`true`), existe el contrato correspondiente:
  - `electricity === true` → `tenant_contract_electricity !== null`
  - `water === true` → `tenant_contract_water !== null`
  - `gas === true` → `tenant_contract_gas !== null`
  - `other === true` → `rental_custom_utilities_documents` es un array con al menos un elemento

#### Comportamiento de la UI

- **Toggles**: Se muestran en cards individuales para cada tipo de suministro con iconos distintivos
- **Campos de upload**: Se muestran condicionalmente cuando el toggle correspondiente está activado
- **Documentos del inquilino**: Sección colapsable al final que muestra los documentos originales del inversor
- **Estilo condicional**: Cuando está completada, la card tiene borde y fondo verde
- **Colapso**: Cuando está completada, la sección se puede colapsar/expandir usando un Accordion
- **Prevención de desplazamiento**: Al expandir/colapsar, se preserva la posición del scroll

#### Estructura de Carpetas en Storage

```
properties-restricted-docs/
  └── {property_unique_id}/
      └── rental/
          └── utilities/
              ├── tenant_contract_electricity_{timestamp}.pdf
              ├── tenant_contract_water_{timestamp}.pdf
              ├── tenant_contract_gas_{timestamp}.pdf
              └── rental_custom_utilities_documents_{timestamp}.pdf
```

#### Task de Completado

- **Task ID**: `suppliesChange`
- **Fase**: `Pendiente de trámites`
- **Estado**: Se actualiza automáticamente cuando se cumplen los criterios de completado.

---

### 4. Transferencia del mes en curso

**Objetivo:** Confirmar que el inquilino ha realizado la transferencia por el importe de la renta del mes en curso y subir el comprobante de transferencia.

#### Flujo de Trabajo

1. **Upload del comprobante de transferencia**: 
   - Campo para subir el comprobante de transferencia del mes en curso (PDF, DOC, DOCX)
   - El documento es único: solo se puede tener un documento a la vez
   - Si ya existe un documento, se puede eliminar para subir uno nuevo
   - El documento se guarda en la carpeta `rental/contractual_financial/first_rent_payment/` del bucket `properties-restricted-docs`
   - Soporta drag and drop para facilitar la carga

2. **Completado de la sección**: La sección se marca como completada cuando:
   - El documento está subido (`first_rent_payment_file_url` existe)

#### Campos de Base de Datos

**Campos Utilizados:**

- `first_rent_payment_file_url` (TEXT | null): URL del comprobante de transferencia del mes en curso. Se guarda en `rental/contractual_financial/first_rent_payment/`

#### Estructura de Datos

```typescript
{
  first_rent_payment_file_url: string | null;
}
```

#### Criterios de Completado

La sección se considera completada cuando:
- `first_rent_payment_file_url !== null` (el documento está subido)

#### Comportamiento de la UI

- **Campo de upload**: Permite subir el documento con drag and drop o selección de archivo. Muestra el documento actual si existe y permite eliminarlo.
- **Estilo condicional**: Cuando está completada, la card tiene borde y fondo verde (similar a otras secciones completadas).
- **Colapso**: Cuando está completada, la sección se puede colapsar/expandir usando un Accordion. Al entrar a la tarjeta, las secciones completadas están colapsadas por defecto.
- **Prevención de desplazamiento**: Al expandir/colapsar, se preserva la posición del scroll para evitar saltos de página.

#### Estructura de Carpetas en Storage

```
properties-restricted-docs/
  └── {property_unique_id}/
      └── rental/
          └── contractual_financial/
              └── first_rent_payment/
                  └── first_rent_payment_file_url_{timestamp}.pdf
```

#### Task de Completado

- **Task ID**: `firstRentPayment`
- **Fase**: `Pendiente de trámites`
- **Estado**: Se actualiza automáticamente cuando `first_rent_payment_file_url !== null`.

---

## Notas de Implementación

- La sección sigue los mismos patrones de diseño y comportamiento que las secciones de la Fase 4 "Inquilino aceptado"
- El componente utiliza los hooks `usePropertyTasks` y `useUpdateProperty` para gestionar el estado
- Los documentos se suben mediante la función `uploadDocument` y se eliminan con `deleteDocument`
- La validación de completado se realiza automáticamente cuando cambian los campos relevantes

---
