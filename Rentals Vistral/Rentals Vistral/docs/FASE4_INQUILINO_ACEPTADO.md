# Fase 4: Inquilino Aceptado

**Fecha de implementación:** 2026-02-06  
**Estado:** ✅ Implementado

---

## Descripción General

La fase "Inquilino aceptado" es la cuarta fase del proceso de gestión de alquileres. En esta fase se confirman los datos bancarios del inversor, se gestiona el contrato de arrendamiento, se registran las condiciones acordadas y se gestiona la garantía Finaer.

---

## Secciones de Trabajo

### 1. Confirmación datos bancarios del Inversor

**Objetivo:** Confirmar en qué cuenta bancaria quiere el Inversor recibir el dinero de la renta.

#### Flujo de Trabajo

1. **Visualización de cuenta registrada:**
   - Se muestra la cuenta bancaria registrada del inversor (`client_iban`) en un campo de solo lectura
   - El IBAN se muestra enmascarado (solo últimos 4 dígitos visibles)

2. **Confirmación de cuenta:**
   - Radio buttons con la pregunta: "¿Es esta la cuenta bancaria donde el inversor quiere recibir el dinero?"
   - Opciones: **Sí** / **No**

3. **Si seleccionan "Sí":**
   - Los campos `client_rent_receiving_iban` y `client_rent_receiving_bank_certificate_url` se inicializan automáticamente con los valores existentes:
     - `client_rent_receiving_iban` = `client_iban`
     - `client_rent_receiving_bank_certificate_url` = `client_bank_certificate_url`
   - La sección se marca como completada automáticamente

4. **Si seleccionan "No":**
   - Aparecen campos adicionales:
     - **Input para nuevo IBAN:** "Cuenta bancaria para recibir la renta"
     - **Upload de certificado:** "Certificado de titularidad bancaria de la nueva cuenta"
   - Ambos campos deben estar completos para considerar la sección completada
   - El certificado se guarda en la carpeta `client/financial` del bucket `properties-restricted-docs`

5. **Visualización en tab de Inversor:**
   - Si se cambió la cuenta (`client_wants_to_change_bank_account = true`):
     - Se muestra la nueva cuenta bancaria debajo de "Cuenta bancaria"
     - Se muestra el nuevo certificado debajo de "Certificado de titularidad bancaria"
   - Si no se cambió, solo se muestra la información existente

#### Campos de Base de Datos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `client_rent_receiving_iban` | TEXT | IBAN donde el inversor quiere recibir la renta. Si no se cambia, se inicializa con `client_iban` |
| `client_rent_receiving_bank_certificate_url` | TEXT | URL del certificado de titularidad de la cuenta para recibir renta. Se guarda en `client/financial`. Si no se cambia, se inicializa con `client_bank_certificate_url` |
| `client_wants_to_change_bank_account` | BOOLEAN | Respuesta al radio button: `true` = quiere cambiar, `false` = usa cuenta existente, `null` = no ha respondido |

#### Estructura de Datos

```typescript
{
  client_rent_receiving_iban: string | null;
  client_rent_receiving_bank_certificate_url: string | null;
  client_wants_to_change_bank_account: boolean | null;
}
```

#### Lógica de Completado

- **Sección completada cuando:**
  - Se selecciona "Sí" (se inicializa automáticamente), O
  - Se selecciona "No" + nuevo IBAN ingresado + certificado subido

---

### 2. Contrato de alquiler

**Objetivo:** Subir el contrato de alquiler firmado por ambas partes y registrar los datos del contrato.

#### Flujo de Trabajo

1. **Upload del contrato:**
   - Campo para subir el contrato de alquiler firmado (PDF, DOC, DOCX)
   - El contrato es único: solo se puede tener un contrato a la vez
   - Si ya existe un contrato, se puede eliminar para subir uno nuevo
   - El contrato se guarda en la carpeta `Rental/lease_contract/` del bucket `properties-restricted-docs`
   - Soporta drag and drop para facilitar la carga

2. **Registro de datos del contrato:**
   - **Fecha de firma:** Fecha en que se firmó el contrato
   - **Fecha de inicio:** Fecha de inicio del contrato de alquiler
   - **Duración:** Número de meses o años de duración del contrato
   - **Unidad de duración:** Selector para elegir entre "Meses" o "Años"
   - **Fecha de fin:** Fecha de finalización del contrato
     - Se calcula automáticamente a partir de la fecha de inicio + duración
     - Puede ser editada manualmente si es necesario
     - Si se edita manualmente, no se recalcula automáticamente cuando cambian otros campos
   - **Renta mensual:** Monto de la renta mensual en euros

3. **Completado de la sección:**
   - La sección se marca como completada cuando todos los campos están llenos:
     - Contrato subido (`signed_lease_contract_url`)
     - Fecha de firma (`contract_signature_date`)
     - Fecha de inicio (`lease_start_date`)
     - Duración (`lease_duration`)
     - Unidad de duración (`lease_duration_unit`)
     - Fecha de fin (`lease_end_date`)
     - Renta mensual (`final_rent_amount` > 0)

