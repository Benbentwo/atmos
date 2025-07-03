/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-cpnavy',
    'bg-cpblue',
    'text-cpnavy',
    'text-cpblue'
  ],
  theme: {
    extend: {
      colors: {
        cpblue: '#0052CC',
        cpnavy: '#1B2636',
      },
    },
  },
  plugins: [],
};
