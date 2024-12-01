<script lang="ts">
  const { Icon, text, onclick } = $props<{ Icon: any; text?: string; onclick?: () => void }>()
</script>

<button
  class="flex h-8 w-8 items-center justify-center gap-1 rounded-lg duration-150 hover:bg-stone-200 active:bg-stone-300"
  class:w-auto={text}
  class:px-2={text}
  {onclick}
>
  <Icon />
  {#if text}
    <span>{text}</span>
  {/if}
</button>
