/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff7ff',
          100: '#dceeff',
          500: '#1368ab',
          600: '#0f598f',
          700: '#0c4974',
          900: '#0d2940',
        },
      },
      boxShadow: {
        card: '0 12px 30px -22px rgba(13, 41, 64, 0.55)',
      },
    },
  },
  plugins: [],
}
