/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space palette
        'space': {
          950: '#020617',
          900: '#0a0e27',
          800: '#0f172a',
          700: '#1a1f3a',
          600: '#252b4a',
        },
        // Neon accents
        'neon': {
          cyan: '#06d6a0',
          blue: '#0ea5e9',
          violet: '#8b5cf6',
          pink: '#ec4899',
          amber: '#f59e0b',
          red: '#ef4444',
        },
        // Glass
        'glass': {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.08)',
          heavy: 'rgba(255, 255, 255, 0.12)',
        },
      },
      fontFamily: {
        'display': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 214, 160, 0.3), 0 0 60px rgba(6, 214, 160, 0.1)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.3), 0 0 60px rgba(14, 165, 233, 0.1)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3), 0 0 60px rgba(236, 72, 153, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 15s linear infinite reverse',
        'shake': 'shake 0.5s ease-in-out infinite',
        'comet': 'comet 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { opacity: '0.5', filter: 'brightness(1)' },
          '100%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        },
        comet: {
          '0%': { transform: 'translateX(-100px) translateY(50px)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateX(20px) translateY(-10px)', opacity: '0.8' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
