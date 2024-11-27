import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'sans-serif'],
        monasans: ['Mona-Sans', 'sans-serif']
      }
    }
  },

  plugins: []
} satisfies Config
