<script lang="ts">
  import { page } from '$app/stores'
  import { scale, fade, fly, slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { josa } from 'es-hangul'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import Log from '$lib/components/Log.svelte'
  import InfoDisplay from '$lib/components/InfoDisplay.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import DragPreviewLine from '$lib/components/DragPreviewLine.svelte'

  import Add from '~icons/material-symbols/add-rounded'
  import PersonOff from '~icons/material-symbols/person-off-rounded'

  import { data, dataLoaded } from '$lib/stores'
  import {
    type DragState,
    createDragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } from '$lib/utils/reorder'

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
  let newLog: { id: string; date: Date | null; content: string } | null = $state(null)
  let addedNewLog = $state(false)
  function saveNewLog(savedLog: { date: Date; content: string }) {
    $data = $data.map((s) => {
      if (s.name === student.name) {
        return {
          ...s,
          logs: [...s.logs, { id: crypto.randomUUID(), ...savedLog }]
        }
      }
      return s
    })

    newLog = null
    addedNewLog = true
    setTimeout(() => (addedNewLog = false), 300)
  }

  // 드래그 상태
  let dragState: DragState<{ id: string; date: Date; content: string }> = $state(createDragState())

  // 페이지 이동 확인
  let showNavigationDialog = $state(false)
  let pendingNavigation: { to: string; save: () => void } | null = $state(null)

  onMount(() => {
    const handler = (e: CustomEvent<{ to: string; save: () => void }>) => {
      showNavigationDialog = true
      pendingNavigation = e.detail
    }

    window.addEventListener('showNavigationDialog' as any, handler)
    return () => window.removeEventListener('showNavigationDialog' as any, handler)
  })
</script>

<div class="h-full space-y-1 overflow-y-auto">
  {#if student}
    <div
      class="mx-auto w-full max-w-[600px] px-3 pb-32 pt-0.5 md:px-6 lg:w-1/2 lg:min-w-[600px] lg:px-12"
    >
      <!-- 기록 목록 -->
      <div
        role="list"
        ondragleave={(e: DragEvent) => handleDragLeave(e, dragState, 'div[role="list"]')}
        ondragover={(e: DragEvent) => e.preventDefault()}
      >
        {#key student.name}
          {#each student.logs as log, i (log.id)}
            <div
              ondragover={(e: DragEvent) =>
                handleDragOver(e, i, true, dragState, student.logs, (log) => log.id)}
              ondrop={() => {
                handleDrop(
                  dragState,
                  student.logs,
                  (newLogs) => {
                    $data = $data.map((s) => {
                      if (s.name === student.name) {
                        return {
                          ...s,
                          logs: newLogs
                        }
                      }
                      return s
                    })
                  },
                  (log) => log.id
                )
              }}
              role="listitem"
              in:fly={{ y: 10, duration: 300 }}
              out:slide={{ axis: 'y', duration: 300 }}
            >
              <!-- 순서 변경 위치 미리보기 -->
              <DragPreviewLine
                class={dragState.dropPreviewIndex === i ? 'opacity-100' : 'opacity-0'}
              />

              <Log
                {log}
                deleteLog={() => deleteLog(i)}
                dragged={dragState.draggedItem === log}
                ondragstart={(e: DragEvent) => handleDragStart(e, log, dragState)}
                ondragend={() => handleDragEnd(dragState)}
              />
            </div>
          {/each}
        {/key}
        <div class="h-0.5">
          {#if dragState.dropPreviewIndex === student.logs.length}
            <DragPreviewLine class="relative -top-0.5" />
          {/if}
        </div>
      </div>

      <!-- 새 기록 추가 -->
      <div class="relative w-full">
        {#if newLog}
          <div
            class="absolute top-0 w-full origin-[50%_25%] pb-12"
            in:scale={{ duration: 300, start: 0.3, easing: expoOut }}
            out:scale={{ duration: addedNewLog ? 0 : 300, start: 0.3, easing: expoOut }}
          >
            <Log log={newLog} isNew={true} {saveNewLog} cancelNewLog={() => (newLog = null)} />
          </div>
        {:else}
          <div
            class="absolute top-0 mt-5 flex w-full justify-center"
            in:fly={{ duration: 300, y: addedNewLog ? -20 : 10 }}
            out:fade={{ duration: 100, easing: expoOut }}
          >
            <button
              class="flex items-center gap-2 rounded-full px-4 py-2 text-stone-500 duration-150 hover:bg-stone-100 active:scale-95 active:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-900 dark:active:bg-stone-800"
              onclick={() => (newLog = { id: crypto.randomUUID(), date: new Date(), content: '' })}
            >
              <Add class="h-6 w-6" />
              새 기록
            </button>
          </div>
        {/if}
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
</div>

<Dialog
  show={showNavigationDialog && !!pendingNavigation}
  title="저장하지 않은 변경 사항이 있습니다."
  description="저장 후 이동하시겠습니까?"
  actions={[
    {
      label: '취소',
      variant: 'secondary',
      cancel: true
    },
    {
      label: '저장하고 이동',
      variant: 'primary',
      onclick: async () => {
        if (!pendingNavigation) return
        const to = pendingNavigation.to
        pendingNavigation.save()
        showNavigationDialog = false
        pendingNavigation = null
        goto(to)
      },
      onenter: true
    }
  ]}
  cancel={() => {
    showNavigationDialog = false
    pendingNavigation = null
  }}
/>
