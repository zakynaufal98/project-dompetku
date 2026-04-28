/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['Instrument Sans', 'sans-serif'],
      },
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        'primary-pale': 'rgb(var(--color-primary-pale) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        'gold-light': 'rgb(var(--color-gold-light) / <alpha-value>)',
        income: 'rgb(var(--color-income) / <alpha-value>)',
        'income-light': 'rgb(var(--color-income-light) / <alpha-value>)',
        expense: 'rgb(var(--color-expense) / <alpha-value>)',
        'expense-light': 'rgb(var(--color-expense-light) / <alpha-value>)',
        invest: 'rgb(var(--color-invest) / <alpha-value>)',
        'invest-light': 'rgb(var(--color-invest-light) / <alpha-value>)',
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        field: 'rgb(var(--color-field) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        border2: 'rgb(var(--color-border-2) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-2': 'rgb(var(--color-text-2) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        muted2: 'rgb(var(--color-muted-2) / <alpha-value>)',
      },
      boxShadow: {
        card:   '0 2px 12px rgba(0,0,0,0.06)',
        'card-md': '0 4px 20px rgba(0,0,0,0.10)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12)',
        inner:  'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-up':  'fadeUp 0.35s ease both',
        'slide-in': 'slideIn 0.25s ease both',
        'fade-in':  'fadeIn 0.2s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
