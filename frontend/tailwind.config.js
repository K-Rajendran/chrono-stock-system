/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold:    { DEFAULT: '#B8933A', light: '#D4AF6B', dark: '#8B6B2A', muted: 'rgba(184,147,58,0.12)' },
        ink:     { DEFAULT: '#080808', soft: '#0F0F0F', card: '#141414', raised: '#1A1A1A' },
        stone:   { DEFAULT: '#A0A09A', muted: '#5A5A55' },
        cream:   '#F5F5F0',
      },
      fontFamily: {
        serif:   ['Playfair Display', 'Georgia', 'serif'],
        display: ['Cormorant Garamond', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'gold':   '0 0 20px rgba(184,147,58,0.18), 0 0 60px rgba(184,147,58,0.06)',
        'gold-sm':'0 0 10px rgba(184,147,58,0.2)',
        'deep':   '0 24px 80px rgba(0,0,0,0.6)',
        'inset':  'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C4A24A 0%, #E8C96A 45%, #9A7A2A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0F0F0F 0%, #080808 100%)',
        'card-gradient': 'linear-gradient(145deg, #1A1A1A 0%, #141414 100%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.55s cubic-bezier(0,0,0.2,1) both',
        'fade-in':    'fadeIn 0.4s cubic-bezier(0,0,0.2,1) both',
        'float':      'float 5s ease-in-out infinite',
        'spin-slow':  'spin-slow 18s linear infinite',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'spin-slow':{ to: { transform: 'rotate(360deg)' } },
        shimmer:    { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        'pulse-ring':{ '0%': { boxShadow: '0 0 0 0 rgba(184,147,58,0.4)' }, '70%': { boxShadow: '0 0 0 12px rgba(184,147,58,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(184,147,58,0)' } },
      },
      transitionTimingFunction: { 'brand': 'cubic-bezier(0.4,0,0.2,1)' },
    },
  },
  plugins: [],
};
