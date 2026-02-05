import { PropertyType } from "./supply-property-storage";

export const PROPERTY_TYPES: PropertyType[] = [
  "Piso",
  "Casa",
  "Ático",
  "Dúplex",
  "Estudio",
  "Loft",
  "Casa adosada",
  "Local comercial",
  "Edificio",
  "Casa con terreno",
  "Terreno",
  "Obra nueva",
  "Residencia",
  "En construcción",
  "Garaje",
  "Trastero",
];

/**
 * Responsive Grid System Constants
 * Based on Vistral Design System breakpoints, margins, and gutters
 * Uses Vistral tokens with Prophero fallback for compatibility
 */
export const BREAKPOINTS = {
  xs: {
    max: 575,
    margin: 20, // --vistral-grid-margin-xs
    gutter: 12, // --vistral-grid-gutter-xs
    columns: 6,
  },
  sm: {
    min: 577, // --vistral-breakpoint-sm
    max: 768,
    margin: 32, // --vistral-grid-margin-sm
    gutter: 12, // --vistral-grid-gutter-sm
    columns: 6,
  },
  md: {
    min: 769, // --vistral-breakpoint-md
    max: 992,
    margin: 40, // --vistral-grid-margin-md
    gutter: 16, // --vistral-grid-gutter-md
    columns: 12,
  },
  lg: {
    min: 993, // --vistral-breakpoint-lg
    max: 1199,
    margin: 80, // --vistral-grid-margin-lg
    gutter: 28, // --vistral-grid-gutter-lg
    columns: 12,
  },
  xl: {
    min: 1201, // --vistral-breakpoint-xl
    max: 1400,
    margin: 100, // --vistral-grid-margin-xl
    gutter: 32, // --vistral-grid-gutter-xl
    columns: 12,
  },
  xxl: {
    min: 1401, // --vistral-breakpoint-xxl
    margin: 112, // --vistral-grid-margin-xxl
    gutter: 32, // --vistral-grid-gutter-xxl
    columns: 12,
    maxWidth: 1920,
  },
} as const;

/**
 * CSS Custom Properties for responsive margins and gutters
 * Uses Vistral Design System tokens (preferred) with Prophero fallback
 * 
 * Example usage:
 * - className="container-margin" (applies responsive margins)
 * - className="gutter" (applies responsive gutters to grid/flex containers)
 * - style={{ paddingLeft: SPACING.margins.md }}
 * - style={{ gap: SPACING.gutters.lg }}
 */
export const SPACING = {
  margins: {
    xs: 'var(--vistral-grid-margin-xs, var(--prophero-margin-xs))',
    sm: 'var(--vistral-grid-margin-sm, var(--prophero-margin-sm))',
    md: 'var(--vistral-grid-margin-md, var(--prophero-margin-md))',
    lg: 'var(--vistral-grid-margin-lg, var(--prophero-margin-lg))',
    xl: 'var(--vistral-grid-margin-xl, var(--prophero-margin-xl))',
    xxl: 'var(--vistral-grid-margin-xxl, var(--prophero-margin-xxl))',
  },
  gutters: {
    xs: 'var(--vistral-grid-gutter-xs, var(--prophero-gutter-xs))',
    sm: 'var(--vistral-grid-gutter-sm, var(--prophero-gutter-sm))',
    md: 'var(--vistral-grid-gutter-md, var(--prophero-gutter-md))',
    lg: 'var(--vistral-grid-gutter-lg, var(--prophero-gutter-lg))',
    xl: 'var(--vistral-grid-gutter-xl, var(--prophero-gutter-xl))',
    xxl: 'var(--vistral-grid-gutter-xxl, var(--prophero-gutter-xxl))',
  },
} as const;
