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
  			// PropHero Design System Colors
  			prophero: {
  				blue: {
  					50: 'var(--prophero-blue-50)',
  					100: 'var(--prophero-blue-100)',
  					200: 'var(--prophero-blue-200)',
  					300: 'var(--prophero-blue-300)',
  					400: 'var(--prophero-blue-400)',
  					500: 'var(--prophero-blue-500)',
  					600: 'var(--prophero-blue-600)',
  					700: 'var(--prophero-blue-700)',
  					800: 'var(--prophero-blue-800)',
  					900: 'var(--prophero-blue-900)',
  					950: 'var(--prophero-blue-950)',
  				},
  				gray: {
  					50: 'var(--prophero-gray-50)',
  					100: 'var(--prophero-gray-100)',
  					200: 'var(--prophero-gray-200)',
  					300: 'var(--prophero-gray-300)',
  					400: 'var(--prophero-gray-400)',
  					500: 'var(--prophero-gray-500)',
  					600: 'var(--prophero-gray-600)',
  					700: 'var(--prophero-gray-700)',
  					800: 'var(--prophero-gray-800)',
  					900: 'var(--prophero-gray-900)',
  					950: 'var(--prophero-gray-950)',
  				},
  				success: 'var(--prophero-success)',
  				warning: 'var(--prophero-warning)',
  				danger: 'var(--prophero-danger)',
  				info: 'var(--prophero-info)',
  			}
  		},
  		fontFamily: {
  			sans: ['var(--prophero-font-family-sans)', 'system-ui', '-apple-system', 'sans-serif'],
  			mono: ['var(--prophero-font-family-mono)', 'Fira Code', 'Consolas', 'monospace'],
  		},
  		fontSize: {
  			xs: 'var(--prophero-font-size-xs)',
  			sm: 'var(--prophero-font-size-sm)',
  			base: 'var(--prophero-font-size-base)',
  			lg: 'var(--prophero-font-size-lg)',
  			xl: 'var(--prophero-font-size-xl)',
  			'2xl': 'var(--prophero-font-size-2xl)',
  			'3xl': 'var(--prophero-font-size-3xl)',
  			'4xl': 'var(--prophero-font-size-4xl)',
  		},
  		fontWeight: {
  			normal: 'var(--prophero-font-weight-normal)',
  			medium: 'var(--prophero-font-weight-medium)',
  			semibold: 'var(--prophero-font-weight-semibold)',
  			bold: 'var(--prophero-font-weight-bold)',
  		},
  		lineHeight: {
  			tight: 'var(--prophero-line-height-tight)',
  			normal: 'var(--prophero-line-height-normal)',
  			relaxed: 'var(--prophero-line-height-relaxed)',
  		},
  		spacing: {
  			'prophero-0': 'var(--prophero-spacing-0)',
  			'prophero-1': 'var(--prophero-spacing-1)',
  			'prophero-2': 'var(--prophero-spacing-2)',
  			'prophero-3': 'var(--prophero-spacing-3)',
  			'prophero-4': 'var(--prophero-spacing-4)',
  			'prophero-5': 'var(--prophero-spacing-5)',
  			'prophero-6': 'var(--prophero-spacing-6)',
  			'prophero-8': 'var(--prophero-spacing-8)',
  			'prophero-10': 'var(--prophero-spacing-10)',
  			'prophero-12': 'var(--prophero-spacing-12)',
  			'prophero-16': 'var(--prophero-spacing-16)',
  			'prophero-20': 'var(--prophero-spacing-20)',
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
  			'prophero-none': 'var(--prophero-radius-none)',
  			'prophero-sm': 'var(--prophero-radius-sm)',
  			'prophero-md': 'var(--prophero-radius-md)',
  			'prophero-lg': 'var(--prophero-radius-lg)',
  			'prophero-xl': 'var(--prophero-radius-xl)',
  			'prophero-full': 'var(--prophero-radius-full)',
  		},
  		boxShadow: {
  			'prophero-sm': 'var(--prophero-shadow-sm)',
  			'prophero-md': 'var(--prophero-shadow-md)',
  			'prophero-lg': 'var(--prophero-shadow-lg)',
  			'prophero-xl': 'var(--prophero-shadow-xl)',
  		},
  		transitionDuration: {
  			'prophero-fast': 'var(--prophero-transition-fast)',
  			'prophero-base': 'var(--prophero-transition-base)',
  			'prophero-slow': 'var(--prophero-transition-slow)',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

