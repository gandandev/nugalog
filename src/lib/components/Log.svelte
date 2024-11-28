<script lang="ts">
  const { log } = $props<{ log: { date: Date; content: string } }>()

  import ContentCopy from '~icons/mdi/content-copy'
  import Edit from '~icons/mdi/edit'
  import Delete from '~icons/mdi/delete'
</script>

<div class="group flex w-full flex-col gap-1 rounded-xl px-3 py-2 duration-150 hover:bg-stone-50">
  <div class="flex items-center justify-between">
    <span class="text-stone-500"
      >{log.date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span
    >
    <div class="flex items-center">
      <button
        class="rounded-lg p-1.5 text-stone-500 opacity-0 duration-150 hover:bg-stone-200 active:text-stone-600 group-hover:opacity-100 active:bg-stone-300"
      >
        <ContentCopy class="h-5 w-5" />
      </button>
      <button
        class="rounded-lg p-1.5 text-stone-500 opacity-0 duration-150 hover:bg-stone-200 active:text-stone-600 group-hover:opacity-100 active:bg-stone-300"
      >
        <Edit class="h-5 w-5" />
      </button>
      <button
        class="rounded-lg p-1.5 text-stone-500 opacity-0 duration-150 hover:bg-stone-200 active:text-stone-600 group-hover:opacity-100 active:bg-stone-300"
      >
        <Delete class="h-5 w-5" />
      </button>
    </div>
  </div>
  <p class="whitespace-pre-wrap font-sans">{log.content}</p>
</div>
