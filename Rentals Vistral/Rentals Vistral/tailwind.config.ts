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
  				blue: {
  					50: 'var(--vistral-blue-50)',
  					100: 'var(--vistral-blue-100)',
  					200: 'var(--vistral-blue-200)',
  					300: 'var(--vistral-blue-300)',
  					400: 'var(--vistral-blue-400)',
  					500: 'var(--vistral-blue-500)',
  					600: 'var(--vistral-blue-600)',
  					700: 'var(--vistral-blue-700)',
  					800: 'var(--vistral-blue-800)',
  					900: 'var(--vistral-blue-900)',
  					950: 'var(--vistral-blue-950)',
  				},
  				gray: {
  					50: 'var(--vistral-gray-50)',
  					100: 'var(--vistral-gray-100)',
  					200: 'var(--vistral-gray-200)',
  					300: 'var(--vistral-gray-300)',
  					400: 'var(--vistral-gray-400)',
  					500: 'var(--vistral-gray-500)',
  					600: 'var(--vistral-gray-600)',
  					700: 'var(--vistral-gray-700)',
  					800: 'var(--vistral-gray-800)',
  					900: 'var(--vistral-gray-900)',
  					950: 'var(--vistral-gray-950)',
  				},
  				success: 'var(--vistral-success)',
  				warning: 'var(--vistral-warning)',
  				danger: 'var(--vistral-danger)',
  				info: 'var(--vistral-info)',
  			}
  		},
  		fontFamily: {
  			sans: ['var(--vistral-font-family-sans)', 'system-ui', '-apple-system', 'sans-serif'],
  			mono: ['var(--vistral-font-family-mono)', 'Fira Code', 'Consolas', 'monospace'],
  		},
  		fontSize: {
  			xs: 'var(--vistral-font-size-xs)',
  			sm: 'var(--vistral-font-size-sm)',
  			base: 'var(--vistral-font-size-base)',
  			lg: 'var(--vistral-font-size-lg)',
  			xl: 'var(--vistral-font-size-xl)',
  			'2xl': 'var(--vistral-font-size-2xl)',
  			'3xl': 'var(--vistral-font-size-3xl)',
  			'4xl': 'var(--vistral-font-size-4xl)',
  		},
  		fontWeight: {
  			normal: 'var(--vistral-font-weight-normal)',
  			medium: 'var(--vistral-font-weight-medium)',
  			semibold: 'var(--vistral-font-weight-semibold)',
  			bold: 'var(--vistral-font-weight-bold)',
  		},
  		lineHeight: {
  			tight: 'var(--vistral-line-height-tight)',
  			normal: 'var(--vistral-line-height-normal)',
  			relaxed: 'var(--vistral-line-height-relaxed)',
  		},
  		spacing: {
  			'vistral-0': 'var(--vistral-spacing-0)',
  			'vistral-1': 'var(--vistral-spacing-1)',
  			'vistral-2': 'var(--vistral-spacing-2)',
  			'vistral-3': 'var(--vistral-spacing-3)',
  			'vistral-4': 'var(--vistral-spacing-4)',
  			'vistral-5': 'var(--vistral-spacing-5)',
  			'vistral-6': 'var(--vistral-spacing-6)',
  			'vistral-8': 'var(--vistral-spacing-8)',
  			'vistral-10': 'var(--vistral-spacing-10)',
  			'vistral-12': 'var(--vistral-spacing-12)',
  			'vistral-16': 'var(--vistral-spacing-16)',
  			'vistral-20': 'var(--vistral-spacing-20)',
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
  			'vistral-none': 'var(--vistral-radius-none)',
  			'vistral-sm': 'var(--vistral-radius-sm)',
  			'vistral-md': 'var(--vistral-radius-md)',
  			'vistral-lg': 'var(--vistral-radius-lg)',
  			'vistral-xl': 'var(--vistral-radius-xl)',
  			'vistral-full': 'var(--vistral-radius-full)',
  		},
  		boxShadow: {
  			'vistral-sm': 'var(--vistral-shadow-sm)',
  			'vistral-md': 'var(--vistral-shadow-md)',
  			'vistral-lg': 'var(--vistral-shadow-lg)',
  			'vistral-xl': 'var(--vistral-shadow-xl)',
  		},
  		transitionDuration: {
  			'vistral-fast': 'var(--vistral-transition-fast)',
  			'vistral-base': 'var(--vistral-transition-base)',
  			'vistral-slow': 'var(--vistral-transition-slow)',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

