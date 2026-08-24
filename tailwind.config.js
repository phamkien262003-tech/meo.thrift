/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        terracotta: { DEFAULT: '#C67B5C', dark: '#A85F45', light: '#E0A588' },
        olive: { DEFAULT: '#6B7B3C', dark: '#54622F', light: '#8B9A5C' },
        rose: { DEFAULT: '#D4A5A5', dark: '#BD8484', light: '#E8C7C7' },
        cream: '#FBF8F2',
        card: '#FFFDF9',
        sand: '#EFE7D8',
        border: '#E4D9C4',
        espresso: '#3A2E27',
        'espresso-soft': '#6B5D52',
      },
      fontFamily: {
        serif: ['Cormorant', 'Georgia', 'serif'],
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        organic: '2rem 1.5rem 2rem 1.5rem',
      },
      boxShadow: {
        soft: '0 8px 30px -8px rgba(58, 46, 39, 0.18)',
        card: '0 4px 16px -6px rgba(58, 46, 39, 0.14)',
      },
      transitionDuration: {
        250: '250ms',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease-out both',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
};
