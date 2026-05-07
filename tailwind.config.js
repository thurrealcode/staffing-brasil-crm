/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#111113',
        'surface-2': '#18181b',
        'surface-3': '#1c1c20',
        border: '#27272a',
        'border-light': '#3f3f46',
        text: '#fafafa',
        'text-muted': '#a1a1aa',
        'text-subtle': '#71717a',
        accent: '#ef4444',
        'accent-hover': '#dc2626',
        'accent-glow': 'rgba(239, 68, 68, 0.15)',
        'white-glow': 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.08), transparent)',
        'red-glow': 'radial-gradient(ellipse 40% 30% at 50% 100%, rgba(239,68,68,0.12), transparent)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(255,255,255,0.04)',
        'glow-md': '0 0 40px rgba(255,255,255,0.06)',
        'glow-red': '0 0 20px rgba(239,68,68,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'counter': 'counter 1s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGlow: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
}
