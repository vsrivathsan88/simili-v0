import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        handwritten: ['var(--font-kalam)', 'cursive'],
        casual: ['var(--font-caveat)', 'cursive'],
      },
      colors: {
        paper: '#FFFDF6',
        ink: '#1F2937',
        line: '#CBD5E1',
        primary: '#4F46E5',
        secondary: '#6366F1',
        accent: '#93C5FD',
        success: '#16A34A',
        warning: '#F59E0B',
        info: '#2563EB',
        error: '#DC2626',
        // Semantic fill colors
        'fill-correct': '#E8F5E9',
        'fill-partial': '#FFF8E1',
        'fill-incorrect': '#FFEDD5',
        'fill-exploring': '#F3E8FF',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '64': '64px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
      },
      transitionDuration: {
        'micro': '120ms',
        'short': '200ms',
        'medium': '300ms',
      },
      // Focus ring utilities
      ringColor: {
        'focus': '#4338CA',
      },
      ringWidth: {
        'focus': '3px',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
    },
  },
  plugins: [],
};
export default config;
