/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0e1a',
          light: '#f0f4f8',
        },
        surface: {
          DEFAULT: '#111827',
          light: '#ffffff',
          hover: '#1a2332',
          'hover-light': '#f8fafc',
        },
        border: {
          DEFAULT: '#1f2937',
          light: '#e2e8f0',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          dim: '#3b82f620',
        },
        wind: {
          DEFAULT: '#10b981',
          dim: '#10b98120',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dim: '#f59e0b20',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: '#ef444420',
        },
        purple: {
          forecast: '#8b5cf6',
        },
        text: {
          primary: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
          'primary-light': '#1a202c',
          'secondary-light': '#4a5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
