<script lang="ts">
  const {
    text,
    variant = 'primary',
    onclick,
    disabled
  }: {
    text: string
    variant?: 'primary' | 'secondary' | 'danger'
    onclick: () => void
    disabled?: boolean
  } = $props()
</script>

<button
  class="rounded-full px-4 py-2 duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 {variant ??
    'primary'}"
  {onclick}
  {disabled}
>
  {text}
</button>

<style lang="postcss">
  .primary {
    @apply bg-black text-white enabled:hover:bg-stone-800 enabled:active:bg-stone-900 dark:bg-stone-100 dark:text-stone-800 dark:enabled:hover:bg-stone-300 dark:enabled:active:bg-stone-400;
  }
  .secondary {
    @apply bg-stone-100 text-black enabled:hover:bg-stone-200 enabled:active:bg-stone-300 dark:bg-stone-800 dark:text-white dark:enabled:hover:bg-stone-700 dark:enabled:active:bg-stone-600;
  }
  .danger {
    @apply bg-red-500 text-white enabled:hover:bg-red-600 enabled:active:bg-red-700;
  }
</style>
