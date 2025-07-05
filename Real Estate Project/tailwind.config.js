/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
      colors: {
        primary: '#6C63FF',
        secondary: '#4c46b6',
        accent: '#4fb646',
        dark: '#202020',
        light: '#FFFFFF',
        gray: '#707070',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
