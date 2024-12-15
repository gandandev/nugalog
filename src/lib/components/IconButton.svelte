<script lang="ts">
  const { Icon, text, onclick, disabled } = $props<{
    Icon: any
    text?: string
    onclick?: () => void
    disabled?: boolean
  }>()
</script>

<button
  class="flex h-8 w-8 items-center justify-center gap-1 rounded-lg duration-150 hover:bg-stone-200 active:scale-90 active:bg-stone-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
  class:w-auto={text}
  class:px-2={text}
  {onclick}
  {disabled}
>
  <Icon />
  {#if text}
    <span>{text}</span>
  {/if}
</button>
