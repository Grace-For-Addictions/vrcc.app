/** @type {import('tailwindcss').Config} */
// Quantum UI Kit palette v2 — SPACE BLACK with RECOVERY PURPLE hues.
// Purple is the color of recovery awareness; the deep space black keeps
// every screen calm, low-glare, and gentle at night.
// Token names are kept (moss/spore/lichen/amber) so every component restyles at once:
//   moss  = space-black neutrals (violet-tinted darks)
//   spore = recovery purple (primary accent, glow)
//   lichen= soft orchid (secondary)
//   amber = warm candle-gold (crisis strip, gentle alerts)
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50:  '#f4f2fa', 100: '#e7e2f3', 200: '#cfc6e4', 300: '#ada0cb',
          400: '#8b7cae', 500: '#6d5f90', 600: '#554a73', 700: '#3f375a',
          800: '#2b2441', 900: '#19142c', 950: '#0a0714',
        },
        spore: {
          50: '#f6f2ff', 100: '#ece3ff', 200: '#d9c7ff', 300: '#c2a5fc',
          400: '#a982f8', 500: '#8f5ff3', 600: '#7745d8', 700: '#6034b2',
        },
        lichen: { 100: '#f8ecfa', 200: '#ebd0f1', 300: '#d8abe3', 400: '#c084d2', 500: '#a561ba' },
        amber: { 100: '#fbf0d7', 200: '#f2dda6', 300: '#e8c87e', 400: '#dcae4f' },
      },
      boxShadow: { glow: '0 0 28px rgba(143, 95, 243, 0.28)' },
      fontFamily: { display: ['Fraunces', 'Georgia', 'serif'] },
    },
  },
  plugins: [],
};