#### Campos de Base de Datos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `signed_lease_contract_url` | TEXT | URL del contrato de alquiler firmado. Se guarda en `rental/contractual_financial/lease_contract/` |
| `contract_signature_date` | DATE | Fecha en que se firmó el contrato |
| `lease_start_date` | DATE | Fecha de inicio del contrato de alquiler |
| `lease_duration` | TEXT | Duración del contrato (número) |
| `lease_duration_unit` | TEXT | Unidad de duración: "meses" o "años" |
| `lease_end_date` | DATE | Fecha de finalización del contrato. Se calcula automáticamente pero puede editarse manualmente |
| `final_rent_amount` | NUMERIC | Monto de la renta mensual en euros |

#### Estructura de Datos

```typescript
{
  signed_lease_contract_url: string | null;
  contract_signature_date: string | null;
  lease_start_date: string | null;
  lease_duration: string | null;
  lease_duration_unit: "meses" | "años" | null;
  lease_end_date: string | null;
  final_rent_amount: number | null;
}
```

#### Lógica de Cálculo de Fecha de Fin

- **Cálculo automático:**
  - Si se proporcionan `lease_start_date`, `lease_duration` y `lease_duration_unit`, se calcula automáticamente `lease_end_date`
  - Para meses: se suma el número de meses a la fecha de inicio
  - Para años: se suma el número de años a la fecha de inicio
  - El cálculo se realiza cuando cambian cualquiera de estos tres campos

- **Edición manual:**
  - El usuario puede editar manualmente la fecha de fin si es necesario
  - Si se edita manualmente, se marca un flag (`isEndDateManuallyEdited = true`)
  - Cuando la fecha de fin ha sido editada manualmente, no se recalcula automáticamente aunque cambien otros campos

#### Lógica de Completado

- **Sección completada cuando:**
  - Contrato subido (`signed_lease_contract_url` existe)
  - Fecha de firma completada (`contract_signature_date` existe)
  - Fecha de inicio completada (`lease_start_date` existe)
  - Duración completada (`lease_duration` existe)
  - Unidad de duración seleccionada (`lease_duration_unit` existe)
  - Fecha de fin completada (`lease_end_date` existe)
  - Renta mensual ingresada (`final_rent_amount` > 0)

#### Estructura de Carpetas en Storage

```
properties-restricted-docs/
  └── {property_unique_id}/
      └── rental/
          └── contractual_financial/
              └── lease_contract/
                  └── signed_lease_contract_url_{timestamp}.pdf
```

---

## 3. Garantía de renta ilimitada de Finaer

### Objetivo

Confirmar que la Garantía de renta ilimitada de Finaer ha sido enviada a firma para completar el expediente.

### Flujo de Trabajo

1. **Visualización del ID de garantía**: Se muestra el ID de la garantía de Finaer (`guarantee_id`) en un campo de solo lectura. Si no hay ID registrado, se muestra "No disponible".

2. **Confirmación de envío a firma**: El usuario debe responder mediante radio buttons si la garantía ha sido enviada a firma:
   - **Sí**: La garantía ha sido enviada a firma → Sección completada
   - **No**: La garantía no ha sido enviada a firma → Sección incompleta

3. **Completado automático**: Cuando se selecciona "Sí", la sección se marca automáticamente como completada.

### Campos de Base de Datos

#### Campos Utilizados:

- `guarantee_id` (TEXT | null): ID de la garantía de Finaer (ya existente)
- `guarantee_sent_to_signature` (BOOLEAN | null): Confirma si la garantía ha sido enviada a firma
  - `true` = Sí, ha sido enviada a firma
  - `false` = No, no ha sido enviada a firma
  - `null` = No ha respondido aún

#### Campo Creado:

- `guarantee_sent_to_signature`: Nuevo campo BOOLEAN agregado a la tabla `properties` mediante el script SQL `create_guarantee_sent_to_signature_field.sql`.

### Criterios de Completado

La sección se considera completada cuando:
- `guarantee_sent_to_signature === true` (se ha confirmado que la garantía fue enviada a firma)

### Comportamiento de la UI

- **Campo display del ID**: Muestra el `guarantee_id` en un componente tipo card similar al de "ADMINISTRADOR DE LA PROPIEDAD". Si no hay ID, muestra "No disponible" en color gris.
- **Radio buttons**: Se muestran horizontalmente (Sí/No) similar a la sección de datos bancarios.
- **Estilo condicional**: Cuando está completada, la card tiene borde y fondo verde (similar a otras secciones completadas).
- **Colapso**: Cuando está completada, la sección se puede colapsar/expandir usando un Accordion. Al entrar a la tarjeta, las secciones completadas están colapsadas por defecto.
- **Prevención de desplazamiento**: Al expandir/colapsar, se preserva la posición del scroll para evitar saltos de página.

### Estructura de Datos

```typescript
{
  guarantee_id: string | null;
  guarantee_sent_to_signature: boolean | null;
}
```

### Task de Completado

- **Task ID**: `guaranteeSentToSignature`
- **Fase**: `PHASE` (Inquilino aceptado)
- **Estado**: Se actualiza automáticamente cuando `guarantee_sent_to_signature` cambia a `true` o `false`.

---


