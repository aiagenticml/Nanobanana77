export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          50: '#1a1d27',
          100: '#232733',
          200: '#2d3140',
        },
        card: {
          DEFAULT: '#161922',
          hover: '#1c2030',
        },
        border: {
          DEFAULT: '#252a38',
          light: '#2f3545',
        },
        text: {
          DEFAULT: '#e8e6e3',
          secondary: '#c0c3cd',
          muted: '#9da1ad',
        },
        accent: {
          DEFAULT: '#d4a574',
          hover: '#e0b68a',
          muted: '#7a6244',
        },
        profit: {
          DEFAULT: '#4ade80',
          light: '#86efac',
          muted: '#166534',
        },
        loss: {
          DEFAULT: '#f87171',
          light: '#fca5a5',
          muted: '#7f1d1d',
        },
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(212, 165, 116, 0.15)',
        'glow-profit': '0 0 20px -5px rgba(74, 222, 128, 0.15)',
        'glow-loss': '0 0 20px -5px rgba(248, 113, 113, 0.15)',
        card: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
