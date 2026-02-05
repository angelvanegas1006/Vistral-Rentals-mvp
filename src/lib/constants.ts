/**
 * Design System Constants
 * Breakpoints, spacing, and layout constants from Prophero Design System
 */

export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

export const SPACING = {
  // Margins (container-margin)
  margin: {
    XS: '16px',
    SM: '24px',
    MD: '32px',
    LG: '48px',
    XL: '64px',
    XXL: '80px',
  },
  // Gutters (space between columns)
  gutter: {
    XS: '16px',
    SM: '24px',
    MD: '24px',
    LG: '32px',
    XL: '32px',
    XXL: '32px',
  },
  // General spacing tokens
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const RADIUS = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export type SpacingKey = keyof typeof SPACING;
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type ZIndexKey = keyof typeof Z_INDEX;
