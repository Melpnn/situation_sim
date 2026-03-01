/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cafe: {
          cream: '#faf7f2',
          latte: '#f5efe6',
          foam: '#ebe4d8',
          caramel: '#c4a77d',
          espresso: '#5c4033',
          walnut: '#8b7355',
          sage: '#8a9a7b',
          rose: '#b8956c',
        },
      },
      boxShadow: {
        'cafe': '0 4px 20px rgba(92, 64, 51, 0.08)',
        'cafe-lg': '0 8px 30px rgba(92, 64, 51, 0.12)',
        'cafe-inner': 'inset 0 1px 2px rgba(255, 255, 255, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
