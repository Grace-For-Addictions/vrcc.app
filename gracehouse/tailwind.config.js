/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plum: { DEFAULT: '#3B2880', dark: '#1C1040', light: '#EEE9FB' },
        teal: { DEFAULT: '#0D6E62', light: '#E4F5F2' },
        amber: { DEFAULT: '#B8710C', light: '#FBEFD8' },
        paper: '#F7F5EF', ink: '#1A1728', muted: '#5C6478', line: '#E6E1F5',
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
