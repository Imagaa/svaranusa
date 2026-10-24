import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',   
  ],
  theme: {
    extend: {
      animation: {
        'swipe': 'swipe 1.5s ease-in-out infinite',
        'scroll-wheel': 'scroll-wheel 1s ease-in-out infinite',
      },
      keyframes: {
        'swipe': {
          '0%, 100%': { transform: 'translateX(12px)' },
          '50%':      { transform: 'translateX(-12px)' },
        },
        'scroll-wheel': {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '1' },
          '50%':      { transform: 'translateY(4px)', opacity: '0.4' },
        },
      },
      colors: {
        'svara-black': '#0B0B0B',
        'svara-green': '#B6E23A',
        'svara-orange': '#F06A2A',
        'svara-gold': '#CC9933',
        'svara-maroon': '#701111',
        'svara-white': '#F2F2F2',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;