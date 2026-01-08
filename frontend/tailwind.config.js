/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8EDF5',
          100: '#D1DBE8',
          200: '#A3B7D1',
          300: '#7593BA',
          400: '#476FA3',
          500: '#1A2B4C',
          600: '#152340',
          700: '#101B34',
          800: '#0B1328',
          900: '#060B1C',
        },
        accent: {
          DEFAULT: '#FF8049',
          hover: '#E86D3A',
        },
      },
    },
  },
  plugins: [],
};
