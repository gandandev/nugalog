<script lang="ts">
  import Log from '$lib/components/Log.svelte'
  import IconButton from '$lib/components/IconButton.svelte'
  import Add from '~icons/mdi/add'
  import Close from '~icons/mdi/close'
  import Check from '~icons/mdi/check'

  import autosize from 'svelte-autosize'

  import { data, type Log as LogType } from '$lib/stores'

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

  let newLog: (Omit<LogType, 'date'> & { date: Date | null }) | null = $state(null)

  function saveNewLog() {
    $data = $data.map((s) => {
      if (s.name === student.name) {
        return {
          ...s,
          logs: [...s.logs, newLog as LogType]
        }
      }
      return s
    })

    newLog = null
  }
</script>

<div class="w-full space-y-1 overflow-y-auto p-12 pb-24">
  <div class="mx-auto w-1/2">
    {#each student.logs as log, i (log.date.getTime())}
      <Log {log} deleteLog={() => deleteLog(i)} />
    {/each}
    <div>
      {#if newLog}
        <div class="flex flex-col gap-1">
          <div class="ml-3 mt-2 flex items-center justify-between">
            <input
              type="date"
              value={newLog.date?.toISOString().slice(0, 10)}
              oninput={(e) =>
                (newLog!.date = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
            />
            <div class="flex items-center text-stone-500 duration-150 active:text-stone-600">
              <IconButton Icon={Close} text="취소" onclick={() => (newLog = null)} />
              <IconButton
                Icon={Check}
                text="저장"
                onclick={saveNewLog}
                disabled={!newLog.content.trim() || !newLog.date}
              />
            </div>
          </div>
          <textarea
            class="w-full resize-none rounded-lg bg-stone-100 p-3 duration-150 focus:outline-none"
            bind:value={newLog.content}
            use:autosize
          ></textarea>
        </div>
      {:else}
        <button
          class="mx-auto mt-5 flex items-center gap-2 rounded-full px-4 py-2 text-stone-500 duration-150 hover:bg-stone-100 active:bg-stone-200"
          onclick={() => (newLog = { date: new Date(), content: '' })}
        >
          <Add class="h-6 w-6" />
          새 기록
        </button>
      {/if}
    </div>
  </div>
</div>
