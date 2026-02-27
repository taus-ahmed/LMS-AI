/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'asu-maroon': '#8C1D40',
        'asu-gold': '#FFC627',
        'asu-black': '#000000',
        'asu-white': '#FFFFFF',
        'asu-dark-gray': '#5C6670',
        'asu-light-gray': '#E8E8E8',
      },
    },
  },
  plugins: [],
}
