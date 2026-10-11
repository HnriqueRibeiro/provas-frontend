/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17213d',
        muted: '#75809a',
        brand: '#4f46e5',
      },
      boxShadow: {
        soft: '0 12px 36px rgba(27, 39, 78, 0.07)',
      },
    },
  },
  plugins: [],
};
