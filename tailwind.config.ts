import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'sans-serif']
      },
      width: {
        screen: '100dvw'
      },
      height: {
        screen: '100dvh'
      }
    }
  },

  future: {
    hoverOnlyWhenSupported: true
  },

  plugins: [
    function ({ addVariant }) {
      addVariant('touch', '@media (pointer: coarse)')
      addVariant('pointer', '@media (hover: hover) and (pointer: fine)')
    }
  ]
} satisfies Config
