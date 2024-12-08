<script lang="ts">
  const { title, description, actions, oncancel } = $props<{
    title: string
    description?: string
    actions: {
      label: string
      onclick: () => void
      variant: 'primary' | 'secondary' | 'danger'
    }[]
    oncancel: () => void
  }>()

  import { fade, scale } from 'svelte/transition'
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
  transition:fade={{ duration: 100 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) oncancel()
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') oncancel()
  }}
  role="presentation"
>
  <div class="w-96 rounded-2xl bg-white p-5" transition:scale={{ start: 0.9, duration: 200 }}>
    <h2 class="text-xl font-bold">{title}</h2>
    <p class="mt-1 text-sm text-stone-500">{description}</p>
    <div class="mt-2 flex justify-end gap-2">
      {#each actions as action}
        <button
          class="rounded-full px-4 py-2 duration-150 {action.variant}"
          onclick={action.onclick}
        >
          {action.label}
        </button>
      {/each}
    </div>
  </div>
</div>

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
