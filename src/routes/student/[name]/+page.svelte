<script lang="ts">
  import { page } from '$app/stores'
  import { scale, fade, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { josa } from 'es-hangul'

  import Log from '$lib/components/Log.svelte'
  import InfoDisplay from '$lib/components/InfoDisplay.svelte'
  import IconButton from '$lib/components/IconButton.svelte'

  import Add from '~icons/mdi/add'
  import Close from '~icons/mdi/close'
  import Check from '~icons/mdi/check'
  import PersonOff from '~icons/mdi/person-off'

  import { data, type Log as LogType, dataLoaded } from '$lib/stores'

  const student = $derived($data.find((s) => s.name === decodeURIComponent($page.params.name))!)

  // 로그 삭제
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

  // 새 기록 추가
  let newLog: (Omit<LogType, 'date'> & { date: Date | null }) | null = $state(null)
  let addedNewLog = $state(false)
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

    addedNewLog = true
    setTimeout(() => (addedNewLog = false), 300) // 더 나은 방법 필요
  }
</script>

{#if student}
  <div class="w-full space-y-1 overflow-y-auto p-12 pb-24">
    <div class="mx-auto w-1/2">
      {#each student.logs as log, i (log.date.getTime())}
        <Log {log} deleteLog={() => deleteLog(i)} />
      {/each}
      <div class="relative w-full">
        {#if newLog}
          <div
            class="absolute top-0 flex w-full origin-[50%_25%] flex-col gap-1"
            in:scale={{ duration: 300, start: 0.3, easing: expoOut }}
            out:scale={{ duration: addedNewLog ? 0 : 300, start: 0.3, easing: expoOut }}
          >
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
              class="w-full resize-none rounded-lg bg-stone-100 p-3 outline-none duration-150"
              bind:value={newLog.content}
              use:autosize
            ></textarea>
          </div>
        {:else}
          <div
            class="absolute top-0 mt-5 flex w-full justify-center"
            in:fly={{ duration: 300, y: addedNewLog ? -20 : 10 }}
            out:fade={{ duration: 100, easing: expoOut }}
          >
            <button
              class="flex items-center gap-2 rounded-full px-4 py-2 text-stone-500 duration-150 hover:bg-stone-100 active:scale-95 active:bg-stone-200"
              onclick={() => (newLog = { date: new Date(), content: '' })}
            >
              <Add class="h-6 w-6" />
              새 기록
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else if !$dataLoaded}
  <div></div>
{:else}
  {@const selectedStudentName = decodeURIComponent($page.params.name)}
  <InfoDisplay
    Icon={PersonOff}
    title={`학생 "${selectedStudentName}"${josa.pick(selectedStudentName, '을/를')} 찾을 수 없습니다`}
    description="학생이 삭제되었는지, 또는 링크가 올바른지 확인해주세요."
  />
{/if}
