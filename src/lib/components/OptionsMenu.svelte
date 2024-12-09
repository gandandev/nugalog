<script lang="ts">
  const { show, setShow, actions } = $props<{
    show: boolean
    setShow: (show: boolean) => void
    actions: {
      Icon: any
      label: string
      onclick: () => void
      variant?: 'primary' | 'danger'
    }[]
  }>()

  let optionsMenu: HTMLDivElement | null = $state(null)
  let optionsButton: HTMLButtonElement | null = $state(null)

  import { scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!optionsMenu?.contains(target) && !optionsButton?.contains(target)) {
      setShow(false)
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

{#if show}
  <div
    bind:this={optionsMenu}
    class="absolute right-0 top-full z-10 mt-1 flex w-48 origin-top-right flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
    transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
  >
    {#each actions as action}
      <button
        class="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-stone-100 {action.variant}"
        onclick={action.onclick}
      >
        <action.Icon class="h-5 w-5" />
        {action.label}
      </button>
    {/each}
  </div>
{/if}

<style lang="postcss">
  .danger {
    @apply hover:bg-red-50 hover:text-red-500;
  }
</style>
