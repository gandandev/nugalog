<script lang="ts">
  import { fade } from 'svelte/transition'
  const { class: className = '' }: { class?: string } = $props()
</script>

<div
  class="h-0.5 rounded-full bg-blue-500 {className}"
  role="presentation"
  transition:fade={{ duration: 100 }}
></div>
