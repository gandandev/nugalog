import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    screens: {
      // Desktop-first
      xl: { max: '1279px' },
      lg: { max: '1023px' },
      md: { max: '767px' },
      sm: { max: '639px' }
    },
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'sans-serif'],
        monasans: ['Mona-Sans', 'sans-serif']
      }
    }
  },

  plugins: []
} satisfies Config
