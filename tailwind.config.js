/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
      colors: {
        primary: '#2c3e50',
        'primary-hover': '#34495e',
        accent: '#3498db',
        danger: '#c0392b',
      }
    },
  },
  plugins: [],
}
