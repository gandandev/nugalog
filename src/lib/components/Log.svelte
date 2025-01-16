<script lang="ts">
  import { beforeNavigate } from '$app/navigation'
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement } from '$lib/utils/focus'
  import { onClickOutside } from '$lib/utils/clickOutside'
  import { useCopyFeedback } from '$lib/utils/copyFeedback'
  import { page } from '$app/stores'
  import { data, type Student } from '$lib/stores'

  import IconButton from './IconButton.svelte'
  import EditorPanel from './EditorPanel.svelte'
  import DatePicker from './DatePicker.svelte'

  import ContentCopy from '~icons/material-symbols/content-copy-rounded'
  import Edit from '~icons/material-symbols/edit-rounded'
  import ArrowUpward from '~icons/material-symbols/arrow-upward-rounded'
  import ArrowDownward from '~icons/material-symbols/arrow-downward-rounded'
  import Delete from '~icons/material-symbols/delete-rounded'
  import Check from '~icons/material-symbols/check-rounded'
  import Close from '~icons/material-symbols/close-rounded'
  import Expand from '~icons/material-symbols/expand-rounded'
  import MoreHoriz from '~icons/material-symbols/more-horiz'
  import ChevronRight from '~icons/material-symbols/chevron-right-rounded'
  import CalendarToday from '~icons/material-symbols/calendar-today-rounded'

  const {
    log,
    isNew = false,
    deleteLog,
    saveNewLog,
    cancelNewLog,
    dragged = false,
    ondragstart,
    ondragend
  }: {
    log: { id: string; date: Date | null; content: string }
    isNew?: boolean
    deleteLog?: () => void
    saveNewLog?: (log: { date: Date; content: string }) => void
    cancelNewLog?: () => void
    dragged?: boolean
    ondragstart?: (e: DragEvent) => void
    ondragend?: () => void
  } = $props()

  // 삭제 확인
  let confirmingDelete = $state(false)

  // 편집
  let editing = $state(isNew)
  let date: Date | null = $state(log.date)
  let content = $state(log.content)

  let editorExpanded = $state(false)
  let datePickerOpen = $state(false)
  let datePickerButton: HTMLElement | null = $state(null)

  beforeNavigate((navigation) => {
    if (editing && !navigation.willUnload && navigation.to?.url.pathname !== $page.url.pathname) {
      navigation.cancel()
      window.dispatchEvent(
        new CustomEvent('showNavigationDialog', {
          detail: {
            to: navigation.to?.url.pathname ?? '/',
            save: () => {
              save()
              editing = false
              editorExpanded = false
              actionButtonExpanded = false
            }
          }
        })
      )
    }
  })

  function moveLog(direction: number) {
    // 현재 학생의 로그 목록에서 이 로그의 위치를 찾아서 위/아래로 이동
    const student = $data.find((s) => s.name === decodeURIComponent($page.params.name))
    if (!student) return

    const currentIndex = student.logs.findIndex((l) => l.id === log.id)
    const newIndex = currentIndex + direction

    // 범위를 벗어나면 이동하지 않음
    if (newIndex < 0 || newIndex >= student.logs.length) return

    // 로그 순서 변경
    $data = $data.map((s) => {
      if (s.name === student.name) {
        const logs = [...s.logs]
        const [movedLog] = logs.splice(currentIndex, 1)
        logs.splice(newIndex, 0, movedLog)
        return { ...s, logs }
      }
      return s
    })
  }

  function save() {
    if (date === null) return
    if (isNew) {
      saveNewLog!({ date, content })
    } else {
      $data = $data.map((s: Student) => {
        if (s.name === decodeURIComponent($page.params.name)) {
          return {
            ...s,
            logs: s.logs.map((l) => (l.id === log.id ? { ...l, date: date!, content } : l))
          }
        }
        return s
      })
      editing = false
      editorExpanded = false
    }
  }

  // 취소
  function cancel() {
    if (isNew) {
      cancelNewLog!()
    } else {
      date = log.date ?? new Date()
      content = log.content
      editing = false
      editorExpanded = false
    }
  }

  // 내용 복사
  let copied = $state(false)
  const handleCopy = useCopyFeedback((isCopied) => (copied = isCopied))

  // (터치 기기) 액션 버튼 펼침
  let actionButtonExpanded = $state(false)
</script>

<svelte:window onbeforeunload={(e) => editing && e.preventDefault()} />

<div
  class="group flex w-full flex-col gap-1 rounded-xl duration-150 hover:bg-stone-50 dark:hover:bg-stone-900"
  class:hover:bg-transparent={editing}
  class:dark:hover:bg-transparent={editing}
  class:opacity-50={dragged}
  draggable={!editing}
  {ondragstart}
  {ondragend}
  role="listitem"
