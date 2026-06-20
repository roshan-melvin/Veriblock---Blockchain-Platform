/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        panel: 'var(--bg-panel)',
        'panel-raised': 'var(--bg-panel-raised)',
        hairline: 'var(--border-hairline)',
        primary: 'var(--text-primary)',
        dim: 'var(--text-dim)',
        verified: 'var(--state-verified)',
        tampered: 'var(--state-tampered)',
        unverified: 'var(--state-unverified)',
        gold: 'var(--accent-gold)',
      },
      fontFamily: {
        display: ['Sora', 'Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 0 var(--state-verified)' },
          '50%': { boxShadow: '0 0 20px 4px var(--state-verified)' },
        },
        'pulse-glow-red': {
          '0%, 100%': { boxShadow: '0 0 8px 0 var(--state-tampered)' },
          '50%': { boxShadow: '0 0 20px 4px var(--state-tampered)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'shatter-spread': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.15) rotate(2deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'cascade-flash': {
          '0%': { borderColor: 'var(--state-verified)', backgroundColor: 'transparent' },
          '30%': { borderColor: 'var(--state-tampered)', backgroundColor: 'rgba(255,77,79,0.08)' },
          '100%': { borderColor: 'var(--state-tampered)', backgroundColor: 'transparent' },
        },
        'hash-char-change': {
          '0%': { color: 'var(--accent-gold)', transform: 'scale(1.3)' },
          '100%': { color: 'var(--state-verified)', transform: 'scale(1)' },
        },
        'block-expand': {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
        'status-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s ease-out both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-glow-red': 'pulse-glow-red 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'shatter': 'shatter-spread 0.6s ease-out both',
        'cascade-flash': 'cascade-flash 0.5s ease-out both',
        'hash-char': 'hash-char-change 0.5s ease-out both',
        'block-expand': 'block-expand 0.4s ease-out both',
        'status-blink': 'status-blink 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
