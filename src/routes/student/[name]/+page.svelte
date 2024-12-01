<script lang="ts">
  import Log from '$lib/components/Log.svelte'
  import Add from '~icons/mdi/add'

  import { data } from '$lib/stores'

  import { page } from '$app/stores'

  let student = $derived($data.find((s) => s.name === decodeURIComponent($page.params.name))!)

  function deleteLog(i: number) {
    $data = $data.map((s) => {
      if (s.name === student.name) {
        return {
          ...s,
          logs: s.logs.filter((_, index) => index !== i)
        }
      }
      return s
    })
  }
</script>

<div class="mx-auto min-w-[50%] space-y-1 overflow-y-auto p-12">
  {#each student.logs as log, i (log.date.getTime())}
    <Log {log} deleteLog={() => deleteLog(i)} />
  {/each}
  <div>
    <button
      class="mx-auto mt-5 flex items-center gap-2 rounded-full px-4 py-2 text-stone-500 duration-150 hover:bg-stone-100 active:bg-stone-200"
    >
      <Add class="h-6 w-6" />
      새 기록
    </button>
  </div>
</div>
