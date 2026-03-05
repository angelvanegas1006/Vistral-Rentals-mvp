# 5. Patrones de componentes (UI)

## Clases

- **`cn(...)`** para combinar clases (clsx + tailwind-merge). Nunca concatenar strings a mano.

## Variantes (CVA)

- CVA con `variant` y `size`.
- Exportar `componentVariants` y usarlas con `cn(componentVariants({ variant, size, className }))`.

## Refs

- Componentes que envuelven elementos nativos usan **`forwardRef`** y pasan `ref` al DOM.

## Accesibilidad

- Radix para teclado, focus y ARIA; no reinventar modales, selects o dropdowns.

## Formularios

- Siempre que haya formulario: **Form**, **FormField**, **FormItem**, **FormLabel**, **FormControl**, **FormMessage** de `@/components/ui/form` + react-hook-form + Zod para validación.

**Reglas detalladas:** Ver `.cursor/rules/05-forms-ui.mdc`
