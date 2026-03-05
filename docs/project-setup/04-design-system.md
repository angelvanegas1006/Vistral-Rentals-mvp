# 4. Design system (Prophero + Tailwind)

## Referencia de componentes

- **Storybook:** [Vistral Design System](https://vistral-design-system.vercel.app/?path=/story/components-sidenav--with-icons) — ej. [Alert](https://vistral-design-system.vercel.app/?path=/docs/components-alert--docs). Consultar ahí variantes, props y ejemplos de todos los componentes.

## Tokens y variables CSS

- **Ubicación:** `app/prophero.css` (colores, tipografía, espaciado, radius, sombras, z-index, breakpoints).
- **Prefijo:** `--prophero-*` (ej. `--prophero-blue-500`, `--prophero-radius-lg`, `--prophero-margin-md`).

## Grid responsivo

- **Breakpoints:** XS–XXL con márgenes y gutters en `lib/constants.ts` (`BREAKPOINTS`, `SPACING`) y en `prophero.css` (`--prophero-margin-*`, `--prophero-gutter-*`).
- **Uso:** Clases `container-margin` y `gutter`; constantes desde `@/lib/constants`; variables CSS para valores concretos.

## Tema

- `globals.css` importa Tailwind y `prophero.css`.
- `@theme inline` mapea variables a Tailwind (--color-background, --font-sans, etc.).

## Componentes UI

- Usar siempre **`cn()`** de `@/lib/utils`.
- Para variantes: **CVA** (class-variance-authority) como en `Button` y `Badge`.

**Reglas detalladas:** Ver `.cursor/rules/02-design-system.mdc`