>
  <div class="mt-2 flex items-center justify-between" class:pl-3={!editing} class:pr-2={!editing}>
    <!-- 날짜 -->
    <div class="flex items-center gap-2">
      {#if editing}
        <div class="relative">
          <button
            bind:this={datePickerButton}
            class="flex items-center gap-2 rounded-lg bg-stone-100 px-2 py-1 outline-none duration-150 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800"
            class:ring-2={!date}
            class:ring-red-500={!date}
            onclick={() => (datePickerOpen = !datePickerOpen)}
          >
            <CalendarToday class="h-5 w-5" />
            <span>
              {date
                ? date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
                : '날짜 선택'}
            </span>
          </button>
          <DatePicker
            show={datePickerOpen}
            {date}
            button={datePickerButton}
            closeMenu={() => (datePickerOpen = false)}
            onSelect={(newDate) => {
              date = newDate
              datePickerOpen = false
            }}
            class="mt-1"
          />
        </div>
      {:else}
        <span class="text-stone-500">
          {log.date
            ? log.date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
            : '올바르지 않은 날짜'}
        </span>
      {/if}
    </div>

    <!-- 액션 버튼 -->
    <div
      class="flex justify-end text-stone-500"
      use:onClickOutside={{ callback: () => (actionButtonExpanded = false) }}
    >
      <div
        class="flex items-center active:text-stone-600 dark:text-stone-400 dark:active:text-stone-300"
      >
        {#if !editing && !confirmingDelete}
          <div
            class="flex items-center opacity-0 duration-150 group-hover:opacity-100"
            class:opacity-100={editing}
            class:touch:opacity-100={actionButtonExpanded}
            class:touch:scale-75={!actionButtonExpanded && !editing && !confirmingDelete}
            class:touch:delay-[150ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 100, easing: expoOut }}
          >
            <IconButton
              Icon={copied ? Check : ContentCopy}
              text={navigator.clipboard ? (copied ? '복사됨' : undefined) : '복사 지원 안 됨'}
              onclick={() => {
                if (!navigator.clipboard) return
                navigator.clipboard.writeText(log.content)
                handleCopy()
              }}
              disabled={!navigator.clipboard}
            />
          </div>
        {/if}
        {#if editing}
          <div
            class="flex items-center opacity-0 duration-150 group-hover:opacity-100"
            class:opacity-100={editing}
            class:touch:opacity-100={actionButtonExpanded}
            class:touch:scale-75={!actionButtonExpanded && !editing && !confirmingDelete}
            class:touch:delay-[125ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 150, easing: expoOut }}
          >
            <IconButton Icon={Close} text="취소" onclick={cancel} />
            <div class="hidden md:block">
              <IconButton Icon={Expand} text="크게 보기" onclick={() => (editorExpanded = true)} />
            </div>
          </div>
        {/if}
        {#if !confirmingDelete}
          <div
            class="opacity-0 duration-150 group-hover:opacity-100"
            class:opacity-100={editing}
            class:touch:opacity-100={actionButtonExpanded}
            class:touch:scale-75={!actionButtonExpanded && !editing && !confirmingDelete}
            class:touch:delay-[100ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 200, easing: expoOut }}
          >
            <IconButton
              Icon={editing ? Check : Edit}
              text={editing ? '저장' : undefined}
              onclick={() => {
                if (editing) save()
                else editing = true
              }}
              disabled={editing && (!content.trim() || !date)}
            />
          </div>
        {/if}
        {#if !editing && !confirmingDelete}
          <div
            class="opacity-0 duration-150 pointer:hidden"
            class:opacity-100={actionButtonExpanded}
            class:scale-75={!actionButtonExpanded}
            class:delay-[75ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 150, easing: expoOut }}
          >
            <IconButton Icon={ArrowUpward} onclick={() => moveLog(-1)} />
          </div>
          <div
            class="opacity-0 duration-150 pointer:hidden"
            class:opacity-100={actionButtonExpanded}
            class:scale-75={!actionButtonExpanded}
            class:delay-[50ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 150, easing: expoOut }}
          >
            <IconButton Icon={ArrowDownward} onclick={() => moveLog(1)} />
          </div>
        {/if}
        {#if !editing}
          <div
            class="opacity-0 duration-150 group-hover:opacity-100"
            class:opacity-100={editing}
            class:touch:opacity-100={actionButtonExpanded}
            class:touch:scale-75={!actionButtonExpanded && !editing && !confirmingDelete}
            class:touch:delay-[25ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 250, easing: expoOut }}
          >
            <IconButton
              Icon={Delete}
              text={confirmingDelete ? '삭제' : undefined}
              onclick={() => {
                if (confirmingDelete) deleteLog!()
                else confirmingDelete = true
              }}
            />
          </div>
        {/if}
        {#if confirmingDelete}
          <div
            class="opacity-0 duration-150 group-hover:opacity-100"
            class:opacity-100={editing}
            class:touch:opacity-100={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 300, easing: expoOut }}
          >
            <IconButton Icon={Close} text="취소" onclick={() => (confirmingDelete = false)} />
          </div>
        {/if}
      </div>
      {#if !editing && !confirmingDelete}
        <div class="flex items-center gap-2 pointer:hidden">
          <IconButton
            Icon={actionButtonExpanded ? ChevronRight : MoreHoriz}
            onclick={() => (actionButtonExpanded = !actionButtonExpanded)}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- 내용 -->
  {#if editing}
    <textarea
      class="w-full resize-none rounded-lg bg-stone-100 p-3 outline-none duration-150 dark:bg-stone-900"
      bind:value={content}
      use:autosize
      use:focusOnElement
      onkeydown={(e) => {
        if (e.key === 'Enter' && e.metaKey && content.trim()) save()
        else if (e.key === 'Escape') cancel()
      }}
    ></textarea>
  {:else}
    <p class="m-3 mt-0 whitespace-pre-wrap font-sans">{log.content}</p>
  {/if}
</div>

<EditorPanel
  show={editorExpanded}
  title={isNew ? '새 기록' : '기록 편집'}
  {content}
  {date}
  close={cancel}
  minimizeEditor={() => (editorExpanded = false)}
  save={(newContent, newDate) => {
    content = newContent
    date = newDate
    save()
  }}
/>
