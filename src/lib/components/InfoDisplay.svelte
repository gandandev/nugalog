<script lang="ts">
  const {
    Icon,
    title,
    description
  }: {
    Icon: any
    title: string
    description: string
  } = $props()
</script>

<div class="w-full p-6 text-center">
  <Icon class="mx-auto mb-2 h-16 w-16 text-stone-700 dark:text-stone-400" />
  <h1 class="text-xl font-semibold">{title}</h1>
  <p class="text-stone-500 dark:text-stone-400">{description}</p>
</div>
