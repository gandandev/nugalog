<script lang="ts">
  import { fade, scale } from 'svelte/transition'

  import PillButton from './PillButton.svelte'

  type DialogAction = {
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    onenter?: boolean
    disabled?: boolean
  } & (
    | {
        onclick: () => void
        cancel?: false
      }
    | {
        onclick?: never
        cancel: true
      }
  )
  const {
    title,
    description,
    actions,
    cancel,
    children
  }: {
    title: string
    description?: string
    actions: DialogAction[]
    cancel?: () => void
    children?: any
  } = $props()
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') cancel?.()
    if (e.key == 'Enter') actions.find((action: DialogAction) => action.onenter)?.onclick?.()
  }}
/>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
  transition:fade|global={{ duration: 100 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) cancel?.()
  }}
  role="presentation"
>
  <div
    class="min-w-96 rounded-2xl bg-white p-5 dark:bg-stone-800"
    transition:scale|global={{ start: 0.9, duration: 200 }}
  >
    <h2 class="text-xl font-semibold">{title}</h2>
    <p class="mt-1 whitespace-pre-wrap text-sm text-stone-500">{description}</p>
    {#if children}
      <div class="mt-3">{@render children()}</div>
    {/if}
    <div class="mt-3 flex justify-end gap-2">
      {#each actions as action}
        <PillButton
          text={action.label}
          onclick={action.cancel ? (cancel as () => void) : action.onclick}
          variant={action.variant}
          disabled={action.disabled}
        />
      {/each}
    </div>
  </div>
</div>
