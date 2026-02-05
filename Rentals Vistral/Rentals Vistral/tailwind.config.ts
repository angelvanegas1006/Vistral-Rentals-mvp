import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		// Responsive Padding System - Breakpoints
  		// Nota: Los breakpoints estándar de Tailwind se mantienen (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
  		// Se agrega solo 'xs' para el sistema de padding. Ver docs/responsive-padding-system.md para mapeo completo.
  		screens: {
  			'xs': '576px',   // X-Small: < 576px
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Vistral Design System Colors
  			vistral: {
  				primary: {
  					default: 'var(--vistral-primary-default-bg)',
  					hover: 'var(--vistral-primary-hover-bg)',
  					active: 'var(--vistral-primary-active-bg)',
  					disabled: 'var(--vistral-primary-disabled-bg)',
  				},
  				secondary: {
  					default: 'var(--vistral-secondary-default-bg)',
  					hover: 'var(--vistral-secondary-hover-bg)',
  					active: 'var(--vistral-secondary-active-bg)',
  				},
  				semantic: {
  					success: 'var(--vistral-semantic-status-success)',
  					warning: 'var(--vistral-semantic-status-warning)',
  					error: 'var(--vistral-semantic-status-error)',
  					info: 'var(--vistral-semantic-status-info)',
  				},
  			}
  		},
  		fontFamily: {
  			sans: ['var(--vistral-font-family-sans)', 'system-ui', '-apple-system', 'sans-serif'],
  			mono: ['var(--vistral-font-family-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  		},
  		fontSize: {
  			xs: 'var(--vistral-font-size-1)',      // 12px
  			sm: 'var(--vistral-font-size-2)',      // 14px
  			base: 'var(--vistral-font-size-3)',     // 16px
  			lg: 'var(--vistral-font-size-4)',      // 18px
  			xl: 'var(--vistral-font-size-5)',      // 20px
  			'2xl': 'var(--vistral-font-size-6)',   // 24px
  			'3xl': 'var(--vistral-font-size-7)',   // 30px
  			'4xl': 'var(--vistral-font-size-8)',   // 36px
  			'5xl': 'var(--vistral-font-size-9)',   // 48px
  		},
  		fontWeight: {
  			normal: 'var(--vistral-font-weight-regular)',
  			medium: 'var(--vistral-font-weight-medium)',
  			semibold: 'var(--vistral-font-weight-semibold)',
  			bold: 'var(--vistral-font-weight-semibold)',
  		},
  		lineHeight: {
  			tight: 'var(--vistral-line-height-2)',
  			normal: 'var(--vistral-line-height-3)',
  			relaxed: 'var(--vistral-line-height-4)',
  		},
  		spacing: {
  			// Vistral Design System Spacing Tokens
  			'vistral-0': 'var(--vistral-spacing-0)',
  			'vistral-0-5': 'var(--vistral-spacing-0-5)',
  			'vistral-1': 'var(--vistral-spacing-1)',
  			'vistral-1-5': 'var(--vistral-spacing-1-5)',
  			'vistral-2': 'var(--vistral-spacing-2)',
  			'vistral-2-5': 'var(--vistral-spacing-2-5)',
  			'vistral-3': 'var(--vistral-spacing-3)',
  			'vistral-3-5': 'var(--vistral-spacing-3-5)',
  			'vistral-4': 'var(--vistral-spacing-4)',
  			'vistral-5': 'var(--vistral-spacing-5)',
  			'vistral-6': 'var(--vistral-spacing-6)',
  			'vistral-7': 'var(--vistral-spacing-7)',
  			'vistral-8': 'var(--vistral-spacing-8)',
  			'vistral-9': 'var(--vistral-spacing-9)',
  			'vistral-10': 'var(--vistral-spacing-10)',
  			'vistral-11': 'var(--vistral-spacing-11)',
  			'vistral-12': 'var(--vistral-spacing-12)',
  			'vistral-14': 'var(--vistral-spacing-14)',
  			'vistral-16': 'var(--vistral-spacing-16)',
  			'vistral-20': 'var(--vistral-spacing-20)',
  			'vistral-24': 'var(--vistral-spacing-24)',
  			'vistral-25': 'var(--vistral-spacing-25)',
  			'vistral-28': 'var(--vistral-spacing-28)',
  			'vistral-32': 'var(--vistral-spacing-32)',
  			'vistral-40': 'var(--vistral-spacing-40)',
  			// Container Padding Tokens
  			'container-xs': 'var(--vistral-container-padding-xs)',
  			'container-sm': 'var(--vistral-container-padding-sm)',
  			'container-md': 'var(--vistral-container-padding-md)',
  			'container-lg': 'var(--vistral-container-padding-lg)',
  			'container-xl': 'var(--vistral-container-padding-xl)',
  			'container-xxl': 'var(--vistral-container-padding-xxl)',
  			// Responsive Padding System - Margin values
  			'margin-xs': '20px',   // X-Small: < 576px
  			'margin-sm': '32px',   // Small: 577px - 768px
  			'margin-md': '40px',   // Medium: 769px - 992px
  			'margin-lg': '80px',   // Large: 993px - 1199px
  			'margin-xl': '100px',  // Extra Large: 1200px - 1400px
  			'margin-xxl': '112px', // Extra Extra Large: > 1400px
  			// Responsive Padding System - Gutter values
  			'gutter-xs': '12px',   // X-Small: < 576px
  			'gutter-sm': '12px',   // Small: 577px - 768px
  			'gutter-md': '16px',   // Medium: 769px - 992px
  			'gutter-lg': '28px',   // Large: 993px - 1199px
  			'gutter-xl': '32px',   // Extra Large: 1200px - 1400px
  			'gutter-xxl': '32px', // Extra Extra Large: > 1400px
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'vistral-none': 'var(--vistral-radius-0)',
  			'vistral-sm': 'var(--vistral-radius-1)',
  			'vistral-md': 'var(--vistral-radius-2)',
  			'vistral-lg': 'var(--vistral-radius-3)',
  			'vistral-xl': 'var(--vistral-radius-4)',
  			'vistral-full': 'var(--vistral-radius-full)',
  		},
  		boxShadow: {
  			'vistral-1': 'var(--vistral-shadow-level-1)',
  			'vistral-2': 'var(--vistral-shadow-level-2)',
  			'vistral-3': 'var(--vistral-shadow-level-3)',
  			'vistral-4': 'var(--vistral-shadow-level-4)',
  			'vistral-focus': 'var(--vistral-shadow-focus)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

