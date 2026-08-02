import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0E17',
        base: '#0D1220',
        surface: '#131A2A',
        elevated: '#1A2338',
        border: {
          subtle: 'rgba(148, 163, 184, 0.08)',
          DEFAULT: 'rgba(148, 163, 184, 0.14)',
          glow: 'rgba(56, 189, 248, 0.35)',
        },
        blue: {
          DEFAULT: '#38BDF8',
          deep: '#0EA5E9',
        },
        cyan: '#22D3EE',
        green: '#34D399',
        amber: '#FBBF24',
        red: {
          DEFAULT: '#F87171',
          deep: '#EF4444',
        },
        text: {
          bright: '#F1F5F9',
          DEFAULT: '#CBD5E1',
          muted: '#64748B',
          faint: '#475569',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        4.5: '18px',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        pill: '999px',
        inset: '6px',
        hero: '16px',
      },
      boxShadow: {
        'glow-blue': '0 0 0 1px rgba(56,189,248,0.12), 0 8px 24px -8px rgba(56,189,248,0.25)',
        'glow-blue-sm': '0 0 16px 0 rgba(56,189,248,0.18)',
        'inset-top': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(rgba(148,163,184,0.14) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(circle at 50% 0%, rgba(56,189,248,0.06), transparent 60%)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sheen: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(250%) skewX(-20deg)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(0.85)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(56,189,248,0.4)' },
          '100%': { boxShadow: '0 0 0 8px rgba(56,189,248,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        sheen: 'sheen 3.2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
