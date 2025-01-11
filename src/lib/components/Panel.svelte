<script lang="ts">
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  let { show, children }: { show: boolean; children: any } = $props()
</script>

{#if show}
  <div
    class="fixed inset-y-0 left-0 right-0 z-10 flex items-center justify-center bg-white md:left-64 dark:bg-stone-950"
    transition:fly={{ y: 100, duration: 400, easing: expoOut }}
  >
    {@render children()}
  </div>
{/if}
