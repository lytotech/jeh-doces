/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        caramel: {
          50: '#FAF5EE',
          100: '#F4ECE0',
          200: '#E7D5BF',
          300: '#D7BC9B',
          400: '#C79F73',
          500: '#B57E44', // Main brand caramel
          600: '#9E6733',
          700: '#845025',
          800: '#6C3F1D',
          900: '#543015',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F2ECE1',
          300: '#E8DECFC',
          400: '#D5C4AC',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(181, 126, 68, 0.08)',
        'card': '0 1px 4px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(181, 126, 68, 0.05)',
      }
    },
  },
  plugins: [],
}
