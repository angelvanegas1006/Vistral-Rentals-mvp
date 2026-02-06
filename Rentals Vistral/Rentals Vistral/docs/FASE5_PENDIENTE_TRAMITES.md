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
   - El documento se guarda en la carpeta `Rental/non-payment_insurance/` del bucket `properties-restricted-docs`
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
- `guarantee_file_url` (TEXT | null): URL del documento de garantía firmado. Se guarda en `Rental/non-payment_insurance/`

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
  └── Rental/
      └── non-payment_insurance/
          └── {property_unique_id}/
              └── guarantee_file_url_{timestamp}.pdf
```

#### Task de Completado

- **Task ID**: `guaranteeSigned`
- **Fase**: `Pendiente de trámites`
- **Estado**: Se actualiza automáticamente cuando `guarantee_signed === true` y `guarantee_file_url !== null`.

---

## Notas de Implementación

- La sección sigue los mismos patrones de diseño y comportamiento que las secciones de la Fase 4 "Inquilino aceptado"
- El componente utiliza los hooks `usePropertyTasks` y `useUpdateProperty` para gestionar el estado
- Los documentos se suben mediante la función `uploadDocument` y se eliminan con `deleteDocument`
- La validación de completado se realiza automáticamente cuando cambian los campos relevantes

---
