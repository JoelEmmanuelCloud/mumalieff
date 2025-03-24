/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    darkMode: 'class', // or 'media' for system preference
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'sans-serif'],
          display: ['Montserrat', 'sans-serif'],
        },
        colors: {
          primary: {
            DEFAULT: '#000000',
            light: '#333333',
            dark: '#000000',
          },
          secondary: {
            DEFAULT: '#FFFFFF',
            light: '#FFFFFF',
            dark: '#F5F5F5',
          },
          accent: {
            gold: {
              DEFAULT: '#D4AF37',
              light: '#F5DD90',
              dark: '#996515',
            },
            blue: {
              DEFAULT: '#1E3A8A',
              light: '#3B82F6',
              dark: '#0F172A',
            },
          },
          success: {
            DEFAULT: '#10B981',
            light: '#A7F3D0',
            dark: '#047857',
          },
          warning: {
            DEFAULT: '#F59E0B',
            light: '#FDE68A',
            dark: '#B45309',
          },
          error: {
            DEFAULT: '#EF4444',
            light: '#FEE2E2',
            dark: '#B91C1C',
          },
          dark: {
            bg: '#121212',
            card: '#1E1E1E',
            text: '#E5E5E5',
          },
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        },
        transitionProperty: {
          'height': 'height',
          'spacing': 'margin, padding',
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'slide-in': 'slideIn 0.5s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          slideIn: {
            '0%': { transform: 'translateY(20px)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
        },
        spacing: {
          '72': '18rem',
          '84': '21rem',
          '96': '24rem',
        },
        zIndex: {
          '60': '60',
          '70': '70',
          '80': '80',
          '90': '90',
          '100': '100',
        },
      },
    },
    plugins: [],
  };