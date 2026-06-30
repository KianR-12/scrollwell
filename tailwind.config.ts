import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        ink:       '#111111',
        muted:     '#888888',
        faint:     '#aaaaaa',
        ghost:     '#cccccc',
        border:    '#D0CCC4',
        'bg-warm': '#E8E4DC',
        'bg-page': '#E8E5DE',
        'bg-light': '#F0ECE4',
      },
    },
  },
  plugins: [],
} satisfies Config
