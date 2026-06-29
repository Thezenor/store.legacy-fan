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
        border: 'rgb(var(--lf-border) / <alpha-value>)',
        // Paleta metal
        gold: {
          DEFAULT: '#C9A227',
          light: '#E6C75A',
          dark: '#9C7E1C',
        },
        silver: {
          DEFAULT: '#C0C5CE',
          light: '#E2E5EA',
          dark: '#8A8F99',
        },
        copper: {
          DEFAULT: '#B66A3C',
          light: '#D98C5F',
          dark: '#8A4E2B',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
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
