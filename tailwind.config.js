/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['Instrument Sans', 'sans-serif'],
      },
      colors: {
        primary:   '#E8353A',
        'primary-light': '#FF6B6F',
        'primary-pale':  '#FFF0F0',
        gold:      '#F5A623',
        'gold-light': '#FFF8ED',
        income:    '#2196F3',
        'income-light': '#E8F4FF',
        expense:   '#E8353A',
        'expense-light': '#FFF0F0',
        invest:    '#4CAF50',
        'invest-light': '#E8F5E9',
        bg:        '#F5F6FA',
        surface:   '#FFFFFF',
        border:    '#EEEEEE',
        border2:   '#E0E0E0',
        text:      '#1A1A2E',
        'text-2':  '#4A4A68',
        muted:     '#9E9E9E',
        muted2:    '#BDBDBD',
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
