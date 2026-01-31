// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: '#1e40af',
        secondary: '#475569',
      },
    },
  },
  plugins: [],
}