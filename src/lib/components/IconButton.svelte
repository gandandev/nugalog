<script lang="ts">
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  const { Icon, text, onclick, emphasized, disabled } = $props<{
    Icon: any
    text?: string
    onclick?: () => void
    emphasized?: boolean
    disabled?: boolean
  }>()
</script>

<button
  class="flex h-8 items-center justify-center rounded-lg ring-neutral-500 ring-offset-2 duration-150 hover:bg-stone-200 active:scale-90 active:bg-stone-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
  class:w-auto={text}
  class:pr-2={text}
  class:ring-2={emphasized}
  {onclick}
  {disabled}
>
  <Icon class="m-1.5 h-5 w-5" />
  {#if text}
    <span
      class="whitespace-nowrap"
      transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
    >
      {text}
    </span>
  {/if}
</button>
