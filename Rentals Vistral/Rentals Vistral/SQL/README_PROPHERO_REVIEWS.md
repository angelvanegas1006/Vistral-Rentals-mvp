# Migration: Add prophero_section_reviews Field

## Descripción

Este script añade el campo `prophero_section_reviews` a la tabla `properties` para almacenar el estado de revisión de las secciones en la fase "Viviendas Prophero".

## Instrucciones

1. Abre el **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `SQL/add_prophero_section_reviews.sql`
3. Copia y pega el SQL en el editor
4. Ejecuta el script

## Estructura del Campo

El campo `prophero_section_reviews` es de tipo `JSONB` y almacena un objeto con el siguiente formato:

```json
{
  "property-management-info": {
    "reviewed": true,
    "isCorrect": true,
    "comments": null,
    "hasIssue": false
  },
  "technical-documents": {
    "reviewed": true,
    "isCorrect": false,
    "comments": "Falta el certificado energético",
    "hasIssue": true
  }
}
```

## Campos

- `reviewed`: boolean - Indica si la sección ha sido revisada
- `isCorrect`: boolean | null - `true` = Sí, `false` = No, `null` = no revisado
- `comments`: string | null - Comentarios sobre problemas encontrados
- `hasIssue`: boolean - **Campo histórico**: Se establece a `true` cuando `isCorrect === false` y **nunca vuelve a `false`**, incluso si la sección se marca como correcta después. Permite identificar qué secciones han tenido problemas históricamente.

## Secciones Incluidas

- `property-management-info`
- `technical-documents`
- `legal-documents`
- `client-financial-info`
- `supplies-contracts`
- `supplies-bills`
- `home-insurance`
- `property-management`

## Verificación

Después de ejecutar el script, verifica que:

1. El campo aparece en la tabla `properties` en el Table Editor
2. El tipo de dato es `jsonb`
3. El campo permite valores NULL

```sql
-- Verificar que el campo existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'prophero_section_reviews';
```

## Rollback

Si necesitas eliminar el campo (¡CUIDADO! Esto eliminará todos los datos de revisión):

```sql
ALTER TABLE properties DROP COLUMN IF EXISTS prophero_section_reviews;
```
