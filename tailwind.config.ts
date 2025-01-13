import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'sans-serif']
      },
      width: {
        dscreen: '100dvw'
      },
      height: {
        dscreen: '100dvh'
      },
      spacing: {
        safe: 'var(--sat) var(--sar) var(--sab) var(--sal)',
        'safe-top': 'var(--sat)',
        'safe-bottom': 'var(--sab)',
        'safe-left': 'var(--sal)',
        'safe-right': 'var(--sar)'
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
