<script lang="ts">
  import { scale, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { tooltip as useTooltip } from '$lib/utils/tooltip'

  const {
    Icon,
    text,
    tooltip,
    tooltipPosition = 'top',
    onclick,
    emphasized,
    disabled
  }: {
    Icon: any
    text?: string
    tooltip?: string
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
    onclick?: () => void
    emphasized?: boolean
    disabled?: boolean
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
  <div class="relative h-8 w-8">
    {#key Icon}
      <div class="absolute left-0 top-0" transition:scale={{ duration: 150, start: 0.5 }}>
        <Icon class="m-1.5 h-5 w-5" />
      </div>
    {/key}
  </div>
  {#if text}
    <span
      class="whitespace-nowrap"
      transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
    >
      {text}
    </span>
  {/if}
</button>
