<script lang="ts">
  const { Icon, title, description } = $props<{
    Icon: any
    title: string
    description: string
  }>()
</script>

<div class="w-full p-12 text-center">
  <Icon class="mx-auto mb-2 h-16 w-16 text-stone-700" />
  <h1 class="text-xl font-semibold">{title}</h1>
  <p class="text-stone-500">{description}</p>
</div>
