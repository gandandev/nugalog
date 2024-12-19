<script lang="ts">
  import { fade, scale } from 'svelte/transition'

  import PillButton from './PillButton.svelte'

  type DialogAction = {
    label: string
    variant: 'primary' | 'secondary' | 'danger'
    onenter?: boolean
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
  const { title, description, actions, cancel } = $props<{
    title: string
    description?: string
    actions: DialogAction[]
    cancel: () => void
  }>()
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') cancel()
    if (e.key == 'Enter') actions.find((action: DialogAction) => action.onenter)?.onclick()
  }}
/>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
  transition:fade={{ duration: 100 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) cancel()
  }}
  role="presentation"
>
  <div
    class="w-96 rounded-2xl bg-white p-5 dark:bg-stone-800"
    transition:scale={{ start: 0.9, duration: 200 }}
  >
    <h2 class="text-xl font-semibold">{title}</h2>
    <p class="mt-1 text-sm text-stone-500">{description}</p>
    <div class="mt-2 flex justify-end gap-2">
      {#each actions as action}
        <PillButton
          text={action.label}
          onclick={action.cancel ? cancel : action.onclick}
          variant={action.variant}
        />
      {/each}
    </div>
  </div>
</div>
