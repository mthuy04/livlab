import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-main':      '#F7F8F4',
        'bg-secondary': '#EEF3EA',
        'bg-card':      '#FFFFFF',
        'bg-ivory':     '#FFFDF7',
        'bg-dark':      '#17201B',
        'bg-dark-2':    '#1E2820',
        'text-deep':    '#17201B',
        'text-muted':   '#667067',
        'text-light':   '#9AA89B',
        sage:           '#6F8A72',
        'deep-olive':   '#314737',
        'soft-mint':    '#DDEBDD',
        copper:         '#C97855',
        border:         '#E2E8DE',
        'border-strong':'#C8D5C6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      maxWidth: {
        '8xl': '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
