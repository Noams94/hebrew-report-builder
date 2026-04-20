/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        serif: ['"Frank Ruhl Libre"', 'serif'],
      },
      colors: {
        paper: '#faf9f6',
        ink: '#1a1a1a',
        accent: '#1e3a5f',
        subtle: '#e7e5e0',
      },
    },
  },
  plugins: [],
}
