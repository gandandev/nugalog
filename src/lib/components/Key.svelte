<script lang="ts">
  let { children } = $props()
</script>

<kbd
  class="rounded-md border border-b-2 border-stone-300 px-1 py-0.5 text-xs dark:border-stone-700"
>
  {@render children()}
</kbd>
