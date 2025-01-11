<script lang="ts">
  import { beforeNavigate } from '$app/navigation'
  import { slide } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import autosize from 'svelte-autosize'
  import { focusOnElement } from '$lib/utils/focus'
  import { onClickOutside } from '$lib/utils/clickOutside'
  import { useCopyFeedback } from '$lib/utils/copyFeedback'
  import { page } from '$app/stores'

  import IconButton from './IconButton.svelte'
  import EditorPanel from './EditorPanel.svelte'

  import ContentCopy from '~icons/material-symbols/content-copy-rounded'
  import Edit from '~icons/material-symbols/edit-rounded'
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
    log: { date: Date | null; content: string }
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

  function save() {
    if (date === null) return
    if (isNew) {
      saveNewLog!({ date, content })
    } else {
      log.date = date
      log.content = content
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
          <input
            type="date"
            value={date?.toISOString().slice(0, 10)}
            class="rounded-lg bg-stone-100 px-2 py-1 outline-none duration-150 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
            class:ring-2={!date}
            class:ring-red-500={!date}
            oninput={(e) => (date = e.currentTarget.value ? new Date(e.currentTarget.value) : null)}
          />
          {#if navigator.userAgent.includes('Chrome')}
            <CalendarToday class="absolute right-2 top-1/2 z-0 h-5 w-5 -translate-y-1/2" />
          {/if}
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
            class:touch:delay-[100ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 100, easing: expoOut }}
          >
            <IconButton
              Icon={copied ? Check : ContentCopy}
              text={navigator.clipboard ? (copied ? '복사됨' : undefined) : '복사 지원 안 됨'}
              tooltip="내용 복사"
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
            class:touch:delay-[75ms]={actionButtonExpanded}
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
            class:touch:delay-[50ms]={actionButtonExpanded}
            transition:slide={{ axis: 'x', duration: 200, easing: expoOut }}
          >
            <IconButton
              Icon={editing ? Check : Edit}
              text={editing ? '저장' : undefined}
              tooltip={!editing ? '편집' : undefined}
              onclick={() => {
                if (editing) save()
                else editing = true
              }}
              disabled={editing && (!content.trim() || !date)}
            />
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
              tooltip="삭제"
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

{#if editorExpanded}
  <EditorPanel
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
{/if}
