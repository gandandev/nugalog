<script lang="ts">
  import { onClickOutside } from '$lib/utils/clickOutside'
  import { scale, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  type Option = {
    Icon: any
    label: string
    danger?: boolean
    onclick: () => void
    disabled?: boolean
    closeMenuOnClick?: boolean
  }

  const {
    show,
    class: className,
    options,
    button,
    closeMenu,
    children
  }: {
    show: boolean
    class?: string
    options: Option[]
    button: HTMLElement | null
    closeMenu: () => void
    children?: any
  } = $props()
</script>

{#if show}
  <div
    class="absolute z-50 flex w-48 flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800 {className}"
    transition:scale={{ duration: 200, start: 0.9, easing: expoOut }}
    use:onClickOutside={{
      callback: closeMenu,
      exclude: [button]
    }}
  >
    {@render children?.()}
    {#each options as option}
      <button
        class="flex h-8 items-center gap-2 rounded-md px-3 py-1 duration-150 enabled:hover:bg-stone-100 enabled:active:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 enabled:dark:hover:bg-stone-700 enabled:dark:active:bg-stone-600 {option.danger
          ? 'enabled:hover:text-red-600 enabled:dark:hover:text-red-500'
          : ''}"
        onclick={() => {
          option.onclick()
          if (option.closeMenuOnClick) closeMenu()
        }}
        disabled={option.disabled}
        onkeydown={(e) => {
          if (e.key === 'Escape' || (e.key === 'Tab' && !e.shiftKey)) {
            e.preventDefault()
            closeMenu()
          }
        }}
        role="menuitem"
      >
        {#key option.Icon}
          <div class="absolute h-5 w-5" transition:scale={{ duration: 150, start: 0.5 }}>
            <option.Icon class="h-5 w-5" />
          </div>
        {/key}
        {#key option.label}
          <span
            class="absolute left-11"
            in:fly={{ duration: 150, x: -10 }}
            out:fly={{ duration: 150, x: 10 }}
          >
            {option.label}
          </span>
        {/key}
      </button>
    {/each}
  </div>
{/if}
