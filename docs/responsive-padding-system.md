# Sistema de Padding Responsive

Este documento define el sistema de espaciado (padding/margin) responsive basado en breakpoints específicos para mantener consistencia visual y legibilidad en todos los dispositivos.

## Tabla de Referencia

| Breakpoint | Rango de Ancho | Columnas | Margin | Gutter | Comportamiento UX |
|------------|----------------|----------|--------|--------|-------------------|
| **X-Small (XS)** | < 576px | 6 | 20px | 12px | Mobile: Layout completamente condensado |
| **Small (SM)** | 577px - 768px | 6 | 32px | 12px | Tablet Vertical: Margen máximo en 6 columnas |
| **Medium (MD)** | 769px - 992px | 12 | 40px | 16px | Tablet Horizontal: Transición a 12 columnas |
| **Large (LG)** | 993px - 1199px | 12 | 80px | 28px | Desktop: Alto margen y gutter amplio para legibilidad |
| **Extra Large (XL)** | 1200px - 1400px | 12 | 100px | 32px | Desktop Ancho: Margen grande para enfocar el centro |
| **Extra Extra Large (XXL)** | > 1400px | 12 | Min. 112px, luego centrado y fijo | 32px | Configuración Máxima: El grid se centra en un ancho máximo definido |

## Definiciones

### Margin
El **Margin** se refiere al espaciado desde el borde del viewport hasta el área de contenido. En CSS, esto generalmente se maneja con `padding` en el elemento `body` o contenedor principal.

### Gutter
El **Gutter** se refiere al espaciado entre columnas del grid. En CSS, esto se maneja típicamente con la propiedad `gap` en CSS Grid/Flexbox o con padding/margin horizontal en elementos de columna individuales.

## Implementación

### Uso en Tailwind CSS

Los valores están disponibles como utilidades personalizadas en Tailwind usando las clases de spacing:

#### Margin (Padding del contenedor)
```tsx
// Usando las clases personalizadas de spacing (valores definidos en tailwind.config.ts)
className="px-margin-xs" // X-Small: 20px
className="px-margin-sm" // Small: 32px
className="px-margin-md" // Medium: 40px
className="px-margin-lg" // Large: 80px
className="px-margin-xl" // Extra Large: 100px
className="px-margin-xxl" // Extra Extra Large: 112px

// O usando valores aproximados estándar de Tailwind
className="px-5"  // 20px (X-Small)
className="px-8"  // 32px (Small)
className="px-10" // 40px (Medium)
className="px-20" // 80px (Large)
className="px-[100px]" // 100px (XL) - valor arbitrario
className="px-28" // 112px (XXL)
```

#### Gutter (Gap entre columnas)
```tsx
// Usando las clases personalizadas de spacing (valores definidos en tailwind.config.ts)
className="gap-gutter-xs" // X-Small: 12px
className="gap-gutter-sm" // Small: 12px
className="gap-gutter-md" // Medium: 16px
className="gap-gutter-lg" // Large: 28px
className="gap-gutter-xl" // Extra Large: 32px
className="gap-gutter-xxl" // Extra Extra Large: 32px

// O usando valores aproximados estándar de Tailwind
className="gap-3" // 12px (XS/SM)
className="gap-4" // 16px (MD)
className="gap-7" // 28px (LG) - valor aproximado
className="gap-8" // 32px (XL/XXL)
```

### Uso Responsive

```tsx
// Ejemplo de contenedor principal con margin responsive usando clases personalizadas
<div className="
  px-margin-xs        // XS: 20px
  sm:px-margin-sm     // SM: 32px
  md:px-margin-md     // MD: 40px
  lg:px-margin-lg     // LG: 80px
  xl:px-margin-xl     // XL: 100px
  2xl:px-margin-xxl   // XXL: 112px mínimo
">
  {/* Contenido */}
</div>

// Ejemplo usando valores estándar aproximados
<div className="
  px-5        // XS: 20px
  sm:px-8     // SM: 32px
  md:px-10    // MD: 40px
  lg:px-20    // LG: 80px
  xl:px-[100px] // XL: 100px
  2xl:px-28   // XXL: 112px mínimo
">
  {/* Contenido */}
</div>

// Ejemplo de grid con gutter responsive usando clases personalizadas
<div className="
  grid grid-cols-6 gap-gutter-xs        // XS: 6 columnas, 12px gap
  sm:gap-gutter-sm                      // SM: 12px gap
  md:grid-cols-12 md:gap-gutter-md      // MD: 12 columnas, 16px gap
  lg:gap-gutter-lg                      // LG: 28px gap
  xl:gap-gutter-xl                      // XL: 32px gap
  2xl:gap-gutter-xxl                    // XXL: 32px gap
">
  {/* Columnas */}
</div>

// Ejemplo usando valores estándar aproximados
<div className="
  grid grid-cols-6 gap-3        // XS/SM: 6 columnas, 12px gap
  md:grid-cols-12 md:gap-4      // MD: 12 columnas, 16px gap
  lg:gap-7                      // LG: 28px gap
  xl:gap-8                      // XL/XXL: 32px gap
">
  {/* Columnas */}
</div>
```

## Breakpoints de Tailwind

Los breakpoints estándar de Tailwind se mapean así (aproximados):

- `xs`: 576px (X-Small: < 576px) - **Breakpoint personalizado agregado**
- `sm`: 640px (aproximado a nuestro SM: 577px-768px)
- `md`: 768px (aproximado a nuestro MD: 769px-992px)
- `lg`: 1024px (aproximado a nuestro LG: 993px-1199px)
- `xl`: 1280px (aproximado a nuestro XL: 1200px-1400px)
- `2xl`: 1536px (aproximado a nuestro XXL: >1400px)

**Nota**: Los breakpoints de Tailwind son aproximados. Para valores exactos, usar las clases de spacing personalizadas (`margin-*` y `gutter-*`) con media queries específicas si es necesario.

## Notas Importantes

1. **XXL**: En pantallas extra grandes, el contenido se centra con un ancho máximo fijo. El margin mínimo es 112px, pero puede expandirse más allá de ese valor para mantener el contenido centrado.

2. **Transición de Columnas**: El sistema cambia de 6 columnas (XS/SM) a 12 columnas (MD+) para aprovechar mejor el espacio horizontal en pantallas más grandes.

3. **Legibilidad**: Los valores crecientes de Margin y Gutter a medida que aumenta el ancho de pantalla ayudan a mantener la legibilidad y el equilibrio visual.

4. **Consistencia**: Siempre usar estos valores específicos en lugar de valores arbitrarios para mantener la consistencia del diseño en toda la aplicación.
