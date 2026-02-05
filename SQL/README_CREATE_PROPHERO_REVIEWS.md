# Migration: Create prophero_section_reviews Field (New Structure)

## Descripción

Este script crea el campo `prophero_section_reviews` desde cero con la nueva estructura que incluye `hasIssue` en lugar de `completed`.

## ⚠️ ADVERTENCIA

Este script está diseñado para crear la columna desde cero. Si ya existe la columna con datos, este script:
- NO eliminará la columna existente (está comentado)
- Solo agregará la columna si no existe
- Los datos existentes se mantendrán, pero deberán migrarse manualmente si tienen el campo `completed`

## Instrucciones

1. Abre el **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `SQL/create_prophero_section_reviews.sql`
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

## Migración de Datos Existentes

Si tienes datos existentes con el campo `completed`, puedes migrarlos con este script:

```sql
-- Migrar datos existentes: convertir completed a hasIssue
UPDATE properties
SET prophero_section_reviews = (
  SELECT jsonb_object_agg(
    key,
    value - 'completed' || 
    jsonb_build_object(
      'hasIssue', 
      COALESCE((value->>'isCorrect')::boolean = false, false) OR 
      COALESCE((value->>'hasIssue')::boolean, false)
    )
  )
  FROM jsonb_each(prophero_section_reviews)
)
WHERE prophero_section_reviews IS NOT NULL;
```

## Rollback

Si necesitas eliminar el campo (¡CUIDADO! Esto eliminará todos los datos de revisión):

```sql
ALTER TABLE properties DROP COLUMN IF EXISTS prophero_section_reviews;
```
