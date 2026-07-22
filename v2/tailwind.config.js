/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        grace: {
          50: '#f4f7f4',
          100: '#e3ece3',
          200: '#c5d9c6',
          300: '#9bbf9e',
          400: '#6da072',
          500: '#4c8352',
          600: '#3a6940',
          700: '#2f5434',
          800: '#28442c',
          900: '#223925',
        },
        gold: {
          400: '#e3b341',
          500: '#d4a017',
        },
        night: {
          800: '#1d2430',
          900: '#141a24',
        },
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}
