/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sc: {
          bg: '#0a0b10',
          surface: '#12131c',
          surface2: '#1a1b28',
          border: '#262838',
          accent: '#ff8c42',
          'accent-light': '#ffd93d',
          cyan: '#00d4ff',
          green: '#22c55e',
          warn: '#f59e0b',
          text: '#eaecf0',
          dim: '#6b7089',
          wire: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'fade-in': 'fadeIn 0.35s ease',
        'slide-up': 'slideUp 0.4s ease',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
