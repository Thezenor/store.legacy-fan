import type { Config } from 'tailwindcss';

/**
 * Sistema visual Legacy Fan (doc 12):
 * premium, oscuro por defecto, metal/oro/plata/cobre, jerarquía clara.
 * Modo claro disponible mediante toggle -> estrategia 'class'.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos (mapeados a variables CSS en globals.css)
        background: 'rgb(var(--lf-background) / <alpha-value>)',
        surface: 'rgb(var(--lf-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--lf-surface-elevated) / <alpha-value>)',
        foreground: 'rgb(var(--lf-foreground) / <alpha-value>)',
        muted: 'rgb(var(--lf-muted) / <alpha-value>)',
        faint: 'rgb(var(--lf-faint) / <alpha-value>)',
        border: 'rgb(var(--lf-border) / <alpha-value>)',
        // Paleta metal (handoff hi-fi)
        gold: {
          DEFAULT: '#c8a24b', // label/acento
          light: '#e6c878', // texto/precios
          dark: '#a9822f',
        },
        silver: {
          DEFAULT: '#cfd2d8',
          light: '#fbfaf6',
          dark: '#8d9095',
        },
        copper: {
          DEFAULT: '#c0855a',
          light: '#f1efe9',
          dark: '#7c4f33',
        },
        // Colores de estado
        'state-green': '#7bbf8f',
        'state-blue': '#7ba6bf',
        'state-amber': '#e6c878',
      },
      backgroundImage: {
        'gold-grad': 'linear-gradient(135deg, #e6c264 0%, #a9822f 100%)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card: '0 4px 24px -8px rgb(0 0 0 / 0.5)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
