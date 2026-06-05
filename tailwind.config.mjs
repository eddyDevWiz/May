/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.5rem', lg: '2rem' },
    },
    extend: {
      colors: {
        pink: {
          DEFAULT: '#ff4691',
          dark:    '#e53d82',
          light:   '#ff6ea8',
          bg:      '#fff0f6',
        },
        cream: '#f8f6f3',
      },
      fontFamily: {
        sans:    ['Poppins', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl:  '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card:  '0 2px 16px rgba(0,0,0,0.08)',
        hover: '0 8px 32px rgba(0,0,0,0.14)',
        pink:  '0 4px 16px rgba(255,70,145,0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounce: {
          '0%,100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%':     { transform: 'translateX(-50%) translateY(6px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'float':   'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-x':'bounce 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
