# 8. Formularios y validación

## Control

- **react-hook-form** con `FormProvider` (Form de `@/components/ui/form`).

## Validación

- Esquemas **Zod** y **`@hookform/resolvers/zod`** en el `resolver`.

## Campos

- **FormField** + **Controller** + **FormItem** + **FormLabel** + **FormControl** + **FormMessage**.
- Componentes UI existentes (Input, Select, etc.) dentro de **FormControl**.

## Estado y envío

- `handleSubmit`, `formState.errors`, `watch`.
- Para datos async o complejos: hooks dedicados (ej. usePropertyData, useFormState) que llamen a servicios en `lib/`.

**Reglas detalladas:** Ver `.cursor/rules/05-forms-ui.mdc`
