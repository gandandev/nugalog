<script lang="ts">
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { tooltip as useTooltip } from '$lib/utils'

  const {
    Icon,
    text,
    onclick,
    emphasized,
    disabled,
    tooltip,
    tooltipPosition = 'top'
  }: {
    Icon: any
    text?: string
    onclick?: () => void
    emphasized?: boolean
    disabled?: boolean
    tooltip?: string
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  } = $props()
</script>

<button
  class="flex h-8 items-center justify-center rounded-lg ring-stone-500 ring-offset-2 duration-150 enabled:hover:bg-stone-200 enabled:active:scale-90 enabled:active:bg-stone-300 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-stone-800 dark:enabled:hover:bg-stone-800 dark:enabled:active:bg-stone-700"
  class:w-auto={text}
  class:pr-2={text}
  class:ring-2={emphasized}
  {onclick}
  {disabled}
  use:useTooltip={tooltip ? { text: tooltip, position: tooltipPosition } : null}
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
