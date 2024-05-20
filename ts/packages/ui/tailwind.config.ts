import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config = {
  darkMode: ['class'],
  // TODO: what do we do with this?
  // TODO: make components work!
  content: ['./pages/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', '../../src/components/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    colors: {
      black: '#0B0B0E',
      white: '#FFFFFF',
      green: {
        DEFAULT: '#6BDB3B',
        100: '#F6FEEC',
        200: '#D6FBB1',
        300: '#B7F489',
        400: '#98E969',
        500: '#6BDB3B',
        600: '#4CBC2B',
        700: '#329D1D',
        800: '#1D7F12',
        900: '#0E690B',
      },
      blue: {
        DEFAULT: '#0066F5',
        100: '#EBF7FF',
        200: '#AED9FE',
        300: '#64B0FC',
        400: '#3E93F9',
        500: '#0066F5',
        600: '#004ED2',
        700: '#003AB0',
        800: '#00298E',
        900: '#001D75',
      },
      gray: {
        DEFAULT: '#7A7A7A',
        100: '#F5F5F5',
        200: '#D6D6D6',
        300: '#B0B0B0',
        400: '#9B9B9B',
        500: '#7A7A7A',
        600: '#696969',
        700: '#585858',
        800: '#474747',
        900: '#212121',
      },
      yellow: {
        DEFAULT: '#FFD932',
        100: '#FFFDEB',
        200: '#FFF5B8',
        300: '#FFEC83',
        400: '#FFE565',
        500: '#FFD932',
        600: '#DBB524',
        700: '#B79419',
        800: '#93730F',
        900: '#7A5C09',
      },
      red: {
        DEFAULT: '#FF382D',
        100: '#FFF2EB',
        200: '#FFCDB8',
        300: '#FF9C81',
        400: '#FF7661',
        500: '#FF382D',
        600: '#DB2026',
        700: '#B71629',
        800: '#930E28',
        900: '#7A0828',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '24px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
