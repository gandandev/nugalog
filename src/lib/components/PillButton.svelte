<script lang="ts">
  const { text, variant, onclick, disabled } = $props<{
    text: string
    onclick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
  }>()
</script>

<button
  class="rounded-full bg-black px-4 py-2 text-white duration-150 hover:bg-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 {variant}"
  {onclick}
  {disabled}
>
  {text}
</button>

<style lang="postcss">
  .primary {
    @apply bg-black text-white hover:bg-stone-800 active:bg-stone-900;
  }
  .secondary {
    @apply bg-stone-100 text-black hover:bg-stone-200 active:bg-stone-300;
  }
  .danger {
    @apply bg-red-500 text-white hover:bg-red-600 active:bg-red-700;
  }
</style>
